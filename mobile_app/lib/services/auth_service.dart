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
    final payload = await _postJson('/api/auth/login', {
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
    final payload = await _postJson('/api/auth/register', {
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

      print('=== API REQUEST DEBUG ===');
      print('URL: $_baseUrl$path');
      print('Body: $body');
      
      final response = await request.close();
      final raw = await response.transform(utf8.decoder).join();
      
      print('=== API RESPONSE DEBUG ===');
      print('Status: ${response.statusCode}');
      print('Raw Response: $raw');
      
      final decoded = raw.isEmpty
          ? <String, dynamic>{}
          : jsonDecode(raw) as Map<String, dynamic>;

      if (response.statusCode >= 400) {
        final message =
            decoded['message']?.toString() ?? 'Authentication failed';
        throw HttpException(message);
      }

      // Normalize token keys if backend returns accessToken/token
      if (!decoded.containsKey('access_token')) {
        final altToken = decoded['accessToken'] ?? decoded['token'];
        if (altToken != null && altToken.toString().isNotEmpty) {
          decoded['access_token'] = altToken.toString();
        }
      }

      // Extract access_token from Set-Cookie header if not in JSON body
      if (!decoded.containsKey('access_token')) {
        final cookies = response.headers['set-cookie'];
        if (cookies != null) {
          for (final cookie in cookies) {
            if (cookie.contains('access_token=')) {
              final match = RegExp(r'access_token=([^;]+)').firstMatch(cookie);
              if (match != null) {
                decoded['access_token'] = match.group(1);
                break;
              }
            }
          }
        }
      }

      return decoded;
    } catch (e) {
      print('=== API EXCEPTION ===');
      print(e.toString());
      rethrow;
    } finally {
      client.close(force: true);
    }
  }
}
