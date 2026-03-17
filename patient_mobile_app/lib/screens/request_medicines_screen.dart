import 'package:flutter/material.dart';
import '../services/auth_service.dart';

class RequestMedicinesScreen extends StatefulWidget {
  final String mobileNumber;

  const RequestMedicinesScreen({super.key, required this.mobileNumber});

  @override
  State<RequestMedicinesScreen> createState() => _RequestMedicinesScreenState();
}

class _RequestMedicinesScreenState extends State<RequestMedicinesScreen> {
  final AuthService _authService = AuthService();

  List<dynamic> medicines = [];
  List<dynamic> requests = [];

  int? selectedMedicineId;
  final quantityController = TextEditingController();
  final reasonController = TextEditingController();

  bool isLoading = true;
  bool isSubmitting = false;

  static const Color _primaryBlue = Color(0xFF2F6BFF);
  static const Color _deepBlue = Color(0xFF123D91);
  static const Color _softBlue = Color(0xFFEFF4FF);
  static const Color _background = Color(0xFFF7FAFF);
  static const Color _textDark = Color(0xFF1B263B);
  static const Color _textMuted = Color(0xFF6B7A99);

  @override
  void initState() {
    super.initState();
    loadData();
  }

  Future<void> loadData() async {
    try {
      final meds = await _authService.getMedicines();
      final reqs = await _authService.getPatientMedicineRequests(
        mobileNumber: widget.mobileNumber,
      );

      setState(() {
        medicines = meds;
        requests = reqs;
        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Error: $e"),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> submitRequest() async {
    if (selectedMedicineId == null || quantityController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a medicine and enter quantity.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    final qty = int.tryParse(quantityController.text.trim());
    if (qty == null || qty <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Quantity must be a valid positive number.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    setState(() => isSubmitting = true);

    try {
      final result = await _authService.requestMedicine(
        mobileNumber: widget.mobileNumber,
        medicineId: selectedMedicineId!,
        quantity: qty,
        reason: reasonController.text.trim(),
      );

      if (!mounted) return;

      if (result["request_code"] != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result["message"] ?? "Medicine request submitted"),
            behavior: SnackBarBehavior.floating,
          ),
        );

        quantityController.clear();
        reasonController.clear();

        setState(() {
          selectedMedicineId = null;
        });

        await loadData();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result["detail"] ?? "Failed to submit request"),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Error: $e"),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => isSubmitting = false);
      }
    }
  }

  InputDecoration _inputDecoration({
    required String label,
    required IconData icon,
  }) {
    return InputDecoration(
      labelText: label,
      labelStyle: const TextStyle(color: _textMuted),
      prefixIcon: Icon(icon, color: _primaryBlue),
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: BorderSide(color: Colors.blue.shade50),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: const BorderSide(color: _primaryBlue, width: 1.4),
      ),
    );
  }

  Color _statusColor(String status) {
    final normalized = status.toLowerCase();

    if (normalized.contains('approved')) return const Color(0xFF1F9D55);
    if (normalized.contains('pending')) return const Color(0xFFF59E0B);
    if (normalized.contains('rejected')) return const Color(0xFFDC2626);

    return _deepBlue;
  }

  Color _statusBackground(String status) {
    final normalized = status.toLowerCase();

    if (normalized.contains('approved')) return const Color(0xFFEAF8EF);
    if (normalized.contains('pending')) return const Color(0xFFFFF6E5);
    if (normalized.contains('rejected')) return const Color(0xFFFDECEC);

    return _softBlue;
  }

  @override
  void dispose() {
    quantityController.dispose();
    reasonController.dispose();
    super.dispose();
  }

  Widget _buildBackground() {
    return Stack(
      children: [
        Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFFF8FBFF), Color(0xFFF3F7FF), Color(0xFFEEF4FF)],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ),
          ),
        ),
        Positioned(
          top: -80,
          right: -40,
          child: Container(
            width: 220,
            height: 220,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: _primaryBlue.withOpacity(0.10),
            ),
          ),
        ),
        Positioned(
          top: 120,
          left: -70,
          child: Container(
            width: 180,
            height: 180,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: _deepBlue.withOpacity(0.07),
            ),
          ),
        ),
        Positioned(
          bottom: 100,
          right: -50,
          child: Container(
            width: 170,
            height: 170,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: _primaryBlue.withOpacity(0.06),
            ),
          ),
        ),
        Positioned(
          top: 0,
          left: 0,
          right: 0,
          child: Container(
            height: 220,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [_primaryBlue.withOpacity(0.08), Colors.transparent],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _background,
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        title: const Text(
          'Request Medicines',
          style: TextStyle(color: _textDark, fontWeight: FontWeight.w700),
        ),
        iconTheme: const IconThemeData(color: _textDark),
      ),
      body: Stack(
        children: [
          _buildBackground(),
          isLoading
              ? const Center(
                  child: CircularProgressIndicator(
                    color: _primaryBlue,
                    strokeWidth: 3,
                  ),
                )
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(22),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [_primaryBlue, _deepBlue],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(28),
                          boxShadow: [
                            BoxShadow(
                              color: _primaryBlue.withOpacity(0.18),
                              blurRadius: 22,
                              offset: const Offset(0, 10),
                            ),
                          ],
                        ),
                        child: Column(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(18),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.16),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: const Icon(
                                Icons.medication_liquid_rounded,
                                color: Colors.white,
                                size: 34,
                              ),
                            ),
                            const SizedBox(height: 16),
                            const Text(
                              'Medicine Request',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 22,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Request medicines from the health center and monitor the status of each request in one place.',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: Colors.white.withOpacity(0.9),
                                fontSize: 13.5,
                                height: 1.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 22),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.78),
                          borderRadius: BorderRadius.circular(26),
                          border: Border.all(
                            color: Colors.white.withOpacity(0.55),
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.04),
                              blurRadius: 16,
                              offset: const Offset(0, 6),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Request Form',
                              style: TextStyle(
                                color: _textDark,
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: 6),
                            const Text(
                              'Choose the medicine, enter the quantity, and add a short note if needed.',
                              style: TextStyle(
                                color: _textMuted,
                                fontSize: 13.5,
                              ),
                            ),
                            const SizedBox(height: 18),
                            DropdownButtonFormField<int>(
                              value: selectedMedicineId,
                              isExpanded: true,
                              menuMaxHeight: 300,
                              items: medicines.map<DropdownMenuItem<int>>((
                                medicine,
                              ) {
                                final String name =
                                    medicine["name"]?.toString() ?? "Medicine";
                                final String stock =
                                    medicine["stock_quantity"]?.toString() ??
                                    "0";

                                return DropdownMenuItem<int>(
                                  value: medicine["medicine_id"],
                                  child: SizedBox(
                                    width: double.infinity,
                                    child: Text(
                                      '$name (Stock: $stock)',
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                        color: _textDark,
                                        fontSize: 14,
                                        height: 1.3,
                                      ),
                                    ),
                                  ),
                                );
                              }).toList(),
                              selectedItemBuilder: (context) {
                                return medicines.map<Widget>((medicine) {
                                  final String name =
                                      medicine["name"]?.toString() ??
                                      "Medicine";

                                  return Align(
                                    alignment: Alignment.centerLeft,
                                    child: Text(
                                      name,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                        color: _textDark,
                                        fontSize: 14,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  );
                                }).toList();
                              },
                              onChanged: (value) {
                                setState(() {
                                  selectedMedicineId = value;
                                });
                              },
                              decoration: _inputDecoration(
                                label: 'Medicine',
                                icon: Icons.medication_outlined,
                              ),
                              dropdownColor: Colors.white,
                              borderRadius: BorderRadius.circular(18),
                              icon: const Icon(
                                Icons.keyboard_arrow_down_rounded,
                                color: _primaryBlue,
                              ),
                            ),
                            const SizedBox(height: 12),
                            TextField(
                              controller: quantityController,
                              keyboardType: TextInputType.number,
                              decoration: _inputDecoration(
                                label: 'Quantity',
                                icon: Icons.format_list_numbered_rounded,
                              ),
                            ),
                            const SizedBox(height: 12),
                            TextField(
                              controller: reasonController,
                              maxLines: 4,
                              decoration: _inputDecoration(
                                label: 'Reason or Note',
                                icon: Icons.edit_note_rounded,
                              ),
                            ),
                            const SizedBox(height: 18),
                            SizedBox(
                              width: double.infinity,
                              height: 52,
                              child: ElevatedButton(
                                onPressed: isSubmitting ? null : submitRequest,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: _primaryBlue,
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
                                          color: Colors.white,
                                        ),
                                      )
                                    : const Text(
                                        'Send Request',
                                        style: TextStyle(
                                          fontSize: 15,
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                      Row(
                        children: [
                          const Icon(
                            Icons.history_rounded,
                            color: _primaryBlue,
                            size: 22,
                          ),
                          const SizedBox(width: 8),
                          const Text(
                            'My Medicine Requests',
                            style: TextStyle(
                              fontSize: 19,
                              fontWeight: FontWeight.w700,
                              color: _textDark,
                            ),
                          ),
                          const Spacer(),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: _softBlue,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              '${requests.length}',
                              style: const TextStyle(
                                color: _deepBlue,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      if (requests.isEmpty)
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(28),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.90),
                            borderRadius: BorderRadius.circular(24),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.04),
                                blurRadius: 16,
                                offset: const Offset(0, 6),
                              ),
                            ],
                          ),
                          child: Column(
                            children: const [
                              Icon(
                                Icons.inventory_2_outlined,
                                size: 42,
                                color: _primaryBlue,
                              ),
                              SizedBox(height: 12),
                              Text(
                                'No medicine requests found.',
                                style: TextStyle(
                                  color: _textDark,
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              SizedBox(height: 8),
                              Text(
                                'Your submitted requests will appear here once they are sent to the health center.',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  color: _textMuted,
                                  fontSize: 13.5,
                                  height: 1.45,
                                ),
                              ),
                            ],
                          ),
                        )
                      else
                        ...requests.map((request) {
                          final status =
                              request["status"]?.toString() ?? "Pending";

                          return Container(
                            margin: const EdgeInsets.only(bottom: 14),
                            padding: const EdgeInsets.all(18),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.90),
                              borderRadius: BorderRadius.circular(22),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.04),
                                  blurRadius: 16,
                                  offset: const Offset(0, 6),
                                ),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      width: 52,
                                      height: 52,
                                      decoration: BoxDecoration(
                                        color: _softBlue,
                                        borderRadius: BorderRadius.circular(16),
                                      ),
                                      child: const Icon(
                                        Icons.medication_rounded,
                                        color: _primaryBlue,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Text(
                                        request["medicine_name"] ?? "Medicine",
                                        style: const TextStyle(
                                          color: _textDark,
                                          fontSize: 16,
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 10,
                                        vertical: 6,
                                      ),
                                      decoration: BoxDecoration(
                                        color: _statusBackground(status),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        status,
                                        style: TextStyle(
                                          color: _statusColor(status),
                                          fontSize: 12,
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 14),
                                _buildDetailRow(
                                  Icons.format_list_numbered_rounded,
                                  'Quantity',
                                  '${request["quantity"]}',
                                ),
                                const SizedBox(height: 10),
                                _buildDetailRow(
                                  Icons.sticky_note_2_outlined,
                                  'Reason',
                                  '${request["reason"] ?? "-"}',
                                ),
                                const SizedBox(height: 10),
                                _buildDetailRow(
                                  Icons.calendar_month_outlined,
                                  'Requested',
                                  '${request["requested_at"]}',
                                ),
                              ],
                            ),
                          );
                        }),
                    ],
                  ),
                ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: _textMuted),
        const SizedBox(width: 8),
        Text(
          '$label: ',
          style: const TextStyle(color: _textDark, fontWeight: FontWeight.w600),
        ),
        Expanded(
          child: Text(
            value.isEmpty ? '-' : value,
            style: const TextStyle(color: _textMuted, height: 1.4),
          ),
        ),
      ],
    );
  }
}
