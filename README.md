# Mariana Plásticos — Sistema de Inventario (SIPMNMP01)

Sistema de inventario web para **Mariana Plásticos S. de R.L.**, desarrollado como proyecto académico (UAEM — Ingeniería en Sistemas Inteligentes).

Permite gestionar productos, inventario, movimientos de entrada/salida, pedidos de clientes, envíos y consultas mediante un asistente con IA.

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
| IDE | VS Code / Spring Tool Suite |

---

## Estructura del repositorio

```
Mariana-Plasticos/
├── Backend/
│   ├── mariana_plasticos.sql        # Script de BD (estructura + datos de prueba)
│   └── demo/                        # Proyecto Spring Boot (Maven)
│       ├── pom.xml
│       └── src/main/
│           ├── java/com/example/demo/
│           │   ├── MarianaPlasticosApplication.java
│           │   ├── config/          # CORS y configuración
│           │   ├── controller/      # Endpoints REST
│           │   ├── entity/          # Entidades JPA
│           │   ├── repository/      # Repositorios JPA
│           │   ├── service/         # Lógica de negocio
│           │   ├── dto/             # Objetos de respuesta
│           │   └── exception/       # Manejo global de errores
│           └── resources/
│               └── application.properties
├── Frontend/
│   ├── index.html                   # Pantalla principal (login + app)
│   ├── pages/                       # Pantallas adicionales
│   ├── css/styles.css
│   └── js/
│       ├── data.js                  # Datos simulados (mock)
│       ├── api.js                   # Conexión al backend REST
│       └── app.js                   # Lógica de la interfaz
└── Docs/                            # Documentación del proyecto
```

---

## Puesta en marcha

### 1. Base de datos
1. Instala MySQL 8.
2. Ejecuta el script `Backend/mariana_plasticos.sql` (crea la BD `mariana_plasticos` con 13 tablas y datos de prueba).

### 2. Backend (Spring Boot)
```bash
cd Backend/demo/demo
./mvnw spring-boot:run        # Linux/macOS
mvnw.cmd spring-boot:run      # Windows
```
El backend arranca en `http://localhost:8080`.

> Configura tus credenciales de MySQL en `src/main/resources/application.properties`
> (o usa variables de entorno: `DB_URL`, `DB_USER`, `DB_PASSWORD`).

### 3. Frontend
Abre `Frontend/index.html` en el navegador, o sirve la carpeta con cualquier servidor estático:
```bash
cd Frontend
python3 -m http.server 5500
# luego abre http://localhost:5500
```

---

## Usuarios de prueba

| Correo | Contraseña | Rol |
|---|---|---|
| Oswaldo.admin@gmail.com | Oswaldo1234 | Administrador |
| humberto.gerente@gmail.com | HumbertoG123 | Empleado |
| Armando.ventasAlamacen@gmail.com | Armando234 | Ventas |

---

## Endpoints principales (API REST)

Base URL: `http://localhost:8080/api`

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/login` | Iniciar sesión |
| GET | `/productos` | Listar productos |
| GET | `/productos/{id}` | Obtener un producto |
| POST | `/productos` | Crear producto |
| PUT | `/productos/{id}` | Actualizar producto |
| DELETE | `/productos/{id}` | Eliminar producto |
| GET | `/categorias` | Listar categorías |
| GET | `/inventario` | Listar inventario |
| GET | `/movimientos` | Historial de movimientos |
| POST | `/movimientos` | Registrar movimiento (entrada/salida) |
| GET | `/pedidos` | Listar pedidos |
| POST | `/pedidos` | Crear pedido |
| GET | `/clientes` | Listar clientes |

Documentación completa: `Docs/API_ENDPOINTS.md`

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

- El asistente IA está **simulado en frontend** durante la fase de desarrollo; se integrará por API en la fase final.
- Las contraseñas en la BD de prueba están en texto plano solo para desarrollo; en producción usar hash (BCrypt).
- No subir credenciales reales al repositorio — usar variables de entorno.
