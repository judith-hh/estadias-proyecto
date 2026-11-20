import React, { useState, useEffect } from 'react';
import Navbar from './Navbar/Navbar';
import Datos from './Datos/Datos';
import Login from './Login/Login';
import './Admin.css';

function Admin() {
  const [adminUser, setAdminUser] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Comprobar si ya hay una sesión guardada en localStorage
    const saved = localStorage.getItem('admin_user');
    if (saved) {
      try {
        setAdminUser(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem('admin_user');
      }
    }
    setCargando(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_token');
    setAdminUser(null);
  };

  if (cargando) {
    return null;
  }

  // Si no ha iniciado sesión, mostrar el formulario de Login
  if (!adminUser) {
    return <Login onLoginSuccess={(user) => setAdminUser(user)} />;
  }

  // Si ya inició sesión, mostrar el panel de control
  return (
    <div className="Admin-page">
      <Navbar
        adminUser={adminUser}
        onLogout={handleLogout}
      />
      <Datos />
    </div>
  );
}

export default Admin;