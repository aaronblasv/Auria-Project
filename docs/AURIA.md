# AURIA — Documento maestro del proyecto

> Este documento es la **única fuente de verdad** del proyecto. Cualquier decisión, cambio de rumbo o avance se refleja aquí. Si no está escrito aquí, no existe.
>
> **Norma del equipo:** antes de empezar a tocar código en cada sesión, lee la sección 1 (Estado actual) y la sección 14 (Bitácora). Al terminar la sesión, actualízalas.

---

## 1. Estado actual

> **Actualizar siempre que termine una sesión de trabajo.**

| Campo | Valor |
|---|---|
| Última actualización | _PENDIENTE — pon aquí la fecha_ |
| Quién actualizó | _PENDIENTE_ |
| Fase actual | Fase 0 — Preparación |
| Próximo hito | API de Symfony funcionando con login JWT |
| Bloqueos activos | _ninguno_ |

**Resumen en una línea:** Acabamos de cerrar el concepto, el stack y el roadmap. Todavía no hemos creado el repositorio.

---

## 2. El proyecto

### 2.1 Concepto

Aplicación de apoyo educativo entre estudiantes. Funciona como un marketplace estilo BlaBlaCar / Wallapop: cada usuario es a la vez ofertante y demandante. Los estudiantes que dominan ciertas asignaturas se ofrecen para dar clases o repaso a otros estudiantes del mismo centro.

### 2.2 Posicionamiento

- **Externamente:** plataforma de ayuda colaborativa entre estudiantes.
- **Internamente:** los usuarios pueden acordar pagos entre ellos por su cuenta. La app no gestiona dinero.

### 2.3 Modelo conceptual (analogía TPV)

La estructura interna funciona como un Terminal Punto de Venta:

- **Centros** → marca / cadena.
- **Grados** (DAW, ASIR, DAM…) → familias de productos.
- **Asignaturas** → productos concretos.
- **Ofertas** → cada usuario marca qué "productos" domina y se ofrece a darlos.

### 2.4 Casos de uso principales

1. Un estudiante de 2º de DAW se ofrece para dar clases de asignaturas de 1º de DAW y de ASIR.
2. Un estudiante de 1º busca quién le pueda ayudar con "Programación" y la app le devuelve los compañeros disponibles.
3. Los dos intercambian contacto fuera de la app y gestionan la clase por su cuenta.

---

## 3. Equipo

| Persona | Rol principal | Responsable de |
|---|---|---|
| _Tu nombre_ | _por definir_ | _por definir_ |
| _Compañero_ | _por definir_ | _por definir_ |

**Sugerencia de reparto:** uno se encarga del backend (Symfony + MySQL) y el otro del frontend (Angular). Quien acabe primero ayuda al otro. La memoria y el despliegue se hacen entre los dos.

---

## 4. Stack técnico

| Capa | Tecnología | Versión / notas |
|---|---|---|
| Frontend | Angular | 17+ con Angular Material |
| Backend | PHP + Symfony | PHP 8.2+, Symfony 7 con API Platform |
| Autenticación | JWT | LexikJWTAuthenticationBundle |
| ORM | Doctrine | con migraciones versionadas |
| Base de datos | MySQL | 8.x |
| Documentación API | OpenAPI / Swagger UI | generada automáticamente por API Platform |
| Control de versiones | Git + GitHub | mono-repo con `/api` y `/front` |
| Despliegue (previsto) | Render + Vercel | _pendiente de confirmar_ |
| Entorno local | XAMPP/Laragon o Docker | _decidir_ |

### 4.1 Dependencias clave del backend

```
api-platform/core
lexik/jwt-authentication-bundle
nelmio/cors-bundle
doctrine/doctrine-fixtures-bundle
symfony/maker-bundle (dev)
```

### 4.2 Dependencias clave del frontend

```
@angular/material
@auth0/angular-jwt
```

---

## 5. Arquitectura

Tres capas desacopladas, comunicación por HTTP + JSON con autenticación por JWT:

```
┌─────────────────────────────────────────────────────────┐
│  FRONTEND — Angular (SPA)                               │
│  Componentes · Servicios HTTP · JWT Interceptor         │
└────────────────────────┬────────────────────────────────┘
                         │  HTTP + JSON
                         │  Authorization: Bearer <JWT>
┌────────────────────────▼────────────────────────────────┐
│  BACKEND — Symfony API                                  │
│  API Platform · Doctrine ORM · Security (JWT)           │
└────────────────────────┬────────────────────────────────┘
                         │  SQL via Doctrine
┌────────────────────────▼────────────────────────────────┐
│  DATOS — MySQL                                          │
│  5 tablas: users, centros, grados, asignaturas, ofertas │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Modelo de datos

### 6.1 Entidades

**User**
- `id` (int, PK)
- `email` (string, único)
- `password` (string, hasheada con bcrypt/argon2)
- `nombre` (string)
- `foto` (string, opcional, URL o ruta)
- `cursoActualId` (FK → Asignatura o curso, _por decidir_)
- `contactoPreferido` (enum: `instagram`, `telefono`, `email`)
- `contactoValor` (string — el handle, número o correo según el canal)
- `createdAt` (datetime)

**Centro**
- `id` (int, PK)
- `nombre` (string)

**Grado**
- `id` (int, PK)
- `nombre` (string) — ej. "DAW", "ASIR"
- `centroId` (FK → Centro)

**Asignatura**
- `id` (int, PK)
- `nombre` (string)
- `curso` (int, 1-4)
- `gradoId` (FK → Grado)

**Oferta**
- `id` (int, PK)
- `userId` (FK → User)
- `asignaturaId` (FK → Asignatura)
- `descripcionCorta` (string, opcional)
- `createdAt` (datetime)

### 6.2 Relaciones

```
Centro 1 ─── N Grado 1 ─── N Asignatura 1 ─── N Oferta N ─── 1 User
```

### 6.3 Entidades futuras (NO en v1)

- `SolicitudContacto` — para registrar quién contacta a quién (necesaria para gamificación).
- `Valoracion` — sistema de estrellas tras la clase.
- `Mensaje` — chat interno (probablemente nunca, mejor que se contacten fuera).

---

## 7. API REST — endpoints

> Generados automáticamente por API Platform a partir de las entidades anotadas con `#[ApiResource]`. Los listados aquí son los que vamos a usar desde el frontend.

| Método | Ruta | Auth | Propósito |
|---|---|---|---|
| POST | `/api/login_check` | no | Login, devuelve JWT |
| POST | `/api/users` | no | Registro de usuario |
| GET | `/api/me` | sí | Datos del usuario autenticado |
| PATCH | `/api/users/{id}` | sí | Editar perfil propio |
| GET | `/api/centros` | sí | Listar centros |
| GET | `/api/grados?centro={id}` | sí | Grados de un centro |
| GET | `/api/asignaturas?grado={id}` | sí | Asignaturas de un grado |
| GET | `/api/ofertas?asignatura={id}` | sí | Buscar ofertas por asignatura |
| GET | `/api/ofertas?grado={id}` | sí | Buscar ofertas por grado |
| POST | `/api/ofertas` | sí | Crear una oferta propia |
| DELETE | `/api/ofertas/{id}` | sí | Eliminar una oferta propia |

---

## 8. Frontend — estructura

```
src/app/
├── core/                 servicios singleton
│   ├── auth.service.ts
│   ├── api.service.ts
│   ├── jwt.interceptor.ts
│   └── auth.guard.ts
├── auth/                 login y registro
│   ├── login.component.ts
│   └── register.component.ts
├── profile/              onboarding y edición
│   ├── onboarding.component.ts
│   └── my-profile.component.ts
├── ofertas/              búsqueda y detalle
│   ├── home.component.ts          (buscador)
│   ├── result-list.component.ts
│   ├── oferta-detail.component.ts
│   └── my-ofertas.component.ts
└── shared/               componentes y pipes reutilizables
```

---

## 9. Roadmap

> Marcad las casillas con `[x]` cuando se complete cada tarea. No saltéis a la siguiente fase sin completar el hito de la actual.

### Fase 0 — Preparación

- [ ] Definir nombre definitivo (provisional: **Auria**)
- [ ] Logo provisional (Figma o Canva, 30 min)
- [ ] Inventario completo de grados y asignaturas del centro (en `seeds.md` o aquí mismo)
- [ ] Crear repositorio Git mono-repo en GitHub
- [ ] README inicial con instrucciones de arranque
- [ ] PHP 8.2+, Composer, Symfony CLI instalados en ambas máquinas
- [ ] Node 20+ y Angular CLI instalados en ambas máquinas
- [ ] MySQL funcionando (XAMPP/Laragon/Docker)
- [ ] Decidir herramienta de despliegue (Render + Vercel propuesto)

### Fase 1 — Backend Symfony

- [ ] `symfony new auria-api --webapp`
- [ ] Configurar `.env` con conexión a MySQL
- [ ] Instalar bundles (api-platform, lexik-jwt, nelmio-cors, fixtures)
- [ ] Crear entidad **User** con `make:entity`
- [ ] Crear entidad **Centro**
- [ ] Crear entidad **Grado** con relación a Centro
- [ ] Crear entidad **Asignatura** con relación a Grado
- [ ] Crear entidad **Oferta** con relaciones a User y Asignatura
- [ ] `make:migration` y `doctrine:migrations:migrate`
- [ ] DataFixtures con datos reales del centro
- [ ] `doctrine:fixtures:load` y verificar BD
- [ ] Configurar LexikJWT (par de claves RSA)
- [ ] Configurar `security.yaml` con firewall `api`
- [ ] Configurar CORS para `localhost:4200`
- [ ] Anotar entidades con `#[ApiResource]`
- [ ] **Hito:** desde Swagger UI hacer login, recibir JWT, consultar `/api/grados` con token

### Fase 2 — Frontend con autenticación y perfil

- [ ] `ng new auria-front --routing --style=scss`
- [ ] `ng add @angular/material`
- [ ] Estructura de carpetas (core, auth, profile, ofertas, shared)
- [ ] `AuthService` con login/logout y storage del JWT
- [ ] `JwtInterceptor` registrado en app config
- [ ] `AuthGuard` para rutas privadas
- [ ] Componente de **login** con formulario reactivo
- [ ] Componente de **registro**
- [ ] Onboarding del perfil (centro → grado → curso → asignaturas)
- [ ] Página "mi perfil" para editar datos
- [ ] Alta y baja de ofertas desde el perfil
- [ ] **Hito:** un usuario nuevo se registra, hace login, completa onboarding y al volver a entrar ve sus ofertas guardadas

### Fase 3 — Búsqueda, detalle y pulido

- [ ] Home con buscador por **grado**
- [ ] Buscador por **asignatura**
- [ ] Listado de resultados como tarjetas (foto, nombre, asignaturas)
- [ ] Pantalla de detalle de oferta
- [ ] Botón "ver contacto" mostrando canal preferido del oferente
- [ ] Pantalla "mis ofertas" con eliminar
- [ ] Estados vacíos ("no hay resultados")
- [ ] Spinners de carga
- [ ] Mensajes de error legibles
- [ ] Logo en cabecera y paleta consistente
- [ ] Build de producción del backend
- [ ] Build de producción del frontend
- [ ] **Hito:** la app se navega de extremo a extremo sin errores

### Fase 4 — Cierre y entrega

- [ ] Despliegue del backend
- [ ] Despliegue del frontend
- [ ] Cargar fixtures en BD de producción
- [ ] Crear 2-3 usuarios de ejemplo para la demo
- [ ] Memoria del proyecto redactada
- [ ] Diagrama ER en la memoria
- [ ] Diagrama de arquitectura en la memoria
- [ ] Sección de líneas futuras escrita
- [ ] Guion de demo (5-7 minutos)
- [ ] Demo ensayada al menos dos veces
- [ ] Plan B preparado (local + URL desplegada)

---

## 10. Decisiones tomadas (Decision Log)

> Cada decisión importante se anota aquí con fecha, contexto y razón. Si en el futuro alguien se pregunta "¿por qué hicimos esto así?", la respuesta está aquí.

| Fecha | Decisión | Razón |
|---|---|---|
| _inicio_ | Stack: Symfony + Angular + MySQL | Tecnologías que conoce el equipo, encajan en el contexto académico |
| _inicio_ | Mono-repo con `/api` y `/front` | Más simple para dos personas; un único `git pull` actualiza todo |
| _inicio_ | API Platform en lugar de controllers a mano | Genera REST + Swagger UI automáticos, ahorra horas |
| _inicio_ | JWT en vez de sesiones | Stateless, encaja mejor con SPA + API |
| _inicio_ | Sin pasarela de pago en v1 | KYC, comisiones y fiscalidad matarían el plazo de tres tardes |
| _inicio_ | Sin gamificación en v1 | Necesita volumen de usuarios para tener sentido; se anota como línea futura |
| _inicio_ | Datos seed con grados/asignaturas reales del centro | La demo gana credibilidad, evita el "lorem ipsum" |

---

## 11. Pendientes y dudas abiertas

> Aquí van las cosas que todavía no hemos decidido y que hay que resolver antes de que bloqueen.

- [ ] **Cómo se modela el "curso actual" del usuario:** ¿FK a una asignatura concreta, FK a un grado + número de curso, o tabla aparte `Curso`?
- [ ] **Visibilidad del contacto:** ¿se muestra siempre tras login, o solo después de que el otro acepte una solicitud?
- [ ] **Verificación de matrícula:** en v1 confianza ciega, en v2 quizá email institucional. Decidir si lo mencionamos en la memoria.
- [ ] **Foto de perfil:** ¿permitimos subida o solo URL externa? Subida implica gestión de archivos en Symfony.
- [ ] **Idioma:** ¿solo castellano o también valenciano/inglés? Probablemente solo castellano en v1.
- [ ] **Quién hace qué parte** (ver sección 3).

---

## 12. Setup local

### 12.1 Clonar el repo

```bash
git clone https://github.com/<usuario>/auria.git
cd auria
```

### 12.2 Backend

```bash
cd api
composer install
cp .env .env.local
# editar .env.local con la cadena de conexión MySQL
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate
php bin/console doctrine:fixtures:load
php bin/console lexik:jwt:generate-keypair
symfony serve
```

API arrancada en `http://localhost:8000`. Swagger UI en `http://localhost:8000/api`.

### 12.3 Frontend

```bash
cd front
npm install
ng serve
```

Aplicación en `http://localhost:4200`.

### 12.4 Base de datos

- Host: `127.0.0.1`
- Puerto: `3306`
- Base: `auria`
- Usuario: `root` (en local) — _en producción, usuario dedicado_

---

## 13. Convenciones

### 13.1 Git

- Rama principal: `main`. **No se commitea directamente a main.**
- Una rama por feature: `feat/login-jwt`, `feat/onboarding-perfil`, `fix/cors-config`.
- Pull request obligatorio con revisión del compañero antes de mergear.
- Mensajes de commit en imperativo: `add user entity`, `fix cors origins`, `update README`.
- Prefijos: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`.

### 13.2 Código

- **PHP/Symfony:** PSR-12. Nombres de entidades en singular y PascalCase (`User`, `Oferta`).
- **Angular:** convención oficial. Componentes en PascalCase, servicios en camelCase, archivos en kebab-case (`oferta-detail.component.ts`).
- Comentarios solo donde aporten contexto que el código no puede expresar.

### 13.3 Actualizar este documento

- Tras cada sesión de trabajo, actualizar la sección 1 (Estado actual) y añadir entrada en la sección 14 (Bitácora).
- Tras cada decisión técnica relevante, añadir fila en la sección 10 (Decision Log).
- Si surge una duda no resuelta, añadirla a la sección 11 (Pendientes).

---

## 14. Bitácora del proyecto

> Registro cronológico inverso (lo más reciente arriba). Una entrada por sesión de trabajo, aunque sea corta.

### Plantilla para nuevas entradas

```
### YYYY-MM-DD — [Nombre]
- Qué se hizo: ...
- Qué quedó pendiente: ...
- Bloqueos: ...
- Tiempo invertido: ...
```

---

### YYYY-MM-DD — Concepto cerrado

- Qué se hizo: definidos concepto, stack, modelo de datos, arquitectura y roadmap.
- Qué quedó pendiente: arrancar el repositorio y la fase 0.
- Bloqueos: ninguno.
- Tiempo invertido: _pon aquí lo que dedicasteis_.

---

## 15. Recursos y enlaces

| Qué | Dónde |
|---|---|
| Repositorio | _PENDIENTE — pegar URL al crearlo_ |
| Backend desplegado | _PENDIENTE_ |
| Frontend desplegado | _PENDIENTE_ |
| Tablero de tareas | _opcional — Trello, Notion, GitHub Projects_ |
| Figma del logo | _PENDIENTE_ |
| Memoria (Google Doc o similar) | _PENDIENTE_ |

### Documentación oficial

- Symfony: https://symfony.com/doc/current/index.html
- API Platform: https://api-platform.com/docs/
- Doctrine: https://www.doctrine-project.org/projects/orm.html
- LexikJWT: https://github.com/lexik/LexikJWTAuthenticationBundle
- Angular: https://angular.dev/
- Angular Material: https://material.angular.io/

---

## 16. Para la memoria académica

> Estructura propuesta para el documento que entregaremos al tribunal. Lo redactamos en otro archivo (Google Doc o `MEMORIA.md`).

1. Portada y resumen ejecutivo
2. Contexto y problema que resuelve
3. Análisis de soluciones existentes (BlaBlaCar, Wallapop, plataformas de tutorías)
4. Propuesta de valor de Auria
5. Modelo conceptual (analogía TPV)
6. Arquitectura técnica (con diagramas)
7. Modelo de datos (con diagrama ER)
8. Tecnologías escogidas y justificación
9. Flujos de usuario principales
10. Capturas de pantalla
11. Decisiones técnicas relevantes
12. Líneas futuras (gamificación, verificación institucional, posibles pagos, app móvil nativa)
13. Conclusiones y aprendizajes
14. Anexos (manual de despliegue, capturas, código relevante)

---

_Fin del documento. Si añades una sección nueva, añádela también al índice mental: cuanto más visible esté la información, más útil es este archivo._
