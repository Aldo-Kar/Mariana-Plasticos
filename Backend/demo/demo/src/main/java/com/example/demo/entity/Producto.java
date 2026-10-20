package com.example.demo.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "Productos")
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_producto")
    private Integer idProducto;

    @Column(name = "id_categoria", nullable = false)
    private Integer idCategoria;

    @Column(name = "sku", length = 50)
    private String sku;

    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;

    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "precio_unitario", precision = 10, scale = 2)
    private BigDecimal precioUnitario;

    @Column(name = "stock_minimo")
    private Integer stockMinimo;

    // ✅ Agregado: stock real del producto
    @Column(name = "stock_actual")
    private Integer stockActual;

    @Column(name = "estado", length = 20)
    private String estado;

    // Constructor vacío
    public Producto() {}

    // Constructor completo
    public Producto(Integer idCategoria, String sku, String nombre, String descripcion,
                    BigDecimal precioUnitario, Integer stockMinimo, Integer stockActual, String estado) {
        this.idCategoria = idCategoria;
        this.sku = sku;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.precioUnitario = precioUnitario;
        this.stockMinimo = stockMinimo;
        this.stockActual = stockActual;
        this.estado = estado;
    }

    // Getters y Setters
    public Integer getIdProducto() { return idProducto; }
    public void setIdProducto(Integer idProducto) { this.idProducto = idProducto; }

    public Integer getIdCategoria() { return idCategoria; }
    public void setIdCategoria(Integer idCategoria) { this.idCategoria = idCategoria; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public BigDecimal getPrecioUnitario() { return precioUnitario; }
    public void setPrecioUnitario(BigDecimal precioUnitario) { this.precioUnitario = precioUnitario; }

    public Integer getStockMinimo() { return stockMinimo; }
    public void setStockMinimo(Integer stockMinimo) { this.stockMinimo = stockMinimo; }

    public Integer getStockActual() { return stockActual; }
    public void setStockActual(Integer stockActual) { this.stockActual = stockActual; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
}