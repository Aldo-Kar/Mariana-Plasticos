package com.example.demo.controller;

import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.CrearPedidoRequest;
import com.example.demo.entity.DetallePedido;
import com.example.demo.entity.Inventario;
import com.example.demo.entity.Pedido;
import com.example.demo.entity.Producto;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.DetallePedidoRepository;
import com.example.demo.repository.InventarioRepository;
import com.example.demo.repository.PedidoRepository;
import com.example.demo.repository.ProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/pedidos")
public class PedidoController {
    @Autowired
    private PedidoRepository pedidoRepository;
    @Autowired
    private DetallePedidoRepository detalleRepository;
    @Autowired
    private ProductoRepository productoRepository;
    @Autowired 
    private InventarioRepository inventarioRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Pedido>>> listar() {
        return ResponseEntity.ok(ApiResponse.ok(pedidoRepository.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Pedido>> obtener(@PathVariable Integer id) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido", "id", id));
        return ResponseEntity.ok(ApiResponse.ok(pedido));
    }

    @GetMapping("/{id}/detalles")
    public ResponseEntity<ApiResponse<List<DetallePedido>>> listarDetalles(@PathVariable Integer id) {
        if (!pedidoRepository.existsById(id))
            throw new ResourceNotFoundException("Pedido", "id", id);
        return ResponseEntity.ok(ApiResponse.ok(detalleRepository.findByIdPedido(id)));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<ApiResponse<Pedido>> crear(@RequestBody CrearPedidoRequest request) {
        if (request.getIdCliente() == null)
            throw new IllegalArgumentException("Selecciona un cliente.");
        if (request.getProductos() == null || request.getProductos().isEmpty())
            throw new IllegalArgumentException("Agrega al menos un producto al pedido.");

        Pedido pedido = new Pedido();
        pedido.setIdCliente(request.getIdCliente());
        pedido.setFechaPedido(LocalDateTime.now());
        pedido.setEstado(request.getEstado() == null ? "Pendiente" : request.getEstado());
        pedido.setObservaciones(request.getObservaciones());
        pedido.setTotal(BigDecimal.ZERO);
        pedido = pedidoRepository.save(pedido);

        BigDecimal total = BigDecimal.ZERO;

        for (CrearPedidoRequest.ProductoPedidoRequest linea : request.getProductos()) {
            if (linea.getIdProducto() == null || linea.getCantidad() == null || linea.getCantidad() < 1)
                throw new IllegalArgumentException("Cada producto debe tener una cantidad mayor a cero.");

            Producto producto = productoRepository.findById(linea.getIdProducto())
                    .orElseThrow(() -> new ResourceNotFoundException("Producto", "id", linea.getIdProducto()));

            // ===== VALIDAR Y RESTAR STOCK =====
            int stockActual = producto.getStockActual() == null ? 0 : producto.getStockActual();
            if (stockActual < linea.getCantidad()) {
                throw new IllegalArgumentException(
                        "Stock insuficiente para \"" + producto.getNombre() +
                                "\". Disponible: " + stockActual + ", solicitado: " + linea.getCantidad());
            }
            producto.setStockActual(stockActual - linea.getCantidad());
            productoRepository.save(producto);

            // También actualizar el registro de inventario (toma el primero que encuentre)
            List<Inventario> ubicaciones = inventarioRepository.findAllByIdProducto(producto.getIdProducto());
            if (!ubicaciones.isEmpty()) {
                Inventario inv = ubicaciones.get(0);
                inv.setCantidadActual(Math.max(0, inv.getCantidadActual() - linea.getCantidad()));
                inventarioRepository.save(inv);
            }
            // ==================================

            BigDecimal precio = producto.getPrecioUnitario() == null ? BigDecimal.ZERO : producto.getPrecioUnitario();
            BigDecimal subtotal = precio.multiply(BigDecimal.valueOf(linea.getCantidad()));

            DetallePedido detalle = new DetallePedido();
            detalle.setIdPedido(pedido.getIdPedido());
            detalle.setIdProducto(producto.getIdProducto());
            detalle.setCantidad(linea.getCantidad());
            detalle.setPrecioUnitario(precio);
            detalle.setSubtotal(subtotal);
            detalleRepository.save(detalle);
            total = total.add(subtotal);
        }

        pedido.setTotal(total);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Pedido y detalles creados correctamente", pedidoRepository.save(pedido)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Pedido>> actualizar(@PathVariable Integer id, @RequestBody Pedido datos) {
        Pedido existente = pedidoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido", "id", id));
        existente.setEstado(datos.getEstado() != null ? datos.getEstado() : existente.getEstado());
        existente.setObservaciones(
                datos.getObservaciones() != null ? datos.getObservaciones() : existente.getObservaciones());
        return ResponseEntity.ok(ApiResponse.ok("Pedido actualizado", pedidoRepository.save(existente)));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> eliminar(@PathVariable Integer id) {
        if (!pedidoRepository.existsById(id))
            throw new ResourceNotFoundException("Pedido", "id", id);
        detalleRepository.deleteAll(detalleRepository.findByIdPedido(id));
        pedidoRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Pedido eliminado", null));
    }
}
