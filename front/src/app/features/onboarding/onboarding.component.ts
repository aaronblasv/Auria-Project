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