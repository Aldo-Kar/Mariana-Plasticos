/** Mariana Plásticos: interfaz conectada al backend Spring Boot/MySQL. */
const API_BASE = 'http://localhost:8080/api';
let usuarioActual = null;
let cache = { productos: [], categorias: [], inventario: [], movimientos: [], pedidos: [], clientes: [], usuarios: [] };

async function api(ruta, opciones = {}) {
  const respuesta = await fetch(`${API_BASE}${ruta}`, {
    ...opciones,
    headers: { 'Content-Type': 'application/json', ...(opciones.headers || {}) }
  });
  const cuerpo = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok || cuerpo.success === false) throw new Error(cuerpo.message || `Error HTTP ${respuesta.status}`);
  return cuerpo.data !== undefined ? cuerpo.data : cuerpo;
}
const get = ruta => api(ruta);
const post = (ruta, datos) => api(ruta, { method: 'POST', body: JSON.stringify(datos) });
const put = (ruta, datos) => api(ruta, { method: 'PUT', body: JSON.stringify(datos) });
const del = ruta => api(ruta, { method: 'DELETE' });
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(Number(n)||0);
const date = v => v ? new Date(v).toLocaleString('es-MX') : '—';
const byId = (arr, key, id) => arr.find(x => Number(x[key]) === Number(id));
function showError(error) { console.error(error); alert(`No se pudo completar la operación.\n${error.message || error}\n\nVerifica que Spring Boot esté ejecutándose y conectado a MySQL.`); }
async function cargarDatos() {
  const recursos = ['productos','categorias','inventario','movimientos','pedidos','clientes','usuarios'];
  const resultados = await Promise.allSettled(recursos.map(r => get('/'+r)));
  resultados.forEach((r,i) => { cache[recursos[i]] = r.status === 'fulfilled' && Array.isArray(r.value) ? r.value : []; });
  resultados.forEach((r,i) => { if (r.status === 'rejected') console.warn(`No se pudo cargar ${recursos[i]}`, r.reason); });
}

// Autenticación
async function login() {
  const correo = document.getElementById('loginEmail').value.trim();
  const contrasena = document.getElementById('loginPass').value;
  const errorEl = document.getElementById('loginError');
  if (!correo || !contrasena) { errorEl.textContent='Completa todos los campos'; errorEl.style.display='block'; return; }
  try {
    const u = await post('/auth/login', { correo, contrasena });
    usuarioActual = u; localStorage.setItem('usuario', JSON.stringify(u));
    errorEl.style.display='none'; document.getElementById('login').style.display='none'; document.getElementById('app').style.display='block';
    pintarUsuario(); await cargarDatos(); await mostrarPagina('dashboard');
  } catch (e) { errorEl.textContent=e.message || 'No se pudo conectar con el servidor'; errorEl.style.display='block'; }
}
function pintarUsuario() {
  const nombre = usuarioActual?.nombre || 'Usuario';
  document.getElementById('userAvatar').textContent = nombre.split(/\s+/).map(n=>n[0]).join('').slice(0,2).toUpperCase();
  document.getElementById('userName').textContent = nombre;
  document.getElementById('userRole').textContent = usuarioActual?.idRol === 1 ? 'Administrador' : (usuarioActual?.rol || 'Usuario');
}
function logout() { usuarioActual=null; localStorage.removeItem('usuario'); document.getElementById('app').style.display='none'; document.getElementById('login').style.display='flex'; document.getElementById('loginEmail').value=''; document.getElementById('loginPass').value=''; }

async function mostrarPagina(id) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
  document.querySelectorAll('.nav-link').forEach(l=>l.classList.toggle('active',l.dataset.page===id));
  try { await cargarDatos(); const renders={dashboard:renderDashboard,productos:renderProductos,inventario:renderInventario,movimientos:renderMovimientos,pedidos:renderPedidos}; if(renders[id]) await renders[id](); }
  catch(e) { showError(e); }
}

// Dashboard
async function renderDashboard() {
  document.getElementById('statProductos').textContent=cache.productos.filter(p=>p.estado==='Activo').length;
  document.getElementById('statStockBajo').textContent=cache.inventario.filter(i=>{const p=byId(cache.productos,'idProducto',i.idProducto);return p && Number(i.cantidadActual)<=Number(p.stockMinimo||0)}).length;
  document.getElementById('statPedidos').textContent=cache.pedidos.filter(p=>['Pendiente','En preparación'].includes(p.estado)).length;
  document.getElementById('statMovimientos').textContent=cache.movimientos.filter(m=>m.fechaMovimiento && new Date(m.fechaMovimiento).toDateString()===new Date().toDateString()).length;
  const bajo=cache.inventario.filter(i=>{const p=byId(cache.productos,'idProducto',i.idProducto);return p && Number(i.cantidadActual)<=Number(p.stockMinimo||0)});
  document.getElementById('tablaStockBajo').innerHTML=bajo.length?bajo.map(i=>{const p=byId(cache.productos,'idProducto',i.idProducto);return `<tr><td>${esc(p?.nombre)}</td><td>${esc(byId(cache.categorias,'idCategoria',p?.idCategoria)?.nombre||'—')}</td><td>${esc(i.cantidadActual)}</td><td>${esc(p?.stockMinimo??0)}</td><td><span class="badge badge-danger">Stock bajo</span></td></tr>`}).join(''):'<tr><td colspan="5" style="text-align:center">No hay productos con stock bajo</td></tr>';
}

// Productos CRUD
async function renderProductos() {
  cache.productos = await get('/productos'); cache.categorias = await get('/categorias');
  const filtro=(document.getElementById('searchProductos')?.value||'').toLowerCase();
  const lista=cache.productos.filter(p=>(`${p.nombre||''} ${p.sku||''}`).toLowerCase().includes(filtro));
  document.getElementById('tablaProductos').innerHTML=lista.length?lista.map(p=>`<tr><td><strong>${esc(p.nombre)}</strong><br><small>${esc(p.sku||'Sin SKU')}</small></td><td>${esc(byId(cache.categorias,'idCategoria',p.idCategoria)?.nombre||p.idCategoria||'—')}</td><td>${money(p.precioUnitario)}</td><td>${esc(p.stockMinimo??'—')}</td><td><span class="badge ${p.estado==='Activo'?'badge-success':'badge-danger'}">${esc(p.estado||'—')}</span></td><td class="actions"><button class="btn-icon" title="Editar" onclick="abrirModalProducto(${p.idProducto})">✏️</button><button class="btn-icon danger" title="Eliminar" onclick="eliminarProducto(${p.idProducto})">🗑️</button></td></tr>`).join(''):'<tr><td colspan="6" style="text-align:center">No hay productos registrados</td></tr>';
  const sel=document.getElementById('prodCategoria'); if(sel) sel.innerHTML=cache.categorias.map(c=>`<option value="${c.idCategoria}">${esc(c.nombre)}</option>`).join('');
}
async function abrirModalProducto(id=null) {
  await renderProductos(); const p=id?byId(cache.productos,'idProducto',id):null;
  document.getElementById('prodId').value=p?.idProducto||''; document.getElementById('modalProductoTitle').textContent=p?'Editar producto':'Nuevo producto';
  for(const [idEl,val] of Object.entries({prodSku:p?.sku||'',prodNombre:p?.nombre||'',prodDescripcion:p?.descripcion||'',prodPrecio:p?.precioUnitario??'',prodStockMin:p?.stockMinimo??10,prodEstado:p?.estado||'Activo'})) document.getElementById(idEl).value=val;
  if(p?.idCategoria) document.getElementById('prodCategoria').value=p.idCategoria;
  cerrarModal('modalProducto'); document.getElementById('modalProducto').classList.add('active');
}
async function guardarProducto() {
  const id=document.getElementById('prodId').value;
  const datos={sku:document.getElementById('prodSku').value.trim(),nombre:document.getElementById('prodNombre').value.trim(),descripcion:document.getElementById('prodDescripcion').value.trim(),precioUnitario:Number(document.getElementById('prodPrecio').value||0),stockMinimo:Number(document.getElementById('prodStockMin').value||0),estado:document.getElementById('prodEstado').value,idCategoria:Number(document.getElementById('prodCategoria').value)};
  if(!datos.sku||!datos.nombre||!datos.idCategoria){alert('SKU, nombre y categoría son obligatorios.');return;}
  try { if(id) await put(`/productos/${id}`,datos); else await post('/productos',datos); cerrarModal('modalProducto'); await cargarDatos(); await renderProductos(); await renderDashboard(); }
  catch(e){showError(e);}
}
async function eliminarProducto(id) { if(!confirm('¿Eliminar este producto? Si tiene movimientos o inventario relacionado, MySQL puede impedirlo.'))return; try{await del(`/productos/${id}`);await cargarDatos();await renderProductos();await renderDashboard();}catch(e){showError(e);} }

// Inventario CRUD
async function renderInventario() {
  const [inv,prods]=await Promise.all([get('/inventario'),get('/productos')]);cache.inventario=inv;cache.productos=prods;
  document.getElementById('tablaInventario').innerHTML=inv.length?inv.map(i=>{const p=byId(prods,'idProducto',i.idProducto);const bajo=p&&Number(i.cantidadActual)<=Number(p.stockMinimo||0);return `<tr><td>${esc(p?.nombre||`Producto #${i.idProducto}`)}</td><td>${esc(i.ubicacion||'—')}</td><td>${esc(i.cantidadActual??0)}</td><td>${esc(p?.stockMinimo??'—')}</td><td><span class="badge ${bajo?'badge-danger':'badge-success'}">${bajo?'Stock bajo':'Normal'}</span></td><td class="actions"><button class="btn-icon" title="Editar" onclick="abrirModalInventario(${i.idInventario})">✏️</button><button class="btn-icon danger" title="Eliminar" onclick="eliminarInventario(${i.idInventario})">🗑️</button></td></tr>`}).join(''):'<tr><td colspan="6" style="text-align:center">No hay registros de inventario</td></tr>';
}
async function abrirModalInventario(id=null){await renderInventario();const i=id?byId(cache.inventario,'idInventario',id):null;const sel=document.getElementById('invProducto');sel.innerHTML=cache.productos.map(p=>`<option value="${p.idProducto}">${esc(p.nombre)}</option>`).join('');sel.disabled=!!i;document.querySelector('#modalInventario .modal-header h3').textContent=i?'Editar Inventario':'Agregar al Inventario';document.getElementById('invId').value=i?.idInventario||'';if(i)sel.value=i.idProducto;document.getElementById('invCantidad').value=i?.cantidadActual??0;document.getElementById('invUbicacion').value=i?.ubicacion||'';document.getElementById('modalInventario').classList.add('active');}
async function guardarInventario(){const id=document.getElementById('invId').value;const cantidad=Number(document.getElementById('invCantidad').value);const idProducto=Number(document.getElementById('invProducto').value);const ubicacion=document.getElementById('invUbicacion').value.trim();if(!Number.isInteger(cantidad)||cantidad<0){alert('La cantidad debe ser un entero igual o mayor que cero.');return;}try{if(id)await put(`/inventario/${id}`,{cantidadActual:cantidad,ubicacion});else{if(!idProducto){alert('Selecciona un producto.');return;}if(cache.inventario.some(i=>Number(i.idProducto)===idProducto)){alert('Este producto ya tiene un registro de inventario; edita el registro existente.');return;}await post('/inventario',{idProducto,cantidadActual:cantidad,ubicacion});}cerrarModal('modalInventario');await cargarDatos();await renderInventario();await renderDashboard();}catch(e){showError(e);}}
async function eliminarInventario(id){if(!confirm('¿Eliminar este registro de inventario?'))return;try{await del(`/inventario/${id}`);await renderInventario();await renderDashboard();}catch(e){showError(e);}}

// Movimientos: el esquema actual guarda encabezado (tipo, usuario, fecha, observaciones).
async function renderMovimientos(){cache.movimientos=await get('/movimientos');const usuarios=await get('/usuarios');cache.usuarios=usuarios;document.getElementById('tablaMovimientos').innerHTML=cache.movimientos.length?cache.movimientos.slice().sort((a,b)=>new Date(b.fechaMovimiento)-new Date(a.fechaMovimiento)).map(m=>`<tr><td>${date(m.fechaMovimiento)}</td><td>${esc(m.tipoMovimiento||'—')}</td><td>—</td><td>—</td><td>${esc(byId(usuarios,'idUsuario',m.idUsuario)?.nombre||`Usuario #${m.idUsuario}`)}</td><td>${esc(m.observaciones||'—')}</td><td><button class="btn-icon danger" title="Eliminar" onclick="eliminarMovimiento(${m.idMovimiento})">🗑️</button></td></tr>`).join(''):'<tr><td colspan="7" style="text-align:center">No hay movimientos registrados</td></tr>';}
async function registrarEntradaSalida(tipo){try{await cargarDatos();document.getElementById('movTipo').value=tipo;document.getElementById('modalMovimientoTitle').textContent=`Registrar ${tipo.toLowerCase()}`;document.getElementById('movProducto').innerHTML=cache.productos.map(p=>`<option value="${p.idProducto}">${esc(p.nombre)} (${esc(p.sku||'sin SKU')})</option>`).join('');document.getElementById('movCantidad').value=1;document.getElementById('movObservaciones').value='';document.getElementById('modalMovimiento').classList.add('active');}catch(e){showError(e);}}
async function guardarMovimiento(){const tipo=document.getElementById('movTipo').value;const idProducto=Number(document.getElementById('movProducto').value);const cantidad=Number(document.getElementById('movCantidad').value);const obs=document.getElementById('movObservaciones').value.trim();if(!idProducto||!Number.isInteger(cantidad)||cantidad<1){alert('Selecciona un producto e indica una cantidad entera mayor que cero.');return;}const usuarioId=usuarioActual?.idUsuario;if(!usuarioId){alert('No se identifica el usuario de la sesión. Vuelve a iniciar sesión.');return;}try{const inventarios=await get('/inventario');const inv=byId(inventarios,'idProducto',idProducto);if(!inv){alert('Este producto no tiene registro en Inventario. Crea primero su registro de inventario.');return;}const nueva=Number(inv.cantidadActual||0)+(tipo==='Entrada'?cantidad:-cantidad);if(nueva<0){alert('No hay existencias suficientes para registrar esta salida.');return;}await post('/movimientos',{idUsuario:usuarioId,tipoMovimiento:tipo,observaciones:`Producto #${idProducto}; cantidad: ${cantidad}. ${obs}`.trim()});await put(`/inventario/${inv.idInventario}`,{cantidadActual:nueva,ubicacion:inv.ubicacion});cerrarModal('modalMovimiento');await cargarDatos();await renderMovimientos();await renderInventario();await renderDashboard();alert('Movimiento guardado y existencia actualizada. Nota: el movimiento y el inventario se guardan en dos peticiones; para producción conviene convertirlo en una única transacción en el backend.');}catch(e){showError(e);}}
async function eliminarMovimiento(id){if(!confirm('¿Eliminar el registro de movimiento? Esta acción no revierte el cambio de existencias.'))return;try{await del(`/movimientos/${id}`);await renderMovimientos();}catch(e){showError(e);}}

// Pedidos CRUD del encabezado. La tabla Detalles_pedido no está expuesta por la API actual.
async function renderPedidos(){const [pedidos,clientes]=await Promise.all([get('/pedidos'),get('/clientes')]);cache.pedidos=pedidos;cache.clientes=clientes;document.getElementById('tablaPedidos').innerHTML=pedidos.length?pedidos.map(p=>`<tr><td>#${p.idPedido}</td><td>${esc(byId(clientes,'idCliente',p.idCliente)?.nombre||`Cliente #${p.idCliente}`)}</td><td>${date(p.fechaPedido)}</td><td>${money(p.total)}</td><td><span class="badge">${esc(p.estado||'—')}</span></td><td>${esc(p.observaciones||'—')}</td><td class="actions"><button class="btn-icon" title="Editar" onclick="abrirModalPedido(${p.idPedido})">✏️</button><button class="btn-icon danger" title="Eliminar" onclick="eliminarPedido(${p.idPedido})">🗑️</button></td></tr>`).join(''):'<tr><td colspan="7" style="text-align:center">No hay pedidos registrados</td></tr>';}
async function abrirModalPedido(id=null){await cargarDatos();const p=id?byId(cache.pedidos,'idPedido',id):null;document.getElementById('pedId').value=p?.idPedido||'';document.getElementById('modalPedidoTitle').textContent=p?'Editar pedido':'Nuevo pedido';document.getElementById('pedCliente').innerHTML=cache.clientes.map(c=>`<option value="${c.idCliente}">${esc(c.nombre)}</option>`).join('');document.getElementById('pedProducto').innerHTML=cache.productos.map(x=>`<option value="${x.idProducto}">${esc(x.nombre)}</option>`).join('');document.getElementById('pedCantidad').value=1;document.getElementById('pedEstado').value=p?.estado||'Pendiente';document.getElementById('pedObservaciones').value=p?.observaciones||'';if(p){document.getElementById('pedCliente').value=p.idCliente;document.getElementById('pedProducto').disabled=true;document.getElementById('pedCantidad').disabled=true;}else{document.getElementById('pedProducto').disabled=false;document.getElementById('pedCantidad').disabled=false;}document.getElementById('modalPedido').classList.add('active');}
async function guardarPedido(){const id=document.getElementById('pedId').value;const cliente=Number(document.getElementById('pedCliente').value);const producto=byId(cache.productos,'idProducto',document.getElementById('pedProducto').value);const cantidad=Number(document.getElementById('pedCantidad').value);const estado=document.getElementById('pedEstado').value;const observaciones=document.getElementById('pedObservaciones').value.trim();if(!id&&(!cliente||!producto||!Number.isInteger(cantidad)||cantidad<1)){alert('Selecciona cliente, producto y cantidad válida.');return;}try{if(id){const existente=byId(cache.pedidos,'idPedido',id);await put(`/pedidos/${id}`,{estado,total:existente?.total||0,observaciones});}else{await post('/pedidos',{idCliente:cliente,estado,total:Number(producto.precioUnitario||0)*cantidad,observaciones:`Producto: ${producto.nombre}; cantidad: ${cantidad}. ${observaciones}`.trim()});}cerrarModal('modalPedido');await cargarDatos();await renderPedidos();await renderDashboard();alert('Pedido guardado. La API actual solo persiste el encabezado del pedido; no guarda el detalle en Detalles_pedido.');}catch(e){showError(e);}}
async function eliminarPedido(id){if(!confirm('¿Eliminar este pedido? Si tiene detalles relacionados, MySQL puede impedirlo.'))return;try{await del(`/pedidos/${id}`);await renderPedidos();await renderDashboard();}catch(e){showError(e);}}

// Chat demostrativo: respuestas basadas en la información que llega de la API.
function enviarSugerencia(texto){document.getElementById('chatInput').value=texto;enviarMensaje();}
async function enviarMensaje(){const input=document.getElementById('chatInput');const texto=input.value.trim();if(!texto)return;const box=document.getElementById('chatMessages');box.innerHTML+=`<div class="message user">${esc(texto)}</div>`;input.value='';const q=texto.toLowerCase();let respuesta='Puedo consultar productos, existencias y pedidos si la información está registrada en el sistema.';try{await cargarDatos();if(q.includes('stock bajo')||q.includes('reabaste')){const bajo=cache.inventario.filter(i=>{const p=byId(cache.productos,'idProducto',i.idProducto);return p&&Number(i.cantidadActual)<=Number(p.stockMinimo||0)});respuesta=bajo.length?'Productos con stock bajo: '+bajo.map(i=>`${byId(cache.productos,'idProducto',i.idProducto).nombre} (${i.cantidadActual} unidades)`).join(', '):'No hay productos con stock bajo.';}else if(q.includes('pedido')){const pendientes=cache.pedidos.filter(p=>p.estado==='Pendiente');respuesta=`Hay ${pendientes.length} pedidos pendientes.`;}else if(q.includes('existencia')||q.includes('botella')){const matches=cache.productos.filter(p=>q.includes(p.nombre.toLowerCase())||p.nombre.toLowerCase().includes('botella'));respuesta=matches.map(p=>{const i=byId(cache.inventario,'idProducto',p.idProducto);return `${p.nombre}: ${i?.cantidadActual??'sin registro de inventario'} unidades`;}).join('; ')||'No encontré ese producto.';}}catch(e){respuesta='No pude consultar la base de datos. Verifica el backend.';}box.innerHTML+=`<div class="message bot">${esc(respuesta)}</div>`;box.scrollTop=box.scrollHeight;}
function cerrarModal(id){document.getElementById(id)?.classList.remove('active');}

document.addEventListener('DOMContentLoaded',()=>{
  const sesion=localStorage.getItem('usuario');if(sesion){try{usuarioActual=JSON.parse(sesion);document.getElementById('login').style.display='none';document.getElementById('app').style.display='block';pintarUsuario();mostrarPagina('dashboard');}catch{localStorage.removeItem('usuario');}}
  document.getElementById('loginPass')?.addEventListener('keydown',e=>{if(e.key==='Enter')login();});
  document.getElementById('searchProductos')?.addEventListener('input',()=>renderProductos().catch(showError));
  document.addEventListener('click',e=>{if(e.target.classList.contains('modal-overlay'))e.target.classList.remove('active');});
});
