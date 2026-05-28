import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  showPassword = false;

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  mensajeError = signal('');

  formularioLogin = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required])
  });

  constructor(private authService: Auth, private router: Router) {}

  // Acción para iniciar sesión conectando con el backend
  iniciarSesion() {
    if (this.formularioLogin.invalid) {
      this.formularioLogin.markAllAsTouched();
      return;
    }

    const email = this.formularioLogin.value.email!;
    const password = this.formularioLogin.value.password!;

    this.authService.login(email, password).subscribe({
      next: (respuesta) => {
        // Almacenar el token e ir al Home
        this.authService.guardarToken(respuesta.token);
        this.router.navigate(['/home']);
      },
      error: (err) => {
        // Mostrar mensaje de error del backend en la interfaz
        const msg = err.error?.message || 'Error de conexión con el servidor.';
        this.mensajeError.set(msg);
      }
    });
  }
}
