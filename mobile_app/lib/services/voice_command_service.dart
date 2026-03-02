import 'package:flutter/foundation.dart';
import 'package:speech_to_text/speech_to_text.dart';
import 'package:mobile_app/services/accessibility_manager.dart';
import 'package:mobile_app/services/settings_service.dart';

class VoiceCommandService {
  final SpeechToText _speechToText = SpeechToText();
  final AccessibilityManager _accessibilityManager = AccessibilityManager();
  final SettingsService _settings = SettingsService();

  bool _isListening = false;
  bool _isInitialized = false;

  final Function(String command) onCommandRecognized;

  VoiceCommandService({required this.onCommandRecognized});

  /// Map ngôn ngữ app → locale ID cho speech_to_text.
  static String _langToLocale(String lang) {
    switch (lang) {
      case 'en':
        return 'en_US';
      case 'vi':
      default:
        return 'vi_VN';
    }
  }

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
          // Chỉ thông báo nếu không phải lỗi thông thường khi dừng
          if (errorNotification.errorMsg != 'error_speech_timeout' &&
              errorNotification.errorMsg != 'error_no_match') {
            _accessibilityManager.speak('Lỗi nhận diện giọng nói.');
          }
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
    // Nếu đang nghe thì dừng lại
    if (_isListening) {
      await stopListening();
      return;
    }

    // Thử khởi tạo lại nếu chưa sẵn sàng
    if (!_isInitialized || !_speechToText.isAvailable) {
      await init();
      if (!_isInitialized || !_speechToText.isAvailable) {
        _accessibilityManager.speak(
          'Thiết bị không hỗ trợ nhận diện giọng nói.',
        );
        return;
      }
    }

    _isListening = true;
    _accessibilityManager.triggerSuccessVibration();
    _accessibilityManager.speak('Tôi đang nghe...');

    // Chờ TTS đọc xong trước khi bắt đầu nghe
    await Future.delayed(const Duration(milliseconds: 900));

    // Đọc locale từ settings — đúng ngôn ngữ người dùng đã chọn
    final locale = _langToLocale(_settings.language);
    debugPrint(
      '[VoiceCommand] Using locale: $locale (lang=${_settings.language})',
    );

    await _speechToText.listen(
      localeId: locale,
      listenOptions: SpeechListenOptions(
        listenMode: ListenMode.confirmation,
        partialResults: false,
        cancelOnError: false,
        autoPunctuation: false,
      ),
      listenFor: const Duration(seconds: 10),
      pauseFor: const Duration(seconds: 3),
      onResult: (result) {
        final recognizedWords = result.recognizedWords.trim();
        if (recognizedWords.isEmpty) return;

        if (result.finalResult) {
          _isListening = false;
          final command = recognizedWords.toLowerCase();
          debugPrint(
            'Command recognized: $command (confidence: ${result.confidence})',
          );
          onCommandRecognized(command);
        }
      },
    );
  }

  Future<void> stopListening() async {
    await _speechToText.stop();
    _isListening = false;
  }

  /// Đặt lại service khi cần thiết (ví dụ: sau khi app resume)
  Future<void> reset() async {
    _isListening = false;
    _isInitialized = false;
    await _speechToText.cancel();
    await init();
  }
}
