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

  final List<String> sexOptions = ['Male', 'Female'];

  String? validateInputs() {
    if (firstNameController.text.trim().isEmpty ||
        lastNameController.text.trim().isEmpty ||
        birthdayController.text.trim().isEmpty ||
        selectedSex == null ||
        emailController.text.trim().isEmpty ||
        mobileController.text.trim().isEmpty ||
        passwordController.text.isEmpty ||
        confirmPasswordController.text.isEmpty) {
      return 'Please complete all required fields.';
    }

    final email = emailController.text.trim();
    if (!RegExp(r'^[^@]+@[^@]+\.[^@]+$').hasMatch(email)) {
      return 'Please enter a valid email address.';
    }

    final mobile = mobileController.text.trim();
    if (!RegExp(r'^09\d{9}$').hasMatch(mobile)) {
      return 'Mobile number must be 11 digits and start with 09.';
    }

    final password = passwordController.text;
    if (password.length < 8 || password.length > 16) {
      return 'Password must be 8 to 16 characters.';
    }

    final hasUpper = RegExp(r'[A-Z]').hasMatch(password);
    final hasLower = RegExp(r'[a-z]').hasMatch(password);
    final hasNumber = RegExp(r'[0-9]').hasMatch(password);
    final hasSpecial = RegExp(
      r'[!@#$%^&*(),.?":{}|<>_\-+=/\\[\]~`]',
    ).hasMatch(password);

    if (!(hasUpper && hasLower && hasNumber && hasSpecial)) {
      return 'Password must include uppercase, lowercase, number, and special character.';
    }

    if (password != confirmPasswordController.text) {
      return 'Passwords do not match.';
    }

    final birthday = birthdayController.text.trim();
    if (!RegExp(r'^\d{4}-\d{2}-\d{2}$').hasMatch(birthday)) {
      return 'Birthday must be in YYYY-MM-DD format.';
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
          '${pickedDate.year.toString().padLeft(4, '0')}-'
          '${pickedDate.month.toString().padLeft(2, '0')}-'
          '${pickedDate.day.toString().padLeft(2, '0')}';

      setState(() {
        birthdayController.text = formatted;
      });
    }
  }

  Future<void> registerBasic() async {
    final validationError = validateInputs();
    if (validationError != null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(validationError)));
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

  Widget buildField(
    TextEditingController controller,
    String label, {
    bool obscure = false,
    TextInputType keyboardType = TextInputType.text,
    String? hintText,
    Widget? suffixIcon,
    Widget? prefixIcon,
    bool readOnly = false,
    VoidCallback? onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: controller,
        obscureText: obscure,
        keyboardType: keyboardType,
        readOnly: readOnly,
        onTap: onTap,
        decoration: InputDecoration(
          labelText: label,
          hintText: hintText,
          prefixIcon: prefixIcon,
          suffixIcon: suffixIcon,
          border: const OutlineInputBorder(),
        ),
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
    return Scaffold(
      appBar: AppBar(title: const Text('Create Account')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            buildField(
              firstNameController,
              'First Name',
              prefixIcon: const Icon(Icons.person_outline),
            ),
            buildField(
              lastNameController,
              'Last Name',
              prefixIcon: const Icon(Icons.badge_outlined),
            ),
            buildField(
              birthdayController,
              'Birthday',
              hintText: 'YYYY-MM-DD',
              readOnly: true,
              onTap: selectBirthday,
              prefixIcon: const Icon(Icons.cake_outlined),
              suffixIcon: const Icon(Icons.calendar_today_outlined),
            ),
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: DropdownButtonFormField<String>(
                value: selectedSex,
                decoration: const InputDecoration(
                  labelText: 'Sex',
                  prefixIcon: Icon(Icons.wc_outlined),
                  border: OutlineInputBorder(),
                ),
                items: sexOptions.map((sex) {
                  return DropdownMenuItem<String>(value: sex, child: Text(sex));
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    selectedSex = value;
                  });
                },
              ),
            ),
            buildField(
              emailController,
              'Email',
              keyboardType: TextInputType.emailAddress,
              prefixIcon: const Icon(Icons.email_outlined),
            ),
            buildField(
              mobileController,
              'Phone Number',
              keyboardType: TextInputType.phone,
              prefixIcon: const Icon(Icons.phone_outlined),
            ),
            buildField(
              passwordController,
              'Password',
              obscure: obscurePassword,
              prefixIcon: const Icon(Icons.lock_outline),
              suffixIcon: IconButton(
                icon: Icon(
                  obscurePassword
                      ? Icons.visibility_off_outlined
                      : Icons.visibility_outlined,
                ),
                onPressed: () {
                  setState(() {
                    obscurePassword = !obscurePassword;
                  });
                },
              ),
            ),
            buildField(
              confirmPasswordController,
              'Confirm Password',
              obscure: obscureConfirmPassword,
              prefixIcon: const Icon(Icons.lock_reset_outlined),
              suffixIcon: IconButton(
                icon: Icon(
                  obscureConfirmPassword
                      ? Icons.visibility_off_outlined
                      : Icons.visibility_outlined,
                ),
                onPressed: () {
                  setState(() {
                    obscureConfirmPassword = !obscureConfirmPassword;
                  });
                },
              ),
            ),
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: isLoading ? null : registerBasic,
                child: isLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Create Account'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
