import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import 'dashboard_screen.dart';
import 'login_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  final AuthService _authService = AuthService();
  String message = 'Preparing your medical dashboard...';

  @override
  void initState() {
    super.initState();
    startApp();
  }

  Future<void> startApp() async {
    await Future.delayed(const Duration(seconds: 2));

    final connectivityResult = await Connectivity().checkConnectivity();

    if (connectivityResult.contains(ConnectivityResult.none)) {
      if (!mounted) return;
      setState(() {
        message = 'Internet connection is required to access the system.';
      });
      return;
    }

    final session = await _authService.getSession();

    if (!mounted) return;

    if (session != null) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => DashboardScreen(
            patientName: session["patient_name"] ?? "Patient",
            mobileNumber: session["mobile_number"] ?? "",
          ),
        ),
      );
    } else {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF2563EB);
    const softBlue = Color(0xFFEFF6FF);
    const deepBlue = Color(0xFF1E3A8A);
    const textDark = Color(0xFF0F172A);
    const textSoft = Color(0xFF64748B);

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFF8FBFF), Color(0xFFEAF4FF), Color(0xFFDCEEFF)],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Container(
                width: double.infinity,
                constraints: const BoxConstraints(maxWidth: 380),
                padding: const EdgeInsets.symmetric(
                  horizontal: 28,
                  vertical: 36,
                ),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.92),
                  borderRadius: BorderRadius.circular(28),
                  boxShadow: [
                    BoxShadow(
                      color: primaryBlue.withOpacity(0.10),
                      blurRadius: 30,
                      offset: const Offset(0, 16),
                    ),
                  ],
                  border: Border.all(
                    color: primaryBlue.withOpacity(0.08),
                    width: 1.2,
                  ),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      height: 96,
                      width: 96,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: softBlue,
                        border: Border.all(
                          color: primaryBlue.withOpacity(0.12),
                          width: 1.5,
                        ),
                      ),
                      child: const Icon(
                        Icons.local_hospital_rounded,
                        size: 46,
                        color: primaryBlue,
                      ),
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'VitalKey',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 30,
                        fontWeight: FontWeight.w700,
                        color: textDark,
                        letterSpacing: 0.3,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Smart, secure, and simple access to your medical care.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 14.5,
                        height: 1.5,
                        color: textSoft,
                      ),
                    ),
                    const SizedBox(height: 30),
                    Column(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: const LinearProgressIndicator(
                            minHeight: 6,
                            backgroundColor: Color(0xFFE2E8F0),
                            valueColor: AlwaysStoppedAnimation(primaryBlue),
                          ),
                        ),
                        const SizedBox(height: 18),
                        Text(
                          message,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 13.5,
                            color: message.contains('required')
                                ? Colors.redAccent
                                : deepBlue,
                            fontWeight: FontWeight.w500,
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 28),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 10,
                      ),
                      decoration: BoxDecoration(
                        color: softBlue.withOpacity(0.75),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.favorite_outline_rounded,
                            size: 18,
                            color: primaryBlue,
                          ),
                          SizedBox(width: 8),
                          Text(
                            'Medical care made calm and clear',
                            style: TextStyle(
                              fontSize: 12.5,
                              color: textSoft,
                              fontWeight: FontWeight.w500,
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
