import React from 'react';
import './User.css';

function User({ usuario = "", rol = ""}) {
  return (
    <div className="User">
      {/* Información de Usuario sin avatar */}
      <div className="usuario-container">
        <div className="datos">
          <span className="nombre">{usuario}</span>
          <span className="rol">{rol}</span>
        </div>
      </div>
    </div>
  );
}

export default User;
