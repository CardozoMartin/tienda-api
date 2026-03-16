// Exportamos el cliente de Prisma como singleton.
// Esto evita crear múltiples conexiones en desarrollo con hot-reload de tsx.
import { PrismaClient } from "@prisma/client";

// Tipamos el objeto global para que TypeScript sepa que puede existir la propiedad prisma
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    // En desarrollo mostramos las queries, en producción solo errores
    log:
      process.env["NODE_ENV"] === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

// Solo guardamos en global si no estamos en producción
if (process.env["NODE_ENV"] !== "production") {
  globalForPrisma.prisma = prisma;
}
