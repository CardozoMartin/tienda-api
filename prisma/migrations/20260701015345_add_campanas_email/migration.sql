-- CreateTable
CREATE TABLE `campanas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tiendaId` INTEGER NOT NULL,
    `asunto` VARCHAR(200) NOT NULL,
    `cuerpoHtml` TEXT NOT NULL,
    `imagenUrl` VARCHAR(500) NULL,
    `segmento` ENUM('CLIENTES_REGISTRADOS', 'COMPRADORES', 'AMBOS') NOT NULL,
    `estado` ENUM('BORRADOR', 'ENCOLADA', 'ENVIANDO', 'ENVIADA', 'FALLIDA') NOT NULL DEFAULT 'BORRADOR',
    `totalDestinatarios` INTEGER NOT NULL DEFAULT 0,
    `enviados` INTEGER NOT NULL DEFAULT 0,
    `fallidos` INTEGER NOT NULL DEFAULT 0,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,
    `encoladaEn` DATETIME(3) NULL,
    `finalizadaEn` DATETIME(3) NULL,

    INDEX `campanas_tiendaId_idx`(`tiendaId`),
    INDEX `campanas_estado_idx`(`estado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `campana_envios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `campanaId` INTEGER NOT NULL,
    `email` VARCHAR(180) NOT NULL,
    `nombre` VARCHAR(150) NULL,
    `estado` ENUM('PENDIENTE', 'ENVIADO', 'FALLIDO') NOT NULL DEFAULT 'PENDIENTE',
    `error` VARCHAR(500) NULL,
    `intentos` INTEGER NOT NULL DEFAULT 0,
    `enviadoEn` DATETIME(3) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `campana_envios_campanaId_estado_idx`(`campanaId`, `estado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `campanas` ADD CONSTRAINT `campanas_tiendaId_fkey` FOREIGN KEY (`tiendaId`) REFERENCES `tiendas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campana_envios` ADD CONSTRAINT `campana_envios_campanaId_fkey` FOREIGN KEY (`campanaId`) REFERENCES `campanas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
