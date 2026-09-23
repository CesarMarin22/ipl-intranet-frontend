import { Box, Button, CircularProgress, Paper, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "../hooks/usePermissions";
import { getFirstAllowedRoute } from "../utils/getFirstAllowedRoute";

type Props = {
  /** One module, or several where having any of them grants access */
  moduleName: string | string[];
  actionName?: string;
  children: ReactNode;
};

export default function ProtectedModuleRoute({
  moduleName,
  actionName = "VER",
  children,
}: Props) {
  const { hasPermission, isLoading, permissions } = usePermissions();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Validando permisos...
        </Typography>
      </Box>
    );
  }

  const moduleNames = Array.isArray(moduleName) ? moduleName : [moduleName];

  if (!moduleNames.some((name) => hasPermission(name, actionName))) {
    const firstAllowedRoute = getFirstAllowedRoute(permissions);

    return (
      <Box
        sx={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
        }}
      >
        <Paper
          sx={{
            p: 4,
            maxWidth: 520,
            width: "100%",
            textAlign: "center",
            borderRadius: 3,
          }}
        >
          <Typography variant="h4" fontWeight={900} sx={{ mb: 1 }}>
            Sin acceso
          </Typography>

          <Typography color="text.secondary" sx={{ mb: 1 }}>
            No tienes permiso para realizar esta acción.
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Permiso requerido: {moduleNames.join(" o ")} / {actionName}
          </Typography>

          <Button
            variant="contained"
            onClick={() => navigate(firstAllowedRoute, { replace: true })}
          >
            Ir al inicio
          </Button>
        </Paper>
      </Box>
    );
  }

  return <>{children}</>;
}