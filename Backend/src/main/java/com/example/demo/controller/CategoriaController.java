package com.example.demo.controller;

import com.example.demo.dto.ApiResponse;
import com.example.demo.entity.Categoria;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.CategoriaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categorias")
//@CrossOrigin(origins = "*")
public class CategoriaController {

    @Autowired
    private CategoriaRepository categoriaRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Categoria>>> listar() {
        return ResponseEntity.ok(ApiResponse.ok(categoriaRepository.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Categoria>> obtener(@PathVariable Integer id) {
        Categoria cat = categoriaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria", "id", id));
        return ResponseEntity.ok(ApiResponse.ok(cat));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Categoria>> crear(@RequestBody Categoria categoria) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Categoria creada", categoriaRepository.save(categoria)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Categoria>> actualizar(@PathVariable Integer id, @RequestBody Categoria datos) {
        Categoria existente = categoriaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria", "id", id));
        existente.setNombre(datos.getNombre() != null ? datos.getNombre() : existente.getNombre());
        existente.setDescripcion(datos.getDescripcion() != null ? datos.getDescripcion() : existente.getDescripcion());
        return ResponseEntity.ok(ApiResponse.ok("Categoria actualizada", categoriaRepository.save(existente)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> eliminar(@PathVariable Integer id) {
        categoriaRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Categoria eliminada", null));
    }
}
