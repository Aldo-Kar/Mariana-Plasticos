-- ==================================================
-- COPIA COMPLETA: mariana_plasticos
-- ESTRUCTURA + TODOS LOS REGISTROS
-- ==================================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS mariana_plasticos;
USE mariana_plasticos;
DROP DATABASE IF EXISTS mariana_plasticos;
CREATE DATABASE mariana_plasticos;
USE mariana_plasticos;
-- ==================================================
-- CREAR TABLAS
-- ==================================================

-- 1. Roles
CREATE TABLE IF NOT EXISTS Roles (
  id_rol INT AUTO_INCREMENT PRIMARY KEY,
  nombre_rol VARCHAR(50) NOT NULL,
  descripcion VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Usuarios
CREATE TABLE IF NOT EXISTS Usuarios (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  id_rol INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(100),
  contrasena VARCHAR(255),
  estado VARCHAR(20),
  FOREIGN KEY (id_rol) REFERENCES Roles(id_rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Categoría
CREATE TABLE IF NOT EXISTS Categoria (
  id_categoria INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Productos (con los 2 campos nuevos)
CREATE TABLE IF NOT EXISTS Productos (
  id_producto INT AUTO_INCREMENT PRIMARY KEY,
  id_categoria INT NOT NULL,
  sku VARCHAR(50),
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  precio_unitario DECIMAL(10,2),
  stock_minimo INT,
  url_imagen VARCHAR(500),
  estado VARCHAR(20),
  FOREIGN KEY (id_categoria) REFERENCES Categoria(id_categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Inventario
CREATE TABLE IF NOT EXISTS Inventario (
  id_inventario INT AUTO_INCREMENT PRIMARY KEY,
  id_producto INT NOT NULL,
  cantidad_actual INT,
  ubicacion VARCHAR(255),
  FOREIGN KEY (id_producto) REFERENCES Productos(id_producto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Movimientos
CREATE TABLE IF NOT EXISTS movimientos (
  id_movimiento INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  tipo_movimiento VARCHAR(50),
  fecha_movimiento DATETIME,
  observaciones TEXT,
  FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Detalles_Movimiento
CREATE TABLE IF NOT EXISTS Detalles_Movimiento (
  id_detalle INT AUTO_INCREMENT PRIMARY KEY,
  id_movimiento INT NOT NULL,
  id_producto INT NOT NULL,
  cantidad INT,
  precio_unitario DECIMAL(10,2),
  subtotal DECIMAL(10,2),
  FOREIGN KEY (id_movimiento) REFERENCES movimientos(id_movimiento),
  FOREIGN KEY (id_producto) REFERENCES Productos(id_producto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Cliente
CREATE TABLE IF NOT EXISTS Cliente (
  id_cliente INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(100),
  telefono VARCHAR(20),
  direccion VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Pedidos
CREATE TABLE IF NOT EXISTS Pedidos (
  id_pedido INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente INT NOT NULL,
  fecha_pedido DATETIME,
  estado VARCHAR(50),
  total DECIMAL(10,2),
  observaciones TEXT,
  FOREIGN KEY (id_cliente) REFERENCES Cliente(id_cliente)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Detalles_pedido
CREATE TABLE IF NOT EXISTS Detalles_pedido (
  id_detalles_pedido INT AUTO_INCREMENT PRIMARY KEY,
  id_pedido INT NOT NULL,
  id_producto INT NOT NULL,
  cantidad INT,
  precio_unitario DECIMAL(10,2),
  subtotal DECIMAL(10,2),
  FOREIGN KEY (id_pedido) REFERENCES Pedidos(id_pedido),
  FOREIGN KEY (id_producto) REFERENCES Productos(id_producto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. Envíos
CREATE TABLE IF NOT EXISTS Envios (
  id_envio INT AUTO_INCREMENT PRIMARY KEY,
  id_pedido INT NOT NULL,
  numero_guia VARCHAR(100),
  estado_envio VARCHAR(50),
  fecha_entrega DATE,
  rastreo_url VARCHAR(500),
  FOREIGN KEY (id_pedido) REFERENCES Pedidos(id_pedido)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. Servicio_Externo
CREATE TABLE IF NOT EXISTS Servicio_Externo (
  id_servicio INT AUTO_INCREMENT PRIMARY KEY,
  nombre_servicio VARCHAR(100),
  descripcion TEXT,
  url_api VARCHAR(500),
  estado VARCHAR(20)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. asistente_IA
CREATE TABLE IF NOT EXISTS asistente_IA (
  id_asistente INT AUTO_INCREMENT PRIMARY KEY,
  id_servicio INT NOT NULL,
  descripcion TEXT,
  modelo_ia VARCHAR(100),
  activo BOOLEAN,
  endpoint_api VARCHAR(500),
  FOREIGN KEY (id_servicio) REFERENCES Servicio_Externo(id_servicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==================================================
-- INSERTAR TODOS LOS DATOS
-- ==================================================

START TRANSACTION;

-- 1. Roles
INSERT INTO Roles (id_rol, nombre_rol, descripcion) VALUES
(1, 'Administrador', 'Acceso completo al sistema'),
(2, 'Empleado', 'Registro de productos y movimientos'),
(3, 'Ventas', 'Gestión de clientes y pedidos');

-- 2. Usuarios (corregido)
INSERT INTO Usuarios (id_usuario, id_rol, nombre, correo, contrasena, estado) VALUES
(1, 1, 'Oswaldo Ortega', 'Oswaldo.admin@gmail.com', 'Oswaldo1234', 'Activo'),
(2, 2, 'Humberto Juarez', 'humberto.gerente@gmail.com', 'HumbertoG123', 'Activo'),
(3, 3, 'Armando Hernandez', 'Armando.ventasAlamacen@gmail.com', 'Armando234', 'Activo');

-- 3. Categorías
INSERT INTO Categoria (id_categoria, nombre, descripcion) VALUES
(1, 'Envases', 'Envases y recipientes de plástico'),
(2, 'Bolsas', 'Bolsas de plástico de distintos tamaños'),
(3, 'Desechables', 'Productos desechables de plástico');

-- 4. Productos
INSERT INTO Productos
(id_producto, id_categoria, sku, nombre, descripcion, precio_unitario, stock_minimo, url_imagen, estado)
VALUES
(1, 1, 'ENV-001', 'Botella PET 1 litro', 'Botella transparente de PET de 1 litro', 4.50, 20, NULL, 'Activo'),
(2, 2, 'BOL-001', 'Bolsa mediana', 'Bolsa de plástico mediana', 1.20, 50, NULL, 'Activo'),
(3, 3, 'DES-001', 'Vaso plástico 500 ml', 'Vaso desechable de 500 ml', 2.00, 30, NULL, 'Activo'),
(4, 1, 'ENV-002', 'Envase con tapa 750 ml', 'Envase plástico con tapa', 6.75, 15, NULL, 'Activo');

-- 5. Inventario
INSERT INTO Inventario (id_inventario, id_producto, cantidad_actual, ubicacion) VALUES
(1, 1, 100, 'Almacén A - Estante 1'),
(2, 2, 250, 'Almacén A - Estante 2'),
(3, 3, 120, 'Almacén B - Estante 1'),
(4, 4, 60, 'Almacén B - Estante 2');

-- 6. Movimientos
INSERT INTO movimientos
(id_movimiento, id_usuario, tipo_movimiento, fecha_movimiento, observaciones)
VALUES
(1, 2, 'Entrada', '2026-10-10 09:00:00', 'Recepción de mercancía del proveedor'),
(2, 2, 'Salida', '2026-10-11 11:30:00', 'Salida por venta de productos'),
(3, 1, 'Entrada', '2026-10-12 14:15:00', 'Ajuste de inventario');

-- 7. Detalles de movimiento
INSERT INTO Detalles_Movimiento
(id_detalle, id_movimiento, id_producto, cantidad, precio_unitario, subtotal)
VALUES
(1, 1, 1, 20, 4.50, 90.00),
(2, 1, 3, 10, 2.00, 20.00),
(3, 2, 2, 15, 1.20, 18.00),
(4, 3, 4, 5, 6.75, 33.75);

-- 8. Clientes
INSERT INTO Cliente (id_cliente, nombre, correo, telefono, direccion) VALUES
(1, 'Comercial La Central', 'compras@central.ejemplo.com', '7221234567', 'Toluca, Estado de México'),
(2, 'Papelería El Sol', 'pedidos@elsol.ejemplo.com', '7229876543', 'Metepec, Estado de México'),
(3, 'Distribuidora del Valle', 'contacto@valle.ejemplo.com', '7295551234', 'Lerma, Estado de México');

-- 9. Pedidos
INSERT INTO Pedidos
(id_pedido, id_cliente, fecha_pedido, estado, total, observaciones)
VALUES
(1, 1, '2026-10-13 10:00:00', 'En preparación', 114.00, 'Pedido de prueba con dos productos'),
(2, 2, '2026-10-14 12:30:00', 'Pendiente', 60.00, 'Pedido pendiente de surtir'),
(3, 3, '2026-10-15 09:45:00', 'Enviado', 67.50, 'Pedido preparado para envío');

-- 10. Detalles de pedido
INSERT INTO Detalles_pedido
(id_detalles_pedido, id_pedido, id_producto, cantidad, precio_unitario, subtotal)
VALUES
(1, 1, 1, 20, 4.50, 90.00),
(2, 1, 3, 12, 2.00, 24.00),
(3, 2, 2, 50, 1.20, 60.00),
(4, 3, 4, 10, 6.75, 67.50);

-- 11. Envíos
INSERT INTO Envios
(id_envio, id_pedido, numero_guia, estado_envio, fecha_entrega, rastreo_url)
VALUES
(1, 1, 'MP-TEST-0001', 'En tránsito', NULL, 'https://rastreo.ejemplo.com/MP-TEST-0001'),
(2, 3, 'MP-TEST-0003', 'Entregado', '2026-10-16', 'https://rastreo.ejemplo.com/MP-TEST-0003');

-- 12. Servicios externos
INSERT INTO Servicio_Externo
(id_servicio, nombre_servicio, descripcion, url_api, estado)
VALUES
(1, 'Servicio de rastreo', 'Servicio ficticio para probar el seguimiento de envíos', 'https://api.ejemplo.com/rastreo', 'Activo'),
(2, 'Servicio de notificaciones', 'Servicio ficticio para notificaciones del sistema', 'https://api.ejemplo.com/notificaciones', 'Activo');

-- 13. Asistente IA
INSERT INTO asistente_IA
(id_asistente, id_servicio, descripcion, modelo_ia, activo, endpoint_api)
VALUES
(1, 2, 'Asistente de prueba para responder preguntas frecuentes', 'modelo-demo', TRUE, 'https://api.ejemplo.com/ia/asistente'),
(2, 1, 'Asistente de prueba para consultar el estado de envíos', 'modelo-demo', FALSE, 'https://api.ejemplo.com/ia/envios');

COMMIT;

-- ==================================================
-- VERIFICAR QUE TODO ESTÁ CARGADO
-- ==================================================
SELECT 'Roles' AS tabla, COUNT(*) AS registros FROM Roles
UNION ALL SELECT 'Usuarios', COUNT(*) FROM Usuarios
UNION ALL SELECT 'Categoria', COUNT(*) FROM Categoria
UNION ALL SELECT 'Productos', COUNT(*) FROM Productos
UNION ALL SELECT 'Inventario', COUNT(*) FROM Inventario
UNION ALL SELECT 'movimientos', COUNT(*) FROM movimientos
UNION ALL SELECT 'Detalles_Movimiento', COUNT(*) FROM Detalles_Movimiento
UNION ALL SELECT 'Cliente', COUNT(*) FROM Cliente
UNION ALL SELECT 'Pedidos', COUNT(*) FROM Pedidos
UNION ALL SELECT 'Detalles_pedido', COUNT(*) FROM Detalles_pedido
UNION ALL SELECT 'Envios', COUNT(*) FROM Envios
UNION ALL SELECT 'Servicio_Externo', COUNT(*) FROM Servicio_Externo
UNION ALL SELECT 'asistente_IA', COUNT(*) FROM asistente_IA;