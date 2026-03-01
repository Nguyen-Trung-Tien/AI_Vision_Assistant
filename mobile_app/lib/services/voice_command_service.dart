import 'package:flutter/foundation.dart';
import 'package:speech_to_text/speech_to_text.dart';
import 'package:mobile_app/services/accessibility_manager.dart';

class VoiceCommandService {
  final SpeechToText _speechToText = SpeechToText();
  final AccessibilityManager _accessibilityManager = AccessibilityManager();

  bool _isListening = false;
  bool _isInitialized = false;

  final Function(String command) onCommandRecognized;

  VoiceCommandService({required this.onCommandRecognized});

  Future<void> init() async {
    try {
      _isInitialized = await _speechToText.initialize(
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

      if (!_isInitialized) {
        _accessibilityManager.speak('Không thể khởi tạo nhận diện giọng nói.');
      }
    } catch (e) {
      _isInitialized = false;
      debugPrint('Speech init error: $e');
    }
  }

  Future<void> startListening() async {
    if (!_isInitialized || !_speechToText.isAvailable) {
      await init();
      if (!_isInitialized || !_speechToText.isAvailable) {
        _accessibilityManager.speak(
          'Thiết bị không hỗ trợ nhận diện giọng nói.',
        );
        return;
      }
    }

    if (_isListening) {
      await stopListening();
      return;
    }

    _isListening = true;
    _accessibilityManager.triggerSuccessVibration();
    _accessibilityManager.speak('Tôi đang nghe...');

    await Future.delayed(const Duration(milliseconds: 800));

    await _speechToText.listen(
      localeId: 'vi_VN',
      listenOptions: SpeechListenOptions(
        cancelOnError: true,
        listenMode: ListenMode.deviceDefault,
        partialResults: true,
      ),
      listenFor: const Duration(seconds: 8),
      pauseFor: const Duration(seconds: 2),
      onResult: (result) {
        final recognizedWords = result.recognizedWords.trim();
        if (recognizedWords.isEmpty) return;

        if (result.finalResult || result.confidence >= 0.6) {
          _isListening = false;
          final command = recognizedWords.toLowerCase();
          debugPrint('Command recognized: $command');
          onCommandRecognized(command);
        }
      },
    );
  }

  Future<void> stopListening() async {
    await _speechToText.stop();
    _isListening = false;
  }
}
