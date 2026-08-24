import apiClient from './client';

// ── Auth ─────────────────────────────────────────────────
export const authApi = {
  register: (data) => apiClient.post('/auth/register', data).then(r => r.data),
  login:    (data) => apiClient.post('/auth/login', data).then(r => r.data),
  refresh:  (data) => apiClient.post('/auth/refresh', data).then(r => r.data),
  logout:   (data) => apiClient.post('/auth/logout', data).then(r => r.data),
  me:       ()     => apiClient.get('/users/me').then(r => r.data),
};

// ── Doctors (search) ─────────────────────────────────────
export const doctorsApi = {
  search:    (specialisation) => {
    const params = specialisation ? { specialisation } : {};
    return apiClient.get('/doctors', { params }).then(r => r.data);
  },
  getById:   (id)       => apiClient.get(`/doctors/${id}`).then(r => r.data),
  getSlots:  (id, date) => apiClient.get(`/doctors/${id}/slots`, { params: { date } }).then(r => r.data),
};

// ── Appointments ─────────────────────────────────────────
export const appointmentsApi = {
  hold:      (data) => apiClient.post('/appointments/hold', data).then(r => r.data),
  confirm:   (id, data) => apiClient.post(`/appointments/${id}/confirm`, data).then(r => r.data),
  cancel:    (id) => apiClient.post(`/appointments/${id}/cancel`).then(r => r.data),
  complete:  (id) => apiClient.post(`/appointments/${id}/complete`).then(r => r.data),
  getMine:   ()   => apiClient.get('/appointments/my').then(r => r.data),
  getById:   (id) => apiClient.get(`/appointments/${id}`).then(r => r.data),
  submitNotes: (id, data) => apiClient.post(`/appointments/${id}/notes`, data).then(r => r.data),
};

// ── Doctor portal ────────────────────────────────────────
export const doctorPortalApi = {
  getSchedule: (date) => apiClient.get('/doctor/schedule', { params: { date } }).then(r => r.data),
  getProfile:  ()     => apiClient.get('/doctor/profile').then(r => r.data),
};

// ── Admin ────────────────────────────────────────────────
export const adminApi = {
  getDoctors:     ()         => apiClient.get('/admin/doctors').then(r => r.data),
  getDoctor:      (id)       => apiClient.get(`/admin/doctors/${id}`).then(r => r.data),
  createDoctor:   (data)     => apiClient.post('/admin/doctors', data).then(r => r.data),
  updateDoctor:   (id, data) => apiClient.patch(`/admin/doctors/${id}`, data).then(r => r.data),
  getDoctorLeaves:(id)       => apiClient.get(`/admin/doctors/${id}/leaves`).then(r => r.data),
  markLeave:      (id, data) => apiClient.post(`/admin/doctors/${id}/leaves`, data).then(r => r.data),
};

// ── Notifications ────────────────────────────────────────
export const notificationsApi = {
  getMine: () => apiClient.get('/notifications').then(r => r.data),
};
