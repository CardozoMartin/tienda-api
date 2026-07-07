-- Agrega campos estructurados color/talle a las variantes
ALTER TABLE `producto_variantes`
  ADD COLUMN `color` VARCHAR(80) NULL,
  ADD COLUMN `talle` VARCHAR(80) NULL;

-- Backfill: parsea nombres existentes con formato "Color: X - Talle: Y"
UPDATE `producto_variantes`
SET `color` = TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(SUBSTRING_INDEX(`nombre`, 'Color: ', -1), ' - ', 1), ',', 1))
WHERE `nombre` LIKE '%Color: %';

UPDATE `producto_variantes`
SET `talle` = TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(SUBSTRING_INDEX(`nombre`, 'Talle: ', -1), ' - ', 1), ',', 1))
WHERE `nombre` LIKE '%Talle: %';

UPDATE `producto_variantes`
SET `talle` = TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(`nombre`, 'Talla numérica: ', -1), ' - ', 1))
WHERE `talle` IS NULL AND `nombre` LIKE '%Talla numérica: %';
