package com.example.demo.dto;

import java.util.List;

/**
 * Datos recibidos para crear un pedido con varios productos.
 */
public class CrearPedidoRequest {

    private Integer idCliente;
    private String estado;
    private String observaciones;
    private List<ProductoPedidoRequest> productos;

    public CrearPedidoRequest() {
    }

    public Integer getIdCliente() {
        return idCliente;
    }

    public void setIdCliente(Integer idCliente) {
        this.idCliente = idCliente;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }

    public List<ProductoPedidoRequest> getProductos() {
        return productos;
    }

    public void setProductos(List<ProductoPedidoRequest> productos) {
        this.productos = productos;
    }

    public static class ProductoPedidoRequest {

        private Integer idProducto;
        private Integer cantidad;

        public ProductoPedidoRequest() {
        }

        public Integer getIdProducto() {
            return idProducto;
        }

        public void setIdProducto(Integer idProducto) {
            this.idProducto = idProducto;
        }

        public Integer getCantidad() {
            return cantidad;
        }

        public void setCantidad(Integer cantidad) {
            this.cantidad = cantidad;
        }
    }
}
