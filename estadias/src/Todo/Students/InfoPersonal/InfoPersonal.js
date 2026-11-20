import React, { useState } from 'react';
import Swal from 'sweetalert2';
import API_URL from '../../../config';
import './InfoPersonal.css';

function InfoPersonal() {
  const [formData, setFormData] = useState({
    Nombrecompleto: '', dob: '', Genero: '', Direccion: '', Telefono: '',Telefonodecasa: '', 
    nombredelaescuela: '',  IDestudiante: '', Carrera: '', Semestre: '', turno: ''
  });

  const [files, setFiles] = useState({
    FotoPerfil: null,
    INE: null,
    Credencial: null,
    CartaPresentacion: null,
    ConstanciaEstudios: null,
    ActaNacimiento: null,
    CURP: null,
    NumeroSeguroSocial: null
  });

  const [fotoPreview, setFotoPreview] = useState(null);
  const [tipoPeriodo, setTipoPeriodo] = useState('Semestre');

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Si es campo de teléfono, permitir exclusivamente dígitos (máximo 10)
    if (name === 'Telefono' || name === 'Telefonodecasa') {
      const onlyNums = value.replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: onlyNums }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePeriodoTypeChange = (e) => {
    const nuevoTipo = e.target.value;
    setTipoPeriodo(nuevoTipo);
    setFormData((prev) => ({ ...prev, Semestre: '' }));
  };

  const handleFileChange = (e) => {
    setFiles({ ...files, [e.target.name]: e.target.files[0] });
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFiles((prev) => ({ ...prev, FotoPerfil: file }));
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  const handleClear = () => {
    setFormData({
      Nombrecompleto: '',
      dob: '',
      Genero: '',
      Direccion: '',
      Telefono: '',
      Telefonodecasa: '',
      nombredelaescuela: '',
      IDestudiante: '',
      Carrera: '',
      Semestre: '',
      turno: ''
    });
    setTipoPeriodo('Semestre');
    setFiles({
      FotoPerfil: null,
      INE: null,
      Credencial: null,
      CartaPresentacion: null,
      ConstanciaEstudios: null,
      ActaNacimiento: null,
      CURP: null,
      NumeroSeguroSocial: null
    });
    setFotoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validación en el cliente de campos de texto obligatorios
    const requiredFields = [
      { key: 'Nombrecompleto', label: 'Nombre completo' },
      { key: 'dob', label: 'Fecha de nacimiento' },
      { key: 'Genero', label: 'Género' },
      { key: 'Direccion', label: 'Dirección' },
      { key: 'Telefono', label: 'Número de teléfono (10 dígitos)' },
      { key: 'nombredelaescuela', label: 'Nombre de la escuela' },
      { key: 'IDestudiante', label: 'ID / Matrícula' },
      { key: 'Carrera', label: 'Carrera' },
      { key: 'Semestre', label: tipoPeriodo }
    ];

    const missing = requiredFields.filter((f) => !formData[f.key] || !String(formData[f.key]).trim());
    if (missing.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: `Por favor completa: ${missing.map((m) => m.label).join(', ')}`,
        confirmButtonColor: '#ef5522'
      });
      return;
    }

    if (formData.Telefono.length < 10) {
      Swal.fire({
        icon: 'warning',
        title: 'Teléfono incompleto',
        text: 'El número de teléfono debe tener 10 dígitos.',
        confirmButtonColor: '#ef5522'
      });
      return;
    }

    // 2. Validación de fotografía y documentos obligatorios
    const requiredDocs = [
      { key: 'FotoPerfil', label: 'Fotografía de tu rostro' },
      { key: 'INE', label: 'Copia del INE' },
      { key: 'Credencial', label: 'Credencial de la escuela' },
      { key: 'CartaPresentacion', label: 'Carta de presentación' },
      { key: 'ConstanciaEstudios', label: 'Constancia de estudios' },
      { key: 'ActaNacimiento', label: 'Acta de nacimiento' },
      { key: 'CURP', label: 'CURP' },
      { key: 'NumeroSeguroSocial', label: 'Copia del número de seguro social' }
    ];

    const missingDocs = requiredDocs.filter((d) => !files[d.key]);
    if (missingDocs.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Documentos faltantes',
        html: `<p style="margin-bottom: 8px;">Debes adjuntar todos los documentos requeridos:</p>
               <ul style="text-align: left; display: inline-block; color: #b91c1c; font-size: 0.9rem;">
                 ${missingDocs.map((d) => `<li>${d.label}</li>`).join('')}
               </ul>`,
        confirmButtonColor: '#ef5522'
      });
      return;
    }

    // Modal de carga
    Swal.fire({
      title: 'Enviando registro...',
      text: 'Por favor espera mientras subimos tus datos y documentos.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const dataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
      dataToSend.append(key, formData[key]);
    });
    Object.keys(files).forEach((key) => {
      if (files[key]) dataToSend.append(key, files[key]);
    });

    try {
      const response = await fetch(`${API_URL}/api/students/register`, {
        method: 'POST',
        body: dataToSend
      });
      const result = await response.json();

      if (response.ok && result.success) {
        await Swal.fire({
          icon: 'success',
          title: '¡Registro exitoso!',
          text: 'Tus datos y documentos han sido enviados correctamente.',
          confirmButtonColor: '#ef5522'
        });
        handleClear();
      } else {
        const errorMsg = result.error || 'No se pudo guardar el registro.';
        Swal.fire({
          icon: response.status === 409 ? 'warning' : 'error',
          title: response.status === 409 ? 'Registro duplicado' : 'Error en el registro',
          text: errorMsg,
          confirmButtonColor: '#ef5522'
        });
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo conectar con el servidor. Verifica que el backend esté encendido.',
        confirmButtonColor: '#ef5522'
      });
    }
  };

  return (
    <div className="Form-card">
      <div className="Form-header">
        <div>
          <h2>Registro de estudiantes</h2>
          <p>"Sube tus datos y documentos"</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Informacion Personal */}
        <div className="Form-section">
          <div className="Section-title">
            <h3>Datos Personales</h3>
          </div>

          {/* Subir foto de perfil / rostro */}
          <div className="Foto-perfil-wrapper">
            <div className="Foto-perfil-preview">
              {fotoPreview ? (
                <img src={fotoPreview} alt="Foto de perfil" className="Foto-perfil-img" />
              ) : (
                <div className="Foto-perfil-placeholder">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>Sin foto</span>
                </div>
              )}
            </div>
            <div className="Foto-perfil-info">
              <label className="Btn-upload-foto">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                {fotoPreview ? 'Cambiar fotografía' : 'Subir foto de tu rostro'}
                <input
                  type="file"
                  name="FotoPerfil"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleFotoChange}
                  style={{ display: 'none' }}
                />
              </label>
              <p className="Foto-perfil-ayuda">Foto frontal, clara y legible (JPG, PNG o WEBP).</p>
            </div>
          </div>

          <div className="Form-grid">
            <div className="Form-group">
              <label>Nombre completo *</label>
              <input
                type="text"
                name="Nombrecompleto"
                placeholder="Nombre completo"
                value={formData.Nombrecompleto}
                onChange={handleChange}
                required
              />
            </div>
            <div className="Form-group">
              <label>Fecha de Nacimiento*</label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                required
              />
            </div>
            <div className="Form-group">
              <label>Genero *</label>
              <select
                name="Genero"
                value={formData.Genero}
                onChange={handleChange}
                required
              >
                <option value="">Seleciona Genero</option>
                <option value="male">Hombre</option>
                <option value="female">Mujer</option>
              </select>
            </div>
            <div className="Form-group">
              <label>Direccion*</label>
              <input
                type="text"
                name="Direccion"
                placeholder=""
                value={formData.Direccion}
                onChange={handleChange}
                required
              />
            </div>

            <div className="Form-group">
              <label>Numero de telefono *</label>
              <input
                type="tel"
                name="Telefono"
                placeholder="Ej. 4491234567"
                inputMode="numeric"
                maxLength="10"
                value={formData.Telefono}
                onChange={handleChange}
                required
              />
            </div>
            <div className="Form-group">
              <label> Telefono de casa *</label>
              <input
                type="tel"
                name="Telefonodecasa"
                placeholder="Ej. 4499876543"
                inputMode="numeric"
                maxLength="10"
                value={formData.Telefonodecasa}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        {/* Informacion Academica */}
        <div className="Form-section">
          <div className="Section-title">
            <span className="Section-icon"></span>
            <h3>Datos Escolares</h3>
          </div>

          <div className="Form-grid">
            <div className="Form-group">
              <label>Nombre de la escuela*</label>
              <input
                type="text"
                name="nombredelaescuela"
                value={formData.nombredelaescuela}
                onChange={handleChange}
                required
              />
            </div>
            <div className="Form-group">
              <label>ID de estudiante*</label>
              <input
                type="text"
                name="IDestudiante"
                placeholder="e.g. 2025001"
                value={formData.IDestudiante}
                onChange={handleChange}
                required
              />
            </div>
            <div className="Form-group">
              <label>Carrera/Especialidad*</label>
              <input
                type="text"
                name="Carrera"
                placeholder=""
                value={formData.Carrera}
                onChange={handleChange}
                required
              />
            </div>

            {/* Modalidad: Semestre o Cuatrimestre */}
            <div className="Form-group">
              <label>Modalidad escolar *</label>
              <select
                value={tipoPeriodo}
                onChange={handlePeriodoTypeChange}
                required
              >
                <option value="Semestre">Semestre</option>
                <option value="Cuatrimestre">Cuatrimestre</option>
              </select>
            </div>

            {/* Número según la modalidad seleccionada */}
            <div className="Form-group">
              <label>Número de {tipoPeriodo} *</label>
              <select
                name="Semestre"
                value={formData.Semestre}
                onChange={handleChange}
                required
              >
                <option value="">Selecciona {tipoPeriodo.toLowerCase()}</option>
                {Array.from({ length: tipoPeriodo === 'Cuatrimestre' ? 12 : 10 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={`${num}° ${tipoPeriodo}`}>
                    {num}° {tipoPeriodo}
                  </option>
                ))}
              </select>
            </div>

            {/* Turno: Matutino o Vespertino */}
            <div className="Form-group">
              <label>Turno *</label>
              <select
                name="turno"
                value={formData.turno}
                onChange={handleChange}
                required
              >
                <option value="">Selecciona Turno</option>
                <option value="Matutino">Matutino</option>
                <option value="Vespertino">Vespertino</option>
              </select>
            </div>

          </div>
        </div>

        {/* Documentos */}
        <div className="Form-section">
          <div className="Section-title">
            <span className="Section-icon"></span>
            <h3>Documentos Requeridos</h3>
          </div>
          <div className="Form-grid">
            <div className="Form-group">
              <label>Copia del INE "Mayores de edad"* (Image)</label>
              <input
                type="file"
                name="INE"
                accept=".png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="File-input"
              />
            </div>
            <div className="Form-group">
              <label>Credencial de la escuela* (Imagen)</label>
              <input
                type="file"
                name="Credencial"
                accept=".png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="File-input"
              />
            </div>
            <div className="Form-group">
              <label>Carta de Presentacion* (Imagen)</label>
              <input
                type="file"
                name="CartaPresentacion"
                accept=".png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="File-input"
              />
            </div>
            <div className="Form-group">
              <label>Constancia de estudios* (Imagen)</label>
              <input
                type="file"
                name="ConstanciaEstudios"
                accept=".png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="File-input"
              />
            </div>
            <div className="Form-group">
              <label>Acta de nacimiento* (Imagen)</label>
              <input
                type="file"
                name="ActaNacimiento"
                accept=".png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="File-input"
              />
            </div>
            <div className="Form-group">
              <label>CURP* (Imagen)</label>
              <input
                type="file"
                name="CURP"
                accept=".png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="File-input"
              />
            </div>
            <div className="Form-group">
              <label>Copia del numero de seguro social* (Imagen)</label>
              <input
                type="file"
                name="NumeroSeguroSocial"
                accept=".png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="File-input"
              />
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="Form-actions">
          <button type="submit" className="Btn-submit">
            Registro de estudiante
          </button>
        </div>
      </form>
    </div>
  );
}

export default InfoPersonal;