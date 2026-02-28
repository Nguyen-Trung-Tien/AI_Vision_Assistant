import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:mobile_app/services/accessibility_manager.dart';
import 'package:mobile_app/services/history_service.dart';
import 'package:mobile_app/services/settings_service.dart';
import 'package:mobile_app/services/websocket_service.dart';

/// Callback khi trạng thái xử lý thay đổi (loading/done).
typedef ProcessingStateCallback = void Function(bool isProcessing);

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

  EdgeAIService(this._wsService, this._captureFrame) {
    _wsService.onDangerAlert = (data) {
      final distance = ((data['distance'] as num?) ?? 2.0).toDouble();
      _accessibilityManager.triggerDangerVibration(distance);
      _accessibilityManager.speak(
        data['message']?.toString() ?? 'Stop immediately!',
      );
    };

    _wsService.onAIResult = (data) {
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
      final timeSinceLastSpeak = now.difference(_lastSpokenTime).inSeconds;

      if (text.isNotEmpty && text != _lastSpokenText) {
        if (isStable || timeSinceLastSpeak >= 1.5) {
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
        _accessibilityManager.speak(
          'Khung hình gửi quá nhanh, vui lòng thử lại.',
        );
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
    _accessibilityManager.triggerSuccessVibration();
    _accessibilityManager.speak('Đang nhận diện...');
    _setProcessing(true);
    _sendFrameFromCamera(taskType: 'OCR');
  }

  void requestCaptioning() {
    _accessibilityManager.triggerSuccessVibration();
    _accessibilityManager.speak('Đang mô tả...');
    _setProcessing(true);
    _sendFrameFromCamera(taskType: 'CAPTION');
  }

  /// Mode 1: Online OCR — gửi frame lên server để đọc văn bản
  void requestOnlineOCR() {
    _accessibilityManager.triggerSuccessVibration();
    _accessibilityManager.speak('Đang gửi lên server để đọc...');
    _setProcessing(true);
    _sendFrameFromCamera(taskType: 'TEXT_OCR');
  }

  Future<void> _sendFrameFromCamera({String? taskType}) async {
    if (!_isRunning) {
      _setProcessing(false);
      return;
    }

    final bytes = await _captureFrame();
    if (bytes == null || bytes.isEmpty) {
      _setProcessing(false);
      return;
    }

    final base64Frame = base64Encode(bytes);
    final settings = SettingsService();

    _wsService.sendFrame(
      base64Frame,
      taskType: taskType,
      lang: settings.language,
      warningDistanceM: settings.warningDistance,
    );

    // Timeout: auto-reset processing state after 15 seconds
    Future.delayed(const Duration(seconds: 15), () {
      if (_isProcessing) {
        _setProcessing(false);
        _accessibilityManager.speak('Hết thời gian chờ phản hồi.');
      }
    });
  }
}
