# Conectar el index.html con MySQL

El `index.html` usa `js/app.js`, que consulta la API REST de Spring Boot en `http://localhost:8080/api`. La interfaz no usa el contenido de `js/data.js` como reemplazo silencioso cuando falla la API: si el backend no responde, se debe revisar la conexión.

## Ejecutar

1. En MySQL Workbench, asegúrate de que ya existe `mariana_plasticos` y que contiene tus datos. No ejecutes el script SQL completo solo para iniciar la aplicación: contiene instrucciones de creación y borrado de la base de datos.
2. Abre `Backend/demo/demo` en IntelliJ IDEA como proyecto Maven.
3. Configura las variables de entorno `DB_URL`, `DB_USER` y `DB_PASSWORD` según tu instalación. Los valores de `application.properties` son valores predeterminados de desarrollo; no publiques contraseñas reales.
4. Ejecuta `MarianaPlasticosApplication` y verifica que Spring Boot inicie en el puerto 8080.
5. Sirve la carpeta `Frontend` con un servidor web local (por ejemplo, Live Server de VS Code) y abre `index.html` a través de ese servidor. Evita abrirlo como `file://`.
6. Inicia sesión con un usuario existente de la tabla `Usuarios`.

## Qué está conectado en esta versión

- Dashboard: totales calculados desde productos, inventario, pedidos y movimientos.
- Productos: listar, crear, editar y eliminar usando `/api/productos`.
- Inventario: listar, crear registro, editar cantidades/ubicación y eliminar usando `/api/inventario`.
- Movimientos: listar, registrar entrada/salida y eliminar el encabezado. Al registrar entrada/salida se actualiza también la cantidad de inventario.
- Pedidos: listar, crear, editar estado/total/observaciones y eliminar encabezados.
- Asistente: respuestas demostrativas basadas en datos consultados desde la API; no es una integración real con un modelo de IA.

## Limitaciones conocidas que requieren trabajo de backend

- `movimientos` y `pedidos` tienen tablas de detalle en MySQL (`Detalles_Movimiento` y `Detalles_pedido`), pero la API actual no expone esos detalles. Por eso la tabla de movimientos no puede mostrar producto/cantidad por separado, y los pedidos solo persisten su encabezado; el producto/cantidad del formulario se deja en observaciones y el total se calcula como demostración.
- La entrada/salida actual hace dos solicitudes HTTP (guardar movimiento y actualizar inventario), no una transacción atómica. Si una de las dos falla, hay que revisar los datos y corregirlo implementando un servicio transaccional en Spring Boot.
- El login actual compara contraseñas almacenadas en texto plano y no implementa autorización de rutas. Es adecuado solo para desarrollo escolar local, no para producción.
- Para abrir la aplicación desde otra computadora, `localhost` debe cambiarse por la dirección IP o nombre del servidor donde corre Spring Boot, y CORS debe restringirse al origen real del frontend.
