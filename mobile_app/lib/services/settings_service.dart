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

  // --- Emergency Number ---
  String get emergencyNumber => _prefs?.getString('emergency_number') ?? '';

  Future<void> setEmergencyNumber(String value) async {
    await _prefs?.setString('emergency_number', value);
  }

  // --- TTS Speech Rate (0.1 - 1.0) ---
  double get ttsSpeed => _prefs?.getDouble('tts_speed') ?? 0.5;

  Future<void> setTtsSpeed(double value) async {
    await _prefs?.setDouble('tts_speed', value);
  }

  // --- Default Mode Index (0-4) ---
  int get defaultModeIndex => _prefs?.getInt('default_mode_index') ?? 0;

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
}
