package com.example.demo.controller;

import com.example.demo.dto.ApiResponse;
import com.example.demo.entity.Inventario;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.InventarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventario")
//@CrossOrigin(origins = "*")
public class InventarioController {

    @Autowired
    private InventarioRepository inventarioRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Inventario>>> listar() {
        return ResponseEntity.ok(ApiResponse.ok(inventarioRepository.findAll()));
    }

    @GetMapping("/producto/{idProducto}")
    public ResponseEntity<ApiResponse<List<Inventario>>> porProducto(@PathVariable Integer idProducto) {
        return ResponseEntity.ok(ApiResponse.ok(inventarioRepository.findAllByIdProducto(idProducto)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Inventario>> crear(@RequestBody Inventario inventario) {
        if (inventario.getCantidadActual() == null || inventario.getCantidadActual() < 0) {
            throw new IllegalArgumentException("La cantidad debe ser mayor o igual a cero.");
        }
        if (inventario.getUbicacion() == null || inventario.getUbicacion().isBlank()) {
            throw new IllegalArgumentException("Indica el almacén y estante de ubicación.");
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Ubicación de inventario creada", inventarioRepository.save(inventario)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Inventario>> actualizar(@PathVariable Integer id, @RequestBody Inventario datos) {
        Inventario existente = inventarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventario", "id", id));
        existente.setCantidadActual(datos.getCantidadActual() != null ? datos.getCantidadActual() : existente.getCantidadActual());
        existente.setUbicacion(datos.getUbicacion() != null ? datos.getUbicacion() : existente.getUbicacion());
        return ResponseEntity.ok(ApiResponse.ok("Inventario actualizado", inventarioRepository.save(existente)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> eliminar(@PathVariable Integer id) {
        inventarioRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Registro eliminado", null));
    }
}
