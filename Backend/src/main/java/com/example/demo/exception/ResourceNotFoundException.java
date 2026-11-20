package com.example.demo.exception;

/**
 * Se lanza cuando un recurso (producto, usuario, pedido...) no existe en la BD.
 * El GlobalExceptionHandler la convierte en respuesta 404 JSON.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String mensaje) {
        super(mensaje);
    }

    public ResourceNotFoundException(String recurso, String campo, Object valor) {
        super(String.format("%s no encontrado con %s = '%s'", recurso, campo, valor));
    }
}
