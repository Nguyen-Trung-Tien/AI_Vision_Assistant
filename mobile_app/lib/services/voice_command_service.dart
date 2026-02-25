import 'package:flutter/foundation.dart';
import 'package:speech_to_text/speech_to_text.dart';
import 'package:mobile_app/services/accessibility_manager.dart';

class VoiceCommandService {
  final SpeechToText _speechToText = SpeechToText();
  final AccessibilityManager _accessibilityManager = AccessibilityManager();
  bool _isListening = false;

  // Callback when a command is recognized.
  final Function(String command) onCommandRecognized;

  VoiceCommandService({required this.onCommandRecognized});

  Future<void> init() async {
    try {
      await _speechToText.initialize(
        onStatus: (status) {
          debugPrint('Speech status: $status');
          if (status == 'done' || status == 'notListening') {
            _isListening = false;
          }
        },
        onError: (errorNotification) {
          debugPrint('Speech error: $errorNotification');
          _isListening = false;
          _accessibilityManager.speak('Lỗi nhận diện giọng nói.');
        },
      );
    } catch (e) {
      debugPrint("Speech init error: $e");
    }
  }

  Future<void> startListening() async {
    if (!_speechToText.isAvailable) {
      _accessibilityManager.speak('Thiết bị không hỗ trợ nhận diện giọng nói.');
      return;
    }

    if (_isListening) {
      await stopListening();
      return;
    }

    _isListening = true;
    _accessibilityManager.triggerSuccessVibration();
    _accessibilityManager.speak('Tôi đang nghe...');

    // Give TTS a moment to finish before listening
    await Future.delayed(const Duration(milliseconds: 1000));

    await _speechToText.listen(
      onResult: (result) {
        if (result.finalResult) {
          String recognizedWords = result.recognizedWords.toLowerCase();
          _isListening = false;
          debugPrint('Command recognized: $recognizedWords');
          onCommandRecognized(recognizedWords);
        }
      },
      localeId: 'vi_VN',
      cancelOnError: true,
      listenMode: ListenMode.deviceDefault,
    );
  }

  Future<void> stopListening() async {
    await _speechToText.stop();
    _isListening = false;
  }
}
