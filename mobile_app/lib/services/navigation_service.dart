import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_compass/flutter_compass.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:mobile_app/l10n/app_localizations.dart';
import 'package:mobile_app/services/accessibility_manager.dart';
import 'package:mobile_app/services/settings_service.dart';
import 'package:speech_to_text/speech_to_text.dart';

class NavigationService {
  final AccessibilityManager _accessibilityManager = AccessibilityManager();
  final SettingsService _settings = SettingsService();
  final SpeechToText _speechToText = SpeechToText();

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

    _accessibilityManager.speak(
      "Không nghe rõ địa điểm, vui lòng thử lại.",
    );
    return null;
  }

  Future<Map<String, dynamic>?> getDirections(
    String destinationQuery,
    double lat,
    double lng,
  ) async {
    try {
      final searchUrl = Uri.parse(
        'https://nominatim.openstreetmap.org/search'
        '?format=jsonv2&limit=1&q=${Uri.encodeComponent(destinationQuery)}',
      );

      final searchResponse = await http.get(
        searchUrl,
        headers: {'User-Agent': 'AIVisionAssistant/1.0'},
      );
      if (searchResponse.statusCode != 200) return null;

      final searchData = json.decode(searchResponse.body) as List<dynamic>;
      if (searchData.isEmpty) {
        _accessibilityManager.speak("Không tìm thấy địa điểm này.");
        return null;
      }

      final candidate = searchData.first as Map<String, dynamic>;
      final targetLat = double.tryParse(candidate['lat']?.toString() ?? '');
      final targetLng = double.tryParse(candidate['lon']?.toString() ?? '');
      final targetName = candidate['display_name']?.toString() ??
          destinationQuery;

      if (targetLat == null || targetLng == null) {
        _accessibilityManager.speak("Không tìm thấy địa điểm này.");
        return null;
      }

      _accessibilityManager.speak(
        "Đã tìm thấy $targetName. Bắt đầu hướng dẫn lộ trình.",
      );

      final directionsUrl = Uri.parse(
        'https://router.project-osrm.org/route/v1/foot/'
        '$lng,$lat;$targetLng,$targetLat'
        '?overview=false&steps=true',
      );

      final dirResponse = await http.get(
        directionsUrl,
        headers: {'User-Agent': 'AIVisionAssistant/1.0'},
      );
      if (dirResponse.statusCode != 200) return null;

      final routeData = json.decode(dirResponse.body) as Map<String, dynamic>;
      final routes = routeData['routes'] as List<dynamic>?;
      if (routes == null || routes.isEmpty) return null;

      final route = routes.first as Map<String, dynamic>;
      final legs = route['legs'] as List<dynamic>? ?? [];
      if (legs.isEmpty) return null;

      final leg = legs.first as Map<String, dynamic>;
      final stepsRaw = leg['steps'] as List<dynamic>? ?? [];
      final steps = <Map<String, dynamic>>[];

      for (final raw in stepsRaw) {
        final step = raw as Map<String, dynamic>;
        final maneuver = step['maneuver'] as Map<String, dynamic>? ?? {};
        final location = maneuver['location'] as List<dynamic>? ?? [];
        if (location.length < 2) continue;
        final endLng = (location[0] as num).toDouble();
        final endLat = (location[1] as num).toDouble();
        final instruction = _formatOsrmInstruction(step);
        steps.add({
          'end_location': {'lat': endLat, 'lng': endLng},
          'html_instructions': instruction,
        });
      }

      if (steps.isEmpty) {
        steps.add({
          'end_location': {'lat': targetLat, 'lng': targetLng},
          'html_instructions': 'Đi tới điểm đến',
        });
      }

      return {
        'routes': [
          {
            'legs': [
              {
                'steps': steps,
                'end_location': {'lat': targetLat, 'lng': targetLng},
                'end_address': targetName,
              },
            ],
          },
        ],
      };
    } catch (e) {
      debugPrint("Error getting directions: $e");
      _accessibilityManager.speak(
        "Đã có lỗi xảy ra khi lấy lộ trình.",
      );
    }
    return null;
  }

  String _formatOsrmInstruction(Map<String, dynamic> step) {
    final maneuver = step['maneuver'] as Map<String, dynamic>? ?? {};
    final type = maneuver['type']?.toString() ?? '';
    final modifier = maneuver['modifier']?.toString() ?? '';
    final roadName = (step['name'] as String?)?.trim() ?? '';

    final action = _formatAction(type, modifier);
    if (roadName.isNotEmpty && action != 'Đã đến nơi') {
      return '$action vào $roadName';
    }
    return action;
  }

  String _formatAction(String type, String modifier) {
    final direction = _formatDirection(modifier);
    switch (type) {
      case 'depart':
        return 'Bắt đầu đi';
      case 'arrive':
        return 'Đã đến nơi';
      case 'roundabout':
        return 'Đi vào vòng xuyến';
      case 'merge':
        return 'Nhập vào';
      case 'on ramp':
        return 'Lên đường dẫn';
      case 'off ramp':
        return 'Ra khỏi đường dẫn';
      case 'fork':
      case 'turn':
      case 'end of road':
        return direction.isNotEmpty ? 'Rẽ $direction' : 'Rẽ';
      case 'continue':
      case 'new name':
        return direction.isNotEmpty && direction != 'thẳng'
            ? 'Tiếp tục $direction'
            : 'Tiếp tục đi thẳng';
      case 'uturn':
        return 'Quay đầu';
      default:
        return direction.isNotEmpty ? 'Rẽ $direction' : 'Tiếp tục';
    }
  }

  String _formatDirection(String modifier) {
    switch (modifier) {
      case 'left':
        return 'trái';
      case 'right':
        return 'phải';
      case 'straight':
        return 'thẳng';
      case 'slight left':
        return 'chếch trái';
      case 'slight right':
        return 'chếch phải';
      case 'sharp left':
        return 'gắt trái';
      case 'sharp right':
        return 'gắt phải';
      case 'uturn':
        return 'quay đầu';
      default:
        return '';
    }
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

  /// Reverse geocode via Nominatim (OpenStreetMap).
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
