import 'package:flutter_compass/flutter_compass.dart';
import 'package:geolocator/geolocator.dart';
import 'package:mobile_app/services/accessibility_manager.dart';

class NavigationService {
  final AccessibilityManager _accessibilityManager = AccessibilityManager();
  bool _isNavigating = false;

  // To avoid spamming TTS
  DateTime _lastSpokenTime = DateTime.now().subtract(
    const Duration(seconds: 10),
  );

  Future<void> startNavigation() async {
    if (_isNavigating) return;

    bool serviceEnabled;
    LocationPermission permission;

    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      _accessibilityManager.speak('Vui lòng bật định vị GPS.');
      return;
    }

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        _accessibilityManager.speak('Cần cấp quyền vị trí để định hướng.');
        return;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      _accessibilityManager.speak('Quyền vị trí bị từ chối vĩnh viễn.');
      return;
    }

    _isNavigating = true;
    _accessibilityManager.triggerSuccessVibration();
    _accessibilityManager.speak('Bắt đầu định hướng.');

    FlutterCompass.events?.listen((CompassEvent event) {
      if (!_isNavigating) return;

      final double? heading = event.heading;
      if (heading != null) {
        _announceDirection(heading);
      }
    });

    Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.best,
        distanceFilter: 10, // Announce every 10 meters
      ),
    ).listen((Position position) {
      if (!_isNavigating) return;
      // Ideally, reverse geocode to get street name here.
      // For now, simple beep to indicate movement tracking.
      _accessibilityManager.triggerSuccessVibration();
    });
  }

  void _announceDirection(double heading) {
    final now = DateTime.now();
    if (now.difference(_lastSpokenTime).inSeconds < 5) {
      return; // Speak every 5 secs max
    }

    String direction = '';
    if (heading >= 315 || heading < 45) {
      direction = 'Bắc';
    } else if (heading >= 45 && heading < 135) {
      direction = 'Đông';
    } else if (heading >= 135 && heading < 225) {
      direction = 'Nam';
    } else if (heading >= 225 && heading < 315) {
      direction = 'Tây';
    }

    if (direction.isNotEmpty) {
      _accessibilityManager.speak('Bạn đang hướng về phía $direction');
      _lastSpokenTime = now;
    }
  }

  void stopNavigation() {
    _isNavigating = false;
  }
}
