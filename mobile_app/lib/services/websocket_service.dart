import 'dart:async';
import 'dart:convert';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:flutter/foundation.dart';

class WebSocketService {
  io.Socket? _socket;

  /// Token dùng để authenticate với WebSocket gateway.
  String _authToken = const String.fromEnvironment(
    'WS_TOKEN',
    defaultValue: '',
  );

  Function(Map<String, dynamic>)? onDangerAlert;
  Function(Map<String, dynamic>)? onAIResult;
  Function(Map<String, dynamic>)? onStreamAck;
  Function(Map<String, dynamic>)? onTtsBroadcast;
  Function(bool isConnected)? onConnectionStatus;

  bool _isConnected = false;
  bool _isDisposed = false;
  bool get isConnected => _isConnected;

  int _reconnectAttempts = 0;
  Timer? _reconnectTimer;
  static const int _maxReconnectDelay = 30; // seconds

  /// Cập nhật token khi user login thành công.
  /// Tự động kết nối WebSocket nếu chưa kết nối.
  void setAuthToken(String token) {
    _authToken = token;
    if (!_isConnected && !_isDisposed) {
      connect();
    }
  }

  /// Tạo và config một socket instance mới.
  io.Socket _createSocket(String baseUrl) {
    return io.io(
      baseUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .setAuth({'token': _authToken})
          .build(),
    );
  }

  void _attachListeners(io.Socket socket) {
    socket.onConnect((_) {
      debugPrint('Connected to Gateway WS');
      _isConnected = true;
      _reconnectAttempts = 0;
      _reconnectTimer?.cancel();
      socket.emit('join_user');
      onConnectionStatus?.call(true);
    });

    socket.on('join_user_ack', (data) {
      debugPrint('WS join_user_ack: $data');
    });

    socket.on('danger_alert', (data) {
      if (onDangerAlert != null) {
        onDangerAlert!(Map<String, dynamic>.from(data as Map));
      }
    });

    socket.on('ai_result', (data) {
      if (onAIResult != null) {
        onAIResult!(Map<String, dynamic>.from(data as Map));
      }
    });

    socket.on('stream_ack', (data) {
      if (onStreamAck != null) {
        onStreamAck!(Map<String, dynamic>.from(data as Map));
      }
    });

    socket.on('tts_broadcast', (data) {
      if (onTtsBroadcast != null) {
        onTtsBroadcast!(Map<String, dynamic>.from(data as Map));
      }
    });

    socket.onDisconnect((_) {
      debugPrint('Disconnected from Gateway WS');
      _isConnected = false;
      onConnectionStatus?.call(false);
      if (!_isDisposed) _scheduleReconnect();
    });

    socket.onConnectError((error) {
      debugPrint('WS Connection Error: $error');
      _isConnected = false;
      onConnectionStatus?.call(false);
      if (!_isDisposed) _scheduleReconnect();
    });

    socket.onError((error) {
      debugPrint('WS Error: $error');
    });
  }

  void connect() {
    if (_isDisposed) return;

    // Do not attempt connection without a token — WsJwtGuard will reject immediately.
    if (_authToken.isEmpty) {
      debugPrint(
        'WS: Skipping connect — no auth token set. Call setAuthToken() after login.',
      );
      return;
    }

    debugPrint('WS: Connecting with token length ${_authToken.length}');

    final baseUrl = const String.fromEnvironment(
      'BACKEND_URL',
      defaultValue: 'http://10.0.2.2:3000',
    );

    _socket = _createSocket(baseUrl);
    _attachListeners(_socket!);
    _socket!.connect();
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
      if (!_isConnected && !_isDisposed) {
        debugPrint(
          'Attempting reconnect — disposing old socket and creating new one...',
        );
        // Dispose old socket properly before creating a new one to avoid memory leak
        _socket?.dispose();
        _socket = null;
        connect();
      }
    });
  }

  void sendFrame(
    String base64Frame, {
    String? taskType,
    String lang = 'vi',
    double warningDistanceM = 2.0,
    double? latitude,
    double? longitude,
  }) {
    if (_socket == null || !_socket!.connected) {
      debugPrint('WS not connected, frame dropped');
      return;
    }

    debugPrint(
      'WS sendFrame: task=$taskType len=${base64Frame.length} lang=$lang '
      'lat=${latitude ?? 'n/a'} lon=${longitude ?? 'n/a'}',
    );

    _socket!.emit('frame_stream', {
      'frame': base64Frame,
      'task_type': taskType,
      'lang': lang,
      'warning_distance_m': warningDistanceM,
      'latitude': latitude,
      'longitude': longitude,
    });
  }

  void sendSosAlert({
    required double latitude,
    required double longitude,
    String? imageBase64,
    String? timestamp,
  }) {
    if (_socket == null || !_socket!.connected) {
      debugPrint('WS not connected, SOS dropped');
      return;
    }

    _socket!.emit('sos_alert', {
      'latitude': latitude,
      'longitude': longitude,
      'imageBase64': imageBase64,
      'timestamp': timestamp ?? DateTime.now().toIso8601String(),
    });
  }

  void sendVisualQA({
    required Uint8List frame,
    String lang = 'vi',
    required String question,
    double? latitude,
    double? longitude,
  }) {
    if (_socket == null || !_socket!.connected) {
      debugPrint('WS not connected, Visual QA dropped');
      return;
    }

    // Convert frame to base64
    final base64Frame = base64Encode(frame);

    _socket!.emit('visual_qa', {
      'frame': base64Frame,
      'lang': lang,
      'question': question,
      'latitude': latitude,
      'longitude': longitude,
    });
  }

  void dispose() {
    _isDisposed = true;
    _reconnectTimer?.cancel();
    _socket?.dispose();
    _socket = null;
  }
}
