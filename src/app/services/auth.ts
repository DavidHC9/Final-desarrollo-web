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

  private apiUrl = 'http://localhost:1702/api/usuario/login';

  constructor(private http: HttpClient) { }

  login(email: string, password: string): Observable<LoginResponse> {
    let body = {
      email: email,
      password: password
    }

    return this.http.post<LoginResponse>(this.apiUrl, body);
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

  // Decodifica el token JWT guardado para extraer el correo del usuario
  obtenerEmailUsuario(): string {
    let token = this.obtenerToken();
    if (!token) {
      return '';
    }
    try {
      let payloadBase64 = token.split('.')[1];
      let payloadDecodificado = atob(payloadBase64);
      let payload = JSON.parse(payloadDecodificado);
      return payload.email || '';
    } catch (e) {
      return '';
    }
  }

  cerrarSesion(): void {
    sessionStorage.removeItem('token_usuario')
  }
}
