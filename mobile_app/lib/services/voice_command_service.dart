import 'package:flutter/foundation.dart';
import 'package:speech_to_text/speech_to_text.dart';
import 'package:mobile_app/services/accessibility_manager.dart';
import 'package:mobile_app/services/settings_service.dart';

class VoiceCommandService {
  static final SpeechToText sharedSpeech = SpeechToText();
  SpeechToText get _speechToText => sharedSpeech;

  final AccessibilityManager _accessibilityManager = AccessibilityManager();
  final SettingsService _settings = SettingsService();

  bool _isListening = false;
  bool _isInitialized = false;
  bool _isVisualQAMode = false;
  String _currentRecognizedText = '';

  bool get isListening => _isListening;

  final Function(String command) onCommandRecognized;
  final VoidCallback? onListeningStateChanged;

  VoiceCommandService(
      {required this.onCommandRecognized, this.onListeningStateChanged});

  void _setListening(bool value) {
    if (_isListening != value) {
      _isListening = value;
      onListeningStateChanged?.call();
    }
  }

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
            _setListening(false);
            // Đóng hẳn kết nối micro khi kết thúc phiên nhận diện tự nhiên
            _speechToText.cancel();
          }
        },
        onError: (errorNotification) {
          debugPrint('Speech error: $errorNotification');
          _setListening(false);
          // Đảm bảo đóng kết nối micro khi có lỗi
          _speechToText.cancel();
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

  Future<void> startListening({bool isVisualQA = false}) async {
    // Đảm bảo không có phiên nhận diện nào đang chạy dở dang trên đối tượng dùng chung
    if (_speechToText.isListening) {
      await _speechToText.cancel();
      await Future.delayed(const Duration(milliseconds: 200));
    }

    _isVisualQAMode = isVisualQA;
    _currentRecognizedText = '';

    // Luôn khởi tạo lại để đăng ký lại callback đúng cho VoiceCommandService
    await init();
    if (!_isInitialized || !_speechToText.isAvailable) {
      _accessibilityManager.speak(
        'Thiết bị không hỗ trợ hoặc không thể khởi tạo nhận diện giọng nói.',
      );
      return;
    }

    _setListening(true);
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
        partialResults: isVisualQA,
        cancelOnError: false,
        autoPunctuation: false,
      ),
      listenFor: const Duration(seconds: 10),
      pauseFor: const Duration(seconds: 3),
      onResult: (result) {
        final recognizedWords = result.recognizedWords.trim();
        if (recognizedWords.isEmpty) return;

        _currentRecognizedText = recognizedWords;

        if (result.finalResult) {
          _setListening(false);
          // Hủy nhận diện và giải phóng micro ngay khi có kết quả cuối cùng
          _speechToText.cancel();
          final command = recognizedWords.toLowerCase();
          debugPrint(
            'Command recognized: $command (confidence: ${result.confidence})',
          );
          if (!_isVisualQAMode) {
            onCommandRecognized(command);
          }
        }
      },
    );
  }

  Future<void> stopListening() async {
    await _speechToText.cancel();
    _setListening(false);
  }

  Future<String> stopListeningAndGetText() async {
    final text = _currentRecognizedText;
    await stopListening();
    return text;
  }

  /// Đặt lại service khi cần thiết (ví dụ: sau khi app resume)
  Future<void> reset() async {
    _setListening(false);
    _isInitialized = false;
    await _speechToText.cancel();
    await init();
  }
}
