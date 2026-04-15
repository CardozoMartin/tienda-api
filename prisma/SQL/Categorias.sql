


-- =============================================================================
-- SEED: categorias
-- Schema: Vitrina / Prisma (MySQL)
-- Tabla: categorias (id, padreId, nombre, slug, iconoUrl, activa)
-- Estrategia: INSERT padre → INSERT hijos referenciando LAST_INSERT_ID()
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. INDUMENTARIA Y MODA
-- -----------------------------------------------------------------------------
INSERT INTO categorias (nombre, slug, activa) VALUES ('Indumentaria y Moda', 'indumentaria-moda', true);
SET @cat1 = LAST_INSERT_ID();
INSERT INTO categorias (padreId, nombre, slug, activa) VALUES
  (@cat1, 'Ropa de mujer',               'ropa-mujer',                true),
  (@cat1, 'Ropa de hombre',              'ropa-hombre',               true),
  (@cat1, 'Ropa de niños y bebés',       'ropa-ninos-bebes',          true),
  (@cat1, 'Calzado',                     'calzado',                   true),
  (@cat1, 'Accesorios de moda',          'accesorios-moda',           true),
  (@cat1, 'Ropa deportiva',              'ropa-deportiva',            true),
  (@cat1, 'Ropa interior y pijamas',     'ropa-interior-pijamas',     true),
  (@cat1, 'Ropa de baño',                'ropa-bano',                 true),
  (@cat1, 'Abrigos y camperas',          'abrigos-camperas',          true),
  (@cat1, 'Jeans y pantalones',          'jeans-pantalones',          true),
  (@cat1, 'Remeras y camisas',           'remeras-camisas',           true),
  (@cat1, 'Vestidos y faldas',           'vestidos-faldas',           true),
  (@cat1, 'Ropa de trabajo y uniformes', 'ropa-trabajo-uniformes',    true);

-- -----------------------------------------------------------------------------
-- 2. TECNOLOGÍA Y ELECTRÓNICA
-- -----------------------------------------------------------------------------
INSERT INTO categorias (nombre, slug, activa) VALUES ('Tecnología y Electrónica', 'tecnologia-electronica', true);
SET @cat2 = LAST_INSERT_ID();
INSERT INTO categorias (padreId, nombre, slug, activa) VALUES
  (@cat2, 'Celulares y smartphones',     'celulares-smartphones',     true),
  (@cat2, 'Computadoras y laptops',      'computadoras-laptops',      true),
  (@cat2, 'Tablets',                     'tablets',                   true),
  (@cat2, 'Televisores',                 'televisores',               true),
  (@cat2, 'Audio y auriculares',         'audio-auriculares',         true),
  (@cat2, 'Accesorios tech',             'accesorios-tech',           true),
  (@cat2, 'Gaming y videojuegos',        'gaming-videojuegos',        true),
  (@cat2, 'Fotografía y cámaras',        'fotografia-camaras',        true),
  (@cat2, 'Smartwatches y wearables',    'smartwatches-wearables',    true),
  (@cat2, 'Impresoras y escáneres',      'impresoras-escaneres',      true),
  (@cat2, 'Componentes de PC',           'componentes-pc',            true);

-- -----------------------------------------------------------------------------
-- 3. HOGAR Y DECORACIÓN
-- -----------------------------------------------------------------------------
INSERT INTO categorias (nombre, slug, activa) VALUES ('Hogar y Decoración', 'hogar-decoracion', true);
SET @cat3 = LAST_INSERT_ID();
INSERT INTO categorias (padreId, nombre, slug, activa) VALUES
  (@cat3, 'Muebles',                     'muebles',                   true),
  (@cat3, 'Decoración',                  'decoracion',                true),
  (@cat3, 'Iluminación',                 'iluminacion',               true),
  (@cat3, 'Textiles del hogar',          'textiles-hogar',            true),
  (@cat3, 'Organización y almacenamiento','organizacion-almacenamiento',true),
  (@cat3, 'Arte y cuadros',              'arte-cuadros',              true),
  (@cat3, 'Espejos',                     'espejos',                   true),
  (@cat3, 'Alfombras y pisos',           'alfombras-pisos',           true),
  (@cat3, 'Cortinas y persianas',        'cortinas-persianas',        true),
  (@cat3, 'Relojes de pared',            'relojes-pared',             true);

-- -----------------------------------------------------------------------------
-- 4. ELECTRODOMÉSTICOS
-- -----------------------------------------------------------------------------
INSERT INTO categorias (nombre, slug, activa) VALUES ('Electrodomésticos', 'electrodomesticos', true);
SET @cat4 = LAST_INSERT_ID();
INSERT INTO categorias (padreId, nombre, slug, activa) VALUES
  (@cat4, 'Cocina grande',               'cocina-grande',             true),
  (@cat4, 'Lavarropas y secarropas',     'lavarropas-secarropas',     true),
  (@cat4, 'Pequeños electrodomésticos',  'pequenos-electrodomesticos',true),
  (@cat4, 'Climatización',               'climatizacion',             true),
  (@cat4, 'Aspiradoras y limpieza',      'aspiradoras-limpieza',      true),
  (@cat4, 'Planchas y cuidado de ropa',  'planchas-cuidado-ropa',     true);

-- -----------------------------------------------------------------------------
-- 5. ALIMENTOS Y BEBIDAS
-- -----------------------------------------------------------------------------
INSERT INTO categorias (nombre, slug, activa) VALUES ('Alimentos y Bebidas', 'alimentos-bebidas', true);
SET @cat5 = LAST_INSERT_ID();
INSERT INTO categorias (padreId, nombre, slug, activa) VALUES
  (@cat5, 'Almacén y despensa',          'almacen-despensa',          true),
  (@cat5, 'Bebidas',                     'bebidas',                   true),
  (@cat5, 'Snacks y golosinas',          'snacks-golosinas',          true),
  (@cat5, 'Alimentos saludables',        'alimentos-saludables',      true),
  (@cat5, 'Orgánicos y naturales',       'organicos-naturales',       true),
  (@cat5, 'Congelados',                  'congelados',                true),
  (@cat5, 'Lácteos y huevos',            'lacteos-huevos',            true),
  (@cat5, 'Carnes y embutidos',          'carnes-embutidos',          true),
  (@cat5, 'Panadería y repostería',      'panaderia-reposteria',      true),
  (@cat5, 'Aceites, salsas y condimentos','aceites-salsas-condimentos',true),
  (@cat5, 'Sin TACC / Celíacos',         'sin-tacc-celiacos',         true),
  (@cat5, 'Vegano y vegetariano',        'vegano-vegetariano',        true);

-- -----------------------------------------------------------------------------
-- 6. BELLEZA Y CUIDADO PERSONAL
-- -----------------------------------------------------------------------------
INSERT INTO categorias (nombre, slug, activa) VALUES ('Belleza y Cuidado Personal', 'belleza-cuidado-personal', true);
SET @cat6 = LAST_INSERT_ID();
INSERT INTO categorias (padreId, nombre, slug, activa) VALUES
  (@cat6, 'Maquillaje',                  'maquillaje',                true),
  (@cat6, 'Skincare y cuidado facial',   'skincare-cuidado-facial',   true),
  (@cat6, 'Cuidado del cabello',         'cuidado-cabello',           true),
  (@cat6, 'Perfumes y fragancias',       'perfumes-fragancias',       true),
  (@cat6, 'Cuidado corporal',            'cuidado-corporal',          true),
  (@cat6, 'Higiene personal',            'higiene-personal',          true),
  (@cat6, 'Depilación y afeitado',       'depilacion-afeitado',       true),
  (@cat6, 'Uñas y nail art',             'unas-nail-art',             true),
  (@cat6, 'Cuidado personal hombre',     'cuidado-personal-hombre',   true),
  (@cat6, 'Salud íntima',                'salud-intima',              true);

-- -----------------------------------------------------------------------------
-- 7. SALUD Y BIENESTAR
-- -----------------------------------------------------------------------------
INSERT INTO categorias (nombre, slug, activa) VALUES ('Salud y Bienestar', 'salud-bienestar', true);
SET @cat7 = LAST_INSERT_ID();
INSERT INTO categorias (padreId, nombre, slug, activa) VALUES
  (@cat7, 'Suplementos y vitaminas',     'suplementos-vitaminas',     true),
  (@cat7, 'Medicamentos de venta libre', 'medicamentos-venta-libre',  true),
  (@cat7, 'Ortopedia y movilidad',       'ortopedia-movilidad',       true),
  (@cat7, 'Fitness y equipamiento',      'fitness-equipamiento',      true),
  (@cat7, 'Salud sexual',                'salud-sexual',              true),
  (@cat7, 'Audición y visión',           'audicion-vision',           true),
  (@cat7, 'Primeros auxilios',           'primeros-auxilios',         true),
  (@cat7, 'Relajación y bienestar',      'relajacion-bienestar',      true);

-- -----------------------------------------------------------------------------
-- 8. DEPORTES Y AVENTURA
-- -----------------------------------------------------------------------------
INSERT INTO categorias (nombre, slug, activa) VALUES ('Deportes y Aventura', 'deportes-aventura', true);
SET @cat8 = LAST_INSERT_ID();
INSERT INTO categorias (padreId, nombre, slug, activa) VALUES
  (@cat8, 'Fútbol',                      'futbol',                    true),
  (@cat8, 'Running y atletismo',         'running-atletismo',         true),
  (@cat8, 'Ciclismo',                    'ciclismo',                  true),
  (@cat8, 'Natación',                    'natacion',                  true),
  (@cat8, 'Gimnasio y fitness',          'gimnasio-fitness',          true),
  (@cat8, 'Deportes de raqueta',         'deportes-raqueta',          true),
  (@cat8, 'Camping y outdoor',           'camping-outdoor',           true),
  (@cat8, 'Montañismo y trekking',       'montanismo-trekking',       true),
  (@cat8, 'Deportes acuáticos',          'deportes-acuaticos',        true),
  (@cat8, 'Nutrición deportiva',         'nutricion-deportiva',       true);

-- -----------------------------------------------------------------------------
-- 9. JUGUETES Y JUEGOS
-- -----------------------------------------------------------------------------
INSERT INTO categorias (nombre, slug, activa) VALUES ('Juguetes y Juegos', 'juguetes-juegos', true);
SET @cat9 = LAST_INSERT_ID();
INSERT INTO categorias (padreId, nombre, slug, activa) VALUES
  (@cat9, 'Juguetes para bebés',         'juguetes-bebes',            true),
  (@cat9, 'Muñecas y accesorios',        'munecas-accesorios',        true),
  (@cat9, 'Figuras y coleccionables',    'figuras-coleccionables',    true),
  (@cat9, 'Juegos de mesa',              'juegos-mesa',               true),
  (@cat9, 'Rompecabezas',                'rompecabezas',              true),
  (@cat9, 'Vehículos y radiocontrol',    'vehiculos-radiocontrol',    true),
  (@cat9, 'Construcción (Lego, bloques)','construccion-lego-bloques', true),
  (@cat9, 'Juguetes educativos',         'juguetes-educativos',       true),
  (@cat9, 'Juegos al aire libre',        'juegos-aire-libre',         true),
  (@cat9, 'Disfraces y fantasía',        'disfraces-fantasia',        true);

-- -----------------------------------------------------------------------------
-- 10. LIBROS, MÚSICA Y ENTRETENIMIENTO
-- -----------------------------------------------------------------------------
INSERT INTO categorias (nombre, slug, activa) VALUES ('Libros, Música y Entretenimiento', 'libros-musica-entretenimiento', true);
SET @cat10 = LAST_INSERT_ID();
INSERT INTO categorias (padreId, nombre, slug, activa) VALUES
  (@cat10, 'Libros',                     'libros',                    true),
  (@cat10, 'Revistas',                   'revistas',                  true),
  (@cat10, 'Música (CDs y vinilos)',     'musica-cds-vinilos',        true),
  (@cat10, 'Películas y series',         'peliculas-series',          true),
  (@cat10, 'Instrumentos musicales',     'instrumentos-musicales',    true),
  (@cat10, 'Material educativo',         'material-educativo',        true),
  (@cat10, 'Papelería y librería',       'papeleria-libreria',        true);

-- -----------------------------------------------------------------------------
-- 11. AUTOMOTOR Y MOTOS
-- -----------------------------------------------------------------------------
INSERT INTO categorias (nombre, slug, activa) VALUES ('Automotor y Motos', 'automotor-motos', true);
SET @cat11 = LAST_INSERT_ID();
INSERT INTO categorias (padreId, nombre, slug, activa) VALUES
  (@cat11, 'Repuestos de autos',         'repuestos-autos',           true),
  (@cat11, 'Accesorios para autos',      'accesorios-autos',          true),
  (@cat11, 'Audio y GPS vehicular',      'audio-gps-vehicular',       true),
  (@cat11, 'Limpieza y detailing',       'limpieza-detailing',        true),
  (@cat11, 'Repuestos de motos',         'repuestos-motos',           true),
  (@cat11, 'Accesorios para motos',      'accesorios-motos',          true),
  (@cat11, 'Neumáticos y llantas',       'neumaticos-llantas',        true),
  (@cat11, 'Herramientas automotrices',  'herramientas-automotrices', true);

-- -----------------------------------------------------------------------------
-- 12. HERRAMIENTAS Y CONSTRUCCIÓN
-- -----------------------------------------------------------------------------
INSERT INTO categorias (nombre, slug, activa) VALUES ('Herramientas y Construcción', 'herramientas-construccion', true);
SET @cat12 = LAST_INSERT_ID();
INSERT INTO categorias (padreId, nombre, slug, activa) VALUES
  (@cat12, 'Herramientas eléctricas',    'herramientas-electricas',   true),
  (@cat12, 'Herramientas manuales',      'herramientas-manuales',     true),
  (@cat12, 'Materiales de construcción', 'materiales-construccion',   true),
  (@cat12, 'Pintura y acabados',         'pintura-acabados',          true),
  (@cat12, 'Plomería y sanitarios',      'plomeria-sanitarios',       true),
  (@cat12, 'Electricidad técnica',       'electricidad-tecnica',      true),
  (@cat12, 'Seguridad industrial',       'seguridad-industrial',      true),
  (@cat12, 'Jardinería y paisajismo',    'jardineria-paisajismo',     true);

-- -----------------------------------------------------------------------------
-- 13. MASCOTAS
-- -----------------------------------------------------------------------------
INSERT INTO categorias (nombre, slug, activa) VALUES ('Mascotas', 'mascotas', true);
SET @cat13 = LAST_INSERT_ID();
INSERT INTO categorias (padreId, nombre, slug, activa) VALUES
  (@cat13, 'Perros',                     'mascotas-perros',           true),
  (@cat13, 'Gatos',                      'mascotas-gatos',            true),
  (@cat13, 'Aves',                       'mascotas-aves',             true),
  (@cat13, 'Peces y acuarios',           'peces-acuarios',            true),
  (@cat13, 'Roedores',                   'roedores',                  true),
  (@cat13, 'Reptiles',                   'reptiles',                  true),
  (@cat13, 'Alimentos para mascotas',    'alimentos-mascotas',        true),
  (@cat13, 'Salud veterinaria',          'salud-veterinaria',         true),
  (@cat13, 'Accesorios y juguetes',      'accesorios-juguetes-mascotas', true);

-- -----------------------------------------------------------------------------
-- 14. BEBÉS Y MATERNIDAD
-- -----------------------------------------------------------------------------
INSERT INTO categorias (nombre, slug, activa) VALUES ('Bebés y Maternidad', 'bebes-maternidad', true);
SET @cat14 = LAST_INSERT_ID();
INSERT INTO categorias (padreId, nombre, slug, activa) VALUES
  (@cat14, 'Ropa de bebé',               'ropa-bebe',                 true),
  (@cat14, 'Coches y sillas de auto',    'coches-sillas-auto',        true),
  (@cat14, 'Alimentación infantil',      'alimentacion-infantil',     true),
  (@cat14, 'Cunas y dormitorio bebé',    'cunas-dormitorio-bebe',     true),
  (@cat14, 'Juguetes para bebés',        'juguetes-para-bebes',       true),
  (@cat14, 'Cuidado e higiene bebé',     'cuidado-higiene-bebe',      true),
  (@cat14, 'Ropa y accesorios maternidad','ropa-accesorios-maternidad',true),
  (@cat14, 'Lactancia',                  'lactancia',                 true);

-- -----------------------------------------------------------------------------
-- 15. ARTE, DISEÑO Y MANUALIDADES
-- -----------------------------------------------------------------------------
INSERT INTO categorias (nombre, slug, activa) VALUES ('Arte, Diseño y Manualidades', 'arte-diseno-manualidades', true);
SET @cat15 = LAST_INSERT_ID();
INSERT INTO categorias (padreId, nombre, slug, activa) VALUES
  (@cat15, 'Pinturas y pinceles',        'pinturas-pinceles',         true),
  (@cat15, 'Dibujo y boceto',            'dibujo-boceto',             true),
  (@cat15, 'Escultura y modelado',       'escultura-modelado',        true),
  (@cat15, 'Costura y tejido',           'costura-tejido',            true),
  (@cat15, 'Scrapbooking',               'scrapbooking',              true),
  (@cat15, 'Encuadernación',             'encuadernacion',            true),
  (@cat15, 'Arte digital',               'arte-digital',              true),
  (@cat15, 'Fotografía artística',       'fotografia-artistica',      true);

-- -----------------------------------------------------------------------------
-- 16. OFICINA Y TRABAJO
-- -----------------------------------------------------------------------------
INSERT INTO categorias (nombre, slug, activa) VALUES ('Oficina y Trabajo', 'oficina-trabajo', true);
SET @cat16 = LAST_INSERT_ID();
INSERT INTO categorias (padreId, nombre, slug, activa) VALUES
  (@cat16, 'Mobiliario de oficina',      'mobiliario-oficina',        true),
  (@cat16, 'Insumos y papelería',        'insumos-papeleria',         true),
  (@cat16, 'Tecnología de oficina',      'tecnologia-oficina',        true),
  (@cat16, 'Comunicación y telefonía',   'comunicacion-telefonia',    true),
  (@cat16, 'Organización de escritorio', 'organizacion-escritorio',   true),
  (@cat16, 'Equipos de presentación',    'equipos-presentacion',      true);

-- -----------------------------------------------------------------------------
-- 17. JARDÍN Y EXTERIORES
-- -----------------------------------------------------------------------------
INSERT INTO categorias (nombre, slug, activa) VALUES ('Jardín y Exteriores', 'jardin-exteriores', true);
SET @cat17 = LAST_INSERT_ID();
INSERT INTO categorias (padreId, nombre, slug, activa) VALUES
  (@cat17, 'Plantas y semillas',         'plantas-semillas',          true),
  (@cat17, 'Macetas y jardín vertical',  'macetas-jardin-vertical',   true),
  (@cat17, 'Herramientas de jardín',     'herramientas-jardin',       true),
  (@cat17, 'Riego',                      'riego',                     true),
  (@cat17, 'Muebles de exterior',        'muebles-exterior',          true),
  (@cat17, 'Parrillas y asadores',       'parrillas-asadores',        true),
  (@cat17, 'Piletas y accesorios',       'piletas-accesorios',        true),
  (@cat17, 'Iluminación exterior',       'iluminacion-exterior',      true);

-- -----------------------------------------------------------------------------
-- 18. VIAJES Y TURISMO
-- -----------------------------------------------------------------------------
INSERT INTO categorias (nombre, slug, activa) VALUES ('Viajes y Turismo', 'viajes-turismo', true);
SET @cat18 = LAST_INSERT_ID();
INSERT INTO categorias (padreId, nombre, slug, activa) VALUES
  (@cat18, 'Equipaje y valijas',         'equipaje-valijas',          true),
  (@cat18, 'Accesorios de viaje',        'accesorios-viaje',          true),
  (@cat18, 'Camping y outdoor (viaje)',  'camping-outdoor-viaje',     true),
  (@cat18, 'Guías de viaje',             'guias-viaje',               true),
  (@cat18, 'Seguros de viaje',           'seguros-viaje',             true),
  (@cat18, 'Ropa de viaje',              'ropa-viaje',                true);

-- -----------------------------------------------------------------------------
-- 19. SERVICIOS DIGITALES Y CURSOS
-- -----------------------------------------------------------------------------
INSERT INTO categorias (nombre, slug, activa) VALUES ('Servicios Digitales y Cursos', 'servicios-digitales-cursos', true);
SET @cat19 = LAST_INSERT_ID();
INSERT INTO categorias (padreId, nombre, slug, activa) VALUES
  (@cat19, 'Cursos online',              'cursos-online',             true),
  (@cat19, 'Software y licencias',       'software-licencias',        true),
  (@cat19, 'Templates y diseño digital', 'templates-diseno-digital',  true),
  (@cat19, 'Fotografía y video digital', 'fotografia-video-digital',  true),
  (@cat19, 'Consultoría y asesorías',    'consultoria-asesorias',     true),
  (@cat19, 'E-books y recursos digitales','ebooks-recursos-digitales', true);

-- -----------------------------------------------------------------------------
-- 20. COLECCIONABLES Y ANTIGÜEDADES
-- -----------------------------------------------------------------------------
INSERT INTO categorias (nombre, slug, activa) VALUES ('Coleccionables y Antigüedades', 'coleccionables-antiguedades', true);
SET @cat20 = LAST_INSERT_ID();
INSERT INTO categorias (padreId, nombre, slug, activa) VALUES
  (@cat20, 'Monedas y billetes',         'monedas-billetes',          true),
  (@cat20, 'Estampillas',                'estampillas',               true),
  (@cat20, 'Figuras y estatuillas',      'figuras-estatuillas',       true),
  (@cat20, 'Antigüedades',               'antiguedades',              true),
  (@cat20, 'Libros raros y de colección','libros-raros-coleccion',    true),
  (@cat20, 'Tarjetas coleccionables',    'tarjetas-coleccionables',   true),
  (@cat20, 'Arte y obras originales',    'arte-obras-originales',     true);

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- RESUMEN: 20 categorías padre + 174 subcategorías = 194 filas en total
-- =============================================================================