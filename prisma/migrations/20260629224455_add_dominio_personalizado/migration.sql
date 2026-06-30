-- AlterTable
ALTER TABLE `tiendas` ADD COLUMN `dominioPersonalizado` VARCHAR(255) NULL,
    ADD COLUMN `dominioVerificado` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `dominioTokenVerif` VARCHAR(100) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `tiendas_dominioPersonalizado_key` ON `tiendas`(`dominioPersonalizado`);
