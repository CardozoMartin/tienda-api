import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const tiendas = await prisma.tienda.findMany({
    select: { slug: true, nombre: true, plantillaId: true }
  });
  console.log(JSON.stringify(tiendas, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
