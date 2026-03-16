"""
ldap-service.py
Microservicio REST para operaciones LDAP.
Llamado por el backend .NET cuando el admin aprueba una solicitud de acceso.

Endpoints:
  POST /assign-role   — Añade employeeType al usuario en LDAP
  POST /revoke-role   — Elimina employeeType del usuario en LDAP
  GET  /health        — Health check
"""

from flask import Flask, request, jsonify
from ldap3 import Server, Connection, ALL, MODIFY_REPLACE, MODIFY_DELETE, MODIFY_ADD
import os
import logging

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

# ── Configuración ──────────────────────────────────────────────────────────────
LDAP_HOST  = os.getenv("LDAP_HOST", "openldap")
LDAP_PORT  = int(os.getenv("LDAP_PORT", "389"))
LDAP_ADMIN = os.getenv("LDAP_ADMIN", "cn=admin,dc=miempresa,dc=local")
LDAP_PASS  = os.getenv("LDAP_PASS", "changeme")
BASE_DN    = os.getenv("LDAP_BASE_DN", "dc=miempresa,dc=local")
API_KEY    = os.getenv("API_KEY", "internal-secret-key")
# ──────────────────────────────────────────────────────────────────────────────


def get_connection():
    server = Server(LDAP_HOST, port=LDAP_PORT, get_info=ALL)
    conn = Connection(server, LDAP_ADMIN, LDAP_PASS, auto_bind=True)
    return conn


def find_user_dn(conn, username):
    conn.search(BASE_DN, f"(uid={username})", attributes=["uid"])
    if conn.entries:
        return str(conn.entries[0].entry_dn)
    return None


def check_api_key():
    key = request.headers.get("X-API-Key")
    return key == API_KEY


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "ldap-service"}), 200


@app.route("/assign-role", methods=["POST"])
def assign_role():
    if not check_api_key():
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    username = data.get("username")
    role     = data.get("role")

    if not username or not role:
        return jsonify({"error": "username and role are required"}), 400

    try:
        conn = get_connection()
        user_dn = find_user_dn(conn, username)

        if not user_dn:
            return jsonify({"error": f"User '{username}' not found in LDAP"}), 404

        # Añadir employeeType con el rol aprobado
        conn.modify(user_dn, {
            "description": [(MODIFY_REPLACE, [role])]
        })

        if conn.result["result"] == 0:
            app.logger.info(f"Role '{role}' assigned to '{username}' (DN: {user_dn})")
            return jsonify({
                "success": True,
                "message": f"Role '{role}' assigned to '{username}'",
                "dn": user_dn
            }), 200
        else:
            app.logger.error(f"LDAP error: {conn.result}")
            return jsonify({"error": conn.result["description"]}), 500

    except Exception as e:
        app.logger.error(f"Exception: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/revoke-role", methods=["POST"])
def revoke_role():
    if not check_api_key():
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    username = data.get("username")

    if not username:
        return jsonify({"error": "username is required"}), 400

    try:
        conn = get_connection()
        user_dn = find_user_dn(conn, username)

        if not user_dn:
            return jsonify({"error": f"User '{username}' not found in LDAP"}), 404

        conn.modify(user_dn, {
            "description": [(MODIFY_REPLACE, [""])]
        })

        if conn.result["result"] == 0:
            app.logger.info(f"Role revoked from '{username}'")
            return jsonify({
                "success": True,
                "message": f"Role revoked from '{username}'"
            }), 200
        else:
            return jsonify({"error": conn.result["description"]}), 500

    except Exception as e:
        app.logger.error(f"Exception: {e}")
        return jsonify({"error": str(e)}), 500



@app.route("/users", methods=["GET"])
def get_users():
    if not check_api_key():
        return jsonify({"error": "Unauthorized"}), 401

    try:
        conn = get_connection()
        conn.search(
            BASE_DN,
            "(objectClass=inetOrgPerson)",
            attributes=["uid", "cn", "sn", "givenName", "mail", "ou", "title", "description"]
        )

        users = []
        for entry in conn.entries:
            uid  = str(entry.uid) if entry.uid else ""
            cn   = str(entry.cn) if entry.cn else ""
            mail = str(entry.mail) if entry.mail else ""
            ou   = str(entry.ou) if entry.ou else ""

            # Extraer departamento del DN si ou no está disponible
            import re
            if not ou:
                m = re.search(r"ou=(\w+),dc=", str(entry.entry_dn))
                ou = m.group(1) if m else ""

            users.append({
                "username":   uid,
                "fullName":   cn,
                "email":      mail,
                "department": ou,
                "isActive":   True
            })

        return jsonify(users), 200

    except Exception as e:
        app.logger.error(f"Exception in get_users: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050, debug=False)
