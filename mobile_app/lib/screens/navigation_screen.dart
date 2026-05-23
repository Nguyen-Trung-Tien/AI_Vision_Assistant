import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import 'package:mobile_app/l10n/app_localizations.dart';
import 'package:mobile_app/services/accessibility_manager.dart';
import 'package:mobile_app/services/navigation_service.dart';
import 'package:mobile_app/services/settings_service.dart';

class NavigationScreen extends StatefulWidget {
  const NavigationScreen({super.key});

  @override
  State<NavigationScreen> createState() => _NavigationScreenState();
}

class _NavigationScreenState extends State<NavigationScreen> {
  final NavigationService _navService = NavigationService();
  final AccessibilityManager _accessibilityManager = AccessibilityManager();
  final SettingsService _settings = SettingsService();

  bool _isNavigating = false;
  String _currentInstruction = "";
  List<dynamic> _steps = [];
  int _currentStepIndex = 0;

  Position? _currentPosition;
  StreamSubscription<Position>? _positionSub;

  final MapController _mapController = MapController();
  LatLng? _destination;
  LatLng? _pendingCenter;
  bool _mapReady = false;
  final TextEditingController _addressController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _currentInstruction =
        AppLocalizations.t('nav_mic_instruction', _settings.language);
    _initLocation();
  }

  Future<void> _initLocation() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      _accessibilityManager
          .speak(AppLocalizations.t('nav_gps_disabled', _settings.language));
      return;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        _accessibilityManager.speak(
            AppLocalizations.t('nav_permission_denied', _settings.language));
        return;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      _accessibilityManager.speak(
          AppLocalizations.t('nav_permission_forever', _settings.language));
      return;
    }

    _positionSub = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.best,
        distanceFilter: 5,
      ),
    ).listen((Position position) {
      if (!mounted) return;
      setState(() {
        _currentPosition = position;
      });
      if (_pendingCenter == null) {
        _moveCamera(LatLng(position.latitude, position.longitude));
      }
      if (_isNavigating &&
          _steps.isNotEmpty &&
          _currentStepIndex < _steps.length) {
        _checkWaypointDistance(position);
      }
    });

    _currentPosition = await Geolocator.getCurrentPosition();
    setState(() {});
    if (_currentPosition != null) {
      _moveCamera(
        LatLng(_currentPosition!.latitude, _currentPosition!.longitude),
      );
    }
  }

  Future<void> _startVoiceSearch() async {
    final lang = _settings.language;
    if (_currentPosition == null) {
      _accessibilityManager.speak(
        AppLocalizations.t('nav_locating', lang),
      );
      return;
    }

    setState(() {
      _currentInstruction = AppLocalizations.t('nav_listening', lang);
    });

    final destination = await _navService.listenForDestination();
    if (destination != null) {
      await _searchByText(destination);
    } else {
      setState(() {
        _currentInstruction = AppLocalizations.t('nav_mic_instruction', lang);
      });
    }
  }

  void _updateMap(dynamic route) {
    if (_currentPosition == null) return;

    final leg = route['legs'][0];
    final endLoc = leg['end_location'];

    setState(() {
      _destination = LatLng(endLoc['lat'], endLoc['lng']);
    });

    _moveCamera(
      LatLng(_currentPosition!.latitude, _currentPosition!.longitude),
    );
  }

  Future<void> _moveCamera(LatLng pos) async {
    _pendingCenter = pos;
    if (_mapReady) {
      _mapController.move(pos, 16);
    }
  }

  void _checkWaypointDistance(Position position) {
    if (_currentStepIndex >= _steps.length) {
      _finishNavigation();
      return;
    }

    final step = _steps[_currentStepIndex];
    final endLat = step['end_location']['lat'];
    final endLng = step['end_location']['lng'];

    final distanceToWaypoint = Geolocator.distanceBetween(
      position.latitude,
      position.longitude,
      endLat,
      endLng,
    );

    // If within 15 meters of the turn, speak the NEXT step
    if (distanceToWaypoint < 15.0) {
      _currentStepIndex++;
      if (_currentStepIndex < _steps.length) {
        final nextStepText = _navService.stripHtmlTags(
          _steps[_currentStepIndex]['html_instructions'],
        );
        setState(() {
          _currentInstruction = nextStepText;
        });
        _accessibilityManager.speak(
            (_settings.language == 'vi' ? "Sắp tới, " : "Coming up, ") +
                nextStepText);
      } else {
        _finishNavigation();
      }
    }
  }

  void _finishNavigation() {
    setState(() {
      _isNavigating = false;
      _currentInstruction =
          AppLocalizations.t('nav_arrived', _settings.language);
      _steps.clear();
    });
    _accessibilityManager.speak(
        _settings.language == 'vi' ? "Bạn đã đến nơi." : "You have arrived.");
  }

  void _stopNavigationManually() {
    setState(() {
      _isNavigating = false;
      _currentInstruction =
          AppLocalizations.t('nav_mic_instruction', _settings.language);
      _steps.clear();
      _destination = null;
    });
    _accessibilityManager.speak(_settings.language == 'vi'
        ? "Đã dừng điều hướng."
        : "Navigation stopped.");
  }

  Future<void> _searchByText(String destination) async {
    final lang = _settings.language;
    if (_currentPosition == null) {
      _accessibilityManager.speak(
        AppLocalizations.t('nav_locating', lang),
      );
      return;
    }

    setState(() {
      _currentInstruction = AppLocalizations.t('nav_searching', lang)
          .replaceAll('{dest}', destination);
    });

    final directions = await _navService.getDirections(
      destination,
      _currentPosition!.latitude,
      _currentPosition!.longitude,
    );
    if (directions != null && directions['routes'].isNotEmpty) {
      final route = directions['routes'][0];
      final leg = route['legs'][0];

      setState(() {
        _steps = leg['steps'];
        _currentStepIndex = 0;
        _isNavigating = true;
        _currentInstruction = _navService.stripHtmlTags(
          _steps[0]['html_instructions'],
        );
        _updateMap(route);
      });

      _accessibilityManager.speak(
        AppLocalizations.t('nav_route_found', lang) + _currentInstruction,
      );
    } else {
      setState(() {
        _currentInstruction = AppLocalizations.t('nav_route_not_found', lang);
      });
    }
  }

  @override
  void dispose() {
    _addressController.dispose();
    _positionSub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final lang = _settings.language;
    final colorScheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
        title: Text(AppLocalizations.t('mode_3', lang)),
        actions: [
          if (_isNavigating)
            IconButton(
              icon: const Icon(Icons.stop, color: Colors.red),
              onPressed: _stopNavigationManually,
              tooltip: lang == 'vi' ? 'Dừng' : 'Stop',
            ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              _buildStatusRow(colorScheme),
              const SizedBox(height: 12),
              _buildInstructionCard(colorScheme),
              const SizedBox(height: 12),
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: Stack(
                    children: [
                      Positioned.fill(
                        child: _currentPosition == null
                            ? const Center(child: CircularProgressIndicator())
                            : FlutterMap(
                                mapController: _mapController,
                                options: MapOptions(
                                  initialCenter: LatLng(
                                    _currentPosition!.latitude,
                                    _currentPosition!.longitude,
                                  ),
                                  initialZoom: 15,
                                  onMapReady: () {
                                    _mapReady = true;
                                    if (_pendingCenter != null) {
                                      _mapController.move(_pendingCenter!, 16);
                                    }
                                  },
                                ),
                                children: [
                                  TileLayer(
                                    urlTemplate:
                                        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                                    userAgentPackageName: 'mobile_app',
                                  ),
                                  MarkerLayer(
                                    markers: _buildMapMarkers(colorScheme),
                                  ),
                                  RichAttributionWidget(
                                    attributions: [
                                      TextSourceAttribution(
                                        '© OpenStreetMap contributors',
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                      ),
                      Positioned(
                        right: 12,
                        bottom: 12,
                        child: _buildQuickAction(colorScheme),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              _buildAddressInput(colorScheme),
              const SizedBox(height: 12),
              _buildMicButton(colorScheme),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusRow(ColorScheme colorScheme) {
    final lang = _settings.language;
    final statusText = _isNavigating
        ? AppLocalizations.t('nav_status_navigating', lang)
        : AppLocalizations.t('nav_status_not_navigating', lang);
    final statusColor = _isNavigating ? Colors.green : colorScheme.outline;
    return Row(
      children: [
        Icon(Icons.navigation, color: statusColor),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            statusText,
            style: TextStyle(fontWeight: FontWeight.w600, color: statusColor),
            overflow: TextOverflow.ellipsis,
          ),
        ),
        if (_currentPosition != null) ...[
          const SizedBox(width: 8),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.gps_fixed, size: 18, color: colorScheme.primary),
              const SizedBox(width: 6),
              Text(
                AppLocalizations.t('nav_gps_stable', lang),
                style: TextStyle(color: colorScheme.primary, fontSize: 12),
              ),
            ],
          ),
        ],
      ],
    );
  }

  Widget _buildInstructionCard(ColorScheme colorScheme) {
    return Container(
      width: double.infinity,
      constraints: const BoxConstraints(minHeight: 80, maxHeight: 120),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
        border: Border.all(color: colorScheme.outlineVariant),
      ),
      child: Center(
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 250),
          child: SingleChildScrollView(
            child: Text(
              _currentInstruction,
              key: ValueKey(_currentInstruction),
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildQuickAction(ColorScheme colorScheme) {
    return Material(
      color: colorScheme.surface,
      borderRadius: BorderRadius.circular(12),
      elevation: 6,
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: _isNavigating ? _stopNavigationManually : null,
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Icon(
            _isNavigating ? Icons.stop : Icons.flag,
            color: _isNavigating ? Colors.red : colorScheme.primary,
          ),
        ),
      ),
    );
  }

  Widget _buildAddressInput(ColorScheme colorScheme) {
    final lang = _settings.language;
    return Row(
      children: [
        Expanded(
          child: TextField(
            controller: _addressController,
            enabled: !_isNavigating,
            style: const TextStyle(fontSize: 18),
            decoration: InputDecoration(
              hintText: AppLocalizations.t('nav_address_hint', lang),
              hintStyle: const TextStyle(fontSize: 16),
              prefixIcon: const Icon(Icons.location_on, size: 24),
              suffixIcon: IconButton(
                icon: const Icon(Icons.clear, size: 24),
                onPressed: () {
                  _addressController.clear();
                  _accessibilityManager.speak(
                    lang == 'vi' ? 'Đã xóa' : 'Cleared',
                  );
                },
                tooltip: lang == 'vi' ? 'Xóa nội dung' : 'Clear text',
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide(
                  color: colorScheme.primary,
                  width: 2,
                ),
              ),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 14,
              ),
            ),
            textInputAction: TextInputAction.search,
            onSubmitted: (value) {
              if (value.trim().isNotEmpty) {
                _searchByText(value.trim());
              } else {
                _accessibilityManager.speak(
                  AppLocalizations.t('nav_address_empty', lang),
                );
              }
            },
          ),
        ),
        const SizedBox(width: 10),
        SizedBox(
          height: 52,
          width: 52,
          child: ElevatedButton(
            onPressed: _isNavigating
                ? null
                : () {
                    final text = _addressController.text.trim();
                    if (text.isNotEmpty) {
                      _searchByText(text);
                    } else {
                      _accessibilityManager.speak(
                        AppLocalizations.t('nav_address_empty', lang),
                      );
                    }
                  },
            style: ElevatedButton.styleFrom(
              backgroundColor: colorScheme.primary,
              foregroundColor: colorScheme.onPrimary,
              padding: EdgeInsets.zero,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
            child: Tooltip(
              message: AppLocalizations.t('nav_search_route', lang),
              child: const Icon(Icons.search, size: 28),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMicButton(ColorScheme colorScheme) {
    final lang = _settings.language;
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: _isNavigating ? null : _startVoiceSearch,
        style: ElevatedButton.styleFrom(
          backgroundColor: _isNavigating
              ? colorScheme.surfaceContainerHighest
              : colorScheme.primary,
          foregroundColor:
              _isNavigating ? colorScheme.onSurfaceVariant : Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          elevation: _isNavigating ? 0 : 4,
        ),
        icon: const Icon(Icons.mic, size: 28),
        label: Text(
          _isNavigating
              ? AppLocalizations.t('nav_status_navigating', lang)
              : AppLocalizations.t('nav_speak_destination', lang),
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
        ),
      ),
    );
  }

  List<Marker> _buildMapMarkers(ColorScheme colorScheme) {
    final markers = <Marker>[];
    if (_currentPosition != null) {
      markers.add(
        Marker(
          point: LatLng(
            _currentPosition!.latitude,
            _currentPosition!.longitude,
          ),
          width: 36,
          height: 36,
          child: Icon(Icons.my_location, color: colorScheme.primary, size: 30),
        ),
      );
    }
    if (_destination != null) {
      markers.add(
        Marker(
          point: _destination!,
          width: 40,
          height: 40,
          child: const Icon(Icons.flag, color: Colors.red, size: 32),
        ),
      );
    }
    return markers;
  }
}
