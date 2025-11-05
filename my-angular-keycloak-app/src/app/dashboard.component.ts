import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { KeycloakService } from 'keycloak-angular';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="dashboard-page">
      <aside class="dashboard-sidebar">
        <h2>Acciones</h2>
        <button (click)="loadAdminData()">Datos Admin</button>
        <button (click)="loadUserData()">Datos User</button>
        <button (click)="showForecasts()">Ver Pronóstico</button>
        <button (click)="showNews()">Noticias</button>
        
        <div *ngIf="rolesLoaded && roles.includes('admin')" class="admin-section">
          <button (click)="irAlPanelDeAdmin()">Panel de Administración</button>
        </div>
      </aside>

      <main class="dashboard-main">
        <h1>Panel de Control</h1>
        <p *ngIf="userName">Bienvenido, {{ userName }}</p>
        <p *ngIf="roles.length">Roles: {{ roles.join(', ') }}</p>

        <section *ngIf="showForecastSection && forecasts.length">
          <h3>Pronóstico del Clima</h3>
          <ul>
            <li *ngFor="let forecast of forecasts">
              {{ forecast.date | date:'medium' }} - {{ forecast.temperatureC }}°C - {{ forecast.summary }}
            </li>
          </ul>
        </section>

        <section *ngIf="showNewsSection">
          <h3>Noticias Recientes</h3>
          <ul>
            <li>📰 Actualización de seguridad disponible</li>
            <li>📰 Nuevo módulo de reportes añadido</li>
            <li>📰 Mantenimiento programado el próximo lunes</li>
          </ul>
        </section>
      </main>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@700&display=swap');

    .dashboard-page {
      display: flex;
      min-height: 100vh;
      font-family: 'Courier Prime', monospace;
      background-color: #f9fafb;
    }

    .dashboard-sidebar {
      width: 220px;
      background-color: #ffffff;
      border-right: 1px solid #d1d5db;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-shadow: 2px 0 6px rgba(0,0,0,0.05);
    }

    .dashboard-sidebar h2 {
      margin: 0 0 12px 0;
      font-size: 1.2rem;
      font-weight: 700;
      color: #111827;
    }

    .dashboard-sidebar button {
      background-color: #1e3a8a;
      color: #ffffff;
      font-weight: 700;
      border: none;
      border-radius: 8px;
      padding: 10px 14px;
      cursor: pointer;
      transition: background-color 0.3s, transform 0.2s;
    }

    .dashboard-sidebar button:hover {
      background-color: #3b82f6;
      transform: translateY(-1px);
    }

    .dashboard-sidebar button:active {
      transform: translateY(0);
    }

    .admin-section {
      margin-top: 20px;
      border-top: 1px solid #e5e7eb;
      padding-top: 20px;
    }

    .admin-section button {
      background-color: #dc2626;
      width: 100%;
    }

    .admin-section button:hover {
      background-color: #b91c1c;

    .dashboard-main {
      flex: 1;
      padding: 24px;
    }

    .dashboard-main h1 {
      font-size: 1.8rem;
      font-weight: 700;
      margin-bottom: 12px;
      color: #111827;
    }

    .dashboard-main p {
      font-size: 1rem;
      font-weight: 700;
      margin: 0 0 12px 0;
      color: #4b5563;
    }

    ul {
      list-style: none;
      padding: 0;
    }

    li {
      margin-bottom: 6px;
    }

    section h3 {
      font-weight: 700;
      margin-bottom: 8px;
      color: #111827;
    }

    @media (max-width: 768px) {
      .dashboard-page {
        flex-direction: column;
      }
      .dashboard-sidebar {
        width: 100%;
        flex-direction: row;
        overflow-x: auto;
      }
      .dashboard-sidebar button {
        flex: 1 0 auto;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  userName: string | null = null;
  roles: string[] = [];
  rolesLoaded = false;
  forecasts: any[] = [];
  showForecastSection = false;
  showNewsSection = false;

  constructor(private http: HttpClient, private keycloakService: KeycloakService) {}

  async ngOnInit(): Promise<void> {
    await this.loadRoles(); 
    this.loadForecasts();
  }

  async loadRoles(): Promise<void> {
    const isLoggedIn = await this.keycloakService.isLoggedIn();
    if (isLoggedIn) {
      const tokenParsed = this.keycloakService.getKeycloakInstance().tokenParsed;
      if (tokenParsed && tokenParsed['realm_access']?.['roles']) {
        this.roles = tokenParsed['realm_access']['roles'];
      }
    }
    this.rolesLoaded = true;
  }

  loadForecasts(): void {
    this.http.get<any[]>('http://localhost:5001/api/weatherforecast')
      .subscribe(data => this.forecasts = data);
  }

  loadAdminData(): void {
    if (this.roles.includes('admin')) {
      this.http.get<any>('http://localhost:5001/api/weatherforecast/admin')
        .subscribe(data => console.log(data));
    } else {
      alert('No tienes permisos de Admin');
    }
  }

  loadUserData(): void {
    if (this.roles.includes('user') || this.roles.includes('admin')) {
      this.http.get<any>('http://localhost:5001/api/weatherforecast/user')
        .subscribe(data => console.log(data));
    } else {
      alert('No tienes permisos de User');
    }
  }

  showForecasts(): void {
    this.showForecastSection = !this.showForecastSection;
    this.showNewsSection = false;
  }

  showNews(): void {
    this.showNewsSection = !this.showNewsSection;
    this.showForecastSection = false;
  }

  irAlPanelDeAdmin(): void {
    console.log("Navegando al Panel de Administración...");
    alert("¡Bienvenido al Panel de Administración! (Esta es una demostración)");
  }
}