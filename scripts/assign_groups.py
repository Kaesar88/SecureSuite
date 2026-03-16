"""
assign_groups.py
Asigna usuarios de Keycloak a sus grupos según el atributo 'ou' del LDAP.

Mapeo:
  ou=ventas      -> grp_ventas
  ou=tecnologia  -> grp_tecnologia
  ou=recursos    -> grp_recursos
  ou=finanzas    -> grp_finanzas
  ou=direccion   -> grp_direccion

Uso:
  pip install requests
  python assign_groups.py
"""

import requests

# ── Configuración ──────────────────────────────────────────────────────────────
KEYCLOAK_URL = "http://localhost:8080"
REALM        = "2cl-realm"
ADMIN_USER   = "admin"
ADMIN_PASS   = "changeme"

OU_TO_GROUP = {
    "ventas":     "grp_ventas",
    "tecnologia": "grp_tecnologia",
    "recursos":   "grp_recursos",
    "finanzas":   "grp_finanzas",
    "direccion":  "grp_direccion",
}
# ──────────────────────────────────────────────────────────────────────────────


def get_token():
    r = requests.post(
        f"{KEYCLOAK_URL}/realms/master/protocol/openid-connect/token",
        data={
            "client_id": "admin-cli",
            "username":  ADMIN_USER,
            "password":  ADMIN_PASS,
            "grant_type": "password",
        }
    )
    r.raise_for_status()
    return r.json()["access_token"]


def get_groups(token):
    r = requests.get(
        f"{KEYCLOAK_URL}/admin/realms/{REALM}/groups",
        headers={"Authorization": f"Bearer {token}"}
    )
    r.raise_for_status()
    return {g["name"]: g["id"] for g in r.json()}


def get_users(token):
    users = []
    first = 0
    while True:
        r = requests.get(
            f"{KEYCLOAK_URL}/admin/realms/{REALM}/users",
            headers={"Authorization": f"Bearer {token}"},
            params={"first": first, "max": 50}
        )
        r.raise_for_status()
        batch = r.json()
        if not batch:
            break
        users.extend(batch)
        first += 50
    return users


def get_user_groups(token, user_id):
    r = requests.get(
        f"{KEYCLOAK_URL}/admin/realms/{REALM}/users/{user_id}/groups",
        headers={"Authorization": f"Bearer {token}"}
    )
    r.raise_for_status()
    return [g["name"] for g in r.json()]


def assign_group(token, user_id, group_id):
    r = requests.put(
        f"{KEYCLOAK_URL}/admin/realms/{REALM}/users/{user_id}/groups/{group_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    r.raise_for_status()


def main():
    print("Obteniendo token de acceso...")
    token = get_token()

    print("Cargando grupos...")
    groups = get_groups(token)
    print(f"  Grupos encontrados: {list(groups.keys())}")

    print("Cargando usuarios...")
    users = get_users(token)
    print(f"  Total usuarios: {len(users)}")

    ok = 0
    skip = 0
    errors = 0

    for user in users:
        username = user.get("username", "?")
        attrs    = user.get("attributes", {})
        ou_list  = attrs.get("ou", [])

        if not ou_list:
            print(f"  [SKIP] {username} — sin atributo 'ou'")
            skip += 1
            continue

        ou         = ou_list[0]
        group_name = OU_TO_GROUP.get(ou)

        if not group_name:
            print(f"  [SKIP] {username} — ou '{ou}' sin mapeo definido")
            skip += 1
            continue

        group_id = groups.get(group_name)
        if not group_id:
            print(f"  [ERROR] {username} — grupo '{group_name}' no existe en Keycloak")
            errors += 1
            continue

        # Comprueba si ya está en el grupo
        current_groups = get_user_groups(token, user["id"])
        if group_name in current_groups:
            print(f"  [OK] {username} ya estaba en {group_name}")
            skip += 1
            continue

        assign_group(token, user["id"], group_id)
        print(f"  [ASIGNADO] {username} -> {group_name}")
        ok += 1

    print()
    print(f"Resultado: {ok} asignados, {skip} omitidos, {errors} errores")


if __name__ == "__main__":
    main()
