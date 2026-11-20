import React from 'react';
import Logo from './Logo/Logo';
import './Navbar.css';

function Navbar() {
  return (
    <nav className="Navbar">
      <div className="Navbar-container">
        {/* Isotipo y Nombre */}
        <Logo />
      </div>
    </nav>
  );
}

export default Navbar;
