# GUÍA PARA MIGUEL — Traspaso del backend de AURIA

> Hola Miguel. Este archivo es el resumen ejecutivo de todo lo que he montado para que puedas arrancar tu parte del proyecto sin tener que digerir los 4 documentos largos del repositorio de golpe. Te voy a contar **qué hay hecho**, **qué tienes que hacer tú**, y **dónde encontrar el detalle** cuando lo necesites.

---

## Tabla de contenidos

1. [TL;DR — empieza aquí](#1-tldr--empieza-aquí)
2. [Qué es AURIA en una página](#2-qué-es-auria-en-una-página)
3. [Lo que ya está hecho (mi parte de planificación)](#3-lo-que-ya-está-hecho)
4. [Lo que tienes que hacer tú](#4-lo-que-tienes-que-hacer-tú)
5. [Hoja de ruta paso a paso](#5-hoja-de-ruta-paso-a-paso)
6. [Reglas de oro que no puedes saltarte](#6-reglas-de-oro)
7. [Mapa de archivos: dónde está cada cosa](#7-mapa-de-archivos)
8. [Checklist de avance](#8-checklist-de-avance)
9. [Cómo coordinarnos](#9-cómo-coordinarnos)

---

## 1. TL;DR — empieza aquí

Si solo lees una sección de este archivo, que sea esta:

1. **Lee `ENDPOINTS.md` antes de tocar código.** Es el contrato. Define qué tienes que devolver, con qué forma y bajo qué reglas. Si tu implementación no coincide con ese archivo, gana el archivo y se corrige el código (no al revés).
2. **`BACKEND.md` es tu manual de instrucciones.** Tiene el código completo, casi copiar-pegar, de las entidades, los controllers, la configuración de JWT y CORS, las fixtures y los listeners. Síguelo en orden.
3. **`AURIA.md` es la "fuente de verdad" general.** Allí está el estado del proyecto, decisiones tomadas, dudas abiertas y la bitácora. Léelo al empezar y al terminar cada sesión.
4. **El stack es fijo:** Symfony 7.1 + PHP 8.2+ + Doctrine + MySQL 8 + LexikJWT + NelmioCors. No metas nada más sin avisar.
5. **Estructura del repo:** mono-repo con `/api` (lo tuyo) y `/front` (lo mío).

Tu primer hito es: **levantar el backend, hacer login desde Postman/curl, recibir un JWT y consultar `GET /api/centros` con el token**. Cuando eso funcione, el 60% del trabajo está hecho.

---

## 2. Qué es AURIA en una página

App de apoyo educativo entre estudiantes del mismo centro. Cada usuario:

- Marca qué asignaturas domina y se ofrece a darlas (ofertas).
- Busca compañeros que se ofrezcan en una asignatura concreta.
- Cuando encuentra a uno, ve su canal de contacto preferido (Instagram, teléfono o email) y le contacta **fuera de la app**.

Sin pasarela de pagos. Sin chat interno. Sin gamificación. Es un **directorio inteligente** con login, perfil y CRUD de ofertas.

**Modelo mental tipo TPV:** Centros → Grados → Asignaturas → Ofertas. Un user tiene N ofertas, cada oferta apunta a una asignatura.

---

## 3. Lo que ya está hecho

Lo que he dejado preparado antes de pasarte la pelota:

### 3.1 Documentación completa (en la raíz del repo)

| Archivo | Qué es |
|---|---|
| **`AURIA.md`** | Documento maestro: concepto, equipo, stack, modelo de datos, roadmap por fases, decision log, dudas abiertas, setup local, convenciones de Git y código, bitácora. **Léelo el primer día**. |
| **`ENDPOINTS.md`** | Contrato de la API. Rutas exactas, payloads de entrada y salida, códigos HTTP, formato unificado de errores, reglas de negocio. **Es la fuente de verdad para ti y para mí**. |
| **`BACKEND.md`** | Guía completa de implementación del backend con código casi listo para copiar. Pre-requisitos, estructura de directorios, entidades, migraciones, JWT, CORS, controllers, fixtures, troubleshooting. **Es tu manual**. |
| **`FRONTEND.md`** | La guía equivalente para Angular. No es tuya, pero échale un ojo para entender qué espera consumir el frontend. |

### 3.2 Decisiones técnicas ya tomadas (no las tienes que repensar)

- Symfony 7.1 + API a mano (no API Platform) — controllers explícitos, más control y mejor para la memoria académica.
- JWT con LexikJWTAuthenticationBundle, **TTL 1 hora**, sin refresh token en v1.
- `json_login` del firewall de Symfony para el endpoint de login.
- Mono-repo con `/api` y `/front`.
- MySQL 8 (vale MariaDB).
- Datos seed reales del centro (Florida Universitària: DAW, ASIR, DAM y sus asignaturas) — más creíble que `lorem ipsum` en la demo.
- Errores con formato unificado: `{ error, code, details }`. **Sin excepciones.**
- Grupos de serialización de Symfony (`#[Groups]`) para controlar qué se devuelve en cada endpoint sin tener que escribir DTOs aparte.

### 3.3 El modelo de datos completo

Cinco entidades, cinco tablas:

```
Centro 1 ─── N Grado 1 ─── N Asignatura 1 ─── N Oferta N ─── 1 User
```

- **User**: id, email único, password (hash), nombre, foto, cursoActual (FK Asignatura, nullable), contactoPreferido (`instagram`/`telefono`/`email`), contactoValor, createdAt.
- **Centro**: id, nombre.
- **Grado**: id, nombre, centro (FK).
- **Asignatura**: id, nombre, curso (1-4), grado (FK).
- **Oferta**: id, user (FK), asignatura (FK), descripcionCorta (≤200 chars), createdAt. Constraint único en `(user, asignatura)`.

En `BACKEND.md` sección 5 tienes el código PHP completo de cada entidad con sus relaciones, validaciones y grupos de serialización ya anotados. Copia-pega y ajusta si lo necesitas.

### 3.4 Los endpoints definidos

Total: **2 públicos + 11 autenticados**. Todos detallados en `ENDPOINTS.md` con payload, respuestas y errores.

| Método | Ruta | Auth |
|---|---|---|
| POST | `/api/auth/register` | no |
| POST | `/api/auth/login` | no |
| GET | `/api/me` | sí |
| PATCH | `/api/users/{id}` | sí |
| GET | `/api/users/{id}` | sí |
| GET | `/api/users/{id}/contacto` | sí |
| GET | `/api/centros` | sí |
| GET | `/api/grados` (con `?centro=`) | sí |
| GET | `/api/asignaturas` (con `?grado=`, `?curso=`) | sí |
| GET | `/api/ofertas` (con `?asignatura=` o `?grado=`) | sí |
| GET | `/api/ofertas/me` | sí |
| POST | `/api/ofertas` | sí |
| DELETE | `/api/ofertas/{id}` | sí |

### 3.5 Casos peliagudos ya pensados

- **El login devuelve `{ token, user }`** (no solo `token`). LexikJWT por defecto solo da `token`, así que hay que registrar un `AuthenticationSuccessListener` que añada el user serializado. Está el código en `BACKEND.md` sección 7.3.
- **El usuario autenticado no aparece en sus propios resultados de búsqueda.** Hay que filtrarlo en el `OfertaRepository`.
- **Una oferta es única por par `(user, asignatura)`.** Si intentan duplicarla, devolver `409`. Constraint en BD + check en el controller.
- **DELETE de oferta solo si es del propio usuario.** Si no, `403`.
- **PATCH de user solo el propio user.** Si no, `403`.
- **Errores de validación** se devuelven como `422` con `details: [{ field, message }, ...]` para que yo pueda pintar los errores junto a cada input.
- **El email es único e inmutable**. No se puede cambiar desde `PATCH /api/users/{id}`.
- **CORS solo permite `http://localhost:4200`** (mi entorno). Configurado por regex en `.env.local`.
- **Las claves JWT (`config/jwt/*.pem`) NO se commitean.** Añade la línea al `.gitignore`.

---

## 4. Lo que tienes que hacer tú

Tu trabajo se resume en cuatro bloques:

### Bloque A — Setup (1-2 horas)

- Crear el proyecto Symfony, instalar bundles, configurar `.env.local`, base de datos, generar claves JWT.
- Detalle completo en `BACKEND.md` secciones 1-4.

### Bloque B — Modelo y datos (2-3 horas)

- Crear las cinco entidades con sus relaciones y validaciones.
- Generar y aplicar la migración inicial.
- Cargar las fixtures (datos seed con grados y asignaturas reales).
- Detalle en `BACKEND.md` secciones 5, 6 y 13.

### Bloque C — Auth, CORS y serialización (1-2 horas)

- Configurar `security.yaml` con tres firewalls: `login` (json_login), `register` (público) y `api` (JWT).
- Configurar Nelmio CORS para `localhost:4200`.
- Registrar el `AuthenticationSuccessListener` para que el login devuelva el user.
- Crear el `ApiController` base con los helpers `jsonGroup()` y `jsonError()`.
- Registrar el `ExceptionListener` para errores no controlados.
- Detalle en `BACKEND.md` secciones 7, 8, 9 y 12.

### Bloque D — Controllers (3-4 horas)

Un controller por recurso:

- `AuthController` (register; el login lo gestiona el firewall).
- `MeController` (`GET /api/me`).
- `UserController` (PATCH propio, GET público, GET contacto).
- `CentroController`.
- `GradoController` (con filtro por centro).
- `AsignaturaController` (con filtros por grado y curso).
- `OfertaController` (lista con filtros, lista propia, crear, eliminar).

Detalle en `BACKEND.md` sección 10. Tienes el código casi entero ahí.

**Total estimado: 8-12 horas de trabajo concentrado**, sin contar imprevistos. Reserva un margen.

---

## 5. Hoja de ruta paso a paso

Sigue este orden. No te saltes ninguno hasta que el anterior funcione.

### Paso 1 — Arranca el proyecto

```bash
cd auria
symfony new api --version="7.1.*" --webapp
cd api
composer require lexik/jwt-authentication-bundle
composer require nelmio/cors-bundle
composer require --dev doctrine/doctrine-fixtures-bundle
composer require --dev symfony/maker-bundle
composer remove twig
```

Crea `.env.local` con `DATABASE_URL`, `JWT_*` y `CORS_ALLOW_ORIGIN`. Plantilla en `BACKEND.md` 4.1.

```bash
php bin/console doctrine:database:create
php bin/console lexik:jwt:generate-keypair
```

Añade `/config/jwt/*.pem` al `.gitignore`. **Esto es crítico, no lo olvides.**

✅ **Verificación:** `symfony serve` arranca y `http://localhost:8000` no rompe.

### Paso 2 — Crea las entidades

Sigue `BACKEND.md` sección 5 al pie de la letra. Copia-pega el código de:

- `User.php`
- `Centro.php`
- `Grado.php`
- `Asignatura.php`
- `Oferta.php`

Presta atención a:
- Las anotaciones `#[Groups(...)]` (controlan qué se serializa en cada endpoint).
- Las relaciones `OneToMany` / `ManyToOne` con `targetEntity`.
- La constraint única en `Oferta` `(user, asignatura)`.

```bash
php bin/console make:migration
php bin/console doctrine:migrations:migrate
```

✅ **Verificación:** las cinco tablas existen en MySQL.

### Paso 3 — Carga las fixtures

Copia el `AppFixtures.php` de `BACKEND.md` sección 13. Ejecuta:

```bash
php bin/console doctrine:fixtures:load --no-interaction
```

✅ **Verificación:** hay datos en `centros`, `grados`, `asignaturas`, un usuario `demo@florida.edu` con password `demo1234` y una oferta de prueba.

### Paso 4 — Configura security y CORS

Sigue `BACKEND.md` secciones 7 y 8. Pega:

- `config/packages/security.yaml`
- `config/packages/lexik_jwt_authentication.yaml`
- `config/packages/nelmio_cors.yaml`
- `src/EventListener/AuthenticationSuccessListener.php`
- Registro del listener en `config/services.yaml`.

✅ **Verificación:** `POST /api/auth/login` con `demo@florida.edu` / `demo1234` devuelve `{ token, user }`.

### Paso 5 — Helpers e ExceptionListener

- `src/Controller/ApiController.php` (base abstracta con `jsonGroup` y `jsonError`).
- `src/EventListener/ExceptionListener.php` para que los errores no controlados devuelvan JSON con el formato del contrato.

`BACKEND.md` secciones 9 y 12.

### Paso 6 — Implementa los controllers uno por uno

Recomendación de orden: empieza por los más sencillos para coger ritmo.

1. `AuthController` (register). Login ya funciona vía firewall.
2. `MeController` (`GET /api/me`).
3. `CentroController` (lista simple).
4. `GradoController` (lista con filtro).
5. `AsignaturaController` (lista con dos filtros).
6. `UserController` (PATCH, GET público, GET contacto).
7. `OfertaController` (el más complejo: filtros, exclusión del usuario propio, validaciones, propiedad para DELETE).

**Después de cada controller, prueba con curl o Postman.** No te dejes los siete sin probar para el final, descubrirás bugs que arrastras.

### Paso 7 — Pruebas finales

Comprobaciones que tienen que pasar antes de avisarme:

- Login con `demo@florida.edu` / `demo1234` devuelve token + user.
- `GET /api/me` con token devuelve el usuario.
- `GET /api/centros` devuelve la lista.
- `GET /api/grados?centro=1` filtra correctamente.
- `GET /api/asignaturas?grado=1&curso=1` filtra correctamente.
- `POST /api/ofertas` crea una oferta nueva.
- `POST /api/ofertas` con la **misma asignatura repetida** devuelve `409`.
- `GET /api/ofertas?asignatura=1` devuelve resultados **sin incluir al usuario autenticado**.
- `DELETE /api/ofertas/{id}` de otro usuario devuelve `403`.
- Sin token, cualquier endpoint protegido devuelve `401`.
- Errores de validación devuelven `422` con el array `details`.

Cuando todo eso funcione, **avísame en Slack/Discord/lo-que-sea** y empiezo a integrar el frontend contra tu API real (mientras tanto trabajo con un mock de `json-server`).

---

## 6. Reglas de oro

Cosas que **no** puedes saltarte. Si las saltas, rompes mi código o dejamos un proyecto inconsistente.

### 6.1 El contrato manda

`ENDPOINTS.md` define las rutas exactas, los payloads exactos y el formato exacto de las respuestas. **No improvises:**

- Si una ruta dice `/api/auth/login`, no la dejes en `/api/login_check` (que es lo que LexikJWT usa por defecto). Cámbialo en `security.yaml`.
- Si el contrato dice que la respuesta del login es `{ token, user }`, no devuelvas solo `{ token }`.
- Si el contrato dice que los errores tienen forma `{ error, code, details }`, no devuelvas `{ message: "..." }` ni HTML.
- Si necesitas cambiar algo del contrato, **avísame primero**, lo discutimos, lo actualizamos en `ENDPOINTS.md` y luego lo implementas.

### 6.2 Seguridad básica

- La password **nunca** se devuelve en ninguna respuesta. El grupo `user:read` no la incluye, pero compruébalo después.
- Las claves JWT (`config/jwt/*.pem`) **NO** se commitean. Añade la regla al `.gitignore` antes del primer commit.
- El email es único e inmutable. No permitas cambiarlo en `PATCH /api/users/{id}`.

### 6.3 Coherencia de errores

Todas las respuestas de error usan **siempre** este formato:

```json
{ "error": "...", "code": 400, "details": [] }
```

Si por algún motivo Symfony devuelve HTML en un error, es un bug. El `ExceptionListener` está justamente para evitarlo. Verifícalo.

### 6.4 Permisos por usuario

- `PATCH /api/users/{id}`: solo si `id == user autenticado`. Si no, `403`.
- `DELETE /api/ofertas/{id}`: solo si la oferta pertenece al user autenticado. Si no, `403`.
- En `GET /api/ofertas`, **filtra al usuario autenticado**. No quiero verme a mí mismo en mis propias búsquedas.

### 6.5 Una oferta = un par único `(user, asignatura)`

No se permite que un usuario tenga dos ofertas de la misma asignatura. Si pasa, `409`. Hay constraint a nivel de BD; añade también un check en el controller para devolver el mensaje correcto en lugar de un crash de Doctrine.

### 6.6 CORS y orígenes

- Solo `http://localhost:4200` está permitido en desarrollo. La regex del `.env.local` lo cubre.
- Cuando despleguemos el frontend, añadiremos su URL al `CORS_ALLOW_ORIGIN`.

### 6.7 Git

- Rama principal `main` protegida. **No commitees a `main` directamente.**
- Una rama por feature: `feat/auth`, `feat/ofertas`, `fix/cors`.
- PR con revisión mía antes de mergear.
- Mensajes en imperativo y con prefijo (`feat:`, `fix:`, `docs:`, `chore:`).

---

## 7. Mapa de archivos: dónde está cada cosa

Resumen de qué documento consultar para qué duda:

| Tu duda | Dónde mirar |
|---|---|
| ¿Qué tiene que devolver `GET /api/me`? | `ENDPOINTS.md` 6.1 |
| ¿Cómo se ve el JSON de un User completo? | `ENDPOINTS.md` 4.1 |
| ¿Cómo se ve el JSON de un User en una búsqueda? | `ENDPOINTS.md` 4.2 (UserPublic) |
| ¿Qué errores puede devolver `POST /api/ofertas`? | `ENDPOINTS.md` 6.10 |
| ¿Cómo se llama el campo de contacto y qué valores admite? | `ENDPOINTS.md` 4.1 + sección 8 |
| ¿Qué validaciones aplica el backend? | `ENDPOINTS.md` sección 8 |
| ¿Cómo se crea la entidad User en código? | `BACKEND.md` 5.1 |
| ¿Qué bundles instalo? | `BACKEND.md` 2.1 |
| ¿Cómo configuro el firewall de seguridad? | `BACKEND.md` 7.1 |
| ¿Cómo hago que el login devuelva token + user? | `BACKEND.md` 7.3 |
| ¿Cómo configuro CORS? | `BACKEND.md` 8 |
| ¿Cómo escribo el OfertaController? | `BACKEND.md` 10 (último) |
| ¿Qué fixtures tengo que cargar? | `BACKEND.md` 13 |
| ¿Cuál es el plan general del proyecto? | `AURIA.md` 9 (roadmap) |
| ¿Por qué decidimos X cosa? | `AURIA.md` 10 (decision log) |
| ¿Qué dudas no hemos cerrado? | `AURIA.md` 11 (pendientes) |
| ¿Qué hizo cada uno la última sesión? | `AURIA.md` 14 (bitácora) |

---

## 8. Checklist de avance

Marca con ✅ a medida que avanzas. Si te encallas en alguno, dímelo.

**Setup**
- [ ] Symfony instalado, `symfony serve` arranca
- [ ] Bundles añadidos (LexikJWT, NelmioCors, Fixtures, MakerBundle)
- [ ] `.env.local` configurado
- [ ] BD creada
- [ ] Claves JWT generadas
- [ ] `config/jwt/*.pem` en `.gitignore`

**Modelo**
- [ ] Entidad User
- [ ] Entidad Centro
- [ ] Entidad Grado con FK a Centro
- [ ] Entidad Asignatura con FK a Grado
- [ ] Entidad Oferta con FK a User y Asignatura + constraint único
- [ ] Migración aplicada
- [ ] Fixtures cargadas

**Auth y configuración**
- [ ] `security.yaml` con firewalls login/register/api
- [ ] `nelmio_cors.yaml` permite `localhost:4200`
- [ ] `AuthenticationSuccessListener` registrado
- [ ] `ApiController` base creado
- [ ] `ExceptionListener` registrado

**Endpoints**
- [ ] `POST /api/auth/register`
- [ ] `POST /api/auth/login` (vía firewall) devuelve `{ token, user }`
- [ ] `GET /api/me`
- [ ] `PATCH /api/users/{id}` (solo el propio)
- [ ] `GET /api/users/{id}` (UserPublic)
- [ ] `GET /api/users/{id}/contacto`
- [ ] `GET /api/centros`
- [ ] `GET /api/grados?centro=`
- [ ] `GET /api/asignaturas?grado=&curso=`
- [ ] `GET /api/ofertas?asignatura=` (sin incluir al user autenticado)
- [ ] `GET /api/ofertas?grado=&curso=`
- [ ] `GET /api/ofertas/me`
- [ ] `POST /api/ofertas` (con validación de duplicado)
- [ ] `DELETE /api/ofertas/{id}` (solo el propio, si no `403`)

**Cross-cutting**
- [ ] Todos los errores tienen formato `{ error, code, details }`
- [ ] Sin token, los protegidos devuelven `401`
- [ ] La password no aparece en ninguna respuesta
- [ ] CORS funciona desde `http://localhost:4200`

Cuando todos estén marcados → me avisas → empiezo la integración real del frontend.

---

## 9. Cómo coordinarnos

### Mientras trabajas

- Si una decisión del contrato te parece mejorable, **dímelo** antes de cambiar nada por tu cuenta. Lo hablamos, actualizamos `ENDPOINTS.md` y luego lo implementas. El contrato es el único punto único de verdad.
- Si te encallas más de 30 minutos en algo, escríbeme. Probablemente lo resolvemos en 5.
- Si ves una sección de `BACKEND.md` confusa o incompleta, anótala y te la mejoro.
- Al terminar cada sesión, añade una entrada en la bitácora de `AURIA.md` (sección 14): qué hiciste, qué quedó pendiente, bloqueos.

### Comunicación

- **Slack/Discord/WhatsApp** (lo que ya usemos): para preguntas rápidas y coordinación diaria.
- **Issues en GitHub**: para tareas que se nos escapan o bugs que descubrimos.
- **PRs en GitHub**: para todo cambio que entre en `main`.

### Cuando tu backend esté funcionando

1. Avísame con un resumen de qué endpoints ya están operativos.
2. Yo cambio el `apiUrl` del frontend de mi mock al `http://localhost:8000/api` real.
3. Probamos los flujos completos juntos (registro, onboarding, búsqueda, contacto, baja).
4. Anotamos los desajustes en `AURIA.md` sección 11 (pendientes) y los vamos arreglando.

### Cuando empecemos despliegue

- Backend → Render (provisional, por confirmar).
- Frontend → Vercel.
- BD → la que ofrezca Render o un MySQL gestionado.
- Hay que recargar fixtures en producción para tener la demo poblada.

---

## En una frase

**Lee `ENDPOINTS.md` y `BACKEND.md`, sigue la hoja de ruta de la sección 5, marca el checklist de la sección 8, y avísame cuando todo lo del checklist esté en verde.** El resto es ejecución.

Cualquier duda me dices. Mucho ánimo, tío. 💪

— Aarón
