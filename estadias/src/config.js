// Configuración de la URL de la API del Backend
// Si existe REACT_APP_API_URL en las variables de entorno, la usa; si no, usa la de Railway en producción
const API_URL = process.env.REACT_APP_API_URL || 'https://estadias-proyecto-production.up.railway.app';

export default API_URL;
