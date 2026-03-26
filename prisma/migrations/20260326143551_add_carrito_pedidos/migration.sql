-- CreateTable
CREATE TABLE `carritos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tiendaId` INTEGER NOT NULL,
    `clienteId` INTEGER NULL,
    `sessionId` VARCHAR(100) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    INDEX `carritos_clienteId_idx`(`clienteId`),
    UNIQUE INDEX `carritos_tiendaId_sessionId_key`(`tiendaId`, `sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `carrito_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `carritoId` INTEGER NOT NULL,
    `productoId` INTEGER NOT NULL,
    `varianteId` INTEGER NULL,
    `cantidad` INTEGER NOT NULL DEFAULT 1,
    `precioUnit` DECIMAL(12, 2) NOT NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `carrito_items_carritoId_productoId_idx`(`carritoId`, `productoId`),
    INDEX `carrito_items_productoId_idx`(`productoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pedidos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tiendaId` INTEGER NOT NULL,
    `clienteId` INTEGER NULL,
    `compradorNombre` VARCHAR(150) NOT NULL,
    `compradorEmail` VARCHAR(180) NOT NULL,
    `compradorTel` VARCHAR(30) NOT NULL,
    `metodoEntregaId` INTEGER NOT NULL,
    `direccionCalle` VARCHAR(150) NOT NULL,
    `direccionNumero` VARCHAR(20) NULL,
    `direccionPiso` VARCHAR(20) NULL,
    `direccionCiudad` VARCHAR(80) NOT NULL,
    `direccionProv` VARCHAR(80) NOT NULL,
    `direccionCP` VARCHAR(20) NULL,
    `direccionNotas` VARCHAR(300) NULL,
    `metodoPagoId` INTEGER NOT NULL,
    `subtotal` DECIMAL(12, 2) NOT NULL,
    `total` DECIMAL(12, 2) NOT NULL,
    `moneda` CHAR(3) NOT NULL DEFAULT 'ARS',
    `estado` ENUM('PENDIENTE', 'CONFIRMADO', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO') NOT NULL DEFAULT 'PENDIENTE',
    `notasCliente` TEXT NULL,
    `notasOwner` TEXT NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    INDEX `pedidos_tiendaId_idx`(`tiendaId`),
    INDEX `pedidos_clienteId_idx`(`clienteId`),
    INDEX `pedidos_estado_idx`(`estado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pedido_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pedidoId` INTEGER NOT NULL,
    `productoId` INTEGER NOT NULL,
    `varianteId` INTEGER NULL,
    `nombreProd` VARCHAR(200) NOT NULL,
    `nombreVar` VARCHAR(150) NULL,
    `imagenUrl` VARCHAR(500) NULL,
    `cantidad` INTEGER NOT NULL,
    `precioUnit` DECIMAL(12, 2) NOT NULL,
    `subtotal` DECIMAL(12, 2) NOT NULL,

    INDEX `pedido_items_pedidoId_idx`(`pedidoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `carritos` ADD CONSTRAINT `carritos_tiendaId_fkey` FOREIGN KEY (`tiendaId`) REFERENCES `tiendas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `carritos` ADD CONSTRAINT `carritos_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clientes_tienda`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `carrito_items` ADD CONSTRAINT `carrito_items_carritoId_fkey` FOREIGN KEY (`carritoId`) REFERENCES `carritos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `carrito_items` ADD CONSTRAINT `carrito_items_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `productos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `carrito_items` ADD CONSTRAINT `carrito_items_varianteId_fkey` FOREIGN KEY (`varianteId`) REFERENCES `producto_variantes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos` ADD CONSTRAINT `pedidos_tiendaId_fkey` FOREIGN KEY (`tiendaId`) REFERENCES `tiendas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos` ADD CONSTRAINT `pedidos_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clientes_tienda`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos` ADD CONSTRAINT `pedidos_metodoEntregaId_fkey` FOREIGN KEY (`metodoEntregaId`) REFERENCES `metodos_entrega`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos` ADD CONSTRAINT `pedidos_metodoPagoId_fkey` FOREIGN KEY (`metodoPagoId`) REFERENCES `metodos_pago`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedido_items` ADD CONSTRAINT `pedido_items_pedidoId_fkey` FOREIGN KEY (`pedidoId`) REFERENCES `pedidos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedido_items` ADD CONSTRAINT `pedido_items_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `productos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedido_items` ADD CONSTRAINT `pedido_items_varianteId_fkey` FOREIGN KEY (`varianteId`) REFERENCES `producto_variantes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
