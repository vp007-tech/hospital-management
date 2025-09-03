import API from '../api/axios';

// Auth APIs
export const authAPI = {
  login: (credentials) => API.post('/auth/login', credentials),
  register: (userData) => API.post('/auth/register', userData),
  getMe: () => API.get('/auth/me'),
};

// Patient APIs
export const patientAPI = {
  getAll: (params = {}) => API.get('/patients', { params }),
  getById: (id) => API.get(`/patients/${id}`),
  create: (patientData) => API.post('/patients', patientData),
  update: (id, patientData) => API.put(`/patients/${id}`, patientData),
  delete: (id) => API.delete(`/patients/${id}`),
  search: (query) => API.get(`/patients/search?q=${query}`),
};

// Doctor APIs
export const doctorAPI = {
  getAll: (params = {}) => API.get('/doctors', { params }),
  getById: (id) => API.get(`/doctors/${id}`),
  create: (doctorData) => API.post('/doctors', doctorData),
  update: (id, doctorData) => API.put(`/doctors/${id}`, doctorData),
  delete: (id) => API.delete(`/doctors/${id}`),
  search: (query) => API.get(`/doctors/search?q=${query}`),
};

// Appointment APIs
export const appointmentAPI = {
  getAll: (params = {}) => API.get('/appointments', { params }),
  getById: (id) => API.get(`/appointments/${id}`),
  create: (appointmentData) => API.post('/appointments', appointmentData),
  update: (id, appointmentData) => API.put(`/appointments/${id}`, appointmentData),
  delete: (id) => API.delete(`/appointments/${id}`),
  getByPatient: (patientId) => API.get(`/appointments/patient/${patientId}`),
  getByDoctor: (doctorId) => API.get(`/appointments/doctor/${doctorId}`),
  reschedule: (id, newDateTime) => API.patch(`/appointments/${id}/reschedule`, { dateTime: newDateTime }),
  cancel: (id) => API.patch(`/appointments/${id}/cancel`),
};

// Medical Records APIs
export const medicalRecordAPI = {
  getAll: (params = {}) => API.get('/medical-records', { params }),
  getById: (id) => API.get(`/medical-records/${id}`),
  create: (recordData) => API.post('/medical-records', recordData),
  update: (id, recordData) => API.put(`/medical-records/${id}`, recordData),
  delete: (id) => API.delete(`/medical-records/${id}`),
  getByPatient: (patientId) => API.get(`/medical-records/patient/${patientId}`),
};

// Billing APIs
export const billingAPI = {
  getAll: (params = {}) => API.get('/billing', { params }),
  getById: (id) => API.get(`/billing/${id}`),
  create: (billingData) => API.post('/billing', billingData),
  update: (id, billingData) => API.put(`/billing/${id}`, billingData),
  delete: (id) => API.delete(`/billing/${id}`),
  getByPatient: (patientId) => API.get(`/billing/patient/${patientId}`),
  processPayment: (id, paymentData) => API.post(`/billing/${id}/payment`, paymentData),
};

// Dashboard/Stats APIs
export const dashboardAPI = {
  getStats: () => API.get('/dashboard/stats'),
  getRecentAppointments: () => API.get('/dashboard/recent-appointments'),
  getRecentPatients: () => API.get('/dashboard/recent-patients'),
};

// Utility function to handle API errors
export const handleAPIError = (error) => {
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.message || error.response.data?.error || 'An error occurred';
    return { error: true, message, status: error.response.status };
  } else if (error.request) {
    // Request was made but no response received
    return { error: true, message: 'Network error. Please check your connection.', status: 0 };
  } else {
    // Something else happened
    return { error: true, message: 'An unexpected error occurred.', status: 0 };
  }
};

// Helper function to show success/error messages
export const showNotification = (message, type = 'info') => {
  // You can integrate with a toast library here
  console.log(`[${type.toUpperCase()}]: ${message}`);
  if (type === 'error') {
    alert(`Error: ${message}`);
  } else if (type === 'success') {
    alert(`Success: ${message}`);
  }
};
