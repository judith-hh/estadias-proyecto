-- Script para crear la base de datos y tablas en MySQL Workbench
CREATE DATABASE IF NOT EXISTS estadias_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE estadias_db;
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  identificador VARCHAR(100) NOT NULL UNIQUE,
  tipo_identificador VARCHAR(30),
  password VARCHAR(255) NOT NULL,
  rol ENUM('admin', 'student') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT IGNORE INTO users (identificador, tipo_identificador, password, rol) VALUES 
('admin@correo.com', 'ALFANUMERICO_O_MIXTO', 'admin123', 'admin'),
('2023001', 'NUMEROS', 'alumno123', 'student');
CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  Nombrecompleto VARCHAR(255) NOT NULL,
  dob VARCHAR(50),
  Genero VARCHAR(20),
  Direccion VARCHAR(255),
  Telefono VARCHAR(50),
  Telefonodecasa VARCHAR(50),
  nombredelaescuela VARCHAR(255),
  IDestudiante VARCHAR(100),
  tipo_IDestudiante VARCHAR(30),
  Carrera VARCHAR(200),
  Semestre VARCHAR(50),
  turno VARCHAR(50),
  status ENUM('pendiente', 'aprobado', 'rechazado') DEFAULT 'pendiente',
  foto_perfil VARCHAR(255),
  file_INE VARCHAR(255),
  file_Credencial VARCHAR(255),
  file_CartaPresentacion VARCHAR(255),
  file_ConstanciaEstudios VARCHAR(255),
  file_ActaNacimiento VARCHAR(255),
  file_CURP VARCHAR(255),
  file_NumeroSeguroSocial VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
