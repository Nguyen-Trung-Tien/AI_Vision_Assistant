import 'dart:async';
import 'package:camera/camera.dart';
import 'package:flutter/foundation.dart';
import 'package:mobile_app/services/accessibility_manager.dart';
import 'package:mobile_app/services/settings_service.dart';

/// Detect low light from periodic camera probe captures.
///
/// Important: this service must avoid competing with other capture flows.
class LightSensorService {
  final AccessibilityManager _accessibility = AccessibilityManager();
  final SettingsService _settings = SettingsService();

  bool _isLowLight = false;
  bool get isLowLight => _isLowLight;

  bool _hasWarned = false;
  Timer? _checkTimer;
  bool _isEvaluating = false;
  DateTime _lastProbeAt = DateTime.fromMillisecondsSinceEpoch(0);
  DateTime _nextAllowedProbeAt = DateTime.fromMillisecondsSinceEpoch(0);
  DateTime _lastErrorLogAt = DateTime.fromMillisecondsSinceEpoch(0);

  /// Callback when low-light state changes.
  Function(bool isLowLight)? onLightChanged;

  /// Start monitoring brightness from [controller].
  void startMonitoring(CameraController controller) {
    _checkTimer?.cancel();
    _checkTimer = Timer.periodic(const Duration(seconds: 3), (_) async {
      await _checkExposure(controller);
    });
  }

  Future<void> _checkExposure(CameraController controller) async {
    if (!controller.value.isInitialized) return;
    if (_isEvaluating) return;
    if (DateTime.now().isBefore(_nextAllowedProbeAt)) return;

    // Do not probe while picture/video stream is busy.
    if (controller.value.isTakingPicture ||
        controller.value.isStreamingImages) {
      return;
    }

    // Keep a conservative gap to reduce capture contention.
    if (DateTime.now().difference(_lastProbeAt).inSeconds < 8) return;

    _isEvaluating = true;
    _lastProbeAt = DateTime.now();
    try {
      await _evaluateBrightness(controller);
    } catch (e) {
      debugPrint('Light sensor error: $e');
    } finally {
      _isEvaluating = false;
    }
  }

  Future<void> _evaluateBrightness(CameraController controller) async {
    try {
      final image = await controller.takePicture().timeout(
            const Duration(seconds: 2),
          );
      final bytes = await image.readAsBytes();

      // Heuristic: smaller JPEG size often means darker/less-detailed frame.
      final fileSizeKB = bytes.length / 1024;
      final threshold = _settings.lightThresholdKB;
      final wasLowLight = _isLowLight;

      if (fileSizeKB < threshold) {
        _isLowLight = true;
      } else {
        _isLowLight = false;
        _hasWarned = false;
      }

      debugPrint(
        '[LightSensor] fileSize=${fileSizeKB.toStringAsFixed(1)}KB, '
        'threshold=${threshold}KB, lowLight=$_isLowLight',
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
      // CameraX may reject capture if another request is in-flight.
      // Back off to avoid noisy retries/spam logs.
      _nextAllowedProbeAt = DateTime.now().add(const Duration(seconds: 15));
      if (DateTime.now().difference(_lastErrorLogAt).inSeconds >= 20) {
        _lastErrorLogAt = DateTime.now();
        debugPrint('Brightness evaluation error (throttled): $e');
      }
    }
  }

  void stop() {
    _checkTimer?.cancel();
    _isLowLight = false;
    _hasWarned = false;
    _isEvaluating = false;
  }
}
