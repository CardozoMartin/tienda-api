-- Agrega el valor BRASILIA a los enums de tema (nuevo tema "Brasília" inspirado
-- en Tiendanube). MySQL no soporta ALTER TYPE para enums; hay que redefinir la
-- columna completa con MODIFY COLUMN listando todos los valores existentes + el nuevo.

ALTER TABLE `tienda_tema_config`
  MODIFY COLUMN `navbarVariante` ENUM('CLASICO', 'PILL', 'BOUTIQUE', 'BRASILIA') NOT NULL DEFAULT 'CLASICO';

ALTER TABLE `tienda_tema_config`
  MODIFY COLUMN `fuenteKit` ENUM('MODERNO', 'EDITORIAL', 'IMPACTO', 'MINIMAL', 'BRASILIA') NOT NULL DEFAULT 'MODERNO';

ALTER TABLE `tienda_tema_config`
  MODIFY COLUMN `tipoSeccionHero` ENUM('CARRUSEL', 'BANNER', 'HERO_FIJO', 'VIDEO', 'GALERIA', 'BRASILIA') NOT NULL DEFAULT 'HERO_FIJO';
