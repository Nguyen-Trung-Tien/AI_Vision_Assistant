import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:mobile_app/screens/face_register_screen.dart';
import 'package:mobile_app/screens/history_screen.dart';
import 'package:mobile_app/screens/settings_screen.dart';
import 'package:mobile_app/screens/navigation_screen.dart';
import 'package:mobile_app/services/accessibility_manager.dart';
import 'package:mobile_app/services/edge_ai_service.dart';
import 'package:mobile_app/services/feedback_service.dart';
import 'package:mobile_app/services/document_reader_service.dart';
import 'package:mobile_app/services/light_sensor_service.dart';
import 'package:mobile_app/services/ml_kit_service.dart';
import 'package:mobile_app/services/navigation_service.dart';
import 'package:mobile_app/services/settings_service.dart';
import 'package:mobile_app/services/tflite_service.dart';
import 'package:mobile_app/services/websocket_service.dart';
import 'package:mobile_app/services/continuous_stream_service.dart';
import 'package:mobile_app/services/offline_ota_service.dart';
import 'package:mobile_app/services/spatial_audio_service.dart';
import 'package:mobile_app/l10n/app_localizations.dart';
import 'package:mobile_app/utils/text_utils.dart';
import 'package:mobile_app/utils/spatial_utils.dart';

/// Central controller that owns all services and shared state for MainScreen.
class MainController {
  MainController({required this.cameras});

  final List<CameraDescription>? cameras;

  // ── Services ──────────────────────────────────────────────────────────
  late WebSocketService wsService;
  late EdgeAIService aiService;
  late ContinuousStreamService continuousStreamService;
  final DocumentReaderService documentReaderService = DocumentReaderService();
  final AccessibilityManager accessibilityManager = AccessibilityManager();
  final MlKitService mlKitService = MlKitService();
  final NavigationService navigationService = NavigationService();
  final FeedbackService feedbackService = FeedbackService();
  final SettingsService settings = SettingsService();
  final SpatialAudioService spatialAudioService = SpatialAudioService();
  final LightSensorService lightSensor = LightSensorService();
  final TfliteService tfliteService = TfliteService();

  // ── Camera State ──────────────────────────────────────────────────────
  CameraController? cameraController;
  static const Duration captureTimeout = Duration(seconds: 6);
  bool isCapturing = false;
  bool isFlashOn = false;
  bool isConnected = false;
  bool isProcessing = false;
  bool isRestartingCamera = false;
  bool isFrontCamera = false;
  bool isNightMode = false;
  bool isScanningMLKit = false;
  Future<void>? stopImageStreamFuture;

  // ── Mode State ────────────────────────────────────────────────────────
  final PageController pageController = PageController();
  int currentModeIndex = 0;

  final List<IconData> modeIcons = [
    Icons.auto_awesome,
    Icons.landscape,
    Icons.face_retouching_natural_rounded,
    Icons.navigation,
    Icons.text_fields,
    Icons.folder_open,
    Icons.document_scanner,
  ];

  // ── Walking Mode State ────────────────────────────────────────────────
  bool isWalkingModeEnabled = false;
  int walkingCurrentFps = 1;
  String walkingNearestObstacle = '-';
  String walkingSafeDirection = '-';
  List<Map<String, dynamic>> currentDetections = [];
  int? lastFrameWidth;
  int? lastFrameHeight;

  // ── Danger State ──────────────────────────────────────────────────────
  String? dangerMessage;
  Timer? dangerTimer;

  // ── Feedback State ────────────────────────────────────────────────────
  String? pendingFeedbackDetectionId;
  Timer? feedbackTimer;
  bool hasShownOfflineModelLoadedMessage = false;

  // ── Helpers ───────────────────────────────────────────────────────────
  List<String> getModes(String lang) {
    return [
      AppLocalizations.t('mode_0', lang),
      AppLocalizations.t('mode_1', lang),
      AppLocalizations.t('mode_7', lang),
      AppLocalizations.t('mode_3', lang),
      AppLocalizations.t('mode_4', lang),
      AppLocalizations.t('mode_6', lang),
      AppLocalizations.t('mode_5', lang),
    ];
  }

  String modeSpokenKey(int index) {
    const keys = [
      'mode_0',
      'mode_1',
      'mode_7',
      'mode_3',
      'mode_4',
      'mode_6',
      'mode_5',
    ];
    if (index < 0 || index >= keys.length) return 'mode_0_spoken';
    return '${keys[index]}_spoken';
  }

  String sanitizeForTts(String text) {
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

  // ── Camera Operations ─────────────────────────────────────────────────
  Future<Uint8List?> captureCurrentFrame() async {
    final controller = cameraController;
    if (controller == null ||
        !controller.value.isInitialized ||
        isCapturing ||
        controller.value.isTakingPicture) {
      return null;
    }

    if (controller.value.isStreamingImages) {
      await stopContinuousImageStream();
      if (controller.value.isStreamingImages ||
          controller.value.isTakingPicture) {
        return null;
      }
    }

    try {
      isCapturing = true;
      final image = await controller.takePicture().timeout(captureTimeout);
      return await image.readAsBytes();
    } on TimeoutException catch (_) {
      debugPrint('[Camera] Capture timeout');
      return null;
    } catch (_) {
      return null;
    } finally {
      isCapturing = false;
    }
  }

  Future<bool> startContinuousImageStream() async {
    final controller = cameraController;
    if (controller == null || !controller.value.isInitialized) return false;
    if (controller.value.isStreamingImages) return true;

    try {
      await controller.startImageStream((CameraImage image) {
        if (continuousStreamService.isStreaming) {
          continuousStreamService.onLatestCameraImage(image);
        }
      });
      return true;
    } catch (e) {
      debugPrint('[Camera] Failed to startImageStream: $e');
      return false;
    }
  }

  Future<void> stopContinuousImageStream() async {
    final controller = cameraController;
    if (controller == null || !controller.value.isInitialized) return;
    if (!controller.value.isStreamingImages) return;
    if (stopImageStreamFuture != null) {
      await stopImageStreamFuture;
      return;
    }

    final completer = Completer<void>();
    stopImageStreamFuture = completer.future;
    try {
      await controller.stopImageStream();
    } catch (e) {
      debugPrint('[Camera] Failed to stopImageStream: $e');
    } finally {
      completer.complete();
      stopImageStreamFuture = null;
    }
  }

  Future<void> restartCamera({
    bool? useFront,
    int retries = 3,
    int delayMs = 500,
  }) async {
    if (isRestartingCamera) return;
    final cams = cameras;
    if (cams == null || cams.isEmpty) return;

    if (useFront != null) isFrontCamera = useFront;

    isRestartingCamera = true;
    try {
      lightSensor.stop();

      for (int i = 0; i < retries; i++) {
        try {
          final oldController = cameraController;
          cameraController = null;
          await oldController?.dispose();

          final targetDirection = isFrontCamera
              ? CameraLensDirection.front
              : CameraLensDirection.back;

          final camera = cams.firstWhere(
            (camera) => camera.lensDirection == targetDirection,
            orElse: () => cams.first,
          );

          final controller = CameraController(
            camera,
            ResolutionPreset.medium,
            enableAudio: false,
          );
          await controller.initialize();

          cameraController = controller;
          lightSensor.startMonitoring(cameraController!);
          break;
        } catch (e) {
          debugPrint('Camera init attempt ${i + 1} failed: $e');
          if (i == retries - 1) rethrow;
          await Future.delayed(Duration(milliseconds: delayMs));
        }
      }
    } catch (e) {
      debugPrint('Error restarting camera after $retries attempts: $e');
      accessibilityManager.speak(
        settings.language == 'vi'
            ? 'Lỗi khởi động camera. Vui lòng thử lại.'
            : 'Camera error. Please try again.',
      );
    } finally {
      isRestartingCamera = false;
    }
  }

  Future<void> toggleFlash({bool? forceOn}) async {
    final lang = settings.language;
    if (cameraController == null || !cameraController!.value.isInitialized) {
      accessibilityManager.speak(
        AppLocalizations.t('main_camera_not_ready', lang),
      );
      return;
    }

    try {
      final newState = forceOn ?? !isFlashOn;
      await cameraController!.setFlashMode(
        newState ? FlashMode.torch : FlashMode.off,
      );
      isFlashOn = newState;
      accessibilityManager.speak(
        newState
            ? AppLocalizations.t('main_flash_on', lang)
            : AppLocalizations.t('main_flash_off', lang),
      );
      accessibilityManager.triggerSuccessVibration();
      settings.setFlashOn(newState);
    } catch (_) {
      accessibilityManager.speak(AppLocalizations.t('main_flash_error', lang));
      accessibilityManager.triggerErrorVibration();
    }
  }

  // ── Navigation helpers ────────────────────────────────────────────────
  void goToMode(int index) {
    pageController.animateToPage(
      index,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
  }

  void speakHelp() {
    accessibilityManager.speak(
      AppLocalizations.t('main_help_spoken', settings.language),
    );
  }

  void openSettings(BuildContext context, {VoidCallback? onReturn}) {
    accessibilityManager.speak(
      AppLocalizations.t('main_open_settings', settings.language),
    );
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const SettingsScreen()),
    ).then((_) {
      accessibilityManager.refreshTtsSpeed();
      onReturn?.call();
    });
  }

  void openHistory(BuildContext context, {VoidCallback? onReturn}) {
    accessibilityManager.speak(
      AppLocalizations.t('main_open_history', settings.language),
    );
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const HistoryScreen()),
    ).then((_) {
      onReturn?.call();
    });
  }

  void openNavigationScreen(BuildContext context, {VoidCallback? onReturn}) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const NavigationScreen()),
    ).then((_) {
      navigationService.stopNavigation();
      goToMode(0);
      onReturn?.call();
    });
  }

  // ── Offline model ─────────────────────────────────────────────────────
  Future<bool> ensureOfflineModelLoaded({
    bool notifyOnFreshLoad = false,
    BuildContext? context,
  }) async {
    final wasLoaded = tfliteService.isModelLoaded;
    if (!wasLoaded && notifyOnFreshLoad) {
      accessibilityManager.speak(
        settings.language == 'vi'
            ? 'Đang nạp mô hình từ máy, xin chờ...'
            : 'Loading on-device model, please wait...',
      );
    }

    final loaded = wasLoaded || await tfliteService.loadModel();
    if (!notifyOnFreshLoad || !loaded || wasLoaded) return loaded;
    if (hasShownOfflineModelLoadedMessage) return loaded;

    hasShownOfflineModelLoadedMessage = true;
    if (context != null) {
      final isVi = settings.language == 'vi';
      final source = tfliteService.loadedModelSource;
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
    }
    return loaded;
  }

  // ── File reading ──────────────────────────────────────────────────────
  Future<void> pickAndReadFile() async {
    final lang = settings.language;
    accessibilityManager.speak(AppLocalizations.t('main_reading_file', lang));

    try {
      final text = await documentReaderService.pickAndExtractText();
      if (text == null) return;
      if (text.isEmpty) {
        accessibilityManager.speak(AppLocalizations.t('main_file_empty', lang));
        return;
      }
      accessibilityManager.speak(sanitizeForTts(text));
    } catch (e) {
      debugPrint('Lỗi đọc file: $e');
      if (e.toString().contains('Unsupported format')) {
        accessibilityManager.speak(
          AppLocalizations.t('main_file_unsupported', lang),
        );
      } else {
        accessibilityManager.speak(AppLocalizations.t('main_file_error', lang));
      }
    }
  }

  // ── MLKit scan ────────────────────────────────────────────────────────
  Future<void> scanWithMLKit() async {
    if (cameraController == null || !cameraController!.value.isInitialized) {
      return;
    }

    isScanningMLKit = true;
    final lang = settings.language;
    accessibilityManager.speak(AppLocalizations.t('main_scanning', lang));
    accessibilityManager.triggerSuccessVibration();

    try {
      final file = await cameraController!.takePicture().timeout(
        captureTimeout,
      );
      await mlKitService.processImageFile(file.path);
    } on TimeoutException catch (_) {
      debugPrint('[Camera] MLKit capture timeout');
      accessibilityManager.speak(AppLocalizations.t('main_no_capture', lang));
      accessibilityManager.triggerErrorVibration();
      await restartCamera();
    } catch (e) {
      debugPrint('Lỗi khi quét ML Kit: $e');
      accessibilityManager.speak(
        lang == 'vi'
            ? 'Không thể quét offline. Vui lòng thử lại.'
            : 'Unable to scan offline. Please try again.',
      );
      accessibilityManager.triggerErrorVibration();
    } finally {
      isScanningMLKit = false;
    }
  }

  // ── Offline money detection ───────────────────────────────────────────
  Future<void> detectMoneyOffline() async {
    if (cameraController == null || !cameraController!.value.isInitialized) {
      return;
    }

    final modelReady = await ensureOfflineModelLoaded();
    if (!modelReady) {
      accessibilityManager.speak(
        AppLocalizations.t('main_no_offline_model', settings.language),
      );
      accessibilityManager.triggerErrorVibration();
      return;
    }

    isProcessing = true;
    final lang = settings.language;
    accessibilityManager.triggerSuccessVibration();
    accessibilityManager.speak(
      lang == 'vi' ? 'Đang nhận diện offline...' : 'Processing offline...',
    );

    try {
      final bytes = await captureCurrentFrame();
      if (bytes == null) {
        accessibilityManager.speak(AppLocalizations.t('main_no_capture', lang));
        return;
      }

      final result = await tfliteService.detectMoney(bytes);
      if (result != null) {
        accessibilityManager.speak(result);
      } else {
        accessibilityManager.speak(
          AppLocalizations.t('main_no_offline_model', lang),
        );
      }
    } catch (e) {
      debugPrint('TFLite offline error: $e');
      accessibilityManager.speak(
        AppLocalizations.t('main_offline_error', lang),
      );
    } finally {
      isProcessing = false;
    }
  }

  // ── Feedback ──────────────────────────────────────────────────────────
  void showFeedbackPrompt(String detectionId, VoidCallback onState) {
    feedbackTimer?.cancel();
    pendingFeedbackDetectionId = detectionId;
    onState();
    feedbackTimer = Timer(const Duration(seconds: 5), () {
      pendingFeedbackDetectionId = null;
      onState();
    });
  }

  Future<void> submitFeedback(bool isCorrect, VoidCallback onState) async {
    final detectionId = pendingFeedbackDetectionId;
    if (detectionId == null) return;

    final frame = aiService.lastFrameForFeedback;
    final imageBase64 = (!isCorrect && frame != null)
        ? base64Encode(frame)
        : null;

    try {
      await feedbackService.submitFeedback(
        detectionId: detectionId,
        isCorrect: isCorrect,
        imageBase64: imageBase64,
      );
      accessibilityManager.speak(
        isCorrect ? 'Đã ghi nhận đúng' : 'Đã ghi nhận sai',
      );
    } catch (_) {
      accessibilityManager.speak('Không gửi được phản hồi');
    } finally {
      pendingFeedbackDetectionId = null;
      onState();
    }
  }

  // ── Dispose ───────────────────────────────────────────────────────────
  void dispose() {
    dangerTimer?.cancel();
    feedbackTimer?.cancel();
    continuousStreamService.stop();
    cameraController?.dispose();
    aiService.stop();
    wsService.dispose();
    pageController.dispose();
    mlKitService.dispose();
    lightSensor.stop();
    navigationService.stopNavigation();
    spatialAudioService.dispose();
  }
}
