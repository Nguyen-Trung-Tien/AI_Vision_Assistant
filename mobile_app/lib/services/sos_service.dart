import 'dart:async';

import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:mobile_app/services/accessibility_manager.dart';
import 'package:mobile_app/services/settings_service.dart';
import 'package:mobile_app/l10n/app_localizations.dart';

class SosService {
  final AccessibilityManager _accessibilityManager = AccessibilityManager();
  final SettingsService _settings = SettingsService();

  /// Countdown timer để hủy SOS trước khi gửi
  Timer? _countdownTimer;
  bool _isCounting = false;

  /// Callback thông báo số giây còn lại (null = đã hủy / đã gửi)
  Function(int? secondsLeft)? onCountdownTick;

  /// Kích hoạt SOS với countdown [countdownSeconds] giây.
  /// Người dùng có thể gọi [cancelEmergency()] trong thời gian đó để hủy.
  Future<void> triggerEmergency({int countdownSeconds = 5}) async {
    final lang = _settings.language;
    final numbers = _settings.emergencyNumbers;

    if (numbers.isEmpty) {
      _accessibilityManager.speak(AppLocalizations.t('sos_no_numbers', lang));
      return;
    }

    // Nếu đang đếm ngược rồi thì không kích hoạt thêm
    if (_isCounting) return;

    _isCounting = true;
    int remaining = countdownSeconds;

    _accessibilityManager.speak(
      AppLocalizations.t(
        'sos_countdown',
        lang,
      ).replaceAll('{seconds}', '$remaining'),
    );
    onCountdownTick?.call(remaining);

    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      remaining--;
      onCountdownTick?.call(remaining);

      if (remaining <= 0) {
        timer.cancel();
        _isCounting = false;
        _sendEmergency(numbers, lang);
      } else {
        // Đọc số giây còn lại mỗi giây
        _accessibilityManager.speak('$remaining');
      }
    });
  }

  /// Hủy SOS trong thời gian countdown.
  void cancelEmergency() {
    if (!_isCounting) return;
    _countdownTimer?.cancel();
    _isCounting = false;
    onCountdownTick?.call(null);
    _accessibilityManager.speak(
      AppLocalizations.t('sos_cancelled', _settings.language),
    );
  }

  bool get isCounting => _isCounting;

  Future<void> _sendEmergency(List<String> numbers, String lang) async {
    _accessibilityManager.speak(AppLocalizations.t('sos_triggered', lang));
    _accessibilityManager.triggerSOSVibration();

    try {
      Position position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
        ),
      );

      final String locLink =
          "https://maps.google.com/?q=${position.latitude},${position.longitude}";
      final String message = AppLocalizations.t(
        'sos_message',
        lang,
      ).replaceAll('{link}', locLink);

      // Attempt to send SMS to all numbers
      String allNumbers = numbers.join(',');
      final Uri smsUri = Uri(
        scheme: 'sms',
        path: allNumbers,
        queryParameters: <String, String>{'body': message},
      );

      _accessibilityManager.speak(AppLocalizations.t('sos_sending_sms', lang));
      if (await canLaunchUrl(smsUri)) {
        await launchUrl(smsUri);
      }

      // Follow up with a phone call to FIRST number
      final Uri phoneUri = Uri(scheme: 'tel', path: numbers.first);
      if (await canLaunchUrl(phoneUri)) {
        await launchUrl(phoneUri);
      }
    } catch (e) {
      _accessibilityManager.speak(AppLocalizations.t('sos_call_direct', lang));
      final Uri phoneUri = Uri(scheme: 'tel', path: numbers.first);
      if (await canLaunchUrl(phoneUri)) {
        await launchUrl(phoneUri);
      }
    }
  }

  void dispose() {
    _countdownTimer?.cancel();
  }
}
