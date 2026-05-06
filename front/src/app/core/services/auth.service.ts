import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  User,
} from '../models/user.model';

const TOKEN_KEY = 'auria_token';
const USER_KEY = 'auria_user';

function getStorage(): Storage | null {
  const storage = globalThis.localStorage;
  if (
    storage &&
    typeof storage.getItem === 'function' &&
    typeof storage.setItem === 'function' &&
    typeof storage.removeItem === 'function'
  ) {
    return storage;
  }

  return null;
}

function readStorageItem(key: string): string | null {
  return getStorage()?.getItem(key) ?? null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Estado interno con signals
  private _token = signal<string | null>(readStorageItem(TOKEN_KEY));
  private _user = signal<User | null>(this.loadStoredUser());

  // Lecturas públicas (read-only)
  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._token() !== null);

  register(payload: RegisterPayload): Observable<User> {
    return this.http.post<User>(`${environment.apiUrl}/auth/register`, payload);
  }

  login(payload: LoginPayload): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, payload)
      .pipe(
        tap((response) => {
          this.persistSession(response.token, response.user);
        })
      );
  }

  logout(): void {
    const storage = getStorage();
    storage?.removeItem(TOKEN_KEY);
    storage?.removeItem(USER_KEY);
    this._token.set(null);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  /** Refresca el user del estado tras un PATCH. */
  setUser(user: User): void {
    getStorage()?.setItem(USER_KEY, JSON.stringify(user));
    this._user.set(user);
  }

  private persistSession(token: string, user: User): void {
    const storage = getStorage();
    storage?.setItem(TOKEN_KEY, token);
    storage?.setItem(USER_KEY, JSON.stringify(user));
    this._token.set(token);
    this._user.set(user);
  }

  private loadStoredUser(): User | null {
    const raw = readStorageItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }
}