import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'settings_service.dart';
import 'tflite_service.dart';

class OfflineOtaService {
  static final OfflineOtaService _instance = OfflineOtaService._internal();
  factory OfflineOtaService() => _instance;
  OfflineOtaService._internal();

  bool _isDownloading = false;
  bool get isDownloading => _isDownloading;

  Future<void> checkForUpdates() async {
    if (_isDownloading) return;

    try {
      final token = SettingsService().authToken;
      if (token.isEmpty) {
        debugPrint('[OTA] No auth token, cannot check for updates.');
        return;
      }

      final baseUrl = const String.fromEnvironment(
        'BACKEND_URL',
        defaultValue: 'http://10.0.2.2:3000',
      );

      final url = Uri.parse('$baseUrl/ai/ota-model');
      final response = await http.get(
        url,
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final latestVersion = data['version'] as String;
        final downloadUrl = data['downloadUrl'] as String;

        final prefs = await SharedPreferences.getInstance();
        final localVersion = prefs.getString('local_model_version') ?? '';

        if (latestVersion != localVersion) {
          debugPrint(
            '[OTA] New model version found: $latestVersion (Local: $localVersion)',
          );
          await _downloadAndApplyModel(downloadUrl, latestVersion, prefs);
        } else {
          debugPrint('[OTA] Model is up to date: $latestVersion');
        }
      } else {
        debugPrint('[OTA] Failed to check for updates: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('[OTA] Error checking for updates: $e');
    }
  }

  Future<void> _downloadAndApplyModel(
    String downloadUrl,
    String newVersion,
    SharedPreferences prefs,
  ) async {
    _isDownloading = true;
    try {
      debugPrint('[OTA] Downloading model from $downloadUrl...');

      // Normally we would download from `downloadUrl`, but since it's a dummy URL,
      // we'll just simulate a download or use a placeholder if the URL is dummy.
      // For a real implementation, we use HTTP GET.

      final response = await http.get(Uri.parse(downloadUrl));

      if (response.statusCode == 200) {
        final bytes = response.bodyBytes;

        final supportDir = await getApplicationSupportDirectory();
        final modelDir = Directory(
          '${supportDir.path}${Platform.pathSeparator}models',
        );
        if (!await modelDir.exists()) {
          await modelDir.create(recursive: true);
        }

        final file = File(
          '${modelDir.path}${Platform.pathSeparator}model.tflite',
        );
        await file.writeAsBytes(bytes);

        debugPrint('[OTA] Model downloaded and saved to ${file.path}');

        // Update version
        await prefs.setString('local_model_version', newVersion);

        // Reload TFLite Model
        TfliteService().dispose();
        await TfliteService().loadModel();

        debugPrint('[OTA] Successfully applied new model $newVersion');
      } else {
        debugPrint('[OTA] Failed to download model: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('[OTA] Error downloading model: $e');
    } finally {
      _isDownloading = false;
    }
  }
}
