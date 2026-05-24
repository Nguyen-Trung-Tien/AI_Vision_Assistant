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
import 'package:mobile_app/widgets/recognition_overlay.dart';
import 'package:mobile_app/widgets/walking_overlay.dart';
import 'package:mobile_app/widgets/sos_button.dart';
import 'package:mobile_app/widgets/sos_success_overlay.dart';
import 'package:mobile_app/widgets/danger_banner.dart';
import 'package:mobile_app/widgets/status_overlay.dart';
import 'package:mobile_app/widgets/mode_carousel.dart';
import 'package:mobile_app/widgets/visual_qa_button.dart';
import 'package:mobile_app/widgets/voice_listening_overlay.dart';
import 'package:mobile_app/widgets/mode_processing_overlay.dart';

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
  bool _isOpeningFaceRegister = false;

  @override
  void initState() {
    super.initState();

    _ctrl = MainController(cameras: widget.cameras, onStateChanged: _refresh);
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
      onStateChanged: _refresh,
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

  void _clearRecognitionOverlay() {
    _ctrl.currentRecognitionDetections = [];
    _ctrl.primaryRecognitionDetection = null;
    _ctrl.recognitionTitle = null;
    _ctrl.recognitionSubtitle = null;
    _ctrl.recognitionFrameWidth = null;
    _ctrl.recognitionFrameHeight = null;
  }

  List<Map<String, dynamic>> _extractRecognitionDetections(
    Map<String, dynamic> result,
    String taskType,
  ) {
    final rawDetections = (result['raw_detections'] as List<dynamic>? ?? [])
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .toList();
    if (rawDetections.isNotEmpty) return rawDetections;

    final rawBoxes = (result['boxes'] as List<dynamic>? ?? []);
    final fallbackLabel = result['recognition_title']?.toString() ??
        result['text']?.toString() ??
        'Object';
    final fallbackCategory = taskType == 'OCR' ? 'money' : 'object';

    return rawBoxes
        .whereType<List>()
        .map(
          (box) => <String, dynamic>{
            'box': List<dynamic>.from(box),
            'label': fallbackLabel,
            'display_name': fallbackLabel,
            'category': fallbackCategory,
          },
        )
        .toList();
  }

  void _updateRecognitionOverlayFromResult(Map<String, dynamic> result) {
    final taskType =
        result['taskType']?.toString() ?? result['task_type']?.toString() ?? '';
    final isGeneralMode = _ctrl.currentModeIndex == 0;
    final isFaceMode = _ctrl.currentModeIndex == 2;
    final isOnlineOcrMode = _ctrl.currentModeIndex == 4;
    final isLayoutMode = _ctrl.currentModeIndex == 7;
    final isSupportedTask = taskType == 'CONTINUOUS' ||
        taskType == 'OCR' ||
        taskType == 'FACE_RECOGNITION' ||
        taskType == 'TEXT_OCR' ||
        taskType == 'LAYOUT_ANALYSIS' ||
        taskType == 'CAPTIONING';

    if (!isSupportedTask) {
      return;
    }

    if (!isGeneralMode && (taskType == 'OCR' || taskType == 'CONTINUOUS')) {
      _clearRecognitionOverlay();
      return;
    }

    if (!isFaceMode && taskType == 'FACE_RECOGNITION') {
      _clearRecognitionOverlay();
      return;
    }

    if (!isOnlineOcrMode && taskType == 'TEXT_OCR') {
      _clearRecognitionOverlay();
      return;
    }

    if (!isLayoutMode && taskType == 'LAYOUT_ANALYSIS') {
      _clearRecognitionOverlay();
      return;
    }

    final detections = _extractRecognitionDetections(result, taskType);
    final rawText = result['text']?.toString()?.trim();

    if (detections.isEmpty && (rawText == null || rawText.isEmpty)) {
      _clearRecognitionOverlay();
      return;
    }

    final rawPrimary = result['primary_detection'];
    Map<String, dynamic>? primary;
    if (rawPrimary is Map) {
      primary = Map<String, dynamic>.from(rawPrimary);
    } else {
      primary = detections.isNotEmpty ? detections.first : null;
    }

    final rawTitle = result['recognition_title']?.toString();
    final title = rawTitle != null && rawTitle.trim().isNotEmpty
        ? rawTitle.trim()
        : primary?['display_name']?.toString() ??
            primary?['label']?.toString() ??
            rawText;

    final subtitle = (rawText != null && rawText.isNotEmpty && rawText != title)
        ? rawText
        : null;

    _ctrl.currentRecognitionDetections = detections;
    _ctrl.primaryRecognitionDetection = primary;
    _ctrl.recognitionTitle = title;
    _ctrl.recognitionSubtitle = subtitle;
    _ctrl.recognitionFrameWidth = (result['frame_width'] as num?)?.toInt();
    _ctrl.recognitionFrameHeight = (result['frame_height'] as num?)?.toInt();
  }

  void _initServices() {
    // TTS speaking callback — keep overlay while reading
    _ctrl.accessibilityManager.onSpeakingChanged = (speaking) {
      if (!mounted) return;
      setState(() {
        if (!speaking) {
          _ctrl.ttsStartOffset = null;
          _ctrl.ttsEndOffset = null;
          _ctrl.ttsCurrentWord = null;
        }
        if (!speaking && !_ctrl.isProcessing && !_ctrl.isScanningMLKit) {
          _ctrl.activeProcessingMode = null;
        }
      });
    };
    _ctrl.accessibilityManager.onProgress = (start, end, word) {
      if (!mounted) return;
      setState(() {
        _ctrl.ttsStartOffset = start;
        _ctrl.ttsEndOffset = end;
        _ctrl.ttsCurrentWord = word;
      });
    };

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
      final rawMessage = data['message']?.toString();
      final message = rawMessage?.trim() ?? '';
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
      if (mounted) {
        setState(() {
          _ctrl.isProcessing = isProcessing;
        });
        if (!isProcessing) {
          Future.delayed(const Duration(milliseconds: 100), () {
            if (mounted &&
                !_ctrl.isProcessing &&
                !_ctrl.accessibilityManager.isSpeaking) {
              setState(() {
                _ctrl.activeProcessingMode = null;
              });
            }
          });
        }
      }
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
      final taskType = result['taskType']?.toString() ??
          result['task_type']?.toString() ??
          '';
      _updateRecognitionOverlayFromResult(result);
      _refresh();
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
    if (index != 0) {
      _clearRecognitionOverlay();
    }
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
    final lang = _ctrl.settings.language;

    if (_ctrl.accessibilityManager.isSpeaking) {
      await _ctrl.accessibilityManager.stopSpeak();
      if (mounted) {
        setState(() {
          _ctrl.activeProcessingMode = null;
          _clearRecognitionOverlay();
        });
      }
      return;
    }

    if (_ctrl.isProcessing || _ctrl.isScanningMLKit) return;

    // Nếu đang hiển thị kết quả phân tích (OCR, Menu, Sách...), double tap để thoát (xoá kết quả)
    if (_ctrl.currentRecognitionDetections.isNotEmpty ||
        _ctrl.recognitionTitle != null) {
      _clearRecognitionOverlay();
      _ctrl.accessibilityManager.stopSpeak();
      setState(() {});
      return;
    }

    if (_ctrl.isWalkingModeEnabled) {
      await _walkingCtrl.setWalkingMode(false, announce: false);
    }
    switch (_ctrl.currentModeIndex) {
      case 0:
        _ctrl.activeProcessingMode = 'money';
        setState(() {});
        if (!_ctrl.isConnected) {
          await _ctrl.detectMoneyOffline();
          if (mounted) setState(() => _ctrl.activeProcessingMode = null);
        } else {
          _ctrl.aiService.requestMoneyDetection();
        }
      case 1:
        _ctrl.activeProcessingMode = 'caption';
        setState(() {});
        _ctrl.aiService.requestCaptioning();
      case 2:
        _ctrl.activeProcessingMode = 'face';
        setState(() {});
        _ctrl.aiService.requestFaceRecognition();
      case 3:
        _ctrl.accessibilityManager.speak(
          AppLocalizations.t('main_navigating', _ctrl.settings.language),
        );
        _ctrl.navigationService.startNavigation();
        _ctrl.openNavigationScreen(context);
      case 4:
        _ctrl.activeProcessingMode = 'online_ocr';
        setState(() {});
        _ctrl.aiService.requestOnlineOCR();
      case 5:
        if (mounted) unawaited(_ctrl.pickAndReadFile(context));
      case 6:
        _ctrl.activeProcessingMode = 'offline_ocr';
        setState(() {});
        await _ctrl.scanWithMLKit();
        if (mounted) {
          Future.delayed(const Duration(milliseconds: 100), () {
            if (mounted && !_ctrl.accessibilityManager.isSpeaking) {
              setState(() => _ctrl.activeProcessingMode = null);
            }
          });
        }
      case 7:
        _ctrl.activeProcessingMode = 'layout_analysis';
        setState(() {});
        _ctrl.aiService.requestLayoutAnalysis();
    }
  }

  Future<void> _openFaceRegister() async {
    if (_isOpeningFaceRegister) return;
    _isOpeningFaceRegister = true;
    _ctrl.accessibilityManager.speak(
      _ctrl.settings.language == 'vi'
          ? 'Mở màn hình đăng ký khuôn mặt. Tạm dừng camera chính.'
          : 'Opening face registration. Pausing main camera.',
    );
    try {
      final wasWalking = _ctrl.isWalkingModeEnabled;
      if (wasWalking) {
        await _walkingCtrl.setWalkingMode(false, announce: false);
      } else {
        await _ctrl.stopContinuousImageStream();
      }
      _ctrl.lightSensor.stop();
      if (_ctrl.stopImageStreamFuture != null) {
        await _ctrl.stopImageStreamFuture;
      }
      final oldController = _ctrl.cameraController;
      _ctrl.cameraController = null;
      if (mounted) setState(() {});
      await oldController?.dispose();
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
    } finally {
      _isOpeningFaceRegister = false;
    }
  }

  Future<void> _startVisualQA(BuildContext context) async {
    _ctrl.accessibilityManager.speak(
      _ctrl.settings.language == 'vi' ? 'Đang nghe...' : 'Listening...',
    );
    _voiceCtrl.startListening(isVisualQA: true);
  }

  Future<void> _stopVisualQA(BuildContext context) async {
    final question = await _voiceCtrl.stopListeningAndGetText();
    final frameBytes = await _ctrl.captureCurrentFrame();
    if (frameBytes != null) {
      _ctrl.accessibilityManager.speak('Đang phân tích hình ảnh...');

      final finalQuestion = question.isNotEmpty
          ? question
          : (_ctrl.settings.language == 'vi'
              ? 'Hãy mô tả chi tiết bức ảnh này.'
              : 'Please describe this image in detail.');

      _ctrl.wsService.sendVisualQA(
        frame: frameBytes,
        lang: _ctrl.settings.language,
        question: finalQuestion,
      );
    } else {
      _ctrl.accessibilityManager.speak('Không thể chụp ảnh.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = _ctrl.settings.language;
    final modes = _ctrl.getModes(lang);

    final bool isDangerVisible = _ctrl.dangerMessage != null ||
        (_ctrl.isWalkingModeEnabled && _ctrl.walkingNearestObstacle != '-');

    final double walkingHudTopOffset = isDangerVisible ? 165 : 85;
    final double recognitionTopOffset = isDangerVisible ? 165 : 85;
    final bool showRecognitionOverlay = (_ctrl.currentModeIndex == 0 ||
            _ctrl.currentModeIndex == 1 ||
            _ctrl.currentModeIndex == 2 ||
            _ctrl.currentModeIndex == 4 ||
            _ctrl.currentModeIndex == 6 ||
            _ctrl.currentModeIndex == 7) &&
        (_ctrl.currentRecognitionDetections.isNotEmpty ||
            (_ctrl.recognitionTitle?.isNotEmpty ?? false));

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
            topOffset: walkingHudTopOffset,
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

          // Danger banner — always rendered; AnimatedSlide inside handles show/hide
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

          // Processing overlay — AnimatedSwitcher for smooth fade entrance/exit
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 200),
            child: (_ctrl.activeProcessingMode != null ||
                    _ctrl.isProcessing ||
                    _ctrl.isScanningMLKit)
                ? GestureDetector(
                    onDoubleTap: () => unawaited(_handleDoubleTap()),
                    child: ModeProcessingOverlay(
                      key: const ValueKey('processing_overlay'),
                      mode: _ctrl.activeProcessingMode,
                      isSpeaking: _ctrl.accessibilityManager.isSpeaking,
                      statusText: _ctrl.accessibilityManager.isSpeaking
                          ? (lang == 'vi'
                              ? 'Đang đọc kết quả...'
                              : 'Reading result...')
                          : _ctrl.isScanningMLKit
                              ? AppLocalizations.t('main_scanning', lang)
                              : AppLocalizations.t('main_processing', lang),
                    ),
                  )
                : const SizedBox.shrink(key: ValueKey('no_overlay')),
          ),

          RecognitionOverlay(
            isEnabled: showRecognitionOverlay,
            detections: _ctrl.currentRecognitionDetections,
            primaryDetection: _ctrl.primaryRecognitionDetection,
            title: _ctrl.recognitionTitle,
            subtitle: _ctrl.recognitionSubtitle,
            frameWidth: _ctrl.recognitionFrameWidth,
            frameHeight: _ctrl.recognitionFrameHeight,
            topOffset: recognitionTopOffset,
            ttsStartOffset: _ctrl.ttsStartOffset,
            ttsEndOffset: _ctrl.ttsEndOffset,
          ),

          // Feedback prompt
          if (_ctrl.pendingFeedbackDetectionId != null)
            Positioned(
              bottom: 220, // Moved up to clear bottom buttons
              left: 16,
              right: 16,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 14,
                ),
                decoration: AppTheme.glassDecoration(
                  borderRadius: 18,
                  opacity: 0.8,
                ).copyWith(
                  border: Border.all(
                    color: AppTheme.accentPurple.withValues(alpha: 0.4),
                    width: 1.2,
                  ),
                ),
                child: Row(
                  children: [
                    _FeedbackChip(
                      label: lang == 'vi' ? 'Đúng' : 'Yes',
                      color: AppTheme.accentGreen,
                      onTap: () => _ctrl.submitFeedback(true, _refresh),
                    ),
                    const SizedBox(width: 8),
                    _FeedbackChip(
                      label: lang == 'vi' ? 'Sai' : 'No',
                      color: AppTheme.accentRed,
                      onTap: () => _ctrl.submitFeedback(false, _refresh),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        lang == 'vi'
                            ? 'Kết quả AI có đúng không?'
                            : 'Is the AI result correct?',
                        textAlign: TextAlign.right,
                        style: AppTheme.bodyMedium.copyWith(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
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

          // Action buttons column (Right side)
          Positioned(
            bottom: 130,
            right: 16,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Face register button
                Material(
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
                const SizedBox(height: 16),
                // Settings button
                Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () =>
                        _ctrl.openSettings(context, onReturn: _refresh),
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
              ],
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
                (index) {
                  final isActive = _ctrl.currentModeIndex == index;
                  final dotColor = isActive
                      ? ModeCarousel.modeColors[index]
                      : AppTheme.whiteAlpha(0.35);
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeOut,
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    width: isActive ? 24 : 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: dotColor,
                      borderRadius: BorderRadius.circular(4),
                      boxShadow: isActive
                          ? [
                              BoxShadow(
                                  color: dotColor.withValues(alpha: 0.5),
                                  blurRadius: 8)
                            ]
                          : null,
                    ),
                  );
                },
              ),
            ),
          ),

          // Voice Listening Overlay
          if (_voiceCtrl.isListening) const VoiceListeningOverlay(),

          // SOS status overlay
          if (_sosCtrl.isOverlayVisible)
            SosSuccessOverlay(
              status: _sosCtrl.overlayStatus,
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
