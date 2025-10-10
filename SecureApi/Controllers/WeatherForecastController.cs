using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;

namespace SecureApi.Controllers;

[ApiController]
[Route("api/[controller]")] // Define la base de la ruta como /api/weatherforecast
public class WeatherForecastController : ControllerBase
{
    private static readonly string[] Summaries = new[]
    {
        "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
    };

    [HttpGet]
    [Authorize]
    public IActionResult Get()
    {
        var userName = User.Identity?.Name;
        var userRoles = User.Claims
            .Where(c => c.Type == "roles")
            .Select(c => c.Value)
            .ToList();
        
        var forecast = Enumerable.Range(1, 5).Select(index => new
        {
            Date = DateTime.Now.AddDays(index),
            TemperatureC = Random.Shared.Next(-20, 55),
            Summary = Summaries[Random.Shared.Next(Summaries.Length)],
            CurrentUser = userName,
            UserRoles = userRoles
        })
        .ToArray();

        return Ok(forecast);
    }

    [HttpGet("public")]
    [AllowAnonymous]
    public IActionResult GetPublicData()
    {
        return Ok("This is public data - no authentication required");
    }

    [HttpGet("admin")]
    [Authorize(Roles = "Admin")]
    public IActionResult GetAdminData()
    {
        return Ok(new { 
            Message = "This is admin-only data!",
            User = User.Identity?.Name,
            Roles = User.Claims.Where(c => c.Type == "roles").Select(c => c.Value)
        });
    }

    [HttpGet("user")]
    [Authorize(Roles = "User,Admin")]
    public IActionResult GetUserData()
    {
        return Ok(new { 
            Message = "This is user data!",
            User = User.Identity?.Name
        });
    }
}