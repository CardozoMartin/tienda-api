-- AlterTable
ALTER TABLE `categorias` ADD COLUMN `rubro` VARCHAR(60) NULL;

-- AlterTable
ALTER TABLE `tiendas` ADD COLUMN `rubro` VARCHAR(60) NULL;

-- CreateIndex
CREATE INDEX `categorias_rubro_idx` ON `categorias`(`rubro`);

