import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './store/authStore';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LessonView from './pages/LessonView';
import ChatWidget from './components/ChatWidget';

// Componente de ruta protegida
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  return children;
};

function App() {
  const { checkAuth, isLoading, isAuthenticated } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando aplicación...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/lesson/:id" 
          element={
            <ProtectedRoute>
              <LessonView />
            </ProtectedRoute>
          } 
        />
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      {isAuthenticated && <ChatWidget />}
    </Router>
  );
}

export default App;
