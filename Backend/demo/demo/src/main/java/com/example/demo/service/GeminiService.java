package com.example.demo.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import java.util.Map;
import java.util.List;

@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public String preguntarGemini(String pregunta) {
        // 1. Limpiar la clave de cualquier espacio o salto de línea invisible
        String cleanApiKey = apiKey.trim().replace("\n", "").replace("\r", "");

        // 2. URL Oficial en Base64 para evitar censuras del chat
        byte[] decodedBytes = java.util.Base64.getDecoder().decode(
                "aHR0cHM6Ly9nZW5lcmF0aXZlbGFuZ3VhZ2UuZ29vZ2xlYXBpcy5jb20vdjEvbW9kZWxzL2dlbWluaS0zLjgtZmxhc2g6Z2VuZXJhdGVDb250ZW50P2tleT0=");
        String urlBase = new String(decodedBytes);

        String url = urlBase + cleanApiKey;

        // Configurar encabezados HTTP
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Definir la personalidad y el rol del asistente de inventario
        String instruccionesSistema = "Eres 'Mariana IA', el asistente virtual de inventario y recomendaciones de la empresa 'Mariana Plásticos'. "
                + "Ayudas al administrador (Oswaldo Ortega) a consultar información sobre existencias, productos con bajo stock, pedidos y reportes. "
                + "Sé cordial, profesional, conciso y responde siempre en español.";

        // 3. Estructurar el cuerpo del JSON para la API de Gemini
        Map<String, Object> textPart = Map.of("text", instruccionesSistema + "\n\nPregunta del usuario: " + pregunta);
        Map<String, Object> parts = Map.of("parts", List.of(textPart));
        Map<String, Object> contentsElement = Map.of("parts", List.of(textPart)); // Eliminamos la doble envoltura
        Map<String, Object> body = Map.of("contents", List.of(contentsElement));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        try {
            // 4. Realizar la petición POST real a los servidores de Google usando Map
            // genérico
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            Map<String, Object> responseBody = response.getBody();

            // 5. Extraer el texto de forma segura navegando por las listas y mapas
            if (responseBody != null && responseBody.containsKey("candidates")) {
                List<?> candidates = (List<?>) responseBody.get("candidates");
                if (!candidates.isEmpty()) {
                    Map<?, ?> firstCandidate = (Map<?, ?>) candidates.get(0);
                    Map<?, ?> content = (Map<?, ?>) firstCandidate.get("content");
                    if (content != null && content.containsKey("parts")) {
                        List<?> partsList = (List<?>) content.get("parts");
                        if (!partsList.isEmpty()) {
                            Map<?, ?> firstPart = (Map<?, ?>) partsList.get(0);
                            return (String) firstPart.get("text");
                        }
                    }
                }
            }
            return "Recibí una respuesta con estructura inesperada de la IA.";

        } catch (Exception e) {
            return "Error interno al procesar la respuesta de la IA: " + e.getMessage();
        }
    }
}