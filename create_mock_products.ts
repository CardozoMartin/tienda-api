import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const tiendaRopa = await prisma.tienda.findUnique({ where: { slug: 'tienda-ropa' } });
  const tiendaJoyeria = await prisma.tienda.findUnique({ where: { slug: 'tienda-joyeria' } });

  if (tiendaRopa) {
    await prisma.producto.create({
      data: {
        tiendaId: tiendaRopa.id,
        nombre: 'Remera Pro',
        precio: 5000,
        descripcion: 'Remera de prueba',
        disponible: true,
        destacado: true,
        imagenPrincipalUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000&auto=format&fit=crop'
      }
    });
  }

  if (tiendaJoyeria) {
    await prisma.producto.create({
      data: {
        tiendaId: tiendaJoyeria.id,
        nombre: 'Anillo de Plata',
        precio: 15000,
        descripcion: 'Anillo de prueba',
        disponible: true,
        destacado: true,
        imagenPrincipalUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=1000&auto=format&fit=crop'
      }
    });
  }

  console.log('Products created for tienda-ropa and tienda-joyeria');
}

main().catch(console.error).finally(() => prisma.$disconnect());
