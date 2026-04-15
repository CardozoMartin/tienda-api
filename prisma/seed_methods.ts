import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Agregando nuevos métodos...");

  // 1. Métodos de Pago (5)
  const metodosPago = [
    { nombre: "Efectivo", icono: "payments", descripcion: "Pago en mano al recibir o retirar", orden: 1 },
    { nombre: "Transferencia Bancaria", icono: "account_balance", descripcion: "CBU/Alias (Enviar comprobante)", orden: 2 },
    { nombre: "Mercado Pago", icono: "qr_code_2", descripcion: "Link de pago o QR", orden: 3 },
    { nombre: "Tarjeta de Crédito/Débito", icono: "credit_card", descripcion: "A través de plataforma de pago", orden: 4 },
    { nombre: "Billetera Virtual (Ualá/MODO)", icono: "account_balance_wallet", descripcion: "Otras billeteras digitales", orden: 5 },
  ];

  for (const mp of metodosPago) {
    await prisma.metodoPago.upsert({
      where: { nombre: mp.nombre },
      update: {},
      create: mp,
    });
  }

  // 2. Métodos de Entrega (5)
  const metodosEntrega = [
    { nombre: "Retiro en Local", icono: "storefront", descripcion: "Podes pasar por nuestra sucursal", permiteZona: false, orden: 1 },
    { nombre: "Envío a Domicilio", icono: "local_shipping", descripcion: "Entrega directa en tu puerta", permiteZona: true, orden: 2 },
    { nombre: "Correo Argentino/OCA", icono: "package_2", descripcion: "Envío nacional por correo", permiteZona: false, orden: 3 },
    { nombre: "Punto de Encuentro", icono: "handshake", descripcion: "Acordamos un lugar intermedio", permiteZona: true, orden: 4 },
    { nombre: "Motomensajería", icono: "moped", descripcion: "Envío rápido en el día (CABA/GBA)", permiteZona: true, orden: 5 },
  ];

  for (const me of metodosEntrega) {
    await prisma.metodoEntrega.upsert({
      where: { nombre: me.nombre },
      update: {},
      create: me,
    });
  }

  console.log("✅ Métodos agregados con éxito");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
