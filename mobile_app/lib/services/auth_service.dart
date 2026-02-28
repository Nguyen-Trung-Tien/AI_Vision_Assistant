import 'dart:convert';
import 'dart:io';

class AuthResponse {
  final String accessToken;
  final String email;

  AuthResponse({required this.accessToken, required this.email});
}

class AuthService {
  final String _baseUrl = const String.fromEnvironment(
    'BACKEND_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );

  Future<AuthResponse> login({
    required String email,
    required String password,
  }) async {
    final payload = await _postJson('/auth/login', {
      'email': email,
      'password': password,
    });

    final token = payload['access_token']?.toString() ?? '';
    final userEmail = payload['user']?['email']?.toString() ?? email;
    if (token.isEmpty) {
      throw const FormatException('Login response missing access token');
    }

    return AuthResponse(accessToken: token, email: userEmail);
  }

  Future<AuthResponse> register({
    required String email,
    required String password,
  }) async {
    final payload = await _postJson('/auth/register', {
      'email': email,
      'password': password,
    });

    final token = payload['access_token']?.toString() ?? '';
    final userEmail = payload['user']?['email']?.toString() ?? email;
    if (token.isEmpty) {
      throw const FormatException('Register response missing access token');
    }

    return AuthResponse(accessToken: token, email: userEmail);
  }

  Future<Map<String, dynamic>> _postJson(
    String path,
    Map<String, dynamic> body,
  ) async {
    final client = HttpClient();
    try {
      final request = await client.postUrl(Uri.parse('$_baseUrl$path'));
      request.headers.contentType = ContentType.json;
      request.add(utf8.encode(jsonEncode(body)));

      final response = await request.close();
      final raw = await response.transform(utf8.decoder).join();
      final decoded = raw.isEmpty
          ? <String, dynamic>{}
          : jsonDecode(raw) as Map<String, dynamic>;

      if (response.statusCode >= 400) {
        final message =
            decoded['message']?.toString() ?? 'Authentication failed';
        throw HttpException(message);
      }

      return decoded;
    } finally {
      client.close(force: true);
    }
  }
}
