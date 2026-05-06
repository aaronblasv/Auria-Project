export interface CursoActual {
  id: number;
  grado: string;
  curso: number;
}

export interface User {
  id: number;
  email: string;
  nombre: string;
  foto: string | null;
  cursoActual: CursoActual | null;
  contactoPreferido: 'instagram' | 'telefono' | 'email' | null;
  contactoValor: string | null;
  createdAt: string;
}

export interface UserPublic {
  id: number;
  nombre: string;
  foto: string | null;
  cursoActual: CursoActual | null;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterPayload {
  email: string;
  password: string;
  nombre: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UpdateUserPayload {
  nombre?: string;
  foto?: string | null;
  cursoActual?: { asignaturaId: number };
  contactoPreferido?: 'instagram' | 'telefono' | 'email';
  contactoValor?: string;
}