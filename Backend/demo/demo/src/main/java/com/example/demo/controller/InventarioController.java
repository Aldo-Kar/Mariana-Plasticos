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
    public ResponseEntity<ApiResponse<Inventario>> porProducto(@PathVariable Integer idProducto) {
        Inventario inv = inventarioRepository.findByIdProducto(idProducto)
                .orElseThrow(() -> new ResourceNotFoundException("Inventario", "id_producto", idProducto));
        return ResponseEntity.ok(ApiResponse.ok(inv));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Inventario>> crear(@RequestBody Inventario inventario) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Registro de inventario creado", inventarioRepository.save(inventario)));
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
