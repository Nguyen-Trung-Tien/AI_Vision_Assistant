import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:flutter/foundation.dart';

class WebSocketService {
  late IO.Socket socket;

  /// Token dùng để authenticate với WebSocket gateway.
  /// Trong development dùng dev_bypass_token.
  /// TODO: Thay bằng JWT thật từ login flow khi có auth screen.
  String _authToken = const String.fromEnvironment(
    'WS_TOKEN',
    defaultValue: '',
  );

  Function(Map<String, dynamic>)? onDangerAlert;
  Function(Map<String, dynamic>)? onAIResult;
  Function(Map<String, dynamic>)? onStreamAck;
  Function(bool isConnected)? onConnectionStatus;

  bool _isConnected = false;
  bool get isConnected => _isConnected;

  int _reconnectAttempts = 0;
  Timer? _reconnectTimer;
  static const int _maxReconnectDelay = 30; // seconds

  /// Cập nhật token khi user login thành công.
  void setAuthToken(String token) {
    _authToken = token;
  }

  void connect() {
    String baseUrl = const String.fromEnvironment(
      'BACKEND_URL',
      defaultValue: 'http://10.0.2.2:3000',
    );

    socket = IO.io(
      baseUrl,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .setAuth({'token': _authToken})
          .build(),
    );

    socket.connect();

    socket.onConnect((_) {
      debugPrint('Connected to Gateway WS');
      _isConnected = true;
      _reconnectAttempts = 0;
      _reconnectTimer?.cancel();
      onConnectionStatus?.call(true);
    });

    socket.on('danger_alert', (data) {
      debugPrint('Received Danger Alert: $data');
      if (onDangerAlert != null) {
        onDangerAlert!(Map<String, dynamic>.from(data as Map));
      }
    });

    socket.on('ai_result', (data) {
      debugPrint('Received AI Result: $data');
      if (onAIResult != null) {
        onAIResult!(Map<String, dynamic>.from(data as Map));
      }
    });

    socket.on('stream_ack', (data) {
      debugPrint('Received Stream Ack: $data');
      if (onStreamAck != null) {
        onStreamAck!(Map<String, dynamic>.from(data as Map));
      }
    });

    socket.onDisconnect((_) {
      debugPrint('Disconnected from Gateway WS');
      _isConnected = false;
      onConnectionStatus?.call(false);
      _scheduleReconnect();
    });

    socket.onConnectError((error) {
      debugPrint('WS Connection Error: $error');
      _isConnected = false;
      onConnectionStatus?.call(false);
      _scheduleReconnect();
    });

    socket.onError((error) {
      debugPrint('WS Error: $error');
    });
  }

  void _scheduleReconnect() {
    _reconnectTimer?.cancel();

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
    final delay = (1 << _reconnectAttempts).clamp(1, _maxReconnectDelay);
    _reconnectAttempts++;

    debugPrint(
      'Scheduling reconnect in ${delay}s (attempt $_reconnectAttempts)',
    );

    _reconnectTimer = Timer(Duration(seconds: delay), () {
      if (!_isConnected) {
        debugPrint('Attempting reconnect...');
        socket.connect();
      }
    });
  }

  void sendFrame(
    String base64Frame,
    bool isDanger,
    double distance, {
    String? taskType,
    String lang = 'vi',
    double warningDistanceM = 2.0,
  }) {
    if (!socket.connected) {
      debugPrint('WS not connected, frame dropped');
      return;
    }

    socket.emit('frame_stream', {
      'frame': base64Frame,
      'is_danger': isDanger,
      'distance': distance,
      'task_type': taskType,
      'lang': lang,
      'warning_distance_m': warningDistanceM,
    });
  }

  void dispose() {
    _reconnectTimer?.cancel();
    socket.dispose();
  }
}
