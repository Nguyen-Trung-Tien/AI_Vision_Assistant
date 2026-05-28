import 'package:flutter/material.dart';
import 'package:flutter_contacts/flutter_contacts.dart';
import '../l10n/app_localizations.dart';
import '../models/emergency_contact.dart';
import '../services/accessibility_manager.dart';
import '../services/emergency_contact_service.dart';
import '../services/settings_service.dart';
import '../theme/app_theme.dart';

class EmergencyContactsScreen extends StatefulWidget {
  const EmergencyContactsScreen({super.key});

  @override
  State<EmergencyContactsScreen> createState() =>
      _EmergencyContactsScreenState();
}

class _EmergencyContactsScreenState extends State<EmergencyContactsScreen> {
  final AccessibilityManager _accessibility = AccessibilityManager();
  final SettingsService _settings = SettingsService();
  late EmergencyContactService _contactService;

  final TextEditingController _manualNameController = TextEditingController();
  final TextEditingController _manualPhoneController = TextEditingController();

  List<EmergencyContact> _contacts = [];
  bool _isLoading = true;

  String get _lang => _settings.language;

  @override
  void initState() {
    super.initState();
    _contactService = EmergencyContactService();
    _loadContacts();
    _accessibility.speak(AppLocalizations.t('emergency_screen_spoken', _lang));
  }

  @override
  void dispose() {
    _manualNameController.dispose();
    _manualPhoneController.dispose();
    super.dispose();
  }

  Future<void> _loadContacts() async {
    setState(() => _isLoading = true);
    final contacts = await _contactService.getContacts();
    
    // Sync to local settings
    final phoneNumbers = contacts.where((c) => c.notifySms).map((c) => c.phone).toList();
    await _settings.setEmergencyNumbers(phoneNumbers);

    if (!mounted) return;
    setState(() {
      _contacts = contacts;
      _isLoading = false;
    });
  }

  void _upsertLocalContact(EmergencyContact contact) {
    final indexById = contact.id == null
        ? -1
        : _contacts.indexWhere((c) => c.id == contact.id);
    final indexByPhone = _contacts.indexWhere((c) => c.phone == contact.phone);
    final index = indexById >= 0 ? indexById : indexByPhone;

    setState(() {
      if (index >= 0) {
        _contacts[index] = contact;
      } else {
        _contacts.insert(0, contact);
      }
      _isLoading = false;
    });
  }

  Future<void> _syncContactsSilently() async {
    final contacts = await _contactService.getContacts();
    
    // Sync to local settings
    final phoneNumbers = contacts.where((c) => c.notifySms).map((c) => c.phone).toList();
    await _settings.setEmergencyNumbers(phoneNumbers);

    if (!mounted) return;
    setState(() {
      _contacts = contacts;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgPrimary,
      appBar: AppBar(
        backgroundColor: AppTheme.bgCard,
        title: Text(
          AppLocalizations.t('emergency_screen_title', _lang),
          style: AppTheme.titleLarge,
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
          onPressed: () {
            _accessibility.speak(AppLocalizations.t('back', _lang));
            Navigator.pop(context);
          },
        ),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppTheme.accentPurple),
            )
          : ListView(
              padding: const EdgeInsets.all(20),
              children: [
                if (_contacts.isEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 20),
                    child: Text(
                      AppLocalizations.t('emergency_no_contacts', _lang),
                      style: const TextStyle(color: Colors.white54, fontSize: 16),
                      textAlign: TextAlign.center,
                    ),
                  )
                else
                  ..._contacts.map(_buildContactCard),
                const SizedBox(height: 20),
                ElevatedButton.icon(
                  onPressed: _pickContact,
                  icon: const Icon(Icons.contacts, color: Colors.white),
                  label: Text(
                    AppLocalizations.t('emergency_add_from_contacts', _lang),
                    style: const TextStyle(color: Colors.white, fontSize: 16),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.accentPurple,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: _showManualAddDialog,
                  icon: const Icon(Icons.dialpad_rounded),
                  label: Text(
                    AppLocalizations.t('emergency_add_manual', _lang),
                  ),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.accentCyan,
                    side: BorderSide(
                      color: AppTheme.accentCyan.withValues(alpha: 0.6),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildContactCard(EmergencyContact contact) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.whiteAlpha(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  contact.name.isEmpty ? contact.phone : contact.name,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              IconButton(
                icon: const Icon(
                  Icons.delete_outline,
                  color: AppTheme.accentRed,
                ),
                onPressed: () => _deleteContact(contact),
                tooltip: AppLocalizations.t('emergency_delete_tooltip', _lang),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            contact.phone,
            style: const TextStyle(color: Colors.white70, fontSize: 16),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  AppLocalizations.t('emergency_sms_on_sos', _lang),
                  style: const TextStyle(color: Colors.white),
                ),
              ),
              Switch(
                value: contact.notifySms,
                activeThumbColor: AppTheme.accentCyan,
                onChanged: (val) {
                  _updateContact(
                    EmergencyContact(
                      id: contact.id,
                      name: contact.name,
                      phone: contact.phone,
                      notifySms: val,
                    ),
                  );
                },
              ),
            ],
          ),
        ],
      ),
    );
  }

  Future<void> _showManualAddDialog() async {
    _manualNameController.clear();
    _manualPhoneController.clear();

    await showDialog<void>(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: AppTheme.bgCard,
          title: Text(
            AppLocalizations.t('emergency_dialog_title', _lang),
            style: const TextStyle(color: Colors.white),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: _manualNameController,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: AppLocalizations.t('emergency_field_name', _lang),
                  labelStyle: const TextStyle(color: Colors.white70),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _manualPhoneController,
                keyboardType: TextInputType.phone,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: AppLocalizations.t('emergency_field_phone', _lang),
                  labelStyle: const TextStyle(color: Colors.white70),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(AppLocalizations.t('emergency_btn_cancel', _lang)),
            ),
            ElevatedButton(
              onPressed: () async {
                final name = _manualNameController.text.trim();
                final rawPhone = _manualPhoneController.text.trim();
                final phone = rawPhone.replaceAll(RegExp(r'[^0-9+]'), '');
                if (phone.isEmpty) {
                  _accessibility.speak(
                    AppLocalizations.t('emergency_invalid_phone', _lang),
                  );
                  return;
                }
                Navigator.pop(context);
                await _addManualContact(name: name, phone: phone);
              },
              child: Text(AppLocalizations.t('emergency_btn_add', _lang)),
            ),
          ],
        );
      },
    );
  }

  Future<void> _addManualContact({
    required String name,
    required String phone,
  }) async {
    setState(() => _isLoading = true);
    final normalizedName = name.trim().isEmpty ? phone : name.trim();
    final newContact = EmergencyContact(
      name: normalizedName,
      phone: phone,
      notifySms: true,
    );

    final added = await _contactService.addContact(newContact);

    if (added != null) {
      _accessibility.speak(
        AppLocalizations.t('emergency_saved_success', _lang),
      );
      _upsertLocalContact(added);

      final currentNumbers = _settings.emergencyNumbers;
      if (!currentNumbers.contains(phone)) {
        currentNumbers.add(phone);
        await _settings.setEmergencyNumbers(currentNumbers);
      }

      await _syncContactsSilently();
      return;
    }

    _accessibility.speak(AppLocalizations.t('emergency_add_error', _lang));
    if (mounted) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _pickContact() async {
    final status = await FlutterContacts.permissions.request(PermissionType.read);
    if (status == PermissionStatus.granted) {
      final contact = await FlutterContacts.native.showPicker();
      if (contact != null && contact.phones.isNotEmpty) {
        final num = contact.phones.first.number.replaceAll(
          RegExp(r'[^0-9+]'),
          '',
        );
        final displayName = contact.displayName ?? '';
        final name = displayName.trim().isEmpty
            ? num
            : displayName.trim();

        setState(() => _isLoading = true);
        final added = await _contactService.addContact(
          EmergencyContact(name: name, phone: num, notifySms: true),
        );

        if (added != null) {
          _accessibility.speak(
            AppLocalizations.t('emergency_saved_success', _lang),
          );
          _upsertLocalContact(added);

          final currentNumbers = _settings.emergencyNumbers;
          if (!currentNumbers.contains(num)) {
            currentNumbers.add(num);
            await _settings.setEmergencyNumbers(currentNumbers);
          }

          await _syncContactsSilently();
          return;
        }

        _accessibility.speak(
          AppLocalizations.t('emergency_add_error', _lang),
        );
        if (mounted) {
          setState(() => _isLoading = false);
        }
      }
    } else {
      _accessibility.speak(
        AppLocalizations.t('emergency_contact_permission', _lang),
      );
    }
  }

  Future<void> _deleteContact(EmergencyContact contact) async {
    if (contact.id == null) return;
    setState(() => _isLoading = true);

    final success = await _contactService.deleteContact(contact.id!);
    if (success) {
      _accessibility.speak(
        '${AppLocalizations.t('emergency_deleted', _lang)} ${contact.name}',
      );
      final currentNumbers = _settings.emergencyNumbers;
      currentNumbers.remove(contact.phone);
      await _settings.setEmergencyNumbers(currentNumbers);
    } else {
      _accessibility.speak(
        AppLocalizations.t('emergency_delete_error', _lang),
      );
    }

    await _loadContacts();
  }

  Future<void> _updateContact(EmergencyContact contact) async {
    setState(() => _isLoading = true);
    await _contactService.updateContact(contact);
    _accessibility.speak(
      AppLocalizations.t('emergency_updated_success', _lang),
    );
    await _loadContacts();
  }
}
