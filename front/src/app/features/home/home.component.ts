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
    this.catalog.getCentros().subscribe((centros) => this.centros.set(centros));
  }

  cambiarModo(modo: ModoBusqueda): void {
    this.modo.set(modo);
    this.ofertas.set([]);
    this.asignaturaId.set(null);
    this.curso.set(null);
  }

  onCentroChange(id: number): void {
    this.centroId.set(id);
    this.gradoId.set(null);
    this.grados.set([]);
    this.asignaturas.set([]);

    if (id) {
      this.catalog.getGrados(id).subscribe((grados) => this.grados.set(grados));
    }
  }

  onGradoChange(id: number): void {
    this.gradoId.set(id);
    this.asignaturas.set([]);
    this.asignaturaId.set(null);

    if (id && this.modo() === 'asignatura') {
      this.catalog.getAsignaturas(id).subscribe((asignaturas) => this.asignaturas.set(asignaturas));
    }
  }

  buscar(): void {
    this.loading.set(true);
    this.ofertas.set([]);

    if (this.modo() === 'asignatura' && this.asignaturaId()) {
      this.ofertaService.search({ asignatura: this.asignaturaId()! }).subscribe({
        next: (ofertas) => {
          this.ofertas.set(ofertas);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
      return;
    }

    if (this.modo() === 'grado' && this.gradoId()) {
      this.ofertaService
        .search({
          grado: this.gradoId()!,
          curso: this.curso() ?? undefined,
        })
        .subscribe({
          next: (ofertas) => {
            this.ofertas.set(ofertas);
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
      return;
    }

    this.loading.set(false);
  }
}