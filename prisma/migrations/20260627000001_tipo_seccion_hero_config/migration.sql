-- AlterTable
ALTER TABLE `tienda_tema_config` ADD COLUMN `tipoSeccionHero` ENUM('CARRUSEL', 'BANNER', 'HERO_FIJO', 'VIDEO') NOT NULL DEFAULT 'HERO_FIJO';
