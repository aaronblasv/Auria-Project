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
    this.router.navigate(['/ofertas', this.oferta.id], {
      state: { oferta: this.oferta },
    });
  }
}