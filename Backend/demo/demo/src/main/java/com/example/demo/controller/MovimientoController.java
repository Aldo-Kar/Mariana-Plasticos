package com.example.demo.controller;

import com.example.demo.dto.ApiResponse;
import com.example.demo.entity.Movimiento;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.MovimientoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/movimientos")
//@CrossOrigin(origins = "*")
public class MovimientoController {

    @Autowired
    private MovimientoRepository movimientoRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Movimiento>>> listar() {
        return ResponseEntity.ok(ApiResponse.ok(movimientoRepository.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Movimiento>> obtener(@PathVariable Integer id) {
        Movimiento mov = movimientoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movimiento", "id", id));
        return ResponseEntity.ok(ApiResponse.ok(mov));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Movimiento>> crear(@RequestBody Movimiento movimiento) {
        if (movimiento.getFechaMovimiento() == null) {
            movimiento.setFechaMovimiento(LocalDateTime.now());
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Movimiento registrado", movimientoRepository.save(movimiento)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> eliminar(@PathVariable Integer id) {
        movimientoRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Movimiento eliminado", null));
    }
}
