import { create } from 'zustand';
import axios from '../api/axios';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  
  checkAuth: async () => {
    try {
      const { data } = await axios.get('/auth/me');
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email, password) => {
    const { data } = await axios.post('/auth/login', { email, password });
    set({ user: data.user, isAuthenticated: true });
  },

  register: async (email, password) => {
    const { data } = await axios.post('/auth/register', { email, password });
    set({ user: data.user, isAuthenticated: true });
  },

  logout: async () => {
    await axios.post('/auth/logout');
    set({ user: null, isAuthenticated: false });
  }
}));

export default useAuthStore;
