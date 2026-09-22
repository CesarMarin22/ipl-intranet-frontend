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
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "../../../shared/components/PageHeader";
import LoaderOverlay from "../../../shared/components/LoaderOverlay";
import { IPL } from "../../../shared/theme/theme";
import { ActionsService, type ActionRow } from "../../../services/actions";
import { useAppMutation } from "../../../shared/hooks/useAppMutation";
import PermissionButton from "../../../shared/components/PermissionButton";
import { usePermissions } from "../../../shared/hooks/usePermissions";
import { confirmDelete, showWarning } from "../../../shared/utils/swal";

export default function ActionsPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const isMobile = useMediaQuery("(max-width:700px)");
  const { canCreate, canEdit, canDelete } = usePermissions();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["actions"],
    queryFn: ActionsService.getAll,
  });

  const toggleStatusMutation = useAppMutation(
    ({ id, activo }: { id: number; activo: number }) =>
      ActionsService.changeStatus(id, activo),
    {
      invalidateKeys: [["actions"]],
      successMessage: "Estado actualizado correctamente",
    }
  );

  const deleteMutation = useAppMutation(
    (id: number) => ActionsService.delete(id),
    {
      invalidateKeys: [["actions"]],
      successMessage: "Acción eliminada correctamente",
    }
  );

  const rows = useMemo(() => data ?? [], [data]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;

    return rows.filter((row) =>
      [row.CLAVE, row.NOMBRE]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(s))
    );
  }, [q, rows]);

  const handleToggleStatus = (row: ActionRow) => {
    if (!canEdit("ACCIONES")) {
      showWarning("No tienes permiso para editar acciones");
      return;
    }

    toggleStatusMutation.mutate({
      id: row.ACCIONID,
      activo: row.ACTIVO === 1 ? 0 : 1,
    });
  };

  const handleDelete = async (row: ActionRow) => {
    if (!canDelete("ACCIONES")) {
      showWarning("No tienes permiso para eliminar acciones");
      return;
    }

    const confirmed = await confirmDelete(
      `¿Deseas eliminar la acción ${row.NOMBRE}?`,
      "Eliminar acción"
    );

    if (!confirmed) return;

    deleteMutation.mutate(row.ACCIONID);
  };

  return (
    <Box sx={{ width: "100%" }}>
      {(isLoading || isFetching) && (
        <LoaderOverlay label="Cargando acciones..." />
      )}

      <PageHeader
        title="Acciones"
        subtitle="Catálogo de acciones del sistema."
        action={
          <PermissionButton
            allowed={canCreate("ACCIONES")}
            variant="contained"
            onClick={() => navigate("/actions/new")}
          >
            Crear acción
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
          label="Buscar acción"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />

        {isMobile ? (
          <Stack spacing={1.5}>
            {filtered.length === 0 ? (
              <Typography color="text.secondary" sx={{ p: 1 }}>
                No se encontraron acciones.
              </Typography>
            ) : (
              filtered.map((row) => (
                <Card key={row.ACCIONID} variant="outlined" sx={{ borderColor: IPL.border, borderRadius: 3, bgcolor: "background.default" }}>
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "flex-start" }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={900} noWrap>
                          {row.NOMBRE || "-"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {row.ACCIONID}
                        </Typography>
                      </Box>
                      <Chip label={row.ACTIVO === 1 ? "Activo" : "Inactivo"} color={row.ACTIVO === 1 ? "success" : "default"} size="small" />
                    </Box>
                    <Stack spacing={0.8} sx={{ mt: 1.4 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                      <Typography variant="caption" color="text.secondary">Clave</Typography>
                      <Typography variant="body2" fontWeight={700} textAlign="right" sx={{ wordBreak: "break-word" }}>
                        {row.CLAVE || "-"}
                      </Typography>
                    </Box>
                    </Stack>
                    <Divider sx={{ my: 1.5 }} />
                    <Stack spacing={1}>
                      <PermissionButton allowed={canEdit("ACCIONES")} size="small" variant="outlined" fullWidth onClick={() => navigate(`/actions/${row.ACCIONID}`)}>Editar</PermissionButton>
                      <PermissionButton allowed={canEdit("ACCIONES")} size="small" color={row.ACTIVO === 1 ? "warning" : "success"} variant="outlined" fullWidth onClick={() => handleToggleStatus(row)}>{row.ACTIVO === 1 ? "Desactivar" : "Activar"}</PermissionButton>
                      <PermissionButton allowed={canDelete("ACCIONES")} size="small" color="error" variant="outlined" fullWidth onClick={() => handleDelete(row)}>Eliminar</PermissionButton>
                    </Stack>
                  </CardContent>
                </Card>
              ))
            )}
          </Stack>
        ) : (
          <Box sx={{ overflowX: "auto", width: "100%" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
              <thead>
                <tr style={{ textAlign: "left" }}>
                <th style={{ padding: 10 }}>ID</th>
                <th style={{ padding: 10 }}>Clave</th>
                <th style={{ padding: 10 }}>Nombre</th>
                  <th style={{ padding: 10 }}>Activo</th>
                  <th style={{ padding: 10 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 14, color: "#A1A1AA" }}>No se encontraron acciones.</td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr key={row.ACCIONID} style={{ borderTop: `1px solid ${IPL.border}` }}>
                      <td style={{ padding: 10, fontWeight: 900 }}>{row.ACCIONID}</td>
                      <td style={{ padding: 10 }}>{row.CLAVE}</td>
                      <td style={{ padding: 10 }}>{row.NOMBRE}</td>
                      <td style={{ padding: 10 }}><Chip label={row.ACTIVO === 1 ? "Activo" : "Inactivo"} color={row.ACTIVO === 1 ? "success" : "default"} size="small" /></td>
                      <td style={{ padding: 10 }}>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                          <PermissionButton allowed={canEdit("ACCIONES")} size="small" variant="outlined" onClick={() => navigate(`/actions/${row.ACCIONID}`)}>Editar</PermissionButton>
                          <PermissionButton allowed={canEdit("ACCIONES")} size="small" color={row.ACTIVO === 1 ? "warning" : "success"} variant="outlined" onClick={() => handleToggleStatus(row)}>{row.ACTIVO === 1 ? "Desactivar" : "Activar"}</PermissionButton>
                          <PermissionButton allowed={canDelete("ACCIONES")} size="small" color="error" variant="outlined" onClick={() => handleDelete(row)}>Eliminar</PermissionButton>
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
