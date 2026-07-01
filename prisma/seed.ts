// Seed de la base de datos.
// Carga los datos iniciales que el sistema necesita para funcionar:
// categorías base, métodos de pago, métodos de entrega y plantillas.
// Se ejecuta con: npm run prisma:seed
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log("🌱 Iniciando seed...\n");

  // ─────────────────────────────────────────────
  // MÉTODOS DE PAGO
  // upsert: si ya existe no lo duplica (idempotente)
  // ─────────────────────────────────────────────

  const metodosPago = [
    { nombre: "Efectivo",               icono: "banknotes",          descripcion: "Pago en efectivo al momento de la entrega o retiro", orden: 1 },
    { nombre: "Transferencia bancaria", icono: "building-library",   descripcion: "CBU, CVU o alias bancario", orden: 2 },
    { nombre: "Mercado Pago",           icono: "qr-code",            descripcion: "Link de pago o QR de Mercado Pago", orden: 3 },
    { nombre: "Cuenta DNI",             icono: "identification",     descripcion: "Pago a través de la app Cuenta DNI", orden: 4 },
    { nombre: "Tarjeta de crédito",     icono: "credit-card",        descripcion: "Visa, Mastercard, American Express, etc.", orden: 5 },
    { nombre: "Tarjeta de débito",      icono: "credit-card",        descripcion: "Débito inmediato desde cuenta bancaria", orden: 6 },
    { nombre: "Uala",                   icono: "device-phone-mobile",descripcion: "Pago a través de la billetera virtual Ualá", orden: 7 },
    { nombre: "Naranja X",             icono: "device-phone-mobile", descripcion: "Pago a través de Naranja X", orden: 8 },
  ];

  console.log("💳 Creando métodos de pago...");
  for (const mp of metodosPago) {
    await prisma.metodoPago.upsert({
      where: { nombre: mp.nombre },
      update: {},
      create: mp,
    });
  }
  console.log(`   ${metodosPago.length} métodos de pago creados/verificados ✓`);

  // ─────────────────────────────────────────────
  // MÉTODOS DE ENTREGA
  // ─────────────────────────────────────────────

  const metodosEntrega = [
    { nombre: "Retiro en tienda",  icono: "home",    descripcion: "El cliente pasa a retirar en el local", permiteZona: false, orden: 1 },
    { nombre: "Punto de retiro",   icono: "map-pin", descripcion: "El cliente retira en un punto acordado", permiteZona: true,  orden: 2 },
    { nombre: "Envío a domicilio", icono: "truck",   descripcion: "Delivery en la zona cubierta",            permiteZona: true,  orden: 3 },
  ];

  console.log("🚚 Creando métodos de entrega...");
  for (const me of metodosEntrega) {
    await prisma.metodoEntrega.upsert({
      where: { nombre: me.nombre },
      update: {},
      create: me,
    });
  }
  console.log(`   ${metodosEntrega.length} métodos de entrega creados/verificados ✓`);

  // ─────────────────────────────────────────────
  // CATEGORÍAS (20 padres + subcategorías) con jerarquía
  // ─────────────────────────────────────────────

  const arbolCategorias: { nombre: string; slug: string; hijos: { nombre: string; slug: string }[] }[] = [
    { nombre: "Indumentaria y Moda", slug: "indumentaria-moda", hijos: [
      { nombre: "Ropa de mujer", slug: "ropa-mujer" },
      { nombre: "Ropa de hombre", slug: "ropa-hombre" },
      { nombre: "Ropa de niños y bebés", slug: "ropa-ninos-bebes" },
      { nombre: "Calzado", slug: "calzado" },
      { nombre: "Accesorios de moda", slug: "accesorios-moda" },
      { nombre: "Ropa deportiva", slug: "ropa-deportiva" },
      { nombre: "Ropa interior y pijamas", slug: "ropa-interior-pijamas" },
      { nombre: "Ropa de baño", slug: "ropa-bano" },
      { nombre: "Abrigos y camperas", slug: "abrigos-camperas" },
      { nombre: "Jeans y pantalones", slug: "jeans-pantalones" },
      { nombre: "Remeras y camisas", slug: "remeras-camisas" },
      { nombre: "Vestidos y faldas", slug: "vestidos-faldas" },
      { nombre: "Ropa de trabajo y uniformes", slug: "ropa-trabajo-uniformes" },
    ]},
    { nombre: "Tecnología y Electrónica", slug: "tecnologia-electronica", hijos: [
      { nombre: "Celulares y smartphones", slug: "celulares-smartphones" },
      { nombre: "Computadoras y laptops", slug: "computadoras-laptops" },
      { nombre: "Tablets", slug: "tablets" },
      { nombre: "Televisores", slug: "televisores" },
      { nombre: "Audio y auriculares", slug: "audio-auriculares" },
      { nombre: "Accesorios tech", slug: "accesorios-tech" },
      { nombre: "Gaming y videojuegos", slug: "gaming-videojuegos" },
      { nombre: "Fotografía y cámaras", slug: "fotografia-camaras" },
      { nombre: "Smartwatches y wearables", slug: "smartwatches-wearables" },
      { nombre: "Impresoras y escáneres", slug: "impresoras-escaneres" },
      { nombre: "Componentes de PC", slug: "componentes-pc" },
    ]},
    { nombre: "Hogar y Decoración", slug: "hogar-decoracion", hijos: [
      { nombre: "Muebles", slug: "muebles" },
      { nombre: "Decoración", slug: "decoracion" },
      { nombre: "Iluminación", slug: "iluminacion" },
      { nombre: "Textiles del hogar", slug: "textiles-hogar" },
      { nombre: "Organización y almacenamiento", slug: "organizacion-almacenamiento" },
      { nombre: "Arte y cuadros", slug: "arte-cuadros" },
      { nombre: "Espejos", slug: "espejos" },
      { nombre: "Alfombras y pisos", slug: "alfombras-pisos" },
      { nombre: "Cortinas y persianas", slug: "cortinas-persianas" },
      { nombre: "Relojes de pared", slug: "relojes-pared" },
    ]},
    { nombre: "Electrodomésticos", slug: "electrodomesticos", hijos: [
      { nombre: "Cocina grande", slug: "cocina-grande" },
      { nombre: "Lavarropas y secarropas", slug: "lavarropas-secarropas" },
      { nombre: "Pequeños electrodomésticos", slug: "pequenos-electrodomesticos" },
      { nombre: "Climatización", slug: "climatizacion" },
      { nombre: "Aspiradoras y limpieza", slug: "aspiradoras-limpieza" },
      { nombre: "Planchas y cuidado de ropa", slug: "planchas-cuidado-ropa" },
    ]},
    { nombre: "Alimentos y Bebidas", slug: "alimentos-bebidas", hijos: [
      { nombre: "Almacén y despensa", slug: "almacen-despensa" },
      { nombre: "Bebidas", slug: "bebidas" },
      { nombre: "Snacks y golosinas", slug: "snacks-golosinas" },
      { nombre: "Alimentos saludables", slug: "alimentos-saludables" },
      { nombre: "Orgánicos y naturales", slug: "organicos-naturales" },
      { nombre: "Congelados", slug: "congelados" },
      { nombre: "Lácteos y huevos", slug: "lacteos-huevos" },
      { nombre: "Carnes y embutidos", slug: "carnes-embutidos" },
      { nombre: "Panadería y repostería", slug: "panaderia-reposteria" },
      { nombre: "Aceites, salsas y condimentos", slug: "aceites-salsas-condimentos" },
      { nombre: "Sin TACC / Celíacos", slug: "sin-tacc-celiacos" },
      { nombre: "Vegano y vegetariano", slug: "vegano-vegetariano" },
    ]},
    { nombre: "Belleza y Cuidado Personal", slug: "belleza-cuidado-personal", hijos: [
      { nombre: "Maquillaje", slug: "maquillaje" },
      { nombre: "Skincare y cuidado facial", slug: "skincare-cuidado-facial" },
      { nombre: "Cuidado del cabello", slug: "cuidado-cabello" },
      { nombre: "Perfumes y fragancias", slug: "perfumes-fragancias" },
      { nombre: "Cuidado corporal", slug: "cuidado-corporal" },
      { nombre: "Higiene personal", slug: "higiene-personal" },
      { nombre: "Depilación y afeitado", slug: "depilacion-afeitado" },
      { nombre: "Uñas y nail art", slug: "unas-nail-art" },
      { nombre: "Cuidado personal hombre", slug: "cuidado-personal-hombre" },
      { nombre: "Salud íntima", slug: "salud-intima" },
    ]},
    { nombre: "Salud y Bienestar", slug: "salud-bienestar", hijos: [
      { nombre: "Suplementos y vitaminas", slug: "suplementos-vitaminas" },
      { nombre: "Medicamentos de venta libre", slug: "medicamentos-venta-libre" },
      { nombre: "Ortopedia y movilidad", slug: "ortopedia-movilidad" },
      { nombre: "Fitness y equipamiento", slug: "fitness-equipamiento" },
      { nombre: "Salud sexual", slug: "salud-sexual" },
      { nombre: "Audición y visión", slug: "audicion-vision" },
      { nombre: "Primeros auxilios", slug: "primeros-auxilios" },
      { nombre: "Relajación y bienestar", slug: "relajacion-bienestar" },
    ]},
    { nombre: "Deportes y Aventura", slug: "deportes-aventura", hijos: [
      { nombre: "Fútbol", slug: "futbol" },
      { nombre: "Running y atletismo", slug: "running-atletismo" },
      { nombre: "Ciclismo", slug: "ciclismo" },
      { nombre: "Natación", slug: "natacion" },
      { nombre: "Gimnasio y fitness", slug: "gimnasio-fitness" },
      { nombre: "Deportes de raqueta", slug: "deportes-raqueta" },
      { nombre: "Camping y outdoor", slug: "camping-outdoor" },
      { nombre: "Montañismo y trekking", slug: "montanismo-trekking" },
      { nombre: "Deportes acuáticos", slug: "deportes-acuaticos" },
      { nombre: "Nutrición deportiva", slug: "nutricion-deportiva" },
    ]},
    { nombre: "Juguetes y Juegos", slug: "juguetes-juegos", hijos: [
      { nombre: "Juguetes para bebés", slug: "juguetes-bebes" },
      { nombre: "Muñecas y accesorios", slug: "munecas-accesorios" },
      { nombre: "Figuras y coleccionables", slug: "figuras-coleccionables" },
      { nombre: "Juegos de mesa", slug: "juegos-mesa" },
      { nombre: "Rompecabezas", slug: "rompecabezas" },
      { nombre: "Vehículos y radiocontrol", slug: "vehiculos-radiocontrol" },
      { nombre: "Construcción (Lego, bloques)", slug: "construccion-lego-bloques" },
      { nombre: "Juguetes educativos", slug: "juguetes-educativos" },
      { nombre: "Juegos al aire libre", slug: "juegos-aire-libre" },
      { nombre: "Disfraces y fantasía", slug: "disfraces-fantasia" },
    ]},
    { nombre: "Libros, Música y Entretenimiento", slug: "libros-musica-entretenimiento", hijos: [
      { nombre: "Libros", slug: "libros" },
      { nombre: "Revistas", slug: "revistas" },
      { nombre: "Música (CDs y vinilos)", slug: "musica-cds-vinilos" },
      { nombre: "Películas y series", slug: "peliculas-series" },
      { nombre: "Instrumentos musicales", slug: "instrumentos-musicales" },
      { nombre: "Material educativo", slug: "material-educativo" },
      { nombre: "Papelería y librería", slug: "papeleria-libreria" },
    ]},
    { nombre: "Automotor y Motos", slug: "automotor-motos", hijos: [
      { nombre: "Repuestos de autos", slug: "repuestos-autos" },
      { nombre: "Accesorios para autos", slug: "accesorios-autos" },
      { nombre: "Audio y GPS vehicular", slug: "audio-gps-vehicular" },
      { nombre: "Limpieza y detailing", slug: "limpieza-detailing" },
      { nombre: "Repuestos de motos", slug: "repuestos-motos" },
      { nombre: "Accesorios para motos", slug: "accesorios-motos" },
      { nombre: "Neumáticos y llantas", slug: "neumaticos-llantas" },
      { nombre: "Herramientas automotrices", slug: "herramientas-automotrices" },
    ]},
    { nombre: "Herramientas y Construcción", slug: "herramientas-construccion", hijos: [
      { nombre: "Herramientas eléctricas", slug: "herramientas-electricas" },
      { nombre: "Herramientas manuales", slug: "herramientas-manuales" },
      { nombre: "Materiales de construcción", slug: "materiales-construccion" },
      { nombre: "Pintura y acabados", slug: "pintura-acabados" },
      { nombre: "Plomería y sanitarios", slug: "plomeria-sanitarios" },
      { nombre: "Electricidad técnica", slug: "electricidad-tecnica" },
      { nombre: "Seguridad industrial", slug: "seguridad-industrial" },
      { nombre: "Jardinería y paisajismo", slug: "jardineria-paisajismo" },
    ]},
    { nombre: "Mascotas", slug: "mascotas", hijos: [
      { nombre: "Perros", slug: "mascotas-perros" },
      { nombre: "Gatos", slug: "mascotas-gatos" },
      { nombre: "Aves", slug: "mascotas-aves" },
      { nombre: "Peces y acuarios", slug: "peces-acuarios" },
      { nombre: "Roedores", slug: "roedores" },
      { nombre: "Reptiles", slug: "reptiles" },
      { nombre: "Alimentos para mascotas", slug: "alimentos-mascotas" },
      { nombre: "Salud veterinaria", slug: "salud-veterinaria" },
      { nombre: "Accesorios y juguetes", slug: "accesorios-juguetes-mascotas" },
    ]},
    { nombre: "Bebés y Maternidad", slug: "bebes-maternidad", hijos: [
      { nombre: "Ropa de bebé", slug: "ropa-bebe" },
      { nombre: "Coches y sillas de auto", slug: "coches-sillas-auto" },
      { nombre: "Alimentación infantil", slug: "alimentacion-infantil" },
      { nombre: "Cunas y dormitorio bebé", slug: "cunas-dormitorio-bebe" },
      { nombre: "Juguetes para bebés", slug: "juguetes-para-bebes" },
      { nombre: "Cuidado e higiene bebé", slug: "cuidado-higiene-bebe" },
      { nombre: "Ropa y accesorios maternidad", slug: "ropa-accesorios-maternidad" },
      { nombre: "Lactancia", slug: "lactancia" },
    ]},
    { nombre: "Arte, Diseño y Manualidades", slug: "arte-diseno-manualidades", hijos: [
      { nombre: "Pinturas y pinceles", slug: "pinturas-pinceles" },
      { nombre: "Dibujo y boceto", slug: "dibujo-boceto" },
      { nombre: "Escultura y modelado", slug: "escultura-modelado" },
      { nombre: "Costura y tejido", slug: "costura-tejido" },
      { nombre: "Scrapbooking", slug: "scrapbooking" },
      { nombre: "Encuadernación", slug: "encuadernacion" },
      { nombre: "Arte digital", slug: "arte-digital" },
      { nombre: "Fotografía artística", slug: "fotografia-artistica" },
    ]},
    { nombre: "Oficina y Trabajo", slug: "oficina-trabajo", hijos: [
      { nombre: "Mobiliario de oficina", slug: "mobiliario-oficina" },
      { nombre: "Insumos y papelería", slug: "insumos-papeleria" },
      { nombre: "Tecnología de oficina", slug: "tecnologia-oficina" },
      { nombre: "Comunicación y telefonía", slug: "comunicacion-telefonia" },
      { nombre: "Organización de escritorio", slug: "organizacion-escritorio" },
      { nombre: "Equipos de presentación", slug: "equipos-presentacion" },
    ]},
    { nombre: "Jardín y Exteriores", slug: "jardin-exteriores", hijos: [
      { nombre: "Plantas y semillas", slug: "plantas-semillas" },
      { nombre: "Macetas y jardín vertical", slug: "macetas-jardin-vertical" },
      { nombre: "Herramientas de jardín", slug: "herramientas-jardin" },
      { nombre: "Riego", slug: "riego" },
      { nombre: "Muebles de exterior", slug: "muebles-exterior" },
      { nombre: "Parrillas y asadores", slug: "parrillas-asadores" },
      { nombre: "Piletas y accesorios", slug: "piletas-accesorios" },
      { nombre: "Iluminación exterior", slug: "iluminacion-exterior" },
    ]},
    { nombre: "Viajes y Turismo", slug: "viajes-turismo", hijos: [
      { nombre: "Equipaje y valijas", slug: "equipaje-valijas" },
      { nombre: "Accesorios de viaje", slug: "accesorios-viaje" },
      { nombre: "Camping y outdoor (viaje)", slug: "camping-outdoor-viaje" },
      { nombre: "Guías de viaje", slug: "guias-viaje" },
      { nombre: "Seguros de viaje", slug: "seguros-viaje" },
      { nombre: "Ropa de viaje", slug: "ropa-viaje" },
    ]},
    { nombre: "Servicios Digitales y Cursos", slug: "servicios-digitales-cursos", hijos: [
      { nombre: "Cursos online", slug: "cursos-online" },
      { nombre: "Software y licencias", slug: "software-licencias" },
      { nombre: "Templates y diseño digital", slug: "templates-diseno-digital" },
      { nombre: "Fotografía y video digital", slug: "fotografia-video-digital" },
      { nombre: "Consultoría y asesorías", slug: "consultoria-asesorias" },
      { nombre: "E-books y recursos digitales", slug: "ebooks-recursos-digitales" },
    ]},
    { nombre: "Coleccionables y Antigüedades", slug: "coleccionables-antiguedades", hijos: [
      { nombre: "Monedas y billetes", slug: "monedas-billetes" },
      { nombre: "Estampillas", slug: "estampillas" },
      { nombre: "Figuras y estatuillas", slug: "figuras-estatuillas" },
      { nombre: "Antigüedades", slug: "antiguedades" },
      { nombre: "Libros raros y de colección", slug: "libros-raros-coleccion" },
      { nombre: "Tarjetas coleccionables", slug: "tarjetas-coleccionables" },
      { nombre: "Arte y obras originales", slug: "arte-obras-originales" },
    ]},
  ];

  console.log("📂 Creando categorías (con subcategorías)...");
  let totalCats = 0;
  for (const padre of arbolCategorias) {
    const catPadre = await prisma.categoria.upsert({
      where: { slug: padre.slug },
      update: {},
      create: { nombre: padre.nombre, slug: padre.slug, activa: true },
    });
    totalCats++;
    for (const hijo of padre.hijos) {
      await prisma.categoria.upsert({
        where: { slug: hijo.slug },
        update: { padreId: catPadre.id },
        create: { nombre: hijo.nombre, slug: hijo.slug, padreId: catPadre.id, activa: true },
      });
      totalCats++;
    }
  }
  console.log(`   ${totalCats} categorías creadas/verificadas ✓`);

  // ─────────────────────────────────────────────
  // PLANTILLAS
  // ─────────────────────────────────────────────

  console.log("🎨 Limpiando plantillas viejas...");
  // Desvincular tiendas antes de borrar para evitar FK error
  await prisma.tienda.updateMany({
    where: { plantillaId: { not: null } },
    data: { plantillaId: null },
  });
  await prisma.plantillaTienda.deleteMany({});

  const plantillaGorras = await prisma.plantillaTienda.create({
    data: {
      nombre: "plantilla_gorras",
      descripcion: "Diseño streetwear para gorras y accesorios urbanos.",
      sortOrder: 1,
      activo: true,
      defaultConfig: {
        navbarStyle: "TRANSPARENT",
        heroLayout: "SPLIT",
        cardStyle: "ROUNDED",
        borderRadius: "MD",
      },
    },
  });

  // Re-vincular todas las tiendas a la única plantilla disponible
  await prisma.tienda.updateMany({
    data: { plantillaId: plantillaGorras.id },
  });

  console.log(`   Plantilla Gorras creada con id=${plantillaGorras.id} ✓`);

  // ─────────────────────────────────────────────
  // USUARIO ADMIN INICIAL
  // ─────────────────────────────────────────────

  const emailAdmin = process.env["ADMIN_EMAIL"] ?? "admin@tienda.com";
  const passwordAdmin = process.env["ADMIN_PASSWORD"] ?? "Admin1234!";

  const adminExistente = await prisma.usuario.findUnique({
    where: { email: emailAdmin },
  });

  if (!adminExistente) {
    const hash = await bcrypt.hash(passwordAdmin, 12);
    await prisma.usuario.create({
      data: {
        nombre: "Admin",
        apellido: "Sistema",
        email: emailAdmin,
        passwordHash: hash,
        rol: "ADMIN",
        emailVerificado: true,
        activo: true,
      },
    });
    console.log(`\n👤 Usuario admin creado:`);
    console.log(`   Email:    ${emailAdmin}`);
    console.log(`   Password: ${passwordAdmin}`);
    console.log(`   ⚠️  Cambiá la contraseña en producción!\n`);
  } else {
    console.log("\n👤 Usuario admin ya existe ✓");
  }

  console.log("\n✅ Seed completado exitosamente!");
}

main()
  .catch((error) => {
    console.error("❌ Error en el seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
