package com.example.demo.exception;

import com.example.demo.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * Captura excepciones de toda la aplicacion y devuelve JSON limpio en lugar de HTML de error.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    // 404 - Recurso no encontrado
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> manejarRecursoNoEncontrado(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(ex.getMessage()));
    }

    // 400 - Validacion fallida (@Valid)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> manejarValidacion(MethodArgumentNotValidException ex) {
        Map<String, String> errores = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            errores.put(error.getField(), error.getDefaultMessage());
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(false, "Datos invalidos", errores));
    }

    // 500 - Error inesperado
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> manejarGeneral(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error interno del servidor: " + ex.getMessage()));
    }
}
