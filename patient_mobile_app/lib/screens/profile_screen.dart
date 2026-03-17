import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../config/api.dart';
import '../services/auth_service.dart';
import 'login_screen.dart';

class ProfileScreen extends StatefulWidget {
  final String mobileNumber;

  const ProfileScreen({super.key, required this.mobileNumber});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final AuthService _authService = AuthService();
  final ImagePicker _picker = ImagePicker();

  Map<String, dynamic>? profileData;
  bool isLoading = true;
  bool isUpdating = false;
  bool isUploadingImage = false;
  bool isEditing = false;

  final mobileNumberController = TextEditingController();
  final addressController = TextEditingController();
  final emergencyContactController = TextEditingController();

  File? selectedImageFile;
  late String currentMobileNumber;

  static const Color _primaryBlue = Color(0xFF2F6BFF);
  static const Color _deepBlue = Color(0xFF123D91);
  static const Color _softBlue = Color(0xFFEFF4FF);
  static const Color _background = Color(0xFFF7FAFF);
  static const Color _textDark = Color(0xFF1B263B);
  static const Color _textMuted = Color(0xFF6B7A99);
  static const Color _cardColor = Colors.white;

  @override
  void initState() {
    super.initState();
    currentMobileNumber = widget.mobileNumber;
    loadProfile();
  }

  Future<void> loadProfile() async {
    try {
      final result = await _authService.getProfile(
        mobileNumber: currentMobileNumber,
      );

      if (!mounted) return;

      setState(() {
        profileData = result;
        mobileNumberController.text = result["mobile_number"] ?? "";
        addressController.text = result["address"] ?? "";
        emergencyContactController.text = result["emergency_contact"] ?? "";
        isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;

      setState(() => isLoading = false);

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Error loading profile: $e"),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> saveProfile() async {
    setState(() => isUpdating = true);

    try {
      final result = await _authService.updateProfile(
        mobileNumber: currentMobileNumber,
        newMobileNumber: mobileNumberController.text.trim(),
        address: addressController.text.trim(),
        emergencyContact: emergencyContactController.text.trim(),
        profilePicture: profileData?["profile_picture"] ?? "",
      );

      if (!mounted) return;

      final updatedMobileNumber = mobileNumberController.text.trim();
      await _authService.saveSession(
        patientName: (profileData?["full_name"] ?? "Patient").toString(),
        email: (profileData?["email"] ?? "").toString(),
        mobileNumber: updatedMobileNumber,
        patientId: (profileData?["patient_id"] ?? "").toString(),
      );

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result["message"] ?? "Profile updated successfully"),
          behavior: SnackBarBehavior.floating,
        ),
      );

      setState(() {
        isEditing = false;
        currentMobileNumber = updatedMobileNumber;
      });

      await loadProfile();
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Error saving profile: $e"),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => isUpdating = false);
      }
    }
  }

  Future<void> pickImage(ImageSource source) async {
    try {
      final pickedFile = await _picker.pickImage(
        source: source,
        imageQuality: 70,
      );

      if (pickedFile == null) return;

      final imageFile = File(pickedFile.path);

      setState(() {
        selectedImageFile = imageFile;
        isUploadingImage = true;
      });

      final result = await _authService.uploadProfilePicture(
        mobileNumber: currentMobileNumber,
        imageFile: imageFile,
      );

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result["message"] ?? "Profile picture uploaded"),
          behavior: SnackBarBehavior.floating,
        ),
      );

      await loadProfile();
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Error uploading image: $e"),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          isUploadingImage = false;
        });
      }
    }
  }

  Future<void> logout() async {
    await _authService.clearSession();

    if (!mounted) return;

    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }

  InputDecoration _inputDecoration({
    required String label,
    required IconData icon,
  }) {
    return InputDecoration(
      labelText: label,
      labelStyle: const TextStyle(color: _textMuted),
      prefixIcon: Icon(icon, color: _primaryBlue),
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: BorderSide(color: Colors.blue.shade50),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: const BorderSide(color: _primaryBlue, width: 1.4),
      ),
      disabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: BorderSide(color: Colors.blue.shade50),
      ),
    );
  }

  Widget buildInfoTile({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _cardColor,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: _softBlue,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: _primaryBlue, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    color: _textMuted,
                    fontSize: 12.5,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value.isEmpty ? "-" : value,
                  style: const TextStyle(
                    color: _textDark,
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget buildEditableField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: controller,
        enabled: isEditing,
        keyboardType: keyboardType,
        style: const TextStyle(
          color: _textDark,
          fontSize: 14.5,
          fontWeight: FontWeight.w500,
        ),
        decoration: _inputDecoration(label: label, icon: icon),
      ),
    );
  }

  @override
  void dispose() {
    mobileNumberController.dispose();
    addressController.dispose();
    emergencyContactController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final imagePath = profileData?["profile_picture"] ?? "";
    final fullImageUrl = imagePath.isNotEmpty ? "$baseUrl$imagePath" : "";

    ImageProvider? profileImageProvider;

    if (selectedImageFile != null) {
      profileImageProvider = FileImage(selectedImageFile!);
    } else if (fullImageUrl.isNotEmpty) {
      profileImageProvider = NetworkImage(fullImageUrl);
    }

    return Scaffold(
      backgroundColor: _background,
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        title: const Text(
          'Profile',
          style: TextStyle(color: _textDark, fontWeight: FontWeight.w700),
        ),
        iconTheme: const IconThemeData(color: _textDark),
      ),
      body: isLoading
          ? const Center(
              child: CircularProgressIndicator(
                color: _primaryBlue,
                strokeWidth: 3,
              ),
            )
          : profileData == null
          ? const Center(
              child: Text(
                'No profile data found.',
                style: TextStyle(color: _textMuted, fontSize: 15),
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(22),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [_primaryBlue, _deepBlue],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(28),
                      boxShadow: [
                        BoxShadow(
                          color: _primaryBlue.withOpacity(0.18),
                          blurRadius: 22,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        Stack(
                          alignment: Alignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: Colors.white.withOpacity(0.35),
                                  width: 2,
                                ),
                              ),
                              child: CircleAvatar(
                                radius: 52,
                                backgroundColor: Colors.white.withOpacity(0.18),
                                backgroundImage: profileImageProvider,
                                child: profileImageProvider == null
                                    ? const Icon(
                                        Icons.person_rounded,
                                        size: 52,
                                        color: Colors.white,
                                      )
                                    : null,
                              ),
                            ),
                            if (isUploadingImage)
                              Container(
                                width: 112,
                                height: 112,
                                decoration: BoxDecoration(
                                  color: Colors.black45,
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: Colors.white24,
                                    width: 1,
                                  ),
                                ),
                                child: const Center(
                                  child: CircularProgressIndicator(
                                    color: Colors.white,
                                    strokeWidth: 2.8,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        Text(
                          (profileData!["full_name"] ?? "Patient").toString(),
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Patient ID: ${(profileData!["patient_id"] ?? "").toString()}',
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.9),
                            fontSize: 13.5,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Review your patient details and update your contact information when needed.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.88),
                            fontSize: 12.8,
                            height: 1.45,
                          ),
                        ),
                        const SizedBox(height: 14),
                        if (isEditing)
                          Wrap(
                            spacing: 10,
                            runSpacing: 10,
                            alignment: WrapAlignment.center,
                            children: [
                              ElevatedButton.icon(
                                onPressed: isUploadingImage
                                    ? null
                                    : () => pickImage(ImageSource.gallery),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.white,
                                  foregroundColor: _deepBlue,
                                  elevation: 0,
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 18,
                                    vertical: 12,
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                ),
                                icon: const Icon(Icons.photo_library_outlined),
                                label: const Text(
                                  'Choose Photo',
                                  style: TextStyle(fontWeight: FontWeight.w700),
                                ),
                              ),
                              ElevatedButton.icon(
                                onPressed: isUploadingImage
                                    ? null
                                    : () => pickImage(ImageSource.camera),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.white.withOpacity(
                                    0.14,
                                  ),
                                  foregroundColor: Colors.white,
                                  elevation: 0,
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 18,
                                    vertical: 12,
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                    side: BorderSide(
                                      color: Colors.white.withOpacity(0.22),
                                    ),
                                  ),
                                ),
                                icon: const Icon(Icons.camera_alt_outlined),
                                label: const Text(
                                  'Take Photo',
                                  style: TextStyle(fontWeight: FontWeight.w700),
                                ),
                              ),
                            ],
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 22),
                  const Text(
                    'Personal Information',
                    style: TextStyle(
                      color: _textDark,
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 12),
                  buildInfoTile(
                    icon: Icons.badge_outlined,
                    label: 'Patient ID',
                    value: (profileData!["patient_id"] ?? "").toString(),
                  ),
                  buildInfoTile(
                    icon: Icons.person_outline_rounded,
                    label: 'Full Name',
                    value: (profileData!["full_name"] ?? "").toString(),
                  ),
                  buildInfoTile(
                    icon: Icons.email_outlined,
                    label: 'Email',
                    value: (profileData!["email"] ?? "").toString(),
                  ),
                  buildInfoTile(
                    icon: Icons.cake_outlined,
                    label: 'Birthday',
                    value: (profileData!["birthday"] ?? "").toString(),
                  ),
                  Row(
                    children: [
                      Expanded(
                        child: buildInfoTile(
                          icon: Icons.calendar_today_outlined,
                          label: 'Age',
                          value: (profileData!["age"] ?? "").toString(),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: buildInfoTile(
                          icon: Icons.wc_outlined,
                          label: 'Sex',
                          value: (profileData!["sex"] ?? "").toString(),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: _softBlue.withOpacity(0.45),
                      borderRadius: BorderRadius.circular(26),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(
                              Icons.edit_note_rounded,
                              color: _primaryBlue,
                              size: 22,
                            ),
                            const SizedBox(width: 8),
                            const Text(
                              'Contact Details',
                              style: TextStyle(
                                color: _textDark,
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const Spacer(),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: isEditing
                                    ? const Color(0xFFEAF8EF)
                                    : Colors.white,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                isEditing ? 'Editing' : 'View Only',
                                style: TextStyle(
                                  color: isEditing
                                      ? const Color(0xFF1F9D55)
                                      : _deepBlue,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          'You can update your mobile number, address, emergency contact, and profile picture here.',
                          style: TextStyle(color: _textMuted, fontSize: 13.5),
                        ),
                        const SizedBox(height: 18),
                        buildEditableField(
                          controller: mobileNumberController,
                          label: 'Mobile Number',
                          icon: Icons.phone_outlined,
                          keyboardType: TextInputType.phone,
                        ),
                        buildEditableField(
                          controller: addressController,
                          label: 'Address',
                          icon: Icons.location_on_outlined,
                        ),
                        buildEditableField(
                          controller: emergencyContactController,
                          label: 'Emergency Contact',
                          icon: Icons.emergency_outlined,
                          keyboardType: TextInputType.phone,
                        ),
                        const SizedBox(height: 8),
                        if (!isEditing)
                          SizedBox(
                            width: double.infinity,
                            height: 52,
                            child: ElevatedButton.icon(
                              onPressed: () {
                                setState(() {
                                  isEditing = true;
                                });
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: _primaryBlue,
                                foregroundColor: Colors.white,
                                elevation: 0,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(18),
                                ),
                              ),
                              icon: const Icon(Icons.edit_outlined),
                              label: const Text(
                                'Edit Profile',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                          ),
                        if (isEditing) ...[
                          SizedBox(
                            width: double.infinity,
                            height: 52,
                            child: ElevatedButton(
                              onPressed: isUpdating ? null : saveProfile,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: _primaryBlue,
                                foregroundColor: Colors.white,
                                elevation: 0,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(18),
                                ),
                              ),
                              child: isUpdating
                                  ? const SizedBox(
                                      width: 22,
                                      height: 22,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2.4,
                                        color: Colors.white,
                                      ),
                                    )
                                  : const Text(
                                      'Save Changes',
                                      style: TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                            ),
                          ),
                          const SizedBox(height: 10),
                          SizedBox(
                            width: double.infinity,
                            height: 52,
                            child: OutlinedButton(
                              onPressed: () {
                                setState(() {
                                  isEditing = false;
                                  mobileNumberController.text =
                                      profileData!["mobile_number"] ?? "";
                                  addressController.text =
                                      profileData!["address"] ?? "";
                                  emergencyContactController.text =
                                      profileData!["emergency_contact"] ?? "";
                                  selectedImageFile = null;
                                });
                              },
                              style: OutlinedButton.styleFrom(
                                foregroundColor: _deepBlue,
                                side: BorderSide(color: Colors.blue.shade100),
                                backgroundColor: Colors.white,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(18),
                                ),
                              ),
                              child: const Text(
                                'Cancel',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFE74C3C),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(18),
                        ),
                      ),
                      onPressed: logout,
                      icon: const Icon(Icons.logout_rounded),
                      label: const Text(
                        'Log Out',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
