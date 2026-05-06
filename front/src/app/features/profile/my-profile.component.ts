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