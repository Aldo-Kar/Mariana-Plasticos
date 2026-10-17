/**
 * Mariana Plásticos - Sistema de Inventario
 * Lógica principal: Auth, Navegación, CRUD y Asistente IA
 */
let usuarioActual = null;

// ========== API Helpers ==========
const API_BASE = "http://localhost:8080/api";

async function loginBackend(correo, contrasena) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ correo, contrasena })
  });
  return await res.json();
}

async function obtenerProductos() {
  try {
    const res = await fetch(`${API_BASE}/productos`);
    const json = await res.json();
    return json.success ? json.data : [];
  } catch (err) {
    console.error("Error al cargar productos:", err);
    return [];
  }
}

async function guardarProductoAPI(datos) {
  const res = await fetch(`${API_BASE}/productos`, {
    method: datos.id_producto ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos)
  });
  return await res.json();
}

async function eliminarProductoAPI(id) {
  const res = await fetch(`${API_BASE}/productos/${id}`, { method: "DELETE" });
  return await res.json();
}

// ========== AUTH ==========
async function login() {
  const correo = document.getElementById("loginEmail").value.trim();
  const pass = document.getElementById("loginPass").value;
  const errorEl = document.getElementById("loginError");

  if (!correo || !pass) {
    errorEl.textContent = "Completa todos los campos";
    errorEl.style.display = "block";
    return;
  }

  try {
    const respuesta = await loginBackend(correo, pass);
    if (!respuesta.success) {
      errorEl.textContent = respuesta.message || "Credenciales incorrectas";
      errorEl.style.display = "block";
      return;
    }

    errorEl.style.display = "none";
    usuarioActual = respuesta.data;
    localStorage.setItem("usuario", JSON.stringify(usuarioActual));

    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "block";

    // Actualizar interfaz
    const iniciales = usuarioActual.nombre.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
    document.getElementById("userAvatar").textContent = iniciales;
    document.getElementById("userName").textContent = usuarioActual.nombre;
    document.getElementById("userRole").textContent = usuarioActual.rol;

    mostrarPagina("dashboard");
  } catch (err) {
    console.error("Error de login:", err);
    errorEl.textContent = "No se pudo conectar con el servidor";
    errorEl.style.display = "block";
  }
}

function logout() {
  usuarioActual = null;
  localStorage.removeItem("usuario");
  document.getElementById("app").style.display = "none";
  document.getElementById("login").style.display = "flex";
  document.getElementById("loginEmail").value = "";
  document.getElementById("loginPass").value = "";
  document.getElementById("loginError").style.display = "none";
}

// ========== NAVEGACIÓN ==========
function mostrarPagina(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
  const link = document.querySelector(`.nav-link[data-page="${id}"]`);
  if (link) link.classList.add("active");

  switch (id) {
    case "dashboard": renderDashboard(); break;
    case "productos": renderProductos(); break;
    case "inventario": renderInventario(); break;
    case "movimientos": renderMovimientos(); break;
    case "pedidos": renderPedidos(); break;
  }
}

// ========== DASHBOARD ==========
async function renderDashboard() {
  const productos = await obtenerProductos();
  const activos = productos.filter(p => p.estado === "Activo").length;

  document.getElementById("statProductos").textContent = activos;
  document.getElementById("statStockBajo").textContent = "—"; // pendiente: inventario
  document.getElementById("statPedidos").textContent = "—";  // pendiente: pedidos
  document.getElementById("statMovimientos").textContent = "—"; // pendiente: movimientos

  const tbody = document.getElementById("tablaStockBajo");
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--gray);">Conectando inventario...</td></tr>';
}

// ========== PRODUCTOS ==========
async function renderProductos() {
  const tbody = document.getElementById("tablaProductos");
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Cargando productos...</td></tr>';

  const productos = await obtenerProductos();
  const filtro = (document.getElementById("searchProductos")?.value || "").toLowerCase();
  tbody.innerHTML = "";

  if (!productos.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--gray);">No hay productos registrados</td></tr>';
    return;
  }

  productos.forEach(p => {
    if (filtro && !p.nombre.toLowerCase().includes(filtro) && !p.sku.toLowerCase().includes(filtro)) return;
    tbody.innerHTML += `
      <tr>
        <td><strong>${p.nombre}</strong><br><small style="color:var(--gray)">${p.sku}</small></td>
        <td>${p.idCategoria || "—"}</td>
        <td>${formatMoney(p.precioUnitario)}</td>
        <td>${p.stockMinimo || "—"}</td>
        <td><span class="badge ${p.estado === "Activo" ? "badge-success" : "badge-danger"}">${p.estado}</span></td>
        <td class="actions">
          <button class="btn-icon" title="Editar" onclick="abrirModalProducto(${p.idProducto})">✏️</button>
          <button class="btn-icon danger" title="Eliminar" onclick="eliminarProducto(${p.idProducto})">🗑️</button>
        </td>
      </tr>`;
  });
}

async function abrirModalProducto(id = null) {
  const modal = document.getElementById("modalProducto");
  document.getElementById("prodId").value = id || "";

  if (id) {
    const productos = await obtenerProductos();
    const p = productos.find(prod => prod.idProducto == id);
    if (!p) return;
    document.getElementById("modalProductoTitle").textContent = "Editar Producto";
    document.getElementById("prodSku").value = p.sku || "";
    document.getElementById("prodNombre").value = p.nombre || "";
    document.getElementById("prodDescripcion").value = p.descripcion || "";
    document.getElementById("prodPrecio").value = p.precioUnitario || "";
    document.getElementById("prodStockMin").value = p.stockMinimo || 10;
    document.getElementById("prodEstado").value = p.estado || "Activo";
  } else {
    document.getElementById("modalProductoTitle").textContent = "Nuevo Producto";
    document.getElementById("prodSku").value = "";
    document.getElementById("prodNombre").value = "";
    document.getElementById("prodDescripcion").value = "";
    document.getElementById("prodPrecio").value = "";
    document.getElementById("prodStockMin").value = "10";
    document.getElementById("prodEstado").value = "Activo";
  }
  modal.classList.add("active");
}

async function guardarProducto() {
  const id = document.getElementById("prodId").value;
  const datos = {
    sku: document.getElementById("prodSku").value.trim(),
    nombre: document.getElementById("prodNombre").value.trim(),
    descripcion: document.getElementById("prodDescripcion").value.trim(),
    precioUnitario: parseFloat(document.getElementById("prodPrecio").value) || 0,
    stockMinimo: parseInt(document.getElementById("prodStockMin").value) || 10,
    estado: document.getElementById("prodEstado").value,
    idCategoria: 1 // temporal
  };

  if (!datos.sku || !datos.nombre) {
    alert("SKU y Nombre son obligatorios");
    return;
  }

  if (id) datos.idProducto = parseInt(id);

  try {
    await guardarProductoAPI(datos);
    cerrarModal("modalProducto");
    renderProductos();
    renderDashboard();
  } catch (err) {
    alert("Error al guardar: " + err.message);
  }
}

async function eliminarProducto(id) {
  if (!confirm("¿Eliminar este producto?")) return;
  try {
    await eliminarProductoAPI(id);
    renderProductos();
    renderDashboard();
  } catch (err) {
    alert("Error al eliminar: " + err.message);
  }
}

// ========== FUNCIONES TEMPORALES ==========
function renderInventario() {
  const tbody = document.getElementById("tablaInventario");
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--gray);">Módulo en desarrollo</td></tr>';
}
function renderMovimientos() {
  const tbody = document.getElementById("tablaMovimientos");
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--gray);">Módulo en desarrollo</td></tr>';
}
function renderPedidos() {
  const tbody = document.getElementById("tablaPedidos");
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--gray);">Módulo en desarrollo</td></tr>';
}

// ========== UTILIDADES ==========
function formatMoney(cantidad) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(cantidad || 0);
}
function formatFecha(fecha) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-MX");
}
function cerrarModal(id) {
  document.getElementById(id)?.classList.remove("active");
}

// ========== INICIO ==========
document.addEventListener("DOMContentLoaded", () => {
  // Recuperar sesión
  const sesion = localStorage.getItem("usuario");
  if (sesion) {
    usuarioActual = JSON.parse(sesion);
    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "block";
    const iniciales = usuarioActual.nombre.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
    document.getElementById("userAvatar").textContent = iniciales;
    document.getElementById("userName").textContent = usuarioActual.nombre;
    document.getElementById("userRole").textContent = usuarioActual.rol;
    mostrarPagina("dashboard");
  }

  // Enter en login
  document.getElementById("loginPass")?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") login();
  });

  // Cerrar modal al hacer clic fuera
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-overlay")) {
      e.target.classList.remove("active");
    }
  });
});