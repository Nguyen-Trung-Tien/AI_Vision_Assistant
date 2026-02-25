import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:mobile_app/services/accessibility_manager.dart';
import 'package:mobile_app/services/settings_service.dart';

class SosService {
  final AccessibilityManager _accessibilityManager = AccessibilityManager();
  final SettingsService _settings = SettingsService();

  Future<void> triggerEmergency() async {
    final emergencyNumber = _settings.emergencyNumber;

    _accessibilityManager.speak(
      'Đã kích hoạt cảnh báo khẩn cấp. Đang lấy vị trí.',
    );
    _accessibilityManager.triggerSOSVibration();

    try {
      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      String message =
          "Khẩn cấp! Tôi đang cần giúp đỡ tại toạ độ: "
          "https://maps.google.com/?q=${position.latitude},${position.longitude}";

      final Uri smsUri = Uri(
        scheme: 'sms',
        path: emergencyNumber,
        queryParameters: <String, String>{'body': message},
      );

      _accessibilityManager.speak('Đang gửi tin nhắn vị trí.');
      if (await canLaunchUrl(smsUri)) {
        await launchUrl(smsUri);
      }

      // Follow up with a phone call
      final Uri phoneUri = Uri(scheme: 'tel', path: emergencyNumber);
      if (await canLaunchUrl(phoneUri)) {
        await launchUrl(phoneUri);
      }
    } catch (e) {
      _accessibilityManager.speak(
        'Không thể lấy được định vị. Sẽ gọi điện trực tiếp.',
      );
      final Uri phoneUri = Uri(scheme: 'tel', path: emergencyNumber);
      if (await canLaunchUrl(phoneUri)) {
        await launchUrl(phoneUri);
      }
    }
  }
}
