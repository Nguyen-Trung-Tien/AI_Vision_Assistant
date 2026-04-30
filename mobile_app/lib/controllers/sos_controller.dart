import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:mobile_app/controllers/main_controller.dart';
import 'package:mobile_app/services/power_button_service.dart';
import 'package:mobile_app/services/sos_service.dart';
import 'package:mobile_app/services/volume_button_service.dart';

/// Handles SOS hold-to-trigger, hardware button detection, and alert sending.
class SosController {
  SosController({required this.ctrl, required this.onStateChanged});

  final MainController ctrl;
  final VoidCallback onStateChanged;

  final SosService _sosService = SosService();
  late PowerButtonService _powerButtonService;
  late VolumeButtonService _volumeButtonService;

  double sosHoldProgress = 0;
  Timer? _sosHoldProgressTimer;
  Timer? _sosHoldCompleteTimer;

  void init() {
    _powerButtonService = PowerButtonService(
      onSosTriggered: () => _sosService.triggerEmergency(),
    );
    _powerButtonService.startListening();

    _volumeButtonService = VolumeButtonService(
      onSosTriggered: () => _sosService.triggerEmergency(),
    );
    _volumeButtonService.startListening();
  }

  /// Trigger SOS directly (e.g. from voice command) without hold UX.
  void triggerSos() {
    _sosService.triggerEmergency();
  }

  void startSosHold(LongPressStartDetails details) {
    _sosHoldProgressTimer?.cancel();
    _sosHoldCompleteTimer?.cancel();

    ctrl.accessibilityManager.triggerSOSVibration();

    final startedAt = DateTime.now();
    sosHoldProgress = 0;
    onStateChanged();

    _sosHoldProgressTimer = Timer.periodic(const Duration(milliseconds: 100), (
      _,
    ) {
      final elapsed = DateTime.now().difference(startedAt).inMilliseconds;
      sosHoldProgress = (elapsed / 3000).clamp(0, 1).toDouble();
      onStateChanged();
    });

    _sosHoldCompleteTimer = Timer(const Duration(seconds: 3), () {
      _sosHoldProgressTimer?.cancel();
      sosHoldProgress = 1;
      onStateChanged();
      _triggerSosAlert();
    });
  }

  void cancelSosHold() {
    _sosHoldProgressTimer?.cancel();
    _sosHoldCompleteTimer?.cancel();
    ctrl.accessibilityManager.stopVibration();
    sosHoldProgress = 0;
    onStateChanged();
  }

  Future<void> _triggerSosAlert() async {
    final frame = await ctrl.captureCurrentFrame();
    Position? position;
    try {
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission != LocationPermission.denied &&
          permission != LocationPermission.deniedForever) {
        position = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.bestForNavigation,
          ),
        );
      }
    } catch (_) {}

    if (position != null) {
      ctrl.wsService.sendSosAlert(
        latitude: position.latitude,
        longitude: position.longitude,
        imageBase64: frame != null ? base64Encode(frame) : null,
      );
      ctrl.accessibilityManager.speak('Đã gửi cảnh báo SOS');
    } else {
      ctrl.accessibilityManager.speak('Không lấy được vị trí SOS');
    }

    _sosService.triggerEmergency(countdownSeconds: 3);
    sosHoldProgress = 0;
    onStateChanged();
  }

  void dispose() {
    _sosHoldProgressTimer?.cancel();
    _sosHoldCompleteTimer?.cancel();
    _powerButtonService.stopListening();
    _volumeButtonService.stopListening();
  }
}
