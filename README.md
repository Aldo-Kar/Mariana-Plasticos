# Mariana Plásticos — Sistema de Inventario (SIPMNMP01)

Sistema de inventario web para **Mariana Plásticos S. de R.L.**, desarrollado como proyecto académico (UAEM — Ingeniería en Sistemas Inteligentes).

Permite gestionar productos, inventario, movimientos de entrada/salida, pedidos de clientes y consultas mediante un asistente inteligente conectado al backend.
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
| Backend | Java 17 + Spring Boot 4.1.1 (Web, Data JPA, Validation) |
| Base de datos | MySQL 8 / WorkBench (compatible MySQL) |
| IA | Asistente basado en datos de la API + servicio Gemini (Google) |
| Comunicación | APIs REST (JSON) |
| Contenedores | Docker (multi-stage Maven + JRE 17) |
| Control de versiones | Git + GitHub |
| IDE | VS Code  / Spring Tool Suite |

---

## Estructura del repositorio

```
Mariana-Plasticos/
├── Backend/                          # Proyecto Spring Boot (Maven)
│   ├── Dockerfile
│   ├── pom.xml
│   ├── mvnw / mvnw.cmd
│   ├── mariana_plasticos.sql         # Script de BD (estructura + datos de prueba)
│   ├── mariana_plasticos.mwb         # Modelo MySQL Workbench
│   └── src/main/
│       ├── java/com/example/demo/
│       │   ├── MarianaPlasticosApplication.java
│       │   ├── config/               # CORS
│       │   ├── controller/           # Endpoints REST
│       │   ├── entity/               # Entidades JPA
│       │   ├── repository/           # Repositorios JPA
│       │   ├── service/              # Lógica de negocio + IA
│       │   ├── dto/                  # DTOs de request/response
│       │   └── exception/            # Manejo global de errores
│       └── resources/
│           └── application.properties
├── Frontend/
│   ├── index.html                    # Login + aplicación completa
│   ├── css/styles.css
│   └── js/
│       ├── api.js                    # Cliente REST hacia el backend
│       └── app.js                    # Lógica de la interfaz (CRUD, navegación, asistente)
└── README.md
```
---

## Puesta en marcha

### 1. Base de datos
1. Instala MySQL 8.
2. Ejecuta el script `Backend/mariana_plasticos.sql` **una sola vez** (crea la BD `mariana_plasticos` con tablas y datos de prueba).  
   > No lo vuelvas a ejecutar cada vez que inicies la app: contiene instrucciones de creación/borrado.

### 2. Backend (Spring Boot)
```bash
cd Backend
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
| `DB_PASSWORD` | Contraseña BD | *(tu contraseña local)* |
| `CORS_ALLOWED_ORIGINS` | Orígenes permitidos | `http://localhost:5500,http://127.0.0.1:5500` |
| `GEMINI_API_KEY` | Clave de Google Gemini (opcional) | *(tu clave)* |

El archivo `application.properties` ya lee estas variables:

```properties
spring.datasource.url=${DB_URL}
spring.datasource.username=${DB_USER}
spring.datasource.password=${DB_PASSWORD}
app.cors.allowed-origins=${CORS_ALLOWED_ORIGINS}
gemini.api.key=${GEMINI_API_KEY}
```


#### 4. Frontend
1. Abre `Frontend/index.html` con Live Server (VS Code) o un servidor estático.
2. En `Frontend/js/api.js` cambia temporalmente la base URL si es necesario:
   ```js
   const BASE_URL = "http://localhost:8080/api";
   ```
3. Asegúrate de que `CORS_ALLOWED_ORIGINS` incluya el origen del frontend.


```bash
cd Frontend
python3 -m http.server 5500
# luego abre http://localhost:5500
```

O usa **Live Server** de VS Code.

---

#### 5. Docker (opcional)
```bash
cd Backend
docker build -t mariana-plasticos-api .
docker run -p 8080:8080 \
  -e DB_URL="jdbc:mysql://host.docker.internal:3306/mariana_plasticos?..." \
  -e DB_USER=root \
  -e DB_PASSWORD=tu_password \
  -e CORS_ALLOWED_ORIGINS="http://localhost:5500" \
  -e GEMINI_API_KEY="tu_clave" \
  mariana-plasticos-api
```

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

### Ejemplo de consulta al asistente

```http
POST /api/asistente/consultar
Content-Type: application/json

{ "consulta": "¿Cuántos productos hay en inventario?" }
```

Respuesta típica:
```json
{
  "success": true,
  "message": "📊 Resumen General — Mariana Plásticos\n..."
}
```

---


## Qué está conectado en esta versión

- **Dashboard**: totales calculados desde productos, inventario, pedidos y movimientos.
- **Productos**: listar, crear, editar y eliminar (`/api/productos`).
- **Categorías**: CRUD completo.
- **Inventario**: listar, crear, editar cantidades/ubicación y eliminar.
- **Movimientos**: listar, registrar entrada/salida y eliminar. Al registrar se actualiza el inventario.
- **Pedidos**: listar, crear (con detalles de líneas), editar y eliminar. Persiste encabezado + `DetallePedido`.
- **Clientes y Usuarios**: CRUD.
- **Asistente IA (`/api/asistente/consultar`)**: responde con datos reales de la base (productos, stock, pedidos, movimientos, etc.). Integrado en el chat del frontend.
- **Servicio Gemini**: preparado en backend (`GeminiService`) mediante variable `GEMINI_API_KEY` para ampliación futura.

---

## Limitaciones conocidas

- El login compara contraseñas en texto plano y no hay autorización por roles en las rutas. Solo válido para desarrollo escolar.
- Entrada/salida de inventario y movimiento pueden involucrar más de una operación; en fallos parciales puede haber inconsistencia temporal (revisar transacciones donde aplique).
- El asistente principal es orientado a reglas + datos de la BD. El servicio Gemini está implementado pero su uso pleno depende de configurar `GEMINI_API_KEY` y de la integración en el flujo de chat.
- En Render el backend puede dormir por inactividad; la primera petición tarda más.
- Para usar desde otra máquina en local, cambia `localhost` por la IP del servidor en `js/api.js` y restringe CORS al origen real del frontend.

---

## Cronograma

| Fase | Fecha límite | Estado (nov 2026) |
|---|---|---|
| Inicio | 31 ago 2026 | Completada |
| Análisis y Diseño | 30 sep 2026 | Completada |
| Construcción | 08 nov 2026 | Completada |
| Validación y Pruebas | 20 nov 2026 | Completada |
| Entrega final | 24 nov 2026 | Pendiente |

---

## Notas de seguridad y buenas prácticas

- **Nunca** subas el archivo `.env` ni credenciales reales al repositorio.
- Las contraseñas de la BD de prueba están en texto plano solo para desarrollo escolar; en un entorno real usar hash (BCrypt) y autenticación con tokens.
- La clave de Gemini (`GEMINI_API_KEY`) debe configurarse solo como variable de entorno en Render / local.
- Revisa periódicamente los orígenes permitidos en CORS.

---

## Notas adicionales

- El frontend consume la API de producción por defecto (`api.js`).
- El script SQL de prueba se ejecuta una sola vez; después de eso Hibernate (`ddl-auto=update`) mantiene el esquema.
- Para contribuir: crear rama, hacer cambios y abrir Pull Request hacia `main`.
