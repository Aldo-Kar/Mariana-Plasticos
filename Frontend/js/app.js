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

const get = ruta => api(ruta);
const post = (ruta, datos) => api(ruta, { method: 'POST', body: JSON.stringify(datos) });
const put = (ruta, datos) => api(ruta, { method: 'PUT', body: JSON.stringify(datos) });
const del = ruta => api(ruta, { method: 'DELETE' });

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n) || 0);
const date = v => v ? new Date(v).toLocaleString('es-MX') : '—';
const byId = (arr, key, id) => arr.find(x => Number(x[key]) === Number(id));

function showError(error) {
  console.error(error);
  alert(`No se pudo completar la operación.\n${error.message || error}\n\nVerifica que Spring Boot esté ejecutándose y conectado a MySQL.`);
}

async function cargarDatos() {
  const recursos = ['productos', 'categorias', 'inventario', 'movimientos', 'pedidos', 'clientes', 'usuarios'];
  const resultados = await Promise.allSettled(recursos.map(r => get('/' + r)));
  resultados.forEach((r, i) => {
    cache[recursos[i]] = r.status === 'fulfilled' && Array.isArray(r.value) ? r.value : [];
  });
  resultados.forEach((r, i) => {
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
    errorEl.style.display = 'none';
    document.getElementById('login').style.display = 'none';
    document.getElementById('app').style.display = 'block';

    pintarUsuario();
    await mostrarPagina('dashboard');

  } catch (e) {
    errorEl.textContent = e.message || 'No se pudo conectar con el servidor';
    errorEl.style.display = 'block';
  }
}

function pintarUsuario() {
  const nombre = usuarioActual?.nombre || 'Usuario';
  document.getElementById('userAvatar').textContent = nombre.split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase();
  document.getElementById('userName').textContent = nombre;
  document.getElementById('userRole').textContent = usuarioActual?.idRol === 1 ? 'Administrador' : (usuarioActual?.rol || 'Usuario');
}

function logout() {
  usuarioActual = null;
  document.getElementById('app').style.display = 'none';
  document.getElementById('login').style.display = 'flex';
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPass').value = '';
  document.getElementById('loginError').style.display = 'none';
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
      reportes: () => { /* no necesita cargar nada especial */ },
      clientes: renderClientes          // ← agrega esta línea
    };
    if (renders[id]) await renders[id]();
  } catch (e) { showError(e); }
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('collapsed');
}

// ==================== DASHBOARD ====================
async function renderDashboard() {
  document.getElementById('statProductos').textContent = cache.productos.filter(p => p.estado === 'Activo').length;
  document.getElementById('statStockBajo').textContent = cache.inventario.filter(i => {
    const p = byId(cache.productos, 'idProducto', i.idProducto);
    return p && Number(i.cantidadActual) <= Number(p.stockMinimo || 0);
  }).length;
  document.getElementById('statPedidos').textContent = cache.pedidos.filter(p => ['Pendiente', 'En preparación'].includes(p.estado)).length;
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
          <td>${esc(byId(cache.categorias, 'idCategoria', p?.idCategoria)?.nombre || '—')}</td>
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
    const ubicaciones = cache.inventario.filter(i => Number(i.idProducto) === Number(idProducto));
    return ubicaciones.reduce((total, inv) => total + Number(inv.cantidadActual || 0), 0);
  };

  const lista = cache.productos.filter(p => {
    const coincideTexto = (`${p.nombre || ''} ${p.sku || ''} ${p.marca || ''}`).toLowerCase().includes(texto);
    const coincideCat = !catFiltro || String(p.idCategoria) === String(catFiltro);
    return coincideTexto && coincideCat;
  });

  document.getElementById('tablaProductos').innerHTML = lista.length
    ? lista.map(p => {
      const stock = stockReal(p.idProducto);   //  Stock tomado del Inventario
      return `<tr>
          <td><strong>${esc(p.nombre)}</strong><br><small>${esc(p.sku || 'Sin SKU')}</small></td>
          <td>${esc(byId(cache.categorias, 'idCategoria', p.idCategoria)?.nombre || p.idCategoria || '—')}</td>
          <td>${esc(p.marca || '—')}</td>
          <td>${money(p.precioUnitario)}</td>
          <td>${money(p.precioMayoreo)}</td>
          <td><strong>${esc(stock)}</strong></td>
          <td><span class="badge ${p.estado === 'Activo' ? 'badge-success' : 'badge-danger'}">${esc(p.estado || '—')}</span></td>
          <td class="actions">
            ${botonesAdmin(
        `abrirModalProducto(${p.idProducto})`,
        `eliminarProducto(${p.idProducto})`
      )}
          </td>
        </tr>`;
    }).join('')
    : '<tr><td colspan="8" style="text-align:center">No hay productos registrados</td></tr>';

  // Llenar select del modal
  const sel = document.getElementById('prodCategoria');
  if (sel) sel.innerHTML = cache.categorias.map(c =>
    `<option value="${c.idCategoria}">${esc(c.nombre)}</option>`
  ).join('');

  // Llenar filtro de categorías (siempre, para incluir Accesorios y cualquier categoría nueva)
  const filtroSel = document.getElementById('filtroCategoria');
  if (filtroSel) {
    const valorActual = filtroSel.value;
    filtroSel.innerHTML = '<option value="">Todas las categorías</option>' +
      cache.categorias.map(c => `<option value="${c.idCategoria}">${esc(c.nombre)}</option>`).join('');
    if (valorActual) filtroSel.value = valorActual;
  }
}

async function abrirModalProducto(id = null) {
  await renderProductos();
  const p = id ? byId(cache.productos, 'idProducto', id) : null;

  document.getElementById('prodId').value = p?.idProducto || '';
  document.getElementById('modalProductoTitle').textContent = p ? 'Editar producto' : 'Nuevo producto';

  document.getElementById('prodSku').value = p?.sku || '';
  document.getElementById('prodNombre').value = p?.nombre || '';
  document.getElementById('prodDescripcion').value = p?.descripcion || '';
  document.getElementById('prodMarca').value = p?.marca || '';
  document.getElementById('prodPrecioMayoreo').value = p?.precioMayoreo ?? '';
  document.getElementById('prodPrecio').value = p?.precioUnitario ?? '';
  document.getElementById('prodStockMin').value = p?.stockMinimo ?? 10;
  document.getElementById('prodEstado').value = p?.estado || 'Activo';

  // Stock actual tomado del Inventario
  const stockActualEl = document.getElementById('prodStockActual');
  if (stockActualEl) {
    if (p) {
      const ubicaciones = cache.inventario.filter(i => Number(i.idProducto) === Number(p.idProducto));
      stockActualEl.value = ubicaciones.reduce((total, inv) => total + Number(inv.cantidadActual || 0), 0);
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
    sku: document.getElementById('prodSku').value.trim(),
    nombre: document.getElementById('prodNombre').value.trim(),
    descripcion: document.getElementById('prodDescripcion').value.trim(),
    marca: document.getElementById('prodMarca').value.trim(),
    precioMayoreo: Number(document.getElementById('prodPrecioMayoreo').value || 0),
    precioUnitario: Number(document.getElementById('prodPrecio').value || 0),
    stockMinimo: Number(document.getElementById('prodStockMin').value || 10),
    stockActual: stockActual,
    estado: document.getElementById('prodEstado').value,
    idCategoria: Number(document.getElementById('prodCategoria').value)
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

    // El stock de un producto existente no se modifica desde este formulario.
    // Se administra mediante entradas, salidas y pedidos para conservar el historial.
    // Al crear un producto sí se genera su primera ubicación de inventario.
    if (!id) {
      await post('/inventario', {
        idProducto: Number(idProducto),
        cantidadActual: stockActual,
        ubicacion: 'Almacén General - Estante 1'
      });
    }

    cerrarModal('modalProducto');
    await cargarDatos();
    await renderProductos();
    await renderInventario();
    await renderDashboard();
  } catch (e) { showError(e); }
}

async function eliminarProducto(id) {
  if (!confirm('¿Eliminar este producto?\n\nSi tiene inventario o movimientos relacionados, la base de datos puede impedirlo.')) return;
  try {
    await del(`/productos/${id}`);
    await cargarDatos();
    await renderProductos();
    await renderDashboard();
  } catch (e) {
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
            ${botonesAdmin(
        `abrirModalInventario(${i.idInventario})`,
        `eliminarInventario(${i.idInventario})`
      )}
          </td>
        </tr>`;
    }).join('')
    : '<tr><td colspan="6" style="text-align:center">No hay registros de inventario</td></tr>';
}

async function abrirModalInventario(id = null) {
  await renderInventario();
  const i = id ? byId(cache.inventario, 'idInventario', id) : null;

  const datalist = document.getElementById('listaProductosInv');
  datalist.innerHTML = cache.productos
    .map(p => `<option value="${esc(p.nombre)} (${esc(p.sku || 'sin SKU')})" data-id="${p.idProducto}"></option>`)
    .join('');

  const input = document.getElementById('invProductoInput');
  const hidden = document.getElementById('invProducto');

  document.querySelector('#modalInventario .modal-header h3').textContent = i ? 'Editar Inventario' : 'Agregar al Inventario';
  document.getElementById('invId').value = i?.idInventario || '';

  if (i) {
    const p = byId(cache.productos, 'idProducto', i.idProducto);
    input.value = p ? `${p.nombre} (${p.sku || 'sin SKU'})` : '';
    hidden.value = i.idProducto;
    input.disabled = true;
  } else {
    input.value = '';
    hidden.value = '';
    input.disabled = false;
  }

  input.oninput = () => {
    const val = input.value.trim().toLowerCase();
    const match = cache.productos.find(p =>
      `${p.nombre} (${p.sku || 'sin SKU'})`.toLowerCase() === val ||
      (p.nombre || '').toLowerCase() === val ||
      (p.sku || '').toLowerCase() === val
    );
    hidden.value = match ? match.idProducto : '';
  };

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
      if (!idProducto) { alert('Escribe el nombre o SKU de un producto válido.'); return; }
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
  } catch (e) { showError(e); }
}

async function eliminarInventario(id) {
  if (!confirm('¿Eliminar este registro de inventario?')) return;
  try {
    await del(`/inventario/${id}`);
    await renderInventario();
    await renderDashboard();
  } catch (e) { showError(e); }
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
      .sort((a, b) => new Date(b.fechaMovimiento) - new Date(a.fechaMovimiento))
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
            <td class="actions">
              ${botonEliminarAdmin(`eliminarMovimiento(${m.idMovimiento})`)}
            </td>
          </tr>`;
      }).join('')
    : '<tr><td colspan="7" style="text-align:center">No hay movimientos registrados</td></tr>';
}

async function registrarEntradaSalida(tipo) {
  try {
    await cargarDatos();
    document.getElementById('movTipo').value = tipo;
    document.getElementById('modalMovimientoTitle').textContent = `Registrar ${tipo.toLowerCase()}`;

    // Datalist para buscar por nombre o SKU
    const datalist = document.getElementById('listaProductosMov');
    datalist.innerHTML = cache.productos
      .map(p => `<option value="${esc(p.nombre)} (${esc(p.sku || 'sin SKU')})" data-id="${p.idProducto}"></option>`)
      .join('');
    document.getElementById('movProductoInput').value = '';
    document.getElementById('movProducto').value = '';
    document.getElementById('movCantidad').value = 1;
    document.getElementById('movObservaciones').value = '';
    document.getElementById('modalMovimiento').classList.add('active');

    // Resolver id al escribir / seleccionar
    const input = document.getElementById('movProductoInput');
    input.oninput = () => {
      const val = input.value.trim().toLowerCase();
      const match = cache.productos.find(p =>
        `${p.nombre} (${p.sku || 'sin SKU'})`.toLowerCase() === val ||
        (p.nombre || '').toLowerCase() === val ||
        (p.sku || '').toLowerCase() === val
      );
      document.getElementById('movProducto').value = match ? match.idProducto : '';
    };
  } catch (e) { showError(e); }
}

async function guardarMovimiento() {
  const tipo = document.getElementById('movTipo').value;
  // Asegurar que el id esté resuelto por si el usuario no disparó oninput
  const inputVal = (document.getElementById('movProductoInput')?.value || '').trim().toLowerCase();
  if (inputVal && !document.getElementById('movProducto').value) {
    const match = cache.productos.find(p =>
      `${p.nombre} (${p.sku || 'sin SKU'})`.toLowerCase() === inputVal ||
      (p.nombre || '').toLowerCase() === inputVal ||
      (p.sku || '').toLowerCase() === inputVal
    );
    if (match) document.getElementById('movProducto').value = match.idProducto;
  }
  const idProducto = Number(document.getElementById('movProducto').value);
  const cantidad = Number(document.getElementById('movCantidad').value);
  const obs = document.getElementById('movObservaciones').value.trim();   //  Solo lo que escribe el usuario

  if (!idProducto || !Number.isInteger(cantidad) || cantidad < 1) {
    alert('Escribe el nombre o SKU de un producto válido e indica una cantidad entera mayor que cero.');
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

    //  Observaciones LIMPIAS (solo lo que escribió el usuario)
    await post('/movimientos', {
      idUsuario: usuarioId,
      tipoMovimiento: tipo,
      idProducto: idProducto,
      cantidad: cantidad,
      observaciones: obs || null
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
  } catch (e) { showError(e); }
}

async function eliminarMovimiento(id) {
  if (!confirm('¿Eliminar el registro de movimiento?\nEsta acción NO revierte el cambio de existencias.')) return;
  try {
    await del(`/movimientos/${id}`);
    await renderMovimientos();
  } catch (e) { showError(e); }
}

// ==================== PEDIDOS ====================
async function renderPedidos() {
  const [pedidos, clientes] = await Promise.all([get('/pedidos'), get('/clientes')]);
  cache.pedidos = pedidos;
  cache.clientes = clientes;

  //Secuencia completa de estados
  const secuenciaIA = {
    'Pendiente': 'En preparación',
    'En preparación': 'Enviado',
    'Enviado': 'Entregado'
  };

  document.getElementById('tablaPedidos').innerHTML = pedidos.length
    ? pedidos.map(p => {
        const puedeAvanzar = secuenciaIA.hasOwnProperty(p.estado);
        const siguienteEstado = secuenciaIA[p.estado];
        
        return `<tr>
          <td>#${p.idPedido}</td>
          <td>${esc(byId(clientes, 'idCliente', p.idCliente)?.nombre || `Cliente #${p.idCliente}`)}</td>
          <td>${date(p.fechaPedido)}</td>
          <td>${money(p.total)}</td>
          <td><span class="badge estado ${p.estado === 'Enviado' ? 'estado-enviado' : p.estado === 'Entregado' ? 'estado-entregado' : ''}">${esc(p.estado || '—')}</span></td>
          <td>${esc(p.observaciones || '—')}</td>
          <td class="actions">
            ${puedeAvanzar
              ? `<button class="btn-icon btn-success" title="IA: Pasar a ${siguienteEstado}" onclick="iaAvanzarPedido(${p.idPedido}, '${p.estado}', '${siguienteEstado}')">ENV</button>`
              : ''}
            <button class="btn-icon" title="Imprimir reporte del pedido" onclick="imprimirReportePedido(${p.idPedido})"><i class="fi fi-rr-print"></i></button>
            ${botonEliminarAdmin(`eliminarPedido(${p.idPedido})`)}
          </td>
        </tr>`;
      }).join('')
    : '<tr><td colspan="7" style="text-align:center">No hay pedidos registrados</td></tr>';
}


function opcionesProductosPedido() {
  return `<option value="">Selecciona un producto</option>` + cache.productos
    .map(x => `<option value="${x.idProducto}">${esc(x.nombre)} — ${money(x.precioUnitario)}</option>`).join('');
}

function agregarLineaPedido(idProducto = '', cantidad = 1) {
  const contenedor = document.getElementById('pedLineas');
  const fila = document.createElement('div');
  fila.className = 'pedido-linea';
  fila.innerHTML = `
    <div class="campo-busqueda-inline">
      <input 
        type="text" 
        class="ped-linea-producto-buscar" 
        placeholder="Escribe nombre o SKU..."
        autocomplete="off"
      >
      <div class="lista-sugerencias"></div>
      <input type="hidden" class="ped-linea-producto-id" value="${idProducto}">
    </div>
    <input class="ped-linea-cantidad" type="number" min="1" step="1" value="${Number(cantidad) || 1}" aria-label="Cantidad">
    <button type="button" class="btn-icon danger" title="Quitar producto" aria-label="Quitar producto">✕</button>`;

  fila.querySelector('.ped-linea-cantidad').addEventListener('input', actualizarTotalPedidoVista);
  fila.querySelector('button').addEventListener('click', () => {
    fila.remove();
    if (!contenedor.children.length) agregarLineaPedido();
    actualizarTotalPedidoVista();
  });

  contenedor.appendChild(fila);

  // Inicializar búsqueda en esta fila
  inicializarBusquedaProducto(fila.querySelector('.campo-busqueda-inline'), idProducto);

  actualizarTotalPedidoVista();
}

function actualizarTotalPedidoVista() {
  // Obtener todas las filas del pedido
  const filas = [...document.querySelectorAll('#pedLineas .pedido-linea')];
  
  // Calcular suma de cada fila: precio × cantidad
  const total = filas.reduce((suma, fila) => {
    const idProd = Number(fila.querySelector('.ped-linea-producto-id').value);
    const cantidad = Number(fila.querySelector('.ped-linea-cantidad').value) || 0;
    
    // Buscar el producto en caché para obtener su precio
    const producto = cache.productos.find(p => Number(p.idProducto) === idProd);
    
    // Sumar solo si hay producto válido
    return suma + (producto ? Number(producto.precioUnitario) * cantidad : 0);
  }, 0);

  // Mostrar formateado como moneda mexicana ($0.00)
  const elementoTotal = document.getElementById('pedTotalVista');
  if (elementoTotal) {
    elementoTotal.value = money(total);
  }
}

async function abrirModalPedido() {
  await cargarDatos();
  document.getElementById('pedId').value = '';
  document.getElementById('modalPedidoTitle').textContent = 'Nuevo pedido';
  document.getElementById('pedEstado').value = 'Pendiente';
  document.getElementById('pedObservaciones').value = '';
  document.getElementById('pedLineas').innerHTML = '';
  agregarLineaPedido();

  // Elementos
  const inputBusqueda = document.getElementById('pedCliente-busqueda');
  const divResultados = document.getElementById('pedCliente-resultados');
  const inputIdCliente = document.getElementById('pedCliente');

  // Limpiar
  inputBusqueda.value = '';
  divResultados.innerHTML = '';
  inputIdCliente.value = '';

  //ESCUCHAR LO QUE ESCRIBES — SIN clonar
  inputBusqueda.oninput = function () {
    const termino = this.value.trim().toLowerCase();
    divResultados.innerHTML = '';

    if (termino.length < 1 || !cache.clientes.length) return;

    // Filtrar clientes
    const resultados = cache.clientes.filter(c => {
      const idTexto = String(c.idCliente);
      const idFormateado = idTexto.padStart(5, '0');
      return (
        (c.nombre && c.nombre.toLowerCase().includes(termino)) ||
        (c.negocio && c.negocio.toLowerCase().includes(termino)) ||
        idTexto.includes(termino) ||
        idFormateado.includes(termino)
      );
    });

    // Mostrar mensaje si no hay resultados
    if (resultados.length === 0) {
      divResultados.innerHTML = '<div class="item-sugerencia">No se encontraron clientes</div>';
      return;
    }

    // Mostrar cada cliente
    resultados.forEach(c => {
      const opcion = document.createElement('div');
      opcion.className = 'item-sugerencia';
      opcion.innerHTML = `
        <strong>${esc(c.nombre)}</strong>
        <br><span>#${String(c.idCliente).padStart(5, '0')} · ${esc(c.negocio)}</span>
      `;
      opcion.onclick = function () {
        inputBusqueda.value = c.nombre;
        inputIdCliente.value = c.idCliente;
        divResultados.innerHTML = '';
      };
      divResultados.appendChild(opcion);
    });
  };

  // Cerrar al hacer clic fuera
  document.onclick = function (e) {
    if (!inputBusqueda.contains(e.target) && !divResultados.contains(e.target)) {
      divResultados.innerHTML = '';
    }
  };

  document.getElementById('modalPedido').classList.add('active');
}

async function guardarPedido() {
  // 1. Recuperar valores del formulario
  const idCliente = Number(document.getElementById('pedCliente').value);
  const filas = [...document.querySelectorAll('#pedLineas .pedido-linea')];
  const estado = document.getElementById('pedEstado').value.trim();
  const observaciones = document.getElementById('pedObservaciones').value.trim();

  // 2. Construir lista de productos
  const productos = filas.map((fila, indice) => {
    const idProducto = Number(fila.querySelector('.ped-linea-producto-id').value);
    const cantidad = Number(fila.querySelector('.ped-linea-cantidad').value);
    return { idProducto, cantidad, fila: indice + 1 };
  });

  // 3. Validaciones
  if (!idCliente || isNaN(idCliente)) {
    return alert('Selecciona un cliente de la lista antes de guardar.');
  }

  if (productos.length === 0) {
    return alert('Agrega al menos un producto al pedido.');
  }

  const filasInvalidas = productos.filter(p => !p.idProducto || !Number.isInteger(p.cantidad) || p.cantidad < 1);
  if (filasInvalidas.length > 0) {
    return alert(`Revisa el renglón ${filasInvalidas.map(f => f.fila).join(', ')}:\nSelecciona un producto y usa una cantidad entera mayor a 0.`);
  }

  const idsProductos = productos.map(p => p.idProducto);
  if (new Set(idsProductos).size !== productos.length) {
    return alert('No puedes repetir el mismo producto.\nModifica la cantidad en el renglón existente.');
  }

  // 4. Enviar al backend
  try {
    await post('/pedidos', {
      idCliente,
      estado,
      observaciones: observaciones || null,
      productos: productos.map(({ idProducto, cantidad }) => ({ idProducto, cantidad }))
    });

    cerrarModal('modalPedido');
    await cargarDatos();
    await renderPedidos();
    await renderDashboard();
    alert('✅ Pedido guardado correctamente.');

  } catch (error) {
    console.error('Error al guardar el pedido:', error);
    showError(error);
  }
}



async function imprimirReportePedido(id) {
  try {
    const pedido = await get(`/pedidos/${id}`);
    const detalles = await get(`/pedidos/${id}/detalles`);
    const cliente = byId(cache.clientes, 'idCliente', pedido.idCliente);
    const filas = detalles.map(d => {
      const producto = byId(cache.productos, 'idProducto', d.idProducto);
      return `<tr><td>${esc(producto?.sku || '—')}</td><td>${esc(producto?.nombre || `Producto #${d.idProducto}`)}</td><td>${d.cantidad}</td><td>${money(d.precioUnitario)}</td><td>${money(d.subtotal)}</td></tr>`;
    }).join('');
    const ventana = window.open('', '_blank');
    if (!ventana) return alert('El navegador bloqueó la ventana. Permite las ventanas emergentes para imprimir.');
    ventana.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Pedido #${pedido.idPedido} - Mariana Plásticos</title>
      <style>body{font-family:Arial,sans-serif;color:#1f2937;margin:36px}h1{color:#245bd6;margin-bottom:4px}.muted{color:#64748b}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{padding:10px;border-bottom:1px solid #dbe2ea;text-align:left}th{background:#eaf1fb}.total{text-align:right;font-size:20px;font-weight:bold;margin-top:22px}.datos{display:flex;justify-content:space-between;gap:20px;margin-top:24px}.notas{margin-top:22px}@media print{button{display:none}}</style></head><body>
      <h1>Mariana Plásticos</h1><div class="muted">Reporte de pedido</div><div class="datos"><div><b>Pedido:</b> #${pedido.idPedido}<br><b>Cliente:</b> ${esc(cliente?.nombre || `Cliente #${pedido.idCliente}`)}<br><b>Negocio:</b> ${esc(cliente?.negocio || '—')}</div><div><b>Fecha:</b> ${esc(date(pedido.fechaPedido))}<br><b>Estado:</b> ${esc(pedido.estado || '—')}</div></div>
      <table><thead><tr><th>SKU</th><th>Producto</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th></tr></thead><tbody>${filas}</tbody></table>
      <div class="total">Total: ${money(pedido.total)}</div><div class="notas"><b>Observaciones:</b> ${esc(pedido.observaciones || 'Sin observaciones')}</div><p class="muted" style="margin-top:48px">Mariana Plásticos · Sistema de Inventario</p><script>window.onload=()=>window.print();</script></body></html>`);
    ventana.document.close();
  } catch (e) { showError(e); }
}

async function eliminarPedido(id) {
  if (!confirm('¿Eliminar este pedido y sus detalles?')) return;
  try {
    await del(`/pedidos/${id}`);
    await renderPedidos();
    await renderDashboard();
  } catch (e) { showError(e); }
}

function cambiarFiltrosReporte() {
  const tipo = document.getElementById('tipoReporte').value;
  const mostrarFechas = ['movimientos', 'pedidos'].includes(tipo);
  const mostrarEstado = tipo === 'pedidos';

  document.getElementById('filtroFechas').style.display = mostrarFechas ? 'block' : 'none';
  document.getElementById('filtroFechas2').style.display = mostrarFechas ? 'block' : 'none';
  document.getElementById('filtroEstado').style.display = mostrarEstado ? 'block' : 'none';
}

async function generarReporte() {
  const tipo = document.getElementById('tipoReporte').value;
  await cargarDatos();

  const thead = document.getElementById('theadReporte');
  const tbody = document.getElementById('tbodyReporte');
  const titulo = document.getElementById('tituloReporte');
  const total = document.getElementById('totalRegistros');

  const fechaDesde = document.getElementById('fechaDesde')?.value || '';
  const fechaHasta = document.getElementById('fechaHasta')?.value || '';
  const filtroEstado = document.getElementById('estadoPedido')?.value || '';

  let htmlHead = '';
  let htmlBody = '';
  let datos = [];

  if (tipo === 'stock') {
    titulo.textContent = 'Stock actual';
    htmlHead = `<tr>
      <th>Producto</th><th>SKU</th><th>Categoría</th>
      <th>Stock actual</th><th>Stock mínimo</th><th>Estado</th>
    </tr>`;

    datos = cache.inventario.map(i => {
      const p = byId(cache.productos, 'idProducto', i.idProducto);
      const cat = byId(cache.categorias, 'idCategoria', p?.idCategoria);
      return { p, i, cat };
    }).filter(x => x.p);

    htmlBody = datos.map(({ p, i, cat }) => `
      <tr>
        <td>${esc(p.nombre)}</td>
        <td>${esc(p.sku || '—')}</td>
        <td>${esc(cat?.nombre || '—')}</td>
        <td><strong>${esc(i.cantidadActual)}</strong></td>
        <td>${esc(p.stockMinimo ?? 0)}</td>
        <td><span class="badge ${p.estado === 'Activo' ? 'badge-success' : 'badge-danger'}">${esc(p.estado)}</span></td>
      </tr>`).join('');
  }

  else if (tipo === 'stock-bajo') {
    titulo.textContent = 'Productos con stock bajo';
    htmlHead = `<tr>
      <th>Producto</th><th>Categoría</th>
      <th>Stock actual</th><th>Mínimo</th><th>Faltante</th>
    </tr>`;

    datos = cache.inventario.filter(i => {
      const p = byId(cache.productos, 'idProducto', i.idProducto);
      return p && Number(i.cantidadActual) <= Number(p.stockMinimo || 0);
    });

    htmlBody = datos.map(i => {
      const p = byId(cache.productos, 'idProducto', i.idProducto);
      const cat = byId(cache.categorias, 'idCategoria', p?.idCategoria);
      const faltante = (p.stockMinimo || 0) - (i.cantidadActual || 0);
      return `<tr>
        <td>${esc(p.nombre)}</td>
        <td>${esc(cat?.nombre || '—')}</td>
        <td>${esc(i.cantidadActual)}</td>
        <td>${esc(p.stockMinimo)}</td>
        <td><span class="badge badge-danger">${faltante}</span></td>
      </tr>`;
    }).join('');
  }

  else if (tipo === 'movimientos') {
    titulo.textContent = 'Movimientos de inventario';
    htmlHead = `<tr>
      <th>Fecha</th><th>Tipo</th><th>Producto</th><th>Cantidad</th><th>Observaciones</th>
    </tr>`;

    datos = (cache.movimientos || []).filter(m => {
      if (!m.fechaMovimiento) return false;
      const f = new Date(m.fechaMovimiento);
      if (fechaDesde) {
        const d = new Date(fechaDesde);
        if (f < d) return false;
      }
      if (fechaHasta) {
        const h = new Date(fechaHasta);
        h.setHours(23, 59, 59, 999);
        if (f > h) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.fechaMovimiento) - new Date(a.fechaMovimiento));

    htmlBody = datos.map(m => {
      const p = byId(cache.productos, 'idProducto', m.idProducto);
      return `<tr>
        <td>${date(m.fechaMovimiento)}</td>
        <td>${esc(m.tipoMovimiento || '—')}</td>
        <td>${esc(p?.nombre || '—')}</td>
        <td>${m.cantidad ?? '—'}</td>
        <td>${esc(m.observaciones || '—')}</td>
      </tr>`;
    }).join('');
  }

  else if (tipo === 'pedidos') {
    titulo.textContent = 'Pedidos';
    htmlHead = `<tr>
      <th>ID</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Estado</th><th>Observaciones</th>
    </tr>`;

    datos = (cache.pedidos || []).filter(p => {
      if (filtroEstado && p.estado !== filtroEstado) return false;
      if (!p.fechaPedido) return true;
      const f = new Date(p.fechaPedido);
      if (fechaDesde) {
        const d = new Date(fechaDesde);
        if (f < d) return false;
      }
      if (fechaHasta) {
        const h = new Date(fechaHasta);
        h.setHours(23, 59, 59, 999);
        if (f > h) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.fechaPedido) - new Date(a.fechaPedido));

    htmlBody = datos.map(p => {
      const c = byId(cache.clientes, 'idCliente', p.idCliente);
      return `<tr>
        <td>#${p.idPedido}</td>
        <td>${esc(c?.nombre || `Cliente #${p.idCliente}`)}</td>
        <td>${date(p.fechaPedido)}</td>
        <td>${money(p.total)}</td>
        <td>${esc(p.estado || '—')}</td>
        <td>${esc(p.observaciones || '—')}</td>
      </tr>`;
    }).join('');
  }

  else if (tipo === 'clientes') {
    titulo.textContent = 'Clientes';
    htmlHead = `<tr>
      <th>ID</th><th>Nombre</th><th>Negocio</th><th>Correo</th><th>Teléfono</th><th>Dirección</th><th>Tipo</th>
    </tr>`;

    datos = cache.clientes || [];

    htmlBody = datos.map(c => `
      <tr>
        <td>${String(c.idCliente).padStart(4, '0')}</td>
        <td>${esc(c.nombre || '')}</td>
        <td>${esc(c.negocio || '—')}</td>
        <td>${esc(c.correo || '')}</td>
        <td>${esc(c.telefono || '')}</td>
        <td>${esc(c.direccion || '')}</td>
        <td>${c.categoria == 1 ? 'Mayorista' : c.categoria == 2 ? 'Menudista' : '—'}</td>
      </tr>`).join('');
  }

  thead.innerHTML = htmlHead;
  tbody.innerHTML = htmlBody || `<tr><td colspan="10" style="text-align:center">No hay datos</td></tr>`;
  total.textContent = `${datos.length} registro(s)`;
}

function exportarExcel() {
  const thead = document.getElementById('theadReporte');
  const tbody = document.getElementById('tbodyReporte');
  const titulo = document.getElementById('tituloReporte')?.textContent || 'Reporte';

  if (!thead || !tbody || tbody.querySelector('td[colspan]')) {
    alert('Primero genera un reporte para poder exportarlo.');
    return;
  }

  const filas = [];
  // Encabezados
  const ths = Array.from(thead.querySelectorAll('th')).map(th => `"${th.textContent.trim().replace(/"/g, '""')}"`);
  filas.push(ths.join(','));

  // Datos
  tbody.querySelectorAll('tr').forEach(tr => {
    const celdas = Array.from(tr.querySelectorAll('td')).map(td => {
      let texto = td.textContent.trim().replace(/"/g, '""');
      return `"${texto}"`;
    });
    if (celdas.length) filas.push(celdas.join(','));
  });

  const csv = '\uFEFF' + filas.join('\n'); // BOM para Excel en español
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${titulo.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function generarReporteDelDia() {
  await cargarDatos();

  const hoy = new Date();
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const fin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);

  // Filtrar solo lo de hoy
  const movimientosHoy = (cache.movimientos || []).filter(m => {
    const f = new Date(m.fechaMovimiento);
    return f >= inicio && f < fin;
  });

  const pedidosHoy = (cache.pedidos || []).filter(p => {
    const f = new Date(p.fechaPedido);
    return f >= inicio && f < fin;
  });

  // Filas de movimientos
  const filasMov = movimientosHoy.map(m => {
    const p = byId(cache.productos, 'idProducto', m.idProducto);
    return `<tr>
      <td>${date(m.fechaMovimiento)}</td>
      <td>${esc(m.tipoMovimiento || '—')}</td>
      <td>${esc(p?.nombre || '—')}</td>
      <td>${m.cantidad ?? '—'}</td>
      <td>${esc(m.observaciones || '—')}</td>
    </tr>`;
  }).join('') || '<tr><td colspan="5" style="text-align:center">Sin movimientos hoy</td></tr>';

  // Filas de pedidos
  const filasPed = pedidosHoy.map(p => {
    const c = byId(cache.clientes, 'idCliente', p.idCliente);
    return `<tr>
      <td>#${p.idPedido}</td>
      <td>${esc(c?.nombre || '—')}</td>
      <td>${date(p.fechaPedido)}</td>
      <td>${money(p.total)}</td>
      <td>${esc(p.estado || '—')}</td>
    </tr>`;
  }).join('') || '<tr><td colspan="5" style="text-align:center">Sin pedidos hoy</td></tr>';

  const ventana = window.open('', '_blank');
  if (!ventana) {
    alert('El navegador bloqueó la ventana. Permite las ventanas emergentes para imprimir el reporte.');
    return;
  }

  ventana.document.write(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Reporte del día - Mariana Plásticos</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #1f2937; }
    h1 { color: #245bd6; margin-bottom: 4px; }
    h2 { margin-top: 32px; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; }
    .muted { color: #64748b; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; text-align: left; font-size: 14px; }
    th { background: #eaf1fb; }
    @media print { button { display: none; } }
  </style>
</head>
<body>
  <h1>Mariana Plásticos</h1>
  <div class="muted">Reporte de actividad del día · ${hoy.toLocaleDateString('es-MX')}</div>

  <h2>Movimientos del día (${movimientosHoy.length})</h2>
  <table>
    <thead>
      <tr>
        <th>Fecha</th>
        <th>Tipo</th>
        <th>Producto</th>
        <th>Cantidad</th>
        <th>Observaciones</th>
      </tr>
    </thead>
    <tbody>${filasMov}</tbody>
  </table>

  <h2>Pedidos del día (${pedidosHoy.length})</h2>
  <table>
    <thead>
      <tr>
        <th>Pedido</th>
        <th>Cliente</th>
        <th>Fecha</th>
        <th>Total</th>
        <th>Estado</th>
      </tr>
    </thead>
    <tbody>${filasPed}</tbody>
  </table>

  <p class="muted" style="margin-top: 40px">
    Generado el ${new Date().toLocaleString('es-MX')}
  </p>

  <script>window.onload = () => window.print();</script>
</body>
</html>`);
  ventana.document.close();
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
  const filtroTipo = document.getElementById('filtroTipoCliente')?.value || '';

  const lista = cache.clientes.filter(c => {
    const idFormateado = String(c.idCliente).padStart(4, '0');   // ← 0001, 0002...

    const coincideTexto = (
      `${c.idCliente || ''} ${idFormateado} ${c.nombre || ''} ${c.negocio || ''} ${c.correo || ''}`
    ).toLowerCase().includes(texto);

    const coincideTipo = !filtroTipo || String(c.categoria) === String(filtroTipo);
    return coincideTexto && coincideTipo;
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
      <td class="actions">
  ${botonesAdmin(
          `abrirModalCliente(${c.idCliente})`,
          `eliminarCliente(${c.idCliente})`
        )}
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
      document.getElementById('clienteNombre').value = c.nombre || '';
      document.getElementById('clienteNegocio').value = c.negocio || '';
      document.getElementById('clienteCorreo').value = c.correo || '';
      document.getElementById('clienteTelefono').value = c.telefono || '';
      document.getElementById('clienteDireccion').value = c.direccion || '';
      document.getElementById('clienteCategoria').value = c.categoria || '';
    }
  } else {
    // Limpiar formulario
    document.getElementById('clienteNombre').value = '';
    document.getElementById('clienteNegocio').value = '';
    document.getElementById('clienteCorreo').value = '';
    document.getElementById('clienteTelefono').value = '';
    document.getElementById('clienteDireccion').value = '';
    document.getElementById('clienteCategoria').value = '';
  }

  document.getElementById('modalCliente').classList.add('active');
}

async function guardarCliente() {
  const id = document.getElementById('clienteId').value;

  const datos = {
    nombre: document.getElementById('clienteNombre').value.trim(),
    negocio: document.getElementById('clienteNegocio').value.trim() || null,
    correo: document.getElementById('clienteCorreo').value.trim() || null,
    telefono: document.getElementById('clienteTelefono').value.trim() || null,
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

async function enviarMensaje() {
  const input = document.getElementById('chatInput');
  const texto = input.value.trim();
  if (!texto) return;

  const box = document.getElementById('chatMessages');
  box.innerHTML += `<div class="message user">${esc(texto)}</div>`;
  input.value = '';

  // Mensaje de espera
  const esperandoId = 'msg-esperando-' + Date.now();
  box.innerHTML += `<div id="${esperandoId}" class="message bot"><em>Mariana IA está pensando...</em></div>`;
  box.scrollTop = box.scrollHeight;

  const BASE_URL = "https://mariana-plasticos-backend.onrender.com/api";

  try {
    //  RUTA CORRECTA: /asistente/consultar
    const response = await fetch(`${BASE_URL}/asistente/consultar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consulta: texto }) //  Campo correcto: "consulta"
    });

    //  Leer como texto primero para evitar error de JSON
    const textoRespuesta = await response.text();
    let datos;
    try {
      datos = JSON.parse(textoRespuesta);
    } catch {
      throw new Error(textoRespuesta || "Respuesta no válida");
    }

    if (!response.ok || !datos.success) {
      throw new Error(datos.message || `Error ${response.status}`);
    }

    //  Mostrar respuesta real del backend
    const elemEsperando = document.getElementById(esperandoId);
    if (elemEsperando) elemEsperando.remove();
    box.innerHTML += `<div class="message bot">${esc(datos.message).replace(/\n/g, '<br>')}</div>`;

  } catch (error) {
    console.error("Error:", error);
    const elemEsperando = document.getElementById(esperandoId);
    if (elemEsperando) elemEsperando.remove();

    //  Mensaje de error claro
    box.innerHTML += `<div class="message bot"> ${error.message}<br>Si Render estaba inactivo, espera 30s y vuelve a intentar.</div>`;
  }

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
  document.getElementById('filtroTipoCliente')?.addEventListener('change', () => renderClientes().catch(showError));
  document.getElementById('filtroCategoria')?.addEventListener('change', () => renderProductos().catch(showError));

    // No conservar la sesión al cerrar o actualizar la aplicación
  usuarioActual = null;
  localStorage.removeItem('usuario');
  document.getElementById('app').style.display = 'none';
  document.getElementById('login').style.display = 'flex';
});

// Estado de ordenamiento por tabla
let sortState = {};

/**
 * Ordena las filas de una tabla al hacer clic en un encabezado.
 * @param {string} tablaId  - id del <tbody> (ej: "tablaProductos")
 * @param {number} colIndex - número de columna (empezando en 0)
 */
function ordenarTabla(tablaId, colIndex) {
  const tbody = document.getElementById(tablaId);
  if (!tbody) return;

  const filas = Array.from(tbody.querySelectorAll('tr'));
  if (filas.length === 0) return;

  // Alternar dirección
  const estado = sortState[tablaId] || { col: -1, dir: 'asc' };
  const dir = (estado.col === colIndex && estado.dir === 'asc') ? 'desc' : 'asc';
  sortState[tablaId] = { col: colIndex, dir };

  filas.sort((a, b) => {
    const celdaA = a.children[colIndex];
    const celdaB = b.children[colIndex];
    if (!celdaA || !celdaB) return 0;

    let va = celdaA.textContent.trim().toLowerCase();
    let vb = celdaB.textContent.trim().toLowerCase();

    // Intentar ordenar como número si es posible
    const na = parseFloat(va.replace(/[^0-9.-]/g, ''));
    const nb = parseFloat(vb.replace(/[^0-9.-]/g, ''));

    let cmp;
    if (!isNaN(na) && !isNaN(nb) && va !== '' && vb !== '') {
      cmp = na - nb;
    } else {
      cmp = va.localeCompare(vb, 'es', { sensitivity: 'base' });
    }

    return dir === 'asc' ? cmp : -cmp;
  });

  // Volver a insertar las filas ordenadas
  filas.forEach(fila => tbody.appendChild(fila));
}

/** Devuelve true si el usuario actual es Administrador */
function esAdmin() {
  return usuarioActual?.idRol === 1;
}

/**
 * Devuelve los botones de Editar y Eliminar solo si es Admin.
 * Si no es admin, devuelve cadena vacía.
 */
function botonesAdmin(editarOnClick, eliminarOnClick) {
  if (!esAdmin()) return '';
  return `
    <button class="btn-icon" title="Editar" onclick="${editarOnClick}">✏️</button>
    <button class="btn-icon danger" title="Eliminar" onclick="${eliminarOnClick}">🗑️</button>
  `;
}

/** Solo botón eliminar (para movimientos, pedidos, etc.) */
function botonEliminarAdmin(eliminarOnClick) {
  if (!esAdmin()) return '';
  return `<button class="btn-icon danger" title="Eliminar" onclick="${eliminarOnClick}">🗑️</button>`;
}

async function confirmarEntregaPorIA(idPedido, motivo = "Confirmado automáticamente") {
  if (!confirm(`¿Marcar pedido #${idPedido} como Entregado?`)) return;

  try {
    const respuesta = await fetch(
      `${API_BASE}/pedidos/${idPedido}/entregar-ia?motivo=${encodeURIComponent(motivo)}`,
      { method: 'PATCH' }
    );

    const datos = await respuesta.json().catch(() => ({}));
    
    if (respuesta.ok && datos.success !== false) {
      alert('✅ ' + (datos.message || 'Pedido marcado como Entregado'));
      await cargarDatos();
      await renderPedidos(); // Refrescar la tabla
      return true;
    } else {
      alert('⚠️ ' + (datos.message || 'No se pudo actualizar'));
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error);
    alert('Error de conexión con el servidor. Verifica que el backend esté activo.');
    return false;
  }
}

// ========== BÚSQUEDA DE PRODUCTOS EN LÍNEAS DE PEDIDO ==========
function inicializarBusquedaProducto(contenedor, idSeleccionado = '') {
  const inputBuscar = contenedor.querySelector('.ped-linea-producto-buscar');
  const resultados = contenedor.querySelector('.lista-sugerencias');
  const inputId = contenedor.querySelector('.ped-linea-producto-id');

  // Si viene un ID precargado, mostrar el nombre del producto
  if (idSeleccionado && cache.productos.length) {
    const producto = cache.productos.find(p => String(p.idProducto) === String(idSeleccionado));
    if (producto) {
      inputBuscar.value = producto.nombre;
      inputId.value = producto.idProducto;
    }
  }

  // Buscar mientras escribe
  inputBuscar.addEventListener('input', () => {
    const termino = inputBuscar.value.trim().toLowerCase();
    resultados.innerHTML = '';

    if (termino.length < 2 || !cache.productos.length) return;

    const coinciden = cache.productos.filter(p =>
      (p.nombre && p.nombre.toLowerCase().includes(termino)) ||
      (p.sku && p.sku.toLowerCase().includes(termino))
    );

    coinciden.forEach(producto => {
      const opcion = document.createElement('div');
      opcion.className = 'item-sugerencia';
      opcion.innerHTML = `
        <strong>${producto.nombre}</strong><br>
        <span class="sku">${producto.sku || 'SIN-SKU'}</span> — $${(producto.precioUnitario || 0).toFixed(2)}
      `;
      opcion.addEventListener('click', () => {
        inputBuscar.value = producto.nombre;
        inputId.value = producto.idProducto;
        resultados.innerHTML = '';
        actualizarTotalPedidoVista();
      });
      resultados.appendChild(opcion);
    });
  });

  // Cerrar lista al hacer clic fuera
  document.addEventListener('click', e => {
    if (!contenedor.contains(e.target)) resultados.innerHTML = '';
  });
}

// ========== FUNCIONES AUXILIARES FALTANTES ==========
function cerrarModal(id) {
  document.getElementById(id)?.classList.remove('active');
}

//Función central de automatización de estados
async function iaAvanzarPedido(idPedido, estadoActual, estadoSiguiente) {
  const confirmar = confirm(
    `Asistente IA\n\n` +
    `Pedido #${idPedido}\n` +
    `Estado actual: ${estadoActual}\n` +
    `→ Cambiar a: ${estadoSiguiente}\n\n` +
    `¿Confirmar cambio automático?`
  );
  
  if (!confirmar) return;

  try {
    await actualizarPedido(idPedido, {
      estado: estadoSiguiente,
      observaciones: `IA: Confirmado automáticamente — pasó de "${estadoActual}" a "${estadoSiguiente}"`
    });
    
    alert(`Pedido #${idPedido} actualizado a: ${estadoSiguiente}`);
    await cargarPedidos(); // Refrescar tabla
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}

//Función de automatización de estados por IA — CORREGIDA
async function iaAvanzarPedido(idPedido, estadoActual, estadoSiguiente) {
  const confirmar = confirm(
    `Asistente IA\n\n` +
    `Pedido #${idPedido}\n` +
    `Estado actual: ${estadoActual}\n` +
    `→ Cambiar a: ${estadoSiguiente}\n\n` +
    `¿Confirmar cambio automático?`
  );
  
  if (!confirmar) return;

  try {
    //Si va a Entregado → usamos la ruta que ya funciona
    if (estadoSiguiente === 'Entregado') {
      return await confirmarEntregaPorIA(idPedido, `IA: Cambiado automáticamente de "${estadoActual}" a "${estadoSiguiente}"`);
    }

    //Para los demás estados → usamos PUT /pedidos/{id} que ya existe
    const respuesta = await put(`/pedidos/${idPedido}`, {
      estado: estadoSiguiente,
      observaciones: `IA: Cambiado automáticamente de "${estadoActual}" a "${estadoSiguiente}"`
    });

    alert(`Pedido #${idPedido} → ${estadoSiguiente}`);
    await cargarDatos();
    await renderPedidos();
    
  } catch (error) {
    console.error('Error:', error);
    alert(`No se pudo actualizar el estado.\nVerifica que el servidor esté activo.`);
  }
}
