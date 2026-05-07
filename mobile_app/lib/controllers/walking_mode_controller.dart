import 'dart:async';

import 'package:flutter/material.dart';
import 'package:mobile_app/controllers/main_controller.dart';
import 'package:mobile_app/services/settings_service.dart';
import 'package:mobile_app/utils/spatial_utils.dart';

/// Manages walking mode lifecycle: start/stop stream, overlay data parsing,
/// and spatial audio triggering.
class WalkingModeController {
  WalkingModeController({
    required this.ctrl,
    required this.pulseController,
    required this.onStateChanged,
  });

  final MainController ctrl;
  final AnimationController pulseController;
  final VoidCallback onStateChanged;

  SettingsService get _settings => ctrl.settings;

  Future<void> setWalkingMode(bool enabled, {bool announce = true}) async {
    if (ctrl.isWalkingModeEnabled == enabled) return;

    if (enabled) {
      if (!ctrl.isConnected) {
        if (announce) {
          ctrl.accessibilityManager.speak(
            _settings.language == 'vi'
                ? 'Chế độ đi bộ cần kết nối mạng.'
                : 'Walking mode requires an internet connection.',
          );
          ctrl.accessibilityManager.triggerErrorVibration();
        }
        return;
      }
      final streamStarted = await ctrl.startContinuousImageStream();
      if (!streamStarted) {
        if (announce) {
          ctrl.accessibilityManager.speak(
            _settings.language == 'vi'
                ? 'Không thể khởi động camera cho chế độ đi bộ.'
                : 'Could not start the camera stream for walking mode.',
          );
          ctrl.accessibilityManager.triggerErrorVibration();
        }
        return;
      }
      ctrl.continuousStreamService.start(
        isFrontCamera: ctrl.isFrontCamera,
        subMode: ctrl.currentModeIndex == 2 ? 'recognition' : null,
      );
      pulseController.repeat(reverse: true);
      ctrl.isWalkingModeEnabled = true;
      ctrl.walkingCurrentFps = ctrl.continuousStreamService.currentFps;
      ctrl.walkingNearestObstacle = '-';
      ctrl.walkingSafeDirection = '-';
      onStateChanged();

      if (announce) {
        ctrl.accessibilityManager.speak(
          _settings.language == 'vi'
              ? 'Đã bật chế độ đi bộ'
              : 'Walking mode enabled',
        );
      }
      return;
    }

    // Disable walking mode
    ctrl.continuousStreamService.stop();
    pulseController.stop();
    pulseController.reset();
    await ctrl.stopContinuousImageStream();
    ctrl.isWalkingModeEnabled = false;
    onStateChanged();

    if (announce) {
      ctrl.accessibilityManager.speak(
        _settings.language == 'vi'
            ? 'Đã tắt chế độ đi bộ'
            : 'Walking mode disabled',
      );
    }
  }

  void updateOverlayFromResult(Map<String, dynamic> result) {
    final dangerAlerts = (result['danger_alerts'] as List<dynamic>? ?? [])
        .whereType<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList();

    final rawDetections = (result['raw_detections'] as List<dynamic>? ?? [])
        .whereType<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList();

    final frameWidth = (result['frame_width'] as num?)?.toInt();
    final frameHeight = (result['frame_height'] as num?)?.toInt();

    var nearestObstacle = '-';
    var safeDirection = '-';
    String position = 'front';
    String label = '';
    double? distanceVal;

    if (dangerAlerts.isNotEmpty) {
      final nearest = dangerAlerts.first;
      label = nearest['label']?.toString() ?? '';
      final distance = nearest['distance']?.toString() ?? '';
      position = nearest['position']?.toString() ?? '';
      nearestObstacle = '$label ${position.toLowerCase()} ${distance}m'.trim();
      distanceVal = double.tryParse(distance.toString());
    } else if (rawDetections.isNotEmpty) {
      final nearest = rawDetections.first;
      label = nearest['label']?.toString() ?? '';
      final distance = (nearest['distance'] as num?)?.toDouble();
      distanceVal = distance;
      nearestObstacle =
          '$label ${distance != null ? '${distance.toStringAsFixed(1)}m' : ''}'
              .trim();
    }
    safeDirection = _deriveSafeDirection(position, dangerAlerts);

    // Trigger Spatial Audio for the nearest obstacle
    if (dangerAlerts.isNotEmpty) {
      final nearest = dangerAlerts.first;
      final parsedDist = distanceVal ?? 2.0;
      final centerXRatio = nearest['center_x_ratio'];
      ctrl.spatialAudioService.playDirectionalAlert(
        position: position,
        level: alertLevelFromDistance(parsedDist, label: label),
        distance: parsedDist,
        centerXRatio: centerXRatio is num ? centerXRatio.toDouble() : null,
      );
    } else {
      final text = (result['text']?.toString() ?? '').toLowerCase();
      if (text.contains('trái') || text.contains('left')) {
        safeDirection = _settings.language == 'vi' ? 'Đi trái' : 'Go left';
      } else if (text.contains('phải') || text.contains('right')) {
        safeDirection = _settings.language == 'vi' ? 'Đi phải' : 'Go right';
      } else if (text.contains('giữa') || text.contains('center')) {
        safeDirection = _settings.language == 'vi' ? 'Đi thẳng' : 'Go straight';
      }
    }

    ctrl.walkingNearestObstacle = nearestObstacle;
    ctrl.walkingSafeDirection = safeDirection;
    ctrl.currentDetections = rawDetections;
    ctrl.lastFrameWidth = frameWidth;
    ctrl.lastFrameHeight = frameHeight;
    onStateChanged();
  }

  String _deriveSafeDirection(String positionText, List<Map<String, dynamic>> dangerAlerts) {
    bool leftBlocked = dangerAlerts.any((a) => (a['position']?.toString().toLowerCase() ?? '').contains('trái') || (a['position']?.toString().toLowerCase() ?? '').contains('left'));
    bool rightBlocked = dangerAlerts.any((a) => (a['position']?.toString().toLowerCase() ?? '').contains('phải') || (a['position']?.toString().toLowerCase() ?? '').contains('right'));
    bool centerBlocked = dangerAlerts.any((a) => (a['position']?.toString().toLowerCase() ?? '').contains('giữa') || (a['position']?.toString().toLowerCase() ?? '').contains('center') || (a['position']?.toString().toLowerCase() ?? '').contains('front'));

    if (centerBlocked || (leftBlocked && rightBlocked)) {
      return _settings.language == 'vi' ? 'Dừng lại' : 'Stop';
    }

    final lowered = positionText.toLowerCase();
    if (lowered.contains('trái') || lowered.contains('left')) {
      return _settings.language == 'vi' ? 'Đi phải' : 'Go right';
    }
    if (lowered.contains('phải') || lowered.contains('right')) {
      return _settings.language == 'vi' ? 'Đi trái' : 'Go left';
    }
    return _settings.language == 'vi'
        ? 'Cẩn thận'
        : 'Be careful';
  }

  Future<void> toggleCamera() async {
    final wasWalking = ctrl.isWalkingModeEnabled;
    final lang = _settings.language;

    ctrl.accessibilityManager.speak(
      lang == 'vi' ? 'Đang chuyển camera...' : 'Switching camera...',
    );

    if (wasWalking) {
      await setWalkingMode(false, announce: false);
    }

    ctrl.isFrontCamera = !ctrl.isFrontCamera;
    onStateChanged();

    await ctrl.restartCamera();

    if (wasWalking) {
      await Future.delayed(const Duration(milliseconds: 500));
      await setWalkingMode(true, announce: false);
    }

    final msg = ctrl.isFrontCamera
        ? (lang == 'vi'
              ? 'Đã chuyển sang camera trước'
              : 'Switched to front camera')
        : (lang == 'vi'
              ? 'Đã chuyển sang camera sau'
              : 'Switched to back camera');
    ctrl.accessibilityManager.speak(msg);
  }
}
