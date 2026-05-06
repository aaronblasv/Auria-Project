import { UserPublic } from './user.model';
import { Asignatura } from './asignatura.model';

export interface Oferta {
  id: number;
  user: UserPublic;
  asignatura: Asignatura;
  descripcionCorta: string | null;
  createdAt: string;
}

export interface CreateOfertaPayload {
  asignaturaId: number;
  descripcionCorta?: string;
}