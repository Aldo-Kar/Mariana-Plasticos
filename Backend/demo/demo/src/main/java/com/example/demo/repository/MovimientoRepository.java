package com.example.demo.repository;

import com.example.demo.entity.Movimiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MovimientoRepository extends JpaRepository<Movimiento, Integer> {
    List<Movimiento> findByTipoMovimiento(String tipo);
    List<Movimiento> findByIdUsuario(Integer idUsuario);
}
