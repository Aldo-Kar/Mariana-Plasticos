package com.example.demo.controller;

import com.example.demo.service.GeminiService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ia")
@CrossOrigin("*")
public class IAController {

    private final GeminiService geminiService;

    public IAController(
            GeminiService geminiService) {

        this.geminiService = geminiService;
    }

    @PostMapping("/chat")
    public String chat(
            @RequestBody String pregunta) {

        return geminiService
                .preguntarGemini(pregunta);
    }
}