import 'dart:io';

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:mobile_app/theme/app_theme.dart';
import 'package:mobile_app/screens/main_screen.dart';
import 'package:mobile_app/services/accessibility_manager.dart';
import 'package:mobile_app/services/auth_service.dart';
import 'package:mobile_app/services/settings_service.dart';
import 'package:mobile_app/l10n/app_localizations.dart';

class LoginScreen extends StatefulWidget {
  final List<CameraDescription>? cameras;

  const LoginScreen({super.key, this.cameras});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _authService = AuthService();
  final _settings = SettingsService();
  final _accessibility = AccessibilityManager();

  bool _isSubmitting = false;
  bool _isRegisterMode = false;
  bool _showPassword = false;
  bool _showConfirmPassword = false;

  @override
  void initState() {
    super.initState();
    _accessibility.speak(
      AppLocalizations.t('login_tts_welcome', _settings.language),
    );
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_isSubmitting) return;
    if (!(_formKey.currentState?.validate() ?? false)) return;

    FocusScope.of(context).unfocus();
    setState(() => _isSubmitting = true);

    try {
      final email = _emailController.text.trim();
      final password = _passwordController.text;
      if (_isRegisterMode && password != _confirmPasswordController.text) {
        throw Exception(
          AppLocalizations.t('login_err_password_match', _settings.language),
        );
      }

      final result = _isRegisterMode
          ? await _authService.register(email: email, password: password)
          : await _authService.login(email: email, password: password);

      await _settings.setAuthSession(
        token: result.accessToken,
        email: result.email,
      );

      if (!mounted) return;
      _accessibility.speak(
        AppLocalizations.t('login_success_tts', _settings.language),
      );
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => MainScreen(cameras: widget.cameras)),
      );
    } catch (e) {
      if (!mounted) return;
      _accessibility.triggerErrorVibration();
      _accessibility.speak(
        AppLocalizations.t('login_fail_tts', _settings.language),
      );
      final message = e is HttpException
          ? e.message
          : e.toString().replaceFirst(RegExp(r'^Exception:\s*'), '').replaceFirst(RegExp(r'^HttpException:\s*'), '');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message)),
      );
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgPrimary,
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF0A0A1A),
              Color(0xFF111128),
              Color(0xFF16163A),
            ],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 16),
                    Text(
                      'AI Vision Assistant',
                      textAlign: TextAlign.center,
                      style: AppTheme.headlineLarge.copyWith(
                        shadows: [
                          Shadow(
                            color: AppTheme.accentPurple.withValues(alpha: 0.5),
                            blurRadius: 20,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _isRegisterMode
                          ? AppLocalizations.t(
                              'login_title_register',
                              _settings.language,
                            )
                          : AppLocalizations.t(
                              'login_title_login',
                              _settings.language,
                            ),
                      textAlign: TextAlign.center,
                      style: AppTheme.bodyLarge.copyWith(
                        color: AppTheme.whiteAlpha(0.7),
                      ),
                    ),
                    const SizedBox(height: 28),
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: AppTheme.cardDecoration(borderRadius: 20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          TextFormField(
                            controller: _emailController,
                            keyboardType: TextInputType.emailAddress,
                            style: const TextStyle(color: Colors.white),
                            decoration: AppTheme.inputDecoration(
                              AppLocalizations.t('login_email', _settings.language),
                            ),
                            validator: (value) {
                              final v = (value ?? '').trim();
                              if (v.isEmpty) {
                                return AppLocalizations.t(
                                  'login_email_err_empty',
                                  _settings.language,
                                );
                              }
                              if (!v.contains('@')) {
                                return AppLocalizations.t(
                                  'login_email_err_invalid',
                                  _settings.language,
                                );
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _passwordController,
                            obscureText: !_showPassword,
                            style: const TextStyle(color: Colors.white),
                            decoration: AppTheme.inputDecoration(
                              AppLocalizations.t('login_password', _settings.language),
                              suffixIcon: IconButton(
                                onPressed: () {
                                  setState(() => _showPassword = !_showPassword);
                                },
                                icon: Icon(
                                  _showPassword
                                      ? Icons.visibility_off
                                      : Icons.visibility,
                                  color: AppTheme.whiteAlpha(0.7),
                                ),
                              ),
                            ),
                            validator: (value) {
                              final v = value ?? '';
                              if (v.length < 6) {
                                return AppLocalizations.t(
                                  'login_password_err_length',
                                  _settings.language,
                                );
                              }
                              return null;
                            },
                          ),
                          if (_isRegisterMode) ...[
                            const SizedBox(height: 16),
                            TextFormField(
                              controller: _confirmPasswordController,
                              obscureText: !_showConfirmPassword,
                              style: const TextStyle(color: Colors.white),
                              decoration: AppTheme.inputDecoration(
                                AppLocalizations.t(
                                  'login_confirm_password',
                                  _settings.language,
                                ),
                                suffixIcon: IconButton(
                                  onPressed: () {
                                    setState(() {
                                      _showConfirmPassword = !_showConfirmPassword;
                                    });
                                  },
                                  icon: Icon(
                                    _showConfirmPassword
                                        ? Icons.visibility_off
                                        : Icons.visibility,
                                    color: AppTheme.whiteAlpha(0.7),
                                  ),
                                ),
                              ),
                              validator: (value) {
                                if (_isRegisterMode && (value ?? '').isEmpty) {
                                  return AppLocalizations.t(
                                    'login_confirm_err_empty',
                                    _settings.language,
                                  );
                                }
                                return null;
                              },
                            ),
                          ],
                          const SizedBox(height: 20),
                          Material(
                            color: Colors.transparent,
                            child: InkWell(
                              onTap: _isSubmitting ? null : _submit,
                              borderRadius: BorderRadius.circular(14),
                              child: Container(
                                width: double.infinity,
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                decoration: _isSubmitting
                                    ? BoxDecoration(
                                        color: AppTheme.accentPurple.withValues(alpha: 0.5),
                                        borderRadius: BorderRadius.circular(14),
                                      )
                                    : AppTheme.gradientButtonDecoration(),
                                child: _isSubmitting
                                    ? const Center(
                                        child: SizedBox(
                                          width: 24,
                                          height: 24,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            color: Colors.white,
                                          ),
                                        ),
                                      )
                                    : Text(
                                        _isRegisterMode
                                            ? AppLocalizations.t(
                                                'login_btn_register',
                                                _settings.language,
                                              )
                                            : AppLocalizations.t(
                                                'login_btn_login',
                                                _settings.language,
                                              ),
                                        textAlign: TextAlign.center,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 16,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),
                          TextButton(
                            onPressed: _isSubmitting
                                ? null
                                : () {
                                    setState(() {
                                      _isRegisterMode = !_isRegisterMode;
                                      _showPassword = false;
                                      _showConfirmPassword = false;
                                      _confirmPasswordController.clear();
                                    });
                                  },
                            child: Text(
                              _isRegisterMode
                                  ? AppLocalizations.t(
                                      'login_switch_to_login',
                                      _settings.language,
                                    )
                                  : AppLocalizations.t(
                                      'login_switch_to_register',
                                      _settings.language,
                                    ),
                              style: TextStyle(
                                color: AppTheme.whiteAlpha(0.8),
                                fontSize: 14,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
