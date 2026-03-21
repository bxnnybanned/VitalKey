import 'package:flutter/material.dart';

import '../services/auth_service.dart';

class MyAppointmentsScreen extends StatefulWidget {
  final String mobileNumber;

  const MyAppointmentsScreen({super.key, required this.mobileNumber});

  @override
  State<MyAppointmentsScreen> createState() => _MyAppointmentsScreenState();
}

class _MyAppointmentsScreenState extends State<MyAppointmentsScreen> {
  final AuthService _authService = AuthService();

  List<dynamic> appointments = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    loadAppointments();
  }

  Future<void> loadAppointments() async {
    try {
      final result = await _authService.getMyAppointments(
        mobileNumber: widget.mobileNumber,
      );

      setState(() {
        appointments = result;
        isLoading = false;
      });
    } catch (e) {
      setState(() {
        isLoading = false;
      });

      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text("Error: $e")));
    }
  }

  Color getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case "confirmed":
      case "approved":
        return const Color(0xFF16A34A);
      case "pending":
        return const Color(0xFFF59E0B);
      case "cancelled":
      case "rejected":
        return const Color(0xFFDC2626);
      default:
        return const Color(0xFF2563EB);
    }
  }

  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF2563EB);
    const softBlue = Color(0xFFEFF6FF);
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
          child: isLoading
              ? const Center(child: CircularProgressIndicator())
              : appointments.isEmpty
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Container(
                      width: double.infinity,
                      constraints: const BoxConstraints(maxWidth: 420),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 24,
                        vertical: 30,
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
                      child: const Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.event_busy_outlined,
                            size: 54,
                            color: primaryBlue,
                          ),
                          SizedBox(height: 16),
                          Text(
                            "No Appointments Found",
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w700,
                              color: textDark,
                            ),
                          ),
                          SizedBox(height: 8),
                          Text(
                            "You do not have any appointments yet. Book your first consultation to receive your schedule and queue number.",
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 14,
                              height: 1.5,
                              color: textSoft,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                )
              : Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(22),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.94),
                          borderRadius: BorderRadius.circular(26),
                          border: Border.all(
                            color: primaryBlue.withValues(alpha: 0.08),
                            width: 1.2,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: primaryBlue.withValues(alpha: 0.10),
                              blurRadius: 24,
                              offset: const Offset(0, 12),
                            ),
                          ],
                        ),
                        child: Column(
                          children: [
                            const CircleAvatar(
                              radius: 34,
                              backgroundColor: softBlue,
                              child: Icon(
                                Icons.calendar_month_rounded,
                                size: 34,
                                color: primaryBlue,
                              ),
                            ),
                            const SizedBox(height: 16),
                            const Text(
                              "My Appointments",
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.w700,
                                color: textDark,
                              ),
                            ),
                            const SizedBox(height: 8),
                            const Text(
                              "Review your consultation schedule, queue number, and booking details anytime.",
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 14,
                                height: 1.5,
                                color: textSoft,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    Expanded(
                      child: ListView.builder(
                        padding: const EdgeInsets.fromLTRB(20, 6, 20, 20),
                        itemCount: appointments.length,
                        itemBuilder: (context, index) {
                          final item = appointments[index];
                          final status = (item["status"] ?? "Unknown")
                              .toString();
                          final statusColor = getStatusColor(status);
                          final queueNumber = item["queue_number"]?.toString();

                          return Container(
                            margin: const EdgeInsets.only(bottom: 16),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.96),
                              borderRadius: BorderRadius.circular(22),
                              border: Border.all(
                                color: primaryBlue.withValues(alpha: 0.06),
                                width: 1,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: primaryBlue.withValues(alpha: 0.08),
                                  blurRadius: 18,
                                  offset: const Offset(0, 8),
                                ),
                              ],
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(18),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  if (queueNumber != null &&
                                      queueNumber.isNotEmpty &&
                                      queueNumber != "-") ...[
                                    Container(
                                      width: double.infinity,
                                      margin: const EdgeInsets.only(bottom: 14),
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 14,
                                        vertical: 12,
                                      ),
                                      decoration: BoxDecoration(
                                        color: softBlue,
                                        borderRadius: BorderRadius.circular(16),
                                      ),
                                      child: Row(
                                        children: [
                                          const Icon(
                                            Icons.confirmation_number_outlined,
                                            color: primaryBlue,
                                            size: 18,
                                          ),
                                          const SizedBox(width: 10),
                                          const Text(
                                            "Queue Number",
                                            style: TextStyle(
                                              fontSize: 13,
                                              fontWeight: FontWeight.w600,
                                              color: textSoft,
                                            ),
                                          ),
                                          const Spacer(),
                                          Text(
                                            queueNumber,
                                            style: const TextStyle(
                                              fontSize: 18,
                                              fontWeight: FontWeight.w700,
                                              color: textDark,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                  Row(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(12),
                                        decoration: BoxDecoration(
                                          color: softBlue,
                                          borderRadius: BorderRadius.circular(
                                            14,
                                          ),
                                        ),
                                        child: const Icon(
                                          Icons.local_hospital_outlined,
                                          color: primaryBlue,
                                          size: 24,
                                        ),
                                      ),
                                      const SizedBox(width: 14),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              item["doctor_name"] ?? "Doctor",
                                              style: const TextStyle(
                                                fontSize: 17,
                                                fontWeight: FontWeight.w700,
                                                color: textDark,
                                              ),
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              item["specialization"]?.toString() ??
                                                  "General Consultation",
                                              style: const TextStyle(
                                                fontSize: 13,
                                                color: textSoft,
                                              ),
                                            ),
                                            const SizedBox(height: 8),
                                            Container(
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                    horizontal: 10,
                                                    vertical: 5,
                                                  ),
                                              decoration: BoxDecoration(
                                                color: statusColor.withValues(
                                                  alpha: 0.12,
                                                ),
                                                borderRadius:
                                                    BorderRadius.circular(999),
                                              ),
                                              child: Text(
                                                status,
                                                style: TextStyle(
                                                  color: statusColor,
                                                  fontSize: 12.5,
                                                  fontWeight: FontWeight.w600,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 18),
                                  Container(
                                    padding: const EdgeInsets.all(14),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF8FBFF),
                                      borderRadius: BorderRadius.circular(16),
                                      border: Border.all(color: borderColor),
                                    ),
                                    child: Column(
                                      children: [
                                        _infoRow(
                                          icon: Icons.calendar_today,
                                          label: "Date",
                                          value:
                                              item["appointment_date"]
                                                  ?.toString() ??
                                              "-",
                                        ),
                                        const SizedBox(height: 12),
                                        _infoRow(
                                          icon: Icons.access_time_rounded,
                                          label: "Time",
                                          value:
                                              item["appointment_time"]
                                                  ?.toString() ??
                                              "-",
                                        ),
                                        const SizedBox(height: 12),
                                        _infoRow(
                                          icon: Icons
                                              .confirmation_number_outlined,
                                          label: "Queue",
                                          value: queueNumber ?? "-",
                                        ),
                                        const SizedBox(height: 12),
                                        _infoRow(
                                          icon: Icons.notes_rounded,
                                          label: "Reason",
                                          value:
                                              item["reason"]?.toString() ?? "-",
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }

  Widget _infoRow({
    required IconData icon,
    required String label,
    required String value,
  }) {
    const primaryBlue = Color(0xFF2563EB);
    const textDark = Color(0xFF0F172A);
    const textSoft = Color(0xFF64748B);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: primaryBlue),
        const SizedBox(width: 10),
        SizedBox(
          width: 56,
          child: Text(
            "$label:",
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: textSoft,
            ),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 13.5,
              height: 1.4,
              color: textDark,
            ),
          ),
        ),
      ],
    );
  }
}
