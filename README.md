# Tienda API

API REST para plataforma de tiendas online. Desarrollada con Express + TypeScript + Prisma + MySQL.

## Stack

- **Runtime:** Node.js 22
- **Framework:** Express + TypeScript
- **ORM:** Prisma
- **DB:** MySQL
- **Validación:** Zod
- **Auth:** JWT (access + refresh tokens)
- **Seguridad:** Helmet, CORS, Rate Limiting

## Estructura del proyecto

```
src/
├── config/
│   ├── env.ts              # Variables de entorno tipadas y validadas
│   └── prisma.ts           # Singleton del cliente Prisma
├── middleware/
│   ├── auth.middleware.ts  # autenticar(), autorizar(), verificarPropietario()
│   ├── errores.middleware.ts  # Manejador global de errores + 404
│   └── validar.middleware.ts  # Validación con Zod
├── modules/
│   ├── auth/               # Registro, login, refresh, reset password
│   ├── tiendas/            # CRUD tienda, tema, métodos pago/entrega, carrusel
│   ├── productos/          # CRUD productos, variantes, imágenes, tags
│   ├── resenas/            # Reseñas de tiendas y productos con moderación
│   └── admin/              # Categorías, plantillas, métodos, usuarios
├── types/
│   └── index.ts            # Tipos globales: ErrorApi, JwtPayload, paginación
├── utils/
│   └── helpers.ts          # responderOk, paginación, slugs
├── app.ts                  # Configuración Express con middlewares
├── router.ts               # Router principal con todos los módulos
└── server.ts               # Entry point con graceful shutdown
prisma/
├── schema.prisma           # Modelo de datos completo
└── seed.ts                 # Datos iniciales del sistema
```

## Patrón aplicado

**Repository → Service → Controller → Route** por módulo:

- **Repository:** solo operaciones de DB (Prisma). Sin lógica de negocio.
- **Service:** lógica de negocio, validaciones de dominio, orquestación.
- **Controller:** recibe request HTTP, llama al service, envía respuesta.
- **Route:** define rutas, aplica middlewares de auth/validación.

## Instalación y configuración

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno
cp .env.example .env

# 3. Editar .env con tus valores reales
# DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET son obligatorios

# 4. Generar cliente Prisma
npm run prisma:generate

# 5. Ejecutar migraciones
npm run prisma:migrate

# 6. Cargar datos iniciales (métodos de pago, categorías, plantillas, admin)
npm run prisma:seed

# 7. Iniciar en desarrollo
npm run dev
```

## Variables de entorno requeridas

```env
DATABASE_URL="mysql://user:pass@localhost:3306/tienda_db"
JWT_SECRET="secreto_muy_largo_y_seguro"
JWT_REFRESH_SECRET="otro_secreto_diferente"
```

## Endpoints principales

### Auth (`/api/v1/auth`)
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| POST | `/registro` | Público | Crear cuenta |
| POST | `/login` | Público | Iniciar sesión |
| POST | `/refresh` | Público | Renovar access token |
| GET | `/verificar-email/:token` | Público | Verificar email |
| POST | `/solicitar-reset` | Público | Solicitar reset de password |
| POST | `/confirmar-reset` | Público | Confirmar reset con token |
| PUT | `/cambiar-password` | Autenticado | Cambiar password |

### Tiendas (`/api/v1/tiendas`)
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/` | Público | Directorio de tiendas |
| GET | `/:slug` | Público | Vista pública de tienda |
| GET | `/mi-tienda` | Owner | Panel de mi tienda |
| POST | `/` | Owner | Crear tienda |
| PUT | `/mi-tienda` | Owner | Actualizar tienda |
| PUT | `/mi-tienda/tema` | Owner | Actualizar apariencia |
| POST | `/mi-tienda/metodos-pago` | Owner | Agregar método de pago |
| DELETE | `/mi-tienda/metodos-pago/:id` | Owner | Quitar método de pago |
| POST | `/mi-tienda/metodos-entrega` | Owner | Agregar método de entrega |
| DELETE | `/mi-tienda/metodos-entrega/:id` | Owner | Quitar método de entrega |
| POST | `/mi-tienda/carrusel` | Owner | Agregar imagen al carrusel |
| DELETE | `/mi-tienda/carrusel/:id` | Owner | Quitar imagen del carrusel |
| PUT | `/mi-tienda/carrusel/reordenar` | Owner | Reordenar carrusel |

### Productos (`/api/v1`)
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/tiendas/:tiendaId/productos` | Público | Catálogo público |
| GET | `/tiendas/:tiendaId/productos/:id` | Público | Detalle de producto |
| GET | `/mis-productos` | Owner | Mis productos (admin) |
| POST | `/mis-productos` | Owner | Crear producto |
| PUT | `/mis-productos/:id` | Owner | Actualizar producto |
| DELETE | `/mis-productos/:id` | Owner | Eliminar producto |
| PUT | `/mis-productos/:id/tags` | Owner | Actualizar tags |
| POST | `/mis-productos/:id/imagenes` | Owner | Agregar imagen |
| DELETE | `/mis-productos/:id/imagenes/:imgId` | Owner | Quitar imagen |
| POST | `/mis-productos/:id/variantes` | Owner | Agregar variante |
| PUT | `/mis-productos/:id/variantes/:vId` | Owner | Actualizar variante |
| DELETE | `/mis-productos/:id/variantes/:vId` | Owner | Eliminar variante |

### Reseñas (`/api/v1`)
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/tiendas/:id/resenas` | Público | Reseñas de tienda |
| GET | `/tiendas/:id/resenas/estadisticas` | Público | Promedio y distribución |
| POST | `/tiendas/:id/resenas` | Público/Auth | Dejar reseña |
| GET | `/tiendas/:id/resenas/pendientes` | Owner | Reseñas por aprobar |
| PATCH | `/tiendas/:id/resenas/:rid/aprobar` | Owner | Aprobar reseña |
| PATCH | `/tiendas/:id/resenas/:rid/rechazar` | Owner | Rechazar reseña |
| POST | `/tiendas/:id/resenas/:rid/responder` | Owner | Responder reseña |
| DELETE | `/tiendas/:id/resenas/:rid` | Owner | Eliminar reseña |
| GET | `/mis-productos/:id/resenas` | Público | Reseñas de producto |
| POST | `/mis-productos/:id/resenas` | Público/Auth | Dejar reseña |

### Admin (`/api/v1/admin`) — Solo rol ADMIN
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/dashboard` | Estadísticas del sistema |
| CRUD | `/categorias` | Gestionar categorías |
| CRUD | `/metodos-pago` | Gestionar métodos de pago |
| CRUD | `/metodos-entrega` | Gestionar métodos de entrega |
| CRUD | `/plantillas` | Gestionar plantillas |
| GET | `/usuarios` | Listar usuarios |
| PATCH | `/usuarios/:id/rol` | Cambiar rol |
| PATCH | `/usuarios/:id/activo` | Activar/desactivar |

## Formato de respuestas

Todas las respuestas siguen el mismo formato:

```json
// Éxito
{
  "ok": true,
  "mensaje": "Operación exitosa",
  "datos": { ... }
}

// Error
{
  "ok": false,
  "mensaje": "Descripción del error",
  "errores": ["campo: mensaje de validación"]
}

// Paginado
{
  "ok": true,
  "mensaje": "Consulta exitosa",
  "datos": [...],
  "paginacion": {
    "total": 150,
    "pagina": 1,
    "limite": 20,
    "totalPaginas": 8
  }
}
```

## Autenticación

```http
Authorization: Bearer <access_token>
```

El access token dura 7 días por defecto. Cuando expira, usar el endpoint `/auth/refresh` con el refresh token (30 días) para obtener uno nuevo sin tener que volver a hacer login.

## Roles

- **CLIENT:** usuario registrado. Puede dejar reseñas.
- **OWNER:** dueño de tienda. Puede crear/gestionar su tienda y productos.
- **ADMIN:** acceso total al sistema.

Para que un usuario pueda crear una tienda, un admin debe cambiarle el rol a OWNER mediante `PATCH /api/v1/admin/usuarios/:id/rol`.

## Escalabilidad futura

El sistema fue diseñado para escalar sin romper lo existente:

- **Stock e inventario:** agregar campos `stock` y `stockMinimo` a `ProductoVariante` + tabla `MovimientoInventario`. Los repositories ya están aislados.
- **Órdenes/ventas:** agregar módulo `ordenes` con sus propias entidades. No interfiere con el catálogo actual.
- **Multi-tienda:** cambiar `@unique` en `Tienda.usuarioId` a un índice normal. El service ya tiene la lógica separada.
- **Pagos online:** integrar pasarela en el módulo de órdenes sin tocar tiendas/productos.
