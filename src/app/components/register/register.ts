import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';

// Validador personalizado para comprobar que las contraseñas coinciden
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  
  const confirmControl = control.get('confirmPassword');
  if (!confirmControl) return null;

  if (password !== confirmPassword) {
    confirmControl.setErrors({ passwordMismatch: true });
    return { passwordMismatch: true };
  } else {
    // Si coinciden y tenía el error anterior, limpiarlo
    if (confirmControl.hasError('passwordMismatch')) {
      const remainingErrors = { ...confirmControl.errors };
      delete remainingErrors['passwordMismatch'];
      const hasErrors = Object.keys(remainingErrors).length > 0;
      confirmControl.setErrors(hasErrors ? remainingErrors : null);
    }
  }
  
  return null;
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  showPassword = false;
  showConfirmPassword = false;

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  mensajeError = signal('');
  mensajeExito = signal('');
  cargando = signal(false);

  formularioRegistro = new FormGroup({
    nombre: new FormControl('', [Validators.required, Validators.minLength(3)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    confirmPassword: new FormControl('', [Validators.required])
  }, { validators: passwordMatchValidator });

  constructor(private authService: Auth, private router: Router) {}

  // Acción para registrar el usuario conectando con el backend
  registrarse() {
    if (this.formularioRegistro.invalid) {
      this.formularioRegistro.markAllAsTouched();
      
      const confirmPasswordCtrl = this.formularioRegistro.get('confirmPassword');
      if (confirmPasswordCtrl?.hasError('passwordMismatch')) {
        this.mensajeError.set('Las contraseñas ingresadas no coinciden.');
      } else {
        this.mensajeError.set('Por favor, rellena todos los campos con valores válidos.');
      }
      return;
    }

    this.mensajeError.set('');
    this.mensajeExito.set('');
    this.cargando.set(true);

    const nombre = this.formularioRegistro.value.nombre!;
    const email = this.formularioRegistro.value.email!;
    const password = this.formularioRegistro.value.password!;

    this.authService.registro(nombre, email, password).subscribe({
      next: (respuesta) => {
        this.cargando.set(false);
        this.mensajeExito.set('¡Registro completado con éxito! Redirigiendo a inicio de sesión...');
        
        // Redirigir a inicio de sesión tras 2 segundos para dar feedback visual
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        this.cargando.set(false);
        // Mostrar mensaje de error del backend en la interfaz
        const msg = err.error?.message || 'Error de conexión con el servidor o el correo ya existe.';
        this.mensajeError.set(msg);
      }
    });
  }
}
