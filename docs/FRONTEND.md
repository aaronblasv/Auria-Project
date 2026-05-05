# AURIA — Guía del frontend (Angular)

> **Antes de empezar, lee `ENDPOINTS.md`.** Este archivo te dice cómo construir el frontend; el contrato te dice **qué** datos vas a recibir y enviar. Si hay una discrepancia, manda el contrato.

> **Patrón que seguimos:** Angular 17+ con **standalone components** (sin NgModules). Reactive Forms para formularios, signals para el estado de auth, RxJS para llamadas HTTP, Angular Material para la UI. Una carpeta por feature. Un servicio por recurso del backend.

---

## Tabla de contenidos

1. [Pre-requisitos](#1-pre-requisitos)
2. [Crear el proyecto](#2-crear-el-proyecto)
3. [Estructura de directorios](#3-estructura-de-directorios)
4. [Configuración inicial](#4-configuración-inicial)
5. [Modelos (TypeScript)](#5-modelos-typescript)
6. [Servicios core: Auth, interceptors y guard](#6-servicios-core)
7. [Servicios de feature: Catálogo, Usuario, Ofertas](#7-servicios-de-feature)
8. [Routing](#8-routing)
9. [Layout: App y Header](#9-layout-app-y-header)
10. [Login y Register](#10-login-y-register)
11. [Onboarding](#11-onboarding)
12. [Mi perfil](#12-mi-perfil)
13. [Home (búsqueda)](#13-home-búsqueda)
14. [Detalle de oferta y contacto](#14-detalle-de-oferta-y-contacto)
15. [Mis ofertas](#15-mis-ofertas)
16. [Estilos globales y Material](#16-estilos-globales-y-material)
17. [Estrategia mock API para desarrollo en paralelo](#17-estrategia-mock-api)
18. [Probar la app de punta a punta](#18-probar-la-app-de-punta-a-punta)
19. [Problemas comunes](#19-problemas-comunes)
20. [Checklist final](#20-checklist-final)

---

## 1. Pre-requisitos

Verifica que tienes instalado:

```bash
node --version    # 18.13+ o 20.x
npm --version     # 9+
ng version        # Angular CLI 17.x
```

Si falta el CLI de Angular:

```bash
npm install -g @angular/cli@17
```

Editor recomendado: **VS Code** con las extensiones:

- **Angular Language Service** (oficial)
- **ESLint**
- **Prettier**

---

## 2. Crear el proyecto

Desde la raíz del mono-repo (al lado de `/api`):

```bash
ng new front --routing --style=scss --standalone --ssr=false
cd front
```

Respuestas a las preguntas del CLI:

- **Which stylesheet format?** → SCSS
- **Server-side rendering / static prerendering?** → No

### 2.1 Instalar dependencias

```bash
npm install @angular/material @angular/cdk @angular/animations
ng add @angular/material
```

Cuando `ng add @angular/material` te pregunte:

- **Theme** → Indigo/Pink (cualquiera vale, lo personalizamos luego).
- **Typography styles?** → Yes
- **Animations?** → Include and enable

### 2.2 Comprobar que arranca

```bash
ng serve --open
```

Debería abrirse `http://localhost:4200` con la página por defecto. Si funciona, perfecto. Borra el contenido de `app.component.html` salvo `<router-outlet />`.

---

## 3. Estructura de directorios

Esta es la estructura final a la que vamos a llegar. No la crees toda de golpe; la iremos construyendo en las secciones siguientes. Pero ten esta foto en mente.

```
front/
├── src/
│   ├── app/
│   │   ├── core/                          # Servicios singleton, interceptors, guards
│   │   │   ├── guards/
│   │   │   │   └── auth.guard.ts
│   │   │   ├── interceptors/
│   │   │   │   ├── jwt.interceptor.ts
│   │   │   │   └── error.interceptor.ts
│   │   │   ├── models/
│   │   │   │   ├── user.model.ts
│   │   │   │   ├── centro.model.ts
│   │   │   │   ├── grado.model.ts
│   │   │   │   ├── asignatura.model.ts
│   │   │   │   ├── oferta.model.ts
│   │   │   │   ├── contacto.model.ts
│   │   │   │   └── api-error.model.ts
│   │   │   └── services/
│   │   │       ├── auth.service.ts
│   │   │       ├── catalog.service.ts
│   │   │       ├── user.service.ts
│   │   │       └── oferta.service.ts
│   │   │
│   │   ├── features/                      # Páginas de la app
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   │   ├── login.component.ts
│   │   │   │   │   ├── login.component.html
│   │   │   │   │   └── login.component.scss
│   │   │   │   └── register/
│   │   │   │       ├── register.component.ts
│   │   │   │       ├── register.component.html
│   │   │   │       └── register.component.scss
│   │   │   ├── onboarding/
│   │   │   │   ├── onboarding.component.ts
│   │   │   │   ├── onboarding.component.html
│   │   │   │   └── onboarding.component.scss
│   │   │   ├── profile/
│   │   │   │   ├── my-profile.component.ts
│   │   │   │   ├── my-profile.component.html
│   │   │   │   └── my-profile.component.scss
│   │   │   ├── home/
│   │   │   │   ├── home.component.ts
│   │   │   │   ├── home.component.html
│   │   │   │   └── home.component.scss
│   │   │   ├── oferta-detail/
│   │   │   │   ├── oferta-detail.component.ts
│   │   │   │   ├── oferta-detail.component.html
│   │   │   │   └── oferta-detail.component.scss
│   │   │   └── my-ofertas/
│   │   │       ├── my-ofertas.component.ts
│   │   │       ├── my-ofertas.component.html
│   │   │       └── my-ofertas.component.scss
│   │   │
│   │   ├── shared/                        # Componentes reutilizables
│   │   │   ├── header/
│   │   │   │   ├── header.component.ts
│   │   │   │   ├── header.component.html
│   │   │   │   └── header.component.scss
│   │   │   └── oferta-card/
│   │   │       ├── oferta-card.component.ts
│   │   │       ├── oferta-card.component.html
│   │   │       └── oferta-card.component.scss
│   │   │
│   │   ├── app.component.ts
│   │   ├── app.component.html
│   │   ├── app.component.scss
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   │
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.development.ts
│   │
│   ├── styles.scss
│   ├── index.html
│   └── main.ts
│
├── angular.json
├── package.json
└── tsconfig.json
```

Reglas mentales:

- **`core/`**: cosas que se cargan una vez y duran toda la app (servicios singleton, interceptors, guards, modelos). Sin componentes visuales.
- **`features/`**: páginas. Cada subcarpeta es una página completa (componente + template + estilos).
- **`shared/`**: componentes reutilizables que aparecen en varias páginas (header, tarjeta de oferta).

---

## 4. Configuración inicial

### 4.1 Environments

Crea `src/environments/environment.development.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',
};
```

Crea `src/environments/environment.ts` (producción):

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://auria-api.onrender.com/api',
};
```

> La URL de producción es provisional (igual que en `ENDPOINTS.md`). Cuando se decida el dominio real, se cambia aquí.

Asegúrate de que `angular.json` tiene el `fileReplacements` configurado (Angular 17 lo crea por defecto si pasaste `--routing`). Busca en `angular.json` el bloque `configurations.development` y verifica que aparece:

```json
"fileReplacements": [
  {
    "replace": "src/environments/environment.ts",
    "with": "src/environments/environment.development.ts"
  }
]
```

Si no está, añádelo a mano.

### 4.2 `app.config.ts`

Reemplaza el contenido de `src/app/app.config.ts` por:

```typescript
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withInterceptors([jwtInterceptor, errorInterceptor])
    ),
    provideAnimationsAsync(),
  ],
};
```

> Importante: el orden de los interceptors importa. **`jwtInterceptor` antes que `errorInterceptor`**: el primero añade el token, el segundo reacciona a 401/403/etc.

Aún no existen esos archivos. Los creamos en la sección 6.

---

## 5. Modelos (TypeScript)

Estas interfaces son la traducción 1:1 del apartado **4. Modelos** del contrato. **No las modifiques sin modificar primero `ENDPOINTS.md`.**

### 5.1 `core/models/user.model.ts`

```typescript
export interface CursoActual {
  id: number;
  grado: string;
  curso: number;
}

export interface User {
  id: number;
  email: string;
  nombre: string;
  foto: string | null;
  cursoActual: CursoActual | null;
  contactoPreferido: 'instagram' | 'telefono' | 'email' | null;
  contactoValor: string | null;
  createdAt: string;
}

export interface UserPublic {
  id: number;
  nombre: string;
  foto: string | null;
  cursoActual: CursoActual | null;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterPayload {
  email: string;
  password: string;
  nombre: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UpdateUserPayload {
  nombre?: string;
  foto?: string | null;
  cursoActual?: { asignaturaId: number };
  contactoPreferido?: 'instagram' | 'telefono' | 'email';
  contactoValor?: string;
}
```

### 5.2 `core/models/centro.model.ts`

```typescript
export interface Centro {
  id: number;
  nombre: string;
}
```

### 5.3 `core/models/grado.model.ts`

```typescript
import { Centro } from './centro.model';

export interface Grado {
  id: number;
  nombre: string;
  centro: Centro;
}
```

### 5.4 `core/models/asignatura.model.ts`

```typescript
export interface Asignatura {
  id: number;
  nombre: string;
  curso: number;
  grado: {
    id: number;
    nombre: string;
  };
}
```

### 5.5 `core/models/oferta.model.ts`

```typescript
import { UserPublic } from './user.model';
import { Asignatura } from './asignatura.model';

export interface Oferta {
  id: number;
  user: UserPublic;
  asignatura: Asignatura;
  descripcionCorta: string | null;
  createdAt: string;
}

export interface CreateOfertaPayload {
  asignaturaId: number;
  descripcionCorta?: string;
}
```

### 5.6 `core/models/contacto.model.ts`

```typescript
export interface Contacto {
  preferido: 'instagram' | 'telefono' | 'email';
  valor: string;
}
```

### 5.7 `core/models/api-error.model.ts`

```typescript
export interface ApiErrorDetail {
  field: string;
  message: string;
}

export interface ApiError {
  error: string;
  code: number;
  details: ApiErrorDetail[];
}
```

> Si el backend devuelve algo distinto a esta forma, Aarón lo verifica con tu controlador y abre incidencia. La forma `{error, code, details}` es **obligatoria** para todos los errores según el contrato sección 3.

---

## 6. Servicios core

### 6.1 `core/services/auth.service.ts`

Gestiona login, logout, registro y el estado de autenticación. Usa **signals** para que cualquier componente pueda reaccionar al estado.

```typescript
import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  User,
} from '../models/user.model';

const TOKEN_KEY = 'auria_token';
const USER_KEY = 'auria_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Estado interno con signals
  private _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private _user = signal<User | null>(this.loadStoredUser());

  // Lecturas públicas (read-only)
  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._token() !== null);

  register(payload: RegisterPayload): Observable<User> {
    return this.http.post<User>(`${environment.apiUrl}/auth/register`, payload);
  }

  login(payload: LoginPayload): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, payload)
      .pipe(
        tap((response) => {
          this.persistSession(response.token, response.user);
        })
      );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  /** Refresca el user del estado tras un PATCH. */
  setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._user.set(user);
  }

  private persistSession(token: string, user: User): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._token.set(token);
    this._user.set(user);
  }

  private loadStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }
}
```

> La clave `auria_token` está fijada en el contrato (sección 2). No la cambies.

### 6.2 `core/interceptors/jwt.interceptor.ts`

Inyecta el header `Authorization: Bearer <token>` en cada petición saliente, **excepto** en login y register (que son públicos).

```typescript
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AuthService } from '../services/auth.service';

const PUBLIC_PATHS = ['/auth/login', '/auth/register'];

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();

  const isPublic = PUBLIC_PATHS.some((path) => req.url.includes(path));

  if (!token || isPublic) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });

  return next(authReq);
};
```

### 6.3 `core/interceptors/error.interceptor.ts`

Centraliza la reacción a errores HTTP según el contrato sección 3.4.

```typescript
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth = inject(AuthService);
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      switch (err.status) {
        case 401:
          // Token caducado o ausente: cerramos sesión y al login.
          auth.logout();
          break;
        case 403:
          snackBar.open('No tienes permiso para esta acción', 'Cerrar', {
            duration: 4000,
          });
          break;
        case 422:
          // Errores de validación: el componente los pinta junto a sus campos.
          // Aquí no hacemos nada global.
          break;
        case 0:
          // Backend caído o CORS mal configurado.
          snackBar.open(
            'No se puede contactar con el servidor',
            'Cerrar',
            { duration: 4000 }
          );
          break;
        case 500:
          snackBar.open(
            'Algo ha ido mal, vuelve a intentarlo',
            'Cerrar',
            { duration: 4000 }
          );
          break;
      }
      return throwError(() => err);
    })
  );
};
```

### 6.4 `core/guards/auth.guard.ts`

Bloquea el acceso a rutas privadas si no hay sesión.

```typescript
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
```

---

## 7. Servicios de feature

Un servicio por familia de endpoints. Sin lógica de negocio: solo llaman al backend y devuelven `Observable`s tipados.

### 7.1 `core/services/catalog.service.ts`

Cubre `/api/centros`, `/api/grados`, `/api/asignaturas`.

```typescript
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Centro } from '../models/centro.model';
import { Grado } from '../models/grado.model';
import { Asignatura } from '../models/asignatura.model';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getCentros(): Observable<Centro[]> {
    return this.http.get<Centro[]>(`${this.base}/centros`);
  }

  getGrados(centroId?: number): Observable<Grado[]> {
    let params = new HttpParams();
    if (centroId) params = params.set('centro', centroId);
    return this.http.get<Grado[]>(`${this.base}/grados`, { params });
  }

  getAsignaturas(gradoId?: number, curso?: number): Observable<Asignatura[]> {
    let params = new HttpParams();
    if (gradoId) params = params.set('grado', gradoId);
    if (curso) params = params.set('curso', curso);
    return this.http.get<Asignatura[]>(`${this.base}/asignaturas`, { params });
  }
}
```

### 7.2 `core/services/user.service.ts`

Cubre `/api/me`, `/api/users/{id}`, `/api/users/{id}/contacto`.

```typescript
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  UpdateUserPayload,
  User,
  UserPublic,
} from '../models/user.model';
import { Contacto } from '../models/contacto.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getMe(): Observable<User> {
    return this.http.get<User>(`${this.base}/me`);
  }

  getUser(id: number): Observable<UserPublic> {
    return this.http.get<UserPublic>(`${this.base}/users/${id}`);
  }

  updateUser(id: number, payload: UpdateUserPayload): Observable<User> {
    return this.http.patch<User>(`${this.base}/users/${id}`, payload);
  }

  getContacto(userId: number): Observable<Contacto> {
    return this.http.get<Contacto>(`${this.base}/users/${userId}/contacto`);
  }
}
```

### 7.3 `core/services/oferta.service.ts`

Cubre `/api/ofertas` (búsqueda, propias, crear, eliminar).

```typescript
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CreateOfertaPayload, Oferta } from '../models/oferta.model';

export interface SearchOfertasParams {
  asignatura?: number;
  grado?: number;
  curso?: number;
}

@Injectable({ providedIn: 'root' })
export class OfertaService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  search(params: SearchOfertasParams): Observable<Oferta[]> {
    let httpParams = new HttpParams();
    if (params.asignatura) httpParams = httpParams.set('asignatura', params.asignatura);
    if (params.grado) httpParams = httpParams.set('grado', params.grado);
    if (params.curso) httpParams = httpParams.set('curso', params.curso);

    return this.http.get<Oferta[]>(`${this.base}/ofertas`, { params: httpParams });
  }

  getMine(): Observable<Oferta[]> {
    return this.http.get<Oferta[]>(`${this.base}/ofertas/me`);
  }

  create(payload: CreateOfertaPayload): Observable<Oferta> {
    return this.http.post<Oferta>(`${this.base}/ofertas`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/ofertas/${id}`);
  }
}
```

---

## 8. Routing

`src/app/app.routes.ts`:

```typescript
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Públicas
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },

  // Privadas
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'onboarding',
        loadComponent: () =>
          import('./features/onboarding/onboarding.component').then((m) => m.OnboardingComponent),
      },
      {
        path: 'mi-perfil',
        loadComponent: () =>
          import('./features/profile/my-profile.component').then((m) => m.MyProfileComponent),
      },
      {
        path: 'mis-ofertas',
        loadComponent: () =>
          import('./features/my-ofertas/my-ofertas.component').then((m) => m.MyOfertasComponent),
      },
      {
        path: 'ofertas/:id',
        loadComponent: () =>
          import('./features/oferta-detail/oferta-detail.component').then(
            (m) => m.OfertaDetailComponent
          ),
      },
    ],
  },

  // Catch-all
  { path: '**', redirectTo: '' },
];
```

> **Nota sobre la ruta `/ofertas/:id`:** el contrato actual (v1.0) **no tiene** un endpoint `GET /api/ofertas/{id}`. El frontend pasa la oferta completa al detalle vía `state` del Router para evitar una llamada adicional. Si en algún momento decidimos añadir ese endpoint, se actualiza primero `ENDPOINTS.md` y luego este componente. Ver sección 14.

---

## 9. Layout: App y Header

### 9.1 `app.component.ts`

```typescript
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { HeaderComponent } from './shared/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {}
```

### 9.2 `app.component.html`

```html
<app-header />
<main class="app-main">
  <router-outlet />
</main>
```

### 9.3 `app.component.scss`

```scss
.app-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px;
}
```

### 9.4 `shared/header/header.component.ts`

```typescript
import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private auth = inject(AuthService);

  readonly isLoggedIn = this.auth.isLoggedIn;
  readonly userName = computed(() => this.auth.user()?.nombre ?? '');

  logout(): void {
    this.auth.logout();
  }
}
```

### 9.5 `shared/header/header.component.html`

```html
<mat-toolbar color="primary">
  <a routerLink="/" class="brand">AURIA</a>

  <span class="spacer"></span>

  @if (isLoggedIn()) {
    <a mat-button routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
      Buscar
    </a>
    <a mat-button routerLink="/mis-ofertas" routerLinkActive="active">Mis ofertas</a>

    <button mat-icon-button [matMenuTriggerFor]="userMenu">
      <mat-icon>account_circle</mat-icon>
    </button>
    <mat-menu #userMenu="matMenu">
      <button mat-menu-item disabled>{{ userName() }}</button>
      <a mat-menu-item routerLink="/mi-perfil">Mi perfil</a>
      <button mat-menu-item (click)="logout()">Cerrar sesión</button>
    </mat-menu>
  } @else {
    <a mat-button routerLink="/login">Entrar</a>
    <a mat-raised-button color="accent" routerLink="/register">Registrarse</a>
  }
</mat-toolbar>
```

### 9.6 `shared/header/header.component.scss`

```scss
.brand {
  color: white;
  text-decoration: none;
  font-weight: 700;
  font-size: 1.4rem;
  letter-spacing: 0.5px;
}

.spacer {
  flex: 1;
}

.active {
  text-decoration: underline;
}
```

---

## 10. Login y Register

### 10.1 `features/auth/login/login.component.ts`

```typescript
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../core/services/auth.service';
import { ApiError } from '../../../core/models/api-error.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  generalError = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.generalError.set(null);

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const apiError = err.error as ApiError | null;
        this.generalError.set(apiError?.error ?? 'Error al iniciar sesión');
      },
    });
  }
}
```

### 10.2 `features/auth/login/login.component.html`

```html
<mat-card class="auth-card">
  <mat-card-header>
    <mat-card-title>Entrar en AURIA</mat-card-title>
  </mat-card-header>

  <mat-card-content>
    <form [formGroup]="form" (ngSubmit)="submit()" class="auth-form">
      <mat-form-field appearance="outline">
        <mat-label>Email</mat-label>
        <input matInput type="email" formControlName="email" autocomplete="email" />
        @if (form.controls.email.hasError('required') && form.controls.email.touched) {
          <mat-error>El email es obligatorio</mat-error>
        }
        @if (form.controls.email.hasError('email')) {
          <mat-error>Formato de email inválido</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Contraseña</mat-label>
        <input matInput type="password" formControlName="password" autocomplete="current-password" />
        @if (form.controls.password.hasError('required') && form.controls.password.touched) {
          <mat-error>La contraseña es obligatoria</mat-error>
        }
        @if (form.controls.password.hasError('minlength')) {
          <mat-error>Mínimo 8 caracteres</mat-error>
        }
      </mat-form-field>

      @if (generalError()) {
        <p class="error-banner">{{ generalError() }}</p>
      }

      <button
        mat-raised-button
        color="primary"
        type="submit"
        [disabled]="form.invalid || loading()"
      >
        @if (loading()) {
          <mat-spinner diameter="20"></mat-spinner>
        } @else {
          Entrar
        }
      </button>
    </form>
  </mat-card-content>

  <mat-card-actions>
    <span>¿No tienes cuenta?</span>
    <a mat-button routerLink="/register">Registrarse</a>
  </mat-card-actions>
</mat-card>
```

### 10.3 `features/auth/login/login.component.scss`

```scss
.auth-card {
  max-width: 420px;
  margin: 64px auto;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.error-banner {
  background: #ffebee;
  color: #b71c1c;
  padding: 8px 12px;
  border-radius: 4px;
  margin: 0;
}
```

### 10.4 `features/auth/register/register.component.ts`

Maneja errores de validación 422 mapeando `details[].field` al control correspondiente del formulario.

```typescript
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthService } from '../../../core/services/auth.service';
import { ApiError } from '../../../core/models/api-error.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  loading = signal(false);
  generalError = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.generalError.set(null);

    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => {
        // Tras el registro, hacemos login automáticamente.
        this.auth.login({
          email: this.form.controls.email.value,
          password: this.form.controls.password.value,
        }).subscribe({
          next: () => {
            this.loading.set(false);
            this.snackBar.open('¡Bienvenido a AURIA!', 'Cerrar', { duration: 3000 });
            this.router.navigate(['/onboarding']);
          },
          error: () => {
            this.loading.set(false);
            this.router.navigate(['/login']);
          },
        });
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.applyApiError(err);
      },
    });
  }

  /** Pinta los errores 422 junto a sus campos. */
  private applyApiError(err: HttpErrorResponse): void {
    const apiError = err.error as ApiError | null;
    if (!apiError) {
      this.generalError.set('Error desconocido');
      return;
    }
    if (err.status === 422 && apiError.details?.length) {
      for (const detail of apiError.details) {
        const control = this.form.get(detail.field);
        if (control) {
          control.setErrors({ server: detail.message });
        }
      }
    } else {
      this.generalError.set(apiError.error);
    }
  }
}
```

### 10.5 `features/auth/register/register.component.html`

```html
<mat-card class="auth-card">
  <mat-card-header>
    <mat-card-title>Crear cuenta</mat-card-title>
  </mat-card-header>

  <mat-card-content>
    <form [formGroup]="form" (ngSubmit)="submit()" class="auth-form">
      <mat-form-field appearance="outline">
        <mat-label>Nombre completo</mat-label>
        <input matInput formControlName="nombre" autocomplete="name" />
        @if (form.controls.nombre.errors?.['required'] && form.controls.nombre.touched) {
          <mat-error>El nombre es obligatorio</mat-error>
        }
        @if (form.controls.nombre.errors?.['minlength']) {
          <mat-error>Mínimo 2 caracteres</mat-error>
        }
        @if (form.controls.nombre.errors?.['server']) {
          <mat-error>{{ form.controls.nombre.errors?.['server'] }}</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Email</mat-label>
        <input matInput type="email" formControlName="email" autocomplete="email" />
        @if (form.controls.email.errors?.['required'] && form.controls.email.touched) {
          <mat-error>El email es obligatorio</mat-error>
        }
        @if (form.controls.email.errors?.['email']) {
          <mat-error>Formato de email inválido</mat-error>
        }
        @if (form.controls.email.errors?.['server']) {
          <mat-error>{{ form.controls.email.errors?.['server'] }}</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Contraseña</mat-label>
        <input matInput type="password" formControlName="password" autocomplete="new-password" />
        @if (form.controls.password.errors?.['required'] && form.controls.password.touched) {
          <mat-error>La contraseña es obligatoria</mat-error>
        }
        @if (form.controls.password.errors?.['minlength']) {
          <mat-error>Mínimo 8 caracteres</mat-error>
        }
        @if (form.controls.password.errors?.['server']) {
          <mat-error>{{ form.controls.password.errors?.['server'] }}</mat-error>
        }
      </mat-form-field>

      @if (generalError()) {
        <p class="error-banner">{{ generalError() }}</p>
      }

      <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || loading()">
        @if (loading()) {
          <mat-spinner diameter="20"></mat-spinner>
        } @else {
          Crear cuenta
        }
      </button>
    </form>
  </mat-card-content>

  <mat-card-actions>
    <span>¿Ya tienes cuenta?</span>
    <a mat-button routerLink="/login">Entrar</a>
  </mat-card-actions>
</mat-card>
```

### 10.6 `features/auth/register/register.component.scss`

Reutiliza los estilos del login (los puedes copiar tal cual).

---

## 11. Onboarding

Pantalla post-registro: el usuario elige centro → grado → curso → marca asignaturas que ofrece → introduce contacto. Se ejecuta una vez tras el registro, pero también es accesible si el perfil está incompleto.

### 11.1 `features/onboarding/onboarding.component.ts`

```typescript
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';

import { CatalogService } from '../../core/services/catalog.service';
import { UserService } from '../../core/services/user.service';
import { OfertaService } from '../../core/services/oferta.service';
import { AuthService } from '../../core/services/auth.service';

import { Centro } from '../../core/models/centro.model';
import { Grado } from '../../core/models/grado.model';
import { Asignatura } from '../../core/models/asignatura.model';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    MatStepperModule,
    MatCardModule,
  ],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.scss',
})
export class OnboardingComponent implements OnInit {
  private fb = inject(FormBuilder);
  private catalog = inject(CatalogService);
  private userService = inject(UserService);
  private ofertaService = inject(OfertaService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  centros = signal<Centro[]>([]);
  grados = signal<Grado[]>([]);
  asignaturas = signal<Asignatura[]>([]);
  loading = signal(false);

  // Paso 1: dónde estudias
  stepCurso = this.fb.nonNullable.group({
    centroId: [0, Validators.required],
    gradoId: [0, Validators.required],
    curso: [1, [Validators.required, Validators.min(1), Validators.max(4)]],
  });

  // Paso 2: qué ofreces (lo construimos dinámicamente)
  // Lo gestionamos como un signal de ids seleccionados
  asignaturasSeleccionadas = signal<Set<number>>(new Set());

  // Paso 3: contacto
  stepContacto = this.fb.nonNullable.group({
    contactoPreferido: ['instagram' as 'instagram' | 'telefono' | 'email', Validators.required],
    contactoValor: ['', Validators.required],
  });

  ngOnInit(): void {
    this.catalog.getCentros().subscribe((c) => this.centros.set(c));
  }

  onCentroChange(centroId: number): void {
    this.grados.set([]);
    this.asignaturas.set([]);
    this.stepCurso.patchValue({ gradoId: 0 });
    if (!centroId) return;
    this.catalog.getGrados(centroId).subscribe((g) => this.grados.set(g));
  }

  onGradoOrCursoChange(): void {
    const { gradoId, curso } = this.stepCurso.getRawValue();
    this.asignaturasSeleccionadas.set(new Set());
    if (!gradoId || !curso) return;
    this.catalog.getAsignaturas(gradoId, curso).subscribe((a) => this.asignaturas.set(a));
  }

  toggleAsignatura(id: number, checked: boolean): void {
    const next = new Set(this.asignaturasSeleccionadas());
    if (checked) next.add(id);
    else next.delete(id);
    this.asignaturasSeleccionadas.set(next);
  }

  finalizar(): void {
    const userId = this.auth.user()?.id;
    if (!userId) return;

    const seleccion = Array.from(this.asignaturasSeleccionadas());
    if (seleccion.length === 0) {
      this.snackBar.open('Marca al menos una asignatura', 'Cerrar', { duration: 3000 });
      return;
    }

    // Tomamos cualquier asignatura seleccionada como "cursoActual"
    // (su grado y curso son los del usuario; el backend los deriva)
    const asignaturaParaCursoActual = seleccion[0];

    this.loading.set(true);

    // Paso A: actualizar perfil
    const updatePayload = {
      cursoActual: { asignaturaId: asignaturaParaCursoActual },
      contactoPreferido: this.stepContacto.controls.contactoPreferido.value,
      contactoValor: this.stepContacto.controls.contactoValor.value,
    };

    this.userService.updateUser(userId, updatePayload).subscribe({
      next: (user) => {
        this.auth.setUser(user);

        // Paso B: crear ofertas en paralelo (forkJoin las ejecuta a la vez)
        const peticiones = seleccion.map((id) =>
          this.ofertaService.create({ asignaturaId: id }).pipe(
            // Si una falla (p.ej. ya existía), seguimos con las demás
            catchError(() => of(null))
          )
        );

        forkJoin(peticiones).subscribe({
          next: () => {
            this.loading.set(false);
            this.snackBar.open('¡Onboarding completado!', 'Cerrar', { duration: 3000 });
            this.router.navigate(['/']);
          },
          error: () => {
            this.loading.set(false);
            this.snackBar.open('Algunas ofertas no se pudieron crear', 'Cerrar', { duration: 4000 });
          },
        });
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Error al guardar el perfil', 'Cerrar', { duration: 4000 });
      },
    });
  }
}
```

### 11.2 `features/onboarding/onboarding.component.html`

```html
<mat-card class="onboarding-card">
  <mat-card-header>
    <mat-card-title>Completa tu perfil</mat-card-title>
    <mat-card-subtitle>Cuéntanos qué estudias y en qué puedes ayudar</mat-card-subtitle>
  </mat-card-header>

  <mat-card-content>
    <mat-stepper linear>
      <!-- Paso 1: dónde estudias -->
      <mat-step [stepControl]="stepCurso" label="Dónde estudias">
        <form [formGroup]="stepCurso">
          <mat-form-field appearance="outline">
            <mat-label>Centro</mat-label>
            <mat-select
              formControlName="centroId"
              (selectionChange)="onCentroChange($event.value)"
            >
              @for (centro of centros(); track centro.id) {
                <mat-option [value]="centro.id">{{ centro.nombre }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Grado</mat-label>
            <mat-select
              formControlName="gradoId"
              [disabled]="grados().length === 0"
              (selectionChange)="onGradoOrCursoChange()"
            >
              @for (grado of grados(); track grado.id) {
                <mat-option [value]="grado.id">{{ grado.nombre }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Curso actual</mat-label>
            <mat-select formControlName="curso" (selectionChange)="onGradoOrCursoChange()">
              <mat-option [value]="1">1º</mat-option>
              <mat-option [value]="2">2º</mat-option>
              <mat-option [value]="3">3º</mat-option>
              <mat-option [value]="4">4º</mat-option>
            </mat-select>
          </mat-form-field>

          <div class="step-actions">
            <button mat-button matStepperNext [disabled]="stepCurso.invalid">Siguiente</button>
          </div>
        </form>
      </mat-step>

      <!-- Paso 2: qué ofreces -->
      <mat-step label="Qué ofreces">
        <p>Selecciona las asignaturas que ya has aprobado y puedes ayudar a otros con ellas:</p>

        @if (asignaturas().length === 0) {
          <p class="muted">Selecciona primero un grado y curso.</p>
        }

        <div class="asig-list">
          @for (asig of asignaturas(); track asig.id) {
            <mat-checkbox
              [checked]="asignaturasSeleccionadas().has(asig.id)"
              (change)="toggleAsignatura(asig.id, $event.checked)"
            >
              {{ asig.nombre }} ({{ asig.curso }}º)
            </mat-checkbox>
          }
        </div>

        <div class="step-actions">
          <button mat-button matStepperPrevious>Atrás</button>
          <button mat-button matStepperNext>Siguiente</button>
        </div>
      </mat-step>

      <!-- Paso 3: contacto -->
      <mat-step [stepControl]="stepContacto" label="Cómo te contactan">
        <form [formGroup]="stepContacto">
          <mat-form-field appearance="outline">
            <mat-label>Canal preferido</mat-label>
            <mat-select formControlName="contactoPreferido">
              <mat-option value="instagram">Instagram</mat-option>
              <mat-option value="telefono">Teléfono</mat-option>
              <mat-option value="email">Email</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Tu identificador (handle, número o email)</mat-label>
            <input matInput formControlName="contactoValor" />
          </mat-form-field>

          <div class="step-actions">
            <button mat-button matStepperPrevious>Atrás</button>
            <button
              mat-raised-button
              color="primary"
              [disabled]="stepContacto.invalid || loading()"
              (click)="finalizar()"
            >
              Finalizar
            </button>
          </div>
        </form>
      </mat-step>
    </mat-stepper>
  </mat-card-content>
</mat-card>
```

### 11.3 `features/onboarding/onboarding.component.scss`

```scss
.onboarding-card {
  max-width: 720px;
  margin: 32px auto;
}

mat-form-field {
  display: block;
  width: 100%;
}

.asig-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 8px;
  margin: 16px 0;
}

.muted {
  color: rgba(0, 0, 0, 0.6);
}

.step-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}
```

---

## 12. Mi perfil

Pantalla para que el usuario edite su nombre, foto y datos de contacto.

### 12.1 `features/profile/my-profile.component.ts`

```typescript
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './my-profile.component.html',
  styleUrl: './my-profile.component.scss',
})
export class MyProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);

  loading = signal(false);

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    foto: [''],
    contactoPreferido: ['instagram' as 'instagram' | 'telefono' | 'email'],
    contactoValor: [''],
  });

  ngOnInit(): void {
    const user = this.auth.user();
    if (!user) return;
    this.form.patchValue({
      nombre: user.nombre,
      foto: user.foto ?? '',
      contactoPreferido: user.contactoPreferido ?? 'instagram',
      contactoValor: user.contactoValor ?? '',
    });
  }

  guardar(): void {
    const user = this.auth.user();
    if (!user || this.form.invalid) return;
    this.loading.set(true);

    const raw = this.form.getRawValue();
    this.userService
      .updateUser(user.id, {
        nombre: raw.nombre,
        foto: raw.foto || null,
        contactoPreferido: raw.contactoPreferido,
        contactoValor: raw.contactoValor,
      })
      .subscribe({
        next: (updated) => {
          this.auth.setUser(updated);
          this.loading.set(false);
          this.snackBar.open('Perfil actualizado', 'Cerrar', { duration: 3000 });
        },
        error: () => {
          this.loading.set(false);
          this.snackBar.open('Error al guardar', 'Cerrar', { duration: 4000 });
        },
      });
  }
}
```

### 12.2 `features/profile/my-profile.component.html`

```html
<mat-card class="profile-card">
  <mat-card-header>
    <mat-card-title>Mi perfil</mat-card-title>
  </mat-card-header>

  <mat-card-content>
    <form [formGroup]="form" (ngSubmit)="guardar()">
      <mat-form-field appearance="outline">
        <mat-label>Nombre</mat-label>
        <input matInput formControlName="nombre" />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>URL de foto (opcional)</mat-label>
        <input matInput formControlName="foto" />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Canal de contacto</mat-label>
        <mat-select formControlName="contactoPreferido">
          <mat-option value="instagram">Instagram</mat-option>
          <mat-option value="telefono">Teléfono</mat-option>
          <mat-option value="email">Email</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Tu identificador</mat-label>
        <input matInput formControlName="contactoValor" />
      </mat-form-field>

      <button
        mat-raised-button
        color="primary"
        type="submit"
        [disabled]="form.invalid || loading()"
      >
        Guardar cambios
      </button>
    </form>
  </mat-card-content>
</mat-card>
```

### 12.3 `features/profile/my-profile.component.scss`

```scss
.profile-card {
  max-width: 560px;
  margin: 32px auto;
}

mat-form-field {
  display: block;
  width: 100%;
}
```

---

## 13. Home (búsqueda)

Página principal: el usuario elige entre buscar por **grado completo** o por **asignatura concreta** y se le muestra una rejilla de tarjetas con las ofertas que cumplen.

### 13.1 `shared/oferta-card/oferta-card.component.ts`

Una tarjeta reutilizable que muestra una oferta.

```typescript
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

import { Oferta } from '../../core/models/oferta.model';

@Component({
  selector: 'app-oferta-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  templateUrl: './oferta-card.component.html',
  styleUrl: './oferta-card.component.scss',
})
export class OfertaCardComponent {
  @Input({ required: true }) oferta!: Oferta;

  constructor(private router: Router) {}

  abrirDetalle(): void {
    // Pasamos la oferta al detalle por state para evitar una llamada extra.
    // Ver nota en sección 14.
    this.router.navigate(['/ofertas', this.oferta.id], {
      state: { oferta: this.oferta },
    });
  }
}
```

### 13.2 `shared/oferta-card/oferta-card.component.html`

```html
<mat-card class="oferta-card" (click)="abrirDetalle()">
  <mat-card-header>
    @if (oferta.user.foto) {
      <img mat-card-avatar [src]="oferta.user.foto" alt="" />
    } @else {
      <div mat-card-avatar class="avatar-placeholder">
        {{ oferta.user.nombre.charAt(0) }}
      </div>
    }
    <mat-card-title>{{ oferta.asignatura.nombre }}</mat-card-title>
    <mat-card-subtitle>
      {{ oferta.asignatura.grado.nombre }} · {{ oferta.asignatura.curso }}º
    </mat-card-subtitle>
  </mat-card-header>

  <mat-card-content>
    <p class="autor">Por {{ oferta.user.nombre }}</p>
    @if (oferta.descripcionCorta) {
      <p class="desc">{{ oferta.descripcionCorta }}</p>
    }
  </mat-card-content>

  <mat-card-actions>
    <button mat-button color="primary">Ver más</button>
  </mat-card-actions>
</mat-card>
```

### 13.3 `shared/oferta-card/oferta-card.component.scss`

```scss
.oferta-card {
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  height: 100%;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.avatar-placeholder {
  background: #3f51b5;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.autor {
  margin: 0 0 8px;
  font-size: 0.9rem;
  color: rgba(0, 0, 0, 0.6);
}

.desc {
  margin: 0;
  font-size: 0.95rem;
}
```

### 13.4 `features/home/home.component.ts`

```typescript
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CatalogService } from '../../core/services/catalog.service';
import { OfertaService } from '../../core/services/oferta.service';

import { Centro } from '../../core/models/centro.model';
import { Grado } from '../../core/models/grado.model';
import { Asignatura } from '../../core/models/asignatura.model';
import { Oferta } from '../../core/models/oferta.model';

import { OfertaCardComponent } from '../../shared/oferta-card/oferta-card.component';

type ModoBusqueda = 'grado' | 'asignatura';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonToggleModule,
    MatProgressSpinnerModule,
    OfertaCardComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private catalog = inject(CatalogService);
  private ofertaService = inject(OfertaService);

  modo = signal<ModoBusqueda>('grado');

  centros = signal<Centro[]>([]);
  grados = signal<Grado[]>([]);
  asignaturas = signal<Asignatura[]>([]);
  ofertas = signal<Oferta[]>([]);

  centroId = signal<number | null>(null);
  gradoId = signal<number | null>(null);
  curso = signal<number | null>(null);
  asignaturaId = signal<number | null>(null);

  loading = signal(false);

  ngOnInit(): void {
    this.catalog.getCentros().subscribe((c) => this.centros.set(c));
  }

  cambiarModo(m: ModoBusqueda): void {
    this.modo.set(m);
    this.ofertas.set([]);
    this.asignaturaId.set(null);
    this.curso.set(null);
  }

  onCentroChange(id: number): void {
    this.centroId.set(id);
    this.gradoId.set(null);
    this.grados.set([]);
    this.asignaturas.set([]);
    if (id) this.catalog.getGrados(id).subscribe((g) => this.grados.set(g));
  }

  onGradoChange(id: number): void {
    this.gradoId.set(id);
    this.asignaturas.set([]);
    this.asignaturaId.set(null);
    if (id && this.modo() === 'asignatura') {
      this.catalog.getAsignaturas(id).subscribe((a) => this.asignaturas.set(a));
    }
  }

  buscar(): void {
    this.loading.set(true);
    this.ofertas.set([]);

    if (this.modo() === 'asignatura' && this.asignaturaId()) {
      this.ofertaService.search({ asignatura: this.asignaturaId()! }).subscribe({
        next: (o) => {
          this.ofertas.set(o);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    } else if (this.modo() === 'grado' && this.gradoId()) {
      this.ofertaService.search({
        grado: this.gradoId()!,
        curso: this.curso() ?? undefined,
      }).subscribe({
        next: (o) => {
          this.ofertas.set(o);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    } else {
      this.loading.set(false);
    }
  }
}
```

### 13.5 `features/home/home.component.html`

```html
<section class="search-panel">
  <h1>Encuentra a quién te puede ayudar</h1>

  <mat-button-toggle-group
    [value]="modo()"
    (change)="cambiarModo($event.value)"
    class="modo-toggle"
  >
    <mat-button-toggle value="grado">Por grado y curso</mat-button-toggle>
    <mat-button-toggle value="asignatura">Por asignatura concreta</mat-button-toggle>
  </mat-button-toggle-group>

  <div class="filtros">
    <mat-form-field appearance="outline">
      <mat-label>Centro</mat-label>
      <mat-select [value]="centroId()" (selectionChange)="onCentroChange($event.value)">
        @for (c of centros(); track c.id) {
          <mat-option [value]="c.id">{{ c.nombre }}</mat-option>
        }
      </mat-select>
    </mat-form-field>

    <mat-form-field appearance="outline">
      <mat-label>Grado</mat-label>
      <mat-select
        [value]="gradoId()"
        [disabled]="grados().length === 0"
        (selectionChange)="onGradoChange($event.value)"
      >
        @for (g of grados(); track g.id) {
          <mat-option [value]="g.id">{{ g.nombre }}</mat-option>
        }
      </mat-select>
    </mat-form-field>

    @if (modo() === 'grado') {
      <mat-form-field appearance="outline">
        <mat-label>Curso (opcional)</mat-label>
        <mat-select [value]="curso()" (selectionChange)="curso.set($event.value)">
          <mat-option [value]="null">Todos</mat-option>
          <mat-option [value]="1">1º</mat-option>
          <mat-option [value]="2">2º</mat-option>
          <mat-option [value]="3">3º</mat-option>
          <mat-option [value]="4">4º</mat-option>
        </mat-select>
      </mat-form-field>
    } @else {
      <mat-form-field appearance="outline">
        <mat-label>Asignatura</mat-label>
        <mat-select
          [value]="asignaturaId()"
          [disabled]="asignaturas().length === 0"
          (selectionChange)="asignaturaId.set($event.value)"
        >
          @for (a of asignaturas(); track a.id) {
            <mat-option [value]="a.id">{{ a.nombre }} ({{ a.curso }}º)</mat-option>
          }
        </mat-select>
      </mat-form-field>
    }

    <button
      mat-raised-button
      color="primary"
      (click)="buscar()"
      [disabled]="
        (modo() === 'grado' && !gradoId()) ||
        (modo() === 'asignatura' && !asignaturaId())
      "
    >
      Buscar
    </button>
  </div>
</section>

<section class="results">
  @if (loading()) {
    <div class="spinner-wrap">
      <mat-spinner></mat-spinner>
    </div>
  } @else if (ofertas().length === 0) {
    <p class="muted">No hay resultados todavía. Aplica filtros y pulsa Buscar.</p>
  } @else {
    <div class="grid">
      @for (oferta of ofertas(); track oferta.id) {
        <app-oferta-card [oferta]="oferta" />
      }
    </div>
  }
</section>
```

### 13.6 `features/home/home.component.scss`

```scss
.search-panel {
  margin-bottom: 24px;

  h1 {
    margin: 0 0 16px;
  }
}

.modo-toggle {
  margin-bottom: 16px;
}

.filtros {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  align-items: center;

  button {
    height: 56px;
  }
}

.results {
  margin-top: 16px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.spinner-wrap {
  display: flex;
  justify-content: center;
  padding: 32px;
}

.muted {
  color: rgba(0, 0, 0, 0.6);
  text-align: center;
  padding: 32px;
}
```

---

## 14. Detalle de oferta y contacto

### 14.1 `features/oferta-detail/oferta-detail.component.ts`

```typescript
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { UserService } from '../../core/services/user.service';
import { Oferta } from '../../core/models/oferta.model';
import { Contacto } from '../../core/models/contacto.model';

@Component({
  selector: 'app-oferta-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './oferta-detail.component.html',
  styleUrl: './oferta-detail.component.scss',
})
export class OfertaDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);

  oferta = signal<Oferta | null>(null);
  contacto = signal<Contacto | null>(null);
  loadingContacto = signal(false);

  ngOnInit(): void {
    // Recuperamos la oferta del state que pasó la card.
    const navState = history.state as { oferta?: Oferta };
    if (navState.oferta) {
      this.oferta.set(navState.oferta);
      return;
    }

    // Si entran por URL directa (sin state), v1.0 no tiene endpoint para
    // obtener una oferta por id, así que volvemos al home.
    // TODO contrato: añadir GET /api/ofertas/{id} si nos hace falta esta UX.
    this.router.navigate(['/']);
  }

  verContacto(): void {
    const o = this.oferta();
    if (!o) return;
    this.loadingContacto.set(true);

    this.userService.getContacto(o.user.id).subscribe({
      next: (c) => {
        this.contacto.set(c);
        this.loadingContacto.set(false);
      },
      error: () => {
        this.loadingContacto.set(false);
        this.snackBar.open(
          'Este usuario no tiene contacto configurado',
          'Cerrar',
          { duration: 3000 }
        );
      },
    });
  }
}
```

### 14.2 `features/oferta-detail/oferta-detail.component.html`

```html
@if (oferta(); as o) {
  <a mat-button routerLink="/" class="back">← Volver</a>

  <mat-card class="detail-card">
    <mat-card-header>
      @if (o.user.foto) {
        <img mat-card-avatar [src]="o.user.foto" alt="" />
      } @else {
        <div mat-card-avatar class="avatar-placeholder">
          {{ o.user.nombre.charAt(0) }}
        </div>
      }
      <mat-card-title>{{ o.asignatura.nombre }}</mat-card-title>
      <mat-card-subtitle>
        {{ o.asignatura.grado.nombre }} · {{ o.asignatura.curso }}º curso
      </mat-card-subtitle>
    </mat-card-header>

    <mat-card-content>
      <p><strong>Ofrecido por:</strong> {{ o.user.nombre }}</p>
      @if (o.user.cursoActual) {
        <p>
          <strong>Cursando actualmente:</strong>
          {{ o.user.cursoActual.grado }} · {{ o.user.cursoActual.curso }}º
        </p>
      }
      @if (o.descripcionCorta) {
        <p>{{ o.descripcionCorta }}</p>
      }
    </mat-card-content>

    <mat-card-actions>
      @if (!contacto()) {
        <button
          mat-raised-button
          color="primary"
          (click)="verContacto()"
          [disabled]="loadingContacto()"
        >
          @if (loadingContacto()) {
            <mat-spinner diameter="20"></mat-spinner>
          } @else {
            <mat-icon>chat</mat-icon>
            Ver contacto
          }
        </button>
      } @else {
        <div class="contacto-box">
          <mat-icon>{{ contacto()!.preferido === 'instagram' ? 'photo_camera' : contacto()!.preferido === 'telefono' ? 'phone' : 'email' }}</mat-icon>
          <span>{{ contacto()!.preferido }}: <strong>{{ contacto()!.valor }}</strong></span>
        </div>
      }
    </mat-card-actions>
  </mat-card>
}
```

### 14.3 `features/oferta-detail/oferta-detail.component.scss`

```scss
.back {
  margin-bottom: 16px;
  display: inline-block;
}

.detail-card {
  max-width: 720px;
  margin: 0 auto;
}

.avatar-placeholder {
  background: #3f51b5;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.contacto-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #e8f5e9;
  border-radius: 4px;
  width: 100%;
}
```

### 14.4 Hueco del contrato

> **A discutir entre los dos**: el contrato v1.0 no incluye `GET /api/ofertas/{id}`. Si un usuario abre `/ofertas/12` por enlace directo, hoy lo redirigimos al home. Si queremos soportarlo, hay dos opciones:
>
> 1. **Añadir el endpoint** al contrato (subir versión a 1.1) y al backend. El frontend lo consumiría aquí en el `ngOnInit`.
> 2. **Aceptar la limitación** en v1: el detalle solo se accede desde la rejilla de búsqueda.
>
> Decisión por defecto en v1: opción 2. Si se decide la 1, actualizar primero `ENDPOINTS.md`.

---

## 15. Mis ofertas

### 15.1 `features/my-ofertas/my-ofertas.component.ts`

```typescript
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { OfertaService } from '../../core/services/oferta.service';
import { Oferta } from '../../core/models/oferta.model';

@Component({
  selector: 'app-my-ofertas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './my-ofertas.component.html',
  styleUrl: './my-ofertas.component.scss',
})
export class MyOfertasComponent implements OnInit {
  private ofertaService = inject(OfertaService);
  private snackBar = inject(MatSnackBar);

  ofertas = signal<Oferta[]>([]);
  loading = signal(false);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.ofertaService.getMine().subscribe({
      next: (o) => {
        this.ofertas.set(o);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  eliminar(oferta: Oferta): void {
    if (!confirm(`¿Eliminar la oferta de "${oferta.asignatura.nombre}"?`)) return;

    this.ofertaService.delete(oferta.id).subscribe({
      next: () => {
        this.ofertas.set(this.ofertas().filter((o) => o.id !== oferta.id));
        this.snackBar.open('Oferta eliminada', 'Cerrar', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('No se pudo eliminar', 'Cerrar', { duration: 4000 });
      },
    });
  }
}
```

### 15.2 `features/my-ofertas/my-ofertas.component.html`

```html
<h1>Mis ofertas</h1>

@if (loading()) {
  <div class="spinner-wrap">
    <mat-spinner></mat-spinner>
  </div>
} @else if (ofertas().length === 0) {
  <p class="muted">Aún no tienes ofertas. Crea una desde el onboarding o vuelve a editarlo.</p>
} @else {
  <div class="grid">
    @for (oferta of ofertas(); track oferta.id) {
      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ oferta.asignatura.nombre }}</mat-card-title>
          <mat-card-subtitle>
            {{ oferta.asignatura.grado.nombre }} · {{ oferta.asignatura.curso }}º
          </mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          @if (oferta.descripcionCorta) {
            <p>{{ oferta.descripcionCorta }}</p>
          } @else {
            <p class="muted">Sin descripción</p>
          }
        </mat-card-content>
        <mat-card-actions>
          <button mat-button color="warn" (click)="eliminar(oferta)">
            <mat-icon>delete</mat-icon>
            Eliminar
          </button>
        </mat-card-actions>
      </mat-card>
    }
  </div>
}
```

### 15.3 `features/my-ofertas/my-ofertas.component.scss`

```scss
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.spinner-wrap {
  display: flex;
  justify-content: center;
  padding: 32px;
}

.muted {
  color: rgba(0, 0, 0, 0.6);
}
```

---

## 16. Estilos globales y Material

`src/styles.scss`:

```scss
@use '@angular/material' as mat;
@include mat.core();

$auria-primary: mat.define-palette(mat.$indigo-palette);
$auria-accent: mat.define-palette(mat.$pink-palette, A200, A100, A400);
$auria-warn: mat.define-palette(mat.$red-palette);

$auria-theme: mat.define-light-theme((
  color: (
    primary: $auria-primary,
    accent: $auria-accent,
    warn: $auria-warn,
  ),
  typography: mat.define-typography-config(),
  density: 0,
));

@include mat.all-component-themes($auria-theme);

html, body {
  margin: 0;
  height: 100%;
  font-family: Roboto, "Helvetica Neue", sans-serif;
  background: #fafafa;
}

* {
  box-sizing: border-box;
}
```

> Si `ng add @angular/material` ya configuró un tema, este archivo te sirve de referencia para sustituirlo si quieres personalizar paleta. Si no, déjalo como está.

---

## 17. Estrategia mock API

Mientras el backend no esté listo, Aarón puede desarrollar contra mocks que devuelven exactamente lo que dice `ENDPOINTS.md`. Recomendación: **`json-server`** porque es trivial de levantar.

### 17.1 Instalar

```bash
npm install -D json-server
```

### 17.2 Crear `mock/db.json` en la raíz del front

```json
{
  "centros": [
    { "id": 1, "nombre": "Florida Universitària" }
  ],
  "grados": [
    { "id": 1, "nombre": "DAW", "centro": { "id": 1, "nombre": "Florida Universitària" } },
    { "id": 2, "nombre": "ASIR", "centro": { "id": 1, "nombre": "Florida Universitària" } },
    { "id": 3, "nombre": "DAM", "centro": { "id": 1, "nombre": "Florida Universitària" } }
  ],
  "asignaturas": [
    { "id": 1, "nombre": "Programación", "curso": 1, "grado": { "id": 1, "nombre": "DAW" } },
    { "id": 2, "nombre": "Bases de Datos", "curso": 1, "grado": { "id": 1, "nombre": "DAW" } },
    { "id": 3, "nombre": "Desarrollo Web Cliente", "curso": 2, "grado": { "id": 1, "nombre": "DAW" } }
  ],
  "ofertas": [
    {
      "id": 1,
      "user": { "id": 2, "nombre": "Demo User", "foto": null, "cursoActual": { "id": 3, "grado": "DAW", "curso": 2 } },
      "asignatura": { "id": 1, "nombre": "Programación", "curso": 1, "grado": { "id": 1, "nombre": "DAW" } },
      "descripcionCorta": "Doy clases de Programación de 1º DAW",
      "createdAt": "2025-03-15T15:00:00+00:00"
    }
  ]
}
```

### 17.3 Script en `package.json`

```json
{
  "scripts": {
    "mock-api": "json-server --watch mock/db.json --port 8000 --routes mock/routes.json"
  }
}
```

Crea `mock/routes.json` para que `/api/...` apunte al recurso correcto:

```json
{
  "/api/*": "/$1"
}
```

> **Importante:** `json-server` no implementa autenticación JWT. Para login y registro, Aarón puede comentar temporalmente el `jwtInterceptor` o crear un mock manual. En cuanto el backend real esté disponible, se cambia el `apiUrl` y se acabó.

### 17.4 Levantar mock + Angular

En dos terminales distintas:

```bash
npm run mock-api    # Terminal 1
ng serve            # Terminal 2
```

---

## 18. Probar la app de punta a punta

Cuando el backend de tu compañero esté arrancado en `http://localhost:8000` y el frontend en `http://localhost:4200`:

1. **Registro:** abre `/register`, rellena con un email nuevo. Debe redirigir al onboarding.
2. **Onboarding:** completa los 3 pasos. Al finalizar, vas al home.
3. **Búsqueda:** elige centro, grado, curso y pulsa Buscar. Deberías ver al usuario de fixtures (`demo@florida.edu`) si tu cuenta no es esa.
4. **Detalle:** clic en una tarjeta. Pulsa "Ver contacto". Debería aparecer el handle.
5. **Mis ofertas:** desde el menú superior. Las que creaste en el onboarding están aquí. Elimina una.
6. **Logout:** desde el menú. Te debe llevar a `/login`.
7. **Token caducado:** espera una hora o cambia el TTL del JWT a 1 minuto en el backend para probar. Cualquier petición debe redirigir automáticamente al login.

---

## 19. Problemas comunes

| Síntoma | Causa probable | Solución |
|---|---|---|
| `Network error` o `0` en errores | CORS mal configurado en backend | Que tu compañero revise `nelmio_cors.yaml` |
| `401` después de login correcto | El token no llega en el header | Verifica que `jwtInterceptor` está registrado en `provideHttpClient` |
| Las rutas privadas se cargan sin token | `authGuard` no aplicado | Comprueba `app.routes.ts` |
| Errores 422 no se ven en formulario | El backend no respeta el formato de `details` | Pega la respuesta cruda y compárala con `ENDPOINTS.md` 3.4 |
| `CommonModule` errors en plantilla | Falta `CommonModule` en `imports` del `@Component` | Añádelo |
| Material no aplica estilos | Tema no incluido | Revisa `styles.scss` |
| `ExpressionChangedAfterItHasBeenChecked` | Estás cambiando un signal en un computed | Mueve la mutación a un effect o método explícito |
| Datos del usuario no actualizados tras editar | No llamaste `auth.setUser(updated)` | Llámalo siempre tras un PATCH a `/users/{id}` |

---

## 20. Checklist final

- [ ] `ng new front` ejecutado
- [ ] Material instalado y tema aplicado
- [ ] Environments creados (`environment.ts` y `environment.development.ts`)
- [ ] Modelos TypeScript en `core/models/` (alineados 1:1 con `ENDPOINTS.md`)
- [ ] `AuthService` con signals
- [ ] `jwtInterceptor` y `errorInterceptor` registrados
- [ ] `authGuard` aplicado a las rutas privadas
- [ ] `CatalogService`, `UserService`, `OfertaService`
- [ ] Routing con lazy loading
- [ ] Header con menú de usuario
- [ ] Login funcional
- [ ] Register con manejo de errores 422
- [ ] Onboarding (3 pasos) que crea ofertas con `forkJoin`
- [ ] Mi perfil edita y refresca el `AuthService`
- [ ] Home con búsqueda por grado/asignatura
- [ ] Detalle de oferta con botón "Ver contacto"
- [ ] Mis ofertas con eliminación
- [ ] Mock API opcional para desarrollo en paralelo
- [ ] App probada de punta a punta contra el backend real

---

_Cuando termines este checklist, el frontend está listo. Cualquier cambio que necesites en la API se discute con tu compañero y **se actualiza primero `ENDPOINTS.md`**, luego las dos implementaciones._
