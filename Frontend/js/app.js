/**
 * Mariana Plásticos - Sistema de Inventario
 * Lógica principal: Auth, Navegación, CRUD y Asistente IA
 */

let usuarioActual = null;

// ========== AUTH ==========
function login() {
  const correo = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPass').value;
  const errorEl = document.getElementById('loginError');

  const user = DB.usuarios.find(u => u.correo === correo && u.contraseña === pass && u.estado === 'Activo');

  if (!user) {
    errorEl.style.display = 'block';
    errorEl.textContent = 'Correo o contraseña incorrectos';
    return;
  }

  errorEl.style.display = 'none';
  usuarioActual = user;

  document.getElementById('login').style.display = 'none';
  document.getElementById('app').style.display = 'block';

  // Actualizar info de usuario en sidebar
  const iniciales = user.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  document.getElementById('userAvatar').textContent = iniciales;
  document.getElementById('userName').textContent = user.nombre;
  document.getElementById('userRole').textContent = getRol(user.id_rol);

  mostrarPagina('dashboard');
}

function logout() {
  usuarioActual = null;
  document.getElementById('app').style.display = 'none';
  document.getElementById('login').style.display = 'flex';
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPass').value = '';
  document.getElementById('loginError').style.display = 'none';
}

// ========== NAVEGACIÓN ==========
function mostrarPagina(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');

  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const link = document.querySelector(`.nav-link[data-page="${id}"]`);
  if (link) link.classList.add('active');

  // Renderizar datos al entrar a la pantalla
  switch (id) {
    case 'dashboard': renderDashboard(); break;
    case 'productos': renderProductos(); break;
    case 'inventario': renderInventario(); break;
    case 'movimientos': renderMovimientos(); break;
    case 'pedidos': renderPedidos(); break;
  }
}

// ========== DASHBOARD ==========
function renderDashboard() {
  const activos = DB.productos.filter(p => p.estado === 'Activo').length;
  let stockBajo = 0;
  DB.inventario.forEach(inv => {
    const prod = getProducto(inv.id_producto);
    if (prod && inv.cantidad_actual < prod.stock_minimo) stockBajo++;
  });
  const pendientes = DB.pedidos.filter(p => p.estado === 'Pendiente' || p.estado === 'En preparación').length;
  const movHoy = DB.movimientos.length; // demo: total

  document.getElementById('statProductos').textContent = activos;
  document.getElementById('statStockBajo').textContent = stockBajo;
  document.getElementById('statPedidos').textContent = pendientes;
  document.getElementById('statMovimientos').textContent = movHoy;

  // Tabla stock bajo
  const tbody = document.getElementById('tablaStockBajo');
  tbody.innerHTML = '';
  DB.inventario.forEach(inv => {
    const prod = getProducto(inv.id_producto);
    if (!prod || inv.cantidad_actual >= prod.stock_minimo) return;
    const critico = inv.cantidad_actual < prod.stock_minimo * 0.5;
    tbody.innerHTML += `
      <tr>
        <td>${prod.nombre}</td>
        <td>${getCategoria(prod.id_categoria)}</td>
        <td>${inv.cantidad_actual}</td>
        <td>${prod.stock_minimo}</td>
        <td><span class="badge ${critico ? 'badge-danger' : 'badge-warning'}">${critico ? 'Crítico' : 'Bajo'}</span></td>
      </tr>`;
  });
  if (!tbody.innerHTML) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--gray);">No hay productos con stock bajo 🎉</td></tr>';
  }
}

// ========== PRODUCTOS (CRUD) ==========
function renderProductos() {
  const tbody = document.getElementById('tablaProductos');
  tbody.innerHTML = '';
  const filtro = (document.getElementById('searchProductos')?.value || '').toLowerCase();
  const catFiltro = document.getElementById('filtroCategoria')?.value || '';

  DB.productos.forEach(p => {
    if (filtro && !p.nombre.toLowerCase().includes(filtro) && !p.sku.toLowerCase().includes(filtro)) return;
    if (catFiltro && p.id_categoria != catFiltro) return;

    const stock = getStock(p.id_producto);
    tbody.innerHTML += `
      <tr>
        <td><strong>${p.nombre}</strong><br><small style="color:var(--gray)">${p.sku}</small></td>
        <td>${getCategoria(p.id_categoria)}</td>
        <td>${formatMoney(p.precio_unitario)}</td>
        <td>${stock}</td>
        <td><span class="badge ${p.estado === 'Activo' ? 'badge-success' : 'badge-danger'}">${p.estado}</span></td>
        <td class="actions">
          <button class="btn-icon" title="Editar" onclick="abrirModalProducto(${p.id_producto})">✏️</button>
          <button class="btn-icon danger" title="Eliminar" onclick="eliminarProducto(${p.id_producto})">🗑️</button>
        </td>
      </tr>`;
  });
}

function abrirModalProducto(id = null) {
  const modal = document.getElementById('modalProducto');
  const title = document.getElementById('modalProductoTitle');
  document.getElementById('prodId').value = id || '';

  // Llenar select categorías
  const select = document.getElementById('prodCategoria');
  select.innerHTML = DB.categorias.map(c => `<option value="${c.id_categoria}">${c.nombre}</option>`).join('');

  if (id) {
    const p = getProducto(id);
    title.textContent = 'Editar Producto';
    document.getElementById('prodSku').value = p.sku;
    document.getElementById('prodNombre').value = p.nombre;
    document.getElementById('prodDescripcion').value = p.descripcion;
    document.getElementById('prodPrecio').value = p.precio_unitario;
    document.getElementById('prodStockMin').value = p.stock_minimo;
    document.getElementById('prodCategoria').value = p.id_categoria;
    document.getElementById('prodEstado').value = p.estado;
  } else {
    title.textContent = 'Nuevo Producto';
    document.getElementById('prodSku').value = '';
    document.getElementById('prodNombre').value = '';
    document.getElementById('prodDescripcion').value = '';
    document.getElementById('prodPrecio').value = '';
    document.getElementById('prodStockMin').value = '10';
    document.getElementById('prodEstado').value = 'Activo';
  }
  modal.classList.add('active');
}

function guardarProducto() {
  const id = document.getElementById('prodId').value;
  const data = {
    id_categoria: parseInt(document.getElementById('prodCategoria').value),
    sku: document.getElementById('prodSku').value.trim(),
    nombre: document.getElementById('prodNombre').value.trim(),
    descripcion: document.getElementById('prodDescripcion').value.trim(),
    precio_unitario: parseFloat(document.getElementById('prodPrecio').value) || 0,
    stock_minimo: parseInt(document.getElementById('prodStockMin').value) || 0,
    estado: document.getElementById('prodEstado').value,
    url_imagen: null
  };

  if (!data.sku || !data.nombre) {
    alert('SKU y Nombre son obligatorios');
    return;
  }

  if (id) {
    // UPDATE
    const idx = DB.productos.findIndex(p => p.id_producto == id);
    if (idx >= 0) DB.productos[idx] = { ...DB.productos[idx], ...data };
  } else {
    // CREATE
    const nuevo = { id_producto: DB.nextId.producto++, ...data };
    DB.productos.push(nuevo);
    // Crear registro de inventario vacío
    DB.inventario.push({
      id_inventario: DB.nextId.inventario++,
      id_producto: nuevo.id_producto,
      cantidad_actual: 0,
      ubicacion: 'Sin asignar'
    });
  }

  cerrarModal('modalProducto');
  renderProductos();
  renderDashboard();
}

function eliminarProducto(id) {
  if (!confirm('¿Eliminar este producto? También se eliminará su registro de inventario.')) return;
  DB.productos = DB.productos.filter(p => p.id_producto !== id);
  DB.inventario = DB.inventario.filter(i => i.id_producto !== id);
  renderProductos();
  renderDashboard();
}

// ========== INVENTARIO ==========
function renderInventario() {
  const tbody = document.getElementById('tablaInventario');
  tbody.innerHTML = '';
  DB.inventario.forEach(inv => {
    const prod = getProducto(inv.id_producto);
    if (!prod) return;
    const bajo = inv.cantidad_actual < prod.stock_minimo;
    const critico = inv.cantidad_actual < prod.stock_minimo * 0.5;
    let badge = '<span class="badge badge-success">OK</span>';
    if (critico) badge = '<span class="badge badge-danger">Crítico</span>';
    else if (bajo) badge = '<span class="badge badge-warning">Bajo</span>';

    tbody.innerHTML += `
      <tr>
        <td><strong>${prod.nombre}</strong><br><small style="color:var(--gray)">${prod.sku}</small></td>
        <td>${inv.ubicacion}</td>
        <td><strong>${inv.cantidad_actual}</strong></td>
        <td>${prod.stock_minimo}</td>
        <td>${badge}</td>
        <td class="actions">
          <button class="btn-icon" title="Editar" onclick="abrirModalInventario(${inv.id_inventario})">✏️</button>
        </td>
      </tr>`;
  });
}

function abrirModalInventario(id) {
  const inv = DB.inventario.find(i => i.id_inventario === id);
  if (!inv) return;
  const prod = getProducto(inv.id_producto);
  document.getElementById('invId').value = id;
  document.getElementById('invProducto').value = prod ? prod.nombre : '—';
  document.getElementById('invCantidad').value = inv.cantidad_actual;
  document.getElementById('invUbicacion').value = inv.ubicacion;
  document.getElementById('modalInventario').classList.add('active');
}

function guardarInventario() {
  const id = parseInt(document.getElementById('invId').value);
  const idx = DB.inventario.findIndex(i => i.id_inventario === id);
  if (idx >= 0) {
    DB.inventario[idx].cantidad_actual = parseInt(document.getElementById('invCantidad').value) || 0;
    DB.inventario[idx].ubicacion = document.getElementById('invUbicacion').value.trim();
  }
  cerrarModal('modalInventario');
  renderInventario();
  renderDashboard();
}

function registrarEntradaSalida(tipo) {
  // Abre modal de movimiento rápido
  document.getElementById('movTipo').value = tipo;
  document.getElementById('movObservaciones').value = tipo === 'Entrada' ? 'Recepción de mercancía' : 'Salida de mercancía';
  document.getElementById('movProducto').innerHTML = DB.productos.map(p =>
    `<option value="${p.id_producto}">${p.nombre} (stock: ${getStock(p.id_producto)})</option>`
  ).join('');
  document.getElementById('movCantidad').value = 1;
  document.getElementById('modalMovimientoTitle').textContent = tipo === 'Entrada' ? 'Registrar Entrada' : 'Registrar Salida';
  document.getElementById('modalMovimiento').classList.add('active');
}

// ========== MOVIMIENTOS (CRUD) ==========
function renderMovimientos() {
  const tbody = document.getElementById('tablaMovimientos');
  tbody.innerHTML = '';
  // Ordenar por fecha desc
  const sorted = [...DB.movimientos].sort((a, b) => b.fecha_movimiento.localeCompare(a.fecha_movimiento));

  sorted.forEach(m => {
    const user = getUsuario(m.id_usuario);
    const detalles = DB.detalles_movimiento.filter(d => d.id_movimiento === m.id_movimiento);
    const prods = detalles.map(d => {
      const p = getProducto(d.id_producto);
      return p ? `${p.nombre} (${m.tipo_movimiento === 'Entrada' ? '+' : '-'}${d.cantidad})` : '—';
    }).join(', ');

    tbody.innerHTML += `
      <tr>
        <td>${formatFecha(m.fecha_movimiento)}</td>
        <td><span class="badge ${m.tipo_movimiento === 'Entrada' ? 'badge-success' : 'badge-danger'}">${m.tipo_movimiento}</span></td>
        <td>${prods || '—'}</td>
        <td>${detalles.reduce((s, d) => s + d.cantidad, 0)}</td>
        <td>${user ? user.nombre : '—'}</td>
        <td>${m.observaciones || '—'}</td>
        <td class="actions">
          <button class="btn-icon danger" title="Eliminar" onclick="eliminarMovimiento(${m.id_movimiento})">🗑️</button>
        </td>
      </tr>`;
  });
}

function guardarMovimiento() {
  const tipo = document.getElementById('movTipo').value;
  const id_producto = parseInt(document.getElementById('movProducto').value);
  const cantidad = parseInt(document.getElementById('movCantidad').value) || 0;
  const obs = document.getElementById('movObservaciones').value.trim();

  if (cantidad <= 0) {
    alert('La cantidad debe ser mayor a 0');
    return;
  }

  const prod = getProducto(id_producto);
  if (!prod) return;

  // Actualizar inventario
  const inv = DB.inventario.find(i => i.id_producto === id_producto);
  if (inv) {
    if (tipo === 'Salida' && inv.cantidad_actual < cantidad) {
      alert('Stock insuficiente. Disponible: ' + inv.cantidad_actual);
      return;
    }
    inv.cantidad_actual += (tipo === 'Entrada' ? cantidad : -cantidad);
  }

  // Crear movimiento
  const id_mov = DB.nextId.movimiento++;
  DB.movimientos.push({
    id_movimiento: id_mov,
    id_usuario: usuarioActual ? usuarioActual.id_usuario : 1,
    tipo_movimiento: tipo,
    fecha_movimiento: new Date().toISOString().slice(0, 10),
    observaciones: obs
  });

  DB.detalles_movimiento.push({
    id_detalle: DB.nextId.detalle_movimiento++,
    id_movimiento: id_mov,
    id_producto,
    cantidad,
    precio_unitario: prod.precio_unitario,
    subtotal: cantidad * prod.precio_unitario
  });

  cerrarModal('modalMovimiento');
  renderMovimientos();
  renderInventario();
  renderDashboard();
}

function eliminarMovimiento(id) {
  if (!confirm('¿Eliminar este movimiento? (No revierte el stock)')) return;
  DB.movimientos = DB.movimientos.filter(m => m.id_movimiento !== id);
  DB.detalles_movimiento = DB.detalles_movimiento.filter(d => d.id_movimiento !== id);
  renderMovimientos();
}

// ========== PEDIDOS (CRUD) ==========
function renderPedidos() {
  const tbody = document.getElementById('tablaPedidos');
  tbody.innerHTML = '';
  DB.pedidos.forEach(p => {
    const cliente = getCliente(p.id_cliente);
    const envio = DB.envios.find(e => e.id_pedido === p.id_pedido);
    let badgeClass = 'badge-info';
    if (p.estado === 'Pendiente') badgeClass = 'badge-warning';
    if (p.estado === 'Enviado' || p.estado === 'Entregado') badgeClass = 'badge-success';

    tbody.innerHTML += `
      <tr>
        <td><strong>#PED-${String(p.id_pedido).padStart(3, '0')}</strong></td>
        <td>${cliente ? cliente.nombre : '—'}</td>
        <td>${formatFecha(p.fecha_pedido)}</td>
        <td>${formatMoney(p.total)}</td>
        <td><span class="badge ${badgeClass}">${p.estado}</span></td>
        <td>${envio ? `<a href="${envio.rastreo_url}" target="_blank" class="btn btn-sm btn-secondary">Rastrear</a>` : '—'}</td>
        <td class="actions">
          <button class="btn-icon" title="Editar" onclick="abrirModalPedido(${p.id_pedido})">✏️</button>
          <button class="btn-icon danger" title="Eliminar" onclick="eliminarPedido(${p.id_pedido})">🗑️</button>
        </td>
      </tr>`;
  });
}

function abrirModalPedido(id = null) {
  const modal = document.getElementById('modalPedido');
  document.getElementById('pedId').value = id || '';

  // Clientes
  document.getElementById('pedCliente').innerHTML = DB.clientes.map(c =>
    `<option value="${c.id_cliente}">${c.nombre}</option>`
  ).join('');

  // Productos para detalle
  document.getElementById('pedProducto').innerHTML = DB.productos.map(p =>
    `<option value="${p.id_producto}">${p.nombre} - ${formatMoney(p.precio_unitario)}</option>`
  ).join('');

  if (id) {
    const p = DB.pedidos.find(x => x.id_pedido == id);
    document.getElementById('modalPedidoTitle').textContent = 'Editar Pedido';
    document.getElementById('pedCliente').value = p.id_cliente;
    document.getElementById('pedEstado').value = p.estado;
    document.getElementById('pedObservaciones').value = p.observaciones || '';
    // Cargar primer detalle
    const det = DB.detalles_pedido.find(d => d.id_pedido == id);
    if (det) {
      document.getElementById('pedProducto').value = det.id_producto;
      document.getElementById('pedCantidad').value = det.cantidad;
    }
  } else {
    document.getElementById('modalPedidoTitle').textContent = 'Nuevo Pedido';
    document.getElementById('pedEstado').value = 'Pendiente';
    document.getElementById('pedObservaciones').value = '';
    document.getElementById('pedCantidad').value = 1;
  }
  modal.classList.add('active');
}

function guardarPedido() {
  const id = document.getElementById('pedId').value;
  const id_cliente = parseInt(document.getElementById('pedCliente').value);
  const id_producto = parseInt(document.getElementById('pedProducto').value);
  const cantidad = parseInt(document.getElementById('pedCantidad').value) || 1;
  const estado = document.getElementById('pedEstado').value;
  const obs = document.getElementById('pedObservaciones').value.trim();
  const prod = getProducto(id_producto);
  if (!prod) return;

  const subtotal = cantidad * prod.precio_unitario;

  if (id) {
    // UPDATE
    const idx = DB.pedidos.findIndex(p => p.id_pedido == id);
    if (idx >= 0) {
      DB.pedidos[idx].id_cliente = id_cliente;
      DB.pedidos[idx].estado = estado;
      DB.pedidos[idx].observaciones = obs;
      DB.pedidos[idx].total = subtotal;
    }
    // Actualizar detalle
    const detIdx = DB.detalles_pedido.findIndex(d => d.id_pedido == id);
    if (detIdx >= 0) {
      DB.detalles_pedido[detIdx].id_producto = id_producto;
      DB.detalles_pedido[detIdx].cantidad = cantidad;
      DB.detalles_pedido[detIdx].precio_unitario = prod.precio_unitario;
      DB.detalles_pedido[detIdx].subtotal = subtotal;
    }
  } else {
    // CREATE
    const id_ped = DB.nextId.pedido++;
    DB.pedidos.push({
      id_pedido: id_ped,
      id_cliente,
      fecha_pedido: new Date().toISOString().slice(0, 10),
      estado,
      total: subtotal,
      observaciones: obs
    });
    DB.detalles_pedido.push({
      id_detalles_pedido: DB.nextId.detalle_pedido++,
      id_pedido: id_ped,
      id_producto,
      cantidad,
      precio_unitario: prod.precio_unitario,
      subtotal
    });
  }

  cerrarModal('modalPedido');
  renderPedidos();
  renderDashboard();
}

function eliminarPedido(id) {
  if (!confirm('¿Eliminar este pedido y sus detalles?')) return;
  DB.pedidos = DB.pedidos.filter(p => p.id_pedido !== id);
  DB.detalles_pedido = DB.detalles_pedido.filter(d => d.id_pedido !== id);
  DB.envios = DB.envios.filter(e => e.id_pedido !== id);
  renderPedidos();
  renderDashboard();
}

// ========== ASISTENTE IA ==========
function enviarMensaje() {
  const input = document.getElementById('chatInput');
  const texto = input.value.trim();
  if (!texto) return;

  const messages = document.getElementById('chatMessages');
  const userMsg = document.createElement('div');
  userMsg.className = 'message user';
  userMsg.textContent = texto;
  messages.appendChild(userMsg);
  input.value = '';

  setTimeout(() => {
    const botMsg = document.createElement('div');
    botMsg.className = 'message bot';
    botMsg.innerHTML = generarRespuestaIA(texto);
    messages.appendChild(botMsg);
    messages.scrollTop = messages.scrollHeight;
  }, 500);

  messages.scrollTop = messages.scrollHeight;
}

function enviarSugerencia(texto) {
  document.getElementById('chatInput').value = texto;
  enviarMensaje();
}

function generarRespuestaIA(texto) {
  const t = texto.toLowerCase();

  if (t.includes('stock bajo') || t.includes('bajo stock') || t.includes('productos con stock')) {
    let html = '<strong>Productos con stock bajo:</strong><br>';
    let hay = false;
    DB.inventario.forEach(inv => {
      const p = getProducto(inv.id_producto);
      if (p && inv.cantidad_actual < p.stock_minimo) {
        hay = true;
        html += `• ${p.nombre} → <strong>${inv.cantidad_actual}</strong> uds (mínimo ${p.stock_minimo}) ⚠️<br>`;
      }
    });
    return hay ? html : '¡Todos los productos tienen stock suficiente! 🎉';
  }

  if (t.includes('existencias') || t.includes('stock de') || t.includes('cuánto hay')) {
    for (const p of DB.productos) {
      if (t.includes(p.nombre.toLowerCase()) || t.includes(p.sku.toLowerCase())) {
        const stock = getStock(p.id_producto);
        const ubi = getUbicacion(p.id_producto);
        return `El producto <strong>${p.nombre}</strong> (${p.sku}) tiene actualmente <strong>${stock} unidades</strong> en <em>${ubi}</em>. Stock mínimo: ${p.stock_minimo}.`;
      }
    }
  }

  if (t.includes('recomend') || t.includes('reabastec')) {
    let html = '<strong>Recomendación de reabastecimiento:</strong><br>';
    DB.inventario.forEach(inv => {
      const p = getProducto(inv.id_producto);
      if (p && inv.cantidad_actual < p.stock_minimo) {
        const falta = p.stock_minimo - inv.cantidad_actual;
        const prio = inv.cantidad_actual < p.stock_minimo * 0.5 ? '🔴 Alta' : '🟡 Media';
        html += `${prio}: ${p.nombre} — faltan <strong>${falta}</strong> unidades<br>`;
      }
    });
    return html.includes('faltan') ? html : 'No se requiere reabastecimiento por ahora.';
  }

  if (t.includes('pedido') || t.includes('pedidos')) {
    const pend = DB.pedidos.filter(p => p.estado === 'Pendiente' || p.estado === 'En preparación');
    let html = `<strong>Pedidos activos (${pend.length}):</strong><br>`;
    pend.forEach(p => {
      const c = getCliente(p.id_cliente);
      html += `• #PED-${String(p.id_pedido).padStart(3, '0')} — ${c?.nombre || '—'} — ${p.estado} — ${formatMoney(p.total)}<br>`;
    });
    return html;
  }

  if (t.includes('movimiento') || t.includes('movimientos')) {
    let html = '<strong>Últimos movimientos:</strong><br>';
    [...DB.movimientos].slice(-3).reverse().forEach(m => {
      html += `• ${formatFecha(m.fecha_movimiento)} — ${m.tipo_movimiento} — ${m.observaciones}<br>`;
    });
    return html;
  }

  return 'Entendido. En un entorno real aquí aparecería la respuesta de la IA conectada a los microservicios y a la base de datos. Puedes preguntarme por stock bajo, existencias de un producto, recomendaciones de reabastecimiento, pedidos o movimientos.';
}

// ========== MODALES ==========
function cerrarModal(id) {
  document.getElementById(id).classList.remove('active');
}

// Cerrar modal al hacer clic fuera
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
});

// Enter en login
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('loginPass')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') login();
  });
});
