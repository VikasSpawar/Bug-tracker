import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

// Add token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getProfile: () => API.get('/auth/profile'),
  updateProfile: (data) => API.put('/auth/profile', data),
  changePassword: (data) => API.post('/auth/change-password', data),
};

// Project endpoints
export const projectAPI = {
  create: (data) => API.post('/projects', data),
  getAll: (params) => API.get('/projects', { params }),
  getById: (id) => API.get(`/projects/${id}`),
  update: (id, data) => API.put(`/projects/${id}`, data),
  delete: (id) => API.delete(`/projects/${id}`),
  archive: (id) => API.patch(`/projects/${id}/archive`),
 addMember: (projectId, email) => API.post(`/projects/${projectId}/team`, { email }),
  // We will need this for the next step (Phase 2)
  getMembers: (projectId) => API.get(`/projects/${projectId}`),
  // removeMember: (id, data) => API.delete(`/projects/${id}/members`, { data }),
  removeMember: (projectId, userId) => 
    API.delete(`/projects/${projectId}/team`, { data: { userId } }),
  updateMemberRole: (id, data) => API.patch(`/projects/${id}/members/role`, data),
};

// Ticket endpoints
export const ticketAPI = {
  create: (data) => API.post('/tickets', data),
  getAll: (params) => API.get('/tickets', { params }),
  getById: (id) => API.get(`/tickets/${id}`),
  update: (id, data) => API.put(`/tickets/${id}`, data),
  delete: (id) => API.delete(`/tickets/${id}`),
  updateStatus: (id, data) => API.patch(`/tickets/${id}/status`, data),
  assign: (id, data) => API.patch(`/tickets/${id}/assign`, data),
  search: (params) => API.get('/tickets/search', { params }),
  addWatcher: (id) => API.post(`/tickets/${id}/watch`),
  removeWatcher: (id) => API.delete(`/tickets/${id}/watch`),
};

// Comment endpoints
export const commentAPI = {
  create: (data) => API.post('/comments', data),
  getAll: (params) => API.get('/comments', { params }),
  update: (id, data) => API.put(`/comments/${id}`, data),
  delete: (id) => API.delete(`/comments/${id}`),
};

export default API;
