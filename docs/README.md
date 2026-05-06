# AURIA

> Plataforma de apoyo educativo entre estudiantes del mismo centro. Marketplace estilo BlaBlaCar / Wallapop adaptado al ámbito académico: cada usuario puede ofrecerse para dar clases de las asignaturas que domina y, al mismo tiempo, buscar quién le ayude con las que se le atragantan.

---

## Tabla de contenidos

- [Concepto](#concepto)
- [Funcionalidades](#funcionalidades)
- [Stack técnico](#stack-técnico)
- [Arquitectura](#arquitectura)
- [Modelo de datos](#modelo-de-datos)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Puesta en marcha](#puesta-en-marcha)
- [API](#api)
- [Equipo](#equipo)
- [Documentación interna](#documentación-interna)
- [Roadmap](#roadmap)
- [Licencia](#licencia)

---

## Concepto

AURIA conecta estudiantes de un mismo centro educativo. Cada usuario es a la vez **ofertante** (puede dar clases de las asignaturas que ya ha aprobado) y **demandante** (puede buscar a un compañero que le explique algo). Los acuerdos económicos, si los hay, los gestionan los usuarios fuera de la plataforma; AURIA solo se ocupa de ponerles en contacto.

**Modelo conceptual (analogía TPV):**

- **Centros** → marca / cadena
- **Grados** (DAW, ASIR, DAM…) → familias de productos
- **Asignaturas** → productos concretos
- **Ofertas** → cada usuario marca qué "productos" domina y se ofrece a darlos

### Casos de uso principales

1. Un estudiante de 2º de DAW se ofrece para dar clases de asignaturas de 1º de DAW y de ASIR.
2. Un estudiante de 1º busca quién le pueda ayudar con "Programación" y la app le devuelve los compañeros disponibles.
3. Ambos intercambian contacto a través de la app y gestionan la clase por su cuenta.

---

## Funcionalidades

### Autenticación y perfil

- Registro de usuario con email y contraseña.
- Login con JWT (token con TTL de 1 hora).
- Onboarding guiado: centro → grado → curso actual → asignaturas que se ofrece a impartir.
- Edición del perfil: foto, nombre, curso actual, canal de contacto preferido (Instagram, teléfono o email).

### Búsqueda y descubrimiento

- Buscador por **grado** o por **asignatura concreta**.
- Listado de resultados con tarjetas que muestran foto, nombre y curso del oferente.
- Detalle de oferta con descripción y datos del usuario.
- Botón **"Ver contacto"** que muestra el canal preferido del oferente para contactar fuera de la app.
- El usuario autenticado nunca aparece en sus propios resultados de búsqueda.

### Gestión de ofertas

- Crear oferta para una asignatura concreta con descripción opcional (máx. 200 caracteres).
- Listar las ofertas propias.
- Eliminar ofertas propias (un usuario no puede borrar las de otro).
- Una oferta = un par único `(usuario, asignatura)`. No se permiten duplicados.

### Reglas de negocio destacadas

- El email es único e inmutable.
- La password nunca se devuelve en ninguna respuesta.
- Validaciones server-side: email válido, password ≥ 8 caracteres, nombre 2-80 caracteres, curso entre 1 y 4.
- Errores con formato unificado: `{ error, code, details }`.

---

## Stack técnico

| Capa | Tecnología | Versión |
|---|---|---|
| Frontend | Angular (standalone components, signals, RxJS) | 21.x |
| UI | Angular Material | última |
| Backend | PHP + Symfony | PHP 8.2+, Symfony 7.1 |
| Autenticación | LexikJWTAuthenticationBundle (JWT firmado con RSA) | última |
| ORM | Doctrine con migraciones versionadas | última |
| Base de datos | MySQL | 8.x |
| CORS | NelmioCorsBundle | última |
| Control de versiones | Git + GitHub | mono-repo |

### Dependencias clave

**Backend:**
```
lexik/jwt-authentication-bundle
nelmio/cors-bundle
doctrine/doctrine-fixtures-bundle
symfony/maker-bundle (dev)
```

**Frontend:**
```
@angular/material
```

---

## Arquitectura

Tres capas desacopladas que se comunican por HTTP + JSON con autenticación por JWT:

```
┌─────────────────────────────────────────────────────────┐
│  FRONTEND — Angular (SPA)                               │
│  Standalone components · Signals · RxJS · JWT Interceptor│
└────────────────────────┬────────────────────────────────┘
                         │  HTTP + JSON
                         │  Authorization: Bearer <JWT>
┌────────────────────────▼────────────────────────────────┐
│  BACKEND — Symfony API                                  │
│  Controllers · Doctrine ORM · Security (JWT) · CORS     │
└────────────────────────┬────────────────────────────────┘
                         │  SQL via Doctrine
┌────────────────────────▼────────────────────────────────┐
│  DATOS — MySQL                                          │
│  5 tablas: users, centros, grados, asignaturas, ofertas │
└─────────────────────────────────────────────────────────┘
```

---

## Modelo de datos

```
Centro 1 ─── N Grado 1 ─── N Asignatura 1 ─── N Oferta N ─── 1 User
```

### Entidades

- **User** — `id`, `email` (único), `password` (hash), `nombre`, `foto`, `cursoActual` (FK Asignatura), `contactoPreferido` (`instagram` | `telefono` | `email`), `contactoValor`, `createdAt`.
- **Centro** — `id`, `nombre`.
- **Grado** — `id`, `nombre` (DAW, ASIR…), `centro` (FK).
- **Asignatura** — `id`, `nombre`, `curso` (1-4), `grado` (FK).
- **Oferta** — `id`, `user` (FK), `asignatura` (FK), `descripcionCorta`, `createdAt`. Constraint único en `(user, asignatura)`.

---

## Estructura del repositorio

Mono-repo con dos proyectos independientes:

```
auria/
├── api/                  # Backend Symfony
│   ├── config/
│   ├── migrations/
│   ├── src/
│   │   ├── Controller/
│   │   ├── Entity/
│   │   ├── Repository/
│   │   ├── EventListener/
│   │   └── DataFixtures/
│   └── composer.json
│
├── front/                # Frontend Angular
│   ├── src/
│   │   └── app/
│   │       ├── core/         # services, guards, interceptors, models
│   │       ├── features/     # login, register, onboarding, profile, home, ofertas
│   │       └── shared/       # header, oferta-card
│   └── package.json
│
├── AURIA.md              # documento maestro del proyecto
├── ENDPOINTS.md          # contrato API (fuente de verdad)
├── BACKEND.md            # guía de implementación del backend
├── FRONTEND.md           # guía de implementación del frontend
└── README.md
```

---

## Puesta en marcha

### Pre-requisitos

```bash
php --version          # 8.2 o superior
composer --version     # 2.x
symfony --version      # Symfony CLI
mysql --version        # 8.x
node --version         # 20.x LTS o superior
ng version             # Angular CLI 21.x
```

### Clonar el repositorio

```bash
git clone https://github.com/<usuario>/auria.git
cd auria
```

### Backend

```bash
cd api
composer install
cp .env .env.local
# editar .env.local con la cadena de conexión a MySQL y secretos JWT
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate
php bin/console lexik:jwt:generate-keypair
php bin/console doctrine:fixtures:load --no-interaction
symfony serve
```

API disponible en `http://localhost:8000`.

### Frontend

```bash
cd front
npm install
ng serve
```

Aplicación disponible en `http://localhost:4200`.

### Variables de entorno

`api/.env.local` (no commitear):

```env
DATABASE_URL="mysql://root:@127.0.0.1:3306/auria?serverVersion=8.0&charset=utf8mb4"
APP_SECRET=<cadena_aleatoria_larga>
JWT_SECRET_KEY=%kernel.project_dir%/config/jwt/private.pem
JWT_PUBLIC_KEY=%kernel.project_dir%/config/jwt/public.pem
JWT_PASSPHRASE=<passphrase>
CORS_ALLOW_ORIGIN='^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$'
```

### Usuario de prueba (creado por las fixtures)

```
email:    demo@florida.edu
password: demo1234
```

---

## API

La especificación completa de la API (rutas, parámetros, payloads, códigos HTTP, esquemas de respuesta y reglas de negocio) está en **[`ENDPOINTS.md`](./ENDPOINTS.md)**, que actúa como **contrato** entre frontend y backend.

### Resumen de endpoints

**Públicos:**

| Método | Ruta | Propósito |
|---|---|---|
| POST | `/api/auth/register` | Alta de usuario |
| POST | `/api/auth/login` | Login, devuelve `{ token, user }` |

**Autenticados** (`Authorization: Bearer <token>`):

| Método | Ruta | Propósito |
|---|---|---|
| GET | `/api/me` | Datos del usuario autenticado |
| PATCH | `/api/users/{id}` | Editar perfil propio |
| GET | `/api/users/{id}` | Vista pública de un usuario |
| GET | `/api/users/{id}/contacto` | Canal de contacto del usuario |
| GET | `/api/centros` | Listar centros |
| GET | `/api/grados?centro={id}` | Grados de un centro |
| GET | `/api/asignaturas?grado={id}&curso={n}` | Asignaturas filtradas |
| GET | `/api/ofertas?asignatura={id}` | Buscar ofertas por asignatura |
| GET | `/api/ofertas?grado={id}&curso={n}` | Buscar ofertas por grado |
| GET | `/api/ofertas/me` | Mis ofertas |
| POST | `/api/ofertas` | Crear oferta propia |
| DELETE | `/api/ofertas/{id}` | Eliminar oferta propia |

### Formato de errores

Todas las respuestas de error siguen este formato sin excepciones:

```json
{
  "error": "Descripción humana del problema",
  "code": 401,
  "details": []
}
```

Los errores de validación (`422`) rellenan `details` con un array de `{ field, message }` por cada campo erróneo.

---

## Equipo

| Persona | Rol | Responsabilidades |
|---|---|---|
| Aarón | Frontend | Angular, Angular Material, integración con la API, UX |
| Miguel | Backend | Symfony, Doctrine, MySQL, autenticación JWT, endpoints |

Cualquier cambio en la API se acuerda entre ambos y se actualiza **primero** en `ENDPOINTS.md` antes de tocar código.

---

## Documentación interna

| Archivo | Propósito |
|---|---|
| [`AURIA.md`](./AURIA.md) | Documento maestro del proyecto: estado actual, decisiones, bitácora, roadmap, dudas abiertas. Fuente única de verdad. |
| [`ENDPOINTS.md`](./ENDPOINTS.md) | Contrato de la API. Si la implementación y este archivo no coinciden, gana este archivo. |
| [`BACKEND.md`](./BACKEND.md) | Guía paso a paso para implementar el backend en Symfony. |
| [`FRONTEND.md`](./FRONTEND.md) | Guía paso a paso para implementar el frontend en Angular. |

---

## Roadmap

- **Fase 0 — Preparación:** repositorio, herramientas instaladas, inventario de grados y asignaturas.
- **Fase 1 — Backend:** entidades, migraciones, fixtures, JWT, CORS, endpoints.
- **Fase 2 — Frontend con auth y perfil:** login, registro, onboarding, edición de perfil.
- **Fase 3 — Búsqueda, detalle y pulido:** home, resultados, detalle de oferta, mis ofertas, estados vacíos.
- **Fase 4 — Cierre y entrega:** despliegue, fixtures en producción, memoria, demo.

### Líneas futuras (fuera del MVP)

- Sistema de valoración de oferentes (estrellas tras la clase).
- Chat interno (probablemente nunca; mejor que se contacten fuera).
- Verificación de matrícula vía email institucional.
- Subida de foto de perfil (gestión de archivos en backend).
- Gamificación (insignias, ranking de ayudantes más activos).
- App móvil nativa.

---

## Convenciones

- **Git:** rama principal `main` protegida. Una rama por feature (`feat/`, `fix/`, `docs/`, `refactor:`, `chore:`). PR obligatorio con revisión del compañero.
- **PHP/Symfony:** PSR-12. Entidades en singular y PascalCase.
- **Angular:** componentes en PascalCase, archivos en kebab-case, servicios en camelCase.
- **Mensajes de commit:** en imperativo y con prefijo (`feat:`, `fix:`, `docs:`…).

---

## Licencia

Proyecto académico. Uso educativo.

---

_Última actualización del README: pendiente. Para cualquier duda sobre el estado actual del proyecto, ver `AURIA.md`._
