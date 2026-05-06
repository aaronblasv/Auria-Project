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