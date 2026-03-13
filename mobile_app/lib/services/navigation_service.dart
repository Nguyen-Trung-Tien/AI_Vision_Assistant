import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_compass/flutter_compass.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:mobile_app/services/accessibility_manager.dart';
import 'package:mobile_app/services/settings_service.dart';
import 'package:mobile_app/l10n/app_localizations.dart';
import 'package:speech_to_text/speech_to_text.dart';

class NavigationService {
  final AccessibilityManager _accessibilityManager = AccessibilityManager();
  final SettingsService _settings = SettingsService();
  final SpeechToText _speechToText = SpeechToText();

  // Load GMaps API Key from dart constants, or leave empty if not set
  final String _googleMapsApiKey =
      const String.fromEnvironment('MAP_API_KEY', defaultValue: '');

  bool _isNavigating = false;
  bool _isSpeechInitialized = false;
  StreamSubscription<CompassEvent>? _compassSub;
  StreamSubscription<Position>? _positionSub;

  // To avoid spamming TTS
  DateTime _lastSpokenTime = DateTime.now().subtract(
    const Duration(seconds: 10),
  );
  DateTime _lastGeocodedTime = DateTime.now().subtract(
    const Duration(seconds: 30),
  );

  Future<void> initSpeech() async {
    _isSpeechInitialized = await _speechToText.initialize(
      onError: (val) => debugPrint('Speech error: $val'),
      onStatus: (val) => debugPrint('Speech status: $val'),
    );
  }

  Future<String?> listenForDestination() async {
    if (!_isSpeechInitialized) {
      await initSpeech();
    }
    if (!_isSpeechInitialized) return null;

    if (_speechToText.isListening) {
      await _speechToText.stop();
      return null;
    }

    String recognizedText = '';
    _accessibilityManager.speak("Hãy nói tên địa điểm bạn muốn đến");
    await Future.delayed(const Duration(seconds: 2));

    await _speechToText.listen(
      onResult: (result) {
        recognizedText = result.recognizedWords;
      },
      localeId: 'vi_VN',
      pauseFor: const Duration(seconds: 3),
    );

    while (_speechToText.isListening) {
      await Future.delayed(const Duration(milliseconds: 100));
    }

    if (recognizedText.isNotEmpty) {
      _accessibilityManager.speak("Đang tìm đường đến $recognizedText");
      debugPrint('Recognized Destination: $recognizedText');
      return recognizedText;
    }

    _accessibilityManager.speak("Không nghe rõ địa điểm, vui lòng thử lại.");
    return null;
  }

  Future<Map<String, dynamic>?> getDirections(
      String destinationQuery, double lat, double lng) async {
    if (_googleMapsApiKey.isEmpty) {
      _accessibilityManager.speak(
          "Thiếu API Key bản đồ. Tính năng chỉ đường nâng cao không hoạt động.");
      return null;
    }

    try {
      final placeSearchUrl = Uri.parse(
          'https://maps.googleapis.com/maps/api/place/findplacefromtext/json?'
          'input=${Uri.encodeComponent(destinationQuery)}&inputtype=textquery&fields=place_id,name,geometry'
          '&locationbias=circle:50000@$lat,$lng'
          '&key=$_googleMapsApiKey');

      final placeResponse = await http.get(placeSearchUrl);
      if (placeResponse.statusCode != 200) return null;

      final placeData = json.decode(placeResponse.body);
      if (placeData['status'] != 'OK' || placeData['candidates'].isEmpty) {
        _accessibilityManager.speak("Không tìm thấy địa điểm này.");
        return null;
      }

      final candidate = placeData['candidates'][0];
      final targetLat = candidate['geometry']['location']['lat'];
      final targetLng = candidate['geometry']['location']['lng'];
      final targetName = candidate['name'];

      _accessibilityManager
          .speak("Đã tìm thấy $targetName. Bắt đầu hướng dẫn lộ trình.");

      final directionsUrl = Uri.parse(
          'https://maps.googleapis.com/maps/api/directions/json?'
          'origin=$lat,$lng'
          '&destination=$targetLat,$targetLng'
          '&mode=walking&language=vi'
          '&key=$_googleMapsApiKey');

      final dirResponse = await http.get(directionsUrl);
      if (dirResponse.statusCode == 200) {
        return json.decode(dirResponse.body);
      }
    } catch (e) {
      debugPrint("Error getting directions: $e");
      _accessibilityManager.speak("Đã có lỗi xảy ra khi lấy lộ trình.");
    }
    return null;
  }

  String stripHtmlTags(String htmlString) {
    RegExp exp = RegExp(r"<[^>]*>", multiLine: true, caseSensitive: true);
    return htmlString.replaceAll(exp, '');
  }

  Future<void> startNavigation() async {
    if (_isNavigating) return;

    final lang = _settings.language;

    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      _accessibilityManager.speak(AppLocalizations.t('nav_gps_disabled', lang));
      return;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        _accessibilityManager.speak(
          AppLocalizations.t('nav_permission_denied', lang),
        );
        return;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      _accessibilityManager.speak(
        AppLocalizations.t('nav_permission_forever', lang),
      );
      return;
    }

    _isNavigating = true;
    _accessibilityManager.triggerSuccessVibration();
    _accessibilityManager.speak(AppLocalizations.t('nav_started', lang));

    // La bàn — thông báo hướng mỗi 5 giây
    _compassSub = FlutterCompass.events?.listen((CompassEvent event) {
      if (!_isNavigating) return;
      final heading = event.heading;
      if (heading != null) _announceDirection(heading);
    });

    // GPS — đọc tên đường mỗi khi di chuyển > 10m
    _positionSub =
        Geolocator.getPositionStream(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.best,
            distanceFilter: 10,
          ),
        ).listen((Position position) async {
          if (!_isNavigating) return;
          _accessibilityManager.triggerSuccessVibration();
          await _announceStreetName(position, lang);
        });
  }

  void _announceDirection(double heading) {
    final now = DateTime.now();
    if (now.difference(_lastSpokenTime).inSeconds < 5) return;

    final lang = _settings.language;
    final directions = {
      'north': AppLocalizations.t('nav_dir_north', lang),
      'east': AppLocalizations.t('nav_dir_east', lang),
      'south': AppLocalizations.t('nav_dir_south', lang),
      'west': AppLocalizations.t('nav_dir_west', lang),
    };

    String dirKey = '';
    if (heading >= 315 || heading < 45) {
      dirKey = 'north';
    } else if (heading >= 45 && heading < 135) {
      dirKey = 'east';
    } else if (heading >= 135 && heading < 225) {
      dirKey = 'south';
    } else {
      dirKey = 'west';
    }

    if (dirKey.isNotEmpty) {
      final dir = directions[dirKey]!;
      _accessibilityManager.speak(
        AppLocalizations.t('nav_heading', lang).replaceAll('{dir}', dir),
      );
      _lastSpokenTime = now;
    }
  }

  /// Reverse geocode via Nominatim (OpenStreetMap, miễn phí).
  /// Chỉ gọi tối đa 1 lần/30 giây để tránh spam API.
  Future<void> _announceStreetName(Position position, String lang) async {
    final now = DateTime.now();
    if (now.difference(_lastGeocodedTime).inSeconds < 30) return;
    _lastGeocodedTime = now;

    try {
      final uri = Uri.parse(
        'https://nominatim.openstreetmap.org/reverse'
        '?lat=${position.latitude}&lon=${position.longitude}'
        '&format=json&accept-language=${lang == "vi" ? "vi" : "en"}',
      );

      final response = await http
          .get(uri, headers: {'User-Agent': 'AIVisionAssistant/1.0'})
          .timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        final address = data['address'] as Map<String, dynamic>?;

        if (address != null) {
          final road =
              address['road'] as String? ??
              address['pedestrian'] as String? ??
              address['footway'] as String?;
          final suburb =
              address['suburb'] as String? ??
              address['neighbourhood'] as String?;

          if (road != null) {
            final msg = AppLocalizations.t(
              'nav_on_street',
              lang,
            ).replaceAll('{road}', road).replaceAll('{area}', suburb ?? '');
            _accessibilityManager.speak(msg);
            debugPrint('[Navigation] Street: $road, area: $suburb');
          }
        }
      }
    } on Exception catch (e) {
      debugPrint('[Navigation] Geocode error: $e');
      // Không thông báo lỗi geocode cho người dùng — chỉ log
    }
  }

  void stopNavigation() {
    _isNavigating = false;
    _compassSub?.cancel();
    _positionSub?.cancel();
    _compassSub = null;
    _positionSub = null;
  }
}
