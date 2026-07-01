-- AlterTable
ALTER TABLE `metodos_entrega_tienda` ADD COLUMN `costo` DECIMAL(10, 2) NULL,
    ADD COLUMN `costoGratis` DECIMAL(10, 2) NULL,
    ADD COLUMN `tiempoEstimado` VARCHAR(100) NULL;

-- AlterTable
ALTER TABLE `metodos_pago_tienda` ADD COLUMN `configExtra` JSON NULL;
