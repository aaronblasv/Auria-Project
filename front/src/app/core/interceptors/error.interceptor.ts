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