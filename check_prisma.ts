import { prisma } from './src/config/prisma';
async function main() {
  console.log('Prisma keys:', Object.keys(prisma));
  console.log('Prisma.carrito:', prisma.carrito);
}
main().catch(console.error);
