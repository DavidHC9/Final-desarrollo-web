import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RestauranteService, Restaurante } from '../../services/restaurante';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-home',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  // Lista de restaurantes (se sincroniza con MongoDB)
  restaurantes = signal<Restaurante[]>([]);

  // Término de búsqueda
  searchTerm = signal('');

  // Criterio de ordenación ('fecha' | 'calificacion' | 'nombre')
  sortBy = signal<'fecha' | 'calificacion' | 'nombre'>('fecha');

  // Lista filtrada y ordenada dinámicamente según la búsqueda y el criterio de ordenación
  restaurantesFiltrados = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    let items = this.restaurantes();

    // 1. Filtrar por término de búsqueda si existe
    if (term) {
      items = items.filter(r => 
        (r.nombre && r.nombre.toLowerCase().includes(term)) || 
        (r.observaciones && r.observaciones.toLowerCase().includes(term))
      );
    }

    // 2. Ordenar según el criterio seleccionado
    const sortVal = this.sortBy();
    return [...items].sort((a, b) => {
      if (sortVal === 'fecha') {
        // Ordenar por fecha: del más reciente al más antiguo
        return new Date(b.fechavisita).getTime() - new Date(a.fechavisita).getTime();
      } else if (sortVal === 'calificacion') {
        // Ordenar por calificación: del más alto al más bajo
        return b.calificacion - a.calificacion;
      } else {
        // Ordenar por nombre: alfabético A-Z
        return a.nombre.localeCompare(b.nombre);
      }
    });
  });

  // Estados de control del modal
  isModalOpen = false;
  isEditMode = false;
  selectedRestauranteId: string | null = null;

  // Calificación seleccionada interactivamente en el modal
  selectedRating = 5;

  // ID del usuario que ha iniciado sesión
  idUsuarioLogueado = '';

  // Formulario Reactivo para agregar/editar
  restauranteForm = new FormGroup({
    nombre: new FormControl('', [Validators.required]),
    fechavisita: new FormControl('', [Validators.required]),
    observaciones: new FormControl('')
  });

  constructor(
    private router: Router, 
    private restauranteService: RestauranteService,
    private authService: Auth
  ) {}

  ngOnInit() {
    // Obtener el ID del usuario logueado
    this.idUsuarioLogueado = this.authService.obtenerIdUsuario();
    // Al cargar la vista, consultar la base de datos de MongoDB
    this.cargarRestaurantes();
  }

  // Consultar todos los restaurantes en el backend
  cargarRestaurantes() {
    this.restauranteService.consultarTodos().subscribe({
      next: (data) => {
        this.restaurantes.set(data);
      },
      error: (err) => {
        console.error('Error al consultar restaurantes desde MongoDB:', err);
      }
    });
  }

  // Cambiar término de búsqueda
  onSearchChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  // Cambiar criterio de ordenación
  onSortChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.sortBy.set(select.value as 'fecha' | 'calificacion' | 'nombre');
  }

  // Establecer calificación por estrellas en el modal (permite alternar a 0 si se pulsa la primera estrella ya activa)
  setRating(rating: number) {
    if (rating === 1 && this.selectedRating === 1) {
      this.selectedRating = 0;
    } else {
      this.selectedRating = rating;
    }
  }

  // Abrir modal en modo "Agregar"
  openAddModal() {
    this.isEditMode = false;
    this.selectedRestauranteId = null;
    this.selectedRating = 0;
    this.restauranteForm.reset({
      nombre: '',
      fechavisita: new Date().toISOString().split('T')[0], // fecha de hoy por defecto
      observaciones: ''
    });
    this.isModalOpen = true;
  }

  // Abrir modal en modo "Editar"
  openEditModal(restaurante: Restaurante) {
    if (!this.esDuenio(restaurante)) {
      alert('No tienes permisos para editar esta reseña.');
      return;
    }
    this.isEditMode = true;
    this.selectedRestauranteId = restaurante._id || null;
    this.selectedRating = restaurante.calificacion;
    
    // Formatear fecha para el input date (YYYY-MM-DD)
    let fecha = '';
    if (restaurante.fechavisita) {
      fecha = new Date(restaurante.fechavisita).toISOString().split('T')[0];
    }

    this.restauranteForm.setValue({
      nombre: restaurante.nombre,
      fechavisita: fecha,
      observaciones: restaurante.observaciones || ''
    });
    this.isModalOpen = true;
  }

  // Cerrar el modal
  closeModal() {
    this.isModalOpen = false;
  }

  // Guardar la reseña (Crear o Editar) conectando con la API del backend
  saveRestaurante() {
    if (this.restauranteForm.invalid) {
      this.restauranteForm.markAllAsTouched();
      return;
    }

    const formVal = this.restauranteForm.value;
    
    const datosRestaurante: Restaurante = {
      nombre: formVal.nombre!,
      calificacion: this.selectedRating,
      fechavisita: formVal.fechavisita!,
      observaciones: formVal.observaciones || ''
    };
    
    if (this.isEditMode && this.selectedRestauranteId) {
      // Modo Edición: Actualizar en MongoDB
      this.restauranteService.actualizarRestaurante(this.selectedRestauranteId, datosRestaurante).subscribe({
        next: () => {
          this.cargarRestaurantes(); // Recargar listado
          this.closeModal();
        },
        error: (err) => {
          console.error('Error al actualizar restaurante:', err);
        }
      });
    } else {
      // Modo Creación: Guardar en MongoDB
      this.restauranteService.crearRestaurante(datosRestaurante).subscribe({
        next: () => {
          this.cargarRestaurantes(); // Recargar listado
          this.closeModal();
        },
        error: (err) => {
          console.error('Error al crear restaurante:', err);
        }
      });
    }
  }

  // Eliminar reseña conectando con la API del backend
  eliminarRestaurante(restaurante: Restaurante) {
    if (!restaurante || !restaurante._id) return;
    if (!this.esDuenio(restaurante)) {
      alert('No tienes permisos para eliminar esta reseña.');
      return;
    }
    const confirmacion = confirm('¿Estás seguro de que deseas eliminar esta reseña?');
    if (confirmacion) {
      this.restauranteService.borrarPorId(restaurante._id).subscribe({
        next: () => {
          this.cargarRestaurantes(); // Recargar listado
        },
        error: (err) => {
          console.error('Error al eliminar restaurante de MongoDB:', err);
        }
      });
    }
  }

  // Verificar si el usuario actual es el creador de la reseña
  esDuenio(restaurante: Restaurante): boolean {
    // Si la reseña no tiene dueño (creada antes del control de propiedad), permitimos editarla/eliminarla para evitar el bloqueo de datos antiguos
    if (!restaurante.usuarioId) return true;
    return restaurante.usuarioId === this.idUsuarioLogueado;
  }

  // Generadores auxiliares de arreglos para dibujar estrellas en HTML
  getStars(rating: number): number[] {
    return Array(rating).fill(0);
  }

  getEmptyStars(rating: number): number[] {
    return Array(5 - rating).fill(0);
  }

  // Obtener el correo del usuario activo decodificado del JWT
  obtenerEmailUsuario(): string {
    return this.authService.obtenerEmailUsuario() || 'admin@thedailyfeast.com';
  }

  // Cerrar sesión limpiando la información en sessionStorage
  cerrarSesion() {
    this.authService.cerrarSesion();
    this.router.navigate(['/login']);
  }
}
