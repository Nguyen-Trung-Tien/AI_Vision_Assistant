import 'package:flutter/material.dart';
import 'package:mobile_app/controllers/sos_controller.dart';
import 'package:mobile_app/theme/app_theme.dart';

class SosSuccessOverlay extends StatelessWidget {
  const SosSuccessOverlay({
    super.key,
    required this.status,
    required this.countdown,
    required this.onCancel,
    required this.language,
  });

  final SosOverlayStatus status;
  final int countdown;
  final VoidCallback onCancel;
  final String language;

  bool get _isVietnamese => language == 'vi';
  bool get _canCancel => status == SosOverlayStatus.countdown;

  @override
  Widget build(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);
    final theme = _OverlayTheme.fromStatus(status);

    return Positioned.fill(
      child: Container(
        color: Colors.black.withValues(alpha: 0.82),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 420),
                child: Container(
                  padding: const EdgeInsets.fromLTRB(22, 20, 22, 22),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(28),
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        const Color(0xFF1B1637),
                        theme.panelColor,
                      ],
                    ),
                    border: Border.all(
                      color: theme.borderColor.withValues(alpha: 0.75),
                      width: 1.4,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: theme.borderColor.withValues(alpha: 0.22),
                        blurRadius: 28,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _buildHeader(theme),
                      const SizedBox(height: 18),
                      _buildBadge(theme),
                      const SizedBox(height: 18),
                      Text(
                        _title,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.w800,
                          height: 1.15,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        _description,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.82),
                          fontSize: 15,
                          fontWeight: FontWeight.w500,
                          height: 1.45,
                        ),
                      ),
                      const SizedBox(height: 20),
                      if (_canCancel) ...[
                        _buildCountdownRing(theme),
                        const SizedBox(height: 16),
                        _buildHintCard(),
                        const SizedBox(height: 18),
                        _buildCancelButton(),
                      ] else ...[
                        _buildStatusCard(theme),
                      ],
                      SizedBox(height: mediaQuery.padding.bottom > 0 ? 4 : 0),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(_OverlayTheme theme) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          decoration: BoxDecoration(
            color: theme.borderColor.withValues(alpha: 0.16),
            borderRadius: BorderRadius.circular(999),
            border:
                Border.all(color: theme.borderColor.withValues(alpha: 0.42)),
          ),
          child: Text(
            _isVietnamese ? 'SOS khẩn cấp' : 'Emergency SOS',
            style: TextStyle(
              color: theme.borderColor,
              fontSize: 12,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.3,
            ),
          ),
        ),
        const Spacer(),
        if (_canCancel)
          Text(
            '${countdown}s',
            style: TextStyle(
              color: theme.borderColor,
              fontSize: 22,
              fontWeight: FontWeight.w800,
            ),
          ),
      ],
    );
  }

  Widget _buildBadge(_OverlayTheme theme) {
    return Container(
      width: 104,
      height: 104,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(
          colors: [
            theme.iconBackground,
            theme.iconBackground.withValues(alpha: 0.15),
          ],
        ),
        border: Border.all(color: theme.borderColor, width: 2.4),
      ),
      child: Icon(theme.icon, color: theme.borderColor, size: 52),
    );
  }

  Widget _buildCountdownRing(_OverlayTheme theme) {
    final progress = (countdown / 10).clamp(0, 1).toDouble();
    return SizedBox(
      width: 112,
      height: 112,
      child: Stack(
        alignment: Alignment.center,
        children: [
          SizedBox(
            width: 112,
            height: 112,
            child: CircularProgressIndicator(
              value: progress,
              strokeWidth: 7,
              backgroundColor: Colors.white.withValues(alpha: 0.08),
              valueColor: AlwaysStoppedAnimation<Color>(theme.borderColor),
            ),
          ),
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '$countdown',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 34,
                  fontWeight: FontWeight.w900,
                  height: 1,
                ),
              ),
              Text(
                _isVietnamese ? 'giây' : 'sec',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.7),
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildHintCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      decoration: AppTheme.glassDecoration(
        borderRadius: 18,
        opacity: 0.3,
      ).copyWith(
        border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
      ),
      child: Row(
        children: [
          const Icon(Icons.info_outline_rounded,
              color: Colors.white70, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              _isVietnamese
                  ? 'Nếu bấm nhầm, hãy hủy ngay trước khi hệ thống gửi cảnh báo và vị trí của bạn.'
                  : 'If this was accidental, cancel now before your alert and location are sent.',
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.8),
                fontSize: 13.5,
                fontWeight: FontWeight.w500,
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCancelButton() {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onCancel,
        borderRadius: BorderRadius.circular(18),
        child: Ink(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            color: AppTheme.accentRed.withValues(alpha: 0.15),
            border: Border.all(
              color: AppTheme.accentRed.withValues(alpha: 0.8),
              width: 1.5,
            ),
          ),
          child: Column(
            children: [
              Text(
                _isVietnamese ? 'Hủy báo động giả' : 'Cancel false alarm',
                style: const TextStyle(
                  color: AppTheme.accentRed,
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                _isVietnamese
                    ? 'Nhấn trong vòng $countdown giây'
                    : 'Press within $countdown seconds',
                style: TextStyle(
                  color: AppTheme.accentRed.withValues(alpha: 0.78),
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusCard(_OverlayTheme theme) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
      decoration: AppTheme.glassDecoration(
        borderRadius: 18,
        opacity: 0.28,
      ).copyWith(
        border: Border.all(color: theme.borderColor.withValues(alpha: 0.26)),
      ),
      child: Row(
        children: [
          Icon(theme.smallIcon, color: theme.borderColor, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              _statusCaption,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.88),
                fontSize: 14,
                fontWeight: FontWeight.w600,
                height: 1.35,
              ),
            ),
          ),
        ],
      ),
    );
  }

  String get _title {
    switch (status) {
      case SosOverlayStatus.countdown:
        return _isVietnamese
            ? 'Sắp gửi cảnh báo SOS'
            : 'SOS alert about to send';
      case SosOverlayStatus.sending:
        return _isVietnamese ? 'Đang gửi cảnh báo SOS' : 'Sending SOS alert';
      case SosOverlayStatus.sent:
        return _isVietnamese ? 'Đã gửi cảnh báo SOS' : 'SOS alert sent';
      case SosOverlayStatus.error:
        return _isVietnamese
            ? 'Không thể gửi vị trí SOS'
            : 'Unable to send SOS location';
      case SosOverlayStatus.hidden:
        return '';
    }
  }

  String get _description {
    switch (status) {
      case SosOverlayStatus.countdown:
        return _isVietnamese
            ? 'Ứng dụng sẽ gửi cảnh báo khẩn cấp cùng vị trí hiện tại của bạn sau khi hết đếm ngược.'
            : 'The app will send an emergency alert with your current location when the countdown ends.';
      case SosOverlayStatus.sending:
        return _isVietnamese
            ? 'Hệ thống đang lấy vị trí và chuyển tín hiệu SOS đến máy chủ và liên hệ khẩn cấp.'
            : 'The system is getting your location and delivering your SOS alert to the server and emergency contacts.';
      case SosOverlayStatus.sent:
        return _isVietnamese
            ? 'Tín hiệu cầu cứu và vị trí của bạn đã được gửi thành công.'
            : 'Your emergency signal and location were sent successfully.';
      case SosOverlayStatus.error:
        return _isVietnamese
            ? 'Ứng dụng chưa lấy được vị trí hiện tại, nên chưa thể hoàn tất cảnh báo.'
            : 'The app could not obtain your current location, so the alert could not be completed.';
      case SosOverlayStatus.hidden:
        return '';
    }
  }

  String get _statusCaption {
    switch (status) {
      case SosOverlayStatus.sending:
        return _isVietnamese
            ? 'Vui lòng giữ kết nối mạng và GPS trong giây lát.'
            : 'Please keep network and GPS available for a moment.';
      case SosOverlayStatus.sent:
        return _isVietnamese
            ? 'Màn hình này sẽ tự đóng sau vài giây.'
            : 'This message will close automatically in a moment.';
      case SosOverlayStatus.error:
        return _isVietnamese
            ? 'Hãy thử lại khi GPS đã được cấp quyền và sẵn sàng.'
            : 'Try again after GPS permission is granted and location is ready.';
      case SosOverlayStatus.countdown:
      case SosOverlayStatus.hidden:
        return '';
    }
  }
}

class _OverlayTheme {
  const _OverlayTheme({
    required this.panelColor,
    required this.borderColor,
    required this.iconBackground,
    required this.icon,
    required this.smallIcon,
  });

  final Color panelColor;
  final Color borderColor;
  final Color iconBackground;
  final IconData icon;
  final IconData smallIcon;

  factory _OverlayTheme.fromStatus(SosOverlayStatus status) {
    switch (status) {
      case SosOverlayStatus.countdown:
        return const _OverlayTheme(
          panelColor: Color(0xFF24182E),
          borderColor: AppTheme.accentOrange,
          iconBackground: Color(0x33FF9800),
          icon: Icons.sos_rounded,
          smallIcon: Icons.timer_outlined,
        );
      case SosOverlayStatus.sending:
        return const _OverlayTheme(
          panelColor: Color(0xFF13243B),
          borderColor: AppTheme.accentCyan,
          iconBackground: Color(0x3300D4FF),
          icon: Icons.my_location_rounded,
          smallIcon: Icons.cloud_upload_outlined,
        );
      case SosOverlayStatus.sent:
        return const _OverlayTheme(
          panelColor: Color(0xFF132C26),
          borderColor: AppTheme.accentGreen,
          iconBackground: Color(0x3300E676),
          icon: Icons.check_circle_rounded,
          smallIcon: Icons.verified_rounded,
        );
      case SosOverlayStatus.error:
        return const _OverlayTheme(
          panelColor: Color(0xFF34161A),
          borderColor: AppTheme.accentRed,
          iconBackground: Color(0x33FF5252),
          icon: Icons.location_off_rounded,
          smallIcon: Icons.error_outline_rounded,
        );
      case SosOverlayStatus.hidden:
        return const _OverlayTheme(
          panelColor: AppTheme.bgCard,
          borderColor: AppTheme.accentPurple,
          iconBackground: Color(0x336C63FF),
          icon: Icons.shield_outlined,
          smallIcon: Icons.info_outline_rounded,
        );
    }
  }
}
