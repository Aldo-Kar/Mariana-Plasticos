package com.example.demo.repository;

import com.example.demo.entity.Movimiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;


import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MovimientoRepository extends JpaRepository<Movimiento, Integer> {
    List<Movimiento> findByTipoMovimiento(String tipo);
    List<Movimiento> findByIdUsuario(Integer idUsuario);
    @Query("SELECT m FROM Movimiento m WHERE m.fechaMovimiento = :fecha")
    List<Movimiento> findByFechaMovimiento(@Param("fecha") LocalDateTime fecha);
    List<Movimiento> findByFechaMovimientoBetween(LocalDateTime inicio, LocalDateTime fin);
}
