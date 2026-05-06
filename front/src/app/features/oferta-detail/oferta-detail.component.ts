import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

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
  private router = inject(Router);
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);

  oferta = signal<Oferta | null>(null);
  contacto = signal<Contacto | null>(null);
  loadingContacto = signal(false);

  ngOnInit(): void {
    const navState = history.state as { oferta?: Oferta };

    if (navState.oferta) {
      this.oferta.set(navState.oferta);
      return;
    }

    this.router.navigate(['/']);
  }

  verContacto(): void {
    const oferta = this.oferta();
    if (!oferta) {
      return;
    }

    this.loadingContacto.set(true);
    this.userService.getContacto(oferta.user.id).subscribe({
      next: (contacto) => {
        this.contacto.set(contacto);
        this.loadingContacto.set(false);
      },
      error: () => {
        this.loadingContacto.set(false);
        this.snackBar.open('Este usuario no tiene contacto configurado', 'Cerrar', {
          duration: 3000,
        });
      },
    });
  }
}