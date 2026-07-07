-- AlterTable
ALTER TABLE `tienda_tema_config` ADD COLUMN `categoriasDestacadasActivas` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `categoriasDestacadasPosicion` ENUM('ANTES', 'DESPUES') NOT NULL DEFAULT 'ANTES';

-- CreateTable
CREATE TABLE `categorias_destacadas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tiendaId` INTEGER NOT NULL,
    `imagenUrl` VARCHAR(500) NOT NULL,
    `titulo` VARCHAR(200) NOT NULL,
    `linkUrl` VARCHAR(500) NOT NULL,
    `orden` INTEGER NOT NULL DEFAULT 0,
    `activa` BOOLEAN NOT NULL DEFAULT true,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `categorias_destacadas_tiendaId_idx`(`tiendaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `categorias_destacadas` ADD CONSTRAINT `categorias_destacadas_tiendaId_fkey` FOREIGN KEY (`tiendaId`) REFERENCES `tiendas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
