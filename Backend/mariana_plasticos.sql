SELECT
c.nombre AS cliente,
p.id_pedido,
pr.nombre_producto,
dp.cantidad,
e.estado_envio
FROM clientes c
JOIN pedidos p
ON c.id_cliente = p.id_cliente
JOIN detalle_pedido dp
ON p.id_pedido = dp.id_pedido
JOIN productos pr
ON dp.id_producto = pr.id_producto
JOIN envios e
ON p.id_pedido = e.id_pedido;