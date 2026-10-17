/**
 * api.js — Capa de conexión Frontend ↔ Backend (Spring Boot REST)
 *
 * Reemplaza gradualmente el uso de DB (mock de data.js) por llamadas a la API.
 * Si el backend no responde, hace fallback automático a los datos simulados
 * para que la interfaz siga funcionando en desarrollo.
 *
 * Uso:
 *   const productos = await API.productos.listar();
 *   const usuario   = await API.auth.login(correo, contrasena);
 */

const API = (() => {
  // ---- Configuración ----
  const BASE_URL = 'http://localhost:8080/api';
  const USAR_BACKEND = true;   // poner en false para usar solo datos mock
  const TIEMPO_ESPERA_MS = 4000;

  // ---- Helpers internos ----
  async function request(ruta, opciones = {}) {
    const control = new AbortController();
    const timer = setTimeout(() => control.abort(), TIEMPO_ESPERA_MS);

    try {
      const resp = await fetch(`${BASE_URL}${ruta}`, {
        headers: { 'Content-Type': 'application/json' },
        signal: control.signal,
        ...opciones,
      });
      clearTimeout(timer);

      const cuerpo = await resp.json().catch(() => ({ success: false, message: 'Respuesta inválida' }));

      if (!resp.ok || cuerpo.success === false) {
        throw new Error(cuerpo.message || `Error ${resp.status}`);
      }
      // El backend resuelve con { success, message, data, timestamp }
      return cuerpo.data !== undefined ? cuerpo.data : cuerpo;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }

  // Indica si el backend está disponible (para decidir fallback)
  async function backendActivo() {
    try {
      await request('/productos', { method: 'GET' });
      return true;
    } catch {
      return false;
    }
  }

  // ---- Autenticación ----
  const auth = {
    async login(correo, contrasena) {
      if (!USAR_BACKEND) {
        // Fallback: validar contra DB mock (data.js)
        const u = DB.usuarios.find(x => x.correo === correo && x.contraseña === contrasena);
        if (!u) throw new Error('Credenciales incorrectas');
        guardarSesion(u);
        return u;
      }
      const usuario = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ correo, contrasena }),
      });
      guardarSesion(usuario);
      return usuario;
    },
    logout() {
      localStorage.removeItem('mp_sesion');
    },
    sesionActual() {
      try { return JSON.parse(localStorage.getItem('mp_sesion')); } catch { return null; }
    },
  };

  function guardarSesion(usuario) {
    const copia = { ...usuario };
    delete copia.contrasena;
    delete copia.contraseña;
    localStorage.setItem('mp_sesion', JSON.stringify(copia));
  }

  // ---- CRUD genérico (factory) ----
  function crud(recurso, mockLista) {
    return {
      async listar() {
        if (!USAR_BACKEND) return [...mockLista];
        try { return await request(`/${recurso}`); }
        catch { console.warn(`[API] fallback a mock: /${recurso}`); return [...mockLista]; }
      },
      async obtener(id) {
        if (!USAR_BACKEND) return mockLista.find(x => Object.values(x)[0] === id);
        return request(`/${recurso}/${id}`);
      },
      async crear(datos) {
        if (!USAR_BACKEND) {
          const nuevo = { id: Date.now(), ...datos };
          mockLista.push(nuevo);
          return nuevo;
        }
        return request(`/${recurso}`, { method: 'POST', body: JSON.stringify(datos) });
      },
      async actualizar(id, datos) {
        if (!USAR_BACKEND) {
          const idx = mockLista.findIndex(x => Object.values(x)[0] === id);
          if (idx >= 0) mockLista[idx] = { ...mockLista[idx], ...datos };
          return mockLista[idx];
        }
        return request(`/${recurso}/${id}`, { method: 'PUT', body: JSON.stringify(datos) });
      },
      async eliminar(id) {
        if (!USAR_BACKEND) {
          const idx = mockLista.findIndex(x => Object.values(x)[0] === id);
          if (idx >= 0) mockLista.splice(idx, 1);
          return { ok: true };
        }
        return request(`/${recurso}/${id}`, { method: 'DELETE' });
      },
    };
  }

  // ---- Recursos ----
  const productos  = crud('productos',  DB.productos);
  const categorias = crud('categorias', DB.categorias);
  const inventario = crud('inventario', DB.inventario);
  const movimientos= crud('movimientos',DB.movimientos);
  const pedidos    = crud('pedidos',    DB.pedidos);
  const clientes   = crud('clientes',   DB.clientes);
  const usuarios   = crud('usuarios',   DB.usuarios);

  return { BASE_URL, USAR_BACKEND, backendActivo, auth,
           productos, categorias, inventario, movimientos, pedidos, clientes, usuarios };
})();

// Ejemplo de migración en app.js:
//   // Antes (mock):
//   const lista = DB.productos;
//   // Ahora (API real con fallback):
//   const lista = await API.productos.listar();
