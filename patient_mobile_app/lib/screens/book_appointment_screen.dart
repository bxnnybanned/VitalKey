import 'package:flutter/material.dart';
import '../services/auth_service.dart';

class BookAppointmentScreen extends StatefulWidget {
  final String mobileNumber;

  const BookAppointmentScreen({super.key, required this.mobileNumber});

  @override
  State<BookAppointmentScreen> createState() => _BookAppointmentScreenState();
}

class _BookAppointmentScreenState extends State<BookAppointmentScreen> {
  final AuthService _authService = AuthService();

  final reasonController = TextEditingController();

  List<dynamic> doctors = [];
  List<dynamic> availableSlots = [];

  int? selectedDoctorId;
  String? selectedTimeSlot;

  bool isLoadingDoctors = true;
  bool isLoadingSlots = false;
  bool isSubmitting = false;

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
        isLoadingDoctors = false;
      });
    } catch (e) {
      setState(() {
        isLoadingDoctors = false;
      });

      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text("Error loading doctors: $e")));
    }
  }

  Future<void> loadSlots(int doctorId) async {
    setState(() {
      isLoadingSlots = true;
      availableSlots = [];
      selectedTimeSlot = null;
    });

    try {
      final result = await _authService.getAvailableSlots(doctorId: doctorId);

      setState(() {
        availableSlots = result["available_slots"] ?? [];
        isLoadingSlots = false;
      });
    } catch (e) {
      setState(() {
        isLoadingSlots = false;
      });

      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text("Error loading slots: $e")));
    }
  }

  Future<void> submitAppointment() async {
    if (selectedDoctorId == null ||
        selectedTimeSlot == null ||
        reasonController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please complete all required fields.')),
      );
      return;
    }

    setState(() => isSubmitting = true);

    try {
      final result = await _authService.bookAppointment(
        mobileNumber: widget.mobileNumber,
        doctorId: selectedDoctorId!,
        appointmentTime: selectedTimeSlot!,
        reason: reasonController.text.trim(),
      );

      if (!mounted) return;

      if (result["appointment_code"] != null) {
        showDialog(
          context: context,
          builder: (_) => AlertDialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(22),
            ),
            title: const Text(
              'Appointment Confirmed',
              style: TextStyle(fontWeight: FontWeight.w700),
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Doctor: ${result["doctor_name"]}'),
                const SizedBox(height: 6),
                Text('Date: ${result["appointment_date"]}'),
                const SizedBox(height: 6),
                Text('Time: ${result["appointment_time"]}'),
                const SizedBox(height: 6),
                Text('Status: ${result["status"]}'),
                const SizedBox(height: 6),
                Text('Queue Number: ${result["queue_number"]}'),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.pop(context);
                  Navigator.pop(context);
                },
                child: const Text('Done'),
              ),
            ],
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result["detail"] ?? "Failed to book appointment"),
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text("Error: $e")));
    } finally {
      if (mounted) {
        setState(() => isSubmitting = false);
      }
    }
  }

  @override
  void dispose() {
    reasonController.dispose();
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
          child: isLoadingDoctors
              ? const Center(child: CircularProgressIndicator())
              : Center(
                  child: SingleChildScrollView(
                    padding: EdgeInsets.symmetric(
                      horizontal: compact ? 14 : 18,
                      vertical: compact ? 18 : 24,
                    ),
                    child: Container(
                      width: double.infinity,
                      constraints: const BoxConstraints(maxWidth: 460),
                      padding: EdgeInsets.symmetric(
                        horizontal: compact ? 16 : 20,
                        vertical: compact ? 24 : 30,
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
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Center(
                            child: Container(
                              height: compact ? 72 : 82,
                              width: compact ? 72 : 82,
                              decoration: BoxDecoration(
                                color: softBlue,
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: primaryBlue.withOpacity(0.12),
                                  width: 1.4,
                                ),
                              ),
                              child: const Icon(
                                Icons.calendar_month_rounded,
                                size: 36,
                                color: primaryBlue,
                              ),
                            ),
                          ),
                          const SizedBox(height: 20),
                          Center(
                            child: Text(
                              'Book Appointment',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: compact ? 24 : 28,
                                fontWeight: FontWeight.w700,
                                color: textDark,
                              ),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Center(
                            child: Text(
                              'Choose your doctor, select an available schedule, and submit your reason for visit.',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: compact ? 13 : 14,
                                height: 1.5,
                                color: textSoft,
                              ),
                            ),
                          ),
                          const SizedBox(height: 28),

                          Text(
                            'Select Doctor',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: deepBlue.withOpacity(0.90),
                            ),
                          ),
                          const SizedBox(height: 8),
                          DropdownButtonFormField<int>(
                            value: selectedDoctorId,
                            isExpanded: true,
                            borderRadius: BorderRadius.circular(18),
                            items: doctors.map<DropdownMenuItem<int>>((doctor) {
                              final doctorLabel =
                                  '${doctor["full_name"]} - ${doctor["specialization"]}';

                              return DropdownMenuItem<int>(
                                value: doctor["doctor_id"],
                                child: Text(
                                  doctorLabel,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              );
                            }).toList(),
                            selectedItemBuilder: (context) {
                              return doctors.map<Widget>((doctor) {
                                final doctorLabel =
                                    '${doctor["full_name"]} - ${doctor["specialization"]}';

                                return Align(
                                  alignment: Alignment.centerLeft,
                                  child: Text(
                                    doctorLabel,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(color: textDark),
                                  ),
                                );
                              }).toList();
                            },
                            onChanged: (value) {
                              setState(() {
                                selectedDoctorId = value;
                              });

                              if (value != null) {
                                loadSlots(value);
                              }
                            },
                            decoration: InputDecoration(
                              hintText: 'Choose a doctor',
                              hintStyle: const TextStyle(color: textSoft),
                              prefixIcon: const Icon(
                                Icons.medical_services_outlined,
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
                                borderSide: const BorderSide(
                                  color: borderColor,
                                ),
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

                          Text(
                            'Available Time Slot',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: deepBlue.withOpacity(0.90),
                            ),
                          ),
                          const SizedBox(height: 8),

                          if (isLoadingSlots)
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.symmetric(vertical: 18),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFDFEFF),
                                borderRadius: BorderRadius.circular(18),
                                border: Border.all(color: borderColor),
                              ),
                              child: const Center(
                                child: CircularProgressIndicator(),
                              ),
                            )
                          else if (selectedDoctorId != null)
                            DropdownButtonFormField<String>(
                              value: selectedTimeSlot,
                              isExpanded: true,
                              borderRadius: BorderRadius.circular(18),
                              items: availableSlots
                                  .map<DropdownMenuItem<String>>((slot) {
                                    return DropdownMenuItem<String>(
                                      value: slot.toString(),
                                      child: Text(
                                        slot.toString(),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    );
                                  })
                                  .toList(),
                              onChanged: (value) {
                                setState(() {
                                  selectedTimeSlot = value;
                                });
                              },
                              decoration: InputDecoration(
                                hintText: 'Choose an available slot',
                                hintStyle: const TextStyle(color: textSoft),
                                prefixIcon: const Icon(
                                  Icons.access_time_rounded,
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
                                  borderSide: const BorderSide(
                                    color: borderColor,
                                  ),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(18),
                                  borderSide: const BorderSide(
                                    color: primaryBlue,
                                    width: 1.4,
                                  ),
                                ),
                              ),
                            )
                          else
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 16,
                              ),
                              decoration: BoxDecoration(
                                color: softBlue.withOpacity(0.55),
                                borderRadius: BorderRadius.circular(18),
                              ),
                              child: const Text(
                                'Please select a doctor first to view available time slots.',
                                style: TextStyle(
                                  color: textSoft,
                                  fontSize: 13,
                                  height: 1.4,
                                ),
                              ),
                            ),

                          const SizedBox(height: 18),

                          Text(
                            'Reason for Visit',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: deepBlue.withOpacity(0.90),
                            ),
                          ),
                          const SizedBox(height: 8),
                          TextField(
                            controller: reasonController,
                            maxLines: 4,
                            style: const TextStyle(color: textDark),
                            decoration: InputDecoration(
                              hintText: 'Describe your concern',
                              hintStyle: const TextStyle(color: textSoft),
                              alignLabelWithHint: true,
                              prefixIcon: const Icon(
                                Icons.edit_note_rounded,
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
                                borderSide: const BorderSide(
                                  color: borderColor,
                                ),
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
                              onPressed: isSubmitting
                                  ? null
                                  : submitAppointment,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: primaryBlue,
                                foregroundColor: Colors.white,
                                elevation: 0,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(18),
                                ),
                              ),
                              child: isSubmitting
                                  ? const SizedBox(
                                      width: 22,
                                      height: 22,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2.4,
                                        valueColor:
                                            AlwaysStoppedAnimation<Color>(
                                              Colors.white,
                                            ),
                                      ),
                                    )
                                  : const Text(
                                      'Submit Appointment',
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
                              color: softBlue.withOpacity(0.65),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: const Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Icon(
                                  Icons.info_outline_rounded,
                                  color: primaryBlue,
                                  size: 18,
                                ),
                                SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    'Valid bookings are saved in the system and a queue number is automatically assigned for your consultation.',
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
