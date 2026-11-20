package com.example.demo.service;

import com.example.demo.entity.*;
import com.example.demo.repository.ProductoRepository;
import com.example.demo.repository.InventarioRepository;
import com.example.demo.repository.MovimientoRepository;
import com.example.demo.repository.PedidoRepository;
import com.example.demo.repository.ClienteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AsistenteService {

    private final ProductoRepository productoRepository;
    private final InventarioRepository inventarioRepository;
    private final MovimientoRepository movimientoRepository;
    private final PedidoRepository pedidoRepository;
    private final ClienteRepository clienteRepository;

    // Constructor manual — inicializa TODAS las dependencias
    public AsistenteService(
            ProductoRepository productoRepository,
            InventarioRepository inventarioRepository,
            MovimientoRepository movimientoRepository,
            PedidoRepository pedidoRepository,
            ClienteRepository clienteRepository) {
        this.productoRepository = productoRepository;
        this.inventarioRepository = inventarioRepository;
        this.movimientoRepository = movimientoRepository;
        this.pedidoRepository = pedidoRepository;
        this.clienteRepository = clienteRepository;
    }

    // ==== El resto de tu código sigue IGUAL desde aquí ====
    public Map<String, Object> procesarConsulta(String consulta) {
        String resp = generarRespuesta(consulta.toLowerCase());

        Map<String, Object> resultado = new HashMap<>();
        resultado.put("success", true);
        resultado.put("message", resp);
        return resultado;
    }

    private String generarRespuesta(String q) {
        // ==============================================
        // 📊 RESUMEN GENERAL / DASHBOARD
        // ==============================================
        if (contiene(q, "total", "resumen", "general", "panel", "dashboard")) {
            long totalProductos = productoRepository.count();
            long totalUnidades = inventarioRepository.findAll().stream()
                    .mapToLong(i -> Optional.ofNullable(i.getCantidadActual()).orElse(0)).sum();
            long totalPedidos = pedidoRepository.count();
            long pedidosPendientes = pedidoRepository.findByEstadoNot("Entregado").size();
            long totalMov = movimientoRepository.count();

            return String.format("""
                    📊 Resumen General — Mariana Plásticos

                    📦 Productos registrados: %d
                    📦 Unidades en inventario: %d
                    🛒 Pedidos totales: %d
                    ⏳ Pedidos pendientes: %d
                    🔄 Movimientos registrados: %d
                    """, totalProductos, totalUnidades, totalPedidos, pedidosPendientes, totalMov);
        }

        // ==============================================
        // 📦 PRODUCTOS
        // ==============================================
        if (contiene(q, "producto", "productos")) {
            if (contiene(q, "listar", "todos", "ver todos")) {
                List<Producto> lista = productoRepository.findAll();
                if (lista.isEmpty())
                    return "📦 No hay productos registrados.";

                StringBuilder sb = new StringBuilder("📦 Productos registrados:\n");
                lista.forEach(p -> sb
                        .append(String.format("• %s — Precio Unitario: $%.2f — Precio Mayoreo: $%.2f — Stock: %d\n",
                                p.getNombre(), p.getPrecioUnitario(), p.getPrecioMayoreo(), p.getStockActual())));
                return sb.toString();
            }
        }

        // ==============================================
        // 📈 INVENTARIO / EXISTENCIAS / STOCK
        // ==============================================
        if (contiene(q, "existencia", "existencias", "stock", "inventario", "cantidad")) {
            if (contiene(q, "bajo", "poco", "minimo", "reabastecer", "reponer")) {
                List<Producto> bajoStock = productoRepository.findAll().stream()
                        .filter(p -> p.getStockActual() <= p.getStockMinimo())
                        .collect(Collectors.toList());
                if (bajoStock.isEmpty())
                    return "✅ Todos los productos tienen stock suficiente.";

                StringBuilder sb = new StringBuilder("⚠️ Productos con stock bajo:\n");
                bajoStock.forEach(p -> sb.append(String.format("• %s — Actual: %d / Mínimo: %d\n",
                        p.getNombre(), p.getStockActual(), p.getStockMinimo())));
                return sb.toString();
            }

            String nombreProd = extraerNombreProducto(q);
            if (!nombreProd.isEmpty()) {
                Optional<Producto> prod = productoRepository.findAll().stream()
                        .filter(p -> p.getNombre().toLowerCase().contains(nombreProd))
                        .findFirst();
                if (prod.isPresent()) {
                    Producto p = prod.get();
                    return String.format("""
                            📦 %s
                            ├─ Cantidad disponible: %d unidades
                            ├─ Stock mínimo: %d unidades
                            ├─ Precio unitario: $%.2f
                            ├─ Precio mayoreo: $%.2f
                            └─ Estado: %s
                            """, p.getNombre(), p.getStockActual(), p.getStockMinimo(),
                            p.getPrecioUnitario(), p.getPrecioMayoreo(),
                            p.getStockActual() <= p.getStockMinimo() ? "⚠️ Stock bajo" : "✅ Nivel suficiente");
                }
                return "❌ No encontré ese producto en el inventario.";
            }

            List<Inventario> inv = inventarioRepository.findAll();
            if (inv.isEmpty())
                return "📦 El inventario está vacío.";

            StringBuilder sb = new StringBuilder("📋 Inventario completo:\n");
            for (Inventario i : inv) {
                // Solo declara con String la PRIMERA vez en este bloque
                String nombreInventarioProd = "Producto (ID: " + i.getIdProducto() + ")";
                Optional<Producto> prod = productoRepository.findById(i.getIdProducto());
                if (prod.isPresent()) {
                    nombreInventarioProd = prod.get().getNombre(); // ← Sin "String" aquí
                }
                sb.append(String.format("• %s — %d unidades\n", nombreInventarioProd, i.getCantidadActual()));
            }
            return sb.toString();
        }

        // ==============================================
        // 🔄 MOVIMIENTOS
        // ==============================================
        if (contiene(q, "movimiento", "movimientos", "entrada", "salida", "historial")) {

            if (contiene(q, "hoy", "día de hoy", "día")) {
                LocalDate hoy = LocalDate.now();
                LocalDateTime inicio = hoy.atStartOfDay();
                LocalDateTime fin = hoy.plusDays(1).atStartOfDay();

                List<Movimiento> mvs = movimientoRepository.findByFechaMovimientoBetween(inicio, fin);

                if (mvs.isEmpty())
                    return "🔄 No hay movimientos registrados hoy.";

                StringBuilder sb = new StringBuilder("🔄 Movimientos de hoy:\n");
                for (Movimiento m : mvs) {
                    String nombreProd = "Producto (ID: " + m.getIdProducto() + ")";
                    Optional<Producto> prod = productoRepository.findById(m.getIdProducto());
                    if (prod.isPresent()) {
                        nombreProd = prod.get().getNombre();
                    }

                    // ⚠️ Usa el nombre EXACTO del método en tu clase Movimiento
                    sb.append(String.format("• %s — %s ×%d\n",
                            m.getTipoMovimiento(),
                            nombreProd,
                            m.getCantidad())); // ← Si da error, cambia por getCantidadMovimiento()
                }
                return sb.toString();
            }

            if (contiene(q, "recientes", "ultimos", "últimos")) {
                List<Movimiento> todos = movimientoRepository.findAll();
                if (todos.isEmpty())
                    return "🔄 No hay movimientos registrados.";

                int desde = Math.max(0, todos.size() - 10);
                StringBuilder sb = new StringBuilder("🔄 Últimos movimientos:\n");
                for (int i = todos.size() - 1; i >= desde; i--) {
                    Movimiento m = todos.get(i);
                    String fechaStr = m.getFechaMovimiento() != null
                            ? m.getFechaMovimiento().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))
                            : "Sin fecha";

                    sb.append(String.format("• %s | %s | ×%d\n",
                            fechaStr, m.getTipoMovimiento(), m.getCantidad()));
                }
                return sb.toString();
            }

            return "🔄 Total de movimientos: " + movimientoRepository.count();
        }

        // ==============================================
        // 🛒 PEDIDOS
        // ==============================================
        if (contiene(q, "pedido", "pedidos")) {
            if (contiene(q, "pendiente", "pendientes", "en proceso")) {
                List<Pedido> pend = pedidoRepository.findByEstadoNot("Entregado");
                if (pend.isEmpty())
                    return "✅ No hay pedidos pendientes.";

                StringBuilder sb = new StringBuilder("⏳ Pedidos pendientes (" + pend.size() + "):\n");
                for (Pedido p : pend) {
                    String nombreCli = p.getNombreCliente() != null ? p.getNombreCliente()
                            : (p.getIdCliente() != null ? "Cliente (ID: " + p.getIdCliente() + ")" : "Cliente");
                    sb.append(String.format("• %s — $%.2f — %s\n", nombreCli, p.getTotal(), p.getEstado()));
                }
                return sb.toString();
            }

            if (contiene(q, "entregado", "entregados")) {
                return "✅ Pedidos entregados: " + pedidoRepository.findByEstado("Entregado").size();
            }

            if (contiene(q, "hoy", "día de hoy")) {
                LocalDate hoy = LocalDate.now();
                LocalDateTime inicio = hoy.atStartOfDay();
                LocalDateTime fin = hoy.plusDays(1).atStartOfDay();
                List<Pedido> pedsHoy = pedidoRepository.findByFechaPedidoBetween(inicio, fin);
                if (pedsHoy.isEmpty())
                    return "🛒 No hay pedidos hoy.";

                StringBuilder sb = new StringBuilder("🛒 Pedidos de hoy:\n");
                for (Pedido p : pedsHoy) {
                    String nombreCli = p.getNombreCliente() != null ? p.getNombreCliente()
                            : (p.getIdCliente() != null ? "Cliente (ID: " + p.getIdCliente() + ")" : "Cliente");
                    sb.append(String.format("• %s — $%.2f — %s\n", nombreCli, p.getTotal(), p.getEstado()));
                }
                return sb.toString();
            }

            long totalP = pedidoRepository.count();
            long entregados = pedidoRepository.findByEstado("Entregado").size();
            return String.format("🛒 Total: %d | ✅ Entregados: %d | ⏳ Pendientes: %d",
                    totalP, entregados, totalP - entregados);
        }

        // ==============================================
        // 👥 CLIENTES
        // ==============================================
        if (contiene(q, "cliente", "clientes")) {
            List<Cliente> clientes = clienteRepository.findAll();
            if (clientes.isEmpty())
                return "👥 No hay clientes registrados.";

            StringBuilder sb = new StringBuilder("👥 Clientes (" + clientes.size() + "):\n");
            clientes.forEach(c -> sb.append("• ").append(c.getNombre()).append("\n"));
            return sb.toString();
        }

        // ==============================================
        // 📋 REPORTE DEL DÍA
        // ==============================================
        if (contiene(q, "reporte", "resumen del día", "actividad")) {
            LocalDate hoy = LocalDate.now();
            LocalDateTime inicio = hoy.atStartOfDay();
            LocalDateTime fin = hoy.plusDays(1).atStartOfDay();

            // ✅ Movimientos con rango de fechas
            List<Movimiento> mvs = movimientoRepository.findByFechaMovimientoBetween(inicio, fin);

            // ✅ Pedidos se mantienen igual (Pedido usa LocalDate)
            List<Pedido> peds = pedidoRepository.findByFechaPedidoBetween(inicio, fin);

            StringBuilder sb = new StringBuilder();
            sb.append("📋 Reporte — ").append(hoy.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))).append("\n\n");

            sb.append("🔄 Movimientos: ").append(mvs.size()).append("\n");
            if (mvs.isEmpty())
                sb.append("→ Sin movimientos\n");
            else
                for (Movimiento m : mvs) {
                    String nombreProd = "Producto (ID: " + m.getIdProducto() + ")";
                    Optional<Producto> prod = productoRepository.findById(m.getIdProducto());
                    if (prod.isPresent())
                        nombreProd = prod.get().getNombre();
                    sb.append("• ").append(m.getTipoMovimiento()).append(" — ").append(nombreProd)
                            .append(" ×").append(m.getCantidad()).append(" u\n");
                }

            sb.append("\n🛒 Pedidos: ").append(peds.size()).append("\n");
            if (peds.isEmpty())
                sb.append("→ Sin pedidos\n");
            else
                for (Pedido p : peds) {
                    String nombreCli = p.getNombreCliente() != null ? p.getNombreCliente()
                            : (p.getIdCliente() != null ? "Cliente (ID: " + p.getIdCliente() + ")" : "Cliente");
                    sb.append("• ").append(nombreCli)
                            .append(" — $").append(p.getTotal())
                            .append(" — ").append(p.getEstado()).append("\n");
                }

            return sb.toString();
        }

        // ==============================================
        // ❓ AYUDA
        // ==============================================
        return """
                🤖 Claro, pregúntame sobre:

                📊 "resumen general" → datos del sistema
                📦 "lista de productos" → todos los productos
                📈 "existencias de [nombre]" → stock de un producto
                ⚠️ "productos con stock bajo" → qué reponer
                🔄 "movimientos de hoy" → entradas y salidas
                🛒 "pedidos pendientes" → pedidos en proceso
                👥 "lista de clientes" → todos los clientes
                📋 "reporte del día" → actividad completa

                Solo escribe tu pregunta y te respondo con datos reales ✅
                """;
    }

    private boolean contiene(String texto, String... palabras) {
        for (String p : palabras) {
            if (texto.contains(p))
                return true;
        }
        return false;
    }

    private String extraerNombreProducto(String q) {
        String[] indicadores = { "de ", "del ", "existencias de ", "stock de ", "cantidad de " };
        for (String ind : indicadores) {
            if (q.contains(ind)) {
                return q.substring(q.indexOf(ind) + ind.length()).trim();
            }
        }
        return q.replaceAll("existencias|stock|cantidad|ver|dime", "").trim();
    }
}
