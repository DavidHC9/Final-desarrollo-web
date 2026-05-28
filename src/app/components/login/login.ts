import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Auth } from '../../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
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
    email: new FormControl(''),
    password: new FormControl('')
  });

  constructor(
    private authService: Auth,
    private router: Router
  ) {
  }

  iniciarSesion(): void {

    const email = this.formularioLogin.value.email || '';
    const password = this.formularioLogin.value.password || '';

    this.authService.login(email, password).subscribe({
      next: respuesta => {

        if (respuesta.token) {
          this.authService.guardarToken(respuesta.token);
          this.router.navigate(['/home'])
        } else {
          this.mensajeError.set('No se recibió token');
        }
      },
      error: error => {
        this.mensajeError.set('Email o contraseña incorrectos');
        console.error(error);
      }
    })

  }
}


