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
        <div class="user-info">
          <span class="username">Bienvenido/a, {{ username }}</span>
          <span class="user-email" *ngIf="email">{{ email }}</span>
        </div>
        <button (click)="logout()">Cerrar sesión</button>
      </div>
    </header>

    <main>
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
  
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 32px;
      background-color: #fff;
      border-bottom: 1px solid #d1d5db;
      font-family: 'Courier Prime', monospace;
    }

  
    .title h1 {
      font-size: 1.3rem;
      font-weight: 700;
      margin: 0;
      color: #111827;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      text-align: right;
      font-family: 'Courier Prime', monospace;
    }

    .user-email {
      font-size: 0.85rem;
      color: #6b7280;
    }

    .title h2 {
      font-size: 0.95rem;
      font-weight: 500;
      color: #4b5563;
      margin: 2px 0 0 0;
    }

  
    .header-right {
      display: flex;
      align-items: center;
      gap: 14px;
      font-family: 'Courier Prime', monospace;
    }

    .username {
      font-weight: 600;
      color: #374151;
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
      font-family: 'Courier Prime', monospace;
    }

    button:hover {
      background-color: #e5e7eb;
    }

    button:active {
      transform: scale(0.98);
    }


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
  email: string | null = null;

  constructor(private keycloakService: KeycloakService) {}

  async ngOnInit(): Promise<void> {
    this.isAuthenticated = await this.keycloakService.isLoggedIn();

    if (this.isAuthenticated) {
      try {

        const tokenParsed = this.keycloakService.getKeycloakInstance().tokenParsed;
        
        if (tokenParsed) {

          if (tokenParsed['given_name'] || tokenParsed['preferred_username']) {
            const firstName = tokenParsed['given_name'] || '';
            const lastName = tokenParsed['family_name'] || '';
            this.username = `${firstName} ${lastName}`.trim() || tokenParsed['preferred_username'];
          } else {
            this.username = tokenParsed['preferred_username'] || 'Usuario';
          }
          

          this.email = tokenParsed['email'] || null;
        }


        if (!this.username) {
          const profile = await this.keycloakService.loadUserProfile();
          this.username = profile.firstName 
            ? `${profile.firstName} ${profile.lastName ?? ''}`.trim()
            : (profile.username ?? 'Usuario');
        }

      } catch (err) {
        console.error('Error al cargar el perfil de Keycloak', err);
        const tokenParsed = this.keycloakService.getKeycloakInstance().tokenParsed;
        if (tokenParsed) {
          this.username = tokenParsed['preferred_username'] || 'Usuario';
          this.email = tokenParsed['email'] || null;
        }
      }
    }
  }

  logout(): void {
    this.keycloakService.logout(window.location.origin);
  }
}