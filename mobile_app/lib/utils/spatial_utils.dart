import 'dart:math';

/// Utility functions for Spatial Audio 3D positioning.

/// Calculate stereo pan value from center_x_ratio.
///
/// [centerXRatio] - normalized X position (0.0 = far left, 1.0 = far right)
/// Returns pan value: -1.0 (full left) to +1.0 (full right)
double panFromCenterXRatio(double centerXRatio) {
  return (centerXRatio * 2.0 - 1.0).clamp(-1.0, 1.0);
}

/// Calculate stereo pan from position text (fallback when no ratio available).
///
/// Returns gradient pan: left=-0.85, right=+0.85, center=0.0
double panFromPositionText(String position) {
  final lower = position.toLowerCase();
  if (lower.contains('trái') || lower.contains('left')) return -0.85;
  if (lower.contains('phải') || lower.contains('right')) return 0.85;
  return 0.0;
}

/// Determine alert level from distance and object type.
///
/// Returns 'high', 'medium', or 'low'.
String alertLevelFromDistance(double distance, {String? label}) {
  // Traffic lights get special treatment — always medium unless very close
  if (label != null) {
    final l = label.toLowerCase();
    if (l.contains('đèn') || l.contains('light') || l.contains('traffic')) {
      return distance < 1.5 ? 'high' : 'medium';
    }
  }

  if (distance < 1.0) return 'high';
  if (distance < 2.5) return 'medium';
  return 'low';
}

/// Calculate volume factor based on distance and max warning range.
///
/// Returns 0.1 (far) to 1.0 (very close).
double volumeFromDistance(double distance, double maxDistance) {
  return max(0.1, 1.0 - (distance / maxDistance));
}
