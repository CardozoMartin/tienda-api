-- CreateTable
CREATE TABLE `tienda_about_us` (
    `tiendaId` INTEGER NOT NULL,
    `titulo` VARCHAR(200) NULL,
    `descripcion` TEXT NULL,
    `imagenUrl` VARCHAR(500) NULL,
    `direccion` VARCHAR(300) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    PRIMARY KEY (`tiendaId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tienda_marquee_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tiendaId` INTEGER NOT NULL,
    `texto` VARCHAR(100) NOT NULL,
    `orden` INTEGER NOT NULL DEFAULT 0,

    INDEX `tienda_marquee_items_tiendaId_idx`(`tiendaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tienda_about_us` ADD CONSTRAINT `tienda_about_us_tiendaId_fkey` FOREIGN KEY (`tiendaId`) REFERENCES `tiendas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tienda_marquee_items` ADD CONSTRAINT `tienda_marquee_items_tiendaId_fkey` FOREIGN KEY (`tiendaId`) REFERENCES `tiendas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
