-- AlterTable
ALTER TABLE `pedidos` ADD COLUMN `costoEnvio` DECIMAL(12, 2) NOT NULL DEFAULT 0.00;

-- AlterTable
ALTER TABLE `producto_variantes` ADD COLUMN `stock` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `productos` ADD COLUMN `stock` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `log_pedidos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pedidoId` INTEGER NOT NULL,
    `estadoAnterior` ENUM('PENDIENTE', 'CONFIRMADO', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO') NULL,
    `estadoNuevo` ENUM('PENDIENTE', 'CONFIRMADO', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO') NOT NULL,
    `notas` TEXT NULL,
    `usuarioId` INTEGER NULL,
    `clienteId` INTEGER NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `log_pedidos_pedidoId_idx`(`pedidoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `log_pedidos` ADD CONSTRAINT `log_pedidos_pedidoId_fkey` FOREIGN KEY (`pedidoId`) REFERENCES `pedidos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;


