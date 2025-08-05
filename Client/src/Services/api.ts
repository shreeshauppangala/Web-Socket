import axios from 'axios';
import type { LoginFormI, RegisterFormI } from '../Constants/interface';

const API_BASE = import.meta.env.VITE_API_URL!;

const api = axios.create({
  baseURL: API_BASE,
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (userData: RegisterFormI) => api.post('/auth/register', userData),
  login: (credentials: LoginFormI) => api.post('/auth/login', credentials),
  getCurrentUser: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const messageAPI = {
  getMessages: (room: 'general', page = 1) => api.get(`/messages/${room}?page=${page}`),
  sendMessage: (messageData: { content: string; room: 'general' }) => api.post('/messages', messageData),
};

export default api;
