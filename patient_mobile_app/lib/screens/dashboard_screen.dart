import 'package:flutter/material.dart';

import '../services/auth_service.dart';
import 'book_appointment_screen.dart';
import 'doctor_availability_screen.dart';
import 'my_appointments_screen.dart';
import 'profile_screen.dart';
import 'request_medicines_screen.dart';

class DashboardScreen extends StatefulWidget {
  final String patientName;
  final String mobileNumber;
  final String patientId;

  const DashboardScreen({
    super.key,
    required this.patientName,
    required this.mobileNumber,
    required this.patientId,
  });

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final AuthService _authService = AuthService();
  late String currentPatientName;
  late String currentMobileNumber;
  late String currentPatientId;

  static const Color _primaryBlue = Color(0xFF2563EB);
  static const Color _secondaryBlue = Color(0xFF1D4ED8);
  static const Color _textDark = Color(0xFF0F172A);
  static const Color _textSoft = Color(0xFF64748B);

  @override
  void initState() {
    super.initState();
    currentPatientName = widget.patientName;
    currentMobileNumber = widget.mobileNumber;
    currentPatientId = widget.patientId;
  }

  Future<void> _openProfile(BuildContext context) async {
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ProfileScreen(mobileNumber: currentMobileNumber),
      ),
    );

    final session = await _authService.getSession();
    if (!mounted || session == null) return;

    setState(() {
      currentPatientName =
          (session["patient_name"] ?? currentPatientName).toString();
      currentMobileNumber =
          (session["mobile_number"] ?? currentMobileNumber).toString();
      currentPatientId = (session["patient_id"] ?? currentPatientId).toString();
    });
  }

  Widget _buildActionCard({
    required BuildContext context,
    required String title,
    required String subtitle,
    required IconData icon,
    required VoidCallback onTap,
    required bool compact,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(24),
        onTap: onTap,
        child: Ink(
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.95),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: _primaryBlue.withOpacity(0.06), width: 1),
            boxShadow: [
              BoxShadow(
                color: _primaryBlue.withOpacity(0.08),
                blurRadius: 18,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Padding(
            padding: EdgeInsets.all(compact ? 16 : 18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: compact ? 46 : 52,
                  height: compact ? 46 : 52,
                  decoration: BoxDecoration(
                    color: _primaryBlue.withOpacity(0.10),
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: Icon(icon, color: _primaryBlue, size: compact ? 24 : 28),
                ),
                SizedBox(height: compact ? 12 : 16),
                Text(
                  title,
                  style: TextStyle(
                    fontSize: compact ? 15 : 16,
                    fontWeight: FontWeight.w700,
                    color: _textDark,
                  ),
                ),
                SizedBox(height: compact ? 6 : 8),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: compact ? 12.5 : 13,
                    height: 1.45,
                    color: _textSoft,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar(BuildContext context) {
    return PreferredSize(
      preferredSize: const Size.fromHeight(120),
      child: AppBar(
        automaticallyImplyLeading: false,
        elevation: 0,
        backgroundColor: Colors.transparent,
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [_primaryBlue, _secondaryBlue],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.vertical(bottom: Radius.circular(28)),
            boxShadow: [
              BoxShadow(
                color: Colors.black26,
                blurRadius: 12,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Container(
                    height: 54,
                    width: 54,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.18),
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: const Icon(
                      Icons.favorite_rounded,
                      color: Colors.white,
                      size: 28,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          "VitalKey",
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.4,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          "Welcome back, $currentPatientName",
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.90),
                            fontSize: 13.5,
                            fontWeight: FontWeight.w400,
                          ),
                        ),
                      ],
                    ),
                  ),
                  InkWell(
                    borderRadius: BorderRadius.circular(30),
                    onTap: () => _openProfile(context),
                    child: Container(
                      padding: const EdgeInsets.all(3),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: Colors.white.withOpacity(0.35),
                          width: 1.4,
                        ),
                      ),
                      child: CircleAvatar(
                        radius: 21,
                        backgroundColor: Colors.white.withOpacity(0.18),
                        child: const Icon(
                          Icons.person,
                          color: Colors.white,
                          size: 24,
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
    );
  }

  @override
  Widget build(BuildContext context) {
    final compact = MediaQuery.of(context).size.width < 360;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FBFF),
      appBar: _buildAppBar(context),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFF8FBFF), Color(0xFFEEF6FF), Color(0xFFE3F0FF)],
          ),
        ),
        child: SafeArea(
          top: false,
          child: LayoutBuilder(
            builder: (context, constraints) {
              final useSingleColumn = constraints.maxWidth < 360;
              return SingleChildScrollView(
                padding: EdgeInsets.fromLTRB(
                  compact ? 14 : 18,
                  compact ? 14 : 18,
                  compact ? 14 : 18,
                  16,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: double.infinity,
                      padding: EdgeInsets.all(compact ? 16 : 18),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.94),
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(
                            color: _primaryBlue.withOpacity(0.08),
                            blurRadius: 18,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            "Today with VitalKey",
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: _textDark,
                            ),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            "Book consultations, review your appointments, request medicines, and keep your health profile updated in one place.",
                            style: TextStyle(
                              fontSize: 13.5,
                              height: 1.5,
                              color: _textSoft,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: _primaryBlue.withOpacity(0.08),
                              borderRadius: BorderRadius.circular(18),
                            ),
                            child: Row(
                              children: [
                                const Icon(
                                  Icons.badge_outlined,
                                  color: _primaryBlue,
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        "Patient ID",
                                        style: TextStyle(
                                          fontSize: 12.5,
                                          color: _textSoft,
                                        ),
                                      ),
                                      const SizedBox(height: 3),
                                      Text(
                                        currentPatientId.isEmpty
                                            ? "-"
                                            : currentPatientId,
                                        style: TextStyle(
                                          fontSize: compact ? 15 : 16.5,
                                          fontWeight: FontWeight.w700,
                                          color: _textDark,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 22),
                    const Text(
                      "Quick Actions",
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: _textDark,
                      ),
                    ),
                    const SizedBox(height: 14),
                    Wrap(
                      spacing: 14,
                      runSpacing: 14,
                      children: [
                        SizedBox(
                          width: useSingleColumn
                              ? double.infinity
                              : (constraints.maxWidth -
                                        (compact ? 28 : 36) -
                                        14) /
                                    2,
                          child: _buildActionCard(
                            context: context,
                            title: "Book Appointment",
                            subtitle:
                                "Schedule a consultation and receive your queue number.",
                            icon: Icons.calendar_today_rounded,
                            compact: compact,
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => BookAppointmentScreen(
                                    mobileNumber: currentMobileNumber,
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                        SizedBox(
                          width: useSingleColumn
                              ? double.infinity
                              : (constraints.maxWidth -
                                        (compact ? 28 : 36) -
                                        14) /
                                    2,
                          child: _buildActionCard(
                            context: context,
                            title: "My Appointments",
                            subtitle:
                                "View your booked consultations and appointment status.",
                            icon: Icons.event_note_rounded,
                            compact: compact,
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => MyAppointmentsScreen(
                                    mobileNumber: currentMobileNumber,
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                        SizedBox(
                          width: useSingleColumn
                              ? double.infinity
                              : (constraints.maxWidth -
                                        (compact ? 28 : 36) -
                                        14) /
                                    2,
                          child: _buildActionCard(
                            context: context,
                            title: "Request Medicines",
                            subtitle:
                                "Submit a medicine request and track release updates.",
                            icon: Icons.medication_rounded,
                            compact: compact,
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => RequestMedicinesScreen(
                                    mobileNumber: currentMobileNumber,
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                        SizedBox(
                          width: useSingleColumn
                              ? double.infinity
                              : (constraints.maxWidth -
                                        (compact ? 28 : 36) -
                                        14) /
                                    2,
                          child: _buildActionCard(
                            context: context,
                            title: "Doctor Availability",
                            subtitle:
                                "Check which doctors are currently available for consultation.",
                            icon: Icons.local_hospital_rounded,
                            compact: compact,
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) =>
                                      const DoctorAvailabilityScreen(),
                                ),
                              );
                            },
                          ),
                        ),
                        SizedBox(
                          width: useSingleColumn
                              ? double.infinity
                              : (constraints.maxWidth -
                                        (compact ? 28 : 36) -
                                        14) /
                                    2,
                          child: _buildActionCard(
                            context: context,
                            title: "Profile",
                            subtitle:
                                "Review your patient ID, contact details, and profile photo.",
                            icon: Icons.person_rounded,
                            compact: compact,
                            onTap: () => _openProfile(context),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
