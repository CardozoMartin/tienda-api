/** @type {import('jest').Config} */
// CONFIGURACIÓN GENERAL DE JEST PARA EL PROYECTO

module.exports = {
  // PRESET: Usa ts-jest para compilar TypeScript a JavaScript automáticamente
  // Esto permite escribir tests en TypeScript sin pre-compilar
  preset: 'ts-jest',

  // TESTENV IRONMENT: Usa Node.js (no navegador) porque es una API backend
  testEnvironment: 'node',
  
  // GLOBALS: Fija NODE_ENV='test' para que src/config/prisma.ts sepa que estamos en tests
  globals: {
    'ts-jest': {
      // Fija NODE_ENV='test' durante la compilación de tests
      envVars: {
        NODE_ENV: 'test',
      },
    },
  },

  // ROOTS: Busca tests solo dentro de src/
  // Así Jest no busca en node_modules o dist/
  roots: ['<rootDir>/src'],

  // TESTMATCH: Busca archivos con patrón **/__tests__/**/*.test.ts
  // Esto incluye tests en carpetas nombradas __tests__
  testMatch: ['**/__tests__/**/*.test.ts'],

  // SETUPFILES: Carga archivos ANTES de todos los tests
  // jest-setup-mocks.js: Configura los mocks globales de Prisma PRIMERO
  // jest-setup.js: Configura el require hook para interceptar imports
  setupFiles: ['<rootDir>/jest-setup-mocks.js', '<rootDir>/jest-setup.js'],

  // TRANSFORM: Especifica cómo compilar archivos .ts
  // ts-jest: El preset que instalamos, compila TypeScript a JavaScript
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },

  // MODULENAMEMAPPER: Mapea rutas de módulos a archivos reales
  // Ejemplo: import '@/config' se mapea a src/config
  moduleNameMapper: {
    '^@/(.*)': '<rootDir>/src/$1',
  },

  // TESTTIMEOUT: Tiempo máximo que un test puede tomar (milisegundos)
  // 30 segundos es suficiente para tests con Prisma
  testTimeout: 30000,
};

