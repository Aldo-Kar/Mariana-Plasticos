package com.example.demo.controller;

import com.example.demo.dto.ApiResponse;
import com.example.demo.entity.Usuario;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Usuarios + endpoint de login.
 * POST /api/auth/login  ->  { "correo": "...", "contrasena": "..." }
 *
 * NOTA: En produccion las contrasenas deben ir hasheadas (BCrypt).
 *       Esta implementacion es para desarrollo academico.
 */
@RestController
@RequestMapping("/api")
//@CrossOrigin(origins = "*")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    // POST /api/auth/login
    @PostMapping("/auth/login")
    public ResponseEntity<ApiResponse<Usuario>> login(@RequestBody Map<String, String> credenciales) {
        String correo = credenciales.get("correo");
        String contrasena = credenciales.get("contrasena");

        Optional<Usuario> usuarioOpt = usuarioRepository.findByCorreo(correo);

        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Correo no registrado"));
        }

        Usuario usuario = usuarioOpt.get();

        if (!usuario.getContrasena().equals(contrasena)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Contrasena incorrecta"));
        }

        if (!"Activo".equalsIgnoreCase(usuario.getEstado())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Usuario inactivo, contacta al administrador"));
        }

        // No devolver la contrasena en la respuesta
        usuario.setContrasena(null);
        return ResponseEntity.ok(ApiResponse.ok("Login exitoso", usuario));
    }

    // GET /api/usuarios
    @GetMapping("/usuarios")
    public ResponseEntity<ApiResponse<List<Usuario>>> listar() {
        List<Usuario> usuarios = usuarioRepository.findAll();
        usuarios.forEach(u -> u.setContrasena(null)); // ocultar contrasenas
        return ResponseEntity.ok(ApiResponse.ok(usuarios));
    }

    // GET /api/usuarios/{id}
    @GetMapping("/usuarios/{id}")
    public ResponseEntity<ApiResponse<Usuario>> obtenerPorId(@PathVariable Integer id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "id", id));
        usuario.setContrasena(null);
        return ResponseEntity.ok(ApiResponse.ok(usuario));
    }

    // POST /api/usuarios
    @PostMapping("/usuarios")
    public ResponseEntity<ApiResponse<Usuario>> crear(@RequestBody Usuario usuario) {
        if (usuarioRepository.existsByCorreo(usuario.getCorreo())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error("Ya existe un usuario con ese correo"));
        }
        if (usuario.getEstado() == null) usuario.setEstado("Activo");
        Usuario guardado = usuarioRepository.save(usuario);
        guardado.setContrasena(null);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Usuario creado", guardado));
    }

    // PUT /api/usuarios/{id}
    @PutMapping("/usuarios/{id}")
    public ResponseEntity<ApiResponse<Usuario>> actualizar(@PathVariable Integer id, @RequestBody Usuario datos) {
        Usuario existente = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "id", id));

        existente.setNombre(datos.getNombre() != null ? datos.getNombre() : existente.getNombre());
        existente.setCorreo(datos.getCorreo() != null ? datos.getCorreo() : existente.getCorreo());
        existente.setIdRol(datos.getIdRol() != null ? datos.getIdRol() : existente.getIdRol());
        existente.setEstado(datos.getEstado() != null ? datos.getEstado() : existente.getEstado());
        if (datos.getContrasena() != null && !datos.getContrasena().isBlank()) {
            existente.setContrasena(datos.getContrasena());
        }

        Usuario actualizado = usuarioRepository.save(existente);
        actualizado.setContrasena(null);
        return ResponseEntity.ok(ApiResponse.ok("Usuario actualizado", actualizado));
    }

    // DELETE /api/usuarios/{id}
    @DeleteMapping("/usuarios/{id}")
    public ResponseEntity<ApiResponse<Void>> eliminar(@PathVariable Integer id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "id", id));
        usuarioRepository.delete(usuario);
        return ResponseEntity.ok(ApiResponse.ok("Usuario eliminado", null));
    }
}
