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
import { PartnersService, type Partner } from "../../../services/partners";
import { useAppMutation } from "../../../shared/hooks/useAppMutation";
import PermissionButton from "../../../shared/components/PermissionButton";
import { usePermissions } from "../../../shared/hooks/usePermissions";
import { confirmDelete, showWarning } from "../../../shared/utils/swal";

export default function PartnersPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const isMobile = useMediaQuery("(max-width:700px)");
  const { canCreate, canEdit, canDelete } = usePermissions();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["partners"],
    queryFn: PartnersService.getAll,
  });

  const toggleStatusMutation = useAppMutation(
    ({ id, activo }: { id: number; activo: number }) =>
      PartnersService.changeStatus(id, activo),
    {
      invalidateKeys: [["partners"]],
      successMessage: "Estado actualizado correctamente",
    }
  );

  const deleteMutation = useAppMutation(
    (id: number) => PartnersService.delete(id),
    {
      invalidateKeys: [["partners"]],
      successMessage: "Socio eliminado correctamente",
    }
  );

  const rows = useMemo(() => data ?? [], [data]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;

    return rows.filter((row) =>
      [row.NOMBRE, row.RFC]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(s))
    );
  }, [q, rows]);

  const handleToggleStatus = (row: Partner) => {
    if (!canEdit("SOCIOS")) {
      showWarning("No tienes permiso para editar socios");
      return;
    }

    toggleStatusMutation.mutate({
      id: row.SOCIOID,
      activo: row.ACTIVO === 1 ? 0 : 1,
    });
  };

  const handleDelete = async (row: Partner) => {
    if (!canDelete("SOCIOS")) {
      showWarning("No tienes permiso para eliminar socios");
      return;
    }

    const confirmed = await confirmDelete(
      `¿Deseas eliminar el socio ${row.NOMBRE}?`,
      "Eliminar socio"
    );

    if (!confirmed) return;

    deleteMutation.mutate(row.SOCIOID);
  };

  return (
    <Box sx={{ width: "100%" }}>
      {(isLoading || isFetching) && (
        <LoaderOverlay label="Cargando socios..." />
      )}

      <PageHeader
        title="Socios"
        subtitle="Catálogo de socios del sistema."
        action={
          <PermissionButton
            allowed={canCreate("SOCIOS")}
            variant="contained"
            onClick={() => navigate("/partners/new")}
          >
            Crear socio
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
          label="Buscar socio"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />

        {isMobile ? (
          <Stack spacing={1.5}>
            {filtered.length === 0 ? (
              <Typography color="text.secondary" sx={{ p: 1 }}>
                No se encontraron socios.
              </Typography>
            ) : (
              filtered.map((row) => (
                <Card key={row.SOCIOID} variant="outlined" sx={{ borderColor: IPL.border, borderRadius: 3, bgcolor: "background.default" }}>
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "flex-start" }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={900} noWrap>
                          {row.NOMBRE || "-"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {row.SOCIOID}
                        </Typography>
                      </Box>
                      <Chip label={row.ACTIVO === 1 ? "Activo" : "Inactivo"} color={row.ACTIVO === 1 ? "success" : "default"} size="small" />
                    </Box>
                    <Stack spacing={0.8} sx={{ mt: 1.4 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                      <Typography variant="caption" color="text.secondary">RFC</Typography>
                      <Typography variant="body2" fontWeight={700} textAlign="right" sx={{ wordBreak: "break-word" }}>
                        {row.RFC || "-"}
                      </Typography>
                    </Box>
                    </Stack>
                    <Divider sx={{ my: 1.5 }} />
                    <Stack spacing={1}>
                      <PermissionButton allowed={canEdit("SOCIOS")} size="small" variant="outlined" fullWidth onClick={() => navigate(`/partners/${row.SOCIOID}`)}>Editar</PermissionButton>
                      <PermissionButton allowed={canEdit("SOCIOS")} size="small" color={row.ACTIVO === 1 ? "warning" : "success"} variant="outlined" fullWidth onClick={() => handleToggleStatus(row)}>{row.ACTIVO === 1 ? "Desactivar" : "Activar"}</PermissionButton>
                      <PermissionButton allowed={canDelete("SOCIOS")} size="small" color="error" variant="outlined" fullWidth onClick={() => handleDelete(row)}>Eliminar</PermissionButton>
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
                <th style={{ padding: 10 }}>Nombre</th>
                <th style={{ padding: 10 }}>RFC</th>
                  <th style={{ padding: 10 }}>Activo</th>
                  <th style={{ padding: 10 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 14, color: "#A1A1AA" }}>No se encontraron socios.</td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr key={row.SOCIOID} style={{ borderTop: `1px solid ${IPL.border}` }}>
                      <td style={{ padding: 10, fontWeight: 900 }}>{row.SOCIOID}</td>
                      <td style={{ padding: 10 }}>{row.NOMBRE}</td>
                      <td style={{ padding: 10 }}>{row.RFC ?? "-"}</td>
                      <td style={{ padding: 10 }}><Chip label={row.ACTIVO === 1 ? "Activo" : "Inactivo"} color={row.ACTIVO === 1 ? "success" : "default"} size="small" /></td>
                      <td style={{ padding: 10 }}>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                          <PermissionButton allowed={canEdit("SOCIOS")} size="small" variant="outlined" onClick={() => navigate(`/partners/${row.SOCIOID}`)}>Editar</PermissionButton>
                          <PermissionButton allowed={canEdit("SOCIOS")} size="small" color={row.ACTIVO === 1 ? "warning" : "success"} variant="outlined" onClick={() => handleToggleStatus(row)}>{row.ACTIVO === 1 ? "Desactivar" : "Activar"}</PermissionButton>
                          <PermissionButton allowed={canDelete("SOCIOS")} size="small" color="error" variant="outlined" onClick={() => handleDelete(row)}>Eliminar</PermissionButton>
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
