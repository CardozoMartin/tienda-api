-- AlterTable
ALTER TABLE `clientes_tienda` ADD COLUMN `tokenResetPass` VARCHAR(100) NULL,
    ADD COLUMN `tokenVencReset` DATETIME(3) NULL;
