-- AlterTable
ALTER TABLE `pedidos` ADD COLUMN `cuponCodigo` VARCHAR(50) NULL,
    ADD COLUMN `cuponId` INTEGER NULL,
    ADD COLUMN `descuento` DECIMAL(12, 2) NOT NULL DEFAULT 0.00;

-- CreateTable
CREATE TABLE `cupones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tiendaId` INTEGER NOT NULL,
    `codigo` VARCHAR(50) NOT NULL,
    `tipoDescuento` ENUM('PORCENTAJE', 'MONTO_FIJO') NOT NULL DEFAULT 'PORCENTAJE',
    `valor` DECIMAL(12, 2) NOT NULL,
    `minCompra` DECIMAL(12, 2) NULL,
    `validoDesde` DATETIME(3) NULL,
    `validoHasta` DATETIME(3) NULL,
    `usoMaximo` INTEGER NULL,
    `usoActual` INTEGER NOT NULL DEFAULT 0,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    INDEX `cupones_tiendaId_idx`(`tiendaId`),
    UNIQUE INDEX `cupones_tiendaId_codigo_key`(`tiendaId`, `codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `pedidos_cuponId_fkey` ON `pedidos`(`cuponId`);

-- AddForeignKey
ALTER TABLE `pedidos` ADD CONSTRAINT `pedidos_cuponId_fkey` FOREIGN KEY (`cuponId`) REFERENCES `cupones`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cupones` ADD CONSTRAINT `cupones_tiendaId_fkey` FOREIGN KEY (`tiendaId`) REFERENCES `tiendas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
