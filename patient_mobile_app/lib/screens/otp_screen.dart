import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import 'additional_info_screen.dart';

class OtpScreen extends StatefulWidget {
  final String email;

  const OtpScreen({super.key, required this.email});

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final AuthService _authService = AuthService();
  final otpController = TextEditingController();

  bool isLoading = false;
  bool isResending = false;

  Future<void> verifyOtp() async {
    if (otpController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter the OTP code.')),
      );
      return;
    }

    setState(() => isLoading = true);

    try {
      final result = await _authService.verifyOtp(
        email: widget.email,
        otpCode: otpController.text.trim(),
      );

      if (!mounted) return;

      if (result["is_verified"] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result["message"] ?? "OTP verified successfully"),
          ),
        );

        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => AdditionalInfoScreen(email: widget.email),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result["detail"] ?? "OTP verification failed"),
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

  Future<void> resendOtp() async {
    setState(() => isResending = true);

    try {
      final result = await _authService.resendOtp(email: widget.email);

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result["message"] ?? "OTP resent successfully")),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text("Error: $e")));
    } finally {
      if (mounted) setState(() => isResending = false);
    }
  }

  @override
  void dispose() {
    otpController.dispose();
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
              padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 24),
              child: Container(
                width: double.infinity,
                constraints: const BoxConstraints(maxWidth: 420),
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 30,
                ),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.94),
                  borderRadius: BorderRadius.circular(28),
                  border: Border.all(
                    color: primaryBlue.withOpacity(0.08),
                    width: 1.2,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: primaryBlue.withOpacity(0.10),
                      blurRadius: 28,
                      offset: const Offset(0, 14),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Container(
                      height: 82,
                      width: 82,
                      decoration: BoxDecoration(
                        color: softBlue,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: primaryBlue.withOpacity(0.12),
                          width: 1.4,
                        ),
                      ),
                      child: const Icon(
                        Icons.verified_user_rounded,
                        size: 40,
                        color: primaryBlue,
                      ),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'OTP Verification',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w700,
                        color: textDark,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Enter the verification code sent to\n${widget.email}',
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
                        'OTP Code',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: deepBlue.withOpacity(0.90),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: otpController,
                      keyboardType: TextInputType.number,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: textDark,
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 4,
                      ),
                      decoration: InputDecoration(
                        hintText: 'Enter OTP',
                        hintStyle: const TextStyle(
                          color: textSoft,
                          letterSpacing: 2,
                        ),
                        prefixIcon: const Icon(
                          Icons.lock_clock_outlined,
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
                    const SizedBox(height: 22),
                    SizedBox(
                      width: double.infinity,
                      height: 54,
                      child: ElevatedButton(
                        onPressed: isLoading ? null : verifyOtp,
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
                                'Verify',
                                style: TextStyle(
                                  fontSize: 15.5,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    TextButton(
                      style: TextButton.styleFrom(foregroundColor: primaryBlue),
                      onPressed: isResending ? null : resendOtp,
                      child: Text(
                        isResending ? 'Resending...' : 'Resend OTP',
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                    ),
                    const SizedBox(height: 18),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 12,
                      ),
                      decoration: BoxDecoration(
                        color: softBlue.withOpacity(0.65),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Row(
                        children: [
                          Icon(
                            Icons.medical_information_outlined,
                            color: primaryBlue,
                            size: 18,
                          ),
                          SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'For your security, please verify your account before continuing.',
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
