import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:mobile_app/services/accessibility_manager.dart';
import 'package:mobile_app/services/history_service.dart';
import 'package:mobile_app/services/settings_service.dart';
import 'package:mobile_app/services/websocket_service.dart';
import 'package:mobile_app/l10n/app_localizations.dart';

/// Callback khi trạng thái xử lý thay đổi (loading/done).
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

  /// Callback cho UI biết trạng thái loading
  ProcessingStateCallback? onProcessingStateChanged;

  /// Callback khi có cảnh báo nguy hiểm
  DangerAlertCallback? onDangerAlertDetected;
  AIResultCallback? onAIResultReceived;

  Uint8List? _lastFrameForFeedback;
  Uint8List? get lastFrameForFeedback => _lastFrameForFeedback;

  EdgeAIService(this._wsService, this._captureFrame) {
    _wsService.onDangerAlert = (data) {
      final distance = ((data['distance'] as num?) ?? 2.0).toDouble();
      final message = data['message']?.toString() ?? 'Stop immediately!';
      final level = data['level']?.toString() ?? 'HIGH';

      _accessibilityManager.triggerDangerVibration(distance);
      _accessibilityManager.speak(message);

      onDangerAlertDetected?.call(message, level);
    };

    _wsService.onAIResult = (data) {
      onAIResultReceived?.call(data);

      final text = data['text']?.toString() ?? '';
      final isStable = data['stable'] == true;
      final taskType =
          data['taskType']?.toString() ??
          data['task_type']?.toString() ??
          'detection';

      // Kết thúc trạng thái loading
      _setProcessing(false);

      // Haptic feedback for every detection
      _accessibilityManager.triggerSuccessVibration();

      // Voice feedback logic
      final now = DateTime.now();
      final timeSinceLastSpeakMs = now
          .difference(_lastSpokenTime)
          .inMilliseconds;

      if (text.isNotEmpty && text != _lastSpokenText) {
        if (isStable || timeSinceLastSpeakMs >= 1500) {
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
              : 'detection';
          _historyService.addEntry(historyType, text);
        }
      }
    };

    _wsService.onStreamAck = (data) {
      final status = data['status']?.toString();
      if (status == 'throttled') {
        _setProcessing(false);
        final lang = SettingsService().language;
        _accessibilityManager.speak(AppLocalizations.t('ai_throttled', lang));
      }
    };
  }

  void _setProcessing(bool value) {
    _isProcessing = value;
    onProcessingStateChanged?.call(value);
  }

  void start() {
    _isRunning = true;
  }

  void stop() {
    _isRunning = false;
  }

  void requestMoneyDetection() {
    final lang = SettingsService().language;
    _accessibilityManager.triggerSuccessVibration();
    _accessibilityManager.speak(AppLocalizations.t('ai_detecting', lang));
    _setProcessing(true);
    _sendFrameFromCamera(taskType: 'OCR');
  }

  void requestCaptioning() {
    final lang = SettingsService().language;
    _accessibilityManager.triggerSuccessVibration();
    _accessibilityManager.speak(AppLocalizations.t('ai_describing', lang));
    _setProcessing(true);
    _sendFrameFromCamera(taskType: 'CAPTION');
  }

  /// Mode 1: Online OCR — gửi frame lên server để đọc văn bản
  void requestOnlineOCR() {
    final lang = SettingsService().language;
    _accessibilityManager.triggerSuccessVibration();
    _accessibilityManager.speak(AppLocalizations.t('ai_online_reading', lang));
    _setProcessing(true);
    _sendFrameFromCamera(taskType: 'TEXT_OCR');
  }

  Future<void> _sendFrameFromCamera({String? taskType}) async {
    if (!_isRunning) {
      _setProcessing(false);
      return;
    }

    final settings = SettingsService();
    if (!_wsService.isConnected) {
      _setProcessing(false);
      _accessibilityManager.speak(
        AppLocalizations.t('main_offline', settings.language),
      );
      _accessibilityManager.triggerErrorVibration();
      return;
    }

    final bytes = await _captureFrame();
    if (bytes == null || bytes.isEmpty) {
      _setProcessing(false);
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
      position = null;
    }

    _wsService.sendFrame(
      base64Frame,
      taskType: taskType,
      lang: settings.language,
      warningDistanceM: settings.warningDistance,
      latitude: position?.latitude,
      longitude: position?.longitude,
    );

    // Timeout: auto-reset processing state after 15 seconds
    Future.delayed(const Duration(seconds: 15), () {
      if (_isProcessing) {
        _setProcessing(false);
        _accessibilityManager.speak(
          AppLocalizations.t('ai_timeout', settings.language),
        );
      }
    });
  }

  Future<Position?> _getCurrentLocation() async {
    try {
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        return null;
      }
      return Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.bestForNavigation,
        ),
      ).timeout(const Duration(seconds: 2));
    } catch (_) {
      return null;
    }
  }
}
