package com.example.demo.repository;

import com.example.demo.entity.Inventario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface InventarioRepository extends JpaRepository<Inventario, Integer> {
    Optional<Inventario> findByIdProducto(Integer idProducto);
}
