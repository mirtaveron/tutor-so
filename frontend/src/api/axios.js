import axios from 'axios';

const getBaseUrl = () => {
  // 1. En producción (Vercel) utiliza la URL del backend en Render
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    // 2. Si se accede por un túnel público HTTPS (Cloudflare, localtunnel, ngrok)
    if (protocol === 'https:' || hostname.includes('trycloudflare') || hostname.includes('loca.lt') || hostname.includes('ngrok')) {
      return `${window.location.origin}/api`;
    }
    // 3. Si se accede por Wi-Fi local o localhost directo
    return `http://${hostname}:4000/api`;
  }
  return 'http://localhost:4000/api';
};

const instance = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true, // Importante para enviar cookies de sesión
});

export default instance;
