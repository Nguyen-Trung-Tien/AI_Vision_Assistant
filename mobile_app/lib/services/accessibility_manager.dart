import 'package:flutter_tts/flutter_tts.dart';
import 'package:vibration/vibration.dart';
import 'package:mobile_app/services/settings_service.dart';

class AccessibilityManager {
  static final AccessibilityManager _instance =
      AccessibilityManager._internal();
  factory AccessibilityManager() => _instance;

  final FlutterTts flutterTts = FlutterTts();
  final SettingsService _settings = SettingsService();

  AccessibilityManager._internal() {
    _initTTS();
  }

  Future<void> _initTTS() async {
    final lang = _settings.language;
    await flutterTts.setLanguage(lang == 'en' ? "en-US" : "vi-VN");
    await flutterTts.setPitch(1.0);
    await flutterTts.setSpeechRate(_settings.ttsSpeed);
  }

  /// Call this after settings change to apply new TTS speed and language.
  Future<void> refreshTtsSpeed() async {
    final lang = _settings.language;
    await flutterTts.setLanguage(lang == 'en' ? "en-US" : "vi-VN");
    await flutterTts.setSpeechRate(_settings.ttsSpeed);
  }

  Future<void> speak(String text) async {
    await flutterTts.speak(text);
  }

  Future<void> speakSystemMessage(
    String text, {
    bool highPriority = false,
  }) async {
    if (highPriority) {
      await flutterTts.stop();
    }
    await flutterTts.speak(text);
  }

  Future<void> stopSpeak() async {
    await flutterTts.stop();
  }

  // ─── Haptic Patterns ───

  Future<void> triggerDangerVibration(double distance) async {
    bool? hasVibrator = await Vibration.hasVibrator();
    if (hasVibrator != true) return;

    if (distance < 0.5) {
      // Extremely close!
      Vibration.vibrate(
        pattern: [0, 200, 50, 200, 50, 500],
        intensities: [255, 255, 255],
      );
    } else if (distance < 1.0) {
      Vibration.vibrate(pattern: [0, 300, 200, 300], intensities: [180, 180]);
    } else if (distance <= 2.0) {
      Vibration.vibrate(duration: 500, amplitude: 128);
    }
  }

  Future<void> triggerSuccessVibration() async {
    bool? hasVibrator = await Vibration.hasVibrator();
    if (hasVibrator == true) {
      Vibration.vibrate(duration: 100, amplitude: 64);
    }
  }

  /// SOS emergency — continuous strong buzz
  Future<void> triggerSOSVibration() async {
    bool? hasVibrator = await Vibration.hasVibrator();
    if (hasVibrator == true) {
      Vibration.vibrate(
        pattern: [0, 500, 100, 500, 100, 500],
        intensities: [255, 255, 255],
      );
    }
  }

  /// Warning — 3 short bursts
  Future<void> triggerWarningVibration() async {
    bool? hasVibrator = await Vibration.hasVibrator();
    if (hasVibrator == true) {
      Vibration.vibrate(
        pattern: [0, 150, 100, 150, 100, 150],
        intensities: [200, 200, 200],
      );
    }
  }

  /// Navigation — single gentle tap
  Future<void> triggerNavigationVibration() async {
    bool? hasVibrator = await Vibration.hasVibrator();
    if (hasVibrator == true) {
      Vibration.vibrate(duration: 50, amplitude: 40);
    }
  }

  /// Error — 2 long buzzes
  Future<void> triggerErrorVibration() async {
    bool? hasVibrator = await Vibration.hasVibrator();
    if (hasVibrator == true) {
      Vibration.vibrate(pattern: [0, 400, 200, 400], intensities: [220, 220]);
    }
  }
}
