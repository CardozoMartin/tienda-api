-- Agrega el valor BRASILIA al enum de footerVariante (footer oscuro estilo Tiendanube).

ALTER TABLE `tienda_tema_config`
  MODIFY COLUMN `footerVariante` ENUM('CENTRADO', 'COLUMNAS', 'BRASILIA') NOT NULL DEFAULT 'CENTRADO';
