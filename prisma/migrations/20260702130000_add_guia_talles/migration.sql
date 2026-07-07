-- Tabla de talles reusable por tienda
CREATE TABLE `guias_talles` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `tiendaId` INTEGER NOT NULL,
  `nombre` VARCHAR(120) NOT NULL,
  `columnas` JSON NOT NULL,
  `filas` JSON NOT NULL,
  `nota` VARCHAR(500) NULL,
  `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `actualizadoEn` DATETIME(3) NOT NULL,

  INDEX `guias_talles_tiendaId_idx`(`tiendaId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Referencia opcional de producto a su guía de talles
ALTER TABLE `productos` ADD COLUMN `guiaTallesId` INTEGER NULL;

CREATE INDEX `productos_guiaTallesId_idx` ON `productos`(`guiaTallesId`);

ALTER TABLE `guias_talles` ADD CONSTRAINT `guias_talles_tiendaId_fkey`
  FOREIGN KEY (`tiendaId`) REFERENCES `tiendas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `productos` ADD CONSTRAINT `productos_guiaTallesId_fkey`
  FOREIGN KEY (`guiaTallesId`) REFERENCES `guias_talles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
