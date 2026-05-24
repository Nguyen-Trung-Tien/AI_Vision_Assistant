import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:mobile_app/services/accessibility_manager.dart';
import 'package:mobile_app/services/history_service.dart';
import 'package:mobile_app/services/settings_service.dart';
import 'package:mobile_app/services/websocket_service.dart';
import 'package:mobile_app/l10n/app_localizations.dart';

typedef ProcessingStateCallback = void Function(bool isProcessing);
typedef DangerAlertCallback = void Function(String message, String level);
typedef AIResultCallback = void Function(Map<String, dynamic> result);

class EdgeAIService {
  final WebSocketService _wsService;
  final AccessibilityManager _accessibilityManager = AccessibilityManager();
  final HistoryService _historyService = HistoryService();
  final Future<Uint8List?> Function() _captureFrame;

  bool _isRunning = false;
  bool _isProcessing = false;
  bool get isProcessing => _isProcessing;

  String? _lastSpokenText;
  DateTime _lastSpokenTime = DateTime.now().subtract(
    const Duration(seconds: 10),
  );

  DateTime _lastDangerSpeechTime = DateTime.fromMillisecondsSinceEpoch(0);
  String _lastDangerSpeechMessage = '';

  ProcessingStateCallback? onProcessingStateChanged;
  DangerAlertCallback? onDangerAlertDetected;
  AIResultCallback? onAIResultReceived;

  Uint8List? _lastFrameForFeedback;
  Uint8List? get lastFrameForFeedback => _lastFrameForFeedback;

  Position? _cachedPosition;
  DateTime? _lastLocationFetchTime;

  // Cancelable timeout — prevents "hết thời gian" firing after result arrives
  Timer? _resultTimeoutTimer;

  // Result timeout — 25s to accommodate slow Gemini/LAYOUT tasks
  static const Duration _resultTimeout = Duration(seconds: 25);

  EdgeAIService(this._wsService, this._captureFrame) {
    _wsService.onDangerAlert = (data) {
      final distance = ((data['distance'] as num?) ?? 2.0).toDouble();
      final message = data['message']?.toString() ?? 'Stop immediately!';
      final level = data['level']?.toString() ?? 'HIGH';

      _accessibilityManager.triggerDangerVibration(distance);

      final now = DateTime.now();
      if (message != _lastDangerSpeechMessage ||
          now.difference(_lastDangerSpeechTime).inMilliseconds > 2000) {
        _lastDangerSpeechTime = now;
        _lastDangerSpeechMessage = message;
        // Danger alerts always interrupt — fire-and-forget
        _accessibilityManager.speak(message, interrupt: true);
      }

      onDangerAlertDetected?.call(message, level);
    };

    _wsService.onAIResult = (data) {
      // Cancel timeout immediately — result arrived in time
      _resultTimeoutTimer?.cancel();
      _resultTimeoutTimer = null;

      onAIResultReceived?.call(data);

      final text = data['text']?.toString() ?? '';
      final isStable = data['stable'] == true;
      final dangerAlerts =
          (data['danger_alerts'] as List<dynamic>? ?? const []);
      final taskType = data['taskType']?.toString() ??
          data['task_type']?.toString() ??
          'detection';

      // Only notify if state actually changes — avoids redundant setState
      _setProcessingIfChanged(false);

      if ((taskType == 'FACE_RECOGNITION' || taskType == 'FACE') &&
          text.isEmpty) {
        final lang = SettingsService().language;
        _accessibilityManager.speak(
          AppLocalizations.t('ai_face_no_match', lang),
        );
        return;
      }

      // Haptic — fire-and-forget, non-blocking
      _accessibilityManager.triggerSuccessVibration();

      // Voice feedback logic
      final now = DateTime.now();
      final timeSinceLastSpeakMs =
          now.difference(_lastSpokenTime).inMilliseconds;

      // Skip AI text when continuous mode already has danger alerts speaking
      final shouldSkipSpeechForContinuousDanger =
          taskType == 'CONTINUOUS' && dangerAlerts.isNotEmpty;

      if (!shouldSkipSpeechForContinuousDanger &&
          text.isNotEmpty &&
          (taskType != 'CONTINUOUS' || !_isSimilarToLast(text))) {
        // Continuous mode: require 2s gap to avoid TTS spam; other modes: 1s
        final minGapMs = taskType == 'CONTINUOUS' ? 2000 : 1000;
        if (isStable || timeSinceLastSpeakMs >= minGapMs) {
          _accessibilityManager.speak(text);
          _lastSpokenText = text;
          _lastSpokenTime = now;

          // Save to history
          final historyType = taskType == 'CAPTION'
              ? 'caption'
              : taskType == 'OCR'
                  ? 'money'
                  : taskType == 'TEXT_OCR'
                      ? 'text'
                      : taskType == 'LAYOUT_ANALYSIS'
                          ? 'text'
                          : 'detection';
          _historyService.addEntry(historyType, text);
        }
      }
    };

    _wsService.onStreamAck = (data) {
      final status = data['status']?.toString();
      if (status == 'throttled') {
        _setProcessingIfChanged(false);
        final lang = SettingsService().language;
        _accessibilityManager.speak(AppLocalizations.t('ai_throttled', lang));
      }
    };
  }

  /// Only triggers callback when state actually changes — avoids redundant setState.
  void _setProcessingIfChanged(bool value) {
    if (_isProcessing == value) return;
    _isProcessing = value;
    // Cancel pending timeout when processing is cleared externally
    if (!value) {
      _resultTimeoutTimer?.cancel();
      _resultTimeoutTimer = null;
    }
    onProcessingStateChanged?.call(value);
  }

  /// Simple similarity check: skip if new text shares >75% chars with last spoken.
  /// Prevents re-reading near-identical consecutive results.
  bool _isSimilarToLast(String text) {
    final last = _lastSpokenText;
    if (last == null || last.isEmpty) return false;
    if (text == last) return true;

    // Quick length gate — very different lengths can't be similar
    final ratio = text.length / last.length;
    if (ratio < 0.5 || ratio > 2.0) return false;

    // Count matching chars in shorter string (lightweight similarity)
    final shorter = text.length <= last.length ? text : last;
    final longer = text.length > last.length ? text : last;
    var matches = 0;
    for (var i = 0; i < shorter.length; i++) {
      if (longer.contains(shorter[i])) matches++;
    }
    return matches / shorter.length > 0.75;
  }

  void start() => _isRunning = true;
  void stop() => _isRunning = false;

  void requestMoneyDetection() {
    final lang = SettingsService().language;
    _accessibilityManager.triggerSuccessVibration();
    _accessibilityManager.speak(AppLocalizations.t('ai_detecting', lang));
    _setProcessingIfChanged(true);
    _sendFrameFromCamera(taskType: 'OCR');
  }

  void requestCaptioning() {
    final lang = SettingsService().language;
    _accessibilityManager.triggerSuccessVibration();
    _accessibilityManager.speak(AppLocalizations.t('ai_describing', lang));
    _setProcessingIfChanged(true);
    _sendFrameFromCamera(taskType: 'CAPTION');
  }

  /// Mode 1: Online OCR — gửi frame lên server để đọc văn bản.
  void requestOnlineOCR() {
    final lang = SettingsService().language;
    _accessibilityManager.triggerSuccessVibration();
    _accessibilityManager.speak(AppLocalizations.t('ai_online_reading', lang));
    _setProcessingIfChanged(true);
    _sendFrameFromCamera(taskType: 'TEXT_OCR');
  }

  void requestSmartOCR(String subMode) {
    final lang = SettingsService().language;
    _accessibilityManager.triggerSuccessVibration();
    _accessibilityManager.speak(AppLocalizations.t('ai_online_reading', lang));
    _setProcessingIfChanged(true);
    _sendFrameFromCamera(taskType: 'SMART_OCR', subMode: subMode);
  }

  void requestFaceRecognition() {
    final lang = SettingsService().language;
    _accessibilityManager.triggerSuccessVibration();
    _accessibilityManager.speak(
      lang == 'vi' ? 'Đang nhận diện khuôn mặt...' : 'Recognizing faces...',
    );
    _setProcessingIfChanged(true);
    _sendFrameFromCamera(taskType: 'FACE_RECOGNITION');
  }

  void requestLayoutAnalysis() {
    final lang = SettingsService().language;
    _accessibilityManager.triggerSuccessVibration();
    _accessibilityManager.speak(
      lang == 'vi' ? 'Đang phân tích bố cục...' : 'Analyzing layout...',
    );
    _setProcessingIfChanged(true);
    _sendFrameFromCamera(taskType: 'LAYOUT_ANALYSIS');
  }

  Future<void> _sendFrameFromCamera({
    String? taskType,
    String? subMode,
  }) async {
    if (!_isRunning) {
      _setProcessingIfChanged(false);
      return;
    }

    final settings = SettingsService();
    if (!_wsService.isConnected) {
      _setProcessingIfChanged(false);
      _accessibilityManager.speak(
        AppLocalizations.t('main_offline', settings.language),
        interrupt: true,
      );
      _accessibilityManager.triggerErrorVibration();
      return;
    }

    final bytes = await _captureFrame();
    if (bytes == null || bytes.isEmpty) {
      _setProcessingIfChanged(false);
      _accessibilityManager.speak(
        AppLocalizations.t('main_no_capture', settings.language),
      );
      _accessibilityManager.triggerErrorVibration();
      return;
    }
    _lastFrameForFeedback = bytes;

    final base64Frame = base64Encode(bytes);
    Position? position;
    try {
      position = await _getCurrentLocation();
    } catch (e) {
      debugPrint('[EdgeAI] Location fetch failed: $e');
    }

    _wsService.sendFrame(
      base64Frame,
      taskType: taskType,
      lang: settings.language,
      warningDistanceM: settings.warningDistance,
      latitude: position?.latitude,
      longitude: position?.longitude,
      subMode: subMode,
    );

    // Cancelable timeout — cancels if result arrives first
    _resultTimeoutTimer?.cancel();
    _resultTimeoutTimer = Timer(_resultTimeout, () {
      if (_isProcessing) {
        _setProcessingIfChanged(false);
        _accessibilityManager.speak(
          AppLocalizations.t('ai_timeout', settings.language),
        );
      }
    });
  }

  Future<Position?> _getCurrentLocation() async {
    try {
      final now = DateTime.now();
      if (_cachedPosition != null &&
          _lastLocationFetchTime != null &&
          now.difference(_lastLocationFetchTime!).inSeconds < 30) {
        return _cachedPosition;
      }

      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        return _cachedPosition;
      }

      final lastKnown = await Geolocator.getLastKnownPosition();
      if (lastKnown != null) {
        _cachedPosition = lastKnown;
        _lastLocationFetchTime = now;
        _updateLocationInBackground();
        return lastKnown;
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.low,
        ),
      ).timeout(const Duration(milliseconds: 500));

      _cachedPosition = position;
      _lastLocationFetchTime = now;
      return position;
    } catch (_) {
      return _cachedPosition;
    }
  }

  void _updateLocationInBackground() async {
    try {
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.low,
        ),
      ).timeout(const Duration(seconds: 2));
      _cachedPosition = position;
      _lastLocationFetchTime = DateTime.now();
    } catch (_) {}
  }
}
