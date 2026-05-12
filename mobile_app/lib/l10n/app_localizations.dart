class AppLocalizations {
  static const List<String> modeLabelKeys = [
    'mode_0',
    'mode_1',
    'mode_2',
    'mode_3',
    'mode_4',
    'mode_5',
    'mode_6',
    'mode_7',
    'mode_8',
  ];

  static final Map<String, Map<String, String>> _localizedStrings = {
    // --- General / UI ---
    'app_name': {'vi': 'AI Vision Assistant', 'en': 'AI Vision Assistant'},
    'settings_title': {'vi': 'Cài đặt', 'en': 'Settings'},
    'back': {'vi': 'Quay lại', 'en': 'Back'},

    // --- Settings UI ---
    'settings_emergency': {
      'vi': '📞 Số điện thoại khẩn cấp',
      'en': '📞 Emergency Number',
    },
    'settings_emergency_hint': {
      'vi': 'Nhập số điện thoại...',
      'en': 'Enter phone number...',
    },
    'settings_emergency_saved': {
      'vi': 'Đã nhận số liên hệ khẩn cấp:',
      'en': 'Saved emergency contact:',
    },
    'settings_emergency_add_contact': {
      'vi': 'Chọn từ danh bạ',
      'en': 'Pick from Contacts',
    },
    'settings_emergency_add_manual': {
      'vi': 'Nhập thủ công',
      'en': 'Add Manually',
    },
    'settings_emergency_deleted': {
      'vi': 'Đã xóa số liên hệ:',
      'en': 'Deleted contact:',
    },
    'settings_emergency_empty': {
      'vi': 'Chưa có số điện thoại nào.',
      'en': 'No phone numbers added yet.',
    },
    'settings_emergency_max': {
      'vi': 'Bạn chỉ có thể thêm tối đa 5 số.',
      'en': 'You can only add up to 5 numbers.',
    },
    'settings_emergency_permission': {
      'vi': 'Vui lòng cấp quyền truy cập danh bạ.',
      'en': 'Please grant contact access permission.',
    },
    'settings_tts_speed': {'vi': 'Tốc độ giọng đọc', 'en': 'Voice Speed'},
    'settings_tts_speed_spoken': {'vi': 'Tốc độ đọc:', 'en': 'Voice speed:'},
    'settings_default_mode': {
      'vi': '🏠 Chế độ mặc định khi mở app',
      'en': '🏠 Default Startup Mode',
    },
    'settings_default_mode_spoken': {
      'vi': 'Chế độ mặc định:',
      'en': 'Default mode:',
    },
    'settings_language': {
      'vi': '🌐 Ngôn ngữ / Language',
      'en': '🌐 Language / Ngôn ngữ',
    },
    'settings_warning_dist': {
      'vi': '⚠️ Khoảng cách cảnh báo:',
      'en': '⚠️ Warning Distance:',
    },
    'settings_warning_dist_spoken': {
      'vi': 'Khoảng cách cảnh báo:',
      'en': 'Warning distance:',
    },
    'settings_warning_dist_unit': {'vi': 'mét', 'en': 'meters'},
    'settings_logout': {'vi': 'Đăng xuất', 'en': 'Log Out'},
    'settings_logged_out': {'vi': 'Đã đăng xuất.', 'en': 'Logged out.'},
    'settings_screen_spoken': {
      'vi': 'Màn hình cài đặt.',
      'en': 'Settings screen.',
    },

    // --- Modes ---
    'mode_0': {'vi': 'Nhận diện tổng hợp', 'en': 'General Recognition'},
    'mode_0_spoken': {
      'vi': 'Chế độ nhận diện tổng hợp',
      'en': 'General recognition mode',
    },
    'mode_1': {'vi': 'Mô tả không gian', 'en': 'Scene Description'},
    'mode_1_spoken': {
      'vi': 'Chế độ mô tả không gian',
      'en': 'Scene description mode',
    },
    'mode_2': {'vi': 'Đi bộ (Thời gian thực)', 'en': 'Walking (Real-time)'},
    'mode_2_spoken': {
      'vi': 'Chế độ đi bộ thời gian thực',
      'en': 'Real-time walking mode',
    },
    'mode_3': {'vi': 'Chỉ hướng', 'en': 'Navigation'},
    'mode_3_spoken': {'vi': 'Chế độ chỉ hướng', 'en': 'Navigation mode'},
    'mode_4': {'vi': 'Đọc văn bản (Online)', 'en': 'Read Text (Online)'},
    'mode_4_spoken': {
      'vi': 'Chế độ đọc văn bản (Online)',
      'en': 'Online reading mode',
    },
    'mode_5': {'vi': 'Đọc chữ nhanh (Offline)', 'en': 'Quick Read (Offline)'},
    'mode_5_spoken': {
      'vi': 'Chế độ đọc chữ nhanh (Offline)',
      'en': 'Offline quick reading mode',
    },
    'mode_6': {'vi': 'Đọc tệp', 'en': 'Read File'},
    'mode_6_spoken': {
      'vi': 'Chế độ đọc tệp từ bộ nhớ',
      'en': 'Local file reading mode',
    },
    'mode_7': {'vi': 'Nhận diện người', 'en': 'Person Recognition'},
    'mode_7_spoken': {
      'vi': 'Chế độ nhận diện người quen',
      'en': 'Person recognition mode',
    },
    'mode_8': {'vi': 'Phân tích bố cục', 'en': 'Layout Analysis'},
    'mode_8_spoken': {
      'vi': 'Chế độ phân tích bố cục menu và sách',
      'en': 'Menu and book layout analysis mode',
    },

    // --- Main Screen UI ---
    'main_offline': {'vi': 'Offline', 'en': 'Offline'},
    'main_online': {'vi': 'Online', 'en': 'Online'},
    'main_night': {'vi': 'NIGHT', 'en': 'NIGHT'},
    'main_flash': {'vi': 'FLASH', 'en': 'FLASH'},
    'main_scanning': {'vi': 'Đang quét...', 'en': 'Scanning...'},
    'main_processing': {'vi': 'Đang xử lý...', 'en': 'Processing...'},
    'main_hint_double_tap': {'vi': 'Nhấn đúp', 'en': 'Double Tap'},
    'main_hint_hold': {'vi': 'Giữ để nói', 'en': 'Hold to Speak'},
    'main_hint_swipe': {'vi': 'Vuốt để đổi chế độ', 'en': 'Swipe to Change'},

    // --- Main Screen Spoken ---
    'main_unknown_command': {
      'vi': 'Không hiểu lệnh. Nói trợ giúp để nghe danh sách lệnh.',
      'en': 'Command not understood. Say help for a list of commands.',
    },
    'main_help_spoken': {
      'vi':
          'Các lệnh có sẵn: đọc văn bản, đọc chữ nhanh, mô tả không gian, định hướng, tổng hợp, cài đặt, lịch sử, đèn, khẩn cấp, trợ giúp.',
      'en':
          'Available commands: read text, quick read, scene description, navigation, general, settings, history, flash, emergency, help.',
    },
    'main_camera_not_ready': {
      'vi': 'Camera chưa sẵn sàng.',
      'en': 'Camera not ready.',
    },
    'main_flash_on': {'vi': 'Đã bật đèn flash', 'en': 'Flash turned on'},
    'main_flash_off': {'vi': 'Đã tắt đèn flash', 'en': 'Flash turned off'},
    'main_flash_error': {
      'vi': 'Không thể điều khiển đèn flash.',
      'en': 'Cannot control the flash.',
    },
    'main_open_settings': {'vi': 'Mở cài đặt', 'en': 'Opening settings'},
    'main_open_history': {'vi': 'Mở lịch sử', 'en': 'Opening history'},
    'main_navigating': {'vi': 'Đang định vị...', 'en': 'Navigating...'},
    'main_detecting_offline': {
      'vi': 'Đang nhận diện offline...',
      'en': 'Detecting offline...',
    },
    'main_no_capture': {
      'vi': 'Không chụp được ảnh.',
      'en': 'Failed to capture image.',
    },
    'main_no_offline_model': {
      'vi': 'Chưa có model offline. Vui lòng kết nối mạng để nhận diện.',
      'en':
          'Offline model not available. Please connect to the internet to use this feature.',
    },
    'main_offline_error': {
      'vi': 'Lỗi nhận diện offline.',
      'en': 'Offline detection error.',
    },
    'main_reading_file': {
      'vi': 'Đang đọc nội dung tệp...',
      'en': 'Reading file content...',
    },
    'main_file_empty': {
      'vi': 'Không tìm thấy văn bản nào trong tệp.',
      'en': 'No text found in the file.',
    },
    'main_file_error': {
      'vi': 'Có lỗi xảy ra khi mở tệp.',
      'en': 'An error occurred while opening the file.',
    },
    'main_file_unsupported': {
      'vi': 'Định dạng tệp chưa được hỗ trợ.',
      'en': 'File format not supported.',
    },

    // --- Edge AI AI Service ---
    'ai_detecting': {'vi': 'Đang nhận diện...', 'en': 'Detecting...'},
    'ai_describing': {'vi': 'Đang mô tả...', 'en': 'Describing...'},
    'ai_online_reading': {
      'vi': 'Đang gửi lên server để đọc...',
      'en': 'Sending to server for reading...',
    },
    'ai_throttled': {
      'vi': 'Khung hình gửi quá nhanh, vui lòng thử lại.',
      'en': 'Frames sent too fast, please try again.',
    },
    'ai_timeout': {
      'vi': 'Hết thời gian chờ phản hồi.',
      'en': 'Response timeout.',
    },
    'ai_face_no_match': {
      'vi': 'Không nhận diện được người quen nào.',
      'en': 'No known people recognized.',
    },

    // --- Splash & Onboarding ---
    'onboarding_title_1': {'vi': 'Chào mừng bạn', 'en': 'Welcome'},
    'onboarding_desc_1': {
      'vi':
          'AI Vision Assistant giúp bạn nhận diện tiền, đọc văn bản, và mô tả không gian xung quanh bằng trí tuệ nhân tạo.',
      'en':
          'AI Vision Assistant helps you recognize money, read text, and describe your surroundings using AI.',
    },
    'onboarding_tts_1': {
      'vi':
          'Chào mừng bạn đến với ứng dụng Trợ lý thị giác. Ứng dụng giúp bạn nhận diện tiền, đọc văn bản, và mô tả không gian xung quanh.',
      'en':
          'Welcome to the AI Vision Assistant. We help you recognize money, read text, and describe your surroundings.',
    },
    'onboarding_title_2': {'vi': 'Cách sử dụng', 'en': 'How to Use'},
    'onboarding_desc_2': {
      'vi':
          'Vuốt trái/phải để đổi chế độ.\nChạm đúp để nhận diện.\nNhấn giữ để ra lệnh giọng nói.',
      'en':
          'Swipe left/right to change modes.\nDouble tap to recognize.\nHold to speak commands.',
    },
    'onboarding_tts_2': {
      'vi':
          'Vuốt trái hoặc phải để đổi chế độ. Chạm đúp vào màn hình để nhận diện. Nhấn giữ để ra lệnh bằng giọng nói.',
      'en':
          'Swipe left or right to switch modes. Double tap the screen to trigger detection. Hold the screen to give voice commands.',
    },
    'onboarding_title_3': {
      'vi': 'Tính năng khẩn cấp',
      'en': 'Emergency Feature',
    },
    'onboarding_desc_3': {
      'vi':
          'Nhấn phím giảm âm lượng 5 lần liên tiếp hoặc\nnói "Cứu tôi" để gọi SOS.',
      'en':
          'Press volume down 5 times consecutively or\nsay "Help me" to trigger SOS.',
    },
    'onboarding_tts_3': {
      'vi':
          'Trong trường hợp khẩn cấp, nhấn phím giảm âm lượng 5 lần liên tiếp, hoặc nói cứu tôi để kích hoạt cuộc gọi khẩn cấp.',
      'en':
          'In an emergency, press the volume down button 5 times consecutively, or say help me to trigger an emergency call.',
    },
    'onboarding_title_4': {'vi': 'Sẵn sàng!', 'en': 'Ready!'},
    'onboarding_desc_4': {
      'vi': 'Chạm đúp vào màn hình để bắt đầu sử dụng.',
      'en': 'Double tap the screen to start using the app.',
    },
    'onboarding_tts_4': {
      'vi':
          'Bạn đã sẵn sàng. Chạm đúp vào màn hình để bắt đầu sử dụng ứng dụng.',
      'en': 'You are ready. Double tap the screen to start using the app.',
    },
    'onboarding_skip': {'vi': 'Bỏ qua', 'en': 'Skip'},
    'onboarding_next': {'vi': 'Tiếp', 'en': 'Next'},
    'onboarding_start': {'vi': 'Bắt đầu', 'en': 'Start'},
    'onboarding_start_spoken': {'vi': 'Bắt đầu sử dụng', 'en': 'Starting app'},
    'splash_welcome_tts': {
      'vi':
          'Chào mừng bạn đến với AI Vision Assistant. Vuốt trái phải để chuyển chế độ. Chạm hai lần để kích hoạt. Nhấn giữ để ra lệnh giọng nói. Nhấn nút giảm âm lượng 5 lần liên tục để gọi khẩn cấp.',
      'en':
          'Welcome to AI Vision Assistant. Swipe left or right to change modes. Double tap to activate. Hold to speak commands. Press volume down 5 times to call emergency.',
    },
    'splash_ready_tts': {
      'vi': 'AI Vision Assistant đã sẵn sàng.',
      'en': 'AI Vision Assistant is ready.',
    },

    // --- History Screen ---
    'history_title': {'vi': 'Lịch sử nhận diện', 'en': 'Recognition History'},
    'history_empty_tts': {'vi': 'Lịch sử trống.', 'en': 'History is empty.'},
    'history_count_tts_1': {
      'vi': 'Lịch sử nhận diện. Có',
      'en': 'Recognition history. There are',
    },
    'history_count_tts_2': {
      'vi': 'kết quả. Chạm vào để nghe lại.',
      'en': 'results. Tap to hear again.',
    },
    'history_cleared': {
      'vi': 'Đã xóa toàn bộ lịch sử.',
      'en': 'Cleared all history.',
    },
    'history_no_results': {'vi': 'Chưa có kết quả nào', 'en': 'No results yet'},
    'history_type_money': {'vi': '💵 Tiền', 'en': '💵 Money'},
    'history_type_text': {'vi': '📝 Văn bản', 'en': '📝 Text'},
    'history_type_caption': {'vi': '🖼️ Mô tả', 'en': '🖼️ Caption'},
    'history_type_barcode': {'vi': '📊 Mã vạch', 'en': '📊 Barcode'},
    'history_type_default': {'vi': '🔍 Nhận diện', 'en': '🔍 Detection'},
    'history_time_just_now': {'vi': 'Vừa xong', 'en': 'Just now'},
    'history_time_mins': {'vi': 'phút trước', 'en': 'mins ago'},
    'history_time_hours': {'vi': 'giờ trước', 'en': 'hours ago'},
    'history_time_days': {'vi': 'ngày trước', 'en': 'days ago'},

    // --- Login Screen ---
    'login_tts_welcome': {
      'vi': 'Vui lòng nhập thông tin đăng nhập.',
      'en': 'Please enter your login information.',
    },
    'login_err_password_match': {
      'vi': 'Mật khẩu xác nhận không khớp',
      'en': 'Confirm password does not match',
    },
    'login_success_tts': {
      'vi': 'Đăng nhập thành công.',
      'en': 'Login successful.',
    },
    'login_fail_tts': {
      'vi': 'Đăng nhập không thành công.',
      'en': 'Login failed.',
    },
    'login_title_register': {
      'vi': 'Tạo tài khoản mới',
      'en': 'Create a new account',
    },
    'login_title_login': {'vi': 'Đăng nhập', 'en': 'Login'},
    'login_email': {'vi': 'Email', 'en': 'Email'},
    'login_email_err_empty': {'vi': 'Nhập email', 'en': 'Enter email'},
    'login_email_err_invalid': {
      'vi': 'Email không hợp lệ',
      'en': 'Invalid email',
    },
    'login_password': {'vi': 'Mật khẩu', 'en': 'Password'},
    'login_password_err_length': {
      'vi': 'Mật khẩu tối thiểu 6 ký tự',
      'en': 'Password must be at least 6 characters',
    },
    'login_confirm_password': {
      'vi': 'Xác nhận mật khẩu',
      'en': 'Confirm password',
    },
    'login_confirm_err_empty': {
      'vi': 'Nhập lại mật khẩu',
      'en': 'Re-enter password',
    },
    'login_btn_register': {'vi': 'Đăng ký', 'en': 'Register'},
    'login_btn_login': {'vi': 'Đăng nhập', 'en': 'Login'},
    'login_switch_to_login': {
      'vi': 'Đã có tài khoản? Đăng nhập',
      'en': 'Already have an account? Login',
    },
    'login_switch_to_register': {
      'vi': 'Chưa có tài khoản? Đăng ký',
      'en': 'Don\'t have an account? Register',
    },

    // --- SOS Screen ---
    'sos_no_numbers': {
      'vi': 'Bạn chưa lưu số điện thoại khẩn cấp nào.',
      'en': 'No emergency contact numbers saved.',
    },
    'sos_triggered': {
      'vi': 'Đã kích hoạt cảnh báo khẩn cấp. Đang lấy vị trí.',
      'en': 'Emergency alert activated. Getting location.',
    },
    'sos_message': {
      'vi': 'Khẩn cấp! Tôi đang cần giúp đỡ tại toạ độ: {link}',
      'en': 'Emergency! I need help at this location: {link}',
    },
    'sos_sending_sms': {
      'vi': 'Đang gửi tin nhắn vị trí.',
      'en': 'Sending location message.',
    },
    'sos_call_direct': {
      'vi': 'Không thể lấy được định vị. Sẽ gọi điện trực tiếp.',
      'en': 'Cannot get location. Calling directly.',
    },
    'sos_countdown': {
      'vi': 'Gửi SOS sau {seconds} giây. Nhấn nút nguồn để hủy.',
      'en':
          'SOS will be sent in {seconds} seconds. Press power button to cancel.',
    },
    'sos_cancelled': {'vi': 'Đã hủy gửi SOS.', 'en': 'SOS cancelled.'},
    // --- Settings auto-flash threshold ---
    'settings_light_threshold': {
      'vi': '💡 Ngưỡng ánh sáng tự động:',
      'en': '💡 Auto-flash Light Threshold:',
    },
    'settings_light_threshold_spoken': {
      'vi': 'Ngưỡng ánh sáng tự động:',
      'en': 'Auto-flash light threshold:',
    },
    'settings_light_low': {'vi': 'Nhạy cao', 'en': 'High sensitivity'},
    'settings_light_high': {'vi': 'Nhạy thấp', 'en': 'Low sensitivity'},
    // --- Navigation ---
    'nav_gps_disabled': {
      'vi': 'Vui lòng bật định vị GPS.',
      'en': 'Please enable GPS location.',
    },
    'nav_permission_denied': {
      'vi': 'Cần cấp quyền vị trí để định hướng.',
      'en': 'Location permission is required for navigation.',
    },
    'nav_permission_forever': {
      'vi':
          'Quyền vị trí bị từ chối vĩnh viễn. Vui lòng cấp trong cài đặt hệ thống.',
      'en':
          'Location permission is permanently denied. Please enable in system settings.',
    },
    'nav_started': {'vi': 'Bắt đầu định hướng.', 'en': 'Navigation started.'},
    'nav_heading': {
      'vi': 'Bạn đang hướng về phía {dir}',
      'en': 'You are heading {dir}',
    },
    'nav_dir_north': {'vi': 'Bắc', 'en': 'North'},
    'nav_dir_east': {'vi': 'Đông', 'en': 'East'},
    'nav_dir_south': {'vi': 'Nam', 'en': 'South'},
    'nav_dir_west': {'vi': 'Tây', 'en': 'West'},
    'nav_on_street': {
      'vi': 'Bạn đang trên đường {road}{area}',
      'en': 'You are on {road}{area}',
    },
    'nav_status_navigating': {'vi': 'Đang điều hướng', 'en': 'Navigating'},
    'nav_status_not_navigating': {'vi': 'Chưa điều hướng', 'en': 'Not navigating'},
    'nav_gps_stable': {'vi': 'GPS ổn định', 'en': 'GPS Stable'},
    'nav_mic_instruction': {'vi': 'Bấm vào mic để nói điểm đến', 'en': 'Tap mic to say destination'},
    'nav_listening': {'vi': 'Đang nghe...', 'en': 'Listening...'},
    'nav_searching': {'vi': 'Đang tìm đường đến {dest}', 'en': 'Finding route to {dest}'},
    'nav_route_not_found': {'vi': 'Không tìm thấy đường.', 'en': 'Route not found.'},
    'nav_arrived': {'vi': 'Đã đến nơi', 'en': 'Arrived'},
    'nav_speak_destination': {'vi': 'Nói điểm đến', 'en': 'Say destination'},
    'nav_locating': {'vi': 'Đang tìm vị trí hiện tại, vui lòng đợi...', 'en': 'Locating your current position, please wait...'},
    'nav_route_found': {'vi': 'Đã tìm thấy tuyến đường. Bắt đầu di chuyển: ', 'en': 'Route found. Start moving: '},
    'nav_coming_up': {'vi': 'Sắp tới, ', 'en': 'Coming up, '},
    'nav_arrived_msg': {'vi': 'Bạn đã đến nơi.', 'en': 'You have arrived.'},
    'nav_stopped_msg': {'vi': 'Đã dừng điều hướng.', 'en': 'Navigation stopped.'},
    'nav_stop_tooltip': {'vi': 'Dừng', 'en': 'Stop'},
    // --- Spatial Audio ---
    'settings_spatial_audio': {
      'vi': '🔊 Âm thanh 3D',
      'en': '🔊 3D Spatial Audio',
    },
    'settings_spatial_audio_desc': {
      'vi': 'Cảnh báo vật cản theo hướng tai trái/phải.',
      'en': 'Obstacle alerts oriented to left/right ear.',
    },
    'settings_spatial_volume': {
      'vi': 'Âm lượng cảnh báo 3D',
      'en': '3D Alert Volume',
    },
    'settings_spatial_volume_spoken': {
      'vi': 'Âm lượng cảnh báo ba đê:',
      'en': 'Three-D alert volume:',
    },
    'settings_headphones_only': {
      'vi': '🎧 Chỉ phát qua tai nghe',
      'en': '🎧 Headphones only mode',
    },
    'settings_headphones_only_desc': {
      'vi': 'Đảm bảo sự riêng tư và chính xác.',
      'en': 'Ensures privacy and direction accuracy.',
    },
  };

  /// Translate localized string based on lang code ('en' or 'vi')
  static String t(String key, String langCode) {
    if (!_localizedStrings.containsKey(key)) {
      return key;
    }
    return _localizedStrings[key]?[langCode] ??
        _localizedStrings[key]?['vi'] ??
        key;
  }
}
