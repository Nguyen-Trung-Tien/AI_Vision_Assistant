import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:mobile_app/theme/app_theme.dart';
import 'package:mobile_app/screens/main_screen.dart';
import 'package:mobile_app/screens/login_screen.dart';
import 'package:mobile_app/screens/onboarding_screen.dart';
import 'package:mobile_app/screens/splash_screen.dart';
import 'package:mobile_app/services/settings_service.dart';
import 'package:mobile_app/services/history_service.dart';

List<CameraDescription> cameras = [];

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize services that need async setup
  await SettingsService().init();
  await HistoryService().init();

  try {
    cameras = await availableCameras();
  } on CameraException catch (e) {
    debugPrint('Error in fetching the cameras: $e');
  }
  runApp(const VisionAssistantApp());
}

class VisionAssistantApp extends StatelessWidget {
  const VisionAssistantApp({super.key});

  @override
  Widget build(BuildContext context) {
    final settings = SettingsService();
    final appEntry = settings.isLoggedIn
        ? MainScreen(cameras: cameras)
        : LoginScreen(cameras: cameras);

    return MaterialApp(
      title: 'AI Vision Assistant',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      home: SplashScreen(
        nextScreen: settings.isFirstLaunch
            ? OnboardingScreen(nextScreen: appEntry)
            : appEntry,
      ),
    );
  }
}
