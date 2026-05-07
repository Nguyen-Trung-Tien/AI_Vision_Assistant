import 'dart:async';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:mobile_app/controllers/main_controller.dart';
import 'package:mobile_app/controllers/walking_mode_controller.dart';
import 'package:mobile_app/controllers/voice_command_controller.dart';
import 'package:mobile_app/controllers/sos_controller.dart';
import 'package:mobile_app/screens/face_register_screen.dart';
import 'package:mobile_app/services/edge_ai_service.dart';
import 'package:mobile_app/services/continuous_stream_service.dart';
import 'package:mobile_app/services/websocket_service.dart';
import 'package:mobile_app/services/offline_ota_service.dart';
import 'package:mobile_app/l10n/app_localizations.dart';
import 'package:mobile_app/theme/app_theme.dart';
import 'package:mobile_app/widgets/camera_preview_widget.dart';
import 'package:mobile_app/widgets/walking_overlay.dart';
import 'package:mobile_app/widgets/sos_button.dart';
import 'package:mobile_app/widgets/sos_success_overlay.dart';
import 'package:mobile_app/widgets/danger_banner.dart';
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
  late final MainController _ctrl;
  late final WalkingModeController _walkingCtrl;
  late final VoiceCommandController _voiceCtrl;
  late final SosController _sosCtrl;
  late final AnimationController _pulseController;

  @override
  void initState() {
    super.initState();

    _ctrl = MainController(cameras: widget.cameras);
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    );
    _walkingCtrl = WalkingModeController(
      ctrl: _ctrl,
      pulseController: _pulseController,
      onStateChanged: _refresh,
    );
    _voiceCtrl = VoiceCommandController(
      ctrl: _ctrl,
      walkingCtrl: _walkingCtrl,
      onNavigationRequested: () =>
          _ctrl.openNavigationScreen(context, onReturn: _refresh),
      onFaceRegisterRequested: () {},
      onOpenSettings: () => _ctrl.openSettings(context, onReturn: _refresh),
      onOpenHistory: () => _ctrl.openHistory(context, onReturn: _refresh),
      onSosTriggered: () => _sosCtrl.triggerSos(),
    );
    _sosCtrl = SosController(ctrl: _ctrl, onStateChanged: _refresh);

    _initServices();
  }

  void _refresh() {
    if (mounted) setState(() {});
  }

  void _initServices() {
    // WebSocket
    _ctrl.wsService = WebSocketService();
    if (_ctrl.settings.authToken.isNotEmpty) {
      _ctrl.wsService.setAuthToken(_ctrl.settings.authToken);
    }
    _ctrl.wsService.onConnectionStatus = (connected) {
      if (mounted) setState(() => _ctrl.isConnected = connected);
      if (!connected && _ctrl.isWalkingModeEnabled) {
        unawaited(_walkingCtrl.setWalkingMode(false, announce: false));
        _ctrl.accessibilityManager.speak(
          _ctrl.settings.language == 'vi'
              ? 'Mất kết nối mạng. Đã tắt chế độ đi bộ.'
              : 'Connection lost. Walking mode has been disabled.',
        );
      }
    };
    _ctrl.wsService.onTtsBroadcast = (data) {
      final message = data['message']?.toString().trim() ?? '';
      final priority = data['priority']?.toString().toLowerCase() ?? 'normal';
      if (message.isNotEmpty) {
        _ctrl.accessibilityManager.speakSystemMessage(
          'Thông báo hệ thống: $message',
          highPriority: priority == 'high' || priority == 'urgent',
        );
      }
    };
    if (_ctrl.settings.authToken.isEmpty) {
      _ctrl.wsService.connect();
    }

    // AI Service
    _ctrl.aiService = EdgeAIService(_ctrl.wsService, _ctrl.captureCurrentFrame);
    _ctrl.continuousStreamService = ContinuousStreamService(
      _ctrl.wsService,
      onFpsChanged: (fps) {
        if (!mounted) return;
        setState(() => _ctrl.walkingCurrentFps = fps);
      },
      onLowBatteryFpsActivated: () {
        _ctrl.accessibilityManager.speak(
          _ctrl.settings.language == 'vi'
              ? 'Pin yếu, giảm xuống 2 khung hình mỗi giây'
              : 'Low battery, reducing to 2 FPS',
        );
      },
    );
    _ctrl.aiService.onProcessingStateChanged = (isProcessing) {
      if (mounted) setState(() => _ctrl.isProcessing = isProcessing);
    };
    _ctrl.aiService.onDangerAlertDetected = (message, level) {
      if (mounted) {
        setState(() => _ctrl.dangerMessage = message);
        _ctrl.dangerTimer?.cancel();
        _ctrl.dangerTimer = Timer(const Duration(seconds: 4), () {
          if (mounted) setState(() => _ctrl.dangerMessage = null);
        });
        if (!_ctrl.isWalkingModeEnabled && message.isNotEmpty) {
          _ctrl.spatialAudioService.playDirectionalAlert(
            position: message,
            level: level,
            distance: _ctrl.settings.warningDistance,
          );
        }
      }
    };
    _ctrl.aiService.onAIResultReceived = (result) {
      if (result['taskType'] == 'visual_qa') {
        final text = result['text']?.toString() ?? '';
        if (text.isNotEmpty) {
          _ctrl.accessibilityManager.speak(_ctrl.sanitizeForTts(text));
        }
        return;
      }
      final taskType =
          result['taskType']?.toString() ??
          result['task_type']?.toString() ??
          '';
      if (taskType != 'CONTINUOUS') {
        final text = result['text']?.toString() ?? '';
        if (text.isNotEmpty) {
          _ctrl.accessibilityManager.speak(_ctrl.sanitizeForTts(text));
        }
      }
      _ctrl.continuousStreamService.onFrameResultReceived(
        taskType: taskType,
        frameSeq: (result['frameSeq'] as num?)?.toInt(),
      );
      if (_ctrl.isWalkingModeEnabled && taskType == 'CONTINUOUS') {
        _walkingCtrl.updateOverlayFromResult(result);
      }
      final detectionId = result['detectionId']?.toString();
      if (detectionId == null || detectionId.isEmpty) return;
      _ctrl.showFeedbackPrompt(detectionId, _refresh);
    };
    _ctrl.aiService.start();

    unawaited(
      _ctrl.ensureOfflineModelLoaded(notifyOnFreshLoad: true, context: context),
    );
    unawaited(OfflineOtaService().checkForUpdates());

    // Voice + SOS
    _voiceCtrl.init();
    _sosCtrl.init();

    // Default mode
    final defaultMode = _ctrl.settings.defaultModeIndex;
    if (defaultMode > 0 &&
        defaultMode < _ctrl.getModes(_ctrl.settings.language).length) {
      _ctrl.currentModeIndex = defaultMode;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _ctrl.pageController.jumpToPage(defaultMode);
      });
    }

    // Camera init
    if (widget.cameras != null && widget.cameras!.isNotEmpty) {
      final cameras = widget.cameras!;
      final targetDirection = _ctrl.isFrontCamera
          ? CameraLensDirection.front
          : CameraLensDirection.back;
      final camera = cameras.firstWhere(
        (c) => c.lensDirection == targetDirection,
        orElse: () => cameras.first,
      );
      _ctrl.cameraController = CameraController(
        camera,
        ResolutionPreset.medium,
        enableAudio: false,
      );
      _ctrl.cameraController!.initialize().then((_) {
        if (!mounted) return;
        setState(() {});
        _ctrl.lightSensor.startMonitoring(_ctrl.cameraController!);
      });
      _ctrl.lightSensor.onLightChanged = (isLowLight) {
        if (!mounted) return;
        setState(() => _ctrl.isNightMode = isLowLight);
        if (isLowLight && _ctrl.settings.autoFlashEnabled && !_ctrl.isFlashOn) {
          _ctrl.toggleFlash(forceOn: true);
        } else if (!isLowLight &&
            _ctrl.isFlashOn &&
            _ctrl.settings.autoFlashEnabled) {
          _ctrl.toggleFlash(forceOn: false);
        }
      };
    }
  }

  @override
  void dispose() {
    _sosCtrl.dispose();
    _voiceCtrl.stopListening();
    _pulseController.dispose();
    _ctrl.dispose();
    super.dispose();
  }

  void _onPageChanged(int index) {
    final lang = _ctrl.settings.language;
    setState(() => _ctrl.currentModeIndex = index);
    _ctrl.accessibilityManager.triggerSuccessVibration();
    _ctrl.accessibilityManager.speak(
      AppLocalizations.t(_ctrl.modeSpokenKey(index), lang),
    );
    if (index != 3) _ctrl.navigationService.stopNavigation();
    if (_ctrl.isWalkingModeEnabled) {
      _ctrl.continuousStreamService.updateCameraState(
        subMode: index == 2 ? 'recognition' : null,
      );
    }
  }

  Future<void> _handleDoubleTap() async {
    if (_ctrl.isScanningMLKit || _ctrl.isProcessing) return;
    if (_ctrl.isWalkingModeEnabled) {
      await _walkingCtrl.setWalkingMode(false, announce: false);
    }
    switch (_ctrl.currentModeIndex) {
      case 0:
        _ctrl.aiService.requestMoneyDetection();
      case 1:
        _ctrl.aiService.requestCaptioning();
      case 2:
        _ctrl.aiService.requestFaceRecognition();
      case 3:
        _ctrl.accessibilityManager.speak(
          AppLocalizations.t('main_navigating', _ctrl.settings.language),
        );
        _ctrl.navigationService.startNavigation();
        _ctrl.openNavigationScreen(context);
      case 4:
        _ctrl.aiService.requestOnlineOCR();
      case 5:
        _ctrl.pickAndReadFile();
      case 6:
        await _ctrl.scanWithMLKit();
      case 7:
        _ctrl.aiService.requestLayoutAnalysis();
    }
  }

  Future<void> _openFaceRegister() async {
    _ctrl.accessibilityManager.speak(
      _ctrl.settings.language == 'vi'
          ? 'Mở màn hình đăng ký khuôn mặt. Tạm dừng camera chính.'
          : 'Opening face registration. Pausing main camera.',
    );
    final wasWalking = _ctrl.isWalkingModeEnabled;
    if (wasWalking) await _walkingCtrl.setWalkingMode(false, announce: false);
    if (_ctrl.stopImageStreamFuture != null) {
      await _ctrl.stopImageStreamFuture;
    }
    await _ctrl.cameraController?.dispose();
    _ctrl.cameraController = null;
    await Future.delayed(const Duration(milliseconds: 300));
    if (!mounted) return;
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => FaceRegisterScreen(
          wsService: _ctrl.wsService,
          cameras: widget.cameras,
        ),
      ),
    );
    await Future.delayed(const Duration(milliseconds: 500));
    await _ctrl.restartCamera();
    if (wasWalking && mounted) await _walkingCtrl.setWalkingMode(true);
  }

  Future<void> _startVisualQA(BuildContext context) async {
    _ctrl.accessibilityManager.speak(
      _ctrl.settings.language == 'vi' ? 'Đang nghe...' : 'Listening...',
    );
    _voiceCtrl.startListening();
  }

  Future<void> _stopVisualQA(BuildContext context) async {
    _voiceCtrl.stopListening();
    final frameBytes = await _ctrl.captureCurrentFrame();
    if (frameBytes != null) {
      _ctrl.accessibilityManager.speak('Đang phân tích hình ảnh...');
      _ctrl.wsService.sendVisualQA(
        frame: frameBytes,
        lang: _ctrl.settings.language,
        question: 'Hãy mô tả chi tiết bức ảnh này.',
      );
    } else {
      _ctrl.accessibilityManager.speak('Không thể chụp ảnh.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = _ctrl.settings.language;
    final modes = _ctrl.getModes(lang);

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Camera preview
          if (_ctrl.cameraController != null &&
              _ctrl.cameraController!.value.isInitialized)
            CameraPreviewWidget(controller: _ctrl.cameraController!),

          // Walking overlay (border, boxes, HUD)
          WalkingOverlay(
            isEnabled: _ctrl.isWalkingModeEnabled,
            pulseController: _pulseController,
            currentFps: _ctrl.walkingCurrentFps,
            nearestObstacle: _ctrl.walkingNearestObstacle,
            safeDirection: _ctrl.walkingSafeDirection,
            detections: _ctrl.currentDetections,
            language: lang,
            frameWidth: _ctrl.lastFrameWidth,
            frameHeight: _ctrl.lastFrameHeight,
          ),

          // Mode carousel
          Positioned.fill(
            child: GestureDetector(
              onDoubleTap: () => unawaited(_handleDoubleTap()),
              onLongPress: _voiceCtrl.startListening,
              child: ModeCarousel(
                pageController: _ctrl.pageController,
                onPageChanged: _onPageChanged,
                modes: modes,
                modeIcons: _ctrl.modeIcons,
              ),
            ),
          ),

          // Status overlay
          StatusOverlay(
            isConnected: _ctrl.isConnected,
            isFlashOn: _ctrl.isFlashOn,
            isNightMode: _ctrl.isNightMode,
            isFrontCamera: _ctrl.isFrontCamera,
            onToggleCamera: _walkingCtrl.toggleCamera,
            onlineText: AppLocalizations.t('main_online', lang),
            offlineText: AppLocalizations.t('main_offline', lang),
            nightText: AppLocalizations.t('main_night', lang),
            flashText: AppLocalizations.t('main_flash', lang),
          ),

          // Danger banner
          if (_ctrl.dangerMessage != null ||
              (_ctrl.isWalkingModeEnabled &&
                  _ctrl.walkingNearestObstacle != '-'))
            Positioned(
              top: MediaQuery.of(context).padding.top + 72,
              left: 16,
              right: 16,
              child: DangerBanner(
                dangerMessage: _ctrl.dangerMessage,
                walkingNearestObstacle: _ctrl.walkingNearestObstacle,
                isWalkingModeEnabled: _ctrl.isWalkingModeEnabled,
                currentDetections: _ctrl.currentDetections,
              ),
            ),

          // Processing overlay
          if (_ctrl.isProcessing || _ctrl.isScanningMLKit)
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
                          _ctrl.isScanningMLKit
                              ? AppLocalizations.t('main_scanning', lang)
                              : AppLocalizations.t('main_processing', lang),
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

          // Feedback prompt
          if (_ctrl.pendingFeedbackDetectionId != null)
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
                      onTap: () => _ctrl.submitFeedback(true, _refresh),
                    ),
                    const SizedBox(width: 8),
                    _FeedbackChip(
                      label: 'Sai',
                      color: AppTheme.accentRed,
                      onTap: () => _ctrl.submitFeedback(false, _refresh),
                    ),
                  ],
                ),
              ),
            ),

          // Walking mode toggle button
          Positioned(
            top: MediaQuery.of(context).padding.top + 14,
            right: 16,
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () => unawaited(
                  _walkingCtrl.setWalkingMode(!_ctrl.isWalkingModeEnabled),
                ),
                borderRadius: BorderRadius.circular(22),
                child: Container(
                  constraints: const BoxConstraints(minWidth: 156),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 11,
                  ),
                  decoration: BoxDecoration(
                    color: _ctrl.isWalkingModeEnabled
                        ? AppTheme.accentGreen.withValues(alpha: 0.45)
                        : Colors.black.withValues(alpha: 0.55),
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(
                      color: _ctrl.isWalkingModeEnabled
                          ? AppTheme.accentGreen
                          : AppTheme.accentPurple.withValues(alpha: 0.45),
                      width: 1.6,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: _ctrl.isWalkingModeEnabled
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
                        lang == 'vi'
                            ? (_ctrl.isWalkingModeEnabled
                                  ? 'TẮT ĐI BỘ'
                                  : 'BẬT ĐI BỘ')
                            : (_ctrl.isWalkingModeEnabled
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

          // Face register button
          Positioned(
            bottom: 210,
            right: 16,
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () => unawaited(_openFaceRegister()),
                borderRadius: BorderRadius.circular(28),
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.5),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: Colors.teal.withValues(alpha: 0.4),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.teal.withValues(alpha: 0.3),
                        blurRadius: 14,
                        spreadRadius: 1,
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.person_add_alt_1_rounded,
                    color: Colors.tealAccent,
                    size: 26,
                  ),
                ),
              ),
            ),
          ),

          // Settings button
          Positioned(
            bottom: 130,
            right: 16,
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () => _ctrl.openSettings(context, onReturn: _refresh),
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

          // SOS button
          Positioned(
            bottom: 130,
            left: 16,
            child: SosButton(
              holdProgress: _sosCtrl.sosHoldProgress,
              onLongPressStart: _sosCtrl.startSosHold,
              onLongPressEnd: (_) => _sosCtrl.cancelSosHold(),
              onLongPressCancel: _sosCtrl.cancelSosHold,
            ),
          ),

          // Visual QA button
          Positioned(
            bottom: 130,
            left: MediaQuery.of(context).size.width / 2 - 38,
            child: VisualQAButton(
              language: lang,
              onStartRecording: _startVisualQA,
              onStopRecording: _stopVisualQA,
            ),
          ),

          // Page indicator dots
          Positioned(
            bottom: 40,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                modes.length,
                (index) => Container(
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  width: _ctrl.currentModeIndex == index ? 24 : 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: _ctrl.currentModeIndex == index
                        ? AppTheme.accentPurple
                        : AppTheme.whiteAlpha(0.5),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
            ),
          ),

          // SOS Success Overlay
          if (_sosCtrl.isSosSent)
            SosSuccessOverlay(
              countdown: _sosCtrl.sosCountdown,
              onCancel: _sosCtrl.cancelFalseAlarm,
              language: lang,
            ),
        ],
      ),
    );
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
            style: const TextStyle(
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
