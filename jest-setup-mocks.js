// FILE: jest-setup-mocks.js
// PROPÓSITO: Configurar los mocks globales ANTES de que cualquier test file se cargue
// Este archivo se ejecuta UNA SOLA VEZ al inicio de la suite de tests

// Crear un mock global de Prisma que será shared entre todos los tests
console.log('[jest-setup-mocks.js] Configurando mock global de Prisma...');

global.PRISMA_MOCK = {
  usuario: {
    findUnique: jest.fn().mockResolvedValue(null),
    findFirst: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
  },
};

console.log('[jest-setup-mocks.js] Mock global configurado:', Object.keys(global.PRISMA_MOCK));

// Interceptar Module.require para devolver el mock cuando se importa config/prisma
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(moduleId) {
  // EXPLICACIÓN: Verificamos si el módulo solicitado es config/prisma
  // Puede venir de varias formas: './config/prisma', '../../config/prisma', 'config/prisma', etc.
  if (
    moduleId.includes('config/prisma') ||
    moduleId.includes('config\\prisma')  // Windows path
  ) {
    console.log(`[jest-setup-mocks.js] ✓ Interceptado require de "${moduleId}", devolviendo mock`);
    return { prisma: global.PRISMA_MOCK };
  }
  
  // Para cualquier otro módulo, usar el require original
  return originalRequire.call(this, moduleId);
};

console.log('[jest-setup-mocks.js] Interceptor de require configurado ✓');
