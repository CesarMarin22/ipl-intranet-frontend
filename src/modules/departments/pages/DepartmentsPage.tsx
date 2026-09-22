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
import { DepartmentsService, type Department } from "../../../services/departments";
import { useAppMutation } from "../../../shared/hooks/useAppMutation";
import PermissionButton from "../../../shared/components/PermissionButton";
import { usePermissions } from "../../../shared/hooks/usePermissions";
import { confirmDelete, showWarning } from "../../../shared/utils/swal";

export default function DepartmentsPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const isMobile = useMediaQuery("(max-width:700px)");
  const { canCreate, canEdit, canDelete } = usePermissions();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["departments"],
    queryFn: DepartmentsService.getAll,
  });

  const toggleStatusMutation = useAppMutation(
    ({ id, activo }: { id: number; activo: number }) =>
      DepartmentsService.changeStatus(id, activo),
    {
      invalidateKeys: [["departments"]],
      successMessage: "Estado actualizado correctamente",
    }
  );

  const deleteMutation = useAppMutation(
    (id: number) => DepartmentsService.delete(id),
    {
      invalidateKeys: [["departments"]],
      successMessage: "Departamento eliminado correctamente",
    }
  );

  const rows = useMemo(() => data ?? [], [data]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;

    return rows.filter((row) =>
      [row.NOMBRE]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(s))
    );
  }, [q, rows]);

  const handleToggleStatus = (row: Department) => {
    if (!canEdit("DEPARTAMENTOS")) {
      showWarning("No tienes permiso para editar departamentos");
      return;
    }

    toggleStatusMutation.mutate({
      id: row.DEPAID,
      activo: row.ACTIVO === 1 ? 0 : 1,
    });
  };

  const handleDelete = async (row: Department) => {
    if (!canDelete("DEPARTAMENTOS")) {
      showWarning("No tienes permiso para eliminar departamentos");
      return;
    }

    const confirmed = await confirmDelete(
      `¿Deseas eliminar el departamento ${row.NOMBRE}?`,
      "Eliminar departamento"
    );

    if (!confirmed) return;

    deleteMutation.mutate(row.DEPAID);
  };

  return (
    <Box sx={{ width: "100%" }}>
      {(isLoading || isFetching) && (
        <LoaderOverlay label="Cargando departamentos..." />
      )}

      <PageHeader
        title="Departamentos"
        subtitle="Catálogo de departamentos del sistema."
        action={
          <PermissionButton
            allowed={canCreate("DEPARTAMENTOS")}
            variant="contained"
            onClick={() => navigate("/departments/new")}
          >
            Crear departamento
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
          label="Buscar departamento"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />

        {isMobile ? (
          <Stack spacing={1.5}>
            {filtered.length === 0 ? (
              <Typography color="text.secondary" sx={{ p: 1 }}>
                No se encontraron departamentos.
              </Typography>
            ) : (
              filtered.map((row) => (
                <Card key={row.DEPAID} variant="outlined" sx={{ borderColor: IPL.border, borderRadius: 3, bgcolor: "background.default" }}>
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "flex-start" }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={900} noWrap>
                          {row.NOMBRE || "-"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {row.DEPAID}
                        </Typography>
                      </Box>
                      <Chip label={row.ACTIVO === 1 ? "Activo" : "Inactivo"} color={row.ACTIVO === 1 ? "success" : "default"} size="small" />
                    </Box>
                    <Stack spacing={0.8} sx={{ mt: 1.4 }}>
                    </Stack>
                    <Divider sx={{ my: 1.5 }} />
                    <Stack spacing={1}>
                      <PermissionButton allowed={canEdit("DEPARTAMENTOS")} size="small" variant="outlined" fullWidth onClick={() => navigate(`/departments/${row.DEPAID}`)}>Editar</PermissionButton>
                      <PermissionButton allowed={canEdit("DEPARTAMENTOS")} size="small" color={row.ACTIVO === 1 ? "warning" : "success"} variant="outlined" fullWidth onClick={() => handleToggleStatus(row)}>{row.ACTIVO === 1 ? "Desactivar" : "Activar"}</PermissionButton>
                      <PermissionButton allowed={canDelete("DEPARTAMENTOS")} size="small" color="error" variant="outlined" fullWidth onClick={() => handleDelete(row)}>Eliminar</PermissionButton>
                    </Stack>
                  </CardContent>
                </Card>
              ))
            )}
          </Stack>
        ) : (
          <Box sx={{ overflowX: "auto", width: "100%" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead>
                <tr style={{ textAlign: "left" }}>
                <th style={{ padding: 10 }}>ID</th>
                <th style={{ padding: 10 }}>Nombre</th>
                  <th style={{ padding: 10 }}>Activo</th>
                  <th style={{ padding: 10 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: 14, color: "#A1A1AA" }}>No se encontraron departamentos.</td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr key={row.DEPAID} style={{ borderTop: `1px solid ${IPL.border}` }}>
                      <td style={{ padding: 10, fontWeight: 900 }}>{row.DEPAID}</td>
                      <td style={{ padding: 10 }}>{row.NOMBRE}</td>
                      <td style={{ padding: 10 }}><Chip label={row.ACTIVO === 1 ? "Activo" : "Inactivo"} color={row.ACTIVO === 1 ? "success" : "default"} size="small" /></td>
                      <td style={{ padding: 10 }}>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                          <PermissionButton allowed={canEdit("DEPARTAMENTOS")} size="small" variant="outlined" onClick={() => navigate(`/departments/${row.DEPAID}`)}>Editar</PermissionButton>
                          <PermissionButton allowed={canEdit("DEPARTAMENTOS")} size="small" color={row.ACTIVO === 1 ? "warning" : "success"} variant="outlined" onClick={() => handleToggleStatus(row)}>{row.ACTIVO === 1 ? "Desactivar" : "Activar"}</PermissionButton>
                          <PermissionButton allowed={canDelete("DEPARTAMENTOS")} size="small" color="error" variant="outlined" onClick={() => handleDelete(row)}>Eliminar</PermissionButton>
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
