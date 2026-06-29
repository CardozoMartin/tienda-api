-- CreateTable
CREATE TABLE `visitas_tienda` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tiendaId` INTEGER NOT NULL,
    `productoId` INTEGER NULL,
    `sessionId` VARCHAR(100) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `visitas_tienda_tiendaId_creadoEn_idx`(`tiendaId`, `creadoEn`),
    INDEX `visitas_tienda_productoId_idx`(`productoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `visitas_tienda` ADD CONSTRAINT `visitas_tienda_tiendaId_fkey` FOREIGN KEY (`tiendaId`) REFERENCES `tiendas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
