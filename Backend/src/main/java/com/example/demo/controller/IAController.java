package com.example.demo.controller;

import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/ia")
@CrossOrigin("*")
public class IAController {

    @PostMapping("/chat")
    public Map<String, String> recibirMensaje(@RequestBody Map<String, String> datos) {
        String mensaje = datos.get("mensaje").toLowerCase();
        String respuesta;

        if (mensaje.contains("hola")) {
            respuesta = "¡Hola! Bienvenido a Mariana Plásticos. ¿En qué te ayudo?";
        } else if (mensaje.contains("inventario")) {
            respuesta = "Puedes consultar el inventario en el menú lateral → Inventario. Allí ves existencias y ubicación.";
        } else if (mensaje.contains("producto")) {
            respuesta = "En Productos gestionas todos los artículos: crear, editar y eliminar.";
        } else if (mensaje.contains("pedido")) {
            respuesta = "Los pedidos se gestionan en su sección. Puedes ver estado, total y observaciones.";
        } else if (mensaje.contains("cliente")) {
            respuesta = "La lista de clientes está disponible en el menú → Clientes.";
        } else {
            respuesta = "Claro que sí. Pregúntame sobre: inventario, productos, pedidos o clientes.";
        }

        return Map.of("respuesta", respuesta);
    }
}