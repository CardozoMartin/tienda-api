import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding categorías...');

  // Crear categoría padre
  const computacion = await prisma.categoria.upsert({
    where: { slug: 'computacion' },
    update: {},
    create: {
      nombre: 'Computación',
      slug: 'computacion',
      activa: true,
    },
  });
  console.log(`Creada/Encontrada categoría: ${computacion.nombre}`);

  // Crear subcategorías
  const subcategorias = [
    { nombre: 'Mouse', slug: 'mouse' },
    { nombre: 'Teclado', slug: 'teclado' },
    { nombre: 'Auriculares', slug: 'auriculares' },
  ];

  for (const sub of subcategorias) {
    const creada = await prisma.categoria.upsert({
      where: { slug: sub.slug },
      update: { padreId: computacion.id },
      create: {
        nombre: sub.nombre,
        slug: sub.slug,
        padreId: computacion.id,
        activa: true,
      },
    });
    console.log(`Creada/Encontrada subcategoría: ${creada.nombre} (Padre: ${computacion.nombre})`);
  }

  console.log('Seed completado.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
