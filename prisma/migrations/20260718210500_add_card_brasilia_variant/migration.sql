-- Agrega el valor BRASILIA al enum de cardVariante (card de producto estilo Tiendanube).

ALTER TABLE `tienda_tema_config`
  MODIFY COLUMN `cardVariante` ENUM('CLASICO', 'MODERNO', 'BRASILIA') NOT NULL DEFAULT 'CLASICO';
