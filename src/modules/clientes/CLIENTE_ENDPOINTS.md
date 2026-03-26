# 🔐 Módulo de Autenticación de Clientes

## Endpoints Disponibles

### Públicos (sin autenticación)

### 1. **Registro de Cliente**

```
POST /api/v1/clientes/registro
```

**Body:**

```json
{
  "tiendaId": 1,
  "email": "cliente@example.com",
  "nombre": "Juan",
  "apellido": "Pérez",
  "telefono": "555123456",
  "password": "SecurePass123"
}
```

**Response (201):**

```json
{
  "exito": true,
  "datos": {
    "id": 1,
    "email": "cliente@example.com",
    "nombre": "Juan",
    "apellido": "Pérez",
    "mensaje": "Registro exitoso. Por favor verifica tu email."
  },
  "mensaje": "Cliente registrado correctamente"
}
```

---

### 2. **Login de Cliente**

```
POST /api/v1/clientes/login
```

**Body:**

```json
{
  "tiendaId": 1,
  "email": "cliente@example.com",
  "password": "SecurePass123"
}
```

**Response (200):**

```json
{
  "exito": true,
  "datos": {
    "id": 1,
    "email": "cliente@example.com",
    "nombre": "Juan",
    "apellido": "Pérez",
    "telefono": "555123456",
    "emailVerificado": false,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "mensaje": "Login exitoso"
}
```

---

### 3. **Verificar Email**

```
GET /api/v1/clientes/verificar-email/:token
```

Se envía por email automáticamente después de registro. El cliente hace click en el link y se verifica.

**Response (200):**

```json
{
  "exito": true,
  "datos": {
    "mensaje": "Email verificado correctamente"
  }
}
```

---

## Protegidos (requieren JWT en header)

### 4. **Obtener Perfil**

```
GET /api/v1/clientes/perfil
Authorization: Bearer <TOKEN>
```

**Response (200):**

```json
{
  "exito": true,
  "datos": {
    "id": 1,
    "tiendaId": 1,
    "email": "cliente@example.com",
    "nombre": "Juan",
    "apellido": "Pérez",
    "telefono": "555123456",
    "emailVerificado": true,
    "activo": true,
    "creadoEn": "2026-03-25T10:30:00Z",
    "actualizadoEn": "2026-03-25T10:30:00Z"
  },
  "mensaje": "Perfil obtenido"
}
```

---

### 5. **Actualizar Perfil**

```
PUT /api/v1/clientes/perfil
Authorization: Bearer <TOKEN>
```

**Body (todos opcionales):**

```json
{
  "nombre": "Juan Nuevo",
  "apellido": "García",
  "telefono": "555789123"
}
```

**Response (200):**

```json
{
  "exito": true,
  "datos": {
    "id": 1,
    "email": "cliente@example.com",
    "nombre": "Juan Nuevo",
    "apellido": "García",
    "telefono": "555789123",
    "mensaje": "Perfil actualizado correctamente"
  }
}
```

---

### 6. **Cambiar Contraseña**

```
POST /api/v1/clientes/cambiar-password
Authorization: Bearer <TOKEN>
```

**Body:**

```json
{
  "passwordActual": "SecurePass123",
  "passwordNueva": "NuevaPass456",
  "passwordConfirmar": "NuevaPass456"
}
```

**Response (200):**

```json
{
  "exito": true,
  "datos": {
    "mensaje": "Contraseña cambiada correctamente"
  }
}
```

---

## Validaciones

### Password

- Mínimo 8 caracteres
- Debe contener mayúscula, minúscula y número
- Ejemplo: `SecurePass123` ✅

### Email

- Válido y único por tienda
- Se convierte a minúscula automáticamente

### Teléfono

- Mínimo 8 caracteres
- Máximo 30 caracteres

---

## Errores Comunes

| Código | Mensaje                                        | Solución                       |
| ------ | ---------------------------------------------- | ------------------------------ |
| 409    | "Este email ya está registrado en esta tienda" | Usa otro email o intenta login |
| 401    | "Email o contraseña incorrectos"               | Verifica credentials           |
| 403    | "Esta cuenta ha sido desactivada"              | Contacta al admin              |
| 400    | "Token inválido o expirado"                    | Solicita nuevo token           |
| 404    | "Cliente no encontrado"                        | ID de cliente no válido        |

---

## Notas Técnicas

- **JWT expira en:** 7 días
- **Token de verificación expira en:** 24 horas
- **Contraseñas:** Hasheadas con bcrypt (12 rounds)
- **Mismo email:** Puede existir en distintas tiendas (relación tiendaId + email)
- **Autenticación:** Bearer token en header `Authorization: Bearer <TOKEN>`
