import React, { useState } from 'react';
import Swal from 'sweetalert2';
import API_URL from '../../../config';
import './Login.css';

function Login({ onLoginSuccess }) {
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ identificador, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Guardar usuario y token JWT en localStorage
        localStorage.setItem('admin_user', JSON.stringify(data.user));
        if (data.token) {
          localStorage.setItem('admin_token', data.token);
        }

        await Swal.fire({
          icon: 'success',
          title: '¡Bienvenido!',
          text: 'Has iniciado sesión correctamente.',
          timer: 1500,
          showConfirmButton: false
        });

        if (onLoginSuccess) {
          onLoginSuccess(data.user);
        }
      } else {
        const mensajeError = data.error || 'Usuario o contraseña incorrectos';
        setError(mensajeError);
        Swal.fire({
          icon: 'error',
          title: 'Acceso denegado',
          text: mensajeError,
          confirmButtonColor: '#ef5522'
        });
      }
    } catch (err) {
      console.error('Error al conectar:', err);
      const msg = 'No se pudo conectar con el servidor. Verifica que el backend esté encendido.';
      setError(msg);
      Swal.fire({
        icon: 'warning',
        title: 'Error de conexión',
        text: msg,
        confirmButtonColor: '#ef5522'
      });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="Login-container">
      <div className="Login-card">
        <div className="Login-header">
          <div className="Login-avatar-container">
            <img
              src="/dino-descubre.png"
              alt="Mascota Descubre"
              className="Login-dino-img"
            />
          </div>
          <h2>Acceso Administrativo</h2>
          <p>Ingresa tus credenciales para gestionar los registros del museo</p>
        </div>

        {error && (
          <div className="Login-error">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="Login-form">
          <div className="Form-group">
            <label htmlFor="identificador">Usuario *</label>
            <input
              id="identificador"
              type="text"
              placeholder="admin@correo.com"
              value={identificador}
              onChange={(e) => setIdentificador(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="Form-group">
            <label htmlFor="password">Contraseña *</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="Btn-submit Login-btn"
            disabled={cargando}
          >
            {cargando ? 'Iniciando sesión...' : 'Continuar'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
