import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../models/emergency_contact.dart';
import 'settings_service.dart';

class EmergencyContactService {
  static const String baseUrl = String.fromEnvironment(
    'BACKEND_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );
  final SettingsService _settingsService = SettingsService();

  Future<Map<String, String>> _getHeaders() async {
    final token = _settingsService.authToken;
    if (token.isEmpty) {
      debugPrint('[EmergencyContactService] Missing auth token');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  Future<List<EmergencyContact>> getContacts() async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/api/emergency-contacts'),
        headers: headers,
      );
      debugPrint(
        '[EmergencyContactService] GET contacts status=${response.statusCode} body=${response.body}',
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => EmergencyContact.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error getting emergency contacts: $e');
      return [];
    }
  }

  Future<EmergencyContact?> addContact(EmergencyContact contact) async {
    try {
      final headers = await _getHeaders();
      final response = await http.post(
        Uri.parse('$baseUrl/api/emergency-contacts'),
        headers: headers,
        body: jsonEncode(contact.toJson()),
      );
      debugPrint(
        '[EmergencyContactService] POST add status=${response.statusCode} body=${response.body}',
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        return EmergencyContact.fromJson(jsonDecode(response.body));
      }
      return null;
    } catch (e) {
      debugPrint('Error adding emergency contact: $e');
      return null;
    }
  }

  Future<bool> updateContact(EmergencyContact contact) async {
    if (contact.id == null) return false;
    
    try {
      final headers = await _getHeaders();
      final response = await http.put(
        Uri.parse('$baseUrl/api/emergency-contacts/${contact.id}'),
        headers: headers,
        body: jsonEncode(contact.toJson()),
      );
      debugPrint(
        '[EmergencyContactService] PUT update status=${response.statusCode} body=${response.body}',
      );
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error updating emergency contact: $e');
      return false;
    }
  }

  Future<bool> deleteContact(String id) async {
    try {
      final headers = await _getHeaders();
      final response = await http.delete(
        Uri.parse('$baseUrl/api/emergency-contacts/$id'),
        headers: headers,
      );
      debugPrint(
        '[EmergencyContactService] DELETE status=${response.statusCode} body=${response.body}',
      );
      return response.statusCode == 200 || response.statusCode == 204;
    } catch (e) {
      debugPrint('Error deleting emergency contact: $e');
      return false;
    }
  }
}
