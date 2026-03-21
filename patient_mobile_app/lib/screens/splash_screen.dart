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

class _SplashScreenState extends State<SplashScreen> {
  final AuthService _authService = AuthService();
  String message = "Checking session and internet connection...";
  bool showRetry = false;

  @override
  void initState() {
    super.initState();
    startApp();
  }

  Future<void> startApp() async {
    if (mounted) {
      setState(() {
        showRetry = false;
        message = "Checking session and internet connection...";
      });
    }

    await Future.delayed(const Duration(seconds: 2));

    final connectivityResult = await Connectivity().checkConnectivity();

    if (connectivityResult.contains(ConnectivityResult.none)) {
      if (!mounted) return;
      setState(() {
        message = "No network connection detected. Connect to Wi-Fi or mobile data.";
        showRetry = true;
      });
      return;
    }

    final canReachServer = await _authService.canReachServer();
    if (!canReachServer) {
      if (!mounted) return;
      setState(() {
        message =
            "Connected to a network, but the VitalKey server is not reachable yet.";
        showRetry = true;
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
            patientId: session["patient_id"] ?? "",
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
    final compact = MediaQuery.of(context).size.width < 360;

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
              padding: EdgeInsets.symmetric(horizontal: compact ? 18 : 24),
              child: Container(
                width: double.infinity,
                constraints: const BoxConstraints(maxWidth: 380),
                padding: EdgeInsets.symmetric(
                  horizontal: compact ? 20 : 28,
                  vertical: compact ? 28 : 36,
                ),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.92),
                  borderRadius: BorderRadius.circular(28),
                  boxShadow: [
                    BoxShadow(
                      color: primaryBlue.withValues(alpha: 0.10),
                      blurRadius: 30,
                      offset: const Offset(0, 16),
                    ),
                  ],
                  border: Border.all(
                    color: primaryBlue.withValues(alpha: 0.08),
                    width: 1.2,
                  ),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      height: compact ? 84 : 96,
                      width: compact ? 84 : 96,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: softBlue,
                        border: Border.all(
                          color: primaryBlue.withValues(alpha: 0.12),
                          width: 1.5,
                        ),
                      ),
                      child: const Icon(
                        Icons.local_hospital_rounded,
                        size: 42,
                        color: primaryBlue,
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      "VitalKey",
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: compact ? 26 : 30,
                        fontWeight: FontWeight.w700,
                        color: textDark,
                        letterSpacing: 0.3,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      "Smart, secure, and simple access to your medical care.",
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: compact ? 13.5 : 14.5,
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
                            color: message.contains("No network") ||
                                    message.contains("not reachable")
                                ? Colors.redAccent
                                : deepBlue,
                            fontWeight: FontWeight.w500,
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                    if (showRetry) ...[
                      const SizedBox(height: 18),
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton(
                          onPressed: startApp,
                          style: OutlinedButton.styleFrom(
                            foregroundColor: primaryBlue,
                            side: BorderSide(
                              color: primaryBlue.withValues(alpha: 0.24),
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                          child: const Text(
                            "Retry",
                            style: TextStyle(fontWeight: FontWeight.w600),
                          ),
                        ),
                      ),
                    ],
                    const SizedBox(height: 28),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 10,
                      ),
                      decoration: BoxDecoration(
                        color: softBlue.withValues(alpha: 0.75),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(
                            Icons.favorite_outline_rounded,
                            size: 18,
                            color: primaryBlue,
                          ),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              "Online access to your appointments and records",
                              style: TextStyle(
                                fontSize: 12.5,
                                color: textSoft,
                                fontWeight: FontWeight.w500,
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
