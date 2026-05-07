import 'package:shared_preferences/shared_preferences.dart';

/// Singleton service for persisting user settings.
class SettingsService {
  static final SettingsService _instance = SettingsService._internal();
  factory SettingsService() => _instance;
  SettingsService._internal();

  SharedPreferences? _prefs;

  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  // --- Emergency Numbers ---
  List<String> get emergencyNumbers {
    final list = _prefs?.getStringList('emergency_numbers');
    if (list != null && list.isNotEmpty) {
      return List<String>.from(list);
    }
    // Fallback: check if old single string exists
    final oldNum = _prefs?.getString('emergency_number') ?? '';
    if (oldNum.isNotEmpty) {
      return [oldNum];
    }
    return [];
  }

  Future<void> setEmergencyNumbers(List<String> values) async {
    await _prefs?.setStringList('emergency_numbers', values);
  }

  // --- TTS Speech Rate (0.1 - 1.0) ---
  double get ttsSpeed => _prefs?.getDouble('tts_speed') ?? 0.5;

  Future<void> setTtsSpeed(double value) async {
    await _prefs?.setDouble('tts_speed', value);
  }

  // --- Default Mode Index ---
  // Mode order was updated:
  // old: [0,4,5,1,3,6] -> new: [0,5,4,1,3,6]
  int get defaultModeIndex {
    final prefs = _prefs;
    if (prefs == null) return 0;

    final migrated = prefs.getBool('default_mode_order_v2') ?? false;
    final current = prefs.getInt('default_mode_index') ?? 0;
    if (migrated) return current;

    const oldToNew = <int, int>{
      0: 0, // mode_0
      1: 2, // mode_4
      2: 1, // mode_5
      3: 3, // mode_1
      4: 4, // mode_3
      5: 5, // mode_6
    };
    final converted = oldToNew[current] ?? 0;
    prefs.setInt('default_mode_index', converted);
    prefs.setBool('default_mode_order_v2', true);
    return converted;
  }

  Future<void> setDefaultModeIndex(int value) async {
    await _prefs?.setInt('default_mode_index', value);
  }

  // --- First Launch ---
  bool get isFirstLaunch => _prefs?.getBool('is_first_launch') ?? true;

  Future<void> setFirstLaunchDone() async {
    await _prefs?.setBool('is_first_launch', false);
  }

  // --- Flash Mode ---
  bool get isFlashOn => _prefs?.getBool('is_flash_on') ?? false;

  Future<void> setFlashOn(bool value) async {
    await _prefs?.setBool('is_flash_on', value);
  }

  // --- Language (vi / en) ---
  String get language => _prefs?.getString('language') ?? 'vi';

  Future<void> setLanguage(String value) async {
    await _prefs?.setString('language', value);
  }

  // --- Warning Distance (meters) for danger alerts ---
  double get warningDistance => _prefs?.getDouble('warning_distance_m') ?? 2.0;

  Future<void> setWarningDistance(double value) async {
    await _prefs?.setDouble('warning_distance_m', value);
  }

  // --- Auto Flash in Low Light ---
  bool get autoFlashEnabled => _prefs?.getBool('auto_flash') ?? true;

  Future<void> setAutoFlashEnabled(bool value) async {
    await _prefs?.setBool('auto_flash', value);
  }

  // --- Light Threshold (KB) for low-light detection ---
  // Smaller value = more sensitive (flash triggers more easily)
  // Range: 5 (very sensitive) to 50 (less sensitive), default 20
  double get lightThresholdKB =>
      _prefs?.getDouble('light_threshold_kb') ?? 20.0;

  Future<void> setLightThresholdKB(double value) async {
    await _prefs?.setDouble('light_threshold_kb', value);
  }

  // --- Walk Mode FPS Limit ---
  int get fpsLimit => _prefs?.getInt('fps_limit') ?? 3;

  Future<void> setFpsLimit(int value) async {
    await _prefs?.setInt('fps_limit', value);
  }

  // --- Auto Battery Saving (FPS) ---
  bool get autoFpsBatterySaving =>
      _prefs?.getBool('auto_fps_battery_saving') ?? true;

  Future<void> setAutoFpsBatterySaving(bool value) async {
    await _prefs?.setBool('auto_fps_battery_saving', value);
  }

  // --- Auth Token / User ---
  String get authToken => _prefs?.getString('auth_token') ?? '';

  String get authEmail => _prefs?.getString('auth_email') ?? '';

  bool get isLoggedIn => authToken.isNotEmpty;

  Future<void> setAuthSession({
    required String token,
    required String email,
  }) async {
    await _prefs?.setString('auth_token', token);
    await _prefs?.setString('auth_email', email);
  }

  Future<void> clearAuthSession() async {
    await _prefs?.remove('auth_token');
    await _prefs?.remove('auth_email');
  }

  // --- Spatial Audio ---
  bool get spatialAudioEnabled =>
      _prefs?.getBool('spatial_audio_enabled') ?? true;

  Future<void> setSpatialAudioEnabled(bool value) async {
    await _prefs?.setBool('spatial_audio_enabled', value);
  }

  double get spatialAudioVolume =>
      _prefs?.getDouble('spatial_audio_volume') ?? 0.8;

  Future<void> setSpatialAudioVolume(double value) async {
    await _prefs?.setDouble('spatial_audio_volume', value);
  }

  bool get headphonesOnlyMode =>
      _prefs?.getBool('headphones_only_mode') ?? true;

  Future<void> setHeadphonesOnlyMode(bool value) async {
    await _prefs?.setBool('headphones_only_mode', value);
  }

  // --- Face Recognition ---
  bool get faceRecognitionEnabled =>
      _prefs?.getBool('face_recognition_enabled') ?? true;

  Future<void> setFaceRecognitionEnabled(bool value) async {
    await _prefs?.setBool('face_recognition_enabled', value);
  }
}
