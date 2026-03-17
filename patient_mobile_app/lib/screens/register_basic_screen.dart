import 'package:flutter/material.dart';

import '../services/auth_service.dart';
import 'otp_screen.dart';

class RegisterBasicScreen extends StatefulWidget {
  const RegisterBasicScreen({super.key});

  @override
  State<RegisterBasicScreen> createState() => _RegisterBasicScreenState();
}

class _RegisterBasicScreenState extends State<RegisterBasicScreen> {
  final AuthService _authService = AuthService();

  final firstNameController = TextEditingController();
  final lastNameController = TextEditingController();
  final birthdayController = TextEditingController();
  final emailController = TextEditingController();
  final mobileController = TextEditingController();
  final passwordController = TextEditingController();
  final confirmPasswordController = TextEditingController();

  bool isLoading = false;
  bool obscurePassword = true;
  bool obscureConfirmPassword = true;

  String? selectedSex;

  final List<String> sexOptions = ["Male", "Female"];

  static const Color _primaryBlue = Color(0xFF2563EB);
  static const Color _softBlue = Color(0xFFEFF6FF);
  static const Color _textDark = Color(0xFF0F172A);
  static const Color _textSoft = Color(0xFF64748B);
  static const Color _borderColor = Color(0xFFD6E4F0);

  String? validateInputs() {
    if (firstNameController.text.trim().isEmpty ||
        lastNameController.text.trim().isEmpty ||
        birthdayController.text.trim().isEmpty ||
        selectedSex == null ||
        emailController.text.trim().isEmpty ||
        mobileController.text.trim().isEmpty ||
        passwordController.text.isEmpty ||
        confirmPasswordController.text.isEmpty) {
      return "Please complete all required fields.";
    }

    final email = emailController.text.trim();
    if (!RegExp(r'^[^@]+@[^@]+\.[^@]+$').hasMatch(email)) {
      return "Please enter a valid email address.";
    }

    final mobile = mobileController.text.trim();
    if (!RegExp(r'^09\d{9}$').hasMatch(mobile)) {
      return "Mobile number must be 11 digits and start with 09.";
    }

    final password = passwordController.text;
    if (password.length < 8 || password.length > 16) {
      return "Password must be 8 to 16 characters.";
    }

    final hasUpper = RegExp(r'[A-Z]').hasMatch(password);
    final hasLower = RegExp(r'[a-z]').hasMatch(password);
    final hasNumber = RegExp(r'[0-9]').hasMatch(password);
    final hasSpecial = RegExp(
      r'[!@#$%^&*(),.?":{}|<>_\-+=/\\[\]~`]',
    ).hasMatch(password);

    if (!(hasUpper && hasLower && hasNumber && hasSpecial)) {
      return "Password must include uppercase, lowercase, number, and special character.";
    }

    if (password != confirmPasswordController.text) {
      return "Passwords do not match.";
    }

    final birthday = birthdayController.text.trim();
    if (!RegExp(r'^\d{4}-\d{2}-\d{2}$').hasMatch(birthday)) {
      return "Birthday must be in YYYY-MM-DD format.";
    }

    return null;
  }

  Future<void> selectBirthday() async {
    final now = DateTime.now();
    final initialDate =
        DateTime.tryParse(birthdayController.text) ??
        DateTime(now.year - 18, now.month, now.day);

    final pickedDate = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: DateTime(1900),
      lastDate: now,
    );

    if (pickedDate != null) {
      final formatted =
          "${pickedDate.year.toString().padLeft(4, "0")}-"
          "${pickedDate.month.toString().padLeft(2, "0")}-"
          "${pickedDate.day.toString().padLeft(2, "0")}";

      setState(() {
        birthdayController.text = formatted;
      });
    }
  }

  Future<void> registerBasic() async {
    final validationError = validateInputs();
    if (validationError != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(validationError)),
      );
      return;
    }

    setState(() => isLoading = true);

    try {
      final result = await _authService.registerBasic(
        firstName: firstNameController.text.trim(),
        lastName: lastNameController.text.trim(),
        birthday: birthdayController.text.trim(),
        sex: selectedSex!,
        email: emailController.text.trim(),
        mobileNumber: mobileController.text.trim(),
        password: passwordController.text,
        confirmPassword: confirmPasswordController.text,
      );

      if (!mounted) return;

      if (result["email"] != null || result["message"] != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result["message"] ?? "Registration successful"),
          ),
        );

        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => OtpScreen(email: emailController.text.trim()),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result["detail"] ?? "Registration failed")),
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

  InputDecoration _inputDecoration({
    required String label,
    required IconData icon,
    String? hintText,
    Widget? suffixIcon,
  }) {
    return InputDecoration(
      labelText: label,
      hintText: hintText,
      hintStyle: const TextStyle(color: _textSoft),
      labelStyle: const TextStyle(color: _textSoft),
      prefixIcon: Icon(icon, color: _primaryBlue),
      suffixIcon: suffixIcon,
      filled: true,
      fillColor: const Color(0xFFFDFEFF),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: const BorderSide(color: _borderColor),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: const BorderSide(color: _primaryBlue, width: 1.4),
      ),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
      ),
    );
  }

  @override
  void dispose() {
    firstNameController.dispose();
    lastNameController.dispose();
    birthdayController.dispose();
    emailController.dispose();
    mobileController.dispose();
    passwordController.dispose();
    confirmPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
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
                constraints: const BoxConstraints(maxWidth: 430),
                padding: EdgeInsets.symmetric(
                  horizontal: compact ? 18 : 24,
                  vertical: compact ? 24 : 30,
                ),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.94),
                  borderRadius: BorderRadius.circular(28),
                  border: Border.all(
                    color: _primaryBlue.withOpacity(0.08),
                    width: 1.2,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: _primaryBlue.withOpacity(0.10),
                      blurRadius: 28,
                      offset: const Offset(0, 14),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Container(
                      height: compact ? 72 : 82,
                      width: compact ? 72 : 82,
                      decoration: BoxDecoration(
                        color: _softBlue,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: _primaryBlue.withOpacity(0.12),
                          width: 1.4,
                        ),
                      ),
                      child: const Icon(
                        Icons.person_add_alt_1_rounded,
                        size: 36,
                        color: _primaryBlue,
                      ),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      "Create Account",
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: compact ? 24 : 28,
                        fontWeight: FontWeight.w700,
                        color: _textDark,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      "Enter your basic information to create your patient account and continue to email verification.",
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: compact ? 13 : 14,
                        height: 1.5,
                        color: _textSoft,
                      ),
                    ),
                    const SizedBox(height: 28),
                    Flex(
                      direction: compact ? Axis.vertical : Axis.horizontal,
                      children: [
                        Expanded(
                          flex: compact ? 0 : 1,
                          child: TextField(
                            controller: firstNameController,
                            decoration: _inputDecoration(
                              label: "First Name",
                              icon: Icons.person_outline,
                            ),
                          ),
                        ),
                        SizedBox(width: compact ? 0 : 12, height: compact ? 12 : 0),
                        Expanded(
                          flex: compact ? 0 : 1,
                          child: TextField(
                            controller: lastNameController,
                            decoration: _inputDecoration(
                              label: "Last Name",
                              icon: Icons.badge_outlined,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: birthdayController,
                      readOnly: true,
                      onTap: selectBirthday,
                      decoration: _inputDecoration(
                        label: "Birthday",
                        hintText: "YYYY-MM-DD",
                        icon: Icons.cake_outlined,
                        suffixIcon: const Icon(
                          Icons.calendar_today_outlined,
                          color: _textSoft,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      value: selectedSex,
                      decoration: _inputDecoration(
                        label: "Sex",
                        icon: Icons.wc_outlined,
                      ),
                      items: sexOptions.map((sex) {
                        return DropdownMenuItem<String>(
                          value: sex,
                          child: Text(sex),
                        );
                      }).toList(),
                      onChanged: (value) {
                        setState(() {
                          selectedSex = value;
                        });
                      },
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: emailController,
                      keyboardType: TextInputType.emailAddress,
                      decoration: _inputDecoration(
                        label: "Email Address",
                        icon: Icons.email_outlined,
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: mobileController,
                      keyboardType: TextInputType.phone,
                      decoration: _inputDecoration(
                        label: "Mobile Number",
                        hintText: "09XXXXXXXXX",
                        icon: Icons.phone_outlined,
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: passwordController,
                      obscureText: obscurePassword,
                      decoration: _inputDecoration(
                        label: "Password",
                        icon: Icons.lock_outline_rounded,
                        suffixIcon: IconButton(
                          icon: Icon(
                            obscurePassword
                                ? Icons.visibility_off_outlined
                                : Icons.visibility_outlined,
                            color: _textSoft,
                          ),
                          onPressed: () {
                            setState(() {
                              obscurePassword = !obscurePassword;
                            });
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: confirmPasswordController,
                      obscureText: obscureConfirmPassword,
                      decoration: _inputDecoration(
                        label: "Confirm Password",
                        icon: Icons.lock_reset_outlined,
                        suffixIcon: IconButton(
                          icon: Icon(
                            obscureConfirmPassword
                                ? Icons.visibility_off_outlined
                                : Icons.visibility_outlined,
                            color: _textSoft,
                          ),
                          onPressed: () {
                            setState(() {
                              obscureConfirmPassword =
                                  !obscureConfirmPassword;
                            });
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 12,
                      ),
                      decoration: BoxDecoration(
                        color: _softBlue.withOpacity(0.65),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(
                            Icons.info_outline_rounded,
                            color: _primaryBlue,
                            size: 18,
                          ),
                          SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              "Password must be 8 to 16 characters with uppercase, lowercase, number, and special character.",
                              style: TextStyle(
                                fontSize: 12.5,
                                height: 1.4,
                                color: _textSoft,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 22),
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        onPressed: isLoading ? null : registerBasic,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _primaryBlue,
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
                                "Create Account",
                                style: TextStyle(
                                  fontSize: 15.5,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
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
