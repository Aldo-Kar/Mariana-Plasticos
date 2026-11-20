/** Cliente API común. Los errores del backend se muestran; no se sustituyen por datos simulados. */
const BASE_URL = 'http://localhost:8080/api';
const API = (() => {
  async function request(ruta, opciones = {}) {
  try {
    const resp = await fetch(`${BASE_URL}${ruta}`, {
      headers: { "Content-Type": "application/json" },
      ...opciones
    });

    // Leer como texto primero para evitar error de JSON
    const textoRespuesta = await resp.text();
    
    let cuerpo;
    try {
      cuerpo = JSON.parse(textoRespuesta);
    } catch (errorParse) {
      cuerpo = { 
        success: false, 
        message: textoRespuesta || "Respuesta no válida del servidor" 
      };
    }

    // Verificar estado
    if (!resp.ok || cuerpo.success === false) {
      throw new Error(cuerpo.message || `Error ${resp.status}: ${resp.statusText}`);
    }

    return cuerpo.data !== undefined ? cuerpo.data : cuerpo;

  } catch (errorRed) {
    throw new Error(
      errorRed.message.includes("Failed to fetch") || errorRed.message.includes("NetworkError")
        ? "🔌 No hay conexión con el servidor. Si está en Render, espera 30–60s y vuelve a intentar.\nDetalles: " + errorRed.message
        : errorRed.message
    );
  }
}



  function crud(recurso) {
    return {
      listar: () => request(`/${recurso}`),
      obtener: id => request(`/${recurso}/${id}`),
      crear: datos => request(`/${recurso}`, { method: "POST", body: JSON.stringify(datos) }),
      actualizar: (id, datos) => request(`/${recurso}/${id}`, { method: "PUT", body: JSON.stringify(datos) }),
      eliminar: id => request(`/${recurso}/${id}`, { method: "DELETE" })
    };
  }

  const auth = {
    login: (correo, contraseña) => request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ correo, contraseña })
    }),
    logout: () => localStorage.removeItem("token")
  };

  return { BASE_URL, request, auth,
    productos: crud("productos"),
    categorias: crud("categorias"),
    inventario: crud("inventario"),
    movimientos: crud("movimientos"),
    pedidos: crud("pedidos"),
    clientes: crud("clientes"),
    usuarios: crud("usuarios")
  };
})();


