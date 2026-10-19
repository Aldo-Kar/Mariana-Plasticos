/** Cliente API común. Los errores del backend se muestran; no se sustituyen por datos simulados. */
const API = (() => {
  const BASE_URL = 'http://localhost:8080/api';
  async function request(ruta, opciones = {}) {
    const resp = await fetch(`${BASE_URL}${ruta}`, { headers: {'Content-Type':'application/json'}, ...opciones });
    const cuerpo = await resp.json().catch(() => ({}));
    if (!resp.ok || cuerpo.success === false) throw new Error(cuerpo.message || `Error ${resp.status}`);
    return cuerpo.data !== undefined ? cuerpo.data : cuerpo;
  }
  function crud(recurso) { return {
    listar: () => request(`/${recurso}`), obtener: id => request(`/${recurso}/${id}`),
    crear: datos => request(`/${recurso}`, {method:'POST',body:JSON.stringify(datos)}),
    actualizar: (id,datos) => request(`/${recurso}/${id}`, {method:'PUT',body:JSON.stringify(datos)}),
    eliminar: id => request(`/${recurso}/${id}`, {method:'DELETE'})
  }; }
  const auth={login:(correo,contrasena)=>request('/auth/login',{method:'POST',body:JSON.stringify({correo,contrasena})}),logout:()=>localStorage.removeItem('mp_sesion'),sesionActual:()=>{try{return JSON.parse(localStorage.getItem('mp_sesion'));}catch{return null;}}};
  return {BASE_URL,request,auth,productos:crud('productos'),categorias:crud('categorias'),inventario:crud('inventario'),movimientos:crud('movimientos'),pedidos:crud('pedidos'),clientes:crud('clientes'),usuarios:crud('usuarios')};
})();
