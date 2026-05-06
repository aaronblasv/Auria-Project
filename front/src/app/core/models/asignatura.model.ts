export interface Asignatura {
  id: number;
  nombre: string;
  curso: number;
  grado: {
    id: number;
    nombre: string;
  };
}