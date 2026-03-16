using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Concurrent;
using System.Security.Claims;
using System.Net.Http;
using System.Text;
using System.Text.Json;

namespace SecureApi.Controllers;

public class AccessRequest
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string RequestedBy { get; set; } = string.Empty;
    public string RequestedByEmail { get; set; } = string.Empty;
    public string RequestedRole { get; set; } = "role_manager";
    public string Justification { get; set; } = string.Empty;
    public string Status { get; set; } = "pending";
    public string? ReviewedBy { get; set; }
    public string? ReviewComment { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReviewedAt { get; set; }
}

public class CreateRequestDto
{
    public string Justification { get; set; } = string.Empty;
}

public class ReviewRequestDto
{
    public string Comment { get; set; } = string.Empty;
}

[ApiController]
[Route("api/[controller]")]
public class AccessRequestController : ControllerBase
{
    private static readonly ConcurrentDictionary<string, AccessRequest> _requests = new();


    public static ConcurrentDictionary<string, AccessRequest> GetRequests() => _requests;
    private static readonly HttpClient _httpClient = new HttpClient();

    private static readonly string LdapServiceUrl = 
        Environment.GetEnvironmentVariable("LDAP_SERVICE_URL") ?? "http://ldap-service:5050";
    private static readonly string LdapServiceApiKey = 
        Environment.GetEnvironmentVariable("LDAP_SERVICE_API_KEY") ?? "internal-secret-key";

    private List<string> GetRolesFromToken()
    {
        var realmAccess = User.Claims
            .FirstOrDefault(c => c.Type == "realm_access")?.Value;

        if (realmAccess == null)
            return new List<string>();

        try
        {
            return JsonDocument.Parse(realmAccess)
                .RootElement.GetProperty("roles")
                .EnumerateArray()
                .Select(r => r.GetString() ?? "")
                .Where(r => r != "")
                .ToList();
        }
        catch
        {
            return new List<string>();
        }
    }

    private async Task<bool> AssignRoleInLdap(string username, string role)
    {
        try
        {
            var payload = JsonSerializer.Serialize(new { username, role });
            var content = new StringContent(payload, Encoding.UTF8, "application/json");
            _httpClient.DefaultRequestHeaders.Remove("X-API-Key");
            _httpClient.DefaultRequestHeaders.Add("X-API-Key", LdapServiceApiKey);

            var response = await _httpClient.PostAsync(
                $"{LdapServiceUrl}/assign-role", content);

            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    [HttpPost]
    [Authorize]
    public IActionResult CreateRequest([FromBody] CreateRequestDto dto)
    {
        var username = User.FindFirst("preferred_username")?.Value;
        var email    = User.FindFirst("email")?.Value ?? "";
        var roles    = GetRolesFromToken();

        if (string.IsNullOrWhiteSpace(username))
            return Unauthorized("No se pudo identificar al usuario.");

        if (!roles.Contains("role_employee"))
            return BadRequest(new { message = "Solo los empleados pueden solicitar el rol de Manager." });

        if (roles.Contains("role_manager"))
            return BadRequest(new { message = "Ya tienes el rol de Manager." });

        var pending = _requests.Values
            .FirstOrDefault(r => r.RequestedBy == username && r.Status == "pending");
        if (pending != null)
            return BadRequest(new { message = "Ya tienes una solicitud pendiente. Espera a que sea revisada." });

        if (string.IsNullOrWhiteSpace(dto.Justification))
            return BadRequest(new { message = "La justificacion es obligatoria." });

        var request = new AccessRequest
        {
            RequestedBy      = username,
            RequestedByEmail = email,
            Justification    = dto.Justification
        };

        _requests[request.Id] = request;

        return Ok(new
        {
            message   = "Solicitud enviada correctamente. El administrador la revisara en breve.",
            requestId = request.Id
        });
    }

    [HttpGet("mine")]
    [Authorize]
    public IActionResult GetMyRequests()
    {
        var username = User.FindFirst("preferred_username")?.Value;
        if (string.IsNullOrWhiteSpace(username))
            return Unauthorized();

        var mine = _requests.Values
            .Where(r => r.RequestedBy == username)
            .OrderByDescending(r => r.CreatedAt)
            .ToList();

        return Ok(mine);
    }

    [HttpGet]
    [Authorize]
    public IActionResult GetAllRequests()
    {
        var roles = GetRolesFromToken();
        if (!roles.Contains("role_admin"))
            return Forbid();

        var all = _requests.Values
            .OrderByDescending(r => r.CreatedAt)
            .ToList();

        return Ok(all);
    }

    [HttpPut("{id}/approve")]
    [Authorize]
    public async Task<IActionResult> Approve(string id, [FromBody] ReviewRequestDto dto)
    {
        var roles = GetRolesFromToken();
        if (!roles.Contains("role_admin"))
            return Forbid();

        if (!_requests.TryGetValue(id, out var request))
            return NotFound(new { message = "Solicitud no encontrada." });

        if (request.Status != "pending")
            return BadRequest(new { message = "Esta solicitud ya fue procesada." });

        var adminUsername = User.FindFirst("preferred_username")?.Value;


        var ldapSuccess = await AssignRoleInLdap(request.RequestedBy, request.RequestedRole);

        request.Status        = "approved";
        request.ReviewedBy    = adminUsername;
        request.ReviewComment = dto.Comment;
        request.ReviewedAt    = DateTime.UtcNow;

        var ldapMessage = ldapSuccess
            ? "El rol ha sido aplicado en el LDAP. MidPoint lo sincronizara en el proximo Reconcile."
            : "ADVERTENCIA: No se pudo contactar con el servicio LDAP. Aplica el cambio manualmente.";

        return Ok(new
        {
            message = $"Solicitud de '{request.RequestedBy}' aprobada. {ldapMessage}",
            ldapUpdated = ldapSuccess,
            request
        });
    }

    [HttpPut("{id}/reject")]
    [Authorize]
    public IActionResult Reject(string id, [FromBody] ReviewRequestDto dto)
    {
        var roles = GetRolesFromToken();
        if (!roles.Contains("role_admin"))
            return Forbid();

        if (!_requests.TryGetValue(id, out var request))
            return NotFound(new { message = "Solicitud no encontrada." });

        if (request.Status != "pending")
            return BadRequest(new { message = "Esta solicitud ya fue procesada." });

        var adminUsername = User.FindFirst("preferred_username")?.Value;

        request.Status        = "rejected";
        request.ReviewedBy    = adminUsername;
        request.ReviewComment = dto.Comment;
        request.ReviewedAt    = DateTime.UtcNow;

        return Ok(new
        {
            message = $"Solicitud de '{request.RequestedBy}' rechazada.",
            request
        });
    }
}
