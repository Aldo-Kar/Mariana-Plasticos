# Mariana Plásticos – Sistema de Inventario

Aplicación frontend modular separada por pantallas, con datos reales de la base de datos y operaciones CRUD.

## Estructura de archivos

```
mariana-inventario/
├── index.html          ← HTML principal (Login + App + todas las pantallas + modales)
├── css/
│   └── styles.css      ← Todos los estilos
├── js/
│   ├── data.js         ← Datos de la BD (Roles, Usuarios, Productos, Inventario, etc.)
│   └── app.js          ← Lógica: Auth, Navegación, CRUD, Asistente IA
└── README.md
```

## Pantallas

| Pantalla      | Descripción                                      | CRUD                          |
|---------------|--------------------------------------------------|-------------------------------|
| **Login**     | Autenticación con usuarios reales de la BD       | —                             |
| **Dashboard** | Resumen: productos, stock bajo, pedidos, movimientos | Solo lectura                |
| **Productos** | Catálogo de productos                            | Crear / Editar / Eliminar     |
| **Inventario**| Stock por ubicación                              | Editar cantidad y ubicación + Entradas/Salidas |
| **Movimientos**| Historial de entradas y salidas                | Crear / Eliminar              |
| **Pedidos**   | Pedidos de clientes + rastreo de envíos          | Crear / Editar / Eliminar     |
| **Asistente IA** | Chat con consultas sobre stock, pedidos, etc. | — (simulado)               |

## Usuarios de prueba (tabla Usuarios)

| Correo                              | Contraseña     | Rol          |
|-------------------------------------|----------------|--------------|
| Oswaldo.admin@gmail.com             | Oswaldo1234    | Administrador|
| humberto.gerente@gmail.com          | HumbertoG123   | Gerente      |
| Armando.ventasAlmacen@gmail.com     | Armando234     | Subgerente   |

## Cómo usar

1. Abre `index.html` en un navegador (o sirve la carpeta con cualquier servidor estático).
2. Inicia sesión con cualquiera de los usuarios de prueba.
3. Navega entre las pantallas con el menú lateral.
4. Usa los botones **+ Nuevo**, **✏️ Editar** y **🗑️ Eliminar** para operaciones CRUD.
5. El botón **Cerrar sesión** (abajo en el sidebar) regresa al login.

## Datos basados en las tablas

- Roles, Usuarios, Categorías
- Productos (ENV-001, BOL-001, DES-001, ENV-002…)
- Inventario con ubicaciones reales
- Movimientos + Detalles_Movimiento
- Clientes, Pedidos, Detalles_pedido, Envíos
- Asistente_IA (simulado en frontend)

Los cambios (CRUD) se mantienen en memoria durante la sesión del navegador.
