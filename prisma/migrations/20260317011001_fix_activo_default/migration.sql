-- CreateTable
CREATE TABLE `usuarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `apellido` VARCHAR(100) NOT NULL,
    `email` VARCHAR(180) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `rol` ENUM('ADMIN', 'OWNER', 'CLIENT') NOT NULL DEFAULT 'CLIENT',
    `telefono` VARCHAR(30) NULL,
    `avatarUrl` VARCHAR(500) NULL,
    `emailVerificado` BOOLEAN NOT NULL DEFAULT false,
    `tokenVerificacion` VARCHAR(100) NULL,
    `tokenVencVerificacion` DATETIME(3) NULL,
    `tokenResetPass` VARCHAR(100) NULL,
    `tokenVencReset` DATETIME(3) NULL,
    `activo` BOOLEAN NOT NULL DEFAULT false,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    UNIQUE INDEX `usuarios_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plantillas_tienda` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(80) NOT NULL,
    `descripcion` TEXT NULL,
    `previewUrl` VARCHAR(500) NULL,
    `defaultConfig` JSON NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `activo` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tiendas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuarioId` INTEGER NOT NULL,
    `plantillaId` INTEGER NULL,
    `slug` VARCHAR(120) NOT NULL,
    `nombre` VARCHAR(150) NOT NULL,
    `titulo` VARCHAR(200) NULL,
    `descripcion` TEXT NULL,
    `logoUrl` VARCHAR(500) NULL,
    `bannerUrl` VARCHAR(500) NULL,
    `whatsapp` VARCHAR(30) NULL,
    `instagram` VARCHAR(100) NULL,
    `facebook` VARCHAR(100) NULL,
    `sitioWeb` VARCHAR(255) NULL,
    `pais` VARCHAR(80) NULL,
    `provincia` VARCHAR(80) NULL,
    `ciudad` VARCHAR(80) NULL,
    `activa` BOOLEAN NOT NULL DEFAULT true,
    `publica` BOOLEAN NOT NULL DEFAULT true,
    `vistas` INTEGER NOT NULL DEFAULT 0,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tiendas_usuarioId_key`(`usuarioId`),
    UNIQUE INDEX `tiendas_slug_key`(`slug`),
    INDEX `tiendas_usuarioId_idx`(`usuarioId`),
    INDEX `tiendas_plantillaId_idx`(`plantillaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tienda_tema_config` (
    `tiendaId` INTEGER NOT NULL,
    `colorPrimario` CHAR(7) NULL,
    `colorSecundario` CHAR(7) NULL,
    `colorAcento` CHAR(7) NULL,
    `colorFondo` CHAR(7) NULL,
    `colorTexto` CHAR(7) NULL,
    `colorBoton` CHAR(7) NULL,
    `colorTextoBoton` CHAR(7) NULL,
    `colorNavbarBg` CHAR(7) NULL,
    `colorNavbarText` CHAR(7) NULL,
    `fuenteTitulo` VARCHAR(150) NULL,
    `fuenteCuerpo` VARCHAR(150) NULL,
    `navbarStyle` ENUM('TRANSPARENT', 'SOLID', 'STICKY') NULL,
    `heroLayout` ENUM('CENTERED', 'LEFT', 'SPLIT', 'FULLSCREEN') NULL,
    `cardStyle` ENUM('MINIMAL', 'ROUNDED', 'BOLD', 'ELEGANT', 'PLAYFUL') NULL,
    `borderRadius` ENUM('NONE', 'SM', 'MD', 'LG', 'FULL') NULL,
    `heroTitulo` VARCHAR(200) NULL,
    `heroSubtitulo` VARCHAR(300) NULL,
    `heroCtaTexto` VARCHAR(100) NULL,
    `cardMostrarPrecio` BOOLEAN NOT NULL DEFAULT true,
    `cardMostrarBadge` BOOLEAN NOT NULL DEFAULT true,
    `seccionesVisibles` JSON NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    PRIMARY KEY (`tiendaId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `metodos_pago` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(80) NOT NULL,
    `icono` VARCHAR(50) NULL,
    `descripcion` VARCHAR(255) NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `orden` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `metodos_pago_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `metodos_entrega` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(80) NOT NULL,
    `icono` VARCHAR(50) NULL,
    `descripcion` VARCHAR(255) NULL,
    `permiteZona` BOOLEAN NOT NULL DEFAULT false,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `orden` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `metodos_entrega_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `metodos_pago_tienda` (
    `tiendaId` INTEGER NOT NULL,
    `metodoPagoId` INTEGER NOT NULL,
    `detalle` VARCHAR(255) NULL,

    INDEX `metodos_pago_tienda_metodoPagoId_idx`(`metodoPagoId`),
    PRIMARY KEY (`tiendaId`, `metodoPagoId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `metodos_entrega_tienda` (
    `tiendaId` INTEGER NOT NULL,
    `metodoEntregaId` INTEGER NOT NULL,
    `zonaCobertura` VARCHAR(255) NULL,
    `detalle` VARCHAR(255) NULL,

    INDEX `metodos_entrega_tienda_metodoEntregaId_idx`(`metodoEntregaId`),
    PRIMARY KEY (`tiendaId`, `metodoEntregaId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `carrusel_imagenes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tiendaId` INTEGER NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `titulo` VARCHAR(200) NULL,
    `subtitulo` VARCHAR(300) NULL,
    `linkUrl` VARCHAR(500) NULL,
    `orden` INTEGER NOT NULL DEFAULT 0,
    `activa` BOOLEAN NOT NULL DEFAULT true,

    INDEX `carrusel_imagenes_tiendaId_idx`(`tiendaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categorias` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `padreId` INTEGER NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `iconoUrl` VARCHAR(500) NULL,
    `activa` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `categorias_slug_key`(`slug`),
    INDEX `categorias_padreId_idx`(`padreId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tags` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(80) NOT NULL,

    UNIQUE INDEX `tags_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `productos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tiendaId` INTEGER NOT NULL,
    `categoriaId` INTEGER NULL,
    `nombre` VARCHAR(200) NOT NULL,
    `descripcion` TEXT NULL,
    `precio` DECIMAL(12, 2) NOT NULL,
    `precioOferta` DECIMAL(12, 2) NULL,
    `moneda` CHAR(3) NOT NULL DEFAULT 'ARS',
    `imagenPrincipalUrl` VARCHAR(500) NULL,
    `disponible` BOOLEAN NOT NULL DEFAULT true,
    `destacado` BOOLEAN NOT NULL DEFAULT false,
    `vistas` INTEGER NOT NULL DEFAULT 0,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    INDEX `productos_tiendaId_idx`(`tiendaId`),
    INDEX `productos_categoriaId_idx`(`categoriaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `producto_imagenes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productoId` INTEGER NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `orden` INTEGER NOT NULL DEFAULT 0,

    INDEX `producto_imagenes_productoId_idx`(`productoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `producto_variantes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productoId` INTEGER NOT NULL,
    `nombre` VARCHAR(150) NOT NULL,
    `sku` VARCHAR(100) NULL,
    `precioExtra` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `imagenUrl` VARCHAR(500) NULL,
    `disponible` BOOLEAN NOT NULL DEFAULT true,

    INDEX `producto_variantes_productoId_idx`(`productoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `resenas_tienda` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tiendaId` INTEGER NOT NULL,
    `usuarioId` INTEGER NULL,
    `autorNombre` VARCHAR(100) NULL,
    `calificacion` INTEGER NOT NULL,
    `comentario` TEXT NULL,
    `aprobada` BOOLEAN NOT NULL DEFAULT false,
    `eliminada` BOOLEAN NOT NULL DEFAULT false,
    `respuesta` TEXT NULL,
    `respuestaEn` DATETIME(3) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `resenas_tienda_tiendaId_idx`(`tiendaId`),
    INDEX `resenas_tienda_usuarioId_idx`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `resenas_producto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productoId` INTEGER NOT NULL,
    `usuarioId` INTEGER NULL,
    `autorNombre` VARCHAR(100) NULL,
    `calificacion` INTEGER NOT NULL,
    `comentario` TEXT NULL,
    `aprobada` BOOLEAN NOT NULL DEFAULT false,
    `eliminada` BOOLEAN NOT NULL DEFAULT false,
    `respuesta` TEXT NULL,
    `respuestaEn` DATETIME(3) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `resenas_producto_productoId_idx`(`productoId`),
    INDEX `resenas_producto_usuarioId_idx`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `log_busquedas` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `termino` VARCHAR(255) NOT NULL,
    `tiendaId` INTEGER NULL,
    `usuarioId` INTEGER NULL,
    `resultados` INTEGER NULL DEFAULT 0,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `log_busquedas_usuarioId_idx`(`usuarioId`),
    INDEX `log_busquedas_tiendaId_idx`(`tiendaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ProductoToTag` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ProductoToTag_AB_unique`(`A`, `B`),
    INDEX `_ProductoToTag_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tiendas` ADD CONSTRAINT `tiendas_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tiendas` ADD CONSTRAINT `tiendas_plantillaId_fkey` FOREIGN KEY (`plantillaId`) REFERENCES `plantillas_tienda`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tienda_tema_config` ADD CONSTRAINT `tienda_tema_config_tiendaId_fkey` FOREIGN KEY (`tiendaId`) REFERENCES `tiendas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `metodos_pago_tienda` ADD CONSTRAINT `metodos_pago_tienda_tiendaId_fkey` FOREIGN KEY (`tiendaId`) REFERENCES `tiendas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `metodos_pago_tienda` ADD CONSTRAINT `metodos_pago_tienda_metodoPagoId_fkey` FOREIGN KEY (`metodoPagoId`) REFERENCES `metodos_pago`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `metodos_entrega_tienda` ADD CONSTRAINT `metodos_entrega_tienda_tiendaId_fkey` FOREIGN KEY (`tiendaId`) REFERENCES `tiendas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `metodos_entrega_tienda` ADD CONSTRAINT `metodos_entrega_tienda_metodoEntregaId_fkey` FOREIGN KEY (`metodoEntregaId`) REFERENCES `metodos_entrega`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `carrusel_imagenes` ADD CONSTRAINT `carrusel_imagenes_tiendaId_fkey` FOREIGN KEY (`tiendaId`) REFERENCES `tiendas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categorias` ADD CONSTRAINT `categorias_padreId_fkey` FOREIGN KEY (`padreId`) REFERENCES `categorias`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `productos` ADD CONSTRAINT `productos_tiendaId_fkey` FOREIGN KEY (`tiendaId`) REFERENCES `tiendas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `productos` ADD CONSTRAINT `productos_categoriaId_fkey` FOREIGN KEY (`categoriaId`) REFERENCES `categorias`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `producto_imagenes` ADD CONSTRAINT `producto_imagenes_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `productos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `producto_variantes` ADD CONSTRAINT `producto_variantes_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `productos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resenas_tienda` ADD CONSTRAINT `resenas_tienda_tiendaId_fkey` FOREIGN KEY (`tiendaId`) REFERENCES `tiendas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resenas_tienda` ADD CONSTRAINT `resenas_tienda_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resenas_producto` ADD CONSTRAINT `resenas_producto_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `productos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resenas_producto` ADD CONSTRAINT `resenas_producto_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `log_busquedas` ADD CONSTRAINT `log_busquedas_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ProductoToTag` ADD CONSTRAINT `_ProductoToTag_A_fkey` FOREIGN KEY (`A`) REFERENCES `productos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ProductoToTag` ADD CONSTRAINT `_ProductoToTag_B_fkey` FOREIGN KEY (`B`) REFERENCES `tags`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
