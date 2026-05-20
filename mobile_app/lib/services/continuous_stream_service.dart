import 'dart:async';
import 'dart:convert';
import 'package:battery_plus/battery_plus.dart';
import 'package:camera/camera.dart';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:mobile_app/services/settings_service.dart';
import 'package:mobile_app/services/websocket_service.dart';
import 'package:mobile_app/services/ml_kit_service.dart';
import 'package:mobile_app/utils/image_utils.dart';
import 'package:path_provider/path_provider.dart';
import 'dart:io';

class ContinuousStreamService {
  final WebSocketService _wsService;
  final void Function(int fps)? onFpsChanged;
  final VoidCallback? onLowBatteryFpsActivated;

  bool _isStreaming = false;
  final Battery _battery = Battery();
  Uint8List? _lastFrame;
  Timer? _streamTimer;
  CameraImage? _latestCameraImage;
  int _currentFps = 1;
  bool _isProcessingFrame = false;
  bool _awaitingResult = false;
  bool _hasLowBatteryAnnouncement = false;
  bool _isFrontCamera = false;
  String? _subMode;
  int _frameSeq = 0;
  int? _inFlightFrameSeq;
  DateTime? _inFlightSentAt;
  int _backendFpsCap = 5;
  int _fastResponseStreak = 0;

  Position? _lastPosition;
  DateTime _lastPositionTime = DateTime.fromMillisecondsSinceEpoch(0);
  DateTime _lastMotionTime = DateTime.now();
  DateTime _awaitingSince = DateTime.fromMillisecondsSinceEpoch(0);

  final MlKitService _mlKitService = MlKitService();
  DateTime _lastFaceRecognitionTime = DateTime.fromMillisecondsSinceEpoch(0);
  bool _faceDetectionInFlight = false;

  ContinuousStreamService(
    this._wsService, {
    this.onFpsChanged,
    this.onLowBatteryFpsActivated,
  });

  bool get isStreaming => _isStreaming;
  int get currentFps => _currentFps;

  void onLatestCameraImage(CameraImage image) {
    _latestCameraImage = image;
  }

  void onFrameResultReceived({required String taskType, int? frameSeq}) {
    if (taskType != 'CONTINUOUS') return;
    _awaitingResult = false;
    if (frameSeq != null &&
        _inFlightFrameSeq != null &&
        frameSeq != _inFlightFrameSeq) {
      return;
    }

    final sentAt = _inFlightSentAt;
    _inFlightFrameSeq = null;
    _inFlightSentAt = null;
    if (sentAt == null) return;

    final latencyMs = DateTime.now().difference(sentAt).inMilliseconds;
    _adaptToBackendLatency(latencyMs);
  }

  void start({bool isFrontCamera = false, String? subMode}) {
    if (_isStreaming) return;
    _isStreaming = true;
    _awaitingResult = false;
    _latestCameraImage = null;
    _frameSeq = 0;
    _inFlightFrameSeq = null;
    _inFlightSentAt = null;
    _lastMotionTime = DateTime.now();
    _backendFpsCap = 5;
    _fastResponseStreak = 0;
    _isFrontCamera = isFrontCamera;
    _subMode = subMode;
    _setCurrentFps(1);
    _startTimer();
  }

  void updateCameraState({bool? isFrontCamera, String? subMode}) {
    if (isFrontCamera != null) _isFrontCamera = isFrontCamera;
    _subMode = subMode;
  }

  void stop() {
    _isStreaming = false;
    _streamTimer?.cancel();
    _streamTimer = null;
    _awaitingResult = false;
    _inFlightFrameSeq = null;
    _inFlightSentAt = null;
  }

  void _startTimer() {
    _streamTimer?.cancel();
    final intervalMs = (1000 / _currentFps).round();
    _streamTimer = Timer(Duration(milliseconds: intervalMs), _streamLoop);
  }

  Future<void> _streamLoop() async {
    if (!_isStreaming) return;

    if (_awaitingResult &&
        DateTime.now().difference(_awaitingSince).inMilliseconds > 1500) {
      _awaitingResult = false;
      _adaptToBackendLatency(1600);
      _inFlightFrameSeq = null;
      _inFlightSentAt = null;
    }

    if (!_isProcessingFrame && !_awaitingResult && _wsService.isConnected) {
      _isProcessingFrame = true;
      try {
        await _processNextFrame();
      } catch (e) {
        debugPrint('[ContinuousStream] Error: $e');
      } finally {
        _isProcessingFrame = false;
      }
    }

    await _updateFpsBasedOnMotion();
    _startTimer();
  }

  Future<void> _processNextFrame() async {
    final image = _latestCameraImage;
    if (image == null) return;
    _latestCameraImage = null;

    final imageData = <String, dynamic>{
      'width': image.width,
      'height': image.height,
      'formatGroup': image.format.group == ImageFormatGroup.yuv420 ? 0 : 1,
      'planes': image.planes
          .map(
            (p) => {
              'bytes': Uint8List.fromList(p.bytes),
              'bytesPerRow': p.bytesPerRow,
              'bytesPerPixel': p.bytesPerPixel,
            },
          )
          .toList(),
    };

    final bytes = await compute(ImageUtils.convertMapToJpeg, imageData);
    if (bytes == null || bytes.isEmpty) return;

    if (_lastFrame != null && _isSimilar(bytes, _lastFrame!)) {
      return;
    }

    _lastFrame = bytes;
    _awaitingResult = true;
    _awaitingSince = DateTime.now();
    _frameSeq += 1;
    _inFlightFrameSeq = _frameSeq;
    _inFlightSentAt = _awaitingSince;

    final base64Frame = base64Encode(bytes);
    final settings = SettingsService();
    final posData = await _getCurrentLocationFast();

    _wsService.sendFrame(
      base64Frame,
      taskType: 'CONTINUOUS',
      lang: settings.language,
      warningDistanceM: settings.warningDistance,
      latitude: posData?.latitude,
      longitude: posData?.longitude,
      mode: 'continuous',
      priority: 1,
      frameSeq: _frameSeq,
      isFrontCamera: _isFrontCamera,
      subMode: _subMode,
    );

    // Optional: Face Recognition Interleaving
    _triggerFaceRecognitionIfNeeded(bytes);
  }

  Future<void> _triggerFaceRecognitionIfNeeded(Uint8List bytes) async {
    final settings = SettingsService();
    if (!settings.faceRecognitionEnabled || _faceDetectionInFlight) return;

    final now = DateTime.now();
    if (now.difference(_lastFaceRecognitionTime).inSeconds < 10) return;

    _faceDetectionInFlight = true;
    try {
      final tempDir = await getTemporaryDirectory();
      final tempFile = File('${tempDir.path}/face_recog_frame.jpg');
      await tempFile.writeAsBytes(bytes);

      final faces = await _mlKitService.detectFaces(tempFile.path);
      if (faces.isNotEmpty) {
        debugPrint(
          '[ContinuousStream] Face detected locally, sending for Recognition',
        );
        _lastFaceRecognitionTime = now;
        _wsService.sendFrame(
          base64Encode(bytes),
          taskType: 'FACE_RECOGNITION',
          lang: settings.language,
          mode: 'normal', // Higher priority, not continuous
          priority: 8,
          isFrontCamera: _isFrontCamera,
        );
      }
    } catch (e) {
      debugPrint('[ContinuousStream] Face detection error: $e');
    } finally {
      _faceDetectionInFlight = false;
    }
  }

  Future<void> _updateFpsBasedOnMotion() async {
    final now = DateTime.now();
    if (now.difference(_lastPositionTime).inSeconds < 1) return;

    final posData = await _getCurrentLocationFast();
    final batteryLevel = await _battery.batteryLevel;
    final settings = SettingsService();
    var nextFps = settings.fpsLimit.clamp(1, 5);

    if (posData != null && posData.speed >= 0.5) {
      _lastMotionTime = now;
    }

    final standingStill = now.difference(_lastMotionTime).inSeconds >= 5;
    if (standingStill) {
      nextFps = 1;
    }

    if (settings.autoFpsBatterySaving && batteryLevel < 20) {
      nextFps = nextFps > 2 ? 2 : nextFps;
      if (!_hasLowBatteryAnnouncement) {
        onLowBatteryFpsActivated?.call();
        _hasLowBatteryAnnouncement = true;
      }
    } else {
      _hasLowBatteryAnnouncement = false;
    }

    nextFps = nextFps > _backendFpsCap ? _backendFpsCap : nextFps;
    _setCurrentFps(nextFps);
  }

  void _adaptToBackendLatency(int latencyMs) {
    final settings = SettingsService();
    final maxAllowed = settings.fpsLimit.clamp(1, 5);

    if (latencyMs >= 1400) {
      _backendFpsCap = (_backendFpsCap - 1).clamp(1, maxAllowed);
      _fastResponseStreak = 0;
      return;
    }

    if (latencyMs <= 700) {
      _fastResponseStreak += 1;
      if (_fastResponseStreak >= 2) {
        _backendFpsCap = (_backendFpsCap + 1).clamp(1, maxAllowed);
        _fastResponseStreak = 0;
      }
      return;
    }

    _fastResponseStreak = 0;
  }

  void _setCurrentFps(int value) {
    if (_currentFps == value) return;
    _currentFps = value;
    onFpsChanged?.call(value);
  }

  Future<PosData?> _getCurrentLocationFast() async {
    try {
      final now = DateTime.now();
      // Cache position for 30 seconds to drastically improve stream rate and latency
      if (_lastPosition != null &&
          now.difference(_lastPositionTime).inSeconds < 30) {
        return PosData(
          latitude: _lastPosition!.latitude,
          longitude: _lastPosition!.longitude,
          speed: _lastPosition!.speed,
        );
      }

      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        if (_lastPosition != null) {
          return PosData(
            latitude: _lastPosition!.latitude,
            longitude: _lastPosition!.longitude,
            speed: _lastPosition!.speed,
          );
        }
        return null;
      }

      final lastKnown = await Geolocator.getLastKnownPosition();
      if (lastKnown != null) {
        _lastPosition = lastKnown;
        _lastPositionTime = now;
        _updateLocationInBackgroundFast();
        return PosData(
          latitude: lastKnown.latitude,
          longitude: lastKnown.longitude,
          speed: lastKnown.speed,
        );
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.low,
        ),
      ).timeout(const Duration(milliseconds: 500));

      _lastPosition = position;
      _lastPositionTime = now;

      return PosData(
        latitude: position.latitude,
        longitude: position.longitude,
        speed: position.speed,
      );
    } catch (_) {
      if (_lastPosition != null) {
        return PosData(
          latitude: _lastPosition!.latitude,
          longitude: _lastPosition!.longitude,
          speed: _lastPosition!.speed,
        );
      }
      return null;
    }
  }

  void _updateLocationInBackgroundFast() async {
    try {
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.low,
        ),
      ).timeout(const Duration(seconds: 2));
      _lastPosition = position;
      _lastPositionTime = DateTime.now();
    } catch (_) {}
  }
}

class PosData {
  final double latitude;
  final double longitude;
  final double speed;

  PosData({
    required this.latitude,
    required this.longitude,
    required this.speed,
  });
}

bool _isSimilar(Uint8List a, Uint8List b) {
  if (a.length != b.length) return false;

  var diffCount = 0;
  for (var i = 0; i < a.length; i += 100) {
    if ((a[i] - b[i]).abs() > 10) {
      diffCount++;
      if (diffCount > 10) return false;
    }
  }

  return true;
}
