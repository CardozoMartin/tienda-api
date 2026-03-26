/*
  Warnings:

  - You are about to drop the column `borderRadius` on the `tienda_tema_config` table. All the data in the column will be lost.
  - You are about to drop the column `cardStyle` on the `tienda_tema_config` table. All the data in the column will be lost.
  - You are about to drop the column `colorBoton` on the `tienda_tema_config` table. All the data in the column will be lost.
  - You are about to drop the column `colorFondo` on the `tienda_tema_config` table. All the data in the column will be lost.
  - You are about to drop the column `colorNavbarBg` on the `tienda_tema_config` table. All the data in the column will be lost.
  - You are about to drop the column `colorNavbarText` on the `tienda_tema_config` table. All the data in the column will be lost.
  - You are about to drop the column `colorPrimario` on the `tienda_tema_config` table. All the data in the column will be lost.
  - You are about to drop the column `colorSecundario` on the `tienda_tema_config` table. All the data in the column will be lost.
  - You are about to drop the column `colorTexto` on the `tienda_tema_config` table. All the data in the column will be lost.
  - You are about to drop the column `colorTextoBoton` on the `tienda_tema_config` table. All the data in the column will be lost.
  - You are about to drop the column `fuenteCuerpo` on the `tienda_tema_config` table. All the data in the column will be lost.
  - You are about to drop the column `fuenteTitulo` on the `tienda_tema_config` table. All the data in the column will be lost.
  - You are about to drop the column `heroLayout` on the `tienda_tema_config` table. All the data in the column will be lost.
  - Made the column `navbarStyle` on table `tienda_tema_config` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `tienda_tema_config` DROP COLUMN `borderRadius`,
    DROP COLUMN `cardStyle`,
    DROP COLUMN `colorBoton`,
    DROP COLUMN `colorFondo`,
    DROP COLUMN `colorNavbarBg`,
    DROP COLUMN `colorNavbarText`,
    DROP COLUMN `colorPrimario`,
    DROP COLUMN `colorSecundario`,
    DROP COLUMN `colorTexto`,
    DROP COLUMN `colorTextoBoton`,
    DROP COLUMN `fuenteCuerpo`,
    DROP COLUMN `fuenteTitulo`,
    DROP COLUMN `heroLayout`,
    ADD COLUMN `modoOscuro` BOOLEAN NOT NULL DEFAULT true,
    MODIFY `navbarStyle` ENUM('STICKY', 'TRANSPARENT', 'FLOATING') NOT NULL DEFAULT 'TRANSPARENT';

-- CreateTable
CREATE TABLE `clientes_tienda` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tiendaId` INTEGER NOT NULL,
    `email` VARCHAR(180) NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `apellido` VARCHAR(100) NOT NULL,
    `telefono` VARCHAR(30) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `emailVerificado` BOOLEAN NOT NULL DEFAULT false,
    `tokenVerif` VARCHAR(100) NULL,
    `tokenVerifVenc` DATETIME(3) NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    INDEX `clientes_tienda_tiendaId_idx`(`tiendaId`),
    UNIQUE INDEX `clientes_tienda_tiendaId_email_key`(`tiendaId`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `direcciones_cliente` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clienteId` INTEGER NOT NULL,
    `alias` VARCHAR(50) NULL,
    `calle` VARCHAR(150) NOT NULL,
    `numero` VARCHAR(20) NULL,
    `piso` VARCHAR(20) NULL,
    `ciudad` VARCHAR(80) NOT NULL,
    `provincia` VARCHAR(80) NOT NULL,
    `codigoPostal` VARCHAR(20) NULL,
    `indicaciones` VARCHAR(300) NULL,
    `esPrincipal` BOOLEAN NOT NULL DEFAULT false,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `direcciones_cliente_clienteId_idx`(`clienteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `clientes_tienda` ADD CONSTRAINT `clientes_tienda_tiendaId_fkey` FOREIGN KEY (`tiendaId`) REFERENCES `tiendas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `direcciones_cliente` ADD CONSTRAINT `direcciones_cliente_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clientes_tienda`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
