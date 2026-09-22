//import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PermissionsService } from "../../services/permissions";

export function usePermissions() {
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["my-permissions"],
    queryFn: PermissionsService.getMyPermissions,
    staleTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const permissions = data ?? [];

  const hasPermission = (moduleKey: string, actionKey: string) => {
    return permissions.some((p) => {
      const modulo = String(p.CLAVE_MODULO ?? p.NOMBRE_MODULO ?? "")
        .trim()
        .toUpperCase();

      const accion = String(p.CLAVE_ACCION ?? p.NOMBRE_ACCION ?? "")
        .trim()
        .toUpperCase();

      return (
        modulo === moduleKey.trim().toUpperCase() &&
        accion === actionKey.trim().toUpperCase() &&
        Number(p.PERMITIDO_FINAL) === 1
      );
    });
  };

  return {
    permissions,
    hasPermission,
    canView: (m: string) => hasPermission(m, "VER"),
    canCreate: (m: string) => hasPermission(m, "CREAR"),
    canEdit: (m: string) => hasPermission(m, "EDITAR"),
    canDelete: (m: string) => hasPermission(m, "ELIMINAR"),
    isLoading,
    isFetching,
  };
}