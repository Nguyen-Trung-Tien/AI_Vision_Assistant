import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:mobile_app/controllers/main_controller.dart';
import 'package:mobile_app/services/power_button_service.dart';
import 'package:mobile_app/services/sos_service.dart';
import 'package:mobile_app/services/volume_button_service.dart';

/// Handles SOS hold-to-trigger, hardware button detection, and alert sending.
enum SosOverlayStatus { hidden, countdown, sending, sent, error }

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
  Timer? _overlayDismissTimer;

  SosOverlayStatus overlayStatus = SosOverlayStatus.hidden;
  int sosCountdown = 0;

  bool get isOverlayVisible => overlayStatus != SosOverlayStatus.hidden;

  void init() {
    _sosService.onCountdownTick = (secondsLeft) async {
      if (secondsLeft == null) {
        overlayStatus = SosOverlayStatus.hidden;
        sosCountdown = 0;
      } else if (secondsLeft <= 0) {
        overlayStatus = SosOverlayStatus.sending;
        sosCountdown = 0;
        onStateChanged();

        final frame = await ctrl.captureCurrentFrame();
        await _sendLocationToBackend(frame);
      } else {
        _overlayDismissTimer?.cancel();
        overlayStatus = SosOverlayStatus.countdown;
        sosCountdown = secondsLeft;
      }
      onStateChanged();
    };

    _powerButtonService = PowerButtonService(
      onSosTriggered: () => _sosService.triggerEmergency(countdownSeconds: 10),
    );
    _powerButtonService.startListening();

    _volumeButtonService = VolumeButtonService(
      onSosTriggered: () => _sosService.triggerEmergency(countdownSeconds: 10),
    );
    _volumeButtonService.startListening();
  }

  /// Trigger SOS directly (e.g. from voice command) without hold UX.
  void triggerSos() {
    _sosService.triggerEmergency(countdownSeconds: 10);
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
    _sosService.triggerEmergency(countdownSeconds: 10);
    sosHoldProgress = 0;
    onStateChanged();
  }

  Future<void> _sendLocationToBackend(List<int>? frame) async {
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
            timeLimit: Duration(seconds: 4),
          ),
        );
      }
    } catch (_) {
      position = await Geolocator.getLastKnownPosition();
    }

    if (position != null) {
      ctrl.wsService.sendSosAlert(
        latitude: position.latitude,
        longitude: position.longitude,
        imageBase64: frame != null ? base64Encode(frame) : null,
      );
      ctrl.accessibilityManager.speak('Đã gửi cảnh báo SOS');
      overlayStatus = SosOverlayStatus.sent;
    } else {
      ctrl.accessibilityManager.speak('Không lấy được vị trí SOS');
      overlayStatus = SosOverlayStatus.error;
    }

    _scheduleOverlayDismiss();
    onStateChanged();
  }

  void cancelFalseAlarm() {
    _sosService.cancelEmergency();
    _overlayDismissTimer?.cancel();
    overlayStatus = SosOverlayStatus.hidden;
    sosCountdown = 0;
    onStateChanged();
  }

  void _scheduleOverlayDismiss() {
    _overlayDismissTimer?.cancel();
    _overlayDismissTimer = Timer(const Duration(seconds: 4), () {
      overlayStatus = SosOverlayStatus.hidden;
      sosCountdown = 0;
      onStateChanged();
    });
  }

  void dispose() {
    _sosHoldProgressTimer?.cancel();
    _sosHoldCompleteTimer?.cancel();
    _overlayDismissTimer?.cancel();
    _powerButtonService.stopListening();
    _volumeButtonService.stopListening();
  }
}
