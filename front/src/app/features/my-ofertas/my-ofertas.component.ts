import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { OfertaService } from '../../core/services/oferta.service';
import { Oferta } from '../../core/models/oferta.model';

@Component({
  selector: 'app-my-ofertas',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
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
      next: (ofertas) => {
        this.ofertas.set(ofertas);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  eliminar(oferta: Oferta): void {
    if (!confirm(`¿Eliminar la oferta de "${oferta.asignatura.nombre}"?`)) {
      return;
    }

    this.ofertaService.delete(oferta.id).subscribe({
      next: () => {
        this.ofertas.set(this.ofertas().filter((item) => item.id !== oferta.id));
        this.snackBar.open('Oferta eliminada', 'Cerrar', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('No se pudo eliminar', 'Cerrar', { duration: 4000 });
      },
    });
  }
}