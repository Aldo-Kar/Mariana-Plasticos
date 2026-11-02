# Mariana Plásticos — Sistema de Inventario (SIPMNMP01)

Sistema de inventario web para **Mariana Plásticos S. de R.L.**, desarrollado como proyecto académico (UAEM — Ingeniería en Sistemas Inteligentes).

Permite gestionar productos, inventario, movimientos de entrada/salida, pedidos de clientes y consultas mediante un asistente con IA (simulado).

---

## Equipo

| Rol | Nombre |
|---|---|
| Líder de Proyecto | Luis Oswaldo Ortega |
| Backend | Alberto López |
| Frontend | Hilary Botello |
| Analista | Francisco Ortiz |
| Patrocinadora | Dra. Carmen Liliana Rodríguez Páez |

---

## Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | HTML5, CSS3, JavaScript (vanilla) |
| Backend | Java 17 + Spring Boot 4.1.x (Spring Web + Spring Data JPA) |
| Base de datos | MySQL 8 |
| Comunicación | APIs REST (JSON) |
| Control de versiones | Git + GitHub |
| IDE | VS Code / IntelliJ IDEA / Spring Tool Suite |

---

## Estructura del repositorio

```
Mariana-Plasticos/
├── Backend/
│   ├── mariana_plasticos.sql          # Script de BD (estructura + datos de prueba)
│   └── demo/demo/                     # Proyecto Spring Boot (Maven)
│       ├── pom.xml
│       ├── mvnw / mvnw.cmd
│       └── src/main/
│           ├── java/com/example/demo/
│           │   ├── MarianaPlasticosApplication.java
│           │   ├── config/            # CORS
│           │   ├── controller/        # Endpoints REST
│           │   ├── entity/            # Entidades JPA
│           │   ├── repository/        # Repositorios JPA
│           │   ├── service/           # Lógica de negocio
│           │   ├── dto/               # DTOs de request/response
│           │   └── exception/         # Manejo global de errores
│           └── resources/
│               └── application.properties
└── Frontend/
    ├── index.html                     # Login + aplicación completa
    ├── css/styles.css
    └── js/
        ├── api.js                     # Cliente REST hacia el backend
        ├── app.js                     # Lógica de la interfaz (CRUD, navegación, asistente)
        └── data.js                    # Datos de referencia / respaldo (no se usan si la API responde)
```

---

## Puesta en marcha

### 1. Base de datos
1. Instala MySQL 8.
2. Ejecuta el script `Backend/mariana_plasticos.sql` **una sola vez** (crea la BD `mariana_plasticos` con tablas y datos de prueba).  
   > No lo vuelvas a ejecutar cada vez que inicies la app: contiene instrucciones de creación/borrado.

### 2. Backend (Spring Boot)
```bash
cd Backend/demo/demo
./mvnw spring-boot:run        # Linux / macOS
mvnw.cmd spring-boot:run      # Windows
```
El backend arranca en `http://localhost:8080`.

Configura las credenciales de MySQL en `src/main/resources/application.properties`  
o con variables de entorno:

| Variable | Valor por defecto (desarrollo) |
|---|---|
| `DB_URL` | `jdbc:mysql://localhost:3306/mariana_plasticos?...` |
| `DB_USER` | `root` |
| `DB_PASSWORD` | `admin590` |

> No subas contraseñas reales al repositorio.

También puedes abrir `Backend/demo/demo` en IntelliJ IDEA como proyecto Maven y ejecutar `MarianaPlasticosApplication`.

### 3. Frontend
Sirve la carpeta `Frontend` con un servidor estático (no abras `index.html` como `file://`):

```bash
cd Frontend
python3 -m http.server 5500
# luego abre http://localhost:5500
```

O usa **Live Server** de VS Code.

---

## Usuarios de prueba

| Correo | Contraseña | Rol |
|---|---|---|
| Oswaldo.admin@gmail.com | Oswaldo1234 | Administrador |
| humberto.gerente@gmail.com | HumbertoG123 | Empleado / Gerente |
| Armando.ventasAlamacen@gmail.com | Armando234 | Ventas |

---

## Endpoints principales (API REST)

Base URL: `http://localhost:8080/api`

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/login` | Iniciar sesión |
| GET / POST / PUT / DELETE | `/productos` | CRUD productos |
| GET | `/categorias` | Listar categorías |
| GET / POST / PUT / DELETE | `/inventario` | CRUD inventario |
| GET / POST / DELETE | `/movimientos` | Historial y registro de movimientos |
| GET / POST / PUT / DELETE | `/pedidos` | CRUD pedidos |
| GET | `/clientes` | Listar clientes |
| GET | `/usuarios` | Listar usuarios |

---

## Qué está conectado en esta versión

- **Dashboard**: totales calculados desde productos, inventario, pedidos y movimientos.
- **Productos**: listar, crear, editar y eliminar (`/api/productos`).
- **Inventario**: listar, crear, editar cantidades/ubicación y eliminar (`/api/inventario`).
- **Movimientos**: listar, registrar entrada/salida y eliminar encabezado. Al registrar se actualiza también el inventario.
- **Pedidos**: listar, crear, editar estado/total/observaciones y eliminar encabezados.
- **Asistente IA**: respuestas demostrativas basadas en datos de la API (no es un modelo de IA real).

---

## Limitaciones conocidas

- Las tablas de detalle (`Detalles_Movimiento`, `Detalles_pedido`) existen en MySQL, pero la API actual no expone esos detalles. Los movimientos no muestran producto/cantidad por línea y los pedidos solo persisten el encabezado (producto/cantidad van a observaciones de forma demostrativa).
- Entrada/salida hace dos llamadas HTTP (movimiento + inventario), no una transacción atómica. Si una falla, hay inconsistencia temporal.
- El login compara contraseñas en texto plano y no hay autorización de rutas. Solo válido para desarrollo escolar local.
- Para usar desde otra máquina, cambia `localhost` por la IP del servidor en `js/api.js` y restringe CORS al origen real del frontend.

---

## Cronograma

| Fase | Fecha límite |
|---|---|
| Inicio | 31 ago 2026 |
| Análisis y Diseño | 30 sep 2026 |
| Construcción | 08 nov 2026 |
| Validación y Pruebas | 20 nov 2026 |
| Entrega final | 23 nov 2026 |

---

## Notas

- El asistente IA está **simulado en frontend**; se integrará por API en la fase final.
- Las contraseñas de la BD de prueba están en texto plano solo para desarrollo; en producción usar hash (BCrypt).
- No subir credenciales reales al repositorio — usar variables de entorno.
