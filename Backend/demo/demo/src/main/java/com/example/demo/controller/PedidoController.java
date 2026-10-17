package com.example.demo.controller;

import com.example.demo.dto.ApiResponse;
import com.example.demo.entity.Pedido;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.PedidoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/pedidos")
//@CrossOrigin(origins = "*")
public class PedidoController {

    @Autowired
    private PedidoRepository pedidoRepository;

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

    @PostMapping
    public ResponseEntity<ApiResponse<Pedido>> crear(@RequestBody Pedido pedido) {
        if (pedido.getFechaPedido() == null) pedido.setFechaPedido(LocalDateTime.now());
        if (pedido.getEstado() == null) pedido.setEstado("Pendiente");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Pedido creado", pedidoRepository.save(pedido)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Pedido>> actualizar(@PathVariable Integer id, @RequestBody Pedido datos) {
        Pedido existente = pedidoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido", "id", id));
        existente.setEstado(datos.getEstado() != null ? datos.getEstado() : existente.getEstado());
        existente.setTotal(datos.getTotal() != null ? datos.getTotal() : existente.getTotal());
        existente.setObservaciones(datos.getObservaciones() != null ? datos.getObservaciones() : existente.getObservaciones());
        return ResponseEntity.ok(ApiResponse.ok("Pedido actualizado", pedidoRepository.save(existente)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> eliminar(@PathVariable Integer id) {
        pedidoRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Pedido eliminado", null));
    }
}
