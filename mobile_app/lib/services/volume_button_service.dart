import 'dart:async';
import 'package:flutter/services.dart';

/// Service that listens for SOS triggers from native Android code.
/// The native side detects 5 rapid volume-down presses and sends
/// an event through the EventChannel.
class VolumeButtonService {
  static const EventChannel _channel = EventChannel(
    'com.example.mobile_app/volume_button',
  );

  StreamSubscription? _subscription;
  final void Function() onSosTriggered;

  VolumeButtonService({required this.onSosTriggered});

  void startListening() {
    _subscription = _channel.receiveBroadcastStream().listen((event) {
      if (event == 'sos_triggered') {
        onSosTriggered();
      }
    });
  }

  void stopListening() {
    _subscription?.cancel();
    _subscription = null;
  }
}
