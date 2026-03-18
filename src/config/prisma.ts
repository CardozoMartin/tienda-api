// Exportamos el cliente de Prisma como singleton.
// Esto evita crear múltiples conexiones en desarrollo con hot-reload de tsx.
import { PrismaClient } from "@prisma/client";

// Tipamos el objeto global para que TypeScript sepa que puede existir la propiedad prisma
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  PRISMA_MOCK?: any;  // Mock de Prisma configurado por Jest
};

// EXPLICACIÓN: En ambiente de test (Jest), devolvemos el mock global configurado
// Esto es más confiable que intentar interceptar require después del hecho
// El jest-setup-mocks.js configura globalThis.PRISMA_MOCK antes de ejecutar los tests
let PRISMAsINGLETON: PrismaClient | any;

if (globalForPrisma.PRISMA_MOCK) {
  // En tests, Jest ha configurado un mock global
  console.log('[src/config/prisma.ts] Usando PRISMA_MOCK de Jest');
  PRISMAsINGLETON = globalForPrisma.PRISMA_MOCK;
} else if (process.env.NODE_ENV === 'test') {
  // Si no hay PRISMA_MOCK aún (Jest aún no ha inicializado), devolvemos un objeto vacío
  // Que será reemplazado después
  console.log('[src/config/prisma.ts] NODE_ENV="test" pero sin PRISMA_MOCK, devolviendo objeto vacío');
  PRISMAsINGLETON = {};
} else {
  // En modo producción/desarrollo, creamos o reutilizamos la instancia real
  console.log('[src/config/prisma.ts] Modo productivo, creando/reutilizando PrismaClient real');
  PRISMAsINGLETON =
    globalForPrisma.prisma ??
    new PrismaClient({
      // En desarrollo mostramos las queries, en producción solo errores
      log:
        process.env["NODE_ENV"] === "development"
          ? ["query", "error", "warn"]
          : ["error"],
    });

  // Guardamos en global para compartir la misma instancia
  if (process.env.NODE_ENV !== 'production') {
    (globalForPrisma as any).prisma = PRISMAsINGLETON;
  }
}

export const prisma = PRISMAsINGLETON;
if (process.env["NODE_ENV"] !== "production") {
  globalForPrisma.prisma = prisma;
}
