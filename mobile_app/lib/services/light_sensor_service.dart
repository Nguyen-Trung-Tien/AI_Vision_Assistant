import 'dart:async';
import 'package:camera/camera.dart';
import 'package:flutter/foundation.dart';
import 'package:mobile_app/services/accessibility_manager.dart';
import 'package:mobile_app/services/settings_service.dart';

/// Service phát hiện ánh sáng yếu từ camera exposure.
class LightSensorService {
  final AccessibilityManager _accessibility = AccessibilityManager();
  final SettingsService _settings = SettingsService();

  bool _isLowLight = false;
  bool get isLowLight => _isLowLight;

  bool _hasWarned = false;
  Timer? _checkTimer;

  /// Callback khi trạng thái ánh sáng thay đổi
  Function(bool isLowLight)? onLightChanged;

  /// Bắt đầu theo dõi ánh sáng từ camera controller
  void startMonitoring(CameraController controller) {
    _checkTimer?.cancel();
    _checkTimer = Timer.periodic(const Duration(seconds: 3), (_) {
      _checkExposure(controller);
    });
  }

  void _checkExposure(CameraController controller) {
    if (!controller.value.isInitialized) return;

    try {
      _evaluateBrightness(controller);
    } catch (e) {
      debugPrint('Light sensor error: $e');
    }
  }

  Future<void> _evaluateBrightness(CameraController controller) async {
    try {
      // Chụp ảnh nhanh để đánh giá brightness
      final image = await controller.takePicture();
      final bytes = await image.readAsBytes();

      // Heuristic: file size nhỏ = ảnh tối (ít detail = nén tốt hơn)
      // Threshold được đọc từ settings (cho phép người dùng tùy chỉnh)
      final fileSizeKB = bytes.length / 1024;
      final threshold = _settings.lightThresholdKB; // #13: đọc từ settings
      final wasLowLight = _isLowLight;

      if (fileSizeKB < threshold) {
        _isLowLight = true;
      } else {
        _isLowLight = false;
        _hasWarned = false;
      }

      debugPrint(
        '[LightSensor] fileSize=${fileSizeKB.toStringAsFixed(1)}KB, threshold=${threshold}KB, lowLight=$_isLowLight',
      );

      if (_isLowLight != wasLowLight) {
        onLightChanged?.call(_isLowLight);
      }

      if (_isLowLight && !_hasWarned) {
        _hasWarned = true;
        _accessibility.speak('Ánh sáng yếu. Đã tự động bật đèn flash.');
        _accessibility.triggerWarningVibration();
      }
    } catch (e) {
      debugPrint('Brightness evaluation error: $e');
    }
  }

  void stop() {
    _checkTimer?.cancel();
    _isLowLight = false;
    _hasWarned = false;
  }
}
