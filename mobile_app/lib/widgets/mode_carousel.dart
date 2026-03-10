import 'package:flutter/material.dart';

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
          color: Colors.black.withValues(alpha: 0.3),
          alignment: Alignment.center,
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 24),
            padding: const EdgeInsets.symmetric(
              horizontal: 22,
              vertical: 18,
            ),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.45),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.15),
              ),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  modeIcons[index],
                  color: const Color(0xFF6C63FF),
                  size: 46,
                ),
                const SizedBox(height: 12),
                Text(
                  modes[index].toUpperCase(),
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    shadows: [
                      Shadow(
                        blurRadius: 10.0,
                        color: Colors.black87,
                        offset: Offset(2.0, 2.0),
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
