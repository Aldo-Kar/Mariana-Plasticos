package com.example.demo.controller;

import com.example.demo.dto.ApiResponse;
import com.example.demo.entity.Producto;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.ProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * CRUD completo de Productos.
 * Reemplaza al ProductoController anterior (solo tenia GET /api/productos).
 */
@RestController
@RequestMapping("/api/productos")
//@CrossOrigin(origins = "*")
public class ProductoController {

    @Autowired
    private ProductoRepository productoRepository;

    // GET /api/productos
    @GetMapping
    public ResponseEntity<ApiResponse<List<Producto>>> listar() {
        List<Producto> productos = productoRepository.findAll();
        return ResponseEntity.ok(ApiResponse.ok("Productos obtenidos", productos));
    }

    // GET /api/productos/{id}
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Producto>> obtenerPorId(@PathVariable Integer id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto", "id", id));
        return ResponseEntity.ok(ApiResponse.ok(producto));
    }

    // POST /api/productos
    @PostMapping
    public ResponseEntity<ApiResponse<Producto>> crear(@RequestBody Producto producto) {
        if (producto.getEstado() == null) producto.setEstado("Activo");
        Producto guardado = productoRepository.save(producto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Producto creado", guardado));
    }

    // PUT /api/productos/{id}
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Producto>> actualizar(@PathVariable Integer id, @RequestBody Producto datos) {
        Producto existente = productoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto", "id", id));

        existente.setIdCategoria(datos.getIdCategoria() != null ? datos.getIdCategoria() : existente.getIdCategoria());
        existente.setSku(datos.getSku() != null ? datos.getSku() : existente.getSku());
        existente.setNombre(datos.getNombre() != null ? datos.getNombre() : existente.getNombre());
        existente.setDescripcion(datos.getDescripcion() != null ? datos.getDescripcion() : existente.getDescripcion());
        existente.setPrecioUnitario(datos.getPrecioUnitario() != null ? datos.getPrecioUnitario() : existente.getPrecioUnitario());
        existente.setStockMinimo(datos.getStockMinimo() != null ? datos.getStockMinimo() : existente.getStockMinimo());
        existente.setUrlImagen(datos.getUrlImagen() != null ? datos.getUrlImagen() : existente.getUrlImagen());
        existente.setEstado(datos.getEstado() != null ? datos.getEstado() : existente.getEstado());

        Producto actualizado = productoRepository.save(existente);
        return ResponseEntity.ok(ApiResponse.ok("Producto actualizado", actualizado));
    }

    // DELETE /api/productos/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> eliminar(@PathVariable Integer id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto", "id", id));
        productoRepository.delete(producto);
        return ResponseEntity.ok(ApiResponse.ok("Producto eliminado", null));
    }
}
