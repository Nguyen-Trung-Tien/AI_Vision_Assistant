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
import 'package:mobile_app/services/light_sensor_service.dart';
import 'package:mobile_app/services/ml_kit_service.dart';
import 'package:mobile_app/services/navigation_service.dart';
import 'package:mobile_app/services/power_button_service.dart';
import 'package:mobile_app/services/settings_service.dart';
import 'package:mobile_app/services/sos_service.dart';
import 'package:mobile_app/services/tflite_service.dart';
import 'package:mobile_app/services/voice_command_service.dart';
import 'package:mobile_app/services/volume_button_service.dart';
import 'package:mobile_app/services/websocket_service.dart';
import 'package:mobile_app/l10n/app_localizations.dart';
import 'package:mobile_app/utils/text_utils.dart';
import 'package:mobile_app/widgets/status_overlay.dart';
import 'package:mobile_app/widgets/mode_carousel.dart';

class MainScreen extends StatefulWidget {
  final List<CameraDescription>? cameras;

  const MainScreen({super.key, this.cameras});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  late WebSocketService _wsService;
  late EdgeAIService _aiService;
  final AccessibilityManager _accessibilityManager = AccessibilityManager();
  final MlKitService _mlKitService = MlKitService();
  late VoiceCommandService _voiceCommandService;
  final NavigationService _navigationService = NavigationService();
  final SosService _sosService = SosService();
  final FeedbackService _feedbackService = FeedbackService();
  final SettingsService _settings = SettingsService();
  late PowerButtonService _powerButtonService;
  late VolumeButtonService _volumeButtonService;

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
  bool _isScanningMLKit = false;

  final LightSensorService _lightSensor = LightSensorService();
  final TfliteService _tfliteService = TfliteService();
  bool _isNightMode = false;
  String? _pendingFeedbackDetectionId;
  Timer? _feedbackTimer;
  double _sosHoldProgress = 0;
  Timer? _sosHoldProgressTimer;
  Timer? _sosHoldCompleteTimer;

  final List<IconData> _modeIcons = [
    Icons.auto_awesome,
    Icons.text_fields,
    Icons.document_scanner,
    Icons.landscape,
    Icons.navigation,
  ];

  // Replace with a getter
  List<String> _getModes(String lang) {
    return [
      AppLocalizations.t('mode_0', lang),
      AppLocalizations.t('mode_1', lang),
      AppLocalizations.t('mode_2', lang),
      AppLocalizations.t('mode_3', lang),
      AppLocalizations.t('mode_4', lang),
    ];
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
      }
    };
    _aiService.onAIResultReceived = (result) {
      final detectionId = result['detectionId']?.toString();
      if (detectionId == null || detectionId.isEmpty) return;
      _showFeedbackPrompt(detectionId);
    };

    _aiService.start();

    _tfliteService.loadModel();

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

  @override
  void dispose() {
    _dangerTimer?.cancel();
    _feedbackTimer?.cancel();
    _sosHoldProgressTimer?.cancel();
    _sosHoldCompleteTimer?.cancel();
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
      _goToMode(1);
    } else if (TextUtils.containsAny(cmd, ['nhanh', 'offline', 'quick read'])) {
      _goToMode(2);
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
    } else if (TextUtils.containsAny(cmd, ['tong hop', 'tien', 'general', 'money'])) {
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

  void _onPageChanged(int index) {
    final lang = _settings.language;
    setState(() => _currentModeIndex = index);
    _accessibilityManager.triggerSuccessVibration();
    _accessibilityManager.speak(
      AppLocalizations.t('mode_${index}_spoken', lang),
    );

    if (index == 4) {
      _navigationService.startNavigation();
    } else {
      _navigationService.stopNavigation();
    }
  }

  void _handleDoubleTap() {
    if (_isScanningMLKit || _isProcessing) return;

    switch (_currentModeIndex) {
      case 0:
        if (!_isConnected && _tfliteService.isModelLoaded) {
          _detectMoneyOffline();
        } else {
          _aiService.requestMoneyDetection();
        }
        break;
      case 1:
        _aiService.requestOnlineOCR();
        break;
      case 2:
        _scanWithMLKit();
        break;
      case 3:
        _aiService.requestCaptioning();
        break;
      case 4:
        _accessibilityManager.speak(
          AppLocalizations.t('main_navigating', _settings.language),
        );
        _navigationService.startNavigation();
        break;
    }
  }

  void _handleLongPress() {
    _voiceCommandService.startListening();
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
      final file = await _cameraController!
          .takePicture()
          .timeout(_captureTimeout);
      await _mlKitService.processImageFile(file.path);
    } on TimeoutException catch (_) {
      debugPrint('[Camera] MLKit capture timeout');
      _accessibilityManager.speak(
        AppLocalizations.t('main_no_capture', lang),
      );
      _accessibilityManager.triggerErrorVibration();
      _restartCamera();
    } catch (e) {
      debugPrint('Lỗi khi quét ML Kit: $e');
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

    setState(() => _isProcessing = true);
    final lang = _settings.language;
    _accessibilityManager.speak(
      AppLocalizations.t('main_detecting_offline', lang),
    );
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
    final imageBase64 = (!isCorrect && frame != null) ? base64Encode(frame) : null;

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

    final startedAt = DateTime.now();
    setState(() => _sosHoldProgress = 0);
    _sosHoldProgressTimer = Timer.periodic(const Duration(milliseconds: 100), (_) {
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

          Positioned.fill(
            child: GestureDetector(
              onDoubleTap: _handleDoubleTap,
              onLongPress: _handleLongPress,
              child: ModeCarousel(
                pageController: _pageController,
                onPageChanged: _onPageChanged,
                modes: _getModes(_settings.language),
                modeIcons: _modeIcons,
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
              top: 100,
              left: 16,
              right: 16,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  vertical: 16,
                  horizontal: 20,
                ),
                decoration: BoxDecoration(
                  color: Colors.redAccent.withValues(alpha: 0.9),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.white, width: 2),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.red.withValues(alpha: 0.5),
                      blurRadius: 20,
                      spreadRadius: 5,
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
                color: Colors.black.withValues(alpha: 0.4),
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const SizedBox(
                        width: 48,
                        height: 48,
                        child: CircularProgressIndicator(
                          color: Color(0xFF6C63FF),
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

          if (_pendingFeedbackDetectionId != null)
            Positioned(
              bottom: 180,
              left: 16,
              right: 16,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.72),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.white24),
                ),
                child: Row(
                  children: [
                    const Expanded(
                      child: Text(
                        'Kết quả AI có đúng không?',
                        style: TextStyle(color: Colors.white, fontSize: 14),
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      onPressed: () => _submitFeedback(true),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        foregroundColor: Colors.white,
                        minimumSize: const Size(44, 36),
                      ),
                      child: const Text('Đúng'),
                    ),
                    const SizedBox(width: 6),
                    ElevatedButton(
                      onPressed: () => _submitFeedback(false),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red,
                        foregroundColor: Colors.white,
                        minimumSize: const Size(44, 36),
                      ),
                      child: const Text('Sai'),
                    ),
                  ],
                ),
              ),
            ),

          Positioned(
            bottom: 74,
            left: 0,
            right: 0,
            child: Wrap(
              alignment: WrapAlignment.center,
              spacing: 8,
              runSpacing: 8,
              children: [
                _HintChip(
                  icon: Icons.touch_app,
                  label: AppLocalizations.t(
                    'main_hint_double_tap',
                    _settings.language,
                  ),
                ),
                _HintChip(
                  icon: Icons.mic,
                  label: AppLocalizations.t(
                    'main_hint_hold',
                    _settings.language,
                  ),
                ),
                _HintChip(
                  icon: Icons.swipe,
                  label: AppLocalizations.t(
                    'main_hint_swipe',
                    _settings.language,
                  ),
                ),
              ],
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
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.55),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.18),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF6C63FF).withValues(alpha: 0.28),
                        blurRadius: 12,
                        spreadRadius: 1,
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.settings,
                    color: Color(0xFF00D4FF),
                    size: 24,
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
                width: 68,
                height: 68,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.red.shade700,
                  border: Border.all(color: Colors.white70, width: 2),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.red.withValues(alpha: 0.6),
                      blurRadius: 16,
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
                        ? const Color(0xFF6C63FF)
                        : Colors.white54,
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

class _HintChip extends StatelessWidget {
  final IconData icon;
  final String label;

  const _HintChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.45),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: const Color(0xFF00D4FF)),
          const SizedBox(width: 5),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
