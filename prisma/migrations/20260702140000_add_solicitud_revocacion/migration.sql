-- Botón de arrepentimiento: solicitudes de revocación de compra (Res. 424/2020)
CREATE TABLE `solicitudes_revocacion` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `tiendaId` INTEGER NOT NULL,
  `codigo` VARCHAR(20) NOT NULL,
  `pedidoId` INTEGER NULL,
  `nroPedidoTexto` VARCHAR(50) NULL,
  `nombre` VARCHAR(150) NOT NULL,
  `email` VARCHAR(180) NOT NULL,
  `telefono` VARCHAR(30) NULL,
  `motivo` TEXT NULL,
  `estado` ENUM('PENDIENTE', 'EN_PROCESO', 'RESUELTA', 'RECHAZADA') NOT NULL DEFAULT 'PENDIENTE',
  `respuestaOwner` TEXT NULL,
  `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `actualizadoEn` DATETIME(3) NOT NULL,

  UNIQUE INDEX `solicitudes_revocacion_codigo_key`(`codigo`),
  INDEX `solicitudes_revocacion_tiendaId_idx`(`tiendaId`),
  INDEX `solicitudes_revocacion_pedidoId_fkey`(`pedidoId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `solicitudes_revocacion` ADD CONSTRAINT `solicitudes_revocacion_tiendaId_fkey`
  FOREIGN KEY (`tiendaId`) REFERENCES `tiendas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `solicitudes_revocacion` ADD CONSTRAINT `solicitudes_revocacion_pedidoId_fkey`
  FOREIGN KEY (`pedidoId`) REFERENCES `pedidos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
