import 'dart:convert';
import 'dart:io';

import 'package:mobile_app/services/settings_service.dart';

class FeedbackService {
  final SettingsService _settings = SettingsService();
  final String _baseUrl = const String.fromEnvironment(
    'BACKEND_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );

  Future<void> submitFeedback({
    required String detectionId,
    required bool isCorrect,
    String? imageBase64,
  }) async {
    final token = _settings.authToken;
    if (token.isEmpty) return;

    final client = HttpClient();
    try {
      final payload = jsonEncode({
        'detectionId': detectionId,
        'isCorrect': isCorrect,
        'imageBase64': imageBase64,
      });

      final ok = await _post(client, '$_baseUrl/api/feedback', token, payload) ||
          await _post(client, '$_baseUrl/feedback', token, payload);
      if (!ok) throw HttpException('Feedback request failed');
    } finally {
      client.close(force: true);
    }
  }

  Future<bool> _post(
    HttpClient client,
    String url,
    String token,
    String payload,
  ) async {
    try {
      final request = await client.postUrl(Uri.parse(url));
      request.headers.contentType = ContentType.json;
      request.headers.set(HttpHeaders.authorizationHeader, 'Bearer $token');
      request.add(utf8.encode(payload));
      final response = await request.close();
      return response.statusCode < 400;
    } catch (_) {
      return false;
    }
  }
}
