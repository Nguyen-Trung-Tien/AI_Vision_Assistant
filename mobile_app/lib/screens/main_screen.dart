import 'dart:async';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:mobile_app/services/accessibility_manager.dart';
import 'package:mobile_app/services/edge_ai_service.dart';
import 'package:mobile_app/services/websocket_service.dart';
import 'package:mobile_app/services/tflite_service.dart';
import 'package:mobile_app/services/ml_kit_service.dart';
import 'package:mobile_app/services/voice_command_service.dart';
import 'package:mobile_app/services/navigation_service.dart';
import 'package:mobile_app/services/sos_service.dart';
import 'package:mobile_app/services/power_button_service.dart';
import 'package:mobile_app/services/volume_button_service.dart';
import 'package:mobile_app/services/settings_service.dart';
import 'package:mobile_app/services/light_sensor_service.dart';
import 'package:mobile_app/screens/settings_screen.dart';
import 'package:mobile_app/screens/history_screen.dart';
import 'dart:typed_data';

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
  final SettingsService _settings = SettingsService();
  late PowerButtonService _powerButtonService;
  late VolumeButtonService _volumeButtonService;

  CameraController? _cameraController;
  bool _isCapturing = false;
  bool _isFlashOn = false;
  bool _isConnected = false;
  bool _isProcessing = false;

  final PageController _pageController = PageController();
  int _currentModeIndex = 0;
  bool _isScanningMLKit = false;

  final LightSensorService _lightSensor = LightSensorService();
  final TfliteService _tfliteService = TfliteService();
  bool _isNightMode = false;

  final List<IconData> _modeIcons = [
    Icons.auto_awesome,
    Icons.text_fields,
    Icons.document_scanner,
    Icons.landscape,
    Icons.navigation,
  ];

  final List<String> _modes = [
    'Chế độ nhận diện tổng hợp',
    'Chế độ đọc văn bản (Online)',
    'Chế độ đọc chữ nhanh (Offline)',
    'Chế độ mô tả không gian',
    'Chế độ định vị và định hướng',
  ];

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
    _wsService.connect();

    _aiService = EdgeAIService(_wsService, _captureCurrentFrame);
    _aiService.onProcessingStateChanged = (isProcessing) {
      if (mounted) {
        setState(() => _isProcessing = isProcessing);
      }
    };
    _aiService.start();

    // Load TFLite model for offline fallback
    _tfliteService.loadModel();

    _voiceCommandService = VoiceCommandService(
      onCommandRecognized: _onCommandRecognized,
    );
    _voiceCommandService.init();

    _initSosDetection();

    // Jump to saved default mode
    final defaultMode = _settings.defaultModeIndex;
    if (defaultMode > 0 && defaultMode < _modes.length) {
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

        final settings = SettingsService();
        if (isLowLight && settings.autoFlashEnabled && !_isFlashOn) {
          _toggleFlash(forceOn: true);
        } else if (!isLowLight && _isFlashOn && settings.autoFlashEnabled) {
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

  // Voice Commands
  void _onCommandRecognized(String command) {
    final cmd = command.toLowerCase();

    // SOS - highest priority
    if (cmd.contains('khẩn cấp') ||
        cmd.contains('cứu tôi') ||
        cmd.contains('cứu với') ||
        cmd.contains('giúp tôi')) {
      _sosService.triggerEmergency();
      return;
    }

    // Navigation commands
    if (cmd.contains('cài đặt')) {
      _openSettings();
    } else if (cmd.contains('lịch sử')) {
      _openHistory();
    } else if (cmd.contains('đèn') || cmd.contains('flash')) {
      _toggleFlash();
    } else if (cmd.contains('trợ giúp') || cmd.contains('giúp đỡ')) {
      _speakHelp();
    } else if (cmd.contains('đọc') && cmd.contains('văn bản')) {
      _goToMode(1);
    } else if (cmd.contains('nhanh') || cmd.contains('offline')) {
      _goToMode(2);
    } else if (cmd.contains('mô tả') || cmd.contains('không gian')) {
      _goToMode(3);
    } else if (cmd.contains('định hướng') || cmd.contains('định vị')) {
      _goToMode(4);
    } else if (cmd.contains('tổng hợp') || cmd.contains('tiền')) {
      _goToMode(0);
    } else {
      _accessibilityManager.speak(
        'Không hiểu lệnh. Nói "trợ giúp" để nghe danh sách lệnh.',
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
      'Các lệnh có sẵn: '
      'đọc văn bản, đọc chữ nhanh, mô tả không gian, định hướng, tổng hợp, '
      'cài đặt, lịch sử, đèn, khẩn cấp, trợ giúp.',
    );
  }

  // Flash Toggle
  Future<void> _toggleFlash({bool? forceOn}) async {
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      _accessibilityManager.speak('Camera chưa sẵn sàng.');
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
        newState ? 'Đã bật đèn flash' : 'Đã tắt đèn flash',
      );
      _accessibilityManager.triggerSuccessVibration();
      SettingsService().setFlashOn(newState);
    } catch (e) {
      _accessibilityManager.speak('Không thể điều khiển đèn flash.');
      _accessibilityManager.triggerErrorVibration();
    }
  }

  // Screen Navigation
  void _openSettings() {
    _accessibilityManager.speak('Mở cài đặt');
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const SettingsScreen()),
    ).then((_) {
      // Refresh TTS speed after returning from settings
      _accessibilityManager.refreshTtsSpeed();
    });
  }

  void _openHistory() {
    _accessibilityManager.speak('Mở lịch sử');
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const HistoryScreen()),
    );
  }

  // Gestures
  void _onPageChanged(int index) {
    setState(() => _currentModeIndex = index);
    _accessibilityManager.triggerSuccessVibration();
    _accessibilityManager.speak(_modes[index]);

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
        // Mode 1: Online OCR - gui frame len server
        _aiService.requestOnlineOCR();
        break;
      case 2:
        // Mode 2: Offline - xu ly tren thiet bi bang ML Kit
        _scanWithMLKit();
        break;
      case 3:
        _aiService.requestCaptioning();
        break;
      case 4:
        _accessibilityManager.speak('Đang định vị...');
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
    _accessibilityManager.speak('Đang quét...');
    _accessibilityManager.triggerSuccessVibration();

    try {
      final file = await _cameraController!.takePicture();
      await _mlKitService.processImageFile(file.path);
    } catch (e) {
      debugPrint('Loi khi quet ML Kit: $e');
    } finally {
      if (mounted) {
        setState(() => _isScanningMLKit = false);
      }
    }
  }

  // TFLite Offline Detection
  Future<void> _detectMoneyOffline() async {
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      return;
    }

    setState(() => _isProcessing = true);
    _accessibilityManager.speak('Đang nhận diện offline...');
    _accessibilityManager.triggerSuccessVibration();

    try {
      final bytes = await _captureCurrentFrame();
      if (bytes == null) {
        _accessibilityManager.speak('Không chụp được ảnh.');
        return;
      }

      final result = await _tfliteService.detectMoney(bytes);
      if (result != null) {
        _accessibilityManager.speak(result);
      } else {
        _accessibilityManager.speak(
          'Chưa có model offline. Vui lòng kết nối mạng để nhận diện.',
        );
      }
    } catch (e) {
      debugPrint('TFLite offline error: $e');
      _accessibilityManager.speak('Lỗi nhận diện offline.');
    } finally {
      if (mounted) {
        setState(() => _isProcessing = false);
      }
    }
  }

  // Build
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Camera Background
          if (_cameraController != null &&
              _cameraController!.value.isInitialized)
            Positioned.fill(child: CameraPreview(_cameraController!)),

          // Gesture overlay (PageView)
          Positioned.fill(
            child: GestureDetector(
              onDoubleTap: _handleDoubleTap,
              onLongPress: _handleLongPress,
              child: PageView.builder(
                controller: _pageController,
                onPageChanged: _onPageChanged,
                itemCount: _modes.length,
                itemBuilder: (context, index) {
                  return Container(
                    color: Colors.black.withOpacity(0.3),
                    alignment: Alignment.center,
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 24),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 22,
                        vertical: 18,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.45),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.white.withOpacity(0.15)),
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            _modeIcons[index],
                            color: const Color(0xFF6C63FF),
                            size: 46,
                          ),
                          const SizedBox(height: 12),
                          Text(
                            _modes[index].toUpperCase(),
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              shadows: [
                                Shadow(
                                  blurRadius: 10.0,
                                  color: Colors.black87,
                                  offset: Offset(2.0, 2.0),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ),

          // Connection Status Indicator (top-left)
          Positioned(
            top: 50,
            left: 16,
            child: Row(
              children: [
                Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: _isConnected
                        ? const Color(0xFF00E676)
                        : const Color(0xFFFF5252),
                    boxShadow: [
                      BoxShadow(
                        color:
                            (_isConnected
                                    ? const Color(0xFF00E676)
                                    : const Color(0xFFFF5252))
                                .withOpacity(0.6),
                        blurRadius: 8,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  _isConnected ? 'Online' : 'Offline',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.7),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),

          // Flash indicator (top-right)
          if (_isFlashOn || _isNightMode)
            Positioned(
              top: 50,
              right: 16,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: Colors.amber.withOpacity(0.8),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      _isNightMode ? Icons.nights_stay : Icons.flashlight_on,
                      color: Colors.black,
                      size: 16,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      _isNightMode ? 'NIGHT' : 'FLASH',
                      style: const TextStyle(
                        color: Colors.black,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),

          // Loading indicator overlay
          if (_isProcessing || _isScanningMLKit)
            Positioned.fill(
              child: Container(
                color: Colors.black.withOpacity(0.4),
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
                        _isScanningMLKit ? 'Đang quét...' : 'Đang xử lý...',
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

          Positioned(
            bottom: 74,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: const [
                _HintChip(
                  icon: Icons.touch_app,
                  label: 'Nhấn đúp',
                ),
                SizedBox(width: 8),
                _HintChip(
                  icon: Icons.mic,
                  label: 'Giữ để nói',
                ),
                SizedBox(width: 8),
                _HintChip(
                  icon: Icons.swipe,
                  label: 'Vuốt để đổi chế độ',
                ),
              ],
            ),
          ),

          // Pagination Indicators
          Positioned(
            bottom: 40,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                _modes.length,
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
      final image = await controller.takePicture();
      return await image.readAsBytes();
    } catch (_) {
      return null;
    } finally {
      if (mounted) {
        _isCapturing = false;
      }
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
        color: Colors.black.withOpacity(0.45),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withOpacity(0.12)),
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
