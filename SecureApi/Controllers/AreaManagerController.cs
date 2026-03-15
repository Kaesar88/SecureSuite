using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Concurrent;
using System.Security.Claims;
using System.Text.Json;

namespace SecureApi.Controllers;

// ── Modelos ───────────────────────────────────────────────────────────────────

public class UserProfile
{
    public string Username { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public List<string> Roles { get; set; } = new();
    public DateTime? LastLogin { get; set; }
    public int AuthFailures { get; set; }
    public bool IsActive { get; set; } = true;
    public List<string> Alerts { get; set; } = new();
}

// ── Controlador ───────────────────────────────────────────────────────────────

[ApiController]
[Route("api/[controller]")]
public class AreaManagerController : ControllerBase
{
    private static readonly string LdapServiceUrl =
        Environment.GetEnvironmentVariable("LDAP_SERVICE_URL") ?? "http://ldap-service:5050";
    private static readonly string LdapServiceApiKey =
        Environment.GetEnvironmentVariable("LDAP_SERVICE_API_KEY") ?? "internal-secret-key";
    private static readonly HttpClient _ldapClient = new HttpClient();

    private async Task<List<UserProfile>> GetUsersFromLdap()
    {
        try
        {
            _ldapClient.DefaultRequestHeaders.Remove("X-API-Key");
            _ldapClient.DefaultRequestHeaders.Add("X-API-Key", LdapServiceApiKey);
            var response = await _ldapClient.GetAsync($"{LdapServiceUrl}/users");
            if (!response.IsSuccessStatusCode)
                return new List<UserProfile>();

            var json = await response.Content.ReadAsStringAsync();
            var ldapUsers = JsonDocument.Parse(json).RootElement;

            return ldapUsers.EnumerateArray().Select(u => {
                var uid  = u.GetProperty("username").GetString() ?? "";
                var dept = u.GetProperty("department").GetString() ?? "";

                // Asignar roles según departamento y si es jefe de área
                var roles = new List<string>();
                if (dept == "direccion")
                {
                    roles.Add("role_admin");
                    roles.Add("role_manager");
                }
                else
                {
                    roles.Add("role_employee");
                }

                // Es jefe de área si está en el mapeo
                if (AreaManagers.TryGetValue(dept, out var manager) && manager == uid)
                    roles.Add($"role_manager_{dept}");

                return new UserProfile
                {
                    Username   = uid,
                    FullName   = u.GetProperty("fullName").GetString() ?? "",
                    Email      = u.GetProperty("email").GetString() ?? "",
                    Department = dept,
                    IsActive   = true,
                    Roles      = roles,
                    LastLogin  = null,
                    AuthFailures = 0
                };
            }).ToList();
        }
        catch
        {
            return new List<UserProfile>();
        }
    }

    // ── Departamentos válidos ─────────────────────────────────────────────────
    private static readonly string[] ValidDepartments = 
        { "ventas", "tecnologia", "recursos", "finanzas", "direccion" };

    // ── Jefes de área por departamento ────────────────────────────────────────
    private static readonly Dictionary<string, string> AreaManagers = new()
    {
        ["ventas"]     = "marta.jimenez",
        ["tecnologia"] = "fernando.perez",
        ["recursos"]   = "laura.rodriguez",
        ["finanzas"]   = "david.alvarez",
        ["direccion"]  = "miguel.torres"
    };

    // ── Helper: obtener roles y departamento del token ────────────────────────
    // El departamento se extrae del rol granular (role_manager_ventas -> ventas)
    // En lugar de leer el claim "department", que podría ser manipulado
    private (List<string> roles, string department, string username) GetTokenInfo()
    {
        var realmAccess = User.Claims.FirstOrDefault(c => c.Type == "realm_access")?.Value;
        var roles = new List<string>();
        if (realmAccess != null)
        {
            try
            {
                roles = JsonDocument.Parse(realmAccess)
                    .RootElement.GetProperty("roles")
                    .EnumerateArray()
                    .Select(r => r.GetString() ?? "")
                    .Where(r => r != "")
                    .ToList();
            }
            catch { }
        }

        // Extraer departamento desde el rol granular: role_manager_ventas -> ventas
        var department = roles
            .Where(r => r.StartsWith("role_manager_"))
            .Select(r => r.Replace("role_manager_", ""))
            .FirstOrDefault(d => ValidDepartments.Contains(d)) ?? "";

        var username = User.FindFirst("preferred_username")?.Value ?? "";

        return (roles, department, username);
    }

    // ── Helper: ¿tiene rol de manager de área? ────────────────────────────────
    private static bool IsAreaManager(List<string> roles) =>
        roles.Any(r => r.StartsWith("role_manager_") && 
                       ValidDepartments.Any(d => r == $"role_manager_{d}"));

    private static List<string> GetAlerts(UserProfile u)
    {
        // Los datos de actividad se simularán cuando se integre con Keycloak real
        return new List<string>();
    }

    // ── GET /api/areamanager/my-department — Dashboard del jefe de área ───────
    [HttpGet("my-department")]
    [Authorize]
    public async Task<IActionResult> GetMyDepartment()
    {
        var (roles, department, username) = GetTokenInfo();

        if (!IsAreaManager(roles) && !roles.Contains("role_admin"))
            return Forbid();

        if (string.IsNullOrEmpty(department) && !roles.Contains("role_admin"))
            return BadRequest(new { message = "No se pudo determinar tu departamento. Verifica que tienes un rol role_manager_[departamento] asignado." });

        var allUsers = await GetUsersFromLdap();
        // Admin ve todos, area_manager ve solo su departamento
        var users = roles.Contains("role_admin") && string.IsNullOrEmpty(department)
            ? allUsers
            : allUsers.Where(u => u.Department == department).ToList();

        var result = users.Select(u => new
        {
            u.Username,
            u.FullName,
            u.Email,
            u.Department,
            u.Roles,
            u.LastLogin,
            u.AuthFailures,
            u.IsActive,
            Alerts      = GetAlerts(u),
            DaysSinceLogin = u.LastLogin.HasValue
                ? (int)(DateTime.Now - u.LastLogin.Value).TotalDays
                : -1
        }).OrderBy(u => u.FullName).ToList();

        return Ok(new
        {
            department = string.IsNullOrEmpty(department) ? "todos" : department,
            totalUsers = result.Count,
            activeUsers = result.Count(u => u.IsActive),
            usersWithAlerts = result.Count(u => u.Alerts.Any()),
            inactiveUsers = result.Count(u => u.DaysSinceLogin > 15),
            users = result
        });
    }

    // ── GET /api/areamanager/roles-overview — Vista global de roles ───────────
    [HttpGet("roles-overview")]
    [Authorize]
    public async Task<IActionResult> GetRolesOverview()
    {
        var (roles, _, _) = GetTokenInfo();

        if (!IsAreaManager(roles) && !roles.Contains("role_admin") && !roles.Contains("role_manager"))
            return Forbid();

        var allUsers = await GetUsersFromLdap();
        var departments = new[] { "ventas", "tecnologia", "recursos", "finanzas", "direccion" };

        var overview = departments.Select(dept => new
        {
            department = dept,
            users = allUsers
                .Where(u => u.Department == dept)
                .Select(u => new
                {
                    u.Username,
                    u.FullName,
                    u.Roles,
                    u.IsActive,
                    DaysSinceLogin = u.LastLogin.HasValue
                        ? (int)(DateTime.Now - u.LastLogin.Value).TotalDays
                        : -1
                })
                .OrderBy(u => u.FullName)
                .ToList()
        }).ToList();

        return Ok(overview);
    }

    // ── GET /api/areamanager/access-requests — Solicitudes del departamento ───
    [HttpGet("access-requests/{department}")]
    [Authorize]
    public async Task<IActionResult> GetDepartmentRequests(string department)
    {
        var (roles, userDept, _) = GetTokenInfo();

        if (!IsAreaManager(roles) && !roles.Contains("role_admin"))
            return Forbid();

        // Area manager solo puede ver su propio departamento
        if (IsAreaManager(roles) && !roles.Contains("role_admin") && userDept != department)
            return Forbid();

        // Filtramos las solicitudes del AccessRequestController por departamento
        var allUsers = await GetUsersFromLdap();
        var deptUsers = allUsers
            .Where(u => u.Department == department)
            .Select(u => u.Username)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        // Accedemos al diccionario estático del AccessRequestController
        var requests = AccessRequestController.GetRequests().Values
            .Where(r => deptUsers.Contains(r.RequestedBy))
            .OrderByDescending(r => r.CreatedAt)
            .ToList();

        return Ok(requests);
    }

    // ── PUT /api/areamanager/access-requests/{id}/approve ────────────────────
    [HttpPut("access-requests/{id}/approve")]
    [Authorize]
    public async Task<IActionResult> ApproveRequest(string id, [FromBody] ReviewRequestDto dto)
    {
        var (roles, userDept, adminUsername) = GetTokenInfo();

        if (!IsAreaManager(roles) && !roles.Contains("role_admin"))
            return Forbid();

        var requests = AccessRequestController.GetRequests();
        if (!requests.TryGetValue(id, out var request))
            return NotFound(new { message = "Solicitud no encontrada." });

        if (request.Status != "pending")
            return BadRequest(new { message = "Esta solicitud ya fue procesada." });

        // Verificar que el usuario pertenece al departamento del manager
        if (IsAreaManager(roles) && !roles.Contains("role_admin"))
        {
            var approveUsers = await GetUsersFromLdap();
            var requesterDept = approveUsers
                .FirstOrDefault(u => u.Username == request.RequestedBy)?.Department;
            if (requesterDept != userDept)
                return Forbid();
        }

        // Llamar al ldap-service
        var ldapServiceUrl = Environment.GetEnvironmentVariable("LDAP_SERVICE_URL") ?? "http://ldap-service:5050";
        var ldapApiKey     = Environment.GetEnvironmentVariable("LDAP_SERVICE_API_KEY") ?? "internal-secret-key";

        var httpClient = new System.Net.Http.HttpClient();
        httpClient.DefaultRequestHeaders.Add("X-API-Key", ldapApiKey);
        var payload = System.Text.Json.JsonSerializer.Serialize(new { username = request.RequestedBy, role = request.RequestedRole });
        var content = new System.Net.Http.StringContent(payload, System.Text.Encoding.UTF8, "application/json");
        var ldapSuccess = false;

        try
        {
            var response = await httpClient.PostAsync($"{ldapServiceUrl}/assign-role", content);
            ldapSuccess = response.IsSuccessStatusCode;
        }
        catch { }

        request.Status        = "approved";
        request.ReviewedBy    = adminUsername;
        request.ReviewComment = dto.Comment;
        request.ReviewedAt    = DateTime.UtcNow;

        var ldapMsg = ldapSuccess
            ? "Rol aplicado en LDAP. MidPoint lo sincronizará en el próximo Reconcile."
            : "ADVERTENCIA: No se pudo contactar con el servicio LDAP.";

        return Ok(new { message = $"Solicitud aprobada. {ldapMsg}", ldapUpdated = ldapSuccess, request });
    }

    // ── PUT /api/areamanager/access-requests/{id}/reject ─────────────────────
    [HttpPut("access-requests/{id}/reject")]
    [Authorize]
    public IActionResult RejectRequest(string id, [FromBody] ReviewRequestDto dto)
    {
        var (roles, userDept, adminUsername) = GetTokenInfo();

        if (!IsAreaManager(roles) && !roles.Contains("role_admin"))
            return Forbid();

        var requests = AccessRequestController.GetRequests();
        if (!requests.TryGetValue(id, out var request))
            return NotFound(new { message = "Solicitud no encontrada." });

        if (request.Status != "pending")
            return BadRequest(new { message = "Esta solicitud ya fue procesada." });

        request.Status        = "rejected";
        request.ReviewedBy    = adminUsername;
        request.ReviewComment = dto.Comment;
        request.ReviewedAt    = DateTime.UtcNow;

        return Ok(new { message = $"Solicitud de '{request.RequestedBy}' rechazada.", request });
    }
}
