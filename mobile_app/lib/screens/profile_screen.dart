import 'package:flutter/material.dart';
import 'package:mobile_app/l10n/app_localizations.dart';
import 'package:mobile_app/services/accessibility_manager.dart';
import 'package:mobile_app/services/settings_service.dart';
import 'package:mobile_app/theme/app_theme.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final AccessibilityManager _accessibility = AccessibilityManager();
  final SettingsService _settings = SettingsService();

  late TextEditingController _nameController;
  late TextEditingController _phoneController;

  late String _language;
  late String _email;

  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _language = _settings.language;
    _email = _settings.authEmail;
    
    _nameController = TextEditingController(text: _settings.userName);
    _phoneController = TextEditingController(text: _settings.userPhone);

    _accessibility.speak(
      _language == 'vi' ? 'Trang thông tin cá nhân' : 'Profile screen',
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _handleSave() async {
    setState(() => _isSaving = true);
    
    // Simulate slight delay for UX
    await Future.delayed(const Duration(milliseconds: 500));
    
    await _settings.setUserName(_nameController.text.trim());
    await _settings.setUserPhone(_phoneController.text.trim());
    
    setState(() => _isSaving = false);

    final successMsg = _language == 'vi' 
        ? 'Đã lưu thông tin cá nhân' 
        : 'Profile saved successfully';
    
    _accessibility.speak(successMsg);
    
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(successMsg),
          backgroundColor: AppTheme.accentGreen,
        ),
      );
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgPrimary,
      appBar: AppBar(
        backgroundColor: AppTheme.bgCard,
        elevation: 0,
        centerTitle: true,
        title: Text(
          _language == 'vi' ? 'Thông tin cá nhân' : 'Profile',
          style: AppTheme.titleLarge.copyWith(fontWeight: FontWeight.bold),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
          onPressed: () {
            _accessibility.speak(AppLocalizations.t('back', _language));
            Navigator.pop(context);
          },
        ),
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Avatar Placeholder
            Center(
              child: Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppTheme.accentPurple.withValues(alpha: 0.2),
                  border: Border.all(
                    color: AppTheme.accentPurple,
                    width: 2,
                  ),
                ),
                child: const Icon(
                  Icons.person_rounded,
                  size: 50,
                  color: AppTheme.accentPurple,
                ),
              ),
            ),
            const SizedBox(height: 32),
            
            // Email (Read-only)
            TextField(
              controller: TextEditingController(text: _email),
              readOnly: true,
              style: const TextStyle(color: Colors.white54),
              decoration: AppTheme.inputDecoration(
                _language == 'vi' ? 'Email (Không thể đổi)' : 'Email (Read-only)',
                suffixIcon: const Icon(Icons.email_rounded, color: Colors.white24),
              ).copyWith(
                fillColor: AppTheme.bgCard.withValues(alpha: 0.5),
              ),
            ),
            const SizedBox(height: 20),
            
            // Name
            TextField(
              controller: _nameController,
              style: const TextStyle(color: Colors.white),
              textInputAction: TextInputAction.next,
              decoration: AppTheme.inputDecoration(
                _language == 'vi' ? 'Họ và tên' : 'Full Name',
                suffixIcon: const Icon(Icons.person_outline_rounded, color: Colors.white54),
              ),
            ),
            const SizedBox(height: 20),
            
            // Phone
            TextField(
              controller: _phoneController,
              style: const TextStyle(color: Colors.white),
              keyboardType: TextInputType.phone,
              textInputAction: TextInputAction.done,
              decoration: AppTheme.inputDecoration(
                _language == 'vi' ? 'Số điện thoại' : 'Phone Number',
                suffixIcon: const Icon(Icons.phone_rounded, color: Colors.white54),
              ),
            ),
            const SizedBox(height: 48),
            
            // Save Button
            ElevatedButton(
              onPressed: _isSaving ? null : _handleSave,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.accentPurple,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: _isSaving
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2,
                      ),
                    )
                  : Text(
                      _language == 'vi' ? 'Lưu Thay Đổi' : 'Save Changes',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
