const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_estadias_default_2026';

app.use(cors());
app.use(express.json());

// Asegurar que exista la carpeta de uploads y servirla estáticamente
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Configuración de Multer para almacenar archivos con nombres únicos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }
});

// Campos de archivos esperados desde el formulario
const uploadFields = upload.fields([
  { name: 'FotoPerfil', maxCount: 1 },
  { name: 'INE', maxCount: 1 },
  { name: 'Credencial', maxCount: 1 },
  { name: 'CartaPresentacion', maxCount: 1 },
  { name: 'ConstanciaEstudios', maxCount: 1 },
  { name: 'ActaNacimiento', maxCount: 1 },
  { name: 'CURP', maxCount: 1 },
  { name: 'NumeroSeguroSocial', maxCount: 1 }
]);

// -------------------------------------------------------------
// MIDDLEWARE: VERIFICAR TOKEN JWT (PUNTO 3)
// -------------------------------------------------------------
function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'Acceso no autorizado: No se proporcionó token de autenticación'
    });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Token inválido o expirado. Por favor inicia sesión nuevamente.'
      });
    }
    req.user = decoded;
    next();
  });
}

// Rutas de prueba
app.get('/', (req, res) => {
  res.send('Api funcionando');
});

app.get('/api/test-db', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS result');
    res.json({
      mensaje: 'Conexion exitosa',
      datos: rows
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error al conectar a la base de datos',
      detalle: error.message
    });
  }
});

// -------------------------------------------------------------
// LOGIN PARA ADMINISTRADORES CON GENERACIÓN DE TOKEN (PUNTO 3)
// -------------------------------------------------------------
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identificador, password } = req.body;

    if (!identificador || !password) {
      return res.status(400).json({
        success: false,
        error: 'Por favor ingresa usuario y contraseña'
      });
    }

    const [rows] = await db.query(
      'SELECT id, identificador, rol, foto_perfil FROM users WHERE identificador = ? AND password = ?',
      [identificador.trim(), password]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales incorrectas'
      });
    }

    const user = rows[0];

    if (user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado. Se requieren permisos de administrador'
      });
    }

    // Generar token JWT con vigencia de 8 horas
    const token = jwt.sign(
      { id: user.id, identificador: user.identificador, rol: user.rol },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      mensaje: 'Inicio de sesión exitoso',
      token, // Enviamos el token al frontend
      user: {
        id: user.id,
        identificador: user.identificador,
        rol: user.rol,
        foto_perfil: user.foto_perfil ? `http://localhost:${PORT}/uploads/${user.foto_perfil}` : null
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      error: 'Error al iniciar sesión',
      detalle: error.message
    });
  }
});

// Registrar nuevo administrador (Ruta protegida con token)
app.post('/api/auth/register-admin', verificarToken, async (req, res) => {
  try {
    const { identificador, password } = req.body;

    if (!identificador || !password) {
      return res.status(400).json({
        success: false,
        error: 'Usuario/Correo y contraseña son obligatorios'
      });
    }

    const [existentes] = await db.query(
      'SELECT id FROM users WHERE identificador = ?',
      [identificador.trim()]
    );

    if (existentes.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Este usuario o correo ya se encuentra registrado'
      });
    }

    const [result] = await db.query(
      'INSERT INTO users (identificador, password, rol) VALUES (?, ?, ?)',
      [identificador.trim(), password, 'admin']
    );

    res.status(201).json({
      success: true,
      mensaje: 'Administrador creado con éxito',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error al registrar admin:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno al registrar administrador',
      detalle: error.message
    });
  }
});

// -------------------------------------------------------------
// 1. REGISTRAR ESTUDIANTE:
//    - VALIDACIÓN DE CAMPOS OBLIGATORIOS (PUNTO 1)
//    - PREVENCIÓN DE DUPLICADOS [Matrícula, Nombre, Universidad] (PUNTO 4)
// -------------------------------------------------------------
app.post('/api/students/register', uploadFields, async (req, res) => {
  try {
    const body = req.body;
    const files = req.files || {};

    const nombreCompleto = (body.Nombrecompleto || '').trim();
    const idEstudiante = (body.IDestudiante || '').trim();
    const escuela = (body.nombredelaescuela || '').trim();
    const carrera = (body.Carrera || '').trim();
    const semestre = (body.Semestre || '').trim();
    const telefono = (body.Telefono || '').trim();
    const direccion = (body.Direccion || '').trim();
    const genero = (body.Genero || '').trim();
    const dob = (body.dob || '').trim();

    // PUNTO 1: Validación de campos de texto obligatorios en el backend
    if (!nombreCompleto || !idEstudiante || !escuela || !carrera || !semestre || !telefono) {
      return res.status(400).json({
        success: false,
        error: 'Campos obligatorios faltantes: Nombre completo, Matrícula/ID, Escuela, Carrera, Semestre y Teléfono son requeridos.'
      });
    }

    // PUNTO 1.1: Validación de fotografía y documentos obligatorios en el backend
    const requiredFileNames = [
      { key: 'FotoPerfil', label: 'Fotografía de tu rostro' },
      { key: 'INE', label: 'Copia del INE' },
      { key: 'Credencial', label: 'Credencial de la escuela' },
      { key: 'CartaPresentacion', label: 'Carta de presentación' },
      { key: 'ConstanciaEstudios', label: 'Constancia de estudios' },
      { key: 'ActaNacimiento', label: 'Acta de nacimiento' },
      { key: 'CURP', label: 'CURP' },
      { key: 'NumeroSeguroSocial', label: 'Copia del número de seguro social' }
    ];

    const missingUploads = requiredFileNames.filter((item) => !files[item.key] || files[item.key].length === 0);
    if (missingUploads.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Faltan los siguientes documentos obligatorios: ${missingUploads.map((m) => m.label).join(', ')}.`
      });
    }

    // PUNTO 4: Validación de duplicidad por Matrícula + Nombre + Escuela
    const [duplicados] = await db.query(
      `SELECT id, Nombrecompleto, IDestudiante, nombredelaescuela 
       FROM students 
       WHERE LOWER(TRIM(IDestudiante)) = LOWER(?) 
          OR (LOWER(TRIM(Nombrecompleto)) = LOWER(?) AND LOWER(TRIM(nombredelaescuela)) = LOWER(?))
       LIMIT 1`,
      [idEstudiante, nombreCompleto, escuela]
    );

    if (duplicados.length > 0) {
      const existente = duplicados[0];
      const motivo = existente.IDestudiante.toLowerCase() === idEstudiante.toLowerCase()
        ? `Ya existe un registro con la matrícula/ID "${idEstudiante}".`
        : `Ya existe un registro con el nombre "${nombreCompleto}" en la escuela "${escuela}".`;

      return res.status(409).json({
        success: false,
        error: `Registro duplicado: ${motivo}`
      });
    }

    const sql = `
      INSERT INTO students (
        Nombrecompleto, dob, Genero, Direccion, Telefono, Telefonodecasa,
        nombredelaescuela, IDestudiante, tipo_IDestudiante, Carrera, Semestre, turno,
        status, foto_perfil,
        file_INE, file_Credencial, file_CartaPresentacion, file_ConstanciaEstudios,
        file_ActaNacimiento, file_CURP, file_NumeroSeguroSocial
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      nombreCompleto,
      dob || null,
      genero || '',
      direccion || '',
      telefono,
      (body.Telefonodecasa || '').trim(),
      escuela,
      idEstudiante,
      body.tipo_IDestudiante || null,
      carrera,
      semestre,
      (body.turno || '').trim(),
      'pendiente',
      files.FotoPerfil ? files.FotoPerfil[0].filename : null,
      files.INE ? files.INE[0].filename : null,
      files.Credencial ? files.Credencial[0].filename : null,
      files.CartaPresentacion ? files.CartaPresentacion[0].filename : null,
      files.ConstanciaEstudios ? files.ConstanciaEstudios[0].filename : null,
      files.ActaNacimiento ? files.ActaNacimiento[0].filename : null,
      files.CURP ? files.CURP[0].filename : null,
      files.NumeroSeguroSocial ? files.NumeroSeguroSocial[0].filename : null
    ];

    const [result] = await db.query(sql, values);

    res.status(201).json({
      success: true,
      mensaje: 'Estudiante y documentos registrados con éxito',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error al registrar estudiante:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno al guardar en MySQL',
      detalle: error.message
    });
  }
});

// -------------------------------------------------------------
// 2. OBTENER ESTUDIANTES PARA EL PANEL (Ruta protegida con token)
// -------------------------------------------------------------
app.get('/api/estudiantes', verificarToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM students ORDER BY id DESC');
    const formatted = rows.map((s) => ({
      id: s.id,
      Nombrecompleto: s.Nombrecompleto,
      dob: s.dob,
      Genero: s.Genero,
      Direccion: s.Direccion,
      Telefono: s.Telefono,
      Telefonodecasa: s.Telefonodecasa,
      nombredelaescuela: s.nombredelaescuela,
      IDestudiante: s.IDestudiante,
      Carrera: s.Carrera,
      Semestre: s.Semestre,
      turno: s.turno || '',
      status: s.status || 'pendiente',
      foto_perfil: s.foto_perfil ? `http://localhost:${PORT}/uploads/${s.foto_perfil}` : null,
      created_at: s.created_at,
      docs: {
        INE: s.file_INE ? `http://localhost:${PORT}/uploads/${s.file_INE}` : null,
        Credencial: s.file_Credencial ? `http://localhost:${PORT}/uploads/${s.file_Credencial}` : null,
        CartaPresentacion: s.file_CartaPresentacion ? `http://localhost:${PORT}/uploads/${s.file_CartaPresentacion}` : null,
        ConstanciaEstudios: s.file_ConstanciaEstudios ? `http://localhost:${PORT}/uploads/${s.file_ConstanciaEstudios}` : null,
        ActaNacimiento: s.file_ActaNacimiento ? `http://localhost:${PORT}/uploads/${s.file_ActaNacimiento}` : null,
        CURP: s.file_CURP ? `http://localhost:${PORT}/uploads/${s.file_CURP}` : null,
        NumeroSeguroSocial: s.file_NumeroSeguroSocial ? `http://localhost:${PORT}/uploads/${s.file_NumeroSeguroSocial}` : null
      }
    }));
    res.json(formatted);
  } catch (error) {
    console.error('Error al obtener estudiantes:', error);
    res.status(500).json({
      error: 'Error al consultar estudiantes en MySQL',
      detalle: error.message
    });
  }
});

// -------------------------------------------------------------
// 3. ACTUALIZAR ESTADO (Ruta protegida con token)
// -------------------------------------------------------------
app.patch('/api/estudiantes/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pendiente', 'aprobado', 'rechazado'].includes(status)) {
      return res.status(400).json({ error: 'Estado no válido' });
    }

    const [result] = await db.query('UPDATE students SET status = ? WHERE id = ?', [status, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    res.json({ success: true, mensaje: 'Estado actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ error: 'Error al actualizar estado', detalle: error.message });
  }
});

// -------------------------------------------------------------
// 4. ELIMINAR ESTUDIANTE (Ruta protegida con token)
// -------------------------------------------------------------
app.delete('/api/estudiantes/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query('SELECT * FROM students WHERE id = ?', [id]);
    if (rows.length > 0) {
      const student = rows[0];
      const fileKeys = [
        'foto_perfil',
        'file_INE', 'file_Credencial', 'file_CartaPresentacion',
        'file_ConstanciaEstudios', 'file_ActaNacimiento', 'file_CURP', 'file_NumeroSeguroSocial'
      ];
      fileKeys.forEach((key) => {
        if (student[key]) {
          const filePath = path.join(uploadsDir, student[key]);
          if (fs.existsSync(filePath)) {
            try {
              fs.unlinkSync(filePath);
            } catch (err) {
              console.warn('No se pudo borrar el archivo:', filePath);
            }
          }
        }
      });
    }

    const [result] = await db.query('DELETE FROM students WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    res.json({ success: true, mensaje: 'Estudiante eliminado' });
  } catch (error) {
    console.error('Error al eliminar estudiante:', error);
    res.status(500).json({ error: 'Error al eliminar', detalle: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor API corriendo en http://localhost:${PORT}`);
});
