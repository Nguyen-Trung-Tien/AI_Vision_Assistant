import 'package:flutter/material.dart';
import 'package:mobile_app/theme/app_theme.dart';
import 'package:mobile_app/services/accessibility_manager.dart';
import 'package:mobile_app/services/settings_service.dart';
import 'package:mobile_app/l10n/app_localizations.dart';

class OnboardingScreen extends StatefulWidget {
  final Widget nextScreen;

  const OnboardingScreen({super.key, required this.nextScreen});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  final AccessibilityManager _accessibility = AccessibilityManager();
  final SettingsService _settings = SettingsService();
  int _currentPage = 0;

  // Since _steps depends on language, we use a getter
  List<_OnboardingStep> _getSteps(String lang) {
    return [
      _OnboardingStep(
        icon: Icons.visibility,
        title: AppLocalizations.t('onboarding_title_1', lang),
        description: AppLocalizations.t('onboarding_desc_1', lang),
        ttsText: AppLocalizations.t('onboarding_tts_1', lang),
      ),
      _OnboardingStep(
        icon: Icons.swipe,
        title: AppLocalizations.t('onboarding_title_2', lang),
        description: AppLocalizations.t('onboarding_desc_2', lang),
        ttsText: AppLocalizations.t('onboarding_tts_2', lang),
      ),
      _OnboardingStep(
        icon: Icons.emergency,
        title: AppLocalizations.t('onboarding_title_3', lang),
        description: AppLocalizations.t('onboarding_desc_3', lang),
        ttsText: AppLocalizations.t('onboarding_tts_3', lang),
      ),
      _OnboardingStep(
        icon: Icons.rocket_launch,
        title: AppLocalizations.t('onboarding_title_4', lang),
        description: AppLocalizations.t('onboarding_desc_4', lang),
        ttsText: AppLocalizations.t('onboarding_tts_4', lang),
      ),
    ];
  }

  @override
  void initState() {
    super.initState();
    // Auto-play TTS khi mở màn hình
    Future.delayed(const Duration(milliseconds: 500), () {
      _speakCurrentStep();
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _speakCurrentStep() {
    final lang = _settings.language;
    final steps = _getSteps(lang);
    _accessibility.speak(steps[_currentPage].ttsText);
  }

  void _onPageChanged(int index) {
    setState(() => _currentPage = index);
    _accessibility.triggerSuccessVibration();
    _speakCurrentStep();
  }

  Future<void> _finishOnboarding() async {
    final lang = _settings.language;
    await _settings.setFirstLaunchDone();
    _accessibility.speak(AppLocalizations.t('onboarding_start_spoken', lang));
    if (mounted) {
      Navigator.of(
        context,
      ).pushReplacement(MaterialPageRoute(builder: (_) => widget.nextScreen));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgPrimary,
      body: GestureDetector(
        onDoubleTap: () {
          if (_currentPage == _getSteps(_settings.language).length - 1) {
            _finishOnboarding();
          } else {
            _pageController.nextPage(
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeInOut,
            );
          }
        },
        child: SafeArea(
          child: Column(
            children: [
              // Skip button
              Align(
                alignment: Alignment.topRight,
                child: TextButton(
                  onPressed: _finishOnboarding,
                  child: Text(
                    AppLocalizations.t('onboarding_skip', _settings.language),
                    style: const TextStyle(color: Colors.white54, fontSize: 16),
                  ),
                ),
              ),

              // Page content
              Expanded(
                child: PageView.builder(
                  controller: _pageController,
                  onPageChanged: _onPageChanged,
                  itemCount: _getSteps(_settings.language).length,
                  itemBuilder: (context, index) {
                    final step = _getSteps(_settings.language)[index];
                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 32),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          // Icon
                          Container(
                            width: 120,
                            height: 120,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: const LinearGradient(
                                colors: [
                                  AppTheme.accentPurple,
                                  AppTheme.accentCyan,
                                ],
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: AppTheme.accentPurple
                                      .withValues(alpha: 0.4),
                                  blurRadius: 30,
                                  spreadRadius: 5,
                                ),
                              ],
                            ),
                            child: Icon(
                              step.icon,
                              size: 56,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 40),

                          // Title
                          Text(
                            step.title,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 28,
                              fontWeight: FontWeight.bold,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 20),

                          // Description
                          Text(
                            step.description,
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.7),
                              fontSize: 18,
                              height: 1.6,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),

              // Pagination dots + button
              Padding(
                padding: const EdgeInsets.only(bottom: 40, left: 32, right: 32),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Dots
                    Row(
                      children: List.generate(
                        _getSteps(_settings.language).length,
                        (index) => AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          margin: const EdgeInsets.only(right: 8),
                          width: _currentPage == index ? 28 : 10,
                          height: 10,
                          decoration: BoxDecoration(
                            color: _currentPage == index
                                ? AppTheme.accentPurple
                                : AppTheme.whiteAlpha(0.24),
                            borderRadius: BorderRadius.circular(5),
                          ),
                        ),
                      ),
                    ),

                    // Next / Start button
                    GestureDetector(
                      onTap: () {
                        if (_currentPage ==
                            _getSteps(_settings.language).length - 1) {
                          _finishOnboarding();
                        } else {
                          _pageController.nextPage(
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeInOut,
                          );
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 28,
                          vertical: 14,
                        ),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [
                              AppTheme.accentPurple,
                              AppTheme.accentCyan,
                            ],
                          ),
                          borderRadius: BorderRadius.circular(30),
                          boxShadow: [
                            BoxShadow(
                              color: AppTheme.accentPurple
                                  .withValues(alpha: 0.4),
                              blurRadius: 15,
                              offset: const Offset(0, 5),
                            ),
                          ],
                        ),
                        child: Text(
                          _currentPage ==
                                  _getSteps(_settings.language).length - 1
                              ? AppLocalizations.t(
                                  'onboarding_start',
                                  _settings.language,
                                )
                              : AppLocalizations.t(
                                  'onboarding_next',
                                  _settings.language,
                                ),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
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
    );
  }
}

class _OnboardingStep {
  final IconData icon;
  final String title;
  final String description;
  final String ttsText;

  const _OnboardingStep({
    required this.icon,
    required this.title,
    required this.description,
    required this.ttsText,
  });
}
