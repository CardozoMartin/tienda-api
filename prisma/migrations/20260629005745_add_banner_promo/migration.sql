-- AlterTable
ALTER TABLE `tienda_tema_config` ADD COLUMN `bannerPromoActivo` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `bannerPromoCtaTexto` VARCHAR(100) NULL,
    ADD COLUMN `bannerPromoImagenUrl` VARCHAR(500) NULL,
    ADD COLUMN `bannerPromoLinkUrl` VARCHAR(500) NULL,
    ADD COLUMN `bannerPromoSubtitulo` VARCHAR(300) NULL,
    ADD COLUMN `bannerPromoTitulo` VARCHAR(200) NULL;
