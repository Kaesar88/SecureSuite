# ---------- Etapa 1: Compilar Angular ----------
FROM node:22.12.0 AS build

WORKDIR /app

# Copiar package.json e instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar el resto del código y compilar en modo producción
COPY . .
RUN npm run build -- --configuration production

# ---------- Etapa 2: Servir con Nginx ----------
FROM nginx:latest

# Copiar los archivos compilados desde la etapa anterior
COPY --from=build /app/dist/my-angular-keycloak-app/browser /usr/share/nginx/html

# Exponer el puerto
EXPOSE 80

# Reemplaza la configuración por defecto con una más adecuada
COPY nginx.conf /etc/nginx/conf.d/default.conf
