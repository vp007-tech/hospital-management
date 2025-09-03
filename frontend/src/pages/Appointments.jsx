import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { appointmentAPI, doctorAPI, patientAPI, handleAPIError } from "../services/api";

function Appointments() {
  const { user, isPatient, isDoctor } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [formData, setFormData] = useState({
    patientId: "",
    doctorId: "",
    appointmentDate: "",
    appointmentTime: "",
    reason: "",
    notes: "",
    status: "scheduled",
  });

  useEffect(() => {
    fetchInitialData();
  }, [user]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError("");

      const promises = [];

      if (isPatient()) {
        // For patients, fetch only their appointments
        promises.push(appointmentAPI.getByPatient(user.id));
        promises.push(doctorAPI.getAll()); // To show doctor names
      } else if (isDoctor()) {
        // For doctors, fetch their appointments
        promises.push(appointmentAPI.getByDoctor(user.id));
        promises.push(patientAPI.getAll()); // To show patient names
      } else {
        // For admins, fetch all appointments, doctors, and patients
        promises.push(
          appointmentAPI.getAll(),
          doctorAPI.getAll(),
          patientAPI.getAll()
        );
      }

      const results = await Promise.allSettled(promises);

      if (isPatient()) {
        const [appointmentsResult, doctorsResult] = results;
        if (appointmentsResult.status === 'fulfilled') {
          setAppointments(appointmentsResult.value.data || []);
        }
        if (doctorsResult.status === 'fulfilled') {
          setDoctors(doctorsResult.value.data || []);
        }
      } else if (isDoctor()) {
        const [appointmentsResult, patientsResult] = results;
        if (appointmentsResult.status === 'fulfilled') {
          setAppointments(appointmentsResult.value.data || []);
        }
        if (patientsResult.status === 'fulfilled') {
          setPatients(patientsResult.value.data || []);
        }
      } else {
        const [appointmentsResult, doctorsResult, patientsResult] = results;
        if (appointmentsResult.status === 'fulfilled') {
          setAppointments(appointmentsResult.value.data || []);
        }
        if (doctorsResult.status === 'fulfilled') {
          setDoctors(doctorsResult.value.data || []);
        }
        if (patientsResult.status === 'fulfilled') {
          setPatients(patientsResult.value.data || []);
        }
      }
    } catch (err) {
      const errorInfo = handleAPIError(err);
      setError(errorInfo.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const appointmentData = {
        ...formData,
        appointmentDate: `${formData.appointmentDate}T${formData.appointmentTime}:00.000Z`,
        // Set patient ID if user is a patient
        patientId: isPatient() ? user.id : formData.patientId,
        // Set doctor ID if user is a doctor
        doctorId: isDoctor() ? user.id : formData.doctorId,
      };

      // Remove separate time field since we combined it with date
      delete appointmentData.appointmentTime;

      if (editingAppointment) {
        await appointmentAPI.update(editingAppointment._id, appointmentData);
      } else {
        await appointmentAPI.create(appointmentData);
      }
      
      setShowModal(false);
      setEditingAppointment(null);
      resetForm();
      fetchInitialData();
      
      alert(editingAppointment ? "Appointment updated successfully!" : "Appointment booked successfully!");
    } catch (err) {
      const errorInfo = handleAPIError(err);
      setError(errorInfo.message);
    }
  };

  const handleEdit = (appointment) => {
    setEditingAppointment(appointment);
    const appointmentDate = new Date(appointment.appointmentDate);
    setFormData({
      patientId: appointment.patientId || "",
      doctorId: appointment.doctorId || "",
      appointmentDate: appointmentDate.toISOString().split('T')[0],
      appointmentTime: appointmentDate.toTimeString().split(' ')[0].slice(0, 5),
      reason: appointment.reason || "",
      notes: appointment.notes || "",
      status: appointment.status || "scheduled",
    });
    setShowModal(true);
  };

  const handleCancel = async (appointmentId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) {
      return;
    }

    try {
      await appointmentAPI.cancel(appointmentId);
      fetchInitialData();
      alert("Appointment cancelled successfully!");
    } catch (err) {
      const errorInfo = handleAPIError(err);
      setError(errorInfo.message);
    }
  };

  const handleReschedule = async (appointmentId, newDateTime) => {
    try {
      await appointmentAPI.reschedule(appointmentId, newDateTime);
      fetchInitialData();
      alert("Appointment rescheduled successfully!");
    } catch (err) {
      const errorInfo = handleAPIError(err);
      setError(errorInfo.message);
    }
  };

  const resetForm = () => {
    setFormData({
      patientId: "",
      doctorId: "",
      appointmentDate: "",
      appointmentTime: "",
      reason: "",
      notes: "",
      status: "scheduled",
    });
  };

  const openAddModal = () => {
    setEditingAppointment(null);
    resetForm();
    setShowModal(true);
  };

  const getPatientName = (patientId) => {
    const patient = patients.find(p => p._id === patientId);
    return patient ? patient.name : 'Unknown Patient';
  };

  const getDoctorName = (doctorId) => {
    const doctor = doctors.find(d => d._id === doctorId);
    return doctor ? doctor.name : 'Unknown Doctor';
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = 
      (isPatient() ? getDoctorName(appointment.doctorId) : getPatientName(appointment.patientId))
        .toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || appointment.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isPatient() ? "My Appointments" : "Appointments"}
            </h1>
            <p className="text-gray-600 mt-2">
              {isPatient() ? 
                "View and manage your upcoming appointments" : 
                "Manage patient appointments and schedules"
              }
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
          >
            {isPatient() ? "Book Appointment" : "Schedule Appointment"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder={isPatient() ? "Search by doctor or reason..." : "Search by patient or reason..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {filteredAppointments.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredAppointments.map((appointment) => (
              <div key={appointment._id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8h0m-6-4h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {isPatient() ? 
                            `Dr. ${getDoctorName(appointment.doctorId)}` : 
                            getPatientName(appointment.patientId)
                          }
                        </h3>
                        <p className="text-sm text-gray-600">
                          {appointment.reason || "General consultation"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="ml-16 space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8h0m-6-4h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                        </svg>
                        {new Date(appointment.appointmentDate).toLocaleDateString()} at{' '}
                        {new Date(appointment.appointmentDate).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      {appointment.notes && (
                        <div className="flex items-start text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {appointment.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                      appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {appointment.status || 'scheduled'}
                    </span>
                    
                    <div className="flex space-x-2">
                      {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                        <>
                          <button
                            onClick={() => handleEdit(appointment)}
                            className="text-blue-600 hover:text-blue-900 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleCancel(appointment._id)}
                            className="text-red-600 hover:text-red-900 text-sm"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8h0m-6-4h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500">
              {searchTerm || filterStatus !== "all" ? 
                "No appointments found matching your criteria." : 
                "No appointments scheduled."}
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingAppointment ? "Edit Appointment" : "Book New Appointment"}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isPatient() && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Patient</label>
                    <select
                      required
                      value={formData.patientId}
                      onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a patient</option>
                      {patients.map((patient) => (
                        <option key={patient._id} value={patient._id}>
                          {patient.name} - {patient.email}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                {!isDoctor() && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Doctor</label>
                    <select
                      required
                      value={formData.doctorId}
                      onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a doctor</option>
                      {doctors.map((doctor) => (
                        <option key={doctor._id} value={doctor._id}>
                          Dr. {doctor.name} - {doctor.specialization}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Appointment Date</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.appointmentDate}
                    onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Appointment Time</label>
                  <input
                    type="time"
                    required
                    value={formData.appointmentTime}
                    onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Reason for Visit</label>
                  <input
                    type="text"
                    required
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., General checkup, Follow-up"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Any additional notes..."
                  />
                </div>

                {editingAppointment && !isPatient() && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingAppointment ? "Update" : "Book Appointment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Appointments;
