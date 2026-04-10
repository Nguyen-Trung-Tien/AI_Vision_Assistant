import 'package:flutter/material.dart';
import 'package:mobile_app/l10n/app_localizations.dart';
import 'package:mobile_app/screens/emergency_contacts_screen.dart';
import 'package:mobile_app/screens/login_screen.dart';
import 'package:mobile_app/services/accessibility_manager.dart';
import 'package:mobile_app/services/settings_service.dart';
import 'package:mobile_app/theme/app_theme.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final AccessibilityManager _accessibility = AccessibilityManager();
  final SettingsService _settings = SettingsService();

  late double _ttsSpeed;
  late int _defaultMode;
  late String _language;
  late double _lightThreshold;
  late int _fpsLimit;
  late bool _autoFpsBatterySaving;
  late bool _spatialAudioEnabled;
  late double _spatialAudioVolume;
  late bool _headphonesOnlyMode;

  List<String> _getModeNames(String lang) {
    return [
      AppLocalizations.t('mode_0', lang),
      AppLocalizations.t('mode_5', lang),
      AppLocalizations.t('mode_4', lang),
      AppLocalizations.t('mode_1', lang),
      AppLocalizations.t('mode_3', lang),
      AppLocalizations.t('mode_6', lang),
    ];
  }

  String _modeSpokenByIndex(int index) {
    const spokenKeys = [
      'mode_0_spoken',
      'mode_5_spoken',
      'mode_4_spoken',
      'mode_1_spoken',
      'mode_3_spoken',
      'mode_6_spoken',
    ];
    if (index < 0 || index >= spokenKeys.length) return spokenKeys.first;
    return spokenKeys[index];
  }

  @override
  void initState() {
    super.initState();
    _ttsSpeed = _settings.ttsSpeed;
    _language = _settings.language;
    _defaultMode = _settings.defaultModeIndex.clamp(
      0,
      _getModeNames(_language).length - 1,
    );
    _lightThreshold = _settings.lightThresholdKB;
    _fpsLimit = _settings.fpsLimit;
    _autoFpsBatterySaving = _settings.autoFpsBatterySaving;
    _spatialAudioEnabled = _settings.spatialAudioEnabled;
    _spatialAudioVolume = _settings.spatialAudioVolume;
    _headphonesOnlyMode = _settings.headphonesOnlyMode;

    _accessibility.speak(
      AppLocalizations.t('settings_screen_spoken', _language),
    );
  }

  @override
  Widget build(BuildContext context) {
    final modeNames = _getModeNames(_language);

    return Scaffold(
      backgroundColor: AppTheme.bgPrimary,
      appBar: AppBar(
        backgroundColor: AppTheme.bgCard,
        elevation: 0,
        title: Text(
          AppLocalizations.t('settings_title', _language),
          style: AppTheme.titleLarge,
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
          onPressed: () {
            _accessibility.speak(AppLocalizations.t('back', _language));
            Navigator.pop(context);
          },
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _buildSectionTitle(
            AppLocalizations.t('settings_emergency', _language),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: AppTheme.cardDecoration(borderRadius: 16),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () {
                  _accessibility.speak('Mở quản lý liên hệ khẩn cấp');
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const EmergencyContactsScreen(),
                    ),
                  );
                },
                borderRadius: BorderRadius.circular(14),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: AppTheme.gradientButtonDecoration(),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.contacts_rounded,
                        color: Colors.white,
                        size: 22,
                      ),
                      const SizedBox(width: 10),
                      Text(
                        AppLocalizations.t(
                          'settings_emergency_add_contact',
                          _language,
                        ),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 32),
          _buildSectionTitle(
            '${AppLocalizations.t('settings_tts_speed', _language)} ${(_ttsSpeed * 100).toInt()}%',
          ),
          const SizedBox(height: 8),
          SliderTheme(
            data: SliderTheme.of(context).copyWith(
              activeTrackColor: AppTheme.accentPurple,
              inactiveTrackColor: AppTheme.whiteAlpha(0.2),
              thumbColor: AppTheme.accentCyan,
              thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 14),
              trackHeight: 6,
            ),
            child: Slider(
              value: _ttsSpeed,
              min: 0.1,
              max: 1.0,
              divisions: 9,
              onChanged: (value) => setState(() => _ttsSpeed = value),
              onChangeEnd: (value) async {
                await _settings.setTtsSpeed(value);
                await _accessibility.refreshTtsSpeed();
                final msg = AppLocalizations.t(
                  'settings_tts_speed_spoken',
                  _language,
                );
                _accessibility.speak('$msg ${(value * 100).toInt()}%');
              },
            ),
          ),
          const SizedBox(height: 32),
          _buildSectionTitle(
            AppLocalizations.t('settings_default_mode', _language),
          ),
          const SizedBox(height: 8),
          ...List.generate(modeNames.length, (index) {
            final isSelected = _defaultMode == index;
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: GestureDetector(
                onTap: () async {
                  setState(() => _defaultMode = index);
                  await _settings.setDefaultModeIndex(index);
                  final msg = AppLocalizations.t(
                    'settings_default_mode_spoken',
                    _language,
                  );
                  _accessibility.speak(
                    '$msg ${AppLocalizations.t(_modeSpokenByIndex(index), _language)}',
                  );
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    vertical: 14,
                    horizontal: 16,
                  ),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? AppTheme.accentPurple.withValues(alpha: 0.25)
                        : AppTheme.whiteAlpha(0.06),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isSelected
                          ? AppTheme.accentPurple
                          : Colors.transparent,
                      width: 2,
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        isSelected
                            ? Icons.radio_button_checked_rounded
                            : Icons.radio_button_off_rounded,
                        color: isSelected
                            ? AppTheme.accentCyan
                            : AppTheme.whiteAlpha(0.5),
                        size: 28,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          modeNames[index],
                          style: TextStyle(
                            color: isSelected ? Colors.white : Colors.white70,
                            fontSize: 18,
                            fontWeight: isSelected
                                ? FontWeight.bold
                                : FontWeight.normal,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),
          const SizedBox(height: 32),
          _buildSectionTitle(
            AppLocalizations.t('settings_language', _language),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              _buildLangOption('vi', 'Tiếng Việt'),
              const SizedBox(width: 12),
              _buildLangOption('en', 'English'),
            ],
          ),
          const SizedBox(height: 32),
          // --- Spatial Audio Section ---
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildSectionTitle(
                AppLocalizations.t('settings_spatial_audio', _language),
              ),
              Switch(
                value: _spatialAudioEnabled,
                activeThumbColor: AppTheme.accentCyan,
                onChanged: (value) async {
                  setState(() => _spatialAudioEnabled = value);
                  await _settings.setSpatialAudioEnabled(value);
                  _accessibility.speak(
                    value ? 'Đã bật âm thanh 3D' : 'Đã tắt âm thanh 3D',
                  );
                },
              ),
            ],
          ),
          Text(
            AppLocalizations.t('settings_spatial_audio_desc', _language),
            style: const TextStyle(color: Colors.white54, fontSize: 13),
          ),
          if (_spatialAudioEnabled) ...[
            const SizedBox(height: 16),
            _buildSectionTitle(
              '${AppLocalizations.t('settings_spatial_volume', _language)} ${(_spatialAudioVolume * 100).toInt()}%',
            ),
            const SizedBox(height: 8),
            SliderTheme(
              data: SliderTheme.of(context).copyWith(
                activeTrackColor: AppTheme.accentCyan,
                inactiveTrackColor: AppTheme.whiteAlpha(0.2),
                thumbColor: AppTheme.accentCyan,
                thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 14),
                trackHeight: 6,
              ),
              child: Slider(
                value: _spatialAudioVolume,
                min: 0.0,
                max: 1.0,
                divisions: 10,
                onChanged: (value) =>
                    setState(() => _spatialAudioVolume = value),
                onChangeEnd: (value) async {
                  await _settings.setSpatialAudioVolume(value);
                  final msg = AppLocalizations.t(
                    'settings_spatial_volume_spoken',
                    _language,
                  );
                  _accessibility.speak('$msg ${(value * 100).toInt()}%');
                },
              ),
            ),
            const SizedBox(height: 12),
            SwitchListTile(
              title: Text(
                AppLocalizations.t('settings_headphones_only', _language),
                style: const TextStyle(color: Colors.white, fontSize: 16),
              ),
              subtitle: Text(
                AppLocalizations.t('settings_headphones_only_desc', _language),
                style: const TextStyle(color: Colors.white54, fontSize: 13),
              ),
              value: _headphonesOnlyMode,
              activeThumbColor: AppTheme.accentCyan,
              contentPadding: EdgeInsets.zero,
              onChanged: (value) async {
                setState(() => _headphonesOnlyMode = value);
                await _settings.setHeadphonesOnlyMode(value);
                _accessibility.speak(
                  value ? 'Đã bật chế độ tai nghe' : 'Đã tắt chế độ tai nghe',
                );
              },
            ),
          ],
          const SizedBox(height: 32),
          _buildSectionTitle(
            '${AppLocalizations.t('settings_light_threshold', _language)} ${_lightThreshold.toStringAsFixed(0)}KB',
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                AppLocalizations.t('settings_light_high', _language),
                style: const TextStyle(color: Colors.white54, fontSize: 13),
              ),
              Text(
                AppLocalizations.t('settings_light_low', _language),
                style: const TextStyle(color: Colors.amber, fontSize: 13),
              ),
            ],
          ),
          const SizedBox(height: 4),
          SliderTheme(
            data: SliderTheme.of(context).copyWith(
              activeTrackColor: Colors.amber,
              inactiveTrackColor: Colors.white.withValues(alpha: 0.2),
              thumbColor: Colors.amber,
              thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 14),
              trackHeight: 6,
            ),
            child: Slider(
              value: _lightThreshold,
              min: 5,
              max: 50,
              divisions: 9,
              onChanged: (value) => setState(() => _lightThreshold = value),
              onChangeEnd: (value) async {
                await _settings.setLightThresholdKB(value);
                final msg = AppLocalizations.t(
                  'settings_light_threshold_spoken',
                  _language,
                );
                _accessibility.speak('$msg ${value.toStringAsFixed(0)}KB');
              },
            ),
          ),
          const SizedBox(height: 32),
          _buildSectionTitle(
            '${_language == 'vi' ? 'Khung hình đi bộ:' : 'Walking FPS:'} $_fpsLimit FPS',
          ),
          const SizedBox(height: 8),
          SliderTheme(
            data: SliderTheme.of(context).copyWith(
              activeTrackColor: AppTheme.accentGreen,
              inactiveTrackColor: AppTheme.whiteAlpha(0.2),
              thumbColor: AppTheme.accentGreen,
              thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 14),
              trackHeight: 6,
            ),
            child: Slider(
              value: _fpsLimit.toDouble(),
              min: 1,
              max: 5,
              divisions: 4,
              onChanged: (value) => setState(() => _fpsLimit = value.toInt()),
              onChangeEnd: (value) async {
                final intFps = value.toInt();
                await _settings.setFpsLimit(intFps);
                _accessibility.speak('Giới hạn $intFps khung hình mỗi giây');
              },
            ),
          ),
          const SizedBox(height: 16),
          SwitchListTile(
            title: Text(
              _language == 'vi'
                  ? 'Giảm cấu hình khi pin yếu'
                  : 'Reduce FPS on low battery',
              style: const TextStyle(color: Colors.white, fontSize: 16),
            ),
            subtitle: Text(
              _language == 'vi'
                  ? 'Tự động giảm còn 1 FPS khi pin < 20%'
                  : 'Auto drop to 1 FPS when battery < 20%',
              style: const TextStyle(color: Colors.white54, fontSize: 14),
            ),
            value: _autoFpsBatterySaving,
            activeThumbColor: AppTheme.accentGreen,
            contentPadding: EdgeInsets.zero,
            onChanged: (bool value) async {
              setState(() => _autoFpsBatterySaving = value);
              await _settings.setAutoFpsBatterySaving(value);
              _accessibility.speak(
                value ? 'Đã bật tiết kiệm pin' : 'Đã tắt tiết kiệm pin',
              );
            },
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () async {
                await _settings.clearAuthSession();
                _accessibility.speak(
                  AppLocalizations.t('settings_logged_out', _language),
                );
                if (!context.mounted) return;
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                  (route) => false,
                );
              },
              icon: const Icon(Icons.logout_rounded),
              label: Text(AppLocalizations.t('settings_logout', _language)),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppTheme.accentRed,
                side: BorderSide(
                  color: AppTheme.accentRed.withValues(alpha: 0.6),
                ),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(title, style: AppTheme.titleLarge.copyWith(fontSize: 18));
  }

  Widget _buildLangOption(String langCode, String label) {
    final isSelected = _language == langCode;
    return Expanded(
      child: GestureDetector(
        onTap: () async {
          setState(() => _language = langCode);
          await _settings.setLanguage(langCode);
          await _accessibility.refreshTtsSpeed();
          _accessibility.speak(
            langCode == 'vi'
                ? 'Đã chuyển sang tiếng Việt'
                : 'Switched to English',
          );
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: isSelected
                ? AppTheme.accentPurple.withValues(alpha: 0.25)
                : AppTheme.whiteAlpha(0.06),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isSelected ? AppTheme.accentPurple : Colors.transparent,
              width: 2,
            ),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: isSelected ? Colors.white : Colors.white70,
              fontSize: 18,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ),
      ),
    );
  }
}
