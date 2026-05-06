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