class EmergencyContact {
  final String? id;
  final String name;
  final String phone;
  final String relationship;
  final bool isPrimary;
  final bool notifySms;
  final bool notifyCall;

  EmergencyContact({
    this.id,
    required this.name,
    required this.phone,
    this.relationship = '',
    this.isPrimary = false,
    this.notifySms = true,
    this.notifyCall = false,
  });

  factory EmergencyContact.fromJson(Map<String, dynamic> json) {
    return EmergencyContact(
      id: json['id'],
      name: json['name'] ?? '',
      phone: json['phone'] ?? '',
      relationship: json['relationship'] ?? '',
      isPrimary: json['is_primary'] ?? false,
      notifySms: json['notify_sms'] ?? true,
      notifyCall: json['notify_call'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'phone': phone,
      'relationship': relationship,
      'is_primary': isPrimary,
      'notify_sms': notifySms,
      'notify_call': notifyCall,
    };
  }
}
