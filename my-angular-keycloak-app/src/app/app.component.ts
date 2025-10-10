import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  template: `
    <header>
      <div class="header-left">
        <div class="title">
          <h1>Ciberseguridad IAM - 2CL</h1>
          <h2>Sistema de gestión de identidades</h2>
        </div>
      </div>

      <div class="header-right" *ngIf="isAuthenticated">
        <span class="username">{{ username }}</span>
        <button (click)="logout()">Cerrar sesión</button>
      </div>
    </header>

    <main>
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    /* Header general */
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 32px;
      background-color: #fff;
      border-bottom: 1px solid #d1d5db; /* línea gris */
      font-family: 'Courier Prime', monospace; /* Fuente aplicada a todo el header */
    }

    /* Título y subtítulo */
    .title h1 {
      font-size: 1.3rem;
      font-weight: 700;
      margin: 0;
      color: #111827; /* gris oscuro */
    }

    .title h2 {
      font-size: 0.95rem;
      font-weight: 500;
      color: #4b5563; /* gris medio */
      margin: 2px 0 0 0;
    }

    /* Contenedor del lado derecho (usuario + botón) */
    .header-right {
      display: flex;
      align-items: center;
      gap: 14px;
      font-family: 'Courier Prime', monospace; /* refuerzo de fuente */
    }

    .username {
      font-weight: 600;
      color: #374151; /* gris */
    }

    button {
      background-color: #f3f4f6;
      border: 1px solid #d1d5db;
      color: #374151;
      font-weight: 600;
      padding: 6px 14px;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 0.3s, transform 0.2s;
      font-family: 'Courier Prime', monospace; /* refuerzo de fuente */
    }

    button:hover {
      background-color: #e5e7eb;
    }

    button:active {
      transform: scale(0.98);
    }

    /* Main */
    main {
      padding: 24px;
      background-color: #f9fafb;
      min-height: calc(100vh - 68px);
    }
  `]
})
export class AppComponent implements OnInit {
  isAuthenticated = false;
  username: string | null = null;

  constructor(private keycloakService: KeycloakService) {}

  async ngOnInit(): Promise<void> {
    this.isAuthenticated = await this.keycloakService.isLoggedIn();

    if (this.isAuthenticated) {
      try {
        const profile = await this.keycloakService.loadUserProfile();

        // Asignamos nombre completo si existe, si no username; si tampoco, null
        this.username = profile.firstName
          ? `${profile.firstName} ${profile.lastName ?? ''}`.trim()
          : (profile.username ?? null);
      } catch (err) {
        console.error('Error al cargar el perfil de Keycloak', err);
      }
    }
  }

  logout(): void {
    this.keycloakService.logout(window.location.origin);
  }
}
