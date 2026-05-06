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