import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Auth } from './auth';

export interface Restaurante {
  _id?: string;
  nombre: string;
  calificacion: number;
  fechavisita: string;
  observaciones: string;
}

@Injectable({
  providedIn: 'root',
})
export class RestauranteService {
  private apiUrl = 'http://localhost:1702/api/restaurantes';

  constructor(private http: HttpClient, private auth: Auth) {}

  // Generar cabeceras con el Token JWT del sessionStorage
  private obtenerCabeceras(): HttpHeaders {
    const token = this.auth.obtenerToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Consultar todos los restaurantes en MongoDB
  consultarTodos(): Observable<Restaurante[]> {
    return this.http.get<Restaurante[]>(this.apiUrl, { headers: this.obtenerCabeceras() });
  }

  // Consultar un restaurante por ID
  consultarPorId(id: string): Observable<Restaurante> {
    return this.http.get<Restaurante>(`${this.apiUrl}/${id}`, { headers: this.obtenerCabeceras() });
  }

  // Crear una reseña de restaurante en MongoDB
  crearRestaurante(restaurante: Restaurante): Observable<any> {
    return this.http.post<any>(this.apiUrl, restaurante, { headers: this.obtenerCabeceras() });
  }

  // Actualizar una reseña por ID
  actualizarRestaurante(id: string, restaurante: Restaurante): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, restaurante, { headers: this.obtenerCabeceras() });
  }

  // Borrar una reseña por ID
  borrarPorId(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers: this.obtenerCabeceras() });
  }
}
