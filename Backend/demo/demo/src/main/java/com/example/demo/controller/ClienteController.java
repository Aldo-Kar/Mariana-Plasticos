package com.example.demo.controller;

import com.example.demo.dto.ApiResponse;
import com.example.demo.entity.Cliente;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.ClienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clientes")
//@CrossOrigin(origins = "*")
public class ClienteController {

    @Autowired
    private ClienteRepository clienteRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Cliente>>> listar() {
        return ResponseEntity.ok(ApiResponse.ok(clienteRepository.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Cliente>> obtener(@PathVariable Integer id) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", "id", id));
        return ResponseEntity.ok(ApiResponse.ok(cliente));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Cliente>> crear(@RequestBody Cliente cliente) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Cliente creado", clienteRepository.save(cliente)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Cliente>> actualizar(@PathVariable Integer id, @RequestBody Cliente datos) {
    Cliente existente = clienteRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Cliente", "id", id));

    existente.setNombre(datos.getNombre() != null ? datos.getNombre() : existente.getNombre());
    existente.setNegocio(datos.getNegocio() != null ? datos.getNegocio() : existente.getNegocio());
    existente.setCorreo(datos.getCorreo() != null ? datos.getCorreo() : existente.getCorreo());
    existente.setTelefono(datos.getTelefono() != null ? datos.getTelefono() : existente.getTelefono());
    existente.setDireccion(datos.getDireccion() != null ? datos.getDireccion() : existente.getDireccion());
    existente.setCategoria(datos.getCategoria() != null ? datos.getCategoria() : existente.getCategoria());

    return ResponseEntity.ok(ApiResponse.ok("Cliente actualizado", clienteRepository.save(existente)));
}

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> eliminar(@PathVariable Integer id) {
        clienteRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Cliente eliminado", null));
    }
}
