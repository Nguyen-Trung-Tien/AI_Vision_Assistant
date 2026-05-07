import 'package:flutter/material.dart';
import 'package:mobile_app/theme/app_theme.dart';
import 'package:mobile_app/l10n/app_localizations.dart';

class SosSuccessOverlay extends StatelessWidget {
  const SosSuccessOverlay({
    super.key,
    required this.countdown,
    required this.onCancel,
    required this.language,
  });

  final int countdown;
  final VoidCallback onCancel;
  final String language;

  @override
  Widget build(BuildContext context) {
    return Positioned.fill(
      child: Container(
        color: Colors.black.withValues(alpha: 0.85),
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Checkmark icon
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: AppTheme.accentGreen.withValues(alpha: 0.2),
                shape: BoxShape.circle,
                border: Border.all(
                  color: AppTheme.accentGreen,
                  width: 3,
                ),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.accentGreen.withValues(alpha: 0.3),
                    blurRadius: 20,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: const Icon(
                Icons.check_rounded,
                color: AppTheme.accentGreen,
                size: 64,
              ),
            ),
            const SizedBox(height: 32),

            // Title
            Text(
              language == 'vi' ? 'ĐÃ GỬI CẢNH BÁO SOS' : 'SOS ALERT SENT',
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.2,
              ),
            ),
            const SizedBox(height: 16),

            // Description
            Text(
              language == 'vi'
                  ? 'Vị trí của bạn đã được gửi đến danh bạ khẩn cấp.'
                  : 'Your location has been sent to emergency contacts.',
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 16,
                fontWeight: FontWeight.w400,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 48),

            // Cancel Button
            Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: onCancel,
                borderRadius: BorderRadius.circular(30),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  decoration: BoxDecoration(
                    color: Colors.transparent,
                    borderRadius: BorderRadius.circular(30),
                    border: Border.all(
                      color: AppTheme.accentRed.withValues(alpha: 0.8),
                      width: 2,
                    ),
                  ),
                  child: Column(
                    children: [
                      Text(
                        language == 'vi' ? 'HỦY BÁO ĐỘNG GIẢ' : 'CANCEL FALSE ALARM',
                        style: const TextStyle(
                          color: AppTheme.accentRed,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        language == 'vi'
                            ? '(Nhấn trong $countdown giây)'
                            : '(Press within $countdown seconds)',
                        style: TextStyle(
                          color: AppTheme.accentRed.withValues(alpha: 0.7),
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
