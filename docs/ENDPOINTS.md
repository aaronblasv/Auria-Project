# AURIA — Contrato de la API

> **Este archivo es el contrato entre el backend (Symfony) y el frontend (Angular).**
>
> Si algo cambia aquí, las dos partes se actualizan inmediatamente. **No modifiques una ruta, un parámetro o una forma de respuesta sin avisar al otro y actualizar primero este documento.** El backend implementa lo que dice este archivo. El frontend consume lo que dice este archivo. Si la implementación y el contrato no coinciden, gana el contrato y se corrige la implementación.
>
> Versión actual: **1.0** — fecha: por definir

---

## Tabla de contenidos

1. [Convenciones generales](#1-convenciones-generales)
2. [Autenticación](#2-autenticación)
3. [Códigos HTTP y errores](#3-códigos-http-y-errores)
4. [Modelos (schemas)](#4-modelos-schemas)
5. [Endpoints públicos](#5-endpoints-públicos)
6. [Endpoints autenticados](#6-endpoints-autenticados)
7. [Flujos completos de ejemplo](#7-flujos-completos-de-ejemplo)
8. [Reglas de negocio que ambas partes deben respetar](#8-reglas-de-negocio)
9. [Versionado del contrato](#9-versionado-del-contrato)

---

## 1. Convenciones generales

### Base URL

| Entorno | URL |
|---|---|
| Desarrollo local | `http://localhost:8000/api` |
| Producción | `https://auria-api.onrender.com/api` *(provisional)* |

### Formato

- Todas las peticiones y respuestas son `application/json`.
- Codificación: UTF-8.
- Fechas: ISO 8601 con offset, ej. `2025-03-15T14:32:00+00:00`.
- Identificadores: enteros (`int`), no UUIDs.
- Booleanos: `true` / `false` (no `0`/`1`).

### Headers obligatorios

En toda petición:
```
Content-Type: application/json
Accept: application/json
```

En peticiones autenticadas, además:
```
Authorization: Bearer <jwt_token>
```

### CORS

El backend permite peticiones desde:
- `http://localhost:4200` (desarrollo Angular)
- La URL de producción del frontend (cuando se defina)

Ningún otro origen está permitido.

---

## 2. Autenticación

### Mecanismo

JWT (JSON Web Token) firmado con clave RSA. El token se obtiene en el login y se envía en cada petición autenticada en el header `Authorization`.

### Ciclo de vida

1. El usuario hace `POST /api/auth/login` con email y password.
2. El backend devuelve un token JWT con vida útil de **1 hora**.
3. El frontend guarda el token (recomendación: `localStorage` con clave `auria_token`).
4. El frontend envía el token en cada petición autenticada.
5. Cuando el token caduca, la API responde `401`. El frontend redirige al login.

### Estructura del JWT

Payload del token:
```json
{
  "iat": 1710515520,
  "exp": 1710519120,
  "roles": ["ROLE_USER"],
  "username": "juan@florida.edu"
}
```

El `username` es siempre el email. El `id` del usuario se obtiene con `GET /api/me`.

### Sin refresh token en v1

No hay refresh tokens. Cuando un token caduca, el usuario vuelve a hacer login. Línea futura.

---

## 3. Códigos HTTP y errores

### Códigos esperados

| Código | Significado | Cuándo lo usamos |
|---|---|---|
| 200 OK | Éxito con cuerpo | GETs, PATCHs |
| 201 Created | Recurso creado | POSTs de creación |
| 204 No Content | Éxito sin cuerpo | DELETEs |
| 400 Bad Request | Body malformado o parámetro inválido | JSON inválido, query param sin valor |
| 401 Unauthorized | Token ausente, inválido o caducado | El frontend redirige al login |
| 403 Forbidden | Autenticado pero sin permiso | Editar la oferta de otro usuario |
| 404 Not Found | Recurso no existe | ID inexistente |
| 409 Conflict | Conflicto de estado | Email ya registrado |
| 422 Unprocessable Entity | Validación fallida | Email inválido, password corta |
| 500 Internal Server Error | Bug del servidor | Cualquier excepción no controlada |

### Estructura de error genérica

Todas las respuestas de error usan este formato. **Sin excepciones.**

```json
{
  "error": "Descripción humana del problema",
  "code": 401,
  "details": []
}
```

### Estructura de error de validación (422)

Cuando el cuerpo no cumple validaciones, `details` se rellena con un array de errores por campo:

```json
{
  "error": "Error de validación",
  "code": 422,
  "details": [
    { "field": "email", "message": "Este email ya está en uso" },
    { "field": "password", "message": "La contraseña debe tener al menos 8 caracteres" }
  ]
}
```

### Reglas para el frontend

- Ante un `401`, borrar token y redirigir a `/login`.
- Ante un `403`, mostrar toast "No tienes permiso para esta acción".
- Ante un `422`, pintar los errores junto a los campos del formulario usando `details[].field`.
- Ante un `500`, mostrar mensaje genérico: "Algo ha ido mal, vuelve a intentarlo".

---

## 4. Modelos (schemas)

Las formas exactas de los objetos que se intercambian. **Si cambias un campo, lo cambias aquí primero, luego en backend, luego en frontend.**

### 4.1 User (perfil completo del usuario autenticado)

```json
{
  "id": 1,
  "email": "juan@florida.edu",
  "nombre": "Juan García",
  "foto": "https://example.com/foto.jpg",
  "cursoActual": {
    "id": 1,
    "grado": "DAW",
    "curso": 2
  },
  "contactoPreferido": "instagram",
  "contactoValor": "@juangarcia",
  "createdAt": "2025-03-15T14:32:00+00:00"
}
```

| Campo | Tipo | Notas |
|---|---|---|
| `id` | int | identificador |
| `email` | string | único, formato email válido |
| `nombre` | string | 2-80 caracteres |
| `foto` | string\|null | URL absoluta o null |
| `cursoActual` | object\|null | grado actual y curso (1-4) |
| `contactoPreferido` | string\|null | `"instagram"`, `"telefono"` o `"email"` |
| `contactoValor` | string\|null | handle, número o email según canal |
| `createdAt` | string | ISO 8601 |

La `password` **nunca** se devuelve en ninguna respuesta.

### 4.2 UserPublic (vista pública en búsquedas)

```json
{
  "id": 1,
  "nombre": "Juan García",
  "foto": "https://example.com/foto.jpg",
  "cursoActual": {
    "id": 1,
    "grado": "DAW",
    "curso": 2
  }
}
```

No incluye email, contacto ni fecha de registro. El contacto se obtiene aparte con `GET /api/users/{id}/contacto`.

### 4.3 Centro

```json
{
  "id": 1,
  "nombre": "Florida Universitària"
}
```

### 4.4 Grado

```json
{
  "id": 1,
  "nombre": "DAW",
  "centro": {
    "id": 1,
    "nombre": "Florida Universitària"
  }
}
```

### 4.5 Asignatura

```json
{
  "id": 5,
  "nombre": "Programación",
  "curso": 1,
  "grado": {
    "id": 1,
    "nombre": "DAW"
  }
}
```

`curso` es un entero del 1 al 4.

### 4.6 Oferta

```json
{
  "id": 12,
  "user": {
    "id": 1,
    "nombre": "Juan García",
    "foto": "https://example.com/foto.jpg",
    "cursoActual": { "id": 1, "grado": "DAW", "curso": 2 }
  },
  "asignatura": {
    "id": 5,
    "nombre": "Programación",
    "curso": 1,
    "grado": { "id": 1, "nombre": "DAW" }
  },
  "descripcionCorta": "Doy clases de Programación de 1º DAW",
  "createdAt": "2025-03-15T15:00:00+00:00"
}
```

| Campo | Tipo | Notas |
|---|---|---|
| `id` | int | |
| `user` | UserPublic | autor de la oferta |
| `asignatura` | Asignatura | qué se ofrece |
| `descripcionCorta` | string\|null | máximo 200 caracteres |
| `createdAt` | string | ISO 8601 |

### 4.7 Contacto

```json
{
  "preferido": "instagram",
  "valor": "@juangarcia"
}
```

### 4.8 LoginResponse

```json
{
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { /* User completo, ver 4.1 */ }
}
```

### 4.9 Listas

Las respuestas de listado son arrays JSON puros, no objetos envoltorio:

```json
[
  { "id": 1, "nombre": "DAW", "centro": { "id": 1, "nombre": "..." } },
  { "id": 2, "nombre": "ASIR", "centro": { "id": 1, "nombre": "..." } }
]
```

No hay paginación en v1. Si una lista crece mucho, ya añadiremos `?page=` y `?limit=`. Por ahora todo se devuelve.

---

## 5. Endpoints públicos

Endpoints que **no** requieren autenticación.

### 5.1 POST /api/auth/register

Crea un nuevo usuario.

**Request:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "juan@florida.edu",
  "password": "secreto123",
  "nombre": "Juan García"
}
```

**Response 201:**
```json
{
  "id": 1,
  "email": "juan@florida.edu",
  "nombre": "Juan García",
  "foto": null,
  "cursoActual": null,
  "contactoPreferido": null,
  "contactoValor": null,
  "createdAt": "2025-03-15T14:32:00+00:00"
}
```

**Errores:**
- `409` si el email ya existe.
- `422` si email inválido, password < 8 caracteres o nombre vacío.

**Notas:**
- El registro NO devuelve token. El frontend debe hacer login a continuación.
- El usuario queda creado con perfil mínimo. Tendrá que completar el onboarding después.

### 5.2 POST /api/auth/login

Devuelve un JWT.

**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "juan@florida.edu",
  "password": "secreto123"
}
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJSUzI1NiI...",
  "user": {
    "id": 1,
    "email": "juan@florida.edu",
    "nombre": "Juan García",
    "foto": null,
    "cursoActual": null,
    "contactoPreferido": null,
    "contactoValor": null,
    "createdAt": "2025-03-15T14:32:00+00:00"
  }
}
```

**Errores:**
- `401` si email o password incorrectos. El mensaje es siempre el mismo: `"Credenciales inválidas"` (no decimos cuál falló por seguridad).

---

## 6. Endpoints autenticados

Todos requieren `Authorization: Bearer <token>`. Si falta o es inválido, devuelven `401`.

### 6.1 GET /api/me

Devuelve los datos del usuario autenticado.

**Response 200:** objeto `User` (ver 4.1).

**Uso:**
- Justo después del login para refrescar datos.
- Al cargar la app si hay token guardado, para validar que sigue siendo válido.

### 6.2 PATCH /api/users/{id}

Actualiza los datos del usuario. Solo el propio usuario puede editarse.

**Request:** todos los campos son opcionales. Solo se actualizan los enviados.
```json
{
  "nombre": "Juan García López",
  "foto": "https://example.com/nueva.jpg",
  "cursoActual": { "asignaturaId": 5 },
  "contactoPreferido": "instagram",
  "contactoValor": "@juanito"
}
```

**Response 200:** objeto `User` actualizado.

**Errores:**
- `403` si intentas editar otro usuario.
- `422` validación fallida.

**Notas:**
- Para cambiar el curso actual, se envía `cursoActual` con `asignaturaId` (el id de cualquier asignatura del curso/grado actual del usuario). El backend deduce grado y curso a partir de esa asignatura.
- El email y la password no se editan desde aquí en v1.

### 6.3 GET /api/users/{id}

Devuelve la vista pública de un usuario.

**Response 200:** objeto `UserPublic` (ver 4.2).

**Errores:**
- `404` si no existe.

### 6.4 GET /api/users/{id}/contacto

Devuelve el canal de contacto de un usuario. Lo usa el frontend cuando el usuario hace clic en "Ver contacto" desde la pantalla de detalle de oferta.

**Response 200:** objeto `Contacto` (ver 4.7).

**Errores:**
- `404` si el usuario no existe.
- `404` si el usuario no tiene contacto configurado.

### 6.5 GET /api/centros

Lista todos los centros.

**Response 200:** array de `Centro`.

### 6.6 GET /api/grados

Lista grados, opcionalmente filtrados por centro.

**Query params:**
- `centro` (int, opcional): id del centro.

**Ejemplo:** `GET /api/grados?centro=1`

**Response 200:** array de `Grado`.

### 6.7 GET /api/asignaturas

Lista asignaturas, opcionalmente filtradas por grado y curso.

**Query params:**
- `grado` (int, opcional): id del grado.
- `curso` (int, opcional): número de curso (1-4).

**Ejemplo:** `GET /api/asignaturas?grado=1&curso=2`

**Response 200:** array de `Asignatura`.

### 6.8 GET /api/ofertas

Lista ofertas, **siempre con al menos un filtro** (asignatura o grado).

**Query params:**
- `asignatura` (int): id de la asignatura. Devuelve ofertas de esa asignatura concreta.
- `grado` (int): id del grado. Devuelve ofertas de cualquier asignatura de ese grado.
- `curso` (int, opcional): combinable con `grado`.

**Reglas:**
- Si no se pasa ni `asignatura` ni `grado`, responde `400`.
- `asignatura` tiene prioridad sobre `grado` si se pasan ambos.
- El usuario autenticado **no aparece** en sus propios resultados (no tiene sentido encontrarse a sí mismo).

**Ejemplos:**
- `GET /api/ofertas?asignatura=5`
- `GET /api/ofertas?grado=1`
- `GET /api/ofertas?grado=1&curso=2`

**Response 200:** array de `Oferta`.

### 6.9 GET /api/ofertas/me

Lista las ofertas del usuario autenticado.

**Response 200:** array de `Oferta`.

### 6.10 POST /api/ofertas

Crea una nueva oferta para el usuario autenticado.

**Request:**
```json
{
  "asignaturaId": 5,
  "descripcionCorta": "Doy clases de Programación de 1º DAW"
}
```

**Response 201:** objeto `Oferta` creado.

**Errores:**
- `404` si la asignatura no existe.
- `409` si el usuario ya tiene una oferta para esa asignatura (no se permiten duplicados).
- `422` si `descripcionCorta` supera 200 caracteres.

### 6.11 DELETE /api/ofertas/{id}

Elimina una oferta del usuario autenticado.

**Response 204:** sin cuerpo.

**Errores:**
- `404` si no existe.
- `403` si la oferta no pertenece al usuario autenticado.

---

## 7. Flujos completos de ejemplo

### 7.1 Registro y onboarding

```
1. POST /api/auth/register
   → 201 + User mínimo

2. POST /api/auth/login
   → 200 + token

3. GET /api/centros
   → array de centros

4. GET /api/grados?centro=1
   → array de grados del centro elegido

5. GET /api/asignaturas?grado=1&curso=2
   → asignaturas para que el usuario marque cuáles ofrece

6. PATCH /api/users/1
   body: { cursoActual: { asignaturaId: 5 }, contactoPreferido: "instagram", contactoValor: "@juan" }
   → User actualizado

7. POST /api/ofertas (repetido por cada asignatura marcada)
   body: { asignaturaId: 5, descripcionCorta: "..." }
   → 201 + Oferta
```

### 7.2 Buscar y contactar

```
1. GET /api/asignaturas?grado=1
   → para llenar un selector

2. GET /api/ofertas?asignatura=5
   → array de ofertas de esa asignatura

3. (usuario hace clic en una oferta)

4. GET /api/users/3/contacto
   → { preferido: "instagram", valor: "@maria" }

5. (frontend muestra el contacto)
```

### 7.3 Gestionar mis ofertas

```
1. GET /api/ofertas/me
   → mis ofertas

2. POST /api/ofertas
   body: { asignaturaId: 7 }
   → 201

3. DELETE /api/ofertas/12
   → 204
```

---

## 8. Reglas de negocio

Reglas que ambas partes deben respetar y que no son obvias del schema:

1. **Una oferta = un par (user, asignatura)**. No se permite que un usuario tenga dos ofertas de la misma asignatura. El backend valida esto y devuelve `409`.

2. **El usuario no se ve a sí mismo en los resultados de búsqueda**. El backend filtra al usuario autenticado de las respuestas de `/api/ofertas`.

3. **Eliminar una oferta no borra al usuario ni a la asignatura**. Solo desaparece la fila de la tabla `ofertas`.

4. **Eliminar un usuario** (no implementado en v1) eliminaría en cascada sus ofertas. Si se implementa, este contrato se actualiza.

5. **El email es único e inmutable**. No se puede cambiar desde `/api/users/{id}`.

6. **El campo `cursoActual` puede ser null**. Un usuario recién registrado no tiene curso hasta que completa el onboarding. El frontend debe manejar este caso.

7. **Los campos `contactoPreferido` y `contactoValor` pueden ser null** mientras el usuario no haya completado el perfil. La pantalla de contacto debe avisar si están vacíos.

8. **Validaciones del lado del backend** (también recomendadas en frontend para UX):
   - email: formato válido, único.
   - password: mínimo 8 caracteres.
   - nombre: 2-80 caracteres.
   - descripcionCorta: máximo 200 caracteres.
   - contactoPreferido: solo los valores `instagram`, `telefono` o `email`.
   - curso: entre 1 y 4.

---

## 9. Versionado del contrato

| Versión | Fecha | Cambios |
|---|---|---|
| 1.0 | _por definir_ | Versión inicial. Endpoints de auth, perfil, búsqueda, ofertas. |

**Reglas de versionado:**
- Cambios que rompen compatibilidad (renombrar campo, cambiar tipo, eliminar endpoint) suben la versión mayor (1.0 → 2.0).
- Cambios que añaden cosas sin romper (nuevo endpoint, campo opcional) suben la versión menor (1.0 → 1.1).
- Cualquier cambio se anota aquí con la fecha.

---

_Fin del contrato. Si tienes una duda y este archivo no la resuelve, pregunta al otro miembro del equipo y, una vez decidido, **actualiza este archivo primero**._
