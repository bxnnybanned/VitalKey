import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import 'dashboard_screen.dart';

class AdditionalInfoScreen extends StatefulWidget {
  final String email;

  const AdditionalInfoScreen({super.key, required this.email});

  @override
  State<AdditionalInfoScreen> createState() => _AdditionalInfoScreenState();
}

class _AdditionalInfoScreenState extends State<AdditionalInfoScreen> {
  final AuthService _authService = AuthService();

  final addressController = TextEditingController();
  final emergencyContactController = TextEditingController();

  bool isLoading = false;

  Future<void> completeProfile() async {
    if (addressController.text.trim().isEmpty ||
        emergencyContactController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please complete all required fields.')),
      );
      return;
    }

    setState(() => isLoading = true);

    try {
      final result = await _authService.completeProfile(
        email: widget.email,
        address: addressController.text.trim(),
        emergencyContact: emergencyContactController.text.trim(),
      );

      if (!mounted) return;

      if (result["patient_id"] != null) {
        await _authService.saveSession(
          patientName: result["full_name"] ?? "Patient",
          email: widget.email,
          mobileNumber: result["mobile_number"] ?? "",
          patientId: result["patient_id"] ?? "",
        );

        if (!mounted) return;

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              result["message"] ?? "Profile completed successfully",
            ),
          ),
        );

        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(
            builder: (_) => DashboardScreen(
              patientName: result["full_name"] ?? "Patient",
              mobileNumber: result["mobile_number"] ?? "",
              patientId: result["patient_id"] ?? "",
            ),
          ),
          (route) => false,
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result["detail"] ?? "Failed to complete profile"),
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text("Error: $e")));
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  @override
  void dispose() {
    addressController.dispose();
    emergencyContactController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF2563EB);
    const softBlue = Color(0xFFEFF6FF);
    const deepBlue = Color(0xFF1E3A8A);
    const textDark = Color(0xFF0F172A);
    const textSoft = Color(0xFF64748B);
    const borderColor = Color(0xFFD6E4F0);
    final compact = MediaQuery.of(context).size.width < 360;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FBFF),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFF8FBFF), Color(0xFFEEF6FF), Color(0xFFE3F0FF)],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: EdgeInsets.symmetric(
                horizontal: compact ? 16 : 22,
                vertical: compact ? 18 : 24,
              ),
              child: Container(
                width: double.infinity,
                constraints: const BoxConstraints(maxWidth: 420),
                padding: EdgeInsets.symmetric(
                  horizontal: compact ? 18 : 24,
                  vertical: compact ? 24 : 30,
                ),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.94),
                  borderRadius: BorderRadius.circular(28),
                  border: Border.all(
                    color: primaryBlue.withValues(alpha: 0.08),
                    width: 1.2,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: primaryBlue.withValues(alpha: 0.10),
                      blurRadius: 28,
                      offset: const Offset(0, 14),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Container(
                      height: compact ? 72 : 82,
                      width: compact ? 72 : 82,
                      decoration: BoxDecoration(
                        color: softBlue,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: primaryBlue.withValues(alpha: 0.12),
                          width: 1.4,
                        ),
                      ),
                      child: const Icon(
                        Icons.assignment_ind_rounded,
                        size: 36,
                        color: primaryBlue,
                      ),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      'Additional Information',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: compact ? 24 : 27,
                        fontWeight: FontWeight.w700,
                        color: textDark,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Add your address and emergency contact details to complete your patient profile for ${widget.email}.',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 14,
                        height: 1.5,
                        color: textSoft,
                      ),
                    ),
                    const SizedBox(height: 28),

                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        'Address',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: deepBlue.withValues(alpha: 0.90),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: addressController,
                      maxLines: 2,
                      style: const TextStyle(color: textDark),
                      decoration: InputDecoration(
                        hintText: 'Enter your complete address',
                        hintStyle: const TextStyle(color: textSoft),
                        prefixIcon: const Padding(
                          padding: EdgeInsets.only(bottom: 28),
                          child: Icon(
                            Icons.location_on_outlined,
                            color: primaryBlue,
                          ),
                        ),
                        filled: true,
                        fillColor: const Color(0xFFFDFEFF),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 18,
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(18),
                          borderSide: const BorderSide(color: borderColor),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(18),
                          borderSide: const BorderSide(
                            color: primaryBlue,
                            width: 1.4,
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 18),

                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        'Emergency Contact',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: deepBlue.withValues(alpha: 0.90),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: emergencyContactController,
                      keyboardType: TextInputType.phone,
                      style: const TextStyle(color: textDark),
                      decoration: InputDecoration(
                        hintText: 'Enter emergency contact number',
                        hintStyle: const TextStyle(color: textSoft),
                        prefixIcon: const Icon(
                          Icons.phone_in_talk_outlined,
                          color: primaryBlue,
                        ),
                        filled: true,
                        fillColor: const Color(0xFFFDFEFF),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 18,
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(18),
                          borderSide: const BorderSide(color: borderColor),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(18),
                          borderSide: const BorderSide(
                            color: primaryBlue,
                            width: 1.4,
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 24),

                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        onPressed: isLoading ? null : completeProfile,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: primaryBlue,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(18),
                          ),
                        ),
                        child: isLoading
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2.4,
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                    Colors.white,
                                  ),
                                ),
                              )
                            : const Text(
                                'Save',
                                style: TextStyle(
                                  fontSize: 15.5,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                      ),
                    ),

                    const SizedBox(height: 20),

                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 12,
                      ),
                      decoration: BoxDecoration(
                        color: softBlue.withValues(alpha: 0.65),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(
                            Icons.shield_outlined,
                            color: primaryBlue,
                            size: 18,
                          ),
                          SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'Your patient ID will be generated after this step is completed successfully.',
                              style: TextStyle(
                                fontSize: 12.5,
                                height: 1.4,
                                color: textSoft,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
