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
    { nombre: "Correo Argentino",  icono: "envelope",descripcion: "Envío por Correo Argentino a todo el país", permiteZona: false, orden: 4 },
    { nombre: "OCA",               icono: "package", descripcion: "Envío por OCA a todo el país",           permiteZona: false, orden: 5 },
    { nombre: "Andreani",          icono: "package", descripcion: "Envío por Andreani a todo el país",      permiteZona: false, orden: 6 },
    { nombre: "Pickit",            icono: "package", descripcion: "Red de puntos Pickit",                   permiteZona: false, orden: 7 },
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
  // CATEGORÍAS BASE
  // ─────────────────────────────────────────────

  const categorias = [
    { nombre: "Ropa y accesorios",    slug: "ropa-y-accesorios" },
    { nombre: "Electrónica",          slug: "electronica" },
    { nombre: "Hogar y decoración",   slug: "hogar-y-decoracion" },
    { nombre: "Alimentos y bebidas",  slug: "alimentos-y-bebidas" },
    { nombre: "Salud y belleza",      slug: "salud-y-belleza" },
    { nombre: "Deportes",             slug: "deportes" },
    { nombre: "Juguetes y bebés",     slug: "juguetes-y-bebes" },
    { nombre: "Arte y manualidades",  slug: "arte-y-manualidades" },
    { nombre: "Libros y papelería",   slug: "libros-y-papeleria" },
    { nombre: "Mascotas",             slug: "mascotas" },
    { nombre: "Servicios",            slug: "servicios" },
    { nombre: "Otros",                slug: "otros" },
  ];

  console.log("📂 Creando categorías...");
  for (const cat of categorias) {
    await prisma.categoria.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { ...cat, activa: true },
    });
  }
  console.log(`   ${categorias.length} categorías creadas/verificadas ✓`);

  // ─────────────────────────────────────────────
  // PLANTILLAS
  // ─────────────────────────────────────────────

  const plantillas = [
    {
      nombre: "Clásica",
      descripcion: "Diseño limpio y profesional. Ideal para cualquier tipo de negocio.",
      sortOrder: 1,
      activo: true,
      defaultConfig: {
        navbarStyle: "SOLID",
        heroLayout: "CENTERED",
        cardStyle: "ROUNDED",
        borderRadius: "MD",
      },
    },
    {
      nombre: "Moderna",
      descripcion: "Diseño contemporáneo con hero de pantalla completa.",
      sortOrder: 2,
      activo: true,
      defaultConfig: {
        navbarStyle: "TRANSPARENT",
        heroLayout: "FULLSCREEN",
        cardStyle: "MINIMAL",
        borderRadius: "LG",
      },
    },
    {
      nombre: "Boutique",
      descripcion: "Elegante y sofisticada. Perfecta para moda y accesorios.",
      sortOrder: 3,
      activo: true,
      defaultConfig: {
        navbarStyle: "STICKY",
        heroLayout: "SPLIT",
        cardStyle: "ELEGANT",
        borderRadius: "NONE",
      },
    },
    {
      nombre: "Colorida",
      descripcion: "Vibrante y alegre. Ideal para juguetes, regalos y artesanías.",
      sortOrder: 4,
      activo: true,
      defaultConfig: {
        navbarStyle: "SOLID",
        heroLayout: "LEFT",
        cardStyle: "PLAYFUL",
        borderRadius: "FULL",
      },
    },
  ];

  console.log("🎨 Creando plantillas...");
  for (const plantilla of plantillas) {
    await prisma.plantillaTienda.upsert({
      where: { id: plantillas.indexOf(plantilla) + 1 },
      update: {},
      create: plantilla,
    });
  }
  console.log(`   ${plantillas.length} plantillas creadas/verificadas ✓`);

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
