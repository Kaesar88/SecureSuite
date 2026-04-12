"""
jml.py — Joiner / Mover / Leaver
Secure-CCL IAM/IGA Lab

Simula el ciclo de vida de identidades sobre OpenLDAP.
MidPoint detecta los cambios automáticamente en el siguiente Reconcile.

Uso:
  pip install ldap3
  python jml.py
"""

from ldap3 import Server, Connection, ALL, MODIFY_REPLACE, MODIFY_DELETE, HASHED_SALTED_SHA
from ldap3.utils.hashed import hashed
import sys

# ── Configuración ──────────────────────────────────────────────────────────────
LDAP_HOST   = "localhost"
LDAP_PORT   = 389
LDAP_ADMIN  = "cn=admin,dc=miempresa,dc=local"
LDAP_PASS   = "Secret123"
BASE_DN     = "dc=miempresa,dc=local"

DEPARTAMENTOS = ["ventas", "tecnologia", "recursos", "finanzas", "direccion"]
# ──────────────────────────────────────────────────────────────────────────────


def conectar():
    server = Server(LDAP_HOST, port=LDAP_PORT, get_info=ALL)
    conn = Connection(server, LDAP_ADMIN, LDAP_PASS, auto_bind=True)
    return conn


def listar_usuarios(conn):
    conn.search(BASE_DN, "(objectClass=inetOrgPerson)",
                attributes=["uid", "cn", "ou", "title"])
    usuarios = []
    for entry in conn.entries:
        usuarios.append({
            "dn":    str(entry.entry_dn),
            "uid":   str(entry.uid),
            "cn":    str(entry.cn),
            "ou":    str(entry.ou),
            "title": str(entry.title) if entry.title else ""
        })
    return sorted(usuarios, key=lambda x: x["ou"] + x["uid"])


def seleccionar_usuario(conn, accion=""):
    usuarios = listar_usuarios(conn)
    print(f"\nUsuarios disponibles{' para ' + accion if accion else ''}:\n")
    print(f"  {'#':<4} {'UID':<30} {'Nombre':<30} {'Departamento'}")
    print(f"  {'-'*4} {'-'*30} {'-'*30} {'-'*15}")
    for i, u in enumerate(usuarios, 1):
        print(f"  {i:<4} {u['uid']:<30} {u['cn']:<30} {u['ou']}")
    print()
    while True:
        try:
            opcion = int(input("  Selecciona el número del usuario: "))
            if 1 <= opcion <= len(usuarios):
                return usuarios[opcion - 1]
            print("  Número fuera de rango, inténtalo de nuevo.")
        except ValueError:
            print("  Introduce un número válido.")


def seleccionar_departamento(excluir=None):
    depts = [d for d in DEPARTAMENTOS if d != excluir]
    print("\n  Departamentos disponibles:\n")
    for i, d in enumerate(depts, 1):
        print(f"    {i}. {d}")
    print()
    while True:
        try:
            opcion = int(input("  Selecciona el número del departamento: "))
            if 1 <= opcion <= len(depts):
                return depts[opcion - 1]
            print("  Número fuera de rango.")
        except ValueError:
            print("  Introduce un número válido.")


# ── JOINER ────────────────────────────────────────────────────────────────────
def joiner(conn):
    print("\n" + "="*60)
    print("  JOINER — Alta de nuevo empleado")
    print("="*60)

    nombre    = input("\n  Nombre: ").strip()
    apellido1 = input("  Primer apellido: ").strip()
    apellido2 = input("  Segundo apellido: ").strip()
    titulo    = input("  Cargo/Título: ").strip()
    dept      = seleccionar_departamento()

    uid   = f"{nombre.lower()}.{apellido1.lower()}"
    dn    = f"uid={uid},ou={dept},{BASE_DN}"
    cn    = f"{nombre} {apellido1} {apellido2}"
    mail  = f"{uid}@miempresa.local"
    pwd   = f"Pass{apellido1.capitalize()}123!"

    print(f"\n  Resumen del nuevo empleado:")
    print(f"    UID:          {uid}")
    print(f"    Nombre:       {cn}")
    print(f"    Email:        {mail}")
    print(f"    Departamento: {dept}")
    print(f"    Cargo:        {titulo}")
    print(f"    Contraseña:   {pwd}")

    confirmar = input("\n  ¿Confirmar alta? (s/n): ").strip().lower()
    if confirmar != "s":
        print("  Alta cancelada.")
        return

    conn.add(dn, ["inetOrgPerson"], {
        "cn":           cn,
        "sn":           apellido1,
        "givenName":    nombre,
        "uid":          uid,
        "mail":         mail,
        "userPassword": pwd,
        "title":        titulo,
        "ou":           dept
    })

    if conn.result["result"] == 0:
        print(f"\n  ✅ Usuario '{uid}' creado correctamente en '{dept}'.")
        print(f"  ℹ️  MidPoint asignará los roles automáticamente en el próximo Reconcile.")
    else:
        print(f"\n  ❌ Error al crear usuario: {conn.result['description']}")


# ── MOVER ─────────────────────────────────────────────────────────────────────
def mover(conn):
    print("\n" + "="*60)
    print("  MOVER — Cambio de departamento")
    print("="*60)

    usuario = seleccionar_usuario(conn, "cambiar de departamento")
    dept_actual = usuario["ou"]

    print(f"\n  Usuario seleccionado: {usuario['cn']} ({usuario['uid']})")
    print(f"  Departamento actual:  {dept_actual}")
    print(f"\n  Selecciona el nuevo departamento:")

    dept_nuevo = seleccionar_departamento(excluir=dept_actual)

    confirmar = input(f"\n  ¿Mover '{usuario['uid']}' de '{dept_actual}' a '{dept_nuevo}'? (s/n): ").strip().lower()
    if confirmar != "s":
        print("  Cambio cancelado.")
        return

    # En LDAP no se puede cambiar el DN directamente — hay que hacer modrdn
    nuevo_dn = f"uid={usuario['uid']},ou={dept_nuevo},{BASE_DN}"
    nuevo_rdn = f"uid={usuario['uid']}"
    nuevo_superior = f"ou={dept_nuevo},{BASE_DN}"

    conn.modify_dn(usuario["dn"], nuevo_rdn, new_superior=nuevo_superior)

    if conn.result["result"] == 0:
        # Actualizar también el atributo ou
        conn.modify(nuevo_dn, {"ou": [(MODIFY_REPLACE, [dept_nuevo])]})
        print(f"\n  ✅ Usuario '{usuario['uid']}' movido de '{dept_actual}' a '{dept_nuevo}'.")
        print(f"  ℹ️  MidPoint reasignará los roles automáticamente en el próximo Reconcile.")
    else:
        print(f"\n  ❌ Error al mover usuario: {conn.result['description']}")


# ── LEAVER ────────────────────────────────────────────────────────────────────
def leaver(conn):
    print("\n" + "="*60)
    print("  LEAVER — Baja de empleado")
    print("="*60)

    usuario = seleccionar_usuario(conn, "dar de baja")

    print(f"\n  Usuario seleccionado: {usuario['cn']} ({usuario['uid']})")
    print(f"  Departamento: {usuario['ou']}")
    print(f"  Cargo: {usuario['title']}")

    print("\n  Tipo de baja:")
    print("    1. Deshabilitar cuenta (recomendado — reversible)")
    print("    2. Eliminar cuenta (irreversible)")
    print()

    while True:
        tipo = input("  Selecciona (1/2): ").strip()
        if tipo in ["1", "2"]:
            break
        print("  Opción no válida.")

    confirmar = input(f"\n  ¿Confirmar baja de '{usuario['uid']}'? (s/n): ").strip().lower()
    if confirmar != "s":
        print("  Baja cancelada.")
        return

    if tipo == "1":
        # Deshabilitar — cambiar contraseña a una inválida y añadir descripción
        conn.modify(usuario["dn"], {
            "description": [(MODIFY_REPLACE, ["CUENTA DESHABILITADA"])]
        })
        if conn.result["result"] == 0:
            print(f"\n  ✅ Cuenta '{usuario['uid']}' deshabilitada.")
            print(f"  ℹ️  MidPoint desactivará las asignaciones en el próximo Reconcile.")
        else:
            print(f"\n  ❌ Error: {conn.result['description']}")
    else:
        conn.delete(usuario["dn"])
        if conn.result["result"] == 0:
            print(f"\n  ✅ Usuario '{usuario['uid']}' eliminado del LDAP.")
            print(f"  ℹ️  MidPoint eliminará el usuario en el próximo Reconcile.")
        else:
            print(f"\n  ❌ Error: {conn.result['description']}")


# ── MENÚ PRINCIPAL ────────────────────────────────────────────────────────────
def menu():
    print("\n" + "="*60)
    print("  Secure-CCL — Gestión del Ciclo de Vida de Identidades")
    print("  Joiner / Mover / Leaver")
    print("="*60)
    print("\n  ¿Qué acción quieres realizar?\n")
    print("    1. Joiner  — Alta de nuevo empleado")
    print("    2. Mover   — Cambio de departamento")
    print("    3. Leaver  — Baja de empleado")
    print("    4. Salir")
    print()

    while True:
        opcion = input("  Selecciona una opción (1-4): ").strip()
        if opcion in ["1", "2", "3", "4"]:
            return opcion
        print("  Opción no válida.")


def main():
    print("\nConectando con OpenLDAP...")
    try:
        conn = conectar()
        print("Conexión establecida ✅")
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        sys.exit(1)

    while True:
        opcion = menu()

        if opcion == "1":
            joiner(conn)
        elif opcion == "2":
            mover(conn)
        elif opcion == "3":
            leaver(conn)
        elif opcion == "4":
            print("\n  Hasta luego.\n")
            break

        input("\n  Pulsa Enter para continuar...")

    conn.unbind()


if __name__ == "__main__":
    main()
