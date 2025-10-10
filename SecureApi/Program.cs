using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Configurar autenticación JWT con Keycloak
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = "http://localhost:8080/realms/2cl-realm";
        options.Audience = "dotnet-api";
        options.RequireHttpsMetadata = false;
        
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = "http://localhost:8080/realms/2cl-realm/",
            ValidateAudience = true,
            ValidAudiences = new[] { "dotnet-api", "account" },
            ValidateLifetime = true,
            RoleClaimType = "roles"
        };
    });

builder.Services.AddAuthorization();

// Configurar CORS para Angular
builder.Services.AddCors(options =>
{
    options.AddPolicy("angular-app", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.

// IMPORTANTE: Completamente eliminar HTTPS redirection
// NO usar app.UseHttpsRedirection();

// Orden correcto
app.UseCors("angular-app");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();