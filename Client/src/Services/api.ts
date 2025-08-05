import axios from 'axios';
import type { LoginFormI, RegisterFormI } from '../Constants/interface';

axios.defaults.baseURL = import.meta.env.VITE_API_URL!;
 axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token') || ''}`;

// Handle auth errors
axios.interceptors.response.use(
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
  register: (userData: RegisterFormI) => axios.post('/auth/register', userData),
  login: (credentials: LoginFormI) => axios.post('/auth/login', credentials),
  getCurrentUser: () => axios.get('/auth/me'),
  logout: () => axios.post('/auth/logout'),
};

export const messageAPI = {
  getMessages: (room: 'general', page = 1) => axios.get(`/messages/${room}?page=${page}`),
  sendMessage: (messageData: { content: string; room: 'general' }) => axios.post('/messages', messageData),
};
