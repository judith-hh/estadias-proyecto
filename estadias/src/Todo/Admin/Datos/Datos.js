import React, { useState, useMemo, useEffect } from 'react';
import Swal from 'sweetalert2';
import API_URL from '../../../config';
import './Datos.css';

const DOC_LABELS = {
  INE: 'INE',
  Credencial: 'Credencial de la escuela',
  CartaPresentacion: 'Carta de presentación',
  ConstanciaEstudios: 'Constancia de estudios',
  ActaNacimiento: 'Acta de nacimiento',
  CURP: 'CURP',
  NumeroSeguroSocial: 'Número de seguro social'
};

const STATUS_LABELS = {
  pendiente: 'Pendiente',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado'
};

function AdminPanel() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [selected, setSelected] = useState(null);

  // Estados para crear nuevo usuario administrador
  const [mostrarModalAdmin, setMostrarModalAdmin] = useState(false);
  const [nuevoIdentificador, setNuevoIdentificador] = useState('');
  const [nuevoPassword, setNuevoPassword] = useState('');
  const [creandoAdmin, setCreandoAdmin] = useState(false);
  const [errorAdmin, setErrorAdmin] = useState('');
  const [exitoAdmin, setExitoAdmin] = useState('');

  const handleCrearAdmin = async (e) => {
    e.preventDefault();
    setErrorAdmin('');
    setExitoAdmin('');
    setCreandoAdmin(true);

    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/api/auth/register-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          identificador: nuevoIdentificador,
          password: nuevoPassword
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        Swal.fire({
          icon: 'success',
          title: '¡Administrador creado!',
          text: 'El nuevo administrador se registró con éxito en la base de datos.',
          confirmButtonColor: '#ef5522'
        });
        setNuevoIdentificador('');
        setNuevoPassword('');
        setMostrarModalAdmin(false);
      } else {
        const errorMsg = data.error || 'No se pudo crear el usuario';
        setErrorAdmin(errorMsg);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errorMsg,
          confirmButtonColor: '#ef5522'
        });
      }
    } catch (err) {
      console.error(err);
      setErrorAdmin('Error de conexión con el servidor');
    } finally {
      setCreandoAdmin(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/api/estudiantes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      } else if (res.status === 401 || res.status === 403) {
        Swal.fire({
          icon: 'warning',
          title: 'Sesión expirada',
          text: 'Tu sesión ha expirado. Por favor ingresa nuevamente.',
          confirmButtonColor: '#ef5522'
        }).then(() => {
          localStorage.removeItem('admin_user');
          localStorage.removeItem('admin_token');
          window.location.reload();
        });
      }
    } catch (err) {
      console.error('Error al cargar estudiantes:', err);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const counts = useMemo(() => ({
    total: students.length,
    pendiente: students.filter((s) => s.status === 'pendiente').length,
    aprobado: students.filter((s) => s.status === 'aprobado').length,
    rechazado: students.filter((s) => s.status === 'rechazado').length
  }), [students]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return students.filter((s) => {
      const matchStatus = statusFilter === 'todos' || s.status === statusFilter;
      const matchSearch =
        !term ||
        (s.Nombrecompleto && s.Nombrecompleto.toLowerCase().includes(term)) ||
        (s.IDestudiante && s.IDestudiante.toLowerCase().includes(term)) ||
        (s.nombredelaescuela && s.nombredelaescuela.toLowerCase().includes(term));
      return matchStatus && matchSearch;
    });
  }, [students, search, statusFilter]);

  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/api/estudiantes/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
        setSelected((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
        Swal.fire({
          icon: 'success',
          title: 'Estado actualizado',
          text: `El registro ahora está en estado "${STATUS_LABELS[status]}".`,
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo actualizar el estado en el servidor',
          confirmButtonColor: '#ef5522'
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'Error de conexión al actualizar estado',
        confirmButtonColor: '#ef5522'
      });
    }
  };

  const handleDelete = async (id) => {
    // Cerramos la ventana modal de inmediato para evitar que quede congelada de fondo
    setSelected(null);

    const confirm = await Swal.fire({
      title: '¿Eliminar este registro?',
      text: 'Esta acción no se puede deshacer y borrará los documentos asociados.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirm.isConfirmed) {
      // Si cancela, reabrimos el detalle del estudiante
      const est = students.find((s) => s.id === id);
      if (est) setSelected(est);
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/api/estudiantes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setStudents((prev) => prev.filter((s) => s.id !== id));
        setSelected(null);
        Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'El estudiante fue eliminado correctamente.',
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo eliminar el registro',
          confirmButtonColor: '#ef5522'
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo conectar con el servidor',
        confirmButtonColor: '#ef5522'
      });
    }
  };

  return (
    <div className="Form-card Admin-card">
      <div className="Form-header Admin-form-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="Admin-header-avatar">
            <img
              src="/dino-descubre.png"
              alt="Mascota Descubre"
              className="Admin-header-dino"
            />
          </div>
          <div>
            <h2>Panel de administración</h2>
            <p>Revisa los registros de estudiantes y valida sus documentos.</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="Admin-toolbar">
        <div className="Form-group Toolbar-search">
          <label htmlFor="buscar">Buscar</label>
          <input
            id="buscar"
            type="text"
            placeholder="Nombre, ID de estudiante o escuela"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="Form-group Toolbar-filter">
          <label htmlFor="estado">Estado</label>
          <select
            id="estado"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="pendiente">Pendientes</option>
            <option value="aprobado">Aprobados</option>
            <option value="rechazado">Rechazados</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="Table-wrapper">
        <table className="Admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>ID</th>
              <th>Escuela</th>
              <th>Carrera</th>
              <th>Semestre</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="7" className="Table-empty">
                  No hay registros que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id}>
                  <td className="Cell-name">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {s.foto_perfil ? (
                        <img
                          src={s.foto_perfil}
                          alt={s.Nombrecompleto}
                          style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #ef5522' }}
                        />
                      ) : (
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 'bold', color: '#64748b' }}>
                          {s.Nombrecompleto ? s.Nombrecompleto[0].toUpperCase() : '?'}
                        </div>
                      )}
                      <span>{s.Nombrecompleto}</span>
                    </div>
                  </td>
                  <td>{s.IDestudiante}</td>
                  <td>{s.nombredelaescuela}</td>
                  <td>{s.Carrera}</td>
                  <td>{s.Semestre}</td>
                  <td>
                    <span className={`Badge Badge-${s.status}`}>
                      {STATUS_LABELS[s.status]}
                    </span>
                  </td>
                  <td className="Cell-actions">
                    <button
                      type="button"
                      className="Btn-clear"
                      onClick={() => setSelected(s)}
                    >
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detalle del estudiante */}
      {selected && (
        <div className="Modal-overlay" onClick={() => setSelected(null)}>
          <div
            className="Modal-card"
            role="dialog"
            aria-modal="true"
            aria-label={`Detalle de ${selected.Nombrecompleto}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="Modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {selected.foto_perfil ? (
                  <img
                    src={selected.foto_perfil}
                    alt={selected.Nombrecompleto}
                    style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #ef5522' }}
                  />
                ) : (
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', color: '#64748b' }}>
                    {selected.Nombrecompleto ? selected.Nombrecompleto[0].toUpperCase() : '?'}
                  </div>
                )}
                <div>
                  <h2 style={{ margin: 0 }}>{selected.Nombrecompleto}</h2>
                  <span className={`Badge Badge-${selected.status}`}>
                    {STATUS_LABELS[selected.status]}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="Modal-close"
                aria-label="Cerrar"
                onClick={() => setSelected(null)}
              >
                ×
              </button>
            </div>

            <div className="Form-section">
              <div className="Section-title">
                <h3>Datos personales</h3>
              </div>
              <dl className="Detail-grid">
                <div><dt>Fecha de nacimiento</dt><dd>{selected.dob}</dd></div>
                <div><dt>Género</dt><dd>{selected.Genero === 'male' ? 'Hombre' : 'Mujer'}</dd></div>
                <div><dt>Dirección</dt><dd>{selected.Direccion}</dd></div>
                <div><dt>Teléfono</dt><dd>{selected.Telefono}</dd></div>
                <div><dt>Teléfono de casa</dt><dd>{selected.Telefonodecasa}</dd></div>
              </dl>
            </div>

            <div className="Form-section">
              <div className="Section-title">
                <h3>Datos escolares</h3>
              </div>
              <dl className="Detail-grid">
                <div><dt>Escuela</dt><dd>{selected.nombredelaescuela}</dd></div>
                <div><dt>ID de estudiante</dt><dd>{selected.IDestudiante}</dd></div>
                <div><dt>Carrera</dt><dd>{selected.Carrera}</dd></div>
                <div><dt>Semestre / Cuatrimestre</dt><dd>{selected.Semestre}</dd></div>
                <div><dt>Turno</dt><dd>{selected.turno || 'No especificado'}</dd></div>
              </dl>
            </div>

            <div className="Form-section">
              <div className="Section-title">
                <h3>Documentos</h3>
              </div>
              <ul className="Docs-list">
                {Object.keys(DOC_LABELS).map((key) => (
                  <li key={key}>
                    <span>{DOC_LABELS[key]}</span>
                    {selected.docs[key] ? (
                      <a
                        href={selected.docs[key]}
                        target="_blank"
                        rel="noreferrer"
                        className="Doc-link"
                      >
                        Ver Imagen
                      </a>
                    ) : (
                      <span className="Doc-missing">No entregado</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="Form-actions Modal-actions">
              <button
                type="button"
                className="Btn-danger"
                onClick={() => handleDelete(selected.id)}
              >
                Eliminar
              </button>
              <button
                type="button"
                className="Btn-clear"
                onClick={() => updateStatus(selected.id, 'rechazado')}
              >
                Rechazar
              </button>
              <button
                type="button"
                className="Btn-submit"
                onClick={() => updateStatus(selected.id, 'aprobado')}
              >
                Aprobar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Crear Nuevo Administrador */}
      {mostrarModalAdmin && (
        <div className="Modal-overlay" onClick={() => setMostrarModalAdmin(false)}>
          <div
            className="Modal-card Modal-card-admin"
            role="dialog"
            aria-modal="true"
            aria-label="Crear Nuevo Administrador"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="Modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

                <div>
                  <h2 style={{ margin: 0 }}>Registrar Nuevo Administrador</h2>
                  <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                    Crea un usuario para dar acceso al panel a otro miembro del equipo.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="Modal-close"
                aria-label="Cerrar"
                onClick={() => setMostrarModalAdmin(false)}
              >
                &times;
              </button>
            </div>

            {errorAdmin && (
              <div className="Admin-msg Admin-msg-error">
                {errorAdmin}
              </div>
            )}

            {exitoAdmin && (
              <div className="Admin-msg Admin-msg-success">
                {exitoAdmin}
              </div>
            )}

            <form onSubmit={handleCrearAdmin} className="Form-nuevo-admin">
              <div className="Form-group">
                <label>Correo o Usuario del nuevo administrador *</label>
                <input
                  type="text"
                  placeholder="ej. nuevo.admin@correo.com"
                  value={nuevoIdentificador}
                  onChange={(e) => setNuevoIdentificador(e.target.value)}
                  required
                />
              </div>

              <div className="Form-group">
                <label>Contraseña provisional *</label>
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={nuevoPassword}
                  onChange={(e) => setNuevoPassword(e.target.value)}
                  required
                />
              </div>

              <div className="Form-actions Modal-actions" style={{ marginTop: '20px' }}>
                <button
                  type="button"
                  className="Btn-clear"
                  onClick={() => setMostrarModalAdmin(false)}
                  disabled={creandoAdmin}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="Btn-submit"
                  disabled={creandoAdmin}
                >
                  {creandoAdmin ? 'Guardando en MySQL...' : 'Crear Administrador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;