import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

interface LoginResponse {
  token: string;
}

@Injectable({
  providedIn: 'root',
})
export class Auth {

  private baseUrl = 'http://localhost:1702/api/usuario';

  constructor(private http: HttpClient) { }

  login(email: string, password: string): Observable<LoginResponse> {
    let body = {
      email: email,
      password: password
    }

    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, body);
  }

  registro(nombre: string, email: string, password: string): Observable<any> {
    let body = {
      nombre: nombre,
      email: email,
      password: password
    }

    return this.http.post<any>(`${this.baseUrl}/registrar`, body);
  }

  guardarToken(token: string): void {
    sessionStorage.setItem('token_usuario', token);
  }

  obtenerToken(): string | null {
    return sessionStorage.getItem('token_usuario');
  }

  estaLogueado(): boolean {
    let token = this.obtenerToken();
    if (token) {
      return true;
    } else {
      return false;
    }
  }

  cerrarSesion(): void {
    sessionStorage.removeItem('token_usuario')
  }
}
