import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { patientAPI, doctorAPI, appointmentAPI, handleAPIError } from "../services/api";

function Dashboard() {
  const { user, isDoctor, isPatient } = useAuth();
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    todayAppointments: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const promises = [];

      // Fetch different data based on user role
      if (isPatient()) {
        // For patients, fetch only their appointments
        promises.push(appointmentAPI.getByPatient(user.id));
      } else {
        // For doctors and admins, fetch system-wide stats
        promises.push(
          patientAPI.getAll(),
          doctorAPI.getAll(),
          appointmentAPI.getAll()
        );
      }

      const results = await Promise.allSettled(promises);

      if (isPatient()) {
        // Handle patient-specific data
        const [appointmentsResult] = results;
        if (appointmentsResult.status === 'fulfilled') {
          const appointments = appointmentsResult.value.data;
          setRecentAppointments(appointments.slice(0, 5));
          setStats(prev => ({
            ...prev,
            totalAppointments: appointments.length,
            todayAppointments: appointments.filter(apt => 
              new Date(apt.appointmentDate).toDateString() === new Date().toDateString()
            ).length
          }));
        }
      } else {
        // Handle admin/doctor data
        const [patientsResult, doctorsResult, appointmentsResult] = results;
        
        if (patientsResult.status === 'fulfilled') {
          setStats(prev => ({ ...prev, totalPatients: patientsResult.value.data.length }));
        }
        
        if (doctorsResult.status === 'fulfilled') {
          setStats(prev => ({ ...prev, totalDoctors: doctorsResult.value.data.length }));
        }
        
        if (appointmentsResult.status === 'fulfilled') {
          const appointments = appointmentsResult.value.data;
          setRecentAppointments(appointments.slice(0, 5));
          setStats(prev => ({
            ...prev,
            totalAppointments: appointments.length,
            todayAppointments: appointments.filter(apt => 
              new Date(apt.appointmentDate).toDateString() === new Date().toDateString()
            ).length
          }));
        }
      }
    } catch (err) {
      const errorInfo = handleAPIError(err);
      setError(errorInfo.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600 mt-2">
          {isPatient() ? "Manage your appointments and health records" : 
           isDoctor() ? "Manage your patients and appointments" : "Hospital overview and management"}
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {!isPatient() && (
          <>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Patients</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalPatients}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Doctors</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalDoctors}</p>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8h0m-6-4h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {isPatient() ? "My Appointments" : "Total Appointments"}
              </p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalAppointments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.todayAppointments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {isPatient() ? (
              <>
                <Link
                  to="/appointments"
                  className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition duration-200"
                >
                  <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="text-blue-700 font-medium">Book New Appointment</span>
                </Link>
                <Link
                  to="/appointments"
                  className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition duration-200"
                >
                  <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="text-green-700 font-medium">View My Appointments</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/patients"
                  className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition duration-200"
                >
                  <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="text-blue-700 font-medium">Add New Patient</span>
                </Link>
                <Link
                  to="/appointments"
                  className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition duration-200"
                >
                  <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8h0m-6-4h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                  <span className="text-green-700 font-medium">Schedule Appointment</span>
                </Link>
                <Link
                  to="/doctors"
                  className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition duration-200"
                >
                  <svg className="w-5 h-5 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-purple-700 font-medium">View Doctors</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Recent Appointments */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {isPatient() ? "My Recent Appointments" : "Recent Appointments"}
          </h2>
          {recentAppointments.length > 0 ? (
            <div className="space-y-3">
              {recentAppointments.map((appointment, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {isPatient() ? 
                        `Dr. ${appointment.doctorName || 'Unknown'}` : 
                        appointment.patientName || 'Unknown Patient'
                      }
                    </p>
                    <p className="text-sm text-gray-600">
                      {appointment.appointmentDate ? 
                        new Date(appointment.appointmentDate).toLocaleDateString() : 
                        'Date not available'
                      }
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                    appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {appointment.status || 'scheduled'}
                  </span>
                </div>
              ))}
              <Link
                to="/appointments"
                className="block text-center text-blue-600 hover:text-blue-500 font-medium"
              >
                View All Appointments
              </Link>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8h0m-6-4h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
              <p>No appointments found</p>
              <Link
                to="/appointments"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                {isPatient() ? "Book your first appointment" : "Schedule an appointment"}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
