import 'package:flutter/material.dart';

/// Theme đồng bộ với Admin Dashboard: tối, tím, cyan.
class AppTheme {
  AppTheme._();

  // ── Colors (khớp admin-dashboard) ─────────────────────────────────────
  static const Color bgPrimary = Color(0xFF0A0A1A);
  static const Color bgDark = Color(0xFF0D0D2B);
  static const Color bgCard = Color(0xFF16163A);
  static const Color bgCardHover = Color(0xFF1E1E4A);

  static const Color accentPurple = Color(0xFF6C63FF);
  static const Color accentCyan = Color(0xFF00D4FF);
  static const Color accentPink = Color(0xFFFF6B9D);
  static const Color accentGreen = Color(0xFF00E676);
  static const Color accentOrange = Color(0xFFFF9800);
  static const Color accentRed = Color(0xFFFF5252);

  static Color whiteAlpha(double alpha) => Colors.white.withValues(alpha: alpha);

  // ── Typography ─────────────────────────────────────────────────────────
  static const String _fontFamily = 'Roboto';

  static TextStyle get headlineLarge => const TextStyle(
        color: Colors.white,
        fontSize: 28,
        fontWeight: FontWeight.bold,
        letterSpacing: 0.5,
      );

  static TextStyle get headlineMedium => const TextStyle(
        color: Colors.white,
        fontSize: 22,
        fontWeight: FontWeight.w600,
      );

  static TextStyle get titleLarge => const TextStyle(
        color: Colors.white,
        fontSize: 18,
        fontWeight: FontWeight.w600,
      );

  static TextStyle get bodyLarge => TextStyle(
        color: whiteAlpha(0.9),
        fontSize: 16,
        height: 1.4,
      );

  static TextStyle get bodyMedium => TextStyle(
        color: whiteAlpha(0.8),
        fontSize: 14,
        height: 1.4,
      );

  static TextStyle get bodySmall => TextStyle(
        color: whiteAlpha(0.6),
        fontSize: 12,
      );

  static TextStyle get labelChip => TextStyle(
        color: whiteAlpha(0.85),
        fontSize: 13,
        fontWeight: FontWeight.w500,
      );

  // ── Decoration helpers ─────────────────────────────────────────────────
  static BoxDecoration cardDecoration({
    bool bordered = true,
    double borderRadius = 16,
  }) {
    return BoxDecoration(
      color: bgCard.withValues(alpha: 0.85),
      borderRadius: BorderRadius.circular(borderRadius),
      border: bordered
          ? Border.all(color: accentPurple.withValues(alpha: 0.2), width: 1)
          : null,
      boxShadow: [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.3),
          blurRadius: 16,
          offset: const Offset(0, 4),
        ),
      ],
    );
  }

  static BoxDecoration glassDecoration({
    double borderRadius = 16,
    double opacity = 0.45,
  }) {
    return BoxDecoration(
      color: Colors.black.withValues(alpha: opacity),
      borderRadius: BorderRadius.circular(borderRadius),
      border: Border.all(color: whiteAlpha(0.12)),
    );
  }

  static BoxDecoration gradientButtonDecoration() {
    return BoxDecoration(
      gradient: const LinearGradient(
        colors: [accentPurple, accentCyan],
        begin: Alignment.centerLeft,
        end: Alignment.centerRight,
      ),
      borderRadius: BorderRadius.circular(14),
      boxShadow: [
        BoxShadow(
          color: accentPurple.withValues(alpha: 0.4),
          blurRadius: 12,
          offset: const Offset(0, 4),
        ),
      ],
    );
  }

  // ── Input decoration ────────────────────────────────────────────────────
  static InputDecoration inputDecoration(
    String label, {
    Widget? suffixIcon,
    String? hint,
  }) {
    return InputDecoration(
      labelText: label,
      hintText: hint,
      labelStyle: TextStyle(color: whiteAlpha(0.7), fontSize: 14),
      hintStyle: TextStyle(color: whiteAlpha(0.4)),
      suffixIcon: suffixIcon,
      filled: true,
      fillColor: whiteAlpha(0.08),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: whiteAlpha(0.1)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: accentCyan, width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: accentRed),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
    );
  }

  // ── Material ThemeData ──────────────────────────────────────────────────
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: bgPrimary,
      primaryColor: accentPurple,
      colorScheme: ColorScheme.dark(
        primary: accentPurple,
        secondary: accentCyan,
        surface: bgCard,
        error: accentRed,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: Colors.white,
        onError: Colors.white,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: bgCard,
        elevation: 0,
        centerTitle: true,
        iconTheme: IconThemeData(color: Colors.white, size: 24),
        titleTextStyle: TextStyle(
          color: Colors.white,
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: accentPurple,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: whiteAlpha(0.8),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: whiteAlpha(0.08),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      ),
      sliderTheme: SliderThemeData(
        activeTrackColor: accentPurple,
        inactiveTrackColor: whiteAlpha(0.2),
        thumbColor: accentCyan,
        overlayColor: accentCyan.withValues(alpha: 0.2),
        trackHeight: 6,
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: bgCard,
        contentTextStyle: const TextStyle(color: Colors.white),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }
}
