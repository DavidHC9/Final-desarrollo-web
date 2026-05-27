import { Component, signal } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [],
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
}


