## SecureSuite

SecureSuite es un proyecto personal de integración de Keycloak con una aplicación Angular y una API .NET. 
El proyecto está contenido completamente en Docker para facilitar su despliegue.


## Estructura del proyecto

SecureSuite/
├── my-angular-keycloak-app/ # Aplicación Angular
├── SecureApi/ # API .NET
├── docker-compose.yml # Orquestador de contenedores
└── screenshots/ # Capturas de pantalla (login, login en Keycloak y dashboard de inicio)


## Requisitos

- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Git](https://git-scm.com/)
- Navegador moderno (Chrome, Edge, Firefox, etc.)


## Montaje del proyecto

1. Clonar este repositorio:
git clone https://github.com/Kaesar88/SecureSuite.git
cd SecureSuite

2. Construir y levantar los contenedores:
docker-compose up --build

3. Acceder a la aplicación Angular:
URL: http://localhost:4200
Login con Keycloak (testuser : testuser-1234)

4. Acceder a la API (si es necesario):
URL: http://localhost:5001


## Capturas de pantalla

Login:
![Login](./screenshots/login.png)

Login en Keycloak:
![Pantalla de Login de Keycloak](./screenshots/login-keycloak.png)

Dashboard:
![Dashboard](./screenshots/dashboard.png)


## Notas
Todos los servicios se ejecutan en contenedores Docker, por lo que no se requiere instalación local de Node.js, Angular o .NET.

Puedes revisar y modificar el archivo docker-compose.yml para personalizar:
-Puertos
-Volúmenes
-Variables de entorno (por ejemplo, realm o credenciales de Keycloak)


## Autor
Kaesar88
