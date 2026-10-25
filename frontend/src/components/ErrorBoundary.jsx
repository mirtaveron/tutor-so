import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary capturó un error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-red-100 p-6 text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              !
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Algo salió mal</h2>
            <p className="text-sm text-gray-600 mb-4">
              Ocurrió un error al cargar la vista. Podés recargar la página o volver al inicio.
            </p>
            <div className="text-xs bg-slate-100 text-slate-700 p-2.5 rounded font-mono text-left mb-4 overflow-x-auto max-h-32">
              {this.state.error?.message || 'Error desconocido'}
            </div>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = '/login';
              }}
              className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ir a Iniciar Sesión
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
