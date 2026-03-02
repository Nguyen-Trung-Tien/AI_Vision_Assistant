import 'package:flutter/material.dart';
import 'package:flutter_contacts/flutter_contacts.dart';
import 'package:mobile_app/services/accessibility_manager.dart';
import 'package:mobile_app/screens/login_screen.dart';
import 'package:mobile_app/services/settings_service.dart';
import 'package:mobile_app/l10n/app_localizations.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final AccessibilityManager _accessibility = AccessibilityManager();
  final SettingsService _settings = SettingsService();

  late List<String> _emergencyNumbers;
  late double _ttsSpeed;
  late int _defaultMode;
  late String _language;
  late double _warningDistance;
  late double _lightThreshold; // #13 ngưỡng ánh sáng auto-flash

  // getter for modes since it depends on language
  List<String> _getModeNames(String lang) {
    return [
      AppLocalizations.t('mode_0', lang),
      AppLocalizations.t('mode_1', lang),
      AppLocalizations.t('mode_2', lang),
      AppLocalizations.t('mode_3', lang),
      AppLocalizations.t('mode_4', lang),
    ];
  }

  @override
  void initState() {
    super.initState();
    _emergencyNumbers = _settings.emergencyNumbers;
    _ttsSpeed = _settings.ttsSpeed;
    _defaultMode = _settings.defaultModeIndex;
    _language = _settings.language;
    _warningDistance = _settings.warningDistance;
    _lightThreshold = _settings.lightThresholdKB;

    _accessibility.speak(
      AppLocalizations.t('settings_screen_spoken', _language),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D0D2B),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1A4E),
        title: Text(
          AppLocalizations.t('settings_title', _language),
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white, size: 32),
          onPressed: () {
            _accessibility.speak(AppLocalizations.t('back', _language));
            Navigator.pop(context);
          },
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // --- Emergency Numbers ---
          _buildSectionTitle(
            AppLocalizations.t('settings_emergency', _language),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (_emergencyNumbers.isEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Text(
                      AppLocalizations.t('settings_emergency_empty', _language),
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.5),
                      ),
                      textAlign: TextAlign.center,
                    ),
                  )
                else
                  ..._emergencyNumbers.map(
                    (number) => _buildContactItem(number),
                  ),
                const SizedBox(height: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    ElevatedButton.icon(
                      onPressed: () => _pickContact(),
                      icon: const Icon(Icons.contacts),
                      label: Text(
                        AppLocalizations.t(
                          'settings_emergency_add_contact',
                          _language,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF6C63FF),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                    const SizedBox(height: 8),
                    ElevatedButton.icon(
                      onPressed: () => _showManualAddDialog(),
                      icon: const Icon(Icons.dialpad),
                      label: Text(
                        AppLocalizations.t(
                          'settings_emergency_add_manual',
                          _language,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white.withValues(alpha: 0.2),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 32),

          // --- TTS Speed ---
          _buildSectionTitle(
            '${AppLocalizations.t('settings_tts_speed', _language)} ${(_ttsSpeed * 100).toInt()}%',
          ),
          const SizedBox(height: 8),
          SliderTheme(
            data: SliderTheme.of(context).copyWith(
              activeTrackColor: const Color(0xFF6C63FF),
              inactiveTrackColor: Colors.white.withValues(alpha: 0.2),
              thumbColor: const Color(0xFF00D4FF),
              thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 14),
              trackHeight: 6,
            ),
            child: Slider(
              value: _ttsSpeed,
              min: 0.1,
              max: 1.0,
              divisions: 9,
              onChanged: (value) {
                setState(() => _ttsSpeed = value);
              },
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

          // --- Default Mode ---
          _buildSectionTitle(
            AppLocalizations.t('settings_default_mode', _language),
          ),
          const SizedBox(height: 8),
          ...List.generate(_getModeNames(_language).length, (index) {
            final isSelected = _defaultMode == index;
            final modeNames = _getModeNames(_language);
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
                    '$msg ${AppLocalizations.t('mode_${index}_spoken', _language)}',
                  );
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    vertical: 14,
                    horizontal: 16,
                  ),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? const Color(0xFF6C63FF).withValues(alpha: 0.3)
                        : Colors.white.withValues(alpha: 0.05),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isSelected
                          ? const Color(0xFF6C63FF)
                          : Colors.transparent,
                      width: 2,
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        isSelected
                            ? Icons.radio_button_checked
                            : Icons.radio_button_off,
                        color: isSelected
                            ? const Color(0xFF00D4FF)
                            : Colors.white54,
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

          // --- Language ---
          _buildSectionTitle(
            AppLocalizations.t('settings_language', _language),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              _buildLangOption('vi', '🇻🇳 Tiếng Việt'),
              const SizedBox(width: 12),
              _buildLangOption('en', '🇺🇸 English'),
            ],
          ),

          const SizedBox(height: 32),

          // --- Warning Distance ---
          _buildSectionTitle(
            '${AppLocalizations.t('settings_warning_dist', _language)} ${_warningDistance.toStringAsFixed(1)}m',
          ),
          const SizedBox(height: 8),
          SliderTheme(
            data: SliderTheme.of(context).copyWith(
              activeTrackColor: const Color(0xFFFF6B6B),
              inactiveTrackColor: Colors.white.withValues(alpha: 0.2),
              thumbColor: const Color(0xFFFF6B6B),
              thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 14),
              trackHeight: 6,
            ),
            child: Slider(
              value: _warningDistance,
              min: 0.5,
              max: 5.0,
              divisions: 9,
              onChanged: (value) {
                setState(() => _warningDistance = value);
              },
              onChangeEnd: (value) async {
                await _settings.setWarningDistance(value);
                final msg = AppLocalizations.t(
                  'settings_warning_dist_spoken',
                  _language,
                );
                final unit = AppLocalizations.t(
                  'settings_warning_dist_unit',
                  _language,
                );
                _accessibility.speak('$msg ${value.toStringAsFixed(1)} $unit');
              },
            ),
          ),

          const SizedBox(height: 32),

          // --- Light Threshold (#13) ---
          _buildSectionTitle(
            '${AppLocalizations.t('settings_light_threshold', _language)} ${_lightThreshold.toStringAsFixed(0)}KB',
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                AppLocalizations.t('settings_light_low', _language),
                style: const TextStyle(color: Colors.amber, fontSize: 13),
              ),
              Text(
                AppLocalizations.t('settings_light_high', _language),
                style: const TextStyle(color: Colors.white54, fontSize: 13),
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
              onChanged: (value) {
                setState(() => _lightThreshold = value);
              },
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

          const SizedBox(height: 24),

          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
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
              icon: const Icon(Icons.logout),
              label: Text(AppLocalizations.t('settings_logout', _language)),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.redAccent.withValues(alpha: 0.2),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        color: Colors.white,
        fontSize: 20,
        fontWeight: FontWeight.bold,
      ),
    );
  }

  Widget _buildLangOption(String langCode, String label) {
    final isSelected = _language == langCode;
    return Expanded(
      child: GestureDetector(
        onTap: () async {
          setState(() => _language = langCode);
          await _settings.setLanguage(langCode);
          await _accessibility.refreshTtsSpeed(); // also refreshes language
          _accessibility.speak(
            langCode == 'vi'
                ? 'Đã chuyển sang Tiếng Việt'
                : 'Switched to English',
          );
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: isSelected
                ? const Color(0xFF6C63FF).withValues(alpha: 0.3)
                : Colors.white.withValues(alpha: 0.05),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? const Color(0xFF6C63FF) : Colors.transparent,
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

  // --- Additions for multiple contacts ---

  Widget _buildContactItem(String number) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              const Icon(Icons.phone, color: Color(0xFF00D4FF), size: 20),
              const SizedBox(width: 12),
              Text(
                number,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          IconButton(
            icon: const Icon(Icons.delete, color: Colors.redAccent),
            onPressed: () {
              _removeContact(number);
            },
          ),
        ],
      ),
    );
  }

  Future<void> _pickContact() async {
    if (_emergencyNumbers.length >= 5) {
      _accessibility.speak(
        AppLocalizations.t('settings_emergency_max', _language),
      );
      return;
    }

    if (await FlutterContacts.requestPermission(readonly: true)) {
      final contact = await FlutterContacts.openExternalPick();
      if (contact != null && contact.phones.isNotEmpty) {
        String num = contact.phones.first.number;
        // Clean number representation (optional depending on region)
        num = num.replaceAll(RegExp(r'[^\d+]'), '');
        if (num.isNotEmpty && !_emergencyNumbers.contains(num)) {
          setState(() {
            _emergencyNumbers.add(num);
          });
          await _settings.setEmergencyNumbers(_emergencyNumbers);
          final msgKey = AppLocalizations.t(
            'settings_emergency_saved',
            _language,
          );
          _accessibility.speak('$msgKey $num');
        }
      }
    } else {
      _accessibility.speak(
        AppLocalizations.t('settings_emergency_permission', _language),
      );
    }
  }

  Future<void> _showManualAddDialog() async {
    if (_emergencyNumbers.length >= 5) {
      _accessibility.speak(
        AppLocalizations.t('settings_emergency_max', _language),
      );
      return;
    }

    String tempNumber = '';
    await showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: const Color(0xFF1B1B3A),
          title: Text(
            AppLocalizations.t('settings_emergency_add_manual', _language),
            style: const TextStyle(color: Colors.white),
          ),
          content: TextField(
            autofocus: true,
            keyboardType: TextInputType.phone,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              hintText: AppLocalizations.t(
                'settings_emergency_hint',
                _language,
              ),
              hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.5)),
            ),
            onChanged: (val) => tempNumber = val,
            onSubmitted: (_) => Navigator.pop(context, tempNumber),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF6C63FF),
              ),
              onPressed: () => Navigator.pop(context, tempNumber),
              child: const Text('Add', style: TextStyle(color: Colors.white)),
            ),
          ],
        );
      },
    ).then((result) async {
      if (result != null && result.toString().trim().isNotEmpty) {
        final val = result.toString().trim();
        if (!_emergencyNumbers.contains(val)) {
          setState(() {
            _emergencyNumbers.add(val);
          });
          await _settings.setEmergencyNumbers(_emergencyNumbers);
          final msgKey = AppLocalizations.t(
            'settings_emergency_saved',
            _language,
          );
          _accessibility.speak('$msgKey $val');
        }
      }
    });
  }

  Future<void> _removeContact(String num) async {
    setState(() {
      _emergencyNumbers.remove(num);
    });
    await _settings.setEmergencyNumbers(_emergencyNumbers);
    final msgKey = AppLocalizations.t('settings_emergency_deleted', _language);
    _accessibility.speak('$msgKey $num');
  }
}
