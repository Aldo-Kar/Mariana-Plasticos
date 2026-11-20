package com.example.demo.service;

import com.example.demo.entity.Pedido;
import com.example.demo.repository.PedidoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ServicioInteligentePedidos {

    private final PedidoRepository pedidoRepo;

    public ServicioInteligentePedidos(PedidoRepository pedidoRepo) {
        this.pedidoRepo = pedidoRepo;
    }

    @Transactional
    public boolean marcarComoEntregadoPorIA(Integer idPedido, String motivo) {
        // ✅ Usamos findById (viene de JpaRepository, no necesitas declararlo)
        return pedidoRepo.findById(idPedido)
            .map(pedido -> {
                // ⚠️ Verifica que el texto coincida EXACTAMENTE con tu BD
                if ("Enviado".equals(pedido.getEstado())) {
                    pedido.setEstado("Entregado");

                    String obsActual = pedido.getObservaciones();
                    String prefijo = obsActual != null && !obsActual.isBlank() ? obsActual + " | " : "";
                    String nuevaObs = prefijo + "IA: " + motivo;
                    pedido.setObservaciones(nuevaObs);

                    pedidoRepo.save(pedido);
                    return true;
                }
                return false;
            })
            .orElse(false);
    }
}



