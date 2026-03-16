export default function Dashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>

      <p className="text-gray-500 mb-6">
        Overview of VitalKey Health Center Operations
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-gray-500 text-sm">Total Patients</p>
          <h2 className="text-3xl font-bold text-blue-600 mt-2">0</h2>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-gray-500 text-sm">Total Doctors</p>
          <h2 className="text-3xl font-bold text-green-600 mt-2">0</h2>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-gray-500 text-sm">Appointments Today</p>
          <h2 className="text-3xl font-bold text-purple-600 mt-2">0</h2>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-gray-500 text-sm">Low Stock Medicines</p>
          <h2 className="text-3xl font-bold text-red-600 mt-2">0</h2>
        </div>
      </div>
    </div>
  );
}
