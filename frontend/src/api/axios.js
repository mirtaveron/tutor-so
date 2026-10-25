import axios from 'axios';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  // Si se accede desde un celular conectado a la red local (ej: 192.168.X.X), usar la misma IP
  const hostname = (typeof window !== 'undefined' && window.location.hostname) ? window.location.hostname : 'localhost';
  return `http://${hostname}:4000/api`;
};

const instance = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true, // Importante para enviar cookies
});

export default instance;
