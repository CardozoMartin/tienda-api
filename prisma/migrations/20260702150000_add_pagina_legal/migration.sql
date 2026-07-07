-- Páginas legales editables por tienda (T&C, privacidad, cambios y devoluciones)
CREATE TABLE `paginas_legales` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `tiendaId` INTEGER NOT NULL,
  `tipo` ENUM('TERMINOS', 'PRIVACIDAD', 'CAMBIOS') NOT NULL,
  `titulo` VARCHAR(150) NOT NULL,
  `contenido` LONGTEXT NOT NULL,
  `activa` BOOLEAN NOT NULL DEFAULT true,
  `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `actualizadoEn` DATETIME(3) NOT NULL,

  INDEX `paginas_legales_tiendaId_idx`(`tiendaId`),
  UNIQUE INDEX `paginas_legales_tiendaId_tipo_key`(`tiendaId`, `tipo`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `paginas_legales` ADD CONSTRAINT `paginas_legales_tiendaId_fkey`
  FOREIGN KEY (`tiendaId`) REFERENCES `tiendas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
