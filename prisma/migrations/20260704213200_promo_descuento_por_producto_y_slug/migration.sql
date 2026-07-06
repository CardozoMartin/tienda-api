-- AlterTable
ALTER TABLE `promocion_productos` ADD COLUMN `tipoDescuento` ENUM('PORCENTAJE', 'MONTO_FIJO') NULL,
    ADD COLUMN `valor` DECIMAL(12, 2) NULL;

-- AlterTable
ALTER TABLE `promociones` ADD COLUMN `slug` VARCHAR(160) NOT NULL,
    MODIFY `tipoDescuento` ENUM('PORCENTAJE', 'MONTO_FIJO') NULL,
    MODIFY `valor` DECIMAL(12, 2) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `promociones_tiendaId_slug_key` ON `promociones`(`tiendaId`, `slug`);

