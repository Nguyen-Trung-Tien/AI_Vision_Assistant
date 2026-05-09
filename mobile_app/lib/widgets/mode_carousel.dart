import 'dart:math';
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

  static const List<Color> modeColors = [
    Color(0xFFFFD700), // 0: Money - Gold
    Color(0xFF42A5F5), // 1: Caption - Blue
    Color(0xFF26C6DA), // 2: Face - Teal
    Color(0xFF7C4DFF), // 3: Navigation - Purple
    Color(0xFF00D4FF), // 4: Online OCR - Cyan
    Color(0xFFFF9800), // 5: File Read - Orange
    Color(0xFF00E676), // 6: Offline OCR - Green
    Color(0xFFFF6B9D), // 7: Layout - Pink
  ];

  @override
  Widget build(BuildContext context) {
    return PageView.builder(
      controller: pageController,
      onPageChanged: onPageChanged,
      itemCount: modes.length,
      itemBuilder: (context, index) {
        final color = index < modeColors.length
            ? modeColors[index]
            : AppTheme.accentCyan;

        return Container(
          color: Colors.transparent,
          alignment: Alignment.center,
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 28),
            padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.5),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(
                color: color.withValues(alpha: 0.35),
                width: 1.5,
              ),
              boxShadow: [
                BoxShadow(
                  color: color.withValues(alpha: 0.12),
                  blurRadius: 24,
                  spreadRadius: 2,
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: color.withValues(alpha: 0.25),
                    ),
                  ),
                  child: Icon(
                    modeIcons[index],
                    color: color,
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
                    color: color,
                    shadows: [
                      Shadow(
                        blurRadius: 16,
                        color: color.withValues(alpha: 0.4),
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                // Mode color indicator bar
                Container(
                  width: 40,
                  height: 3,
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.6),
                    borderRadius: BorderRadius.circular(2),
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
