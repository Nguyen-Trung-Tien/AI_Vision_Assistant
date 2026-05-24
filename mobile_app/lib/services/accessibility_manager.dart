import 'package:flutter_tts/flutter_tts.dart';
import 'package:vibration/vibration.dart';
import 'package:mobile_app/services/settings_service.dart';
import 'package:mobile_app/utils/tts_queue.dart';

class AccessibilityManager {
  static final AccessibilityManager _instance =
      AccessibilityManager._internal();
  factory AccessibilityManager() => _instance;

  final FlutterTts _flutterTts = FlutterTts();
  final SettingsService _settings = SettingsService();
  late final Future<void> _ttsInitFuture;
  late final TtsQueue _queue;

  // Cached vibrator capability — avoids repeated async calls
  bool? _hasVibrator;

  bool isSpeaking = false;
  void Function(bool)? onSpeakingChanged;
  void Function(int start, int end, String word)? onProgress;

  AccessibilityManager._internal() {
    _queue = TtsQueue(_flutterTts);
    _queue.onSpeakingChanged = (speaking) {
      isSpeaking = speaking;
      onSpeakingChanged?.call(speaking);
    };
    _queue.onProgress = (start, end, word) {
      onProgress?.call(start, end, word);
    };
    _ttsInitFuture = _initTTS();
    _cacheVibrator();
  }

  Future<void> _initTTS() async {
    try {
      final lang = _settings.language;
      await _flutterTts.setLanguage(lang == 'en' ? 'en-US' : 'vi-VN');
      await _flutterTts.setPitch(1.0);
      await _flutterTts.setSpeechRate(_settings.ttsSpeed);
      await _flutterTts.setVolume(1.0);
      await _flutterTts.awaitSpeakCompletion(true);

      _flutterTts.setStartHandler(() {
        isSpeaking = true;
        onSpeakingChanged?.call(true);
      });
      _flutterTts.setProgressHandler((text, start, end, word) {
        _queue.onProgress?.call(start, end, word);
      });
      _flutterTts.setCompletionHandler(() => _queue.markDone());
      _flutterTts.setCancelHandler(() => _queue.markDone());
    } catch (_) {
      // Keep app running even if TTS init fails on specific devices.
    }
  }

  Future<void> _cacheVibrator() async {
    _hasVibrator = await Vibration.hasVibrator();
  }

  Future<void> _ensureTtsReady() async {
    await _ttsInitFuture;
  }

  /// Call this after settings change to apply new TTS speed and language.
  Future<void> refreshTtsSpeed() async {
    await _ensureTtsReady();
    final lang = _settings.language;
    await _flutterTts.setLanguage(lang == 'en' ? 'en-US' : 'vi-VN');
    await _flutterTts.setSpeechRate(_settings.ttsSpeed);
    await _flutterTts.setVolume(1.0);
  }

  /// Default speak: NORMAL priority — queued, won't cut existing speech.
  /// Pass [interrupt]=true only for time-critical messages (danger, system).
  Future<void> speak(String text, {bool interrupt = false}) async {
    if (text.trim().isEmpty) return;
    await _ensureTtsReady();
    if (interrupt) {
      await _queue.speakHigh(text);
    } else {
      await _queue.speakNormal(text);
    }
  }

  /// System messages: HIGH priority → interrupt current speech if highPriority.
  Future<void> speakSystemMessage(
    String text, {
    bool highPriority = false,
  }) async {
    if (text.trim().isEmpty) return;
    await _ensureTtsReady();
    if (highPriority) {
      await _queue.speakHigh(text);
    } else {
      await _queue.speakNormal(text);
    }
  }

  Future<void> stopSpeak() async {
    await _queue.stop();
  }

  Future<void> stopVibration() async {
    if (_hasVibrator == true) Vibration.cancel();
  }

  // ─── Haptic Patterns ───────────────────────────────────────────────────

  Future<void> triggerDangerVibration(double distance) async {
    if (_hasVibrator != true) return;
    if (distance < 0.5) {
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
    if (_hasVibrator == true) {
      Vibration.vibrate(duration: 100, amplitude: 64);
    }
  }

  /// SOS emergency — continuous strong buzz.
  Future<void> triggerSOSVibration() async {
    if (_hasVibrator == true) {
      Vibration.vibrate(
        pattern: [0, 500, 100, 500, 100, 500],
        intensities: [255, 255, 255],
      );
    }
  }

  /// Warning — 3 short bursts.
  Future<void> triggerWarningVibration() async {
    if (_hasVibrator == true) {
      Vibration.vibrate(
        pattern: [0, 150, 100, 150, 100, 150],
        intensities: [200, 200, 200],
      );
    }
  }

  /// Navigation — single gentle tap.
  Future<void> triggerNavigationVibration() async {
    if (_hasVibrator == true) {
      Vibration.vibrate(duration: 50, amplitude: 40);
    }
  }

  /// Error — 2 long buzzes.
  Future<void> triggerErrorVibration() async {
    if (_hasVibrator == true) {
      Vibration.vibrate(pattern: [0, 400, 200, 400], intensities: [220, 220]);
    }
  }
}
