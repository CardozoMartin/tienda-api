import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Sincronizando métodos de pago y entrega...");

  // ── Métodos a ELIMINAR (ya no los usamos) ──────────────────────────────────
  const eliminar = [
    "Billetera Virtual (Ualá/MODO)",
    "Billetera Virtual",
    "Ualá",
    "MODO",
    "Cuenta DNI",
    "Naranja X",
  ];
  for (const nombre of eliminar) {
    await prisma.metodoPago.deleteMany({ where: { nombre } });
  }

  // ── Métodos de Pago activos ────────────────────────────────────────────────
  const metodosPago = [
    { nombre: "Efectivo",              icono: "payments",             descripcion: "Pago en mano al recibir o retirar",              orden: 1 },
    { nombre: "Transferencia Bancaria",icono: "account_balance",      descripcion: "CBU/Alias — enviá el comprobante por WhatsApp",   orden: 2 },
    { nombre: "Mercado Pago",          icono: "qr_code_2",            descripcion: "Checkout Pro — el cliente paga online con MP",    orden: 3 },
    { nombre: "Tarjeta de Crédito",    icono: "credit_card",          descripcion: "A través de Mercado Pago o POS físico",           orden: 4 },
    { nombre: "Tarjeta de Débito",     icono: "credit_card",          descripcion: "A través de Mercado Pago o POS físico",           orden: 5 },
  ];

  for (const mp of metodosPago) {
    await prisma.metodoPago.upsert({
      where: { nombre: mp.nombre },
      update: { icono: mp.icono, descripcion: mp.descripcion, orden: mp.orden, activo: true },
      create: { ...mp, activo: true },
    });
  }

  // ── Métodos de Entrega ─────────────────────────────────────────────────────
  const metodosEntrega = [
    { nombre: "Retiro en Local",       icono: "storefront",      descripcion: "Pasá por nuestra sucursal",                    permiteZona: false, orden: 1 },
    { nombre: "Envío a Domicilio",     icono: "local_shipping",  descripcion: "Entrega directa en tu puerta",                 permiteZona: true,  orden: 2 },
    { nombre: "Correo Argentino / OCA",icono: "package_2",       descripcion: "Envío nacional por correo",                    permiteZona: false, orden: 3 },
    { nombre: "Andreani",              icono: "package_2",       descripcion: "Envío nacional por Andreani",                  permiteZona: false, orden: 4 },
    { nombre: "Punto de Encuentro",    icono: "handshake",       descripcion: "Acordamos un lugar cómodo para los dos",       permiteZona: true,  orden: 5 },
    { nombre: "Motomensajería",        icono: "moped",           descripcion: "Envío rápido en el día (CABA / GBA)",          permiteZona: true,  orden: 6 },
  ];

  for (const me of metodosEntrega) {
    await prisma.metodoEntrega.upsert({
      where: { nombre: me.nombre },
      update: { icono: me.icono, descripcion: me.descripcion, permiteZona: me.permiteZona, orden: me.orden, activo: true },
      create: { ...me, activo: true },
    });
  }

  console.log("✅ Métodos sincronizados con éxito");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
