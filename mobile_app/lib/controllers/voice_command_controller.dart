import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:mobile_app/controllers/main_controller.dart';
import 'package:mobile_app/controllers/walking_mode_controller.dart';
import 'package:mobile_app/l10n/app_localizations.dart';
import 'package:mobile_app/services/voice_command_service.dart';
import 'package:mobile_app/utils/text_utils.dart';

/// Handles voice command recognition and routing to appropriate actions.
class VoiceCommandController {
  VoiceCommandController({
    required this.ctrl,
    required this.walkingCtrl,
    required this.onNavigationRequested,
    required this.onFaceRegisterRequested,
    required this.onOpenSettings,
    required this.onOpenHistory,
    required this.onSosTriggered,
  });

  final MainController ctrl;
  final WalkingModeController walkingCtrl;
  final VoidCallback onNavigationRequested;
  final VoidCallback onFaceRegisterRequested;
  final VoidCallback onOpenSettings;
  final VoidCallback onOpenHistory;
  final VoidCallback onSosTriggered;

  late VoiceCommandService _voiceCommandService;

  void init() {
    _voiceCommandService = VoiceCommandService(
      onCommandRecognized: onCommandRecognized,
    );
    _voiceCommandService.init();
  }

  void startListening() => _voiceCommandService.startListening();
  void stopListening() => _voiceCommandService.stopListening();

  // Keywords can include Vietnamese diacritics.
  // TextUtils.containsAny automatically normalizes both the input and the keywords
  // to be without diacritics before matching. E.g. "khẩn cấp" matches "khan cap".
  void onCommandRecognized(String command) {
    final cmd = TextUtils.normalizeCommand(command);

    // Emergency
    if (TextUtils.containsAny(cmd, [
      'khẩn cấp',
      'cứu tôi',
      'cứu với',
      'giúp tôi',
      'help',
      'emergency',
      'sos',
    ])) {
      onSosTriggered();
      return;
    }

    // Feedback
    if (ctrl.pendingFeedbackDetectionId != null) {
      if (TextUtils.containsAny(cmd, ['đúng', 'chính xác', 'correct'])) {
        ctrl.submitFeedback(true, () {});
        return;
      }
      if (TextUtils.containsAny(cmd, ['sai', 'không đúng', 'wrong'])) {
        ctrl.submitFeedback(false, () {});
        return;
      }
    }

    // Navigation commands
    if (TextUtils.containsAny(cmd, ['cài đặt', 'settings'])) {
      onOpenSettings();
    } else if (TextUtils.containsAny(cmd, ['lịch sử', 'history'])) {
      onOpenHistory();
    } else if (TextUtils.containsAny(cmd, ['đèn', 'flash', 'light'])) {
      ctrl.toggleFlash();
    } else if (TextUtils.containsAny(cmd, ['trợ giúp', 'giúp đỡ', 'help'])) {
      ctrl.speakHelp();
    } else if (TextUtils.containsAny(cmd, [
      'đọc hóa đơn',
      'hóa đơn',
      'receipt',
    ])) {
      ctrl.aiService.requestSmartOCR('receipt');
    } else if (TextUtils.containsAny(cmd, [
      'đọc thực đơn',
      'thực đơn',
      'menu',
    ])) {
      ctrl.aiService.requestSmartOCR('menu');
    } else if (TextUtils.containsAny(cmd, [
      'đọc biển báo',
      'biển báo',
      'sign',
    ])) {
      ctrl.aiService.requestSmartOCR('sign');
    } else if (TextUtils.containsAny(cmd, [
      'đọc văn bản',
      'đọc chữ',
      'read text',
      'online',
    ])) {
      ctrl.goToMode(4);
    } else if (TextUtils.containsAny(cmd, ['nhanh', 'offline', 'quick read'])) {
      ctrl.goToMode(6);
    } else if (TextUtils.containsAny(cmd, [
      'mô tả',
      'không gian',
      'scene',
      'describe',
    ])) {
      ctrl.goToMode(1);
    } else if (TextUtils.containsAny(cmd, [
      'định hướng',
      'định vị',
      'navigate',
      'navigation',
    ])) {
      ctrl.goToMode(3);
      onNavigationRequested();
    } else if (TextUtils.containsAny(cmd, [
      'đọc tệp',
      'mở file',
      'đọc file',
      'mở tệp',
      'open file',
      'read file',
    ])) {
      ctrl.goToMode(5);
    } else if (TextUtils.containsAny(cmd, [
      'bật chế độ đi bộ',
      'bật đi bộ',
      'enable walking mode',
      'start walking mode',
    ])) {
      unawaited(walkingCtrl.setWalkingMode(true));
    } else if (TextUtils.containsAny(cmd, [
      'tắt chế độ đi bộ',
      'tắt đi bộ',
      'disable walking mode',
      'stop walking mode',
    ])) {
      unawaited(walkingCtrl.setWalkingMode(false));
    } else if (TextUtils.containsAny(cmd, [
      'đi bộ',
      'bước đi',
      'walk',
      'walking',
    ])) {
      unawaited(walkingCtrl.setWalkingMode(!ctrl.isWalkingModeEnabled));
    } else if (TextUtils.containsAny(cmd, [
      'tổng hợp',
      'tiền',
      'general',
      'money',
    ])) {
      ctrl.goToMode(0);
    } else if (TextUtils.containsAny(cmd, [
      'nhận diện người',
      'người quen',
      'face recognition',
      'identify person',
    ])) {
      ctrl.goToMode(2);
    } else if (TextUtils.containsAny(cmd, [
      'đổi camera',
      'chuyển camera',
      'đổi cam',
      'switch camera',
      'flip camera',
    ])) {
      unawaited(walkingCtrl.toggleCamera());
    } else {
      ctrl.accessibilityManager.speak(
        AppLocalizations.t('main_unknown_command', ctrl.settings.language),
      );
    }
  }
}
