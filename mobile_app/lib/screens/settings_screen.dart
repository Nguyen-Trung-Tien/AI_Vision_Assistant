import 'package:flutter/material.dart';
import 'package:mobile_app/l10n/app_localizations.dart';
import 'package:mobile_app/screens/emergency_contacts_screen.dart';
import 'package:mobile_app/screens/login_screen.dart';
import 'package:mobile_app/screens/profile_screen.dart';
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
  late bool _faceRecognitionEnabled;

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
    _faceRecognitionEnabled = _settings.faceRecognitionEnabled;

    _accessibility.speak(
      AppLocalizations.t('settings_screen_spoken', _language),
    );
  }

  @override
  Widget build(BuildContext context) {
    final modeNames = _getModeNames(_language);

    return Scaffold(
      backgroundColor: AppTheme.bgPrimary,
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          // Modern App Bar
          SliverAppBar(
            expandedHeight: 120,
            floating: false,
            pinned: true,
            stretch: true,
            backgroundColor: AppTheme.bgCard,
            flexibleSpace: FlexibleSpaceBar(
              title: Text(
                AppLocalizations.t('settings_title', _language),
                style:
                    AppTheme.titleLarge.copyWith(fontWeight: FontWeight.bold),
              ),
              centerTitle: false,
              titlePadding: const EdgeInsets.only(left: 56, bottom: 16),
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppTheme.bgCard,
                      AppTheme.bgPrimary.withValues(alpha: 0.8),
                    ],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
              ),
            ),
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
              onPressed: () {
                _accessibility.speak(AppLocalizations.t('back', _language));
                Navigator.pop(context);
              },
            ),
          ),

          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                // --- ACCOUNT ---
                _buildCategoryHeader(
                    _language == 'vi' ? 'Tài khoản' : 'Account'),
                _buildSettingCard(
                  children: [
                    _buildActionTile(
                      icon: Icons.person_rounded,
                      iconColor: AppTheme.accentPurple,
                      title:
                          _language == 'vi' ? 'Thông tin cá nhân' : 'Profile',
                      subtitle: _settings.authEmail.isNotEmpty
                          ? _settings.authEmail
                          : null,
                      onTap: () {
                        _accessibility.speak(_language == 'vi'
                            ? 'Mở thông tin cá nhân'
                            : 'Open profile');
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const ProfileScreen(),
                          ),
                        ).then((_) {
                          // Refresh to show updated info if any
                          setState(() {});
                        });
                      },
                    ),
                  ],
                ),

                const SizedBox(height: 24),

                // --- QUICK ACTIONS ---
                _buildCategoryHeader(
                    AppLocalizations.t('settings_emergency', _language)),
                _buildSettingCard(
                  children: [
                    _buildActionTile(
                      icon: Icons.contacts_rounded,
                      iconColor: AppTheme.accentCyan,
                      title: AppLocalizations.t(
                          'settings_emergency_add_contact', _language),
                      onTap: () {
                        _accessibility.speak(AppLocalizations.t(
                            'emergency_open_manage', _language));
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const EmergencyContactsScreen(),
                          ),
                        );
                      },
                    ),
                  ],
                ),

                const SizedBox(height: 24),

                // --- VOICE & LANGUAGE ---
                _buildCategoryHeader(
                    AppLocalizations.t('settings_language', _language)),
                _buildSettingCard(
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 8),
                      child: Row(
                        children: [
                          _buildLangOption('vi', 'Tiếng Việt'),
                          const SizedBox(width: 12),
                          _buildLangOption('en', 'English'),
                        ],
                      ),
                    ),
                    const Divider(
                        color: Colors.white10,
                        height: 1,
                        indent: 16,
                        endIndent: 16),
                    _buildSliderTile(
                      icon: Icons.speed_rounded,
                      iconColor: AppTheme.accentPurple,
                      title:
                          AppLocalizations.t('settings_tts_speed', _language),
                      value: _ttsSpeed,
                      label: '${(_ttsSpeed * 100).toInt()}%',
                      onChanged: (v) => setState(() => _ttsSpeed = v),
                      onChangeEnd: (v) async {
                        await _settings.setTtsSpeed(v);
                        await _accessibility.refreshTtsSpeed();
                        _accessibility.speak(
                            '${AppLocalizations.t('settings_tts_speed_spoken', _language)} ${(v * 100).toInt()}%');
                      },
                    ),
                  ],
                ),

                const SizedBox(height: 24),

                // --- AI & VISION ---
                _buildCategoryHeader(_language == 'vi'
                    ? 'Trợ lý AI & Thị giác'
                    : 'AI & Vision Assistant'),
                _buildSettingCard(
                  children: [
                    _buildActionTile(
                      icon: Icons.psychology_rounded,
                      iconColor: AppTheme.accentPink,
                      title: AppLocalizations.t(
                          'settings_default_mode', _language),
                      subtitle: modeNames[_defaultMode],
                      onTap: () => _showModeSelectionDialog(context, modeNames),
                    ),
                    const Divider(color: Colors.white10, height: 1, indent: 56),
                    _buildToggleTile(
                      icon: Icons.face_retouching_natural_rounded,
                      iconColor: Colors.tealAccent,
                      title: _language == 'vi'
                          ? 'Nhận diện khuôn mặt'
                          : 'Face Recognition',
                      subtitle: _language == 'vi'
                          ? 'Thông báo tên người thân'
                          : 'Announce known people',
                      value: _faceRecognitionEnabled,
                      onChanged: (v) async {
                        setState(() => _faceRecognitionEnabled = v);
                        await _settings.setFaceRecognitionEnabled(v);
                        _accessibility
                            .speak(v ? 'Đã bật nhận diện' : 'Đã tắt nhận diện');
                      },
                    ),
                    const Divider(color: Colors.white10, height: 1, indent: 56),
                    _buildSliderTile(
                      icon: Icons.wb_sunny_rounded,
                      iconColor: Colors.amber,
                      title: AppLocalizations.t(
                          'settings_light_threshold', _language),
                      value: _lightThreshold,
                      min: 5,
                      max: 50,
                      label: '${_lightThreshold.toStringAsFixed(0)}KB',
                      onChanged: (v) => setState(() => _lightThreshold = v),
                      onChangeEnd: (v) async {
                        await _settings.setLightThresholdKB(v);
                        _accessibility.speak(
                            '${AppLocalizations.t('settings_light_threshold_spoken', _language)} ${v.toStringAsFixed(0)}KB');
                      },
                    ),
                  ],
                ),

                const SizedBox(height: 24),

                // --- WALKING MODE ---
                _buildCategoryHeader(
                    _language == 'vi' ? 'Chế độ đi bộ' : 'Walking Mode'),
                _buildSettingCard(
                  children: [
                    _buildSliderTile(
                      icon: Icons.shutter_speed_rounded,
                      iconColor: AppTheme.accentGreen,
                      title:
                          _language == 'vi' ? 'Khung hình quét:' : 'Scan FPS:',
                      value: _fpsLimit.toDouble(),
                      min: 1,
                      max: 5,
                      divisions: 4,
                      label: '$_fpsLimit FPS',
                      onChanged: (v) => setState(() => _fpsLimit = v.toInt()),
                      onChangeEnd: (v) async {
                        final intFps = v.toInt();
                        await _settings.setFpsLimit(intFps);
                        _accessibility
                            .speak('Giới hạn $intFps khung hình mỗi giây');
                      },
                    ),
                    const Divider(color: Colors.white10, height: 1, indent: 56),
                    _buildToggleTile(
                      icon: Icons.battery_saver_rounded,
                      iconColor: AppTheme.accentOrange,
                      title: _language == 'vi'
                          ? 'Tiết kiệm pin'
                          : 'Battery Saving',
                      subtitle: _language == 'vi'
                          ? 'Giảm FPS khi pin < 20%'
                          : 'Drop FPS when battery < 20%',
                      value: _autoFpsBatterySaving,
                      onChanged: (v) async {
                        setState(() => _autoFpsBatterySaving = v);
                        await _settings.setAutoFpsBatterySaving(v);
                        _accessibility.speak(v
                            ? 'Đã bật tiết kiệm pin'
                            : 'Đã tắt tiết kiệm pin');
                      },
                    ),
                  ],
                ),

                const SizedBox(height: 24),

                // --- AUDIO EXPERIENCE ---
                _buildCategoryHeader(
                    AppLocalizations.t('settings_spatial_audio', _language)),
                _buildSettingCard(
                  children: [
                    _buildToggleTile(
                      icon: Icons.spatial_audio_rounded,
                      iconColor: AppTheme.accentCyan,
                      title:
                          _language == 'vi' ? 'Âm thanh 3D' : 'Spatial Audio',
                      subtitle: AppLocalizations.t(
                          'settings_spatial_audio_desc', _language),
                      value: _spatialAudioEnabled,
                      onChanged: (v) async {
                        setState(() => _spatialAudioEnabled = v);
                        await _settings.setSpatialAudioEnabled(v);
                        _accessibility.speak(
                            v ? 'Đã bật âm thanh 3D' : 'Đã tắt âm thanh 3D');
                      },
                    ),
                    if (_spatialAudioEnabled) ...[
                      const Divider(
                          color: Colors.white10, height: 1, indent: 56),
                      _buildSliderTile(
                        icon: Icons.volume_up_rounded,
                        iconColor: AppTheme.accentCyan,
                        title: AppLocalizations.t(
                            'settings_spatial_volume', _language),
                        value: _spatialAudioVolume,
                        label: '${(_spatialAudioVolume * 100).toInt()}%',
                        onChanged: (v) =>
                            setState(() => _spatialAudioVolume = v),
                        onChangeEnd: (v) async {
                          await _settings.setSpatialAudioVolume(v);
                          _accessibility.speak(
                              '${AppLocalizations.t('settings_spatial_volume_spoken', _language)} ${(v * 100).toInt()}%');
                        },
                      ),
                      const Divider(
                          color: Colors.white10, height: 1, indent: 56),
                      _buildToggleTile(
                        icon: Icons.headphones_rounded,
                        iconColor: Colors.white70,
                        title: AppLocalizations.t(
                            'settings_headphones_only', _language),
                        subtitle: AppLocalizations.t(
                            'settings_headphones_only_desc', _language),
                        value: _headphonesOnlyMode,
                        onChanged: (v) async {
                          setState(() => _headphonesOnlyMode = v);
                          await _settings.setHeadphonesOnlyMode(v);
                          _accessibility.speak(v
                              ? 'Đã bật chế độ tai nghe'
                              : 'Đã tắt chế độ tai nghe');
                        },
                      ),
                    ],
                  ],
                ),

                const SizedBox(height: 48),

                // --- LOGOUT ---
                Center(
                  child: TextButton.icon(
                    onPressed: () => _handleLogout(context),
                    icon: const Icon(Icons.logout_rounded,
                        color: AppTheme.accentRed),
                    label: Text(
                      AppLocalizations.t('settings_logout', _language),
                      style: const TextStyle(
                          color: AppTheme.accentRed,
                          fontWeight: FontWeight.bold),
                    ),
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 32, vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                        side: BorderSide(
                            color: AppTheme.accentRed.withValues(alpha: 0.3)),
                      ),
                      backgroundColor:
                          AppTheme.accentRed.withValues(alpha: 0.05),
                    ),
                  ),
                ),

                const SizedBox(height: 20),
                Center(
                  child: Text(
                    'Vision Assistant v2.2.0',
                    style: AppTheme.bodySmall
                        .copyWith(color: AppTheme.whiteAlpha(0.3)),
                  ),
                ),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  // --- Helper Widgets ---

  Widget _buildCategoryHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 8, bottom: 8),
      child: Text(
        title.toUpperCase(),
        style: TextStyle(
          color: AppTheme.accentCyan.withValues(alpha: 0.8),
          fontSize: 12,
          fontWeight: FontWeight.bold,
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  Widget _buildSettingCard({required List<Widget> children}) {
    return Container(
      decoration: AppTheme.cardDecoration(borderRadius: 20),
      clipBehavior: Clip.antiAlias,
      child: Column(children: children),
    );
  }

  Widget _buildActionTile({
    required IconData icon,
    required Color iconColor,
    required String title,
    String? subtitle,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: iconColor.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: iconColor, size: 22),
      ),
      title: Text(title,
          style: const TextStyle(
              color: Colors.white, fontSize: 16, fontWeight: FontWeight.w500)),
      subtitle: subtitle != null
          ? Text(subtitle,
              style: const TextStyle(color: Colors.white54, fontSize: 13))
          : null,
      trailing: const Icon(Icons.chevron_right_rounded, color: Colors.white24),
      onTap: onTap,
    );
  }

  Widget _buildToggleTile({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return SwitchListTile(
      secondary: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: iconColor.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: iconColor, size: 22),
      ),
      title: Text(title,
          style: const TextStyle(
              color: Colors.white, fontSize: 16, fontWeight: FontWeight.w500)),
      subtitle: Text(subtitle,
          style: const TextStyle(color: Colors.white54, fontSize: 12)),
      value: value,
      activeColor: AppTheme.accentCyan,
      activeTrackColor: AppTheme.accentCyan.withValues(alpha: 0.3),
      onChanged: onChanged,
    );
  }

  Widget _buildSliderTile({
    required IconData icon,
    required Color iconColor,
    required String title,
    required double value,
    double min = 0.1,
    double max = 1.0,
    int? divisions = 9,
    required String label,
    required ValueChanged<double> onChanged,
    required ValueChanged<double> onChangeEnd,
  }) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: iconColor, size: 20),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w500),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              Text(label,
                  style:
                      TextStyle(color: iconColor, fontWeight: FontWeight.bold)),
            ],
          ),
          SliderTheme(
            data: SliderTheme.of(context).copyWith(
              activeTrackColor: iconColor,
              inactiveTrackColor: Colors.white10,
              thumbColor: Colors.white,
              overlayColor: iconColor.withValues(alpha: 0.1),
              trackHeight: 4,
            ),
            child: Slider(
              value: value,
              min: min,
              max: max,
              divisions: divisions,
              onChanged: onChanged,
              onChangeEnd: onChangeEnd,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLangOption(String langCode, String label) {
    final isSelected = _language == langCode;
    return Expanded(
      child: GestureDetector(
        onTap: () async {
          if (isSelected) return;
          setState(() => _language = langCode);
          await _settings.setLanguage(langCode);
          await _accessibility.refreshTtsSpeed();
          _accessibility.speak(langCode == 'vi'
              ? 'Đã chuyển sang tiếng Việt'
              : 'Switched to English');
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected
                ? AppTheme.accentPurple.withValues(alpha: 0.2)
                : Colors.white.withValues(alpha: 0.05),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected
                  ? AppTheme.accentPurple
                  : Colors.white.withValues(alpha: 0.1),
              width: 1.5,
            ),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: isSelected ? Colors.white : Colors.white60,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ),
      ),
    );
  }

  void _showModeSelectionDialog(BuildContext context, List<String> modeNames) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.bgCard,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) {
        return Container(
          padding: const EdgeInsets.symmetric(vertical: 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                AppLocalizations.t('settings_default_mode', _language),
                style: AppTheme.titleLarge,
              ),
              const SizedBox(height: 16),
              Flexible(
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: modeNames.length,
                  itemBuilder: (context, index) {
                    final isSelected = _defaultMode == index;
                    return ListTile(
                      leading: Icon(
                        isSelected
                            ? Icons.radio_button_checked_rounded
                            : Icons.radio_button_off_rounded,
                        color:
                            isSelected ? AppTheme.accentCyan : Colors.white24,
                      ),
                      title: Text(
                        modeNames[index],
                        style: TextStyle(
                            color: isSelected ? Colors.white : Colors.white70,
                            fontWeight: isSelected
                                ? FontWeight.bold
                                : FontWeight.normal),
                      ),
                      onTap: () async {
                        setState(() => _defaultMode = index);
                        await _settings.setDefaultModeIndex(index);
                        _accessibility.speak(
                            '${AppLocalizations.t('settings_default_mode_spoken', _language)} ${AppLocalizations.t(_modeSpokenByIndex(index), _language)}');
                        Navigator.pop(context);
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _handleLogout(BuildContext context) async {
    await _settings.clearAuthSession();
    _accessibility.speak(AppLocalizations.t('settings_logged_out', _language));
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }
}
