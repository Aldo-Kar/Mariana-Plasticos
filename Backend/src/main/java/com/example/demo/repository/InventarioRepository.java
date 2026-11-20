package com.example.demo.repository;

import com.example.demo.entity.Inventario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InventarioRepository extends JpaRepository<Inventario, Integer> {
    List<Inventario> findAllByIdProducto(Integer idProducto);
    List<Inventario> findAllByIdProductoAndUbicacion(Integer idProducto, String ubicacion);
}
