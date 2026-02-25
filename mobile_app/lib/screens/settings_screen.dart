import 'package:flutter/material.dart';
import 'package:mobile_app/services/accessibility_manager.dart';
import 'package:mobile_app/screens/login_screen.dart';
import 'package:mobile_app/services/settings_service.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final AccessibilityManager _accessibility = AccessibilityManager();
  final SettingsService _settings = SettingsService();

  late TextEditingController _phoneController;
  late double _ttsSpeed;
  late int _defaultMode;
  late String _language;
  late double _warningDistance;

  final List<String> _modeNames = [
    'Nhận diện tổng hợp',
    'Đọc văn bản (Online)',
    'Đọc chữ nhanh (Offline)',
    'Mô tả không gian',
    'Định vị và định hướng',
  ];

  @override
  void initState() {
    super.initState();
    _phoneController = TextEditingController(text: _settings.emergencyNumber);
    _ttsSpeed = _settings.ttsSpeed;
    _defaultMode = _settings.defaultModeIndex;
    _language = _settings.language;
    _warningDistance = _settings.warningDistance;

    _accessibility.speak('Màn hình cài đặt.');
  }

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D0D2B),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1A4E),
        title: const Text(
          'Cài đặt',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white, size: 32),
          onPressed: () {
            _accessibility.speak('Quay lại');
            Navigator.pop(context);
          },
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // --- Emergency Number ---
          _buildSectionTitle('📞 Số điện thoại khẩn cấp'),
          const SizedBox(height: 8),
          TextField(
            controller: _phoneController,
            keyboardType: TextInputType.phone,
            style: const TextStyle(color: Colors.white, fontSize: 22),
            decoration: InputDecoration(
              filled: true,
              fillColor: Colors.white.withOpacity(0.1),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              hintText: 'Nhập số điện thoại...',
              hintStyle: TextStyle(color: Colors.white.withOpacity(0.4)),
              suffixIcon: IconButton(
                icon: const Icon(
                  Icons.save,
                  color: Color(0xFF6C63FF),
                  size: 30,
                ),
                onPressed: () async {
                  await _settings.setEmergencyNumber(_phoneController.text);
                  _accessibility.speak(
                    'Đã lưu số khẩn cấp: ${_phoneController.text}',
                  );
                },
              ),
            ),
          ),

          const SizedBox(height: 32),

          // --- TTS Speed ---
          _buildSectionTitle('🗣️ Tốc độ đọc: ${(_ttsSpeed * 100).toInt()}%'),
          const SizedBox(height: 8),
          SliderTheme(
            data: SliderTheme.of(context).copyWith(
              activeTrackColor: const Color(0xFF6C63FF),
              inactiveTrackColor: Colors.white.withOpacity(0.2),
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
                _accessibility.speak(
                  'Tốc độ đọc: ${(value * 100).toInt()} phần trăm',
                );
              },
            ),
          ),

          const SizedBox(height: 32),

          // --- Default Mode ---
          _buildSectionTitle('🏠 Chế độ mặc định khi mở app'),
          const SizedBox(height: 8),
          ...List.generate(_modeNames.length, (index) {
            final isSelected = _defaultMode == index;
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: GestureDetector(
                onTap: () async {
                  setState(() => _defaultMode = index);
                  await _settings.setDefaultModeIndex(index);
                  _accessibility.speak('Chế độ mặc định: ${_modeNames[index]}');
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    vertical: 14,
                    horizontal: 16,
                  ),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? const Color(0xFF6C63FF).withOpacity(0.3)
                        : Colors.white.withOpacity(0.05),
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
                          _modeNames[index],
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
          _buildSectionTitle('🌐 Ngôn ngữ / Language'),
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
            '⚠️ Khoảng cách cảnh báo: ${_warningDistance.toStringAsFixed(1)}m',
          ),
          const SizedBox(height: 8),
          SliderTheme(
            data: SliderTheme.of(context).copyWith(
              activeTrackColor: const Color(0xFFFF6B6B),
              inactiveTrackColor: Colors.white.withOpacity(0.2),
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
                _accessibility.speak(
                  'Khoảng cách cảnh báo: ${value.toStringAsFixed(1)} mét',
                );
              },
            ),
          ),

          const SizedBox(height: 24),

          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () async {
                await _settings.clearAuthSession();
                _accessibility.speak('Đã đăng xuất.');
                if (!mounted) return;
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                  (route) => false,
                );
              },
              icon: const Icon(Icons.logout),
              label: const Text('Đăng xuất'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.redAccent.withOpacity(0.2),
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
                ? const Color(0xFF6C63FF).withOpacity(0.3)
                : Colors.white.withOpacity(0.05),
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
}
