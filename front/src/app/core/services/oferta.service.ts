import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CreateOfertaPayload, Oferta } from '../models/oferta.model';

export interface SearchOfertasParams {
  asignatura?: number;
  grado?: number;
  curso?: number;
}

@Injectable({ providedIn: 'root' })
export class OfertaService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  search(params: SearchOfertasParams): Observable<Oferta[]> {
    let httpParams = new HttpParams();
    if (params.asignatura) httpParams = httpParams.set('asignatura', params.asignatura);
    if (params.grado) httpParams = httpParams.set('grado', params.grado);
    if (params.curso) httpParams = httpParams.set('curso', params.curso);

    return this.http.get<Oferta[]>(`${this.base}/ofertas`, { params: httpParams });
  }

  getMine(): Observable<Oferta[]> {
    return this.http.get<Oferta[]>(`${this.base}/ofertas/me`);
  }

  create(payload: CreateOfertaPayload): Observable<Oferta> {
    return this.http.post<Oferta>(`${this.base}/ofertas`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/ofertas/${id}`);
  }
}