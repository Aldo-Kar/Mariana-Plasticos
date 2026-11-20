package com.example.demo.controller;

import com.example.demo.service.AsistenteService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/asistente")
public class AsistenteController {

    private final AsistenteService asistenteService;

    // Constructor manual — garantiza la inicialización
    public AsistenteController(AsistenteService asistenteService) {
        this.asistenteService = asistenteService;
    }

    @PostMapping("/consultar")
    public ResponseEntity<Map<String, Object>> consultar(@RequestBody Map<String, String> solicitud) {
        String consulta = solicitud.get("consulta");
        return ResponseEntity.ok(asistenteService.procesarConsulta(consulta));
    }
}

