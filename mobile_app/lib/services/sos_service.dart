import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:mobile_app/services/accessibility_manager.dart';
import 'package:mobile_app/services/settings_service.dart';
import 'package:mobile_app/l10n/app_localizations.dart';

class SosService {
  final AccessibilityManager _accessibilityManager = AccessibilityManager();
  final SettingsService _settings = SettingsService();

  Future<void> triggerEmergency() async {
    final numbers = _settings.emergencyNumbers;
    if (numbers.isEmpty) {
      _accessibilityManager.speak(
        AppLocalizations.t('sos_no_numbers', _settings.language),
      );
      return;
    }

    _accessibilityManager.speak(
      AppLocalizations.t('sos_triggered', _settings.language),
    );
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
        _settings.language,
      ).replaceAll('{link}', locLink);

      // Attempt to send SMS to all numbers (platform limitations might just open app)
      String allNumbers = numbers.join(',');
      final Uri smsUri = Uri(
        scheme: 'sms',
        path: allNumbers,
        queryParameters: <String, String>{'body': message},
      );

      _accessibilityManager.speak(
        AppLocalizations.t('sos_sending_sms', _settings.language),
      );
      if (await canLaunchUrl(smsUri)) {
        await launchUrl(smsUri);
      }

      // Follow up with a phone call to FIRST number
      final Uri phoneUri = Uri(scheme: 'tel', path: numbers.first);
      if (await canLaunchUrl(phoneUri)) {
        await launchUrl(phoneUri);
      }
    } catch (e) {
      _accessibilityManager.speak(
        AppLocalizations.t('sos_call_direct', _settings.language),
      );
      final Uri phoneUri = Uri(scheme: 'tel', path: numbers.first);
      if (await canLaunchUrl(phoneUri)) {
        await launchUrl(phoneUri);
      }
    }
  }
}
