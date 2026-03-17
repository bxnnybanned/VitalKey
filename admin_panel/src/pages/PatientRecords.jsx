import { useEffect, useState } from "react";

import { getPatientRecord, getPatients } from "../api/patientRecordsApi";

const formatDateTime = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

export default function PatientRecords() {
  const [patients, setPatients] = useState([]);
  const [selectedPatientCode, setSelectedPatientCode] = useState("");
  const [patientRecord, setPatientRecord] = useState(null);
  const [search, setSearch] = useState("");
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [error, setError] = useState("");

  const fetchPatients = async (searchValue = "") => {
    try {
      setLoadingPatients(true);
      setError("");
      const data = await getPatients(searchValue);
      setPatients(data);

      if (data.length === 0) {
        setSelectedPatientCode("");
        setPatientRecord(null);
        return;
      }

      const hasSelectedPatient = data.some(
        (patient) => patient.patient_code === selectedPatientCode,
      );

      const nextPatientCode =
        hasSelectedPatient && selectedPatientCode
          ? selectedPatientCode
          : data[0].patient_code;

      setSelectedPatientCode(nextPatientCode);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Failed to load patients.");
    } finally {
      setLoadingPatients(false);
    }
  };

  const fetchPatientRecord = async (patientCode) => {
    if (!patientCode) {
      setPatientRecord(null);
      return;
    }

    try {
      setLoadingRecord(true);
      setError("");
      const data = await getPatientRecord(patientCode);
      setPatientRecord(data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Failed to load patient record.");
    } finally {
      setLoadingRecord(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatientCode) {
      fetchPatientRecord(selectedPatientCode);
    }
  }, [selectedPatientCode]);

  const handleSearch = async (e) => {
    e.preventDefault();
    await fetchPatients(search);
  };

  return (
    <div className="admin-page">
      <section className="admin-header">
        <h1 className="admin-title">Patient Records</h1>
        <p className="admin-subtitle">
          View patient accounts from the mobile app and their recorded kiosk health data.
        </p>
      </section>

      {error && <div className="admin-alert-error">{error}</div>}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="admin-card-strong">
          <form onSubmit={handleSearch} className="mb-4 flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient ID, name, email..."
              className="admin-input"
            />
            <button
              type="submit"
              className="admin-button"
            >
              Search
            </button>
          </form>

          {loadingPatients ? (
            <p className="text-gray-500">Loading patients...</p>
          ) : patients.length === 0 ? (
            <p className="text-gray-500">No patients found.</p>
          ) : (
            <div className="space-y-3">
              {patients.map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => setSelectedPatientCode(patient.patient_code)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selectedPatientCode === patient.patient_code
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-gray-800">
                        {patient.full_name}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {patient.patient_code || "No Patient ID yet"}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        patient.is_verified
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {patient.is_verified ? "Verified" : "Pending"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-gray-500">{patient.email || "No email"}</p>
                  <p className="text-sm text-gray-500">
                    {patient.mobile_number || "No mobile number"}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="admin-card-strong">
          {loadingRecord ? (
            <p className="text-gray-500">Loading patient record...</p>
          ) : !patientRecord ? (
            <p className="text-gray-500">Select a patient to view details.</p>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {patientRecord.patient.full_name}
                </h2>
                <p className="text-gray-500">
                  Patient ID: {patientRecord.patient.patient_code || "Not assigned"}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Birthday</p>
                  <p className="mt-1 font-semibold text-gray-800">
                    {patientRecord.patient.birthday}
                  </p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Age / Sex</p>
                  <p className="mt-1 font-semibold text-gray-800">
                    {patientRecord.patient.age} / {patientRecord.patient.sex}
                  </p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Verification Status</p>
                  <p className="mt-1 font-semibold text-gray-800">
                    {patientRecord.patient.is_verified ? "Verified" : "Pending"}
                  </p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="mt-1 font-semibold text-gray-800">
                    {patientRecord.patient.email || "N/A"}
                  </p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Mobile Number</p>
                  <p className="mt-1 font-semibold text-gray-800">
                    {patientRecord.patient.mobile_number || "N/A"}
                  </p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Emergency Contact</p>
                  <p className="mt-1 font-semibold text-gray-800">
                    {patientRecord.patient.emergency_contact || "N/A"}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 p-5">
                <h3 className="mb-3 text-lg font-semibold text-gray-800">
                  Address
                </h3>
                <p className="text-gray-600">
                  {patientRecord.patient.address || "No address provided."}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 p-5">
                <h3 className="mb-4 text-lg font-semibold text-gray-800">
                  Latest Health Record
                </h3>

                {!patientRecord.latest_health_record ? (
                  <p className="text-gray-500">No health record found for this patient.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div>
                      <p className="text-sm text-gray-500">Height</p>
                      <p className="font-semibold text-gray-800">
                        {patientRecord.latest_health_record.height_cm ?? "N/A"} cm
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Weight</p>
                      <p className="font-semibold text-gray-800">
                        {patientRecord.latest_health_record.weight_kg ?? "N/A"} kg
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Temperature</p>
                      <p className="font-semibold text-gray-800">
                        {patientRecord.latest_health_record.temperature_c ?? "N/A"} C
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Blood Pressure</p>
                      <p className="font-semibold text-gray-800">
                        {patientRecord.latest_health_record.systolic_bp ?? "N/A"}/
                        {patientRecord.latest_health_record.diastolic_bp ?? "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Oxygen Saturation</p>
                      <p className="font-semibold text-gray-800">
                        {patientRecord.latest_health_record.oxygen_saturation ?? "N/A"}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Heart Rate</p>
                      <p className="font-semibold text-gray-800">
                        {patientRecord.latest_health_record.heart_rate ?? "N/A"} bpm
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Recorded At</p>
                      <p className="font-semibold text-gray-800">
                        {formatDateTime(patientRecord.latest_health_record.recorded_at)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-gray-200 p-5">
                <h3 className="mb-4 text-lg font-semibold text-gray-800">
                  Appointment History
                </h3>

                {patientRecord.appointments.length === 0 ? (
                  <p className="text-gray-500">No appointments found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100 text-left">
                          <th className="p-3">Code</th>
                          <th className="p-3">Doctor</th>
                          <th className="p-3">Date</th>
                          <th className="p-3">Time</th>
                          <th className="p-3">Queue</th>
                          <th className="p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patientRecord.appointments.map((appointment) => (
                          <tr key={appointment.appointment_id} className="border-t">
                            <td className="p-3">{appointment.appointment_code}</td>
                            <td className="p-3">{appointment.doctor_name}</td>
                            <td className="p-3">{appointment.appointment_date}</td>
                            <td className="p-3">{appointment.appointment_time}</td>
                            <td className="p-3">{appointment.queue_number}</td>
                            <td className="p-3">{appointment.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-gray-200 p-5">
                <h3 className="mb-4 text-lg font-semibold text-gray-800">
                  Health Record History
                </h3>

                {patientRecord.health_records.length === 0 ? (
                  <p className="text-gray-500">No health record history found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100 text-left">
                          <th className="p-3">Recorded At</th>
                          <th className="p-3">Height</th>
                          <th className="p-3">Weight</th>
                          <th className="p-3">Temp</th>
                          <th className="p-3">BP</th>
                          <th className="p-3">SpO2</th>
                          <th className="p-3">Heart Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patientRecord.health_records.map((record) => (
                          <tr key={record.id} className="border-t">
                            <td className="p-3">{formatDateTime(record.recorded_at)}</td>
                            <td className="p-3">{record.height_cm ?? "N/A"} cm</td>
                            <td className="p-3">{record.weight_kg ?? "N/A"} kg</td>
                            <td className="p-3">{record.temperature_c ?? "N/A"} C</td>
                            <td className="p-3">
                              {record.systolic_bp ?? "N/A"}/{record.diastolic_bp ?? "N/A"}
                            </td>
                            <td className="p-3">
                              {record.oxygen_saturation ?? "N/A"}%
                            </td>
                            <td className="p-3">{record.heart_rate ?? "N/A"} bpm</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
