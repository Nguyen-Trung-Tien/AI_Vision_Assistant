import 'package:flutter/material.dart';
import 'package:mobile_app/theme/app_theme.dart';

class ModeCarousel extends StatelessWidget {
  final PageController pageController;
  final Function(int) onPageChanged;
  final List<String> modes;
  final List<IconData> modeIcons;

  const ModeCarousel({
    super.key,
    required this.pageController,
    required this.onPageChanged,
    required this.modes,
    required this.modeIcons,
  });

  @override
  Widget build(BuildContext context) {
    return PageView.builder(
      controller: pageController,
      onPageChanged: onPageChanged,
      itemCount: modes.length,
      itemBuilder: (context, index) {
        return Container(
          color: Colors.transparent,
          alignment: Alignment.center,
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 28),
            padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
            decoration: AppTheme.glassDecoration(
              borderRadius: 24,
              opacity: 0.5,
            ).copyWith(
              border: Border.all(
                color: AppTheme.accentPurple.withValues(alpha: 0.25),
                width: 1.5,
              ),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: AppTheme.accentPurple.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Icon(
                    modeIcons[index],
                    color: AppTheme.accentCyan,
                    size: 36,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  modes[index].toUpperCase(),
                  textAlign: TextAlign.center,
                  style: AppTheme.titleLarge.copyWith(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.2,
                    shadows: const [
                      Shadow(
                        blurRadius: 12,
                        color: Colors.black54,
                        offset: Offset(0, 2),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
