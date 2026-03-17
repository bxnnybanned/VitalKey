import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:mime/mime.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api.dart';

class AuthService {
  Future<Map<String, dynamic>> registerBasic({
    required String firstName,
    required String lastName,
    required String birthday,
    required String sex,
    required String email,
    required String mobileNumber,
    required String password,
    required String confirmPassword,
  }) async {
    final response = await http
        .post(
          Uri.parse("$baseUrl/auth/register-basic"),
          headers: {"Content-Type": "application/json"},
          body: jsonEncode({
            "first_name": firstName,
            "last_name": lastName,
            "birthday": birthday,
            "sex": sex,
            "email": email,
            "mobile_number": mobileNumber,
            "password": password,
            "confirm_password": confirmPassword,
          }),
        )
        .timeout(const Duration(seconds: 15));

    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> verifyOtp({
    required String email,
    required String otpCode,
  }) async {
    final response = await http
        .post(
          Uri.parse("$baseUrl/auth/verify-otp"),
          headers: {"Content-Type": "application/json"},
          body: jsonEncode({"email": email, "otp_code": otpCode}),
        )
        .timeout(const Duration(seconds: 15));

    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> resendOtp({required String email}) async {
    final response = await http
        .post(
          Uri.parse("$baseUrl/auth/resend-otp"),
          headers: {"Content-Type": "application/json"},
          body: jsonEncode({"email": email}),
        )
        .timeout(const Duration(seconds: 15));

    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> completeProfile({
    required String email,
    required String address,
    required String emergencyContact,
  }) async {
    final response = await http
        .post(
          Uri.parse("$baseUrl/auth/complete-profile"),
          headers: {"Content-Type": "application/json"},
          body: jsonEncode({
            "email": email,
            "address": address,
            "emergency_contact": emergencyContact,
          }),
        )
        .timeout(const Duration(seconds: 15));

    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final response = await http
        .post(
          Uri.parse("$baseUrl/auth/login"),
          headers: {"Content-Type": "application/json"},
          body: jsonEncode({"email": email, "password": password}),
        )
        .timeout(const Duration(seconds: 15));

    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> forgotPassword({required String email}) async {
    final response = await http
        .post(
          Uri.parse("$baseUrl/auth/forgot-password"),
          headers: {"Content-Type": "application/json"},
          body: jsonEncode({"email": email}),
        )
        .timeout(const Duration(seconds: 15));

    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> resetPassword({
    required String email,
    required String otpCode,
    required String newPassword,
    required String confirmPassword,
  }) async {
    final response = await http
        .post(
          Uri.parse("$baseUrl/auth/reset-password"),
          headers: {"Content-Type": "application/json"},
          body: jsonEncode({
            "email": email,
            "otp_code": otpCode,
            "new_password": newPassword,
            "confirm_password": confirmPassword,
          }),
        )
        .timeout(const Duration(seconds: 15));

    return jsonDecode(response.body);
  }

  Future<void> saveSession({
    required String patientName,
    required String email,
    required String mobileNumber,
    required String patientId,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('is_logged_in', true);
    await prefs.setString('patient_name', patientName);
    await prefs.setString('email', email);
    await prefs.setString('mobile_number', mobileNumber);
    await prefs.setString('patient_id', patientId);
  }

  Future<Map<String, dynamic>?> getSession() async {
    final prefs = await SharedPreferences.getInstance();
    final isLoggedIn = prefs.getBool('is_logged_in') ?? false;

    if (!isLoggedIn) return null;

    return {
      "patient_name": prefs.getString('patient_name'),
      "email": prefs.getString('email'),
      "mobile_number": prefs.getString('mobile_number'),
      "patient_id": prefs.getString('patient_id'),
    };
  }

  Future<void> clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }

  Future<bool> canReachServer() async {
    try {
      final response = await http
          .get(Uri.parse(baseUrl))
          .timeout(const Duration(seconds: 5));
      return response.statusCode >= 200 && response.statusCode < 500;
    } catch (_) {
      return false;
    }
  }

  Future<List<dynamic>> getAvailableDoctors() async {
    final response = await http
        .get(
          Uri.parse("$baseUrl/appointments/available-doctors"),
          headers: {"Content-Type": "application/json"},
        )
        .timeout(const Duration(seconds: 15));

    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> getAvailableSlots({
    required int doctorId,
  }) async {
    final response = await http
        .get(
          Uri.parse("$baseUrl/appointments/available-slots/$doctorId"),
          headers: {"Content-Type": "application/json"},
        )
        .timeout(const Duration(seconds: 15));

    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> bookAppointment({
    required String mobileNumber,
    required int doctorId,
    required String appointmentTime,
    required String reason,
  }) async {
    final response = await http
        .post(
          Uri.parse("$baseUrl/appointments/book"),
          headers: {"Content-Type": "application/json"},
          body: jsonEncode({
            "mobile_number": mobileNumber,
            "doctor_id": doctorId,
            "appointment_time": appointmentTime,
            "reason": reason,
          }),
        )
        .timeout(const Duration(seconds: 15));

    return jsonDecode(response.body);
  }

  Future<List<dynamic>> getMyAppointments({
    required String mobileNumber,
  }) async {
    final response = await http
        .get(
          Uri.parse("$baseUrl/appointments/my-appointments/$mobileNumber"),
          headers: {"Content-Type": "application/json"},
        )
        .timeout(const Duration(seconds: 15));

    return jsonDecode(response.body);
  }

  Future<List<dynamic>> getMedicines() async {
    final response = await http
        .get(
          Uri.parse("$baseUrl/medicines"),
          headers: {"Content-Type": "application/json"},
        )
        .timeout(const Duration(seconds: 15));

    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> requestMedicine({
    required String mobileNumber,
    required int medicineId,
    required int quantity,
    required String reason,
  }) async {
    final response = await http
        .post(
          Uri.parse("$baseUrl/patient/request-medicine"),
          headers: {"Content-Type": "application/json"},
          body: jsonEncode({
            "mobile_number": mobileNumber,
            "medicine_id": medicineId,
            "quantity": quantity,
            "reason": reason,
          }),
        )
        .timeout(const Duration(seconds: 15));

    return jsonDecode(response.body);
  }

  Future<List<dynamic>> getPatientMedicineRequests({
    required String mobileNumber,
  }) async {
    final response = await http
        .get(
          Uri.parse("$baseUrl/patient/medicine-requests/$mobileNumber"),
          headers: {"Content-Type": "application/json"},
        )
        .timeout(const Duration(seconds: 15));

    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> getProfile({
    required String mobileNumber,
  }) async {
    final response = await http
        .get(
          Uri.parse("$baseUrl/auth/profile/$mobileNumber"),
          headers: {"Content-Type": "application/json"},
        )
        .timeout(const Duration(seconds: 15));

    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> updateProfile({
    required String mobileNumber,
    required String newMobileNumber,
    required String address,
    required String emergencyContact,
    required String profilePicture,
  }) async {
    final response = await http
        .put(
          Uri.parse("$baseUrl/auth/profile/$mobileNumber"),
          headers: {"Content-Type": "application/json"},
          body: jsonEncode({
            "new_mobile_number": newMobileNumber,
            "address": address,
            "emergency_contact": emergencyContact,
            "profile_picture": profilePicture,
          }),
        )
        .timeout(const Duration(seconds: 15));

    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> uploadProfilePicture({
    required String mobileNumber,
    required File imageFile,
  }) async {
    final request = http.MultipartRequest(
      'POST',
      Uri.parse("$baseUrl/auth/profile/upload-picture"),
    );

    request.fields['mobile_number'] = mobileNumber;

    final mimeType = lookupMimeType(imageFile.path)?.split('/');
    request.files.add(
      await http.MultipartFile.fromPath(
        'file',
        imageFile.path,
        contentType: mimeType != null
            ? MediaType(mimeType[0], mimeType[1])
            : MediaType('image', 'jpeg'),
      ),
    );

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    return jsonDecode(response.body);
  }
}
