import 'package:flutter/material.dart';
import 'package:mobile_app/services/accessibility_manager.dart';
import 'package:mobile_app/services/settings_service.dart';

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

  final List<_OnboardingStep> _steps = [
    _OnboardingStep(
      icon: Icons.visibility,
      title: 'Chào mừng bạn',
      description:
          'AI Vision Assistant giúp bạn nhận diện tiền, đọc văn bản, '
          'và mô tả không gian xung quanh bằng trí tuệ nhân tạo.',
      ttsText:
          'Chào mừng bạn đến với ứng dụng Trợ lý thị giác. '
          'Ứng dụng giúp bạn nhận diện tiền, đọc văn bản, '
          'và mô tả không gian xung quanh.',
    ),
    _OnboardingStep(
      icon: Icons.swipe,
      title: 'Cách sử dụng',
      description:
          'Vuốt trái/phải để đổi chế độ.\n'
          'Chạm đúp để nhận diện.\n'
          'Nhấn giữ để ra lệnh giọng nói.',
      ttsText:
          'Vuốt trái hoặc phải để đổi chế độ. '
          'Chạm đúp vào màn hình để nhận diện. '
          'Nhấn giữ để ra lệnh bằng giọng nói.',
    ),
    _OnboardingStep(
      icon: Icons.emergency,
      title: 'Tính năng khẩn cấp',
      description:
          'Nhấn nút nguồn 3 lần liên tiếp hoặc\n'
          'nói "Cứu tôi" để gọi SOS.',
      ttsText:
          'Trong trường hợp khẩn cấp, nhấn nút nguồn 3 lần liên tiếp, '
          'hoặc nói cứu tôi để kích hoạt cuộc gọi khẩn cấp.',
    ),
    _OnboardingStep(
      icon: Icons.rocket_launch,
      title: 'Sẵn sàng!',
      description: 'Chạm đúp vào màn hình để bắt đầu sử dụng.',
      ttsText:
          'Bạn đã sẵn sàng. Chạm đúp vào màn hình để bắt đầu sử dụng ứng dụng.',
    ),
  ];

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
    _accessibility.speak(_steps[_currentPage].ttsText);
  }

  void _onPageChanged(int index) {
    setState(() => _currentPage = index);
    _accessibility.triggerSuccessVibration();
    _speakCurrentStep();
  }

  Future<void> _finishOnboarding() async {
    await _settings.setFirstLaunchDone();
    _accessibility.speak('Bắt đầu sử dụng');
    if (mounted) {
      Navigator.of(
        context,
      ).pushReplacement(MaterialPageRoute(builder: (_) => widget.nextScreen));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D0D1A),
      body: GestureDetector(
        onDoubleTap: () {
          if (_currentPage == _steps.length - 1) {
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
                  child: const Text(
                    'Bỏ qua',
                    style: TextStyle(color: Colors.white54, fontSize: 16),
                  ),
                ),
              ),

              // Page content
              Expanded(
                child: PageView.builder(
                  controller: _pageController,
                  onPageChanged: _onPageChanged,
                  itemCount: _steps.length,
                  itemBuilder: (context, index) {
                    final step = _steps[index];
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
                                colors: [Color(0xFF6C63FF), Color(0xFF9D4EDD)],
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(
                                    0xFF6C63FF,
                                  ).withOpacity(0.4),
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
                              color: Colors.white.withOpacity(0.7),
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
                        _steps.length,
                        (index) => AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          margin: const EdgeInsets.only(right: 8),
                          width: _currentPage == index ? 28 : 10,
                          height: 10,
                          decoration: BoxDecoration(
                            color: _currentPage == index
                                ? const Color(0xFF6C63FF)
                                : Colors.white24,
                            borderRadius: BorderRadius.circular(5),
                          ),
                        ),
                      ),
                    ),

                    // Next / Start button
                    GestureDetector(
                      onTap: () {
                        if (_currentPage == _steps.length - 1) {
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
                            colors: [Color(0xFF6C63FF), Color(0xFF9D4EDD)],
                          ),
                          borderRadius: BorderRadius.circular(30),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF6C63FF).withOpacity(0.4),
                              blurRadius: 15,
                              offset: const Offset(0, 5),
                            ),
                          ],
                        ),
                        child: Text(
                          _currentPage == _steps.length - 1
                              ? 'Bắt đầu'
                              : 'Tiếp',
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
