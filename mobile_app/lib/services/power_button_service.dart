import 'dart:async';
import 'package:flutter/services.dart';

/// Service that listens for SOS triggers from native Android code.
/// The native side detects 5 rapid power button presses and sends
/// an event through the EventChannel.
class PowerButtonService {
  static const EventChannel _channel = EventChannel(
    'com.example.mobile_app/power_button',
  );

  StreamSubscription? _subscription;
  final void Function() onSosTriggered;

  PowerButtonService({required this.onSosTriggered});

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
