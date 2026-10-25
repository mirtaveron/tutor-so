import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  
  const register = useAuthStore(state => state.register);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await register(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrarse');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-blue-600 tracking-tight">
            TutorSO
          </h2>
          <p className="text-sm text-gray-500 mt-1">Crear Cuenta — Sistemas Operativos UNS</p>
        </div>
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email (institucional recomendado)</label>
            <input 
              type="email" 
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-primary-500 focus:ring-primary-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input 
              type="password" 
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-primary-500 focus:ring-primary-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-primary-600 text-white p-2 rounded-md hover:bg-primary-700 transition-colors"
          >
            Crear Cuenta
          </button>
        </form>
        <div className="mt-4 text-center text-sm">
          ¿Ya tenés cuenta? <Link to="/login" className="text-primary-600 hover:underline">Iniciá sesión</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
