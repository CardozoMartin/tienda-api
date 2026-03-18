// jest-setup-mocks.js
console.log('[jest-setup-mocks.js] Configurando mock global de Prisma...');

// Solo mantenemos el global por si algún test lo referencia directamente
// El mapeo real lo hace Jest via moduleNameMapper en jest.config.js
global.PRISMA_MOCK = {
  usuario: {
    findUnique: jest.fn().mockResolvedValue(null),
    findFirst: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
  },
};

console.log('[jest-setup-mocks.js] Mock global configurado:', Object.keys(global.PRISMA_MOCK));
// ✅ Ya no necesitamos el interceptor manual de Module.prototype.require
