package com.example.demo.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "Inventario")
public class Inventario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_inventario")
    private Integer idInventario;

    @Column(name = "id_producto", nullable = false)
    private Integer idProducto;

    @Column(name = "cantidad_actual")
    private Integer cantidadActual;

    @Column(name = "ubicacion", length = 255)
    private String ubicacion;

    public Inventario() {}

    public Integer getIdInventario() { return idInventario; }
    public void setIdInventario(Integer idInventario) { this.idInventario = idInventario; }

    public Integer getIdProducto() { return idProducto; }
    public void setIdProducto(Integer idProducto) { this.idProducto = idProducto; }

    public Integer getCantidadActual() { return cantidadActual; }
    public void setCantidadActual(Integer cantidadActual) { this.cantidadActual = cantidadActual; }

    public String getUbicacion() { return ubicacion; }
    public void setUbicacion(String ubicacion) { this.ubicacion = ubicacion; }
}
