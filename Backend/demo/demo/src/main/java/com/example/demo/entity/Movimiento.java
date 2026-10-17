package com.example.demo.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "movimientos")
public class Movimiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_movimiento")
    private Integer idMovimiento;

    @Column(name = "id_usuario", nullable = false)
    private Integer idUsuario;

    @Column(name = "tipo_movimiento", length = 50)
    private String tipoMovimiento; // Entrada | Salida | Ajuste

    @Column(name = "fecha_movimiento")
    private LocalDateTime fechaMovimiento;

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    public Movimiento() {}

    public Integer getIdMovimiento() { return idMovimiento; }
    public void setIdMovimiento(Integer idMovimiento) { this.idMovimiento = idMovimiento; }

    public Integer getIdUsuario() { return idUsuario; }
    public void setIdUsuario(Integer idUsuario) { this.idUsuario = idUsuario; }

    public String getTipoMovimiento() { return tipoMovimiento; }
    public void setTipoMovimiento(String tipoMovimiento) { this.tipoMovimiento = tipoMovimiento; }

    public LocalDateTime getFechaMovimiento() { return fechaMovimiento; }
    public void setFechaMovimiento(LocalDateTime fechaMovimiento) { this.fechaMovimiento = fechaMovimiento; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
}
