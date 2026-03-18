// src/__mocks__/prisma.ts
const prisma = {
  usuario: {
    findUnique: jest.fn().mockResolvedValue(null),
    findFirst: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
  },
};

export { prisma };
export default prisma;
