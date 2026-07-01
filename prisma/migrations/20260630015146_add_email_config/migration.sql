-- AlterTable
ALTER TABLE `tiendas`
  ADD COLUMN `emailProveedor` VARCHAR(30) NULL,
  ADD COLUMN `emailRemitente` VARCHAR(180) NULL,
  ADD COLUMN `emailRemitenteNombre` VARCHAR(120) NULL,
  ADD COLUMN `emailHost` VARCHAR(180) NULL,
  ADD COLUMN `emailPort` INTEGER NULL,
  ADD COLUMN `emailUsuario` VARCHAR(180) NULL,
  ADD COLUMN `emailCredencial` TEXT NULL,
  ADD COLUMN `emailVerificadoConfig` BOOLEAN NOT NULL DEFAULT false;
