import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';

/// Singleton service theo dõi trạng thái kết nối mạng thực sự (WiFi / Mobile data).
/// Dùng connectivity_plus để lắng nghe thay đổi realtime.
class ConnectivityService {
  static final ConnectivityService _instance = ConnectivityService._internal();
  factory ConnectivityService() => _instance;
  ConnectivityService._internal();

  final Connectivity _connectivity = Connectivity();
  final StreamController<bool> _controller = StreamController<bool>.broadcast();

  bool _isOnline = true;
  bool get isOnline => _isOnline;

  StreamSubscription<List<ConnectivityResult>>? _subscription;

  /// Gọi 1 lần khi khởi động app để bắt đầu lắng nghe.
  Future<void> init() async {
    // Kiểm tra trạng thái ban đầu
    final results = await _connectivity.checkConnectivity();
    _isOnline = _hasConnection(results);
    debugPrint(
      '[Connectivity] Initial state: ${_isOnline ? "online" : "offline"}',
    );

    // Lắng nghe thay đổi
    _subscription = _connectivity.onConnectivityChanged.listen((results) {
      final online = _hasConnection(results);
      if (online != _isOnline) {
        _isOnline = online;
        debugPrint(
          '[Connectivity] Changed → ${_isOnline ? "online" : "offline"}',
        );
        _controller.add(_isOnline);
      }
    });
  }

  bool _hasConnection(List<ConnectivityResult> results) {
    return results.any(
      (r) =>
          r == ConnectivityResult.wifi ||
          r == ConnectivityResult.mobile ||
          r == ConnectivityResult.ethernet,
    );
  }

  /// Stream phát ra `true` khi có mạng, `false` khi mất mạng.
  Stream<bool> get onConnectivityChanged => _controller.stream;

  void dispose() {
    _subscription?.cancel();
    _controller.close();
  }
}
