-- AlterTable
ALTER TABLE `carrusel_imagenes` ADD COLUMN `etiqueta` VARCHAR(100) NULL,
    ADD COLUMN `fechaDesde` DATETIME(3) NULL,
    ADD COLUMN `fechaHasta` DATETIME(3) NULL,
    ADD COLUMN `tipo` ENUM('CARRUSEL', 'BANNER', 'HERO_FIJO', 'VIDEO') NOT NULL DEFAULT 'CARRUSEL';

-- AlterTable
ALTER TABLE `pedidos` ADD COLUMN `estadoPago` ENUM('PENDIENTE', 'APROBADO', 'RECHAZADO', 'EN_PROCESO', 'DEVUELTO', 'CANCELADO') NOT NULL DEFAULT 'PENDIENTE',
    ADD COLUMN `mpPaymentId` VARCHAR(255) NULL,
    ADD COLUMN `mpPreferenciaId` VARCHAR(255) NULL;

-- CreateTable
CREATE TABLE `tienda_popups` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tiendaId` INTEGER NOT NULL,
    `tipo` ENUM('OFERTA', 'NEWSLETTER', 'INFO', 'IMAGEN_CTA') NOT NULL DEFAULT 'INFO',
    `activo` BOOLEAN NOT NULL DEFAULT false,
    `titulo` VARCHAR(200) NOT NULL,
    `mensaje` TEXT NULL,
    `imagenUrl` VARCHAR(500) NULL,
    `ctaTexto` VARCHAR(100) NULL,
    `ctaUrl` VARCHAR(500) NULL,
    `colorFondo` CHAR(7) NULL,
    `delay` INTEGER NOT NULL DEFAULT 2,
    `frecuencia` ENUM('SIEMPRE', 'UNA_VEZ_SESION', 'UNA_VEZ_DIA') NOT NULL DEFAULT 'SIEMPRE',
    `codigoDesc` VARCHAR(50) NULL,
    `porcentajeDesc` INTEGER NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    INDEX `tienda_popups_tiendaId_idx`(`tiendaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tienda_popups` ADD CONSTRAINT `tienda_popups_tiendaId_fkey` FOREIGN KEY (`tiendaId`) REFERENCES `tiendas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
