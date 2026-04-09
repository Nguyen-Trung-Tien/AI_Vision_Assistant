import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:mobile_app/screens/history_screen.dart';
import 'package:mobile_app/screens/settings_screen.dart';
import 'package:mobile_app/services/accessibility_manager.dart';
import 'package:mobile_app/services/edge_ai_service.dart';
import 'package:mobile_app/services/feedback_service.dart';
import 'package:mobile_app/services/document_reader_service.dart';
import 'package:mobile_app/services/light_sensor_service.dart';
import 'package:mobile_app/services/ml_kit_service.dart';
import 'package:mobile_app/services/navigation_service.dart';
import 'package:mobile_app/screens/navigation_screen.dart';
import 'package:mobile_app/services/power_button_service.dart';
import 'package:mobile_app/services/settings_service.dart';
import 'package:mobile_app/services/sos_service.dart';
import 'package:mobile_app/services/tflite_service.dart';
import 'package:mobile_app/services/voice_command_service.dart';
import 'package:mobile_app/services/volume_button_service.dart';
import 'package:mobile_app/services/websocket_service.dart';
import 'package:mobile_app/services/continuous_stream_service.dart';
import 'package:mobile_app/services/spatial_audio_service.dart';
import 'package:mobile_app/l10n/app_localizations.dart';
import 'package:mobile_app/utils/text_utils.dart';
import 'package:mobile_app/utils/spatial_utils.dart';
import 'package:mobile_app/theme/app_theme.dart';
import 'package:mobile_app/widgets/status_overlay.dart';
import 'package:mobile_app/widgets/mode_carousel.dart';
import 'package:mobile_app/widgets/visual_qa_button.dart';

class MainScreen extends StatefulWidget {
  final List<CameraDescription>? cameras;

  const MainScreen({super.key, this.cameras});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen>
    with SingleTickerProviderStateMixin {
  late WebSocketService _wsService;
  late EdgeAIService _aiService;
  late ContinuousStreamService _continuousStreamService;
  final DocumentReaderService _documentReaderService = DocumentReaderService();
  final AccessibilityManager _accessibilityManager = AccessibilityManager();
  final MlKitService _mlKitService = MlKitService();
  late VoiceCommandService _voiceCommandService;
  final NavigationService _navigationService = NavigationService();
  final SosService _sosService = SosService();
  final FeedbackService _feedbackService = FeedbackService();
  final SettingsService _settings = SettingsService();
  late PowerButtonService _powerButtonService;
  late VolumeButtonService _volumeButtonService;
  final SpatialAudioService _spatialAudioService = SpatialAudioService();

  CameraController? _cameraController;
  static const Duration _captureTimeout = Duration(seconds: 6);
  bool _isCapturing = false;
  bool _isFlashOn = false;
  bool _isConnected = false;
  bool _isProcessing = false;
  bool _isRestartingCamera = false;

  String? _dangerMessage;
  Timer? _dangerTimer;

  final PageController _pageController = PageController();
  int _currentModeIndex = 0;
  bool _isWalkingModeEnabled = false;
  int _walkingCurrentFps = 1;
  String _walkingNearestObstacle = '-';
  String _walkingSafeDirection = '-';
  bool _isScanningMLKit = false;
  Future<void>? _stopImageStreamFuture;
  late AnimationController _pulseController;

  final LightSensorService _lightSensor = LightSensorService();
  final TfliteService _tfliteService = TfliteService();
  bool _isNightMode = false;
  bool _hasShownOfflineModelLoadedMessage = false;
  String? _pendingFeedbackDetectionId;
  Timer? _feedbackTimer;
  double _sosHoldProgress = 0;
  Timer? _sosHoldProgressTimer;
  Timer? _sosHoldCompleteTimer;

  final List<IconData> _modeIcons = [
    Icons.auto_awesome,
    Icons.document_scanner,
    Icons.text_fields,
    Icons.landscape,
    Icons.navigation,
    Icons.folder_open,
  ];

  String _sanitizeForTts(String text) {
    var cleaned = text;
    cleaned = cleaned.replaceAll(
      RegExp(r'^\s{0,3}#{1,6}\s+', multiLine: true),
      '',
    );
    cleaned = cleaned.replaceAll(RegExp(r'^\s*[-*+]\s+', multiLine: true), '');
    cleaned = cleaned.replaceAll(RegExp(r'^\s*\d+\.\s+', multiLine: true), '');
    cleaned = cleaned.replaceAll('**', '');
    cleaned = cleaned.replaceAll('*', '');
    cleaned = cleaned.replaceAll('__', '');
    cleaned = cleaned.replaceAll('_', '');
    cleaned = cleaned.replaceAll('`', '');
    cleaned = cleaned.replaceAll(RegExp(r'\s+'), ' ').trim();
    return cleaned;
  }

  // Replace with a getter
  List<String> _getModes(String lang) {
    return [
      AppLocalizations.t('mode_0', lang),
      AppLocalizations.t('mode_5', lang),
      AppLocalizations.t('mode_4', lang),
      AppLocalizations.t('mode_1', lang),
      AppLocalizations.t('mode_3', lang),
      AppLocalizations.t('mode_6', lang),
    ];
  }

  String _modeSpokenKey(int index) {
    const keys = ['mode_0', 'mode_5', 'mode_4', 'mode_1', 'mode_3', 'mode_6'];
    if (index < 0 || index >= keys.length) return 'mode_0_spoken';
    return '${keys[index]}_spoken';
  }

  @override
  void initState() {
    super.initState();

    _wsService = WebSocketService();
    if (_settings.authToken.isNotEmpty) {
      _wsService.setAuthToken(_settings.authToken);
    }
    _wsService.onConnectionStatus = (connected) {
      if (mounted) {
        setState(() => _isConnected = connected);
      }
      if (!connected && _isWalkingModeEnabled) {
        unawaited(_setWalkingMode(false, announce: false));
        _accessibilityManager.speak(
          _settings.language == 'vi'
              ? 'Mất kết nối mạng. Đã tắt chế độ đi bộ.'
              : 'Connection lost. Walking mode has been disabled.',
        );
      }
    };
    _wsService.onTtsBroadcast = (data) {
      final message = data['message']?.toString().trim() ?? '';
      final priority = data['priority']?.toString().toLowerCase() ?? 'normal';
      if (message.isNotEmpty) {
        _accessibilityManager.speakSystemMessage(
          'Thông báo hệ thống: $message',
          highPriority: priority == 'high' || priority == 'urgent',
        );
      }
    };
    _wsService.connect();

    _aiService = EdgeAIService(_wsService, _captureCurrentFrame);
    _continuousStreamService = ContinuousStreamService(
      _wsService,
      onFpsChanged: (fps) {
        if (!mounted) return;
        setState(() => _walkingCurrentFps = fps);
      },
      onLowBatteryFpsActivated: () {
        _accessibilityManager.speak(
          _settings.language == 'vi'
              ? 'Pin yếu, giảm xuống 2 khung hình mỗi giây'
              : 'Low battery, reducing to 2 FPS',
        );
      },
    );
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    );
    _aiService.onProcessingStateChanged = (isProcessing) {
      if (mounted) {
        setState(() => _isProcessing = isProcessing);
      }
    };

    _aiService.onDangerAlertDetected = (message, level) {
      if (mounted) {
        setState(() => _dangerMessage = message);
        _dangerTimer?.cancel();
        _dangerTimer = Timer(const Duration(seconds: 4), () {
          if (mounted) setState(() => _dangerMessage = null);
        });

        // Trigger Spatial Audio — extract position from message text
        if (message.isNotEmpty) {
          _spatialAudioService.playDirectionalAlert(
            position: message,
            level: level,
            distance: _settings.warningDistance,
          );
        }
      }
    };
    _aiService.onAIResultReceived = (result) {
      if (result['taskType'] == 'visual_qa') {
        final text = result['text']?.toString() ?? '';
        if (text.isNotEmpty) {
          _accessibilityManager.speak(_sanitizeForTts(text));
        }
        return;
      }

      final taskType =
          result['taskType']?.toString() ??
          result['task_type']?.toString() ??
          '';
      _continuousStreamService.onFrameResultReceived(taskType: taskType);
      if (_isWalkingModeEnabled && taskType == 'CONTINUOUS') {
        _updateWalkingOverlayFromResult(result);
      }

      final detectionId = result['detectionId']?.toString();
      if (detectionId == null || detectionId.isEmpty) return;
      _showFeedbackPrompt(detectionId);
    };

    _aiService.start();

    unawaited(_ensureOfflineModelLoaded(notifyOnFreshLoad: true));

    _voiceCommandService = VoiceCommandService(
      onCommandRecognized: _onCommandRecognized,
    );
    _voiceCommandService.init();

    _initSosDetection();

    final defaultMode = _settings.defaultModeIndex;
    if (defaultMode > 0 && defaultMode < _getModes(_settings.language).length) {
      _currentModeIndex = defaultMode;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _pageController.jumpToPage(defaultMode);
      });
    }

    if (widget.cameras != null && widget.cameras!.isNotEmpty) {
      _cameraController = CameraController(
        widget.cameras!.first,
        ResolutionPreset.medium,
        enableAudio: false,
      );

      _cameraController!.initialize().then((_) {
        if (!mounted) return;
        setState(() {});
        _lightSensor.startMonitoring(_cameraController!);
      });

      _lightSensor.onLightChanged = (isLowLight) {
        if (!mounted) return;
        setState(() => _isNightMode = isLowLight);

        if (isLowLight && _settings.autoFlashEnabled && !_isFlashOn) {
          _toggleFlash(forceOn: true);
        } else if (!isLowLight && _isFlashOn && _settings.autoFlashEnabled) {
          _toggleFlash(forceOn: false);
        }
      };
    }
  }

  void _initSosDetection() {
    _powerButtonService = PowerButtonService(
      onSosTriggered: () => _sosService.triggerEmergency(),
    );
    _powerButtonService.startListening();

    _volumeButtonService = VolumeButtonService(
      onSosTriggered: () => _sosService.triggerEmergency(),
    );
    _volumeButtonService.startListening();
  }

  Future<bool> _ensureOfflineModelLoaded({
    bool notifyOnFreshLoad = false,
  }) async {
    final wasLoaded = _tfliteService.isModelLoaded;
    final loaded = wasLoaded || await _tfliteService.loadModel();
    if (!mounted || !notifyOnFreshLoad || !loaded || wasLoaded) {
      return loaded;
    }
    if (_hasShownOfflineModelLoadedMessage) return loaded;

    _hasShownOfflineModelLoadedMessage = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final isVi = _settings.language == 'vi';
      final source = _tfliteService.loadedModelSource;
      final sourceText = (source == null || source.isEmpty)
          ? ''
          : '\n${isVi ? 'Nguồn' : 'Source'}: $source';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 2),
          content: Text(
            isVi
                ? 'Đã tải model offline thành công.$sourceText'
                : 'Offline model loaded successfully.$sourceText',
          ),
        ),
      );
    });
    return loaded;
  }

  @override
  void dispose() {
    _dangerTimer?.cancel();
    _feedbackTimer?.cancel();
    _sosHoldProgressTimer?.cancel();
    _sosHoldCompleteTimer?.cancel();
    _continuousStreamService.stop();
    _pulseController.dispose();
    _cameraController?.dispose();
    _aiService.stop();
    _wsService.dispose();
    _pageController.dispose();
    _mlKitService.dispose();
    _lightSensor.stop();
    _voiceCommandService.stopListening();
    _navigationService.stopNavigation();
    _powerButtonService.stopListening();
    _volumeButtonService.stopListening();
    _spatialAudioService.dispose();
    super.dispose();
  }

  void _onCommandRecognized(String command) {
    final cmd = TextUtils.normalizeCommand(command);

    if (TextUtils.containsAny(cmd, [
      'khan cap',
      'cuu toi',
      'cuu voi',
      'giup toi',
      'help',
      'emergency',
      'sos',
    ])) {
      _sosService.triggerEmergency();
      return;
    }

    if (_pendingFeedbackDetectionId != null) {
      if (TextUtils.containsAny(cmd, ['dung', 'chinh xac', 'correct'])) {
        _submitFeedback(true);
        return;
      }
      if (TextUtils.containsAny(cmd, ['sai', 'khong dung', 'wrong'])) {
        _submitFeedback(false);
        return;
      }
    }

    if (TextUtils.containsAny(cmd, ['cai dat', 'settings'])) {
      _openSettings();
    } else if (TextUtils.containsAny(cmd, ['lich su', 'history'])) {
      _openHistory();
    } else if (TextUtils.containsAny(cmd, ['den', 'flash', 'light'])) {
      _toggleFlash();
    } else if (TextUtils.containsAny(cmd, ['tro giup', 'giup do', 'help'])) {
      _speakHelp();
    } else if (TextUtils.containsAny(cmd, [
      'doc van ban',
      'doc chu',
      'read text',
      'online',
    ])) {
      _goToMode(2);
    } else if (TextUtils.containsAny(cmd, ['nhanh', 'offline', 'quick read'])) {
      _goToMode(1);
    } else if (TextUtils.containsAny(cmd, [
      'mo ta',
      'khong gian',
      'scene',
      'describe',
    ])) {
      _goToMode(3);
    } else if (TextUtils.containsAny(cmd, [
      'dinh huong',
      'dinh vi',
      'navigate',
      'navigation',
    ])) {
      _goToMode(4);
      _openNavigationScreen();
    } else if (TextUtils.containsAny(cmd, [
      'doc tep',
      'mo file',
      'doc file',
      'mo tep',
      'open file',
      'read file',
    ])) {
      _goToMode(5);
    } else if (TextUtils.containsAny(cmd, [
      'bat che do di bo',
      'bat di bo',
      'enable walking mode',
      'start walking mode',
    ])) {
      unawaited(_setWalkingMode(true));
    } else if (TextUtils.containsAny(cmd, [
      'tat che do di bo',
      'tat di bo',
      'disable walking mode',
      'stop walking mode',
    ])) {
      unawaited(_setWalkingMode(false));
    } else if (TextUtils.containsAny(cmd, [
      'di bo',
      'buoc di',
      'walk',
      'walking',
    ])) {
      unawaited(_setWalkingMode(!_isWalkingModeEnabled));
    } else if (TextUtils.containsAny(cmd, [
      'tong hop',
      'tien',
      'general',
      'money',
    ])) {
      _goToMode(0);
    } else {
      _accessibilityManager.speak(
        AppLocalizations.t('main_unknown_command', _settings.language),
      );
    }
  }

  void _goToMode(int index) {
    _pageController.animateToPage(
      index,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
  }

  void _speakHelp() {
    _accessibilityManager.speak(
      AppLocalizations.t('main_help_spoken', _settings.language),
    );
  }

  Future<void> _toggleFlash({bool? forceOn}) async {
    final lang = _settings.language;
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      _accessibilityManager.speak(
        AppLocalizations.t('main_camera_not_ready', lang),
      );
      return;
    }

    try {
      final newState = forceOn ?? !_isFlashOn;
      await _cameraController!.setFlashMode(
        newState ? FlashMode.torch : FlashMode.off,
      );
      setState(() {
        _isFlashOn = newState;
      });
      _accessibilityManager.speak(
        newState
            ? AppLocalizations.t('main_flash_on', lang)
            : AppLocalizations.t('main_flash_off', lang),
      );
      _accessibilityManager.triggerSuccessVibration();
      _settings.setFlashOn(newState);
    } catch (_) {
      _accessibilityManager.speak(AppLocalizations.t('main_flash_error', lang));
      _accessibilityManager.triggerErrorVibration();
    }
  }

  void _openSettings() {
    _accessibilityManager.speak(
      AppLocalizations.t('main_open_settings', _settings.language),
    );
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const SettingsScreen()),
    ).then((_) {
      _accessibilityManager.refreshTtsSpeed();
    });
  }

  void _openHistory() {
    _accessibilityManager.speak(
      AppLocalizations.t('main_open_history', _settings.language),
    );
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const HistoryScreen()),
    );
  }

  Future<void> _setWalkingMode(bool enabled, {bool announce = true}) async {
    if (_isWalkingModeEnabled == enabled) return;

    if (enabled) {
      if (!_isConnected) {
        if (announce) {
          _accessibilityManager.speak(
            _settings.language == 'vi'
                ? 'Chế độ đi bộ cần kết nối mạng.'
                : 'Walking mode requires an internet connection.',
          );
          _accessibilityManager.triggerErrorVibration();
        }
        return;
      }
      _continuousStreamService.start();
      _startContinuousImageStream();
      _pulseController.repeat(reverse: true);
      if (mounted) {
        setState(() {
          _isWalkingModeEnabled = true;
          _walkingCurrentFps = _continuousStreamService.currentFps;
          _walkingNearestObstacle = '-';
          _walkingSafeDirection = '-';
        });
      }
      if (announce) {
        _accessibilityManager.speak(
          _settings.language == 'vi'
              ? 'Đã bật chế độ đi bộ'
              : 'Walking mode enabled',
        );
      }
      return;
    }

    _continuousStreamService.stop();
    _pulseController.stop();
    _pulseController.reset();
    await _stopContinuousImageStream();
    if (mounted) {
      setState(() => _isWalkingModeEnabled = false);
    }
    if (announce) {
      _accessibilityManager.speak(
        _settings.language == 'vi'
            ? 'Đã tắt chế độ đi bộ'
            : 'Walking mode disabled',
      );
    }
  }

  void _updateWalkingOverlayFromResult(Map<String, dynamic> result) {
    final dangerAlerts = (result['danger_alerts'] as List<dynamic>? ?? [])
        .whereType<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList();

    var nearestObstacle = '-';
    var safeDirection = '-';

    if (dangerAlerts.isNotEmpty) {
      final nearest = dangerAlerts.first;
      final label = nearest['label']?.toString() ?? '';
      final distance = nearest['distance']?.toString() ?? '';
      final position = nearest['position']?.toString() ?? '';
      nearestObstacle = '$label ${position.toLowerCase()} ${distance}m'.trim();
      safeDirection = _deriveSafeDirection(position);

      // Trigger Spatial Audio for the nearest obstacle
      final parsedDist = double.tryParse(distance.toString()) ?? 2.0;
      final centerXRatio = nearest['center_x_ratio'];
      _spatialAudioService.playDirectionalAlert(
        position: position,
        level: alertLevelFromDistance(parsedDist, label: label),
        distance: parsedDist,
        centerXRatio: centerXRatio is num ? centerXRatio.toDouble() : null,
      );
    } else {
      final text = (result['text']?.toString() ?? '').toLowerCase();
      if (text.contains('trái') || text.contains('left')) {
        safeDirection = _settings.language == 'vi' ? 'Đi trái' : 'Go left';
      } else if (text.contains('phải') || text.contains('right')) {
        safeDirection = _settings.language == 'vi' ? 'Đi phải' : 'Go right';
      } else if (text.contains('giữa') || text.contains('center')) {
        safeDirection = _settings.language == 'vi' ? 'Đi thẳng' : 'Go straight';
      }
    }

    if (!mounted) return;
    setState(() {
      _walkingNearestObstacle = nearestObstacle;
      _walkingSafeDirection = safeDirection;
    });
  }

  String _deriveSafeDirection(String positionText) {
    final lowered = positionText.toLowerCase();
    if (lowered.contains('\u0074\u0072\u00e1\u0069') ||
        lowered.contains('left')) {
      return _settings.language == 'vi' ? 'Đi phải' : 'Go right';
    }
    if (lowered.contains('\u0070\u0068\u1ea3\u0069') ||
        lowered.contains('right')) {
      return _settings.language == 'vi' ? 'Đi trái' : 'Go left';
    }
    return _settings.language == 'vi'
        ? 'Đi chậm, giữ giữa'
        : 'Slow down, keep center';
  }

  void _onPageChanged(int index) {
    final lang = _settings.language;
    setState(() => _currentModeIndex = index);
    _accessibilityManager.triggerSuccessVibration();
    _accessibilityManager.speak(
      AppLocalizations.t(_modeSpokenKey(index), lang),
    );

    // Khi chuyen sang tab khac voi Navigation thi dung dieu huong,
    // nhung khong tu mo man hinh navigation khi chi vuot qua tab.
    if (index != 4) {
      _navigationService.stopNavigation();
    }
  }

  void _openNavigationScreen() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const NavigationScreen()),
    ).then((_) {
      // User backed out of navigation screen
      _navigationService.stopNavigation();
      _goToMode(0); // return to default mode or stay in 4? stay in 0 is safer
    });
  }

  Future<void> _handleDoubleTap() async {
    if (_isScanningMLKit || _isProcessing) return;
    if (_isWalkingModeEnabled) {
      await _setWalkingMode(false, announce: false);
    }

    switch (_currentModeIndex) {
      case 0:
        // Money detection priority:
        // 1) If connected to AI backend -> use AI worker first.
        // 2) If offline -> use on-device TFLite model.
        if (_isConnected) {
          _aiService.requestMoneyDetection();
        } else {
          final isReady = await _ensureOfflineModelLoaded(
            notifyOnFreshLoad: true,
          );
          if (isReady) {
            await _detectMoneyOffline();
          } else {
            _accessibilityManager.speak(
              AppLocalizations.t('main_no_offline_model', _settings.language),
            );
            _accessibilityManager.triggerErrorVibration();
          }
        }
        break;
      case 1:
        _scanWithMLKit();
        break;
      case 2:
        _aiService.requestOnlineOCR();
        break;
      case 3:
        _aiService.requestCaptioning();
        break;
      case 4:
        _accessibilityManager.speak(
          AppLocalizations.t('main_navigating', _settings.language),
        );
        _navigationService.startNavigation();
        _openNavigationScreen();
        break;
      case 5:
        _pickAndReadFile();
        break;
    }
  }

  void _handleLongPress() {
    _voiceCommandService.startListening();
  }

  Future<void> _pickAndReadFile() async {
    final lang = _settings.language;
    _accessibilityManager.speak(AppLocalizations.t('main_reading_file', lang));

    try {
      final text = await _documentReaderService.pickAndExtractText();
      if (text == null) {
        // User canceled
        return;
      }

      if (text.isEmpty) {
        _accessibilityManager.speak(
          AppLocalizations.t('main_file_empty', lang),
        );
        return;
      }

      // Speak the text
      _accessibilityManager.speak(_sanitizeForTts(text));
    } catch (e) {
      debugPrint('Lỗi đọc file: $e');
      if (e.toString().contains('Unsupported format')) {
        _accessibilityManager.speak(
          AppLocalizations.t('main_file_unsupported', lang),
        );
      } else {
        _accessibilityManager.speak(
          AppLocalizations.t('main_file_error', lang),
        );
      }
    }
  }

  Future<void> _startVisualQA(BuildContext context) async {
    _accessibilityManager.speak(
      _settings.language == 'vi' ? 'Đang nghe...' : 'Listening...',
    );
    // You'd typically start listening for stt here and store the question
    // For simplicity with this current UI structure, we use VoiceCommandService
    _voiceCommandService.startListening();
  }

  Future<void> _stopVisualQA(BuildContext context) async {
    _voiceCommandService.stopListening();

    // We would need the recognized question here.
    // Since _onCommandRecognized handles all voice input, we'd need a state variable to know we are in QA mode.
    // Let's implement a simpler approach: take a picture and send it with an empty question to just describe it
    // Or, we can just use the standard requestCaptioning here if the architecture is limiting.

    final frameBytes = await _captureCurrentFrame();
    if (frameBytes != null) {
      _accessibilityManager.speak("Đang phân tích hình ảnh...");
      _wsService.sendVisualQA(
        frame: frameBytes,
        lang: _settings.language,
        question: "Hãy mô tả chi tiết bức ảnh này.",
      );
    } else {
      _accessibilityManager.speak("Không thể chụp ảnh.");
    }
  }

  Future<void> _scanWithMLKit() async {
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      return;
    }

    setState(() => _isScanningMLKit = true);
    final lang = _settings.language;
    _accessibilityManager.speak(AppLocalizations.t('main_scanning', lang));
    _accessibilityManager.triggerSuccessVibration();

    try {
      final file = await _cameraController!.takePicture().timeout(
        _captureTimeout,
      );
      await _mlKitService.processImageFile(file.path);
    } on TimeoutException catch (_) {
      debugPrint('[Camera] MLKit capture timeout');
      _accessibilityManager.speak(AppLocalizations.t('main_no_capture', lang));
      _accessibilityManager.triggerErrorVibration();
      _restartCamera();
    } catch (e) {
      debugPrint('Lỗi khi quét ML Kit: $e');
      _accessibilityManager.speak(
        lang == 'vi'
            ? 'Không thể quét offline. Vui lòng thử lại.'
            : 'Unable to scan offline. Please try again.',
      );
      _accessibilityManager.triggerErrorVibration();
    } finally {
      if (mounted) {
        setState(() => _isScanningMLKit = false);
      }
    }
  }

  Future<void> _detectMoneyOffline() async {
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      return;
    }

    final modelReady = await _ensureOfflineModelLoaded();
    if (!modelReady) {
      _accessibilityManager.speak(
        AppLocalizations.t('main_no_offline_model', _settings.language),
      );
      _accessibilityManager.triggerErrorVibration();
      return;
    }

    setState(() => _isProcessing = true);
    final lang = _settings.language;
    _accessibilityManager.triggerSuccessVibration();

    try {
      final bytes = await _captureCurrentFrame();
      if (bytes == null) {
        _accessibilityManager.speak(
          AppLocalizations.t('main_no_capture', lang),
        );
        return;
      }

      final result = await _tfliteService.detectMoney(bytes);
      if (result != null) {
        _accessibilityManager.speak(result);
      } else {
        _accessibilityManager.speak(
          AppLocalizations.t('main_no_offline_model', lang),
        );
      }
    } catch (e) {
      debugPrint('TFLite offline error: $e');
      _accessibilityManager.speak(
        AppLocalizations.t('main_offline_error', lang),
      );
    } finally {
      if (mounted) {
        setState(() => _isProcessing = false);
      }
    }
  }

  void _showFeedbackPrompt(String detectionId) {
    _feedbackTimer?.cancel();
    if (!mounted) return;
    setState(() => _pendingFeedbackDetectionId = detectionId);
    _feedbackTimer = Timer(const Duration(seconds: 5), () {
      if (!mounted) return;
      setState(() => _pendingFeedbackDetectionId = null);
    });
  }

  Future<void> _submitFeedback(bool isCorrect) async {
    final detectionId = _pendingFeedbackDetectionId;
    if (detectionId == null) return;

    final frame = _aiService.lastFrameForFeedback;
    final imageBase64 = (!isCorrect && frame != null)
        ? base64Encode(frame)
        : null;

    try {
      await _feedbackService.submitFeedback(
        detectionId: detectionId,
        isCorrect: isCorrect,
        imageBase64: imageBase64,
      );
      _accessibilityManager.speak(
        isCorrect ? 'Đã ghi nhận đúng' : 'Đã ghi nhận sai',
      );
    } catch (_) {
      _accessibilityManager.speak('Không gửi được phản hồi');
    } finally {
      if (mounted) {
        setState(() => _pendingFeedbackDetectionId = null);
      }
    }
  }

  void _startSosHold(LongPressStartDetails details) {
    _sosHoldProgressTimer?.cancel();
    _sosHoldCompleteTimer?.cancel();
    if (!mounted) return;

    // Phan hoi rung 3 lan ngay khi bat dau nhan giu (keo dai ~1.7 giay)
    // de tao cam giac thuc hien cau cuu
    _accessibilityManager.triggerSOSVibration();

    final startedAt = DateTime.now();
    setState(() => _sosHoldProgress = 0);
    _sosHoldProgressTimer = Timer.periodic(const Duration(milliseconds: 100), (
      _,
    ) {
      final elapsed = DateTime.now().difference(startedAt).inMilliseconds;
      final progress = (elapsed / 3000).clamp(0, 1).toDouble();
      if (!mounted) return;
      setState(() => _sosHoldProgress = progress);
    });

    _sosHoldCompleteTimer = Timer(const Duration(seconds: 3), () {
      _sosHoldProgressTimer?.cancel();
      if (mounted) {
        setState(() => _sosHoldProgress = 1);
      }
      _triggerSosAlert();
    });
  }

  void _cancelSosHold() {
    _sosHoldProgressTimer?.cancel();
    _sosHoldCompleteTimer?.cancel();
    _accessibilityManager.stopVibration();
    if (!mounted) return;
    setState(() => _sosHoldProgress = 0);
  }

  Future<void> _triggerSosAlert() async {
    final frame = await _captureCurrentFrame();
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
      _wsService.sendSosAlert(
        latitude: position.latitude,
        longitude: position.longitude,
        imageBase64: frame != null ? base64Encode(frame) : null,
      );
      _accessibilityManager.speak('Đã gửi cảnh báo SOS');
    } else {
      _accessibilityManager.speak('Không lấy được vị trí SOS');
    }

    _sosService.triggerEmergency(countdownSeconds: 3);
    if (mounted) {
      setState(() => _sosHoldProgress = 0);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          if (_cameraController != null &&
              _cameraController!.value.isInitialized)
            Positioned.fill(child: CameraPreview(_cameraController!)),

          if (_isWalkingModeEnabled)
            Positioned.fill(
              child: AnimatedBuilder(
                animation: _pulseController,
                builder: (context, child) {
                  return Container(
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: AppTheme.accentCyan.withValues(
                          alpha: 0.1 + (_pulseController.value * 0.4),
                        ),
                        width: 4 * _pulseController.value,
                      ),
                    ),
                  );
                },
              ),
            ),

          Positioned.fill(
            child: GestureDetector(
              onDoubleTap: () => unawaited(_handleDoubleTap()),
              onLongPress: _handleLongPress,
              child: ModeCarousel(
                pageController: _pageController,
                onPageChanged: _onPageChanged,
                modes: _getModes(_settings.language),
                modeIcons: _modeIcons,
              ),
            ),
          ),

          if (_isWalkingModeEnabled)
            Positioned(
              top: MediaQuery.of(context).padding.top + 46,
              left: 16,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: AppTheme.glassDecoration(
                  borderRadius: 12,
                  opacity: 0.6,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${_settings.language == 'vi' ? 'ĐI BỘ' : 'WALK'} - $_walkingCurrentFps FPS',
                      style: const TextStyle(
                        color: AppTheme.accentGreen,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      '${_settings.language == 'vi' ? 'Vật cản gần nhất' : 'Nearest'}: $_walkingNearestObstacle',
                      style: const TextStyle(color: Colors.white, fontSize: 12),
                    ),
                    Text(
                      '${_settings.language == 'vi' ? 'Hướng an toàn' : 'Safe'}: $_walkingSafeDirection',
                      style: const TextStyle(
                        color: AppTheme.accentCyan,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ),

          StatusOverlay(
            isConnected: _isConnected,
            isFlashOn: _isFlashOn,
            isNightMode: _isNightMode,
            onlineText: AppLocalizations.t('main_online', _settings.language),
            offlineText: AppLocalizations.t('main_offline', _settings.language),
            nightText: AppLocalizations.t('main_night', _settings.language),
            flashText: AppLocalizations.t('main_flash', _settings.language),
          ),

          if (_dangerMessage != null)
            Positioned(
              top: MediaQuery.of(context).padding.top + 70,
              left: 16,
              right: 16,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  vertical: 16,
                  horizontal: 20,
                ),
                decoration: BoxDecoration(
                  color: AppTheme.accentRed.withValues(alpha: 0.95),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.white70, width: 2),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.accentRed.withValues(alpha: 0.5),
                      blurRadius: 20,
                      spreadRadius: 4,
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.warning_amber_rounded,
                      color: Colors.white,
                      size: 36,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        _dangerMessage!.toUpperCase(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

          if (_isProcessing || _isScanningMLKit)
            Positioned.fill(
              child: Container(
                color: Colors.black.withValues(alpha: 0.5),
                child: Center(
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 32,
                      vertical: 28,
                    ),
                    decoration: AppTheme.glassDecoration(
                      borderRadius: 24,
                      opacity: 0.6,
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const SizedBox(
                          width: 48,
                          height: 48,
                          child: CircularProgressIndicator(
                            color: AppTheme.accentCyan,
                            strokeWidth: 3,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          _isScanningMLKit
                              ? AppLocalizations.t(
                                  'main_scanning',
                                  _settings.language,
                                )
                              : AppLocalizations.t(
                                  'main_processing',
                                  _settings.language,
                                ),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),

          if (_pendingFeedbackDetectionId != null)
            Positioned(
              bottom: 180,
              left: 16,
              right: 16,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 14,
                ),
                decoration:
                    AppTheme.glassDecoration(
                      borderRadius: 18,
                      opacity: 0.75,
                    ).copyWith(
                      border: Border.all(
                        color: AppTheme.accentPurple.withValues(alpha: 0.3),
                      ),
                    ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Kết quả AI có đúng không?',
                        style: AppTheme.bodyMedium.copyWith(
                          color: Colors.white,
                          fontSize: 14,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    _FeedbackChip(
                      label: 'Đúng',
                      color: AppTheme.accentGreen,
                      onTap: () => _submitFeedback(true),
                    ),
                    const SizedBox(width: 8),
                    _FeedbackChip(
                      label: 'Sai',
                      color: AppTheme.accentRed,
                      onTap: () => _submitFeedback(false),
                    ),
                  ],
                ),
              ),
            ),

          Positioned(
            top: MediaQuery.of(context).padding.top + 14,
            right: 16,
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () => unawaited(_setWalkingMode(!_isWalkingModeEnabled)),
                borderRadius: BorderRadius.circular(22),
                child: Container(
                  constraints: const BoxConstraints(minWidth: 156),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 11,
                  ),
                  decoration: BoxDecoration(
                    color: _isWalkingModeEnabled
                        ? AppTheme.accentGreen.withValues(alpha: 0.45)
                        : Colors.black.withValues(alpha: 0.55),
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(
                      color: _isWalkingModeEnabled
                          ? AppTheme.accentGreen
                          : AppTheme.accentPurple.withValues(alpha: 0.45),
                      width: 1.6,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: _isWalkingModeEnabled
                            ? AppTheme.accentGreen.withValues(alpha: 0.3)
                            : Colors.black.withValues(alpha: 0.22),
                        blurRadius: 16,
                        spreadRadius: 1,
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.15),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.directions_walk_rounded,
                          color: Colors.white,
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        _settings.language == 'vi'
                            ? (_isWalkingModeEnabled
                                  ? 'TẮT ĐI BỘ'
                                  : 'BẬT ĐI BỘ')
                            : (_isWalkingModeEnabled
                                  ? 'STOP WALK'
                                  : 'START WALK'),
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                          letterSpacing: 0.2,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          Positioned(
            bottom: 130,
            right: 16,
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: _openSettings,
                borderRadius: BorderRadius.circular(28),
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.5),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: AppTheme.accentPurple.withValues(alpha: 0.4),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.accentPurple.withValues(alpha: 0.3),
                        blurRadius: 14,
                        spreadRadius: 1,
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.settings_rounded,
                    color: AppTheme.accentCyan,
                    size: 26,
                  ),
                ),
              ),
            ),
          ),

          Positioned(
            bottom: 130,
            left: 16,
            child: GestureDetector(
              onLongPressStart: _startSosHold,
              onLongPressEnd: (_) => _cancelSosHold(),
              onLongPressCancel: _cancelSosHold,
              child: Container(
                width: 70,
                height: 70,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      AppTheme.accentRed,
                      AppTheme.accentRed.withValues(alpha: 0.85),
                    ],
                  ),
                  border: Border.all(color: Colors.white70, width: 2.5),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.accentRed.withValues(alpha: 0.6),
                      blurRadius: 18,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    CircularProgressIndicator(
                      value: _sosHoldProgress,
                      strokeWidth: 4,
                      valueColor: const AlwaysStoppedAnimation<Color>(
                        Colors.white,
                      ),
                      backgroundColor: Colors.white24,
                    ),
                    const Text(
                      'SOS',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 18,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          Positioned(
            bottom: 130,
            left: MediaQuery.of(context).size.width / 2 - 38,
            child: VisualQAButton(
              language: _settings.language,
              onStartRecording: _startVisualQA,
              onStopRecording: _stopVisualQA,
            ),
          ),

          Positioned(
            bottom: 40,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                _getModes(_settings.language).length,
                (index) => Container(
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  width: _currentModeIndex == index ? 24 : 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: _currentModeIndex == index
                        ? AppTheme.accentPurple
                        : AppTheme.whiteAlpha(0.5),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<Uint8List?> _captureCurrentFrame() async {
    final controller = _cameraController;
    if (controller == null ||
        !controller.value.isInitialized ||
        _isCapturing ||
        controller.value.isTakingPicture) {
      return null;
    }

    if (controller.value.isStreamingImages) {
      await _stopContinuousImageStream();
      if (controller.value.isStreamingImages ||
          controller.value.isTakingPicture) {
        return null;
      }
    }

    try {
      _isCapturing = true;
      final image = await controller.takePicture().timeout(_captureTimeout);
      return await image.readAsBytes();
    } on TimeoutException catch (_) {
      debugPrint('[Camera] Capture timeout');
      _restartCamera();
      return null;
    } catch (_) {
      return null;
    } finally {
      if (mounted) {
        _isCapturing = false;
      }
    }
  }

  void _startContinuousImageStream() {
    final controller = _cameraController;
    if (controller == null || !controller.value.isInitialized) return;
    if (controller.value.isStreamingImages) return;

    try {
      controller.startImageStream((CameraImage image) {
        if (_continuousStreamService.isStreaming) {
          _continuousStreamService.onLatestCameraImage(image);
        }
      });
    } catch (e) {
      debugPrint('[Camera] Failed to startImageStream: $e');
    }
  }

  Future<void> _stopContinuousImageStream() async {
    final controller = _cameraController;
    if (controller == null || !controller.value.isInitialized) return;
    if (!controller.value.isStreamingImages) return;
    if (_stopImageStreamFuture != null) {
      await _stopImageStreamFuture;
      return;
    }

    final completer = Completer<void>();
    _stopImageStreamFuture = completer.future;
    try {
      await controller.stopImageStream();
    } catch (e) {
      debugPrint('[Camera] Failed to stopImageStream: $e');
    } finally {
      completer.complete();
      _stopImageStreamFuture = null;
    }
  }

  Future<void> _restartCamera() async {
    if (_isRestartingCamera) return;
    final cams = widget.cameras;
    if (cams == null || cams.isEmpty) return;

    _isRestartingCamera = true;
    try {
      _lightSensor.stop();
      final oldController = _cameraController;
      _cameraController = null;
      await oldController?.dispose();

      final controller = CameraController(
        cams.first,
        ResolutionPreset.medium,
        enableAudio: false,
      );
      await controller.initialize();

      if (!mounted) {
        await controller.dispose();
        return;
      }

      setState(() => _cameraController = controller);
      _lightSensor.startMonitoring(controller);
    } catch (e) {
      debugPrint('[Camera] Restart failed: $e');
    } finally {
      _isRestartingCamera = false;
    }
  }
}

class _FeedbackChip extends StatelessWidget {
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _FeedbackChip({
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.25),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: color.withValues(alpha: 0.6)),
          ),
          child: Text(
            label,
            style: TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ),
    );
  }
}
