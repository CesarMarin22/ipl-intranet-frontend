import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import PageHeader from "../../../shared/components/PageHeader";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getUsers,
  updateUserStatus,
  deleteUser,
  type UserRow,
} from "../../../services/users";
import LoaderOverlay from "../../../shared/components/LoaderOverlay";
import { IPL } from "../../../shared/theme/theme";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "../../../shared/hooks/usePermissions";
import PermissionButton from "../../../shared/components/PermissionButton";
import {
  showError,
  showSuccess,
  showWarning,
  confirmDelete,
} from "../../../shared/utils/swal";

export default function UsersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canCreate, canEdit, canDelete } = usePermissions();
  const isMobile = useMediaQuery("(max-width:800px)");

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  const users = useMemo(() => data ?? [], [data]);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return users;

    return users.filter((u) =>
      [
        u.NOMBRE,
        u.USUARIO,
        u.PERFIL_NOMBRE,
        u.DEPARTAMENTO_NOMBRE,
        u.SOCIO_NOMBRE,
        u.SUCURSAL,
        u.SUCURSAL_NOMBRE,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(s))
    );
  }, [q, users]);

  const handleToggleStatus = async (user: UserRow) => {
    if (!canEdit("USUARIOS")) {
      showWarning("No tienes permiso para editar usuarios");
      return;
    }

    try {
      await updateUserStatus(user.USUARIOID, user.ACTIVO === 1 ? 0 : 1);
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      showSuccess("Estado del usuario actualizado");
    } catch (error: any) {
      showError(error?.message || "No se pudo actualizar el estado del usuario");
    }
  };

  const handleDelete = async (user: UserRow) => {
    if (!canDelete("USUARIOS")) {
      showWarning("No tienes permiso para eliminar usuarios");
      return;
    }

    const confirmed = await confirmDelete(
      `¿Deseas eliminar al usuario ${user.USUARIO}?`,
      "Eliminar usuario"
    );

    if (!confirmed) return;

    try {
      await deleteUser(user.USUARIOID);
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      showSuccess("Usuario eliminado correctamente");
    } catch (error: any) {
      showError(error?.message || "No se pudo eliminar el usuario");
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      {(isLoading || isFetching) && <LoaderOverlay label="Cargando usuarios..." />}

      <PageHeader
        title="Usuarios"
        subtitle="Gestión de accesos, perfiles y responsables."
        action={
          <PermissionButton allowed={canCreate("USUARIOS")} variant="contained" onClick={() => navigate("/users/new")}>
            Crear usuario
          </PermissionButton>
        }
      />

      <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2.2 }, width: "100%", boxSizing: "border-box", overflow: "hidden" }}>
        <TextField label="Buscar usuario" value={q} onChange={(e) => setQ(e.target.value)} fullWidth sx={{ mb: 2 }} />

        {isMobile ? (
          <Stack spacing={1.5}>
            {filtered.length === 0 ? (
              <Typography color="text.secondary" sx={{ p: 1 }}>No se encontraron usuarios.</Typography>
            ) : (
              filtered.map((u) => (
                <Card key={u.USUARIOID} variant="outlined" sx={{ borderColor: IPL.border, borderRadius: 3, bgcolor: "background.default" }}>
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "flex-start" }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={900} noWrap>{u.NOMBRE}</Typography>
                        <Typography variant="caption" color="text.secondary">{u.USUARIO} · ID: {u.USUARIOID}</Typography>
                      </Box>
                      <Chip label={u.ACTIVO === 1 ? "Activo" : "Inactivo"} color={u.ACTIVO === 1 ? "success" : "default"} size="small" />
                    </Box>

                    <Stack spacing={0.8} sx={{ mt: 1.4 }}>
                      {[["Perfil", u.PERFIL_NOMBRE], ["Departamento", u.DEPARTAMENTO_NOMBRE], ["Socio", u.SOCIO_NOMBRE], ["Sucursal", u.SUCURSAL_NOMBRE ?? u.SUCURSAL]].map(([label, value]) => (
                        <Box key={String(label)} sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                          <Typography variant="caption" color="text.secondary">{label}</Typography>
                          <Typography variant="body2" fontWeight={700} textAlign="right" sx={{ wordBreak: "break-word" }}>{value || "-"}</Typography>
                        </Box>
                      ))}
                    </Stack>

                    <Divider sx={{ my: 1.5 }} />

                    <Stack spacing={1}>
                      <PermissionButton allowed={canEdit("USUARIOS")} size="small" variant="outlined" fullWidth onClick={() => navigate(`/users/${u.USUARIOID}`)}>Editar</PermissionButton>
                      <PermissionButton allowed={canEdit("USUARIOS")} size="small" color={u.ACTIVO === 1 ? "warning" : "success"} variant="outlined" fullWidth onClick={() => handleToggleStatus(u)}>{u.ACTIVO === 1 ? "Desactivar" : "Activar"}</PermissionButton>
                      <PermissionButton allowed={canDelete("USUARIOS")} size="small" color="error" variant="outlined" fullWidth onClick={() => handleDelete(u)}>Eliminar</PermissionButton>
                    </Stack>
                  </CardContent>
                </Card>
              ))
            )}
          </Stack>
        ) : (
          <Box sx={{ overflowX: "auto", width: "100%" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1100 }}>
              <thead>
                <tr style={{ textAlign: "left" }}>
                  <th style={{ padding: 10 }}>ID</th>
                  <th style={{ padding: 10 }}>Nombre</th>
                  <th style={{ padding: 10 }}>Usuario</th>
                  <th style={{ padding: 10 }}>Perfil</th>
                  <th style={{ padding: 10 }}>Departamento</th>
                  <th style={{ padding: 10 }}>Socio</th>
                  <th style={{ padding: 10 }}>Sucursal</th>
                  <th style={{ padding: 10 }}>Activo</th>
                  <th style={{ padding: 10 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} style={{ padding: 14, color: "#A1A1AA" }}>No se encontraron usuarios.</td></tr>
                ) : (
                  filtered.map((u) => (
                    <tr key={u.USUARIOID} style={{ borderTop: `1px solid ${IPL.border}` }}>
                      <td style={{ padding: 10, fontWeight: 900 }}>{u.USUARIOID}</td>
                      <td style={{ padding: 10 }}>{u.NOMBRE}</td>
                      <td style={{ padding: 10 }}>{u.USUARIO}</td>
                      <td style={{ padding: 10 }}>{u.PERFIL_NOMBRE ?? "-"}</td>
                      <td style={{ padding: 10 }}>{u.DEPARTAMENTO_NOMBRE ?? "-"}</td>
                      <td style={{ padding: 10 }}>{u.SOCIO_NOMBRE ?? "-"}</td>
                      <td style={{ padding: 10 }}>{u.SUCURSAL_NOMBRE ?? u.SUCURSAL ?? "-"}</td>
                      <td style={{ padding: 10 }}><Chip label={u.ACTIVO === 1 ? "Activo" : "Inactivo"} color={u.ACTIVO === 1 ? "success" : "default"} size="small" /></td>
                      <td style={{ padding: 10 }}>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                          <PermissionButton allowed={canEdit("USUARIOS")} size="small" variant="outlined" onClick={() => navigate(`/users/${u.USUARIOID}`)}>Editar</PermissionButton>
                          <PermissionButton allowed={canEdit("USUARIOS")} size="small" color={u.ACTIVO === 1 ? "warning" : "success"} variant="outlined" onClick={() => handleToggleStatus(u)}>{u.ACTIVO === 1 ? "Desactivar" : "Activar"}</PermissionButton>
                          <PermissionButton allowed={canDelete("USUARIOS")} size="small" color="error" variant="outlined" onClick={() => handleDelete(u)}>Eliminar</PermissionButton>
                        </Box>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
