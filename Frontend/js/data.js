/**
 * Datos simulados basados en las tablas reales de la base de datos
 * Mariana Plásticos - Sistema de Inventario
 */

const DB = {
  roles: [
    { id_rol: 1, nombre_rol: 'Administrador', descripcion: 'Acceso completo al sistema' },
    { id_rol: 2, nombre_rol: 'Gerente', descripcion: 'Registro de productos y movimientos' },
    { id_rol: 3, nombre_rol: 'Subgerente', descripcion: 'Gestión de clientes y pedidos' }
  ],

  usuarios: [
    { id_usuario: 1, id_rol: 1, nombre: 'Oswaldo Ortega', correo: 'Oswaldo.admin@gmail.com', contraseña: 'Oswaldo1234', estado: 'Activo' },
    { id_usuario: 2, id_rol: 2, nombre: 'Humberto Juarez', correo: 'humberto.gerente@gmail.com', contraseña: 'HumbertoG123', estado: 'Activo' },
    { id_usuario: 3, id_rol: 3, nombre: 'Armando Hernandez', correo: 'Armando.ventasAlmacen@gmail.com', contraseña: 'Armando234', estado: 'Activo' }
  ],

  categorias: [
    { id_categoria: 1, nombre: 'Envases', descripcion: 'Envases y recipientes de plástico' },
    { id_categoria: 2, nombre: 'Bolsas', descripcion: 'Bolsas de plástico de distintos tamaños' },
    { id_categoria: 3, nombre: 'Desechables', descripcion: 'Productos desechables de plástico' }
  ],

  productos: [
    { id_producto: 1, id_categoria: 1, sku: 'ENV-001', nombre: 'Botella PET 1 litro', descripcion: 'Botella transparente de PET de 1 litro', precio_unitario: 4.50, stock_minimo: 20, url_imagen: null, estado: 'Activo' },
    { id_producto: 2, id_categoria: 2, sku: 'BOL-001', nombre: 'Bolsa mediana', descripcion: 'Bolsa de plástico mediana', precio_unitario: 1.20, stock_minimo: 50, url_imagen: null, estado: 'Activo' },
    { id_producto: 3, id_categoria: 3, sku: 'DES-001', nombre: 'Vaso plástico 500 ml', descripcion: 'Vaso desechable de 500 ml', precio_unitario: 2.00, stock_minimo: 30, url_imagen: null, estado: 'Activo' },
    { id_producto: 4, id_categoria: 1, sku: 'ENV-002', nombre: 'Envase con tapa 750 ml', descripcion: 'Envase plástico con tapa', precio_unitario: 6.75, stock_minimo: 15, url_imagen: null, estado: 'Activo' }
  ],

  inventario: [
    { id_inventario: 1, id_producto: 1, cantidad_actual: 100, ubicacion: 'Almacén A - Estante 1' },
    { id_inventario: 2, id_producto: 2, cantidad_actual: 250, ubicacion: 'Almacén A - Estante 2' },
    { id_inventario: 3, id_producto: 3, cantidad_actual: 120, ubicacion: 'Almacén B - Estante 1' },
    { id_inventario: 4, id_producto: 4, cantidad_actual: 60, ubicacion: 'Almacén B - Estante 2' }
  ],

  movimientos: [
    { id_movimiento: 1, id_usuario: 2, tipo_movimiento: 'Entrada', fecha_movimiento: '2026-10-10', observaciones: 'Recepción de mercancía del proveedor' },
    { id_movimiento: 2, id_usuario: 2, tipo_movimiento: 'Salida', fecha_movimiento: '2026-10-11', observaciones: 'Salida por venta de productos' },
    { id_movimiento: 3, id_usuario: 1, tipo_movimiento: 'Entrada', fecha_movimiento: '2026-10-12', observaciones: 'Ajuste de inventario' }
  ],

  detalles_movimiento: [
    { id_detalle: 1, id_movimiento: 1, id_producto: 1, cantidad: 20, precio_unitario: 4.50, subtotal: 90.00 },
    { id_detalle: 2, id_movimiento: 1, id_producto: 3, cantidad: 10, precio_unitario: 2.00, subtotal: 20.00 },
    { id_detalle: 3, id_movimiento: 2, id_producto: 2, cantidad: 15, precio_unitario: 1.20, subtotal: 18.00 },
    { id_detalle: 4, id_movimiento: 3, id_producto: 4, cantidad: 5, precio_unitario: 6.75, subtotal: 33.75 }
  ],

  clientes: [
    { id_cliente: 1, nombre: 'Comercial La Central', correo: 'compras@central.ejemplo.com', telefono: '7221234567', direccion: 'Toluca, Estado de México' },
    { id_cliente: 2, nombre: 'Papelería El Sol', correo: 'pedidos@elsol.ejemplo.com', telefono: '7229876543', direccion: 'Metepec, Estado de México' },
    { id_cliente: 3, nombre: 'Distribuidora del Valle', correo: 'contacto@valle.ejemplo.com', telefono: '7295551234', direccion: 'Lerma, Estado de México' }
  ],

  pedidos: [
    { id_pedido: 1, id_cliente: 1, fecha_pedido: '2026-10-13', estado: 'En preparación', total: 114.00, observaciones: 'Pedido de prueba con dos productos' },
    { id_pedido: 2, id_cliente: 2, fecha_pedido: '2026-10-14', estado: 'Pendiente', total: 60.00, observaciones: 'Pedido pendiente de surtir' },
    { id_pedido: 3, id_cliente: 3, fecha_pedido: '2026-10-15', estado: 'Enviado', total: 67.50, observaciones: 'Pedido preparado para envío' }
  ],

  detalles_pedido: [
    { id_detalles_pedido: 1, id_pedido: 1, id_producto: 1, cantidad: 20, precio_unitario: 4.50, subtotal: 90.00 },
    { id_detalles_pedido: 2, id_pedido: 1, id_producto: 3, cantidad: 12, precio_unitario: 2.00, subtotal: 24.00 },
    { id_detalles_pedido: 3, id_pedido: 2, id_producto: 2, cantidad: 50, precio_unitario: 1.20, subtotal: 60.00 },
    { id_detalles_pedido: 4, id_pedido: 3, id_producto: 4, cantidad: 10, precio_unitario: 6.75, subtotal: 67.50 }
  ],

  envios: [
    { id_envio: 1, id_pedido: 1, numero_guia: 'MP-TEST-0001', estado_envio: 'En tránsito', fecha_entrega: null, rastreo_url: 'https://rastreo.ejemplo.com/MP-TEST-0001' },
    { id_envio: 2, id_pedido: 3, numero_guia: 'MP-TEST-0003', estado_envio: 'Entregado', fecha_entrega: '2026-10-15', rastreo_url: 'https://rastreo.ejemplo.com/MP-TEST-0003' }
  ],

  // Contadores para IDs autoincrementales
  nextId: {
    producto: 5,
    inventario: 5,
    movimiento: 4,
    detalle_movimiento: 5,
    pedido: 4,
    detalle_pedido: 5,
    cliente: 4,
    envio: 3
  }
};

// Helpers
function getCategoria(id) {
  return DB.categorias.find(c => c.id_categoria === id)?.nombre || '—';
}

function getProducto(id) {
  return DB.productos.find(p => p.id_producto === id);
}

function getUsuario(id) {
  return DB.usuarios.find(u => u.id_usuario === id);
}

function getCliente(id) {
  return DB.clientes.find(c => c.id_cliente === id);
}

function getRol(id) {
  return DB.roles.find(r => r.id_rol === id)?.nombre_rol || '—';
}

function getStock(id_producto) {
  return DB.inventario.find(i => i.id_producto === id_producto)?.cantidad_actual ?? 0;
}

function getUbicacion(id_producto) {
  return DB.inventario.find(i => i.id_producto === id_producto)?.ubicacion || '—';
}

function formatFecha(fecha) {
  if (!fecha) return '—';
  const d = new Date(fecha + 'T00:00:00');
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatMoney(n) {
  return '$' + Number(n).toFixed(2);
}
