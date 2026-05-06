import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  UpdateUserPayload,
  User,
  UserPublic,
} from '../models/user.model';
import { Contacto } from '../models/contacto.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getMe(): Observable<User> {
    return this.http.get<User>(`${this.base}/me`);
  }

  getUser(id: number): Observable<UserPublic> {
    return this.http.get<UserPublic>(`${this.base}/users/${id}`);
  }

  updateUser(id: number, payload: UpdateUserPayload): Observable<User> {
    return this.http.patch<User>(`${this.base}/users/${id}`, payload);
  }

  getContacto(userId: number): Observable<Contacto> {
    return this.http.get<Contacto>(`${this.base}/users/${userId}/contacto`);
  }
}