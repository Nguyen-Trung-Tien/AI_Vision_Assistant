import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/constants.dart';

class FaceService {
  static Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  static Future<Map<String, dynamic>> registerFace(String name, String base64Image) async {
    final token = await _getToken();
    final response = await http.post(
      Uri.parse('${Constants.apiBaseUrl}/api/face/register'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'name': name,
        'frameData': base64Image,
      }),
    );

    if (response.statusCode == 201 || response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to register face: ${response.body}');
    }
  }

  static Future<List<dynamic>> listFaces() async {
    final token = await _getToken();
    final response = await http.get(
      Uri.parse('${Constants.apiBaseUrl}/api/face/list'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to list faces');
    }
  }

  static Future<void> deleteFace(String id) async {
    final token = await _getToken();
    final response = await http.delete(
      Uri.parse('${Constants.apiBaseUrl}/api/face/$id'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to delete face');
    }
  }
}
