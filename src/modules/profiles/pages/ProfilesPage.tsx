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
  getProfiles,
  updateProfileStatus,
  deleteProfile,
  type ProfileRow,
} from "../../../services/profiles";
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

export default function ProfilesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canCreate, canEdit, canDelete } = usePermissions();
  const isMobile = useMediaQuery("(max-width:700px)");

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["profiles"],
    queryFn: getProfiles,
  });

  const profiles = useMemo(() => data ?? [], [data]);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return profiles;

    return profiles.filter((p) =>
      [p.NOMBRE, p.DESCRIPCION]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(s))
    );
  }, [q, profiles]);

  const handleToggleStatus = async (row: ProfileRow) => {
    if (!canEdit("PERFILES")) {
      showWarning("No tienes permiso para editar perfiles");
      return;
    }

    try {
      await updateProfileStatus(row.PERFILID, row.ACTIVO === 1 ? 0 : 1);
      await queryClient.invalidateQueries({ queryKey: ["profiles"] });
      showSuccess("Estado del perfil actualizado");
    } catch (error: any) {
      showError(error?.message || "No se pudo actualizar el estado");
    }
  };

  const handleDelete = async (row: ProfileRow) => {
    if (!canDelete("PERFILES")) {
      showWarning("No tienes permiso para eliminar perfiles");
      return;
    }

    const confirmed = await confirmDelete(
      `¿Deseas eliminar el perfil ${row.NOMBRE}?`,
      "Eliminar perfil"
    );

    if (!confirmed) return;

    try {
      await deleteProfile(row.PERFILID);
      await queryClient.invalidateQueries({ queryKey: ["profiles"] });
      showSuccess("Perfil eliminado correctamente");
    } catch (error: any) {
      showError(error?.message || "No se pudo eliminar el perfil");
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      {(isLoading || isFetching) && (
        <LoaderOverlay label="Cargando perfiles..." />
      )}

      <PageHeader
        title="Perfiles"
        subtitle="Catálogo de perfiles del sistema."
        action={
          <PermissionButton
            allowed={canCreate("PERFILES")}
            variant="contained"
            onClick={() => navigate("/profiles/new")}
          >
            Crear perfil
          </PermissionButton>
        }
      />

      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, sm: 2.2 },
          width: "100%",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <TextField
          label="Buscar perfil"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />

        {isMobile ? (
          <Stack spacing={1.5}>
            {filtered.length === 0 ? (
              <Typography color="text.secondary" sx={{ p: 1 }}>
                No se encontraron perfiles.
              </Typography>
            ) : (
              filtered.map((row) => (
                <Card
                  key={row.PERFILID}
                  variant="outlined"
                  sx={{
                    borderColor: IPL.border,
                    borderRadius: 3,
                    bgcolor: "background.default",
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 1,
                        alignItems: "flex-start",
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={900} noWrap>
                          {row.NOMBRE}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          ID: {row.PERFILID}
                        </Typography>
                      </Box>

                      <Chip
                        label={row.ACTIVO === 1 ? "Activo" : "Inactivo"}
                        color={row.ACTIVO === 1 ? "success" : "default"}
                        size="small"
                      />
                    </Box>

                    <Typography
                      color="text.secondary"
                      sx={{ mt: 1.3, wordBreak: "break-word" }}
                    >
                      {row.DESCRIPCION ?? "-"}
                    </Typography>

                    <Divider sx={{ my: 1.5 }} />

                    <Stack spacing={1}>
                      <PermissionButton
                        allowed={canEdit("PERFILES")}
                        size="small"
                        variant="outlined"
                        fullWidth
                        onClick={() => navigate(`/profiles/${row.PERFILID}`)}
                      >
                        Editar
                      </PermissionButton>

                      <PermissionButton
                        allowed={canEdit("PERFILES")}
                        size="small"
                        color={row.ACTIVO === 1 ? "warning" : "success"}
                        variant="outlined"
                        fullWidth
                        onClick={() => handleToggleStatus(row)}
                      >
                        {row.ACTIVO === 1 ? "Desactivar" : "Activar"}
                      </PermissionButton>

                      <PermissionButton
                        allowed={canDelete("PERFILES")}
                        size="small"
                        color="error"
                        variant="outlined"
                        fullWidth
                        onClick={() => handleDelete(row)}
                      >
                        Eliminar
                      </PermissionButton>
                    </Stack>
                  </CardContent>
                </Card>
              ))
            )}
          </Stack>
        ) : (
          <Box sx={{ overflowX: "auto", width: "100%" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 850,
              }}
            >
              <thead>
                <tr style={{ textAlign: "left" }}>
                  <th style={{ padding: 10 }}>ID</th>
                  <th style={{ padding: 10 }}>Nombre</th>
                  <th style={{ padding: 10 }}>Descripción</th>
                  <th style={{ padding: 10 }}>Activo</th>
                  <th style={{ padding: 10 }}>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 14, color: "#A1A1AA" }}>
                      No se encontraron perfiles.
                    </td>
                  </tr>
                ) : (
                  filtered.map((row: ProfileRow) => (
                    <tr
                      key={row.PERFILID}
                      style={{ borderTop: `1px solid ${IPL.border}` }}
                    >
                      <td style={{ padding: 10, fontWeight: 900 }}>
                        {row.PERFILID}
                      </td>
                      <td style={{ padding: 10 }}>{row.NOMBRE}</td>
                      <td style={{ padding: 10 }}>
                        {row.DESCRIPCION ?? "-"}
                      </td>
                      <td style={{ padding: 10 }}>
                        <Chip
                          label={row.ACTIVO === 1 ? "Activo" : "Inactivo"}
                          color={row.ACTIVO === 1 ? "success" : "default"}
                          size="small"
                        />
                      </td>
                      <td style={{ padding: 10 }}>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                          <PermissionButton
                            allowed={canEdit("PERFILES")}
                            size="small"
                            variant="outlined"
                            onClick={() =>
                              navigate(`/profiles/${row.PERFILID}`)
                            }
                          >
                            Editar
                          </PermissionButton>

                          <PermissionButton
                            allowed={canEdit("PERFILES")}
                            size="small"
                            color={row.ACTIVO === 1 ? "warning" : "success"}
                            variant="outlined"
                            onClick={() => handleToggleStatus(row)}
                          >
                            {row.ACTIVO === 1 ? "Desactivar" : "Activar"}
                          </PermissionButton>

                          <PermissionButton
                            allowed={canDelete("PERFILES")}
                            size="small"
                            color="error"
                            variant="outlined"
                            onClick={() => handleDelete(row)}
                          >
                            Eliminar
                          </PermissionButton>
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