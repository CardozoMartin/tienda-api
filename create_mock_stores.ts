import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Create users
  const userRopa = await prisma.usuario.upsert({
    where: { email: 'user-ropa@test.com' },
    update: {},
    create: {
      nombre: 'User', apellido: 'Ropa', email: 'user-ropa@test.com', passwordHash: 'hash', rol: 'OWNER', activo: true, emailVerificado: true
    }
  });

  const userJoyeria = await prisma.usuario.upsert({
    where: { email: 'user-joyeria@test.com' },
    update: {},
    create: {
      nombre: 'User', apellido: 'Joyeria', email: 'user-joyeria@test.com', passwordHash: 'hash', rol: 'OWNER', activo: true, emailVerificado: true
    }
  });

  // Create stores
  await prisma.tienda.upsert({
    where: { slug: 'tienda-ropa' },
    update: { plantillaId: 1 },
    create: {
      usuarioId: userRopa.id, slug: 'tienda-ropa', nombre: 'Tienda Ropa', plantillaId: 1, activa: true, publica: true
    }
  });

  await prisma.tienda.upsert({
    where: { slug: 'tienda-joyeria' },
    update: { plantillaId: 3 },
    create: {
      usuarioId: userJoyeria.id, slug: 'tienda-joyeria', nombre: 'Tienda Joyeria', plantillaId: 3, activa: true, publica: true
    }
  });

  console.log('Stores created: tienda-ropa, tienda-joyeria');
}

main().catch(console.error).finally(() => prisma.$disconnect());
