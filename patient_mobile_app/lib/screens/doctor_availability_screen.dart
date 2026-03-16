import 'package:flutter/material.dart';
import '../services/auth_service.dart';

class DoctorAvailabilityScreen extends StatefulWidget {
  const DoctorAvailabilityScreen({super.key});

  @override
  State<DoctorAvailabilityScreen> createState() =>
      _DoctorAvailabilityScreenState();
}

class _DoctorAvailabilityScreenState extends State<DoctorAvailabilityScreen> {
  final AuthService _authService = AuthService();

  List<dynamic> doctors = [];
  bool isLoading = true;

  static const Color _primaryBlue = Color(0xFF2F6BFF);
  static const Color _softBlue = Color(0xFFEFF4FF);
  static const Color _deepBlue = Color(0xFF123D91);
  static const Color _textDark = Color(0xFF1B263B);
  static const Color _textMuted = Color(0xFF6B7A99);
  static const Color _background = Color(0xFFF7FAFF);

  @override
  void initState() {
    super.initState();
    loadDoctors();
  }

  Future<void> loadDoctors() async {
    try {
      final result = await _authService.getAvailableDoctors();
      setState(() {
        doctors = result;
        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Error: $e"),
          backgroundColor: Colors.red.shade400,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _background,
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        centerTitle: false,
        title: const Text(
          'Doctor Availability',
          style: TextStyle(
            color: _textDark,
            fontSize: 22,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.2,
          ),
        ),
      ),
      body: SafeArea(
        child: isLoading
            ? const Center(
                child: CircularProgressIndicator(
                  color: _primaryBlue,
                  strokeWidth: 3,
                ),
              )
            : doctors.isEmpty
            ? _buildEmptyState()
            : Column(
                children: [
                  _buildHeaderSection(),
                  const SizedBox(height: 12),
                  Expanded(
                    child: ListView.builder(
                      padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                      itemCount: doctors.length,
                      itemBuilder: (context, index) {
                        final doctor = doctors[index];
                        return _buildDoctorCard(doctor);
                      },
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _buildHeaderSection() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 8),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [_primaryBlue, _deepBlue],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(22),
          boxShadow: [
            BoxShadow(
              color: _primaryBlue.withOpacity(0.18),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.16),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Icon(
                Icons.medical_services_outlined,
                color: Colors.white,
                size: 28,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Available Doctors',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${doctors.length} doctor${doctors.length > 1 ? 's' : ''} ready for consultation',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.9),
                      fontSize: 13,
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDoctorCard(dynamic doctor) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 58,
              height: 58,
              decoration: BoxDecoration(
                color: _softBlue,
                borderRadius: BorderRadius.circular(18),
              ),
              child: const Icon(
                Icons.person_rounded,
                color: _primaryBlue,
                size: 30,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    doctor["full_name"] ?? "Doctor",
                    style: const TextStyle(
                      color: _textDark,
                      fontSize: 17,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: _softBlue,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      doctor["specialization"] ?? "General Medicine",
                      style: const TextStyle(
                        color: _deepBlue,
                        fontSize: 12.5,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Icon(Icons.schedule_rounded, size: 16, color: _textMuted),
                      SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          'Monday to Friday, 8:00 AM - 5:00 PM',
                          style: TextStyle(
                            color: _textMuted,
                            fontSize: 13.5,
                            height: 1.4,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFE9F8EF),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Text(
                'Available',
                style: TextStyle(
                  color: Color(0xFF1F9D55),
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 28),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                color: _softBlue,
                borderRadius: BorderRadius.circular(24),
              ),
              child: const Icon(
                Icons.medical_information_outlined,
                size: 44,
                color: _primaryBlue,
              ),
            ),
            const SizedBox(height: 18),
            const Text(
              'No available doctors found',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: _textDark,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Please check again later for updated doctor availability.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: _textMuted, height: 1.5),
            ),
          ],
        ),
      ),
    );
  }
}
