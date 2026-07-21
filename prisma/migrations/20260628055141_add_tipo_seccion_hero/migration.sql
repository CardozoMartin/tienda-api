-- Rename idempotente y case-safe de la tabla de relación implícita producto↔tag.
-- Prisma la genera como `_ProductoToTag`, pero el schema/cliente la espera como
-- `_productototag`. En MySQL con lower_case_table_names=0 (Linux) los nombres son
-- case-sensitive, así que hay que renombrar de verdad: primero los índices (mientras
-- la tabla aún se llama `_ProductoToTag`) y al final la tabla. Todo condicionado a
-- que el nombre viejo exista, para que sea idempotente y no rompa un reset limpio ni
-- entornos case-insensitive (Windows/Mac) donde ya podría estar en minúscula.

-- 1) Índice _ProductoToTag_AB_unique -> _productototag_AB_unique
SET @rename_ab := (
  SELECT IF(COUNT(*) > 0,
    "ALTER TABLE `_ProductoToTag` RENAME INDEX `_ProductoToTag_AB_unique` TO `_productototag_AB_unique`",
    "SELECT 1")
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = "_ProductoToTag"
    AND index_name = "_ProductoToTag_AB_unique"
);
PREPARE stmt_ab FROM @rename_ab;
EXECUTE stmt_ab;
DEALLOCATE PREPARE stmt_ab;

-- 2) Índice _ProductoToTag_B_index -> _productototag_B_index
SET @rename_b := (
  SELECT IF(COUNT(*) > 0,
    "ALTER TABLE `_ProductoToTag` RENAME INDEX `_ProductoToTag_B_index` TO `_productototag_B_index`",
    "SELECT 1")
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = "_ProductoToTag"
    AND index_name = "_ProductoToTag_B_index"
);
PREPARE stmt_b FROM @rename_b;
EXECUTE stmt_b;
DEALLOCATE PREPARE stmt_b;

-- 3) Tabla _ProductoToTag -> _productototag (sólo si todavía existe con mayúsculas).
--    Sin esto, el Prisma Client (que busca `_productototag`) da P2021 al crear productos.
SET @rename_tbl := (
  SELECT IF(COUNT(*) > 0,
    "RENAME TABLE `_ProductoToTag` TO `_productototag`",
    "SELECT 1")
  FROM information_schema.tables
  WHERE table_schema = DATABASE()
    AND table_name = "_ProductoToTag" COLLATE utf8mb4_bin
);
PREPARE stmt_tbl FROM @rename_tbl;
EXECUTE stmt_tbl;
DEALLOCATE PREPARE stmt_tbl;
