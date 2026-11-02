-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS mariana_plasticos
DEFAULT CHARACTER SET utf8mb4
DEFAULT COLLATE utf8mb4_unicode_ci;
USE mariana_plasticos;

-- =============================================
-- TABLA: categorias
-- =============================================
CREATE TABLE IF NOT EXISTS categorias (
    id_categoria TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLA: roles
-- =============================================
CREATE TABLE IF NOT EXISTS roles (
    id_rol TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre_rol VARCHAR(30) NOT NULL UNIQUE,
    descripcion TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLA: usuarios
-- =============================================
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_rol TINYINT UNSIGNED NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    estado ENUM('Activo','Inactivo') DEFAULT 'Activo',
    FOREIGN KEY (id_rol) REFERENCES roles(id_rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLA: productos — CORREGIDA con marca y precio_mayoreo
-- =============================================
CREATE TABLE IF NOT EXISTS productos (
    id_producto INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_categoria TINYINT UNSIGNED NULL,
    sku VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    marca VARCHAR(50) NOT NULL DEFAULT 'Géminis',
    descripcion TEXT NULL,
    precio_unitario DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    precio_mayoreo DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    stock_minimo INT UNSIGNED NOT NULL DEFAULT 10,
    stock_actual INT UNSIGNED NOT NULL DEFAULT 0,
    estado ENUM('Activo','Inactivo') DEFAULT 'Activo',
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLA: estantes — NUEVA para punto 2
-- =============================================
CREATE TABLE IF NOT EXISTS estantes (
    id_estante SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE COMMENT 'Ej: A-1, B-3, Pasillo 2 Estante 5',
    descripcion VARCHAR(100) NULL,
    ubicacion_general VARCHAR(100) NOT NULL DEFAULT 'Almacén General'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLA: inventario — MODIFICADA con estante
-- =============================================
CREATE TABLE IF NOT EXISTS inventario (
    id_inventario INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_producto INT UNSIGNED NOT NULL,
    cantidad_actual INT UNSIGNED NOT NULL DEFAULT 0,
    id_estante SMALLINT UNSIGNED NULL,
    ubicacion_texto VARCHAR(100) NULL COMMENT 'Ubicación libre si no usa estante',
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE CASCADE,
    FOREIGN KEY (id_estante) REFERENCES estantes(id_estante)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLA: clientes
-- =============================================
CREATE TABLE IF NOT EXISTS clientes (
    id_cliente INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    negocio VARCHAR(100) NULL,
    correo VARCHAR(100) NULL,
    telefono VARCHAR(20) NULL,
    direccion TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLA: pedidos
-- =============================================
CREATE TABLE IF NOT EXISTS pedidos (
    id_pedido INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT UNSIGNED NOT NULL,
    fecha_pedido DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('Pendiente','Confirmado','Enviado','Completado','Cancelado') DEFAULT 'Pendiente',
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    observaciones TEXT NULL,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLA: detalles_pedido
-- =============================================
CREATE TABLE IF NOT EXISTS detalles_pedido (
    id_detalle_pedido INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT UNSIGNED NOT NULL,
    id_producto INT UNSIGNED NOT NULL,
    cantidad SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    subtotal DECIMAL(10,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLA: movimientos
-- =============================================
CREATE TABLE IF NOT EXISTS movimientos (
    id_movimiento INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    tipo_movimiento ENUM('Entrada','Salida','Ajuste','Venta') NOT NULL,
    fecha_movimiento DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    observaciones TEXT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLA: detalles_movimiento
-- =============================================
CREATE TABLE IF NOT EXISTS detalles_movimiento (
    id_detalle_mov INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_movimiento INT UNSIGNED NOT NULL,
    id_producto INT UNSIGNED NOT NULL,
    cantidad SMALLINT NOT NULL COMMENT 'Positivo=entrada, Negativo=salida',
    precio_unitario DECIMAL(8,2) NULL,
    FOREIGN KEY (id_movimiento) REFERENCES movimientos(id_movimiento) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLA: envios
-- =============================================
CREATE TABLE IF NOT EXISTS envios (
    id_envio INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT UNSIGNED NOT NULL,
    numero_guia VARCHAR(50) NULL,
    estado_envio VARCHAR(50) DEFAULT 'Pendiente',
    fecha_entrega DATE NULL,
    rastreo_url VARCHAR(255) NULL,
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLA: servicio_externo
-- =============================================
CREATE TABLE IF NOT EXISTS servicio_externo (
    id_servicio TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre_servicio VARCHAR(100) NOT NULL,
    descripcion TEXT NULL,
    url_api VARCHAR(255) NULL,
    estado ENUM('Activo','Inactivo') DEFAULT 'Activo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLA: asistente_ia
-- =============================================
CREATE TABLE IF NOT EXISTS asistente_ia (
    id_asistente TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_servicio TINYINT UNSIGNED NULL,
    descripcion TEXT NULL,
    modelo_ia VARCHAR(100) NULL,
    activo BOOLEAN DEFAULT TRUE,
    endpoint_api VARCHAR(255) NULL,
    FOREIGN KEY (id_servicio) REFERENCES servicio_externo(id_servicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categorías
INSERT INTO categorias (id_categoria, nombre, descripcion) VALUES
(1, 'Envases', 'Envases y recipientes de plástico'),
(2, 'Bolsas', 'Bolsas de plástico de distintos tamaños'),
(3, 'Desechables', 'Productos desechables de plástico'),
(4, 'Accesorios', 'Accesorios y complementos para productos desechables');

-- Roles
INSERT INTO roles (id_rol, nombre_rol, descripcion) VALUES
(1, 'Administrador', 'Acceso completo al sistema'),
(2, 'Gerente', 'Registro de productos y movimientos'),
(3, 'Subgerente', 'Gestión de clientes y pedidos');

-- Usuarios
INSERT INTO usuarios (id_usuario, id_rol, nombre, correo, contrasena, estado) VALUES
(1, 1, 'Oswaldo Ortega', 'oswaldo.admin@gmail.com', 'Oswaldo1234', 'Activo'),
(2, 2, 'Humberto Juárez', 'humberto.gerente@gmail.com', 'HumbertoG123', 'Activo'),
(3, 3, 'Armando Hernández', 'armando.ventasAlmacen@gmail.com', 'Armando234', 'Activo');

-- Estantes (ejemplos para punto 2)
INSERT INTO estantes (codigo, descripcion, ubicacion_general) VALUES
('A-1', 'Pasillo A, Estante 1 — Botellas', 'Almacén General'),
('A-2', 'Pasillo A, Estante 2 — Envases', 'Almacén General'),
('B-1', 'Pasillo B, Estante 1 — Bolsas', 'Almacén General'),
('B-2', 'Pasillo B, Estante 2 — Desechables', 'Almacén General'),
('C-1', 'Pasillo C, Estante 1 — Accesorios', 'Almacén General');

-- Clientes
INSERT INTO clientes (id_cliente, nombre, negocio, correo, telefono, direccion) VALUES
(1, 'Carmelo López Ortiz', 'Comercial La Central', 'carmelo.lopez.ortiz@gmail.com', '7221234567', 'Toluca, Estado de México'),
(2, 'Paola de Jesús Méndez', 'Papelería El Sol', 'paola.dejesus.mendez@gmail.com', '7229876543', 'Metepec, Estado de México'),
(3, 'Doricela del Valle Morales', 'Distribuidora del Valle', 'doricela.delvalle.morales@gmail.com', '7295551234', 'Lerma, Estado de México');

-- Servicios externos
INSERT INTO servicio_externo (id_servicio, nombre_servicio, descripcion, url_api, estado) VALUES
(1, 'Servicio de rastreo', 'Servicio ficticio para seguimiento de envíos', 'https://api.ejemplo.com/rastreo', 'Activo'),
(2, 'Servicio de notificaciones', 'Servicio ficticio para notificaciones del sistema', 'https://api.ejemplo.com/notificaciones', 'Activo');

-- Asistente IA
INSERT INTO asistente_ia (id_servicio, descripcion, modelo_ia, activo, endpoint_api) VALUES
(1, 'Asistente de preguntas frecuentes', 'modelo-demo', true, 'https://api.ejemplo.com/ia/asistente'),
(1, 'Asistente de estado de envíos', 'modelo-demo', false, 'https://api.ejemplo.com/ia/envios');

INSERT INTO productos (id_producto, id_categoria, sku, nombre, marca, descripcion, precio_unitario, precio_mayoreo, stock_minimo, stock_actual, estado) VALUES
-- ENVASES
(17, 1, 'GEM-ENV-001', 'Botella PET 500 ml transparente', 'Geminis', 'Grado alimenticio, tapa incluida', 2.80, 2.52, 10, 100, 'Activo'),
(18, 1, 'GEM-ENV-002', 'Botella PET 1 litro transparente', 'Geminis', 'Cuello estándar, ideal jugos y agua', 4.20, 3.78, 10, 50, 'Activo'),
(19, 1, 'GEM-ENV-003', 'Botella PET 1.5 litros', 'Geminis', 'Alta resistencia', 5.50, 4.95, 10, 40, 'Activo'),
(20, 1, 'GEM-ENV-004', 'Botella PET 2 litros', 'Geminis', 'Formato familiar', 6.80, 6.12, 10, 30, 'Activo'),
(21, 1, 'GEM-ENV-005', 'Botella PET 3 litros', 'Geminis', 'Retornable / mayor calibre', 9.50, 8.55, 10, 20, 'Activo'),
(22, 1, 'GEM-ENV-006', 'Botella PET 350 ml (mini)', 'Geminis', 'Porción individual', 2.20, 1.98, 10, 120, 'Activo'),
(23, 1, 'GEM-ENV-007', 'Envase con tapa 250 ml (deli)', 'Geminis', 'Redondo PP, microondas', 2.40, 2.16, 10, 120, 'Activo'),
(24, 1, 'GEM-ENV-008', 'Envase con tapa 500 ml (deli)', 'Geminis', 'Redondo PP, hermético', 3.60, 3.24, 10, 100, 'Activo'),
(25, 1, 'GEM-ENV-009', 'Envase con tapa 750 ml', 'Geminis', 'Rectangular, tapa segura', 5.20, 4.68, 10, 50, 'Activo'),
(26, 1, 'GEM-ENV-010', 'Envase con tapa 1 litro', 'Geminis', 'Ideal ensaladas y guisados', 6.50, 5.85, 10, 40, 'Activo'),
(27, 1, 'GEM-ENV-011', 'Envase almeja PET 500 ml', 'Geminis', 'Bisagra, transparente', 3.40, 3.06, 10, 10, 'Activo'),
(28, 1, 'GEM-ENV-012', 'Envase almeja PET 750 ml', 'Geminis', 'Para comida para llevar', 4.80, 4.32, 10, 100, 'Activo'),
(29, 1, 'GEM-ENV-013', 'Tarro PET 250 ml con tapa', 'Geminis', 'Rosca, salsas y cremas', 2.90, 2.61, 10, 100, 'Activo'),
(30, 1, 'GEM-ENV-014', 'Tarro PET 500 ml con tapa', 'Geminis', 'Uso alimenticio / cosmético', 4.30, 3.87, 10, 60, 'Activo'),
(31, 1, 'GEM-ENV-015', 'Garrafón PET 5 litros', 'Geminis', 'Con asa, grado alimenticio', 16.50, 14.85, 10, 1, 'Activo'),
(32, 1, 'GEM-ENV-016', 'Garrafón PET 20 litros', 'Geminis', 'Retornable estándar', 42.00, 37.80, 10, 0, 'Activo'),
(33, 1, 'GEM-ENV-017', 'Envase rectangular 250 ml', 'Geminis', 'Porciones individuales', 2.50, 2.25, 10, 200, 'Activo'),
(34, 1, 'GEM-ENV-018', 'Envase cuadrado 1 litro con tapa', 'Geminis', 'Apilable', 6.20, 5.58, 10, 40, 'Activo'),
(35, 1, 'GEM-ENV-019', 'Frasco PET 100 ml con tapa', 'Geminis', 'Muestras y porciones', 1.70, 1.53, 10, 200, 'Activo'),
(36, 1, 'GEM-ENV-020', 'Envase redondo 2 litros con tapa', 'Geminis', 'Gran capacidad', 9.80, 8.82, 10, 24, 'Activo'),
(37, 1, 'GEM-ENV-021', 'Botella PET 4 litros', 'Geminis', 'Botellón', 11.50, 10.35, 10, 16, 'Activo'),
(38, 1, 'GEM-ENV-022', 'Envase con tapa 350 ml (deli)', 'Geminis', 'Tamaño intermedio', 3.10, 2.79, 10, 90, 'Activo'),

-- BOLSAS
(39, 2, 'GEM-BOL-001', 'Bolsa camiseta chica 30x40 cm', 'Geminis', 'Alta densidad, natural', 0.32, 0.29, 10, 100, 'Activo'),
(40, 2, 'GEM-BOL-002', 'Bolsa camiseta mediana 40x50 cm', 'Geminis', 'Alta densidad, natural', 0.48, 0.43, 10, 100, 'Activo'),
(41, 2, 'GEM-BOL-003', 'Bolsa camiseta grande 50x60 cm', 'Geminis', 'Alta densidad, natural', 0.75, 0.68, 10, 100, 'Activo'),
(42, 2, 'GEM-BOL-004', 'Bolsa camiseta reforzada mediana', 'Geminis', 'Mayor calibre', 0.65, 0.59, 10, 100, 'Activo'),
(43, 2, 'GEM-BOL-005', 'Bolsa camiseta negra mediana', 'Geminis', 'Color negro', 0.52, 0.47, 10, 100, 'Activo'),
(44, 2, 'GEM-BOL-006', 'Bolsa de basura 50x70 cm (paq. 20)', 'Geminis', 'Negra, calibre medio', 14.50, 13.05, 10, 20, 'Activo'),
(45, 2, 'GEM-BOL-007', 'Bolsa de basura 60x90 cm (paq. 10)', 'Geminis', 'Negra, uso general', 12.80, 11.52, 10, 10, 'Activo'),
(46, 2, 'GEM-BOL-008', 'Bolsa de basura 90x120 cm (paq. 10)', 'Geminis', 'Industrial, calibre alto', 21.50, 19.35, 10, 10, 'Activo'),
(47, 2, 'GEM-BOL-009', 'Bolsa ziploc chica (caja 100)', 'Geminis', 'Cierre hermético', 19.50, 17.55, 10, 100, 'Activo'),
(48, 2, 'GEM-BOL-010', 'Bolsa ziploc mediana (caja 100)', 'Geminis', 'Cierre hermético', 28.00, 25.20, 10, 100, 'Activo'),
(49, 2, 'GEM-BOL-011', 'Bolsa ziploc grande (caja 100)', 'EcoDesechables', 'Cierre hermético', 38.00, 34.20, 10, 100, 'Activo');