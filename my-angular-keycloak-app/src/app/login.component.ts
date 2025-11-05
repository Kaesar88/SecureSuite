import { Component } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <h1>Iniciar sesión</h1>
        <p>Serás redirigido a Keycloak para autenticarte de forma segura.</p>
        <button (click)="login()">Iniciar sesión</button>
      </div>

      <footer>
        © 2025 Ciberseguridad IAM - 2CL
      </footer>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@700&display=swap');

    .login-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #f9fafb;
      font-family: 'Courier Prime', monospace;
    }


    .login-card {
      background-color: #ffffff;
      border: 1px solid #d1d5db; 
      border-radius: 12px;
      padding: 40px 32px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      max-width: 400px;
      width: 100%;
    }

    .login-card h1 {
      font-weight: 700;
      font-size: 1.8rem;
      margin: 0 0 12px 0;
      color: #111827;
    }

    .login-card p {
      font-weight: 700;
      font-size: 1rem;
      margin: 0 0 24px 0;
      color: #4b5563;
    }

    .login-card button {
      background-color: #1e3a8a; 
      color: #ffffff;
      font-weight: 700;
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-family: 'Courier Prime', monospace;
      font-size: 1rem;
      transition: background-color 0.3s, transform 0.2s;
    }

    .login-card button:hover {
      background-color: #3b82f6;
      transform: translateY(-2px);
    }

    .login-card button:active {
      transform: translateY(0);
    }


    footer {
      margin-top: 40px;
      font-size: 0.9rem;
      color: #9ca3af; 
    }


    @media (max-width: 480px) {
      .login-card {
        padding: 32px 20px;
      }
    }
  `]
})
export class LoginComponent {
  constructor(private keycloakService: KeycloakService, private router: Router) {}

  async login(): Promise<void> {
    try {
      await this.keycloakService.login({
        redirectUri: window.location.origin + '/dashboard'
      });
    } catch (error) {
      console.error('Login failed', error);
    }
  }
}
