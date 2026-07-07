-- CreateTable
CREATE TABLE `promociones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tiendaId` INTEGER NOT NULL,
    `nombre` VARCHAR(150) NOT NULL,
    `tipoDescuento` ENUM('PORCENTAJE', 'MONTO_FIJO') NOT NULL DEFAULT 'PORCENTAJE',
    `valor` DECIMAL(12, 2) NOT NULL,
    `validoDesde` DATETIME(3) NULL,
    `validoHasta` DATETIME(3) NULL,
    `activa` BOOLEAN NOT NULL DEFAULT true,
    `bannerTitulo` VARCHAR(200) NULL,
    `bannerImagenUrl` VARCHAR(500) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    INDEX `promociones_tiendaId_idx`(`tiendaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `promocion_productos` (
    `promocionId` INTEGER NOT NULL,
    `productoId` INTEGER NOT NULL,

    INDEX `promocion_productos_productoId_idx`(`productoId`),
    PRIMARY KEY (`promocionId`, `productoId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `promociones` ADD CONSTRAINT `promociones_tiendaId_fkey` FOREIGN KEY (`tiendaId`) REFERENCES `tiendas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `promocion_productos` ADD CONSTRAINT `promocion_productos_promocionId_fkey` FOREIGN KEY (`promocionId`) REFERENCES `promociones`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `promocion_productos` ADD CONSTRAINT `promocion_productos_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `productos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
