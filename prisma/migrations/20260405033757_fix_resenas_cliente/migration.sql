/*
  Warnings:

  - You are about to drop the column `usuarioId` on the `resenas_producto` table. All the data in the column will be lost.
  - You are about to drop the column `usuarioId` on the `resenas_tienda` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `resenas_producto` DROP FOREIGN KEY `resenas_producto_usuarioId_fkey`;

-- DropForeignKey
ALTER TABLE `resenas_tienda` DROP FOREIGN KEY `resenas_tienda_usuarioId_fkey`;

-- AlterTable
ALTER TABLE `resenas_producto` DROP COLUMN `usuarioId`,
    ADD COLUMN `clienteId` INTEGER NULL;

-- AlterTable
ALTER TABLE `resenas_tienda` DROP COLUMN `usuarioId`,
    ADD COLUMN `clienteId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `resenas_producto_clienteId_idx` ON `resenas_producto`(`clienteId`);

-- CreateIndex
CREATE INDEX `resenas_tienda_clienteId_idx` ON `resenas_tienda`(`clienteId`);

-- AddForeignKey
ALTER TABLE `resenas_tienda` ADD CONSTRAINT `resenas_tienda_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clientes_tienda`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resenas_producto` ADD CONSTRAINT `resenas_producto_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clientes_tienda`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
