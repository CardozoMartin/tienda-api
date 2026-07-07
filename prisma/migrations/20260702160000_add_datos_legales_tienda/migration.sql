-- Datos legales del vendedor (identificación del proveedor en e-commerce)
ALTER TABLE `tiendas`
  ADD COLUMN `razonSocial` VARCHAR(200) NULL,
  ADD COLUMN `cuit` VARCHAR(20) NULL,
  ADD COLUMN `domicilioLegal` VARCHAR(300) NULL;
