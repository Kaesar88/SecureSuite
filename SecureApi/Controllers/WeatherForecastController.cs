using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;
using System.Reflection.Metadata;
using System.Security.Claims;

namespace SecureApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WeatherForecastController : ControllerBase
{
    private static readonly string[] Summaries = new[]
    {
        "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
    };

    [HttpGet("userdetails  ")]
    [Authorize]
    public IActionResult GetUserDetails()
    {
        var userName = User.FindFirst("preferred_username")?.Value;
        var email = User.FindFirst("email")?.Value;
        var userRoles = User.FindAll("roles").Select(c => c.Value).ToList();
            
        return Ok(new
        {
            UserName = userName,
            Email = email,
            Roles = userRoles
        });
    }

    [HttpGet]
    [Authorize]
    public IActionResult Get()
    {
        var userName = User.FindFirst("preferred_username")?.Value;
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