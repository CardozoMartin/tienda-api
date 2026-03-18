/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json',
      },
    ],
  },
  // ✅ FIX 1: Decirle a Jest que ejecute este archivo antes de los tests
  setupFiles: ['<rootDir>/jest-setup-mocks.js'],
  moduleNameMapper: {
    // ✅ FIX 2: Mapear TODAS las variantes de la ruta, no solo una
    '^@/(.*)$': '<rootDir>/src/$1',
    '^.*config/prisma.*$': '<rootDir>/src/__mocks__/prisma.ts',
  },
  // ✅ FIX 3: resetMocks en lugar de clearMocks para restaurar implementaciones
  resetMocks: false,
  clearMocks: true,
};
