import 'package:flutter_soloud/flutter_soloud.dart';
import 'package:mobile_app/services/settings_service.dart';
import 'package:mobile_app/utils/spatial_utils.dart';

class SpatialAudioService {
  static final SpatialAudioService _instance = SpatialAudioService._internal();
  factory SpatialAudioService() => _instance;

  final SettingsService _settings = SettingsService();

  bool _isInitialized = false;

  AudioSource? _highSource;
  AudioSource? _mediumSource;
  AudioSource? _lowSource;

  /// Cooldown to prevent audio overlap during continuous stream (3-5 FPS)
  DateTime _lastPlayTime = DateTime(2000);
  static const Duration _minPlayInterval = Duration(milliseconds: 800);

  SpatialAudioService._internal() {
    _init();
  }

  Future<void> _init() async {
    try {
      final soloud = SoLoud.instance;
      if (!soloud.isInitialized) {
        await soloud.init();
      }

      // Load sound assets from Flutter asset bundle
      _highSource = await soloud.loadAsset('assets/audio/alert_high.wav');
      _mediumSource = await soloud.loadAsset('assets/audio/alert_medium.wav');
      _lowSource = await soloud.loadAsset('assets/audio/alert_low.wav');

      _isInitialized = true;
    } catch (e) {
      debugPrintMessage("SpatialAudioService initialization error: $e");
    }
  }

  /// Plays a directional alert based on position and risk level.
  ///
  /// [position] - String from server: "bên trái", "bên phải", "chính giữa"
  /// [level] - String: "high", "medium", "low"
  /// [distance] - double: meters
  /// [centerXRatio] - optional: 0.0 (left edge) to 1.0 (right edge) for gradient pan
  Future<void> playDirectionalAlert({
    required String position,
    required String level,
    required double distance,
    double? centerXRatio,
  }) async {
    if (!_isInitialized || !_settings.spatialAudioEnabled) return;

    // Throttle: prevent audio overlap during rapid continuous stream
    final now = DateTime.now();
    if (now.difference(_lastPlayTime) < _minPlayInterval) {
      return;
    }
    _lastPlayTime = now;

    AudioSource? source;
    switch (level.toLowerCase()) {
      case 'high':
      case 'emergency':
      case 'danger':
        source = _highSource;
        break;
      case 'medium':
      case 'warning':
        source = _mediumSource;
        break;
      case 'low':
      case 'info':
        source = _lowSource;
        break;
      default:
        source = _lowSource;
    }

    if (source == null) return;

    // 1. Calculate Pan — prefer gradient from centerXRatio, fallback to text
    double pan;
    if (centerXRatio != null) {
      pan = panFromCenterXRatio(centerXRatio);
    } else {
      pan = panFromPositionText(position);
    }

    // 2. Calculate Volume based on distance
    final maxDist = _settings.warningDistance;
    final volumeFactor = volumeFromDistance(distance, maxDist);
    final finalVolume = volumeFactor * _settings.spatialAudioVolume;

    try {
      final soloud = SoLoud.instance;
      soloud.play(
        source,
        volume: finalVolume.clamp(0.0, 1.0),
        pan: pan.clamp(-1.0, 1.0),
      );
      // Handle is auto-managed by SoLoud, no manual cleanup needed
    } catch (e) {
      debugPrintMessage("Error playing spatial alert: $e");
    }
  }

  void debugPrintMessage(String msg) {
    assert(() {
      // ignore: avoid_print
      print(msg);
      return true;
    }());
  }

  void dispose() {
    try {
      final soloud = SoLoud.instance;
      if (_highSource != null) soloud.disposeSource(_highSource!);
      if (_mediumSource != null) soloud.disposeSource(_mediumSource!);
      if (_lowSource != null) soloud.disposeSource(_lowSource!);
    } catch (_) {}
  }
}
