/** Mariana Plásticos — Interfaz conectada al backend Spring Boot / MySQL
 *  Correcciones aplicadas:
 *  - Stock muestra stockActual (no stockMinimo)
 *  - Modal producto guarda stock actual
 *  - Observaciones limpias (sin "Producto #..." ni "cantidad:")
 *  - Movimientos muestran producto y cantidad correctamente
 *  - Mejor manejo de errores al eliminar
 */

const API_BASE = 'http://localhost:8080/api';
let usuarioActual = null;
let cache = { 
  productos: [], categorias: [], inventario: [], movimientos: [], 
  pedidos: [], clientes: [], usuarios: []
};

async function api(ruta, opciones = {}) {
  const respuesta = await fetch(`${API_BASE}${ruta}`, {
    ...opciones,
    headers: { 'Content-Type': 'application/json', ...(opciones.headers || {}) }
  });
  const cuerpo = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok || cuerpo.success === false) {
    throw new Error(cuerpo.message || `Error HTTP ${respuesta.status}`);
  }
  return cuerpo.data !== undefined ? cuerpo.data : cuerpo;
}

const get  = ruta => api(ruta);
const post = (ruta, datos) => api(ruta, { method: 'POST', body: JSON.stringify(datos) });
const put  = (ruta, datos) => api(ruta, { method: 'PUT',  body: JSON.stringify(datos) });
const del  = ruta => api(ruta, { method: 'DELETE' });

const esc   = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(Number(n)||0);
const date  = v => v ? new Date(v).toLocaleString('es-MX') : '—';
const byId  = (arr, key, id) => arr.find(x => Number(x[key]) === Number(id));

function showError(error) { 
  console.error(error); 
  alert(`No se pudo completar la operación.\n${error.message || error}\n\nVerifica que Spring Boot esté ejecutándose y conectado a MySQL.`); 
}

async function cargarDatos() {
  const recursos = ['productos','categorias','inventario','movimientos','pedidos','clientes','usuarios'];
  const resultados = await Promise.allSettled(recursos.map(r => get('/'+r)));
  resultados.forEach((r,i) => { 
    cache[recursos[i]] = r.status === 'fulfilled' && Array.isArray(r.value) ? r.value : []; 
  });
  resultados.forEach((r,i) => { 
    if (r.status === 'rejected') console.warn(`No se pudo cargar ${recursos[i]}`, r.reason); 
  });
}

// ==================== AUTENTICACIÓN ====================
async function login() {
  const correo = document.getElementById('loginEmail').value.trim();
  const contrasena = document.getElementById('loginPass').value;
  const errorEl = document.getElementById('loginError');
  if (!correo || !contrasena) { 
    errorEl.textContent = 'Completa todos los campos'; 
    errorEl.style.display = 'block'; 
    return; 
  }
  try {
    const u = await post('/auth/login', { correo, contrasena });
    usuarioActual = u; 
    localStorage.setItem('usuario', JSON.stringify(u));
    errorEl.style.display = 'none'; 
    document.getElementById('login').style.display = 'none'; 
    document.getElementById('app').style.display = 'block';
    pintarUsuario(); 
    await cargarDatos(); 
    await mostrarPagina('dashboard');
  } catch (e) { 
    errorEl.textContent = e.message || 'No se pudo conectar con el servidor'; 
    errorEl.style.display = 'block'; 
  }
}

function pintarUsuario() {
  const nombre = usuarioActual?.nombre || 'Usuario';
  document.getElementById('userAvatar').textContent = nombre.split(/\s+/).map(n => n[0]).join('').slice(0,2).toUpperCase();
  document.getElementById('userName').textContent = nombre;
  document.getElementById('userRole').textContent = usuarioActual?.idRol === 1 ? 'Administrador' : (usuarioActual?.rol || 'Usuario');
}

function logout() { 
  usuarioActual = null; 
  localStorage.removeItem('usuario'); 
  document.getElementById('app').style.display = 'none'; 
  document.getElementById('login').style.display = 'flex'; 
  document.getElementById('loginEmail').value = ''; 
  document.getElementById('loginPass').value = ''; 
}

async function mostrarPagina(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
  document.querySelectorAll('.nav-link').forEach(l => l.classList.toggle('active', l.dataset.page === id));
  try { 
    await cargarDatos(); 
    const renders = {
   dashboard: renderDashboard,
   productos: renderProductos,
   inventario: renderInventario,
   movimientos: renderMovimientos,
   pedidos: renderPedidos,
   clientes: renderClientes          // ← agrega esta línea
  };
    if (renders[id]) await renders[id](); 
  } catch(e) { showError(e); }
}

// ==================== DASHBOARD ====================
async function renderDashboard() {
  document.getElementById('statProductos').textContent = cache.productos.filter(p => p.estado === 'Activo').length;
  document.getElementById('statStockBajo').textContent = cache.inventario.filter(i => {
    const p = byId(cache.productos, 'idProducto', i.idProducto);
    return p && Number(i.cantidadActual) <= Number(p.stockMinimo || 0);
  }).length;
  document.getElementById('statPedidos').textContent = cache.pedidos.filter(p => ['Pendiente','En preparación'].includes(p.estado)).length;
  document.getElementById('statMovimientos').textContent = cache.movimientos.filter(m =>
    m.fechaMovimiento && new Date(m.fechaMovimiento).toDateString() === new Date().toDateString()
  ).length;
  
  const bajo = cache.inventario.filter(i => {
    const p = byId(cache.productos, 'idProducto', i.idProducto);
    return p && Number(i.cantidadActual) <= Number(p.stockMinimo || 0);
  });
  
  document.getElementById('tablaStockBajo').innerHTML = bajo.length
    ? bajo.map(i => {
        const p = byId(cache.productos, 'idProducto', i.idProducto);
        return `<tr>
          <td>${esc(p?.nombre)}</td>
          <td>${esc(byId(cache.categorias,'idCategoria',p?.idCategoria)?.nombre || '—')}</td>
          <td>${esc(i.cantidadActual)}</td>
          <td>${esc(p?.stockMinimo ?? 0)}</td>
          <td><span class="badge badge-danger">Stock bajo</span></td>
        </tr>`;
      }).join('')
    : '<tr><td colspan="5" style="text-align:center">No hay productos con stock bajo</td></tr>';
}

// ==================== PRODUCTOS ====================
async function renderProductos() {
  cache.productos = await get('/productos'); 
  cache.categorias = await get('/categorias');
  cache.inventario = await get('/inventario');

  const texto = (document.getElementById('searchProductos')?.value || '').toLowerCase();
  const catFiltro = document.getElementById('filtroCategoria')?.value || '';

  // Función para obtener el stock real desde Inventario
  const stockReal = (idProducto) => {
    const inv = cache.inventario.find(i => Number(i.idProducto) === Number(idProducto));
    return inv ? Number(inv.cantidadActual) : 0;
  };

  const lista = cache.productos.filter(p => {
    const coincideTexto = (`${p.nombre||''} ${p.sku||''}`).toLowerCase().includes(texto);
    const coincideCat = !catFiltro || String(p.idCategoria) === String(catFiltro);
    return coincideTexto && coincideCat;
  });
  
  document.getElementById('tablaProductos').innerHTML = lista.length
    ? lista.map(p => {
        const stock = stockReal(p.idProducto);   // ✅ Stock tomado del Inventario
        return `<tr>
          <td><strong>${esc(p.nombre)}</strong><br><small>${esc(p.sku || 'Sin SKU')}</small></td>
          <td>${esc(byId(cache.categorias,'idCategoria',p.idCategoria)?.nombre || p.idCategoria || '—')}</td>
          <td>${money(p.precioUnitario)}</td>
          <td><strong>${esc(stock)}</strong></td>
          <td><span class="badge ${p.estado==='Activo'?'badge-success':'badge-danger'}">${esc(p.estado||'—')}</span></td>
          <td class="actions">
            <button class="btn-icon" title="Editar" onclick="abrirModalProducto(${p.idProducto})">✏️</button>
            <button class="btn-icon danger" title="Eliminar" onclick="eliminarProducto(${p.idProducto})">🗑️</button>
          </td>
        </tr>`;
      }).join('')
    : '<tr><td colspan="6" style="text-align:center">No hay productos registrados</td></tr>';
  
  // Llenar select del modal
  const sel = document.getElementById('prodCategoria'); 
  if (sel) sel.innerHTML = cache.categorias.map(c => 
    `<option value="${c.idCategoria}">${esc(c.nombre)}</option>`
  ).join('');

  // Llenar filtro de categorías
  const filtroSel = document.getElementById('filtroCategoria');
  if (filtroSel && filtroSel.options.length <= 1) {
    filtroSel.innerHTML = '<option value="">Todas las categorías</option>' +
      cache.categorias.map(c => `<option value="${c.idCategoria}">${esc(c.nombre)}</option>`).join('');
  }
}

async function abrirModalProducto(id = null) {
  await renderProductos(); 
  const p = id ? byId(cache.productos, 'idProducto', id) : null;

  document.getElementById('prodId').value = p?.idProducto || ''; 
  document.getElementById('modalProductoTitle').textContent = p ? 'Editar producto' : 'Nuevo producto';
  
  document.getElementById('prodSku').value         = p?.sku || '';
  document.getElementById('prodNombre').value      = p?.nombre || '';
  document.getElementById('prodDescripcion').value = p?.descripcion || '';
  document.getElementById('prodPrecio').value      = p?.precioUnitario ?? '';
  document.getElementById('prodStockMin').value    = p?.stockMinimo ?? 10;
  document.getElementById('prodEstado').value      = p?.estado || 'Activo';

  // Stock actual tomado del Inventario
  const stockActualEl = document.getElementById('prodStockActual');
  if (stockActualEl) {
    if (p) {
      const inv = cache.inventario.find(i => Number(i.idProducto) === Number(p.idProducto));
      stockActualEl.value = inv ? inv.cantidadActual : (p.stockActual ?? 0);
    } else {
      stockActualEl.value = 0;
    }
  }
  
  if (p?.idCategoria) {
    document.getElementById('prodCategoria').value = p.idCategoria;
  }

  document.getElementById('modalProducto').classList.add('active');
}

async function guardarProducto() {
  const id = document.getElementById('prodId').value;
  const stockActual = Number(document.getElementById('prodStockActual')?.value || 0);

  const datos = {
    sku:            document.getElementById('prodSku').value.trim(),
    nombre:         document.getElementById('prodNombre').value.trim(),
    descripcion:    document.getElementById('prodDescripcion').value.trim(),
    precioUnitario: Number(document.getElementById('prodPrecio').value || 0),
    stockMinimo:    Number(document.getElementById('prodStockMin').value || 10),
    stockActual:    stockActual,
    estado:         document.getElementById('prodEstado').value,
    idCategoria:    Number(document.getElementById('prodCategoria').value)
  };
  
  if (!datos.sku || !datos.nombre || !datos.idCategoria) {
    alert('SKU, nombre y categoría son obligatorios.');
    return;
  }
  
  try {
    let idProducto = id;

    if (id) {
      // Actualizar producto
      await put(`/productos/${id}`, datos);
    } else {
      // Crear producto
      const creado = await post('/productos', datos);
      idProducto = creado.idProducto || creado.id;
    }

    // ✅ Sincronizar con Inventario
    const inventarios = await get('/inventario');
    const invExistente = inventarios.find(i => Number(i.idProducto) === Number(idProducto));

    if (invExistente) {
      // Ya existe → actualizar cantidad
      await put(`/inventario/${invExistente.idInventario}`, {
        cantidadActual: stockActual,
        ubicacion: invExistente.ubicacion || 'Almacén General'
      });
    } else {
      // No existe → crear registro de inventario
      await post('/inventario', {
        idProducto: Number(idProducto),
        cantidadActual: stockActual,
        ubicacion: 'Almacén General'
      });
    }
    
    cerrarModal('modalProducto');
    await cargarDatos();
    await renderProductos();
    await renderInventario();
    await renderDashboard();
  } catch(e) { showError(e); }
}

async function eliminarProducto(id) { 
  if (!confirm('¿Eliminar este producto?\n\nSi tiene inventario o movimientos relacionados, la base de datos puede impedirlo.')) return; 
  try {
    await del(`/productos/${id}`);
    await cargarDatos();
    await renderProductos();
    await renderDashboard();
  } catch(e) { 
    alert('No se pudo eliminar el producto.\n\nProbablemente tiene registros en Inventario o Movimientos.\nElimina primero esos registros relacionados.');
  } 
}

// ==================== INVENTARIO ====================
async function renderInventario() {
  const [inv, prods] = await Promise.all([get('/inventario'), get('/productos')]);
  cache.inventario = inv; 
  cache.productos = prods;
  
  document.getElementById('tablaInventario').innerHTML = inv.length
    ? inv.map(i => {
        const p = byId(prods, 'idProducto', i.idProducto);
        const bajo = p && Number(i.cantidadActual) <= Number(p.stockMinimo || 0);
        return `<tr>
          <td>${esc(p?.nombre || `Producto #${i.idProducto}`)}</td>
          <td>${esc(i.ubicacion || '—')}</td>
          <td>${esc(i.cantidadActual ?? 0)}</td>
          <td>${esc(p?.stockMinimo ?? '—')}</td>
          <td><span class="badge ${bajo ? 'badge-danger' : 'badge-success'}">${bajo ? 'Stock bajo' : 'Normal'}</span></td>
          <td class="actions">
            <button class="btn-icon" title="Editar" onclick="abrirModalInventario(${i.idInventario})">✏️</button>
            <button class="btn-icon danger" title="Eliminar" onclick="eliminarInventario(${i.idInventario})">🗑️</button>
          </td>
        </tr>`;
      }).join('')
    : '<tr><td colspan="6" style="text-align:center">No hay registros de inventario</td></tr>';
}

async function abrirModalInventario(id = null) {
  await renderInventario();
  const i = id ? byId(cache.inventario, 'idInventario', id) : null;
  const sel = document.getElementById('invProducto');
  sel.innerHTML = cache.productos.map(p => `<option value="${p.idProducto}">${esc(p.nombre)}</option>`).join('');
  sel.disabled = !!i;
  
  document.querySelector('#modalInventario .modal-header h3').textContent = i ? 'Editar Inventario' : 'Agregar al Inventario';
  document.getElementById('invId').value = i?.idInventario || '';
  if (i) sel.value = i.idProducto;
  document.getElementById('invCantidad').value = i?.cantidadActual ?? 0;
  document.getElementById('invUbicacion').value = i?.ubicacion || '';
  document.getElementById('modalInventario').classList.add('active');
}

async function guardarInventario() {
  const id = document.getElementById('invId').value;
  const cantidad = Number(document.getElementById('invCantidad').value);
  const idProducto = Number(document.getElementById('invProducto').value);
  const ubicacion = document.getElementById('invUbicacion').value.trim();
  
  if (!Number.isInteger(cantidad) || cantidad < 0) {
    alert('La cantidad debe ser un entero igual o mayor que cero.');
    return;
  }
  
  try {
    if (id) {
      await put(`/inventario/${id}`, { cantidadActual: cantidad, ubicacion });
      await put(`/productos/${idProducto}`, { stockActual: cantidad });
    } else {
      if (!idProducto) { alert('Selecciona un producto.'); return; }
      if (cache.inventario.some(i => Number(i.idProducto) === idProducto)) {
        alert('Este producto ya tiene un registro de inventario; edita el registro existente.');
        return;
      }
      await post('/inventario', { idProducto, cantidadActual: cantidad, ubicacion });
      await put(`/productos/${idProducto}`, { stockActual: cantidad });
    }
    
    cerrarModal('modalInventario');
    await cargarDatos();
    await renderInventario();
    await renderDashboard();
  } catch(e) { showError(e); }
}

async function eliminarInventario(id) {
  if (!confirm('¿Eliminar este registro de inventario?')) return;
  try {
    await del(`/inventario/${id}`);
    await renderInventario();
    await renderDashboard();
  } catch(e) { showError(e); }
}

// ==================== MOVIMIENTOS ====================
async function renderMovimientos() {
  cache.movimientos = await get('/movimientos');
  const usuarios = await get('/usuarios');
  cache.usuarios = usuarios;
  const prods = cache.productos.length ? cache.productos : await get('/productos');
  
  document.getElementById('tablaMovimientos').innerHTML = cache.movimientos.length
    ? cache.movimientos
        .slice()
        .sort((a,b) => new Date(b.fechaMovimiento) - new Date(a.fechaMovimiento))
        .map(m => {
          // Prioridad 1: campos directos del backend
          let nombreProd = '—';
          let cant = '—';
          
          if (m.idProducto) {
            const p = prods.find(x => Number(x.idProducto) === Number(m.idProducto));
            nombreProd = p ? p.nombre : `Producto #${m.idProducto}`;
          }
          if (m.cantidad != null) cant = m.cantidad;
          
          return `<tr>
            <td>${date(m.fechaMovimiento)}</td>
            <td>${esc(m.tipoMovimiento || '—')}</td>
            <td>${esc(nombreProd)}</td>
            <td>${esc(cant)}</td>
            <td>${esc(byId(usuarios, 'idUsuario', m.idUsuario)?.nombre || `Usuario #${m.idUsuario}`)}</td>
            <td>${esc(m.observaciones || '—')}</td>
            <td><button class="btn-icon danger" title="Eliminar" onclick="eliminarMovimiento(${m.idMovimiento})">🗑️</button></td>
          </tr>`;
        }).join('')
    : '<tr><td colspan="7" style="text-align:center">No hay movimientos registrados</td></tr>';
}

async function registrarEntradaSalida(tipo) {
  try {
    await cargarDatos();
    document.getElementById('movTipo').value = tipo;
    document.getElementById('modalMovimientoTitle').textContent = `Registrar ${tipo.toLowerCase()}`;
    document.getElementById('movProducto').innerHTML = cache.productos
      .map(p => `<option value="${p.idProducto}">${esc(p.nombre)} (${esc(p.sku || 'sin SKU')})</option>`)
      .join('');
    document.getElementById('movCantidad').value = 1;
    document.getElementById('movObservaciones').value = '';
    document.getElementById('modalMovimiento').classList.add('active');
  } catch(e) { showError(e); }
}

async function guardarMovimiento() {
  const tipo       = document.getElementById('movTipo').value;
  const idProducto = Number(document.getElementById('movProducto').value);
  const cantidad   = Number(document.getElementById('movCantidad').value);
  const obs        = document.getElementById('movObservaciones').value.trim();   // ✅ Solo lo que escribe el usuario
  
  if (!idProducto || !Number.isInteger(cantidad) || cantidad < 1) {
    alert('Selecciona un producto e indica una cantidad entera mayor que cero.');
    return;
  }
  
  const usuarioId = usuarioActual?.idUsuario;
  if (!usuarioId) {
    alert('No se identifica el usuario de la sesión. Vuelve a iniciar sesión.');
    return;
  }
  
  try {
    const inventarios = await get('/inventario');
    const inv = byId(inventarios, 'idProducto', idProducto);
    if (!inv) {
      alert('Este producto no tiene registro en Inventario. Crea primero su registro de inventario.');
      return;
    }
    const nueva = Number(inv.cantidadActual || 0) + (tipo === 'Entrada' ? cantidad : -cantidad);
    if (nueva < 0) {
      alert('No hay existencias suficientes para registrar esta salida.');
      return;
    }
    
    // ✅ Observaciones LIMPIAS (solo lo que escribió el usuario)
    await post('/movimientos', {
      idUsuario:      usuarioId, 
      tipoMovimiento: tipo, 
      idProducto:     idProducto,
      cantidad:       cantidad,
      observaciones:  obs || null
    });
    
    // Actualizar inventario y stock del producto
    await put(`/inventario/${inv.idInventario}`, { cantidadActual: nueva, ubicacion: inv.ubicacion });
    await put(`/productos/${idProducto}`, { stockActual: nueva });
    
    cerrarModal('modalMovimiento');
    await cargarDatos();
    await renderMovimientos();
    await renderInventario();
    await renderDashboard();
    alert('Movimiento guardado y existencia actualizada.');
  } catch(e) { showError(e); }
}

async function eliminarMovimiento(id) {
  if (!confirm('¿Eliminar el registro de movimiento?\nEsta acción NO revierte el cambio de existencias.')) return;
  try {
    await del(`/movimientos/${id}`);
    await renderMovimientos();
  } catch(e) { showError(e); }
}

// ==================== PEDIDOS ====================
async function renderPedidos() {
  const [pedidos, clientes] = await Promise.all([get('/pedidos'), get('/clientes')]);
  cache.pedidos = pedidos; 
  cache.clientes = clientes;
  
  document.getElementById('tablaPedidos').innerHTML = pedidos.length
    ? pedidos.map(p => `<tr>
        <td>#${p.idPedido}</td>
        <td>${esc(byId(clientes,'idCliente',p.idCliente)?.nombre || `Cliente #${p.idCliente}`)}</td>
        <td>${date(p.fechaPedido)}</td>
        <td>${money(p.total)}</td>
        <td><span class="badge">${esc(p.estado || '—')}</span></td>
        <td>${esc(p.observaciones || '—')}</td>
        <td class="actions">
          <button class="btn-icon" title="Editar" onclick="abrirModalPedido(${p.idPedido})">✏️</button>
          <button class="btn-icon danger" title="Eliminar" onclick="eliminarPedido(${p.idPedido})">🗑️</button>
        </td>
      </tr>`).join('')
    : '<tr><td colspan="7" style="text-align:center">No hay pedidos registrados</td></tr>';
}

async function abrirModalPedido(id = null) {
  await cargarDatos();
  const p = id ? byId(cache.pedidos, 'idPedido', id) : null;
  document.getElementById('pedId').value = p?.idPedido || '';
  document.getElementById('modalPedidoTitle').textContent = p ? 'Editar pedido' : 'Nuevo pedido';
  
  document.getElementById('pedCliente').innerHTML = cache.clientes
    .map(c => `<option value="${c.idCliente}">${esc(c.nombre)}</option>`).join('');
  document.getElementById('pedProducto').innerHTML = cache.productos
    .map(x => `<option value="${x.idProducto}">${esc(x.nombre)}</option>`).join('');
  document.getElementById('pedCantidad').value = 1;
  document.getElementById('pedEstado').value = p?.estado || 'Pendiente';
  document.getElementById('pedObservaciones').value = p?.observaciones || '';
  
  if (p) {
    document.getElementById('pedCliente').value = p.idCliente;
    document.getElementById('pedProducto').disabled = true;
    document.getElementById('pedCantidad').disabled = true;
  } else {
    document.getElementById('pedProducto').disabled = false;
    document.getElementById('pedCantidad').disabled = false;
  }
  
  document.getElementById('modalPedido').classList.add('active');
}

async function guardarPedido() {
  const id          = document.getElementById('pedId').value;
  const cliente     = Number(document.getElementById('pedCliente').value);
  const producto    = byId(cache.productos, 'idProducto', document.getElementById('pedProducto').value);
  const cantidad    = Number(document.getElementById('pedCantidad').value);
  const estado      = document.getElementById('pedEstado').value;
  const observaciones = document.getElementById('pedObservaciones').value.trim();  // ✅ Solo lo del usuario
  
  if (!id && (!cliente || !producto || !Number.isInteger(cantidad) || cantidad < 1)) {
    alert('Selecciona cliente, producto y cantidad válida.');
    return;
  }
  
  try {
    if (id) {
      const existente = byId(cache.pedidos, 'idPedido', id);
      await put(`/pedidos/${id}`, { 
        estado, 
        total: existente?.total || 0, 
        observaciones 
      });
    } else {
      // ✅ Observaciones limpias
      await post('/pedidos', {
        idCliente:    cliente, 
        estado, 
        total:        Number(producto.precioUnitario || 0) * cantidad, 
        observaciones: observaciones || null
      });
    }
    cerrarModal('modalPedido');
    await cargarDatos();
    await renderPedidos();
    await renderDashboard();
    alert('Pedido guardado correctamente.');
  } catch(e) { showError(e); }
}

async function eliminarPedido(id) {
  if (!confirm('¿Eliminar este pedido?\nSi tiene detalles relacionados, la base de datos puede impedirlo.')) return;
  try {
    await del(`/pedidos/${id}`);
    await renderPedidos();
    await renderDashboard();
  } catch(e) { 
    alert('No se pudo eliminar el pedido.\nProbablemente tiene detalles asociados.');
  }
}

// ==================== CLIENTES ====================
async function renderClientes() {
  try {
    cache.clientes = await get('/clientes');
  } catch (e) {
    console.warn('No se pudieron cargar clientes', e);
    cache.clientes = [];
  }

  const texto = (document.getElementById('searchCliente')?.value || '').toLowerCase().trim();
  const filtroCat = document.getElementById('filtroCategoria')?.value || '';

  const lista = cache.clientes.filter(c => {
  const idFormateado = String(c.idCliente).padStart(4, '0');   // ← 0001, 0002...
  
  const coincideTexto = (
    `${c.idCliente || ''} ${idFormateado} ${c.nombre || ''} ${c.negocio || ''} ${c.correo || ''}`
  ).toLowerCase().includes(texto);

  const coincideCat = !filtroCat || String(c.categoria) === String(filtroCat);
  return coincideTexto && coincideCat;
});

  const tbody = document.getElementById('tablaclientes');
  if (!tbody) return;

  if (lista.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:2rem; color:#6b7280;">
          No se encontraron clientes
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = lista.map(c => `
    <tr>
      <td>${String(c.idCliente).padStart(4, '0')}</td>
      <td>${esc(c.nombre || '')}</td>
      <td>${esc(c.negocio || '—')}</td>
      <td>${esc(c.correo || '')}</td>
      <td>${esc(c.telefono || '')}</td>
      <td>${esc(c.direccion || '')}</td>
      <td>
        ${c.categoria == 1 
          ? '<span style="color:#2563eb; font-weight:600;">Mayorista</span>' 
          : c.categoria == 2 
            ? '<span style="color:#059669; font-weight:600;">Menudista</span>' 
            : '—'}
      </td>
    </tr>
  `).join('');
}

// ==================== MODAL CLIENTE ====================
function abrirModalCliente(id = null) {
  document.getElementById('clienteId').value = id || '';
  document.getElementById('modalClienteTitulo').textContent = id ? 'Editar Cliente' : 'Registrar Cliente';

  if (id) {
    const c = byId(cache.clientes, 'idCliente', id);
    if (c) {
      document.getElementById('clienteNombre').value    = c.nombre || '';
      document.getElementById('clienteNegocio').value   = c.negocio || '';
      document.getElementById('clienteCorreo').value    = c.correo || '';
      document.getElementById('clienteTelefono').value  = c.telefono || '';
      document.getElementById('clienteDireccion').value = c.direccion || '';
      document.getElementById('clienteCategoria').value = c.categoria || '';
    }
  } else {
    // Limpiar formulario
    document.getElementById('clienteNombre').value    = '';
    document.getElementById('clienteNegocio').value   = '';
    document.getElementById('clienteCorreo').value    = '';
    document.getElementById('clienteTelefono').value  = '';
    document.getElementById('clienteDireccion').value = '';
    document.getElementById('clienteCategoria').value = '';
  }

  document.getElementById('modalCliente').classList.add('active');
}

async function guardarCliente() {
  const id = document.getElementById('clienteId').value;

  const datos = {
    nombre:    document.getElementById('clienteNombre').value.trim(),
    negocio:   document.getElementById('clienteNegocio').value.trim() || null,
    correo:    document.getElementById('clienteCorreo').value.trim() || null,
    telefono:  document.getElementById('clienteTelefono').value.trim() || null,
    direccion: document.getElementById('clienteDireccion').value.trim() || null,
    categoria: document.getElementById('clienteCategoria').value 
                 ? Number(document.getElementById('clienteCategoria').value) 
                 : null
  };

  if (!datos.nombre) {
    alert('El nombre es obligatorio.');
    return;
  }

  try {
    if (id) {
      await put(`/clientes/${id}`, datos);
    } else {
      await post('/clientes', datos);
    }

    cerrarModal('modalCliente');
    await renderClientes();
  } catch (e) {
    showError(e);
  }
}

// ==================== ASISTENTE IA (simulado) ====================
function enviarSugerencia(texto) {
  document.getElementById('chatInput').value = texto;
  enviarMensaje();
}

async function enviarMensaje() {
  const input = document.getElementById('chatInput');
  const texto = input.value.trim();
  if (!texto) return;
  const box = document.getElementById('chatMessages');
  box.innerHTML += `<div class="message user">${esc(texto)}</div>`;
  input.value = '';
  
  const q = texto.toLowerCase();
  let respuesta = 'No entendí la consulta. Prueba con: stock bajo, existencias, pedidos pendientes o reabastecimiento.';
  
  try {
    if (q.includes('stock bajo') || q.includes('reabaste')) {
      const bajo = cache.inventario.filter(i => {
        const p = byId(cache.productos, 'idProducto', i.idProducto);
        return p && Number(i.cantidadActual) <= Number(p.stockMinimo || 0);
      });
      respuesta = bajo.length
        ? 'Productos con stock bajo: ' + bajo.map(i => {
            const p = byId(cache.productos, 'idProducto', i.idProducto);
            return `${p?.nombre} (${i.cantidadActual} unidades)`;
          }).join(', ')
        : 'No hay productos con stock bajo.';
    } else if (q.includes('existencias') || q.includes('stock de')) {
      respuesta = 'Existencias actuales:\n' + cache.inventario.map(i => {
        const p = byId(cache.productos, 'idProducto', i.idProducto);
        return `• ${p?.nombre || 'Producto'}: ${i.cantidadActual} (${i.ubicacion})`;
      }).join('\n');
    } else if (q.includes('pedido')) {
      const pendientes = cache.pedidos.filter(p => ['Pendiente','En preparación'].includes(p.estado));
      respuesta = pendientes.length
        ? `Hay ${pendientes.length} pedido(s) pendientes/en preparación.`
        : 'No hay pedidos pendientes.';
    }
  } catch(e) {
    respuesta = 'Error al consultar los datos.';
  }
  
  box.innerHTML += `<div class="message bot">${esc(respuesta).replace(/\n/g,'<br>')}</div>`;
  box.scrollTop = box.scrollHeight;
}

// ==================== UTILIDADES ====================
function cerrarModal(id) {
  document.getElementById(id)?.classList.remove('active');
}

// Eventos al cargar
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('searchProductos')?.addEventListener('input', () => renderProductos().catch(showError));
  document.getElementById('searchCliente')?.addEventListener('input', () => renderClientes().catch(showError));
  document.getElementById('filtroCategoria')?.addEventListener('change', () => renderClientes().catch(showError));
  
  // Restaurar sesión si existe
  const guardado = localStorage.getItem('usuario');
  if (guardado) {
    try {
      usuarioActual = JSON.parse(guardado);
      document.getElementById('login').style.display = 'none';
      document.getElementById('app').style.display = 'block';
      pintarUsuario();
      cargarDatos().then(() => mostrarPagina('dashboard'));
    } catch {}
  }
});