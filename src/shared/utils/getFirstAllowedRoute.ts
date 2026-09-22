import type { EffectivePermissionRow } from "../../services/permissions";

export function getFirstAllowedRoute(permissions: EffectivePermissionRow[]) {
  const routes = [
  { module: "MY_QR", path: "/comedor/my-qr" },
  { module: "CONSUMO_COMEDOR", path: "/comedor/saldo" },

  { module: "COMEDOR", path: "/comedor/scan" },
  { module: "RECARGAS_COMEDOR", path: "/comedor/recargas" },
  { module: "REPORTES_COMEDOR", path: "/comedor/reportes" },

  { module: "USUARIOS", path: "/users" },
  { module: "PERFILES", path: "/profiles" },
  { module: "PERMISOS", path: "/permissions" },
];

  const allowed = routes.find((r) =>
    permissions.some(
      (p) =>
        String(p.CLAVE_MODULO).toUpperCase() === r.module &&
        String(p.CLAVE_ACCION).toUpperCase() === "VER" &&
        Number(p.PERMITIDO_FINAL) === 1
    )
  );

  return allowed?.path ?? "/sin-acceso";
}