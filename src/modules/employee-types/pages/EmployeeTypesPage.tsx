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
import { EmployeeTypesService, type EmployeeType } from "../../../services/employeeTypes";
import { useAppMutation } from "../../../shared/hooks/useAppMutation";
import PermissionButton from "../../../shared/components/PermissionButton";
import { usePermissions } from "../../../shared/hooks/usePermissions";
import { confirmDelete, showWarning } from "../../../shared/utils/swal";

export default function EmployeeTypesPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const isMobile = useMediaQuery("(max-width:700px)");
  const { canCreate, canEdit, canDelete } = usePermissions();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["employee-types"],
    queryFn: EmployeeTypesService.getAll,
  });

  const toggleStatusMutation = useAppMutation(
    ({ id, activo }: { id: number; activo: number }) =>
      EmployeeTypesService.changeStatus(id, activo),
    {
      invalidateKeys: [["employee-types"]],
      successMessage: "Estado actualizado correctamente",
    }
  );

  const deleteMutation = useAppMutation(
    (id: number) => EmployeeTypesService.delete(id),
    {
      invalidateKeys: [["employee-types"]],
      successMessage: "Tipo de empleado eliminado correctamente",
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

  const handleToggleStatus = (row: EmployeeType) => {
    if (!canEdit("TIPOS_EMPLEADO")) {
      showWarning("No tienes permiso para editar tipos de empleado");
      return;
    }

    toggleStatusMutation.mutate({
      id: row.TIPO_EMPLEADO_ID,
      activo: row.ACTIVO === 1 ? 0 : 1,
    });
  };

  const handleDelete = async (row: EmployeeType) => {
    if (!canDelete("TIPOS_EMPLEADO")) {
      showWarning("No tienes permiso para eliminar tipos de empleado");
      return;
    }

    const confirmed = await confirmDelete(
      `¿Deseas eliminar el tipo de empleado ${row.NOMBRE}?`,
      "Eliminar tipo de empleado"
    );

    if (!confirmed) return;

    deleteMutation.mutate(row.TIPO_EMPLEADO_ID);
  };

  return (
    <Box sx={{ width: "100%" }}>
      {(isLoading || isFetching) && (
        <LoaderOverlay label="Cargando tipos de empleado..." />
      )}

      <PageHeader
        title="Tipos de empleado"
        subtitle="Catálogo de tipos de empleado."
        action={
          <PermissionButton
            allowed={canCreate("TIPOS_EMPLEADO")}
            variant="contained"
            onClick={() => navigate("/employee-types/new")}
          >
            Crear tipo
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
          label="Buscar tipo de empleado"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />

        {isMobile ? (
          <Stack spacing={1.5}>
            {filtered.length === 0 ? (
              <Typography color="text.secondary" sx={{ p: 1 }}>
                No se encontraron tipos de empleado.
              </Typography>
            ) : (
              filtered.map((row) => (
                <Card key={row.TIPO_EMPLEADO_ID} variant="outlined" sx={{ borderColor: IPL.border, borderRadius: 3, bgcolor: "background.default" }}>
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "flex-start" }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={900} noWrap>
                          {row.NOMBRE || "-"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {row.TIPO_EMPLEADO_ID}
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
                      <PermissionButton allowed={canEdit("TIPOS_EMPLEADO")} size="small" variant="outlined" fullWidth onClick={() => navigate(`/employee-types/${row.TIPO_EMPLEADO_ID}`)}>Editar</PermissionButton>
                      <PermissionButton allowed={canEdit("TIPOS_EMPLEADO")} size="small" color={row.ACTIVO === 1 ? "warning" : "success"} variant="outlined" fullWidth onClick={() => handleToggleStatus(row)}>{row.ACTIVO === 1 ? "Desactivar" : "Activar"}</PermissionButton>
                      <PermissionButton allowed={canDelete("TIPOS_EMPLEADO")} size="small" color="error" variant="outlined" fullWidth onClick={() => handleDelete(row)}>Eliminar</PermissionButton>
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
                    <td colSpan={5} style={{ padding: 14, color: "#A1A1AA" }}>No se encontraron tipos de empleado.</td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr key={row.TIPO_EMPLEADO_ID} style={{ borderTop: `1px solid ${IPL.border}` }}>
                      <td style={{ padding: 10, fontWeight: 900 }}>{row.TIPO_EMPLEADO_ID}</td>
                      <td style={{ padding: 10 }}>{row.CLAVE ?? "-"}</td>
                      <td style={{ padding: 10 }}>{row.NOMBRE}</td>
                      <td style={{ padding: 10 }}><Chip label={row.ACTIVO === 1 ? "Activo" : "Inactivo"} color={row.ACTIVO === 1 ? "success" : "default"} size="small" /></td>
                      <td style={{ padding: 10 }}>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                          <PermissionButton allowed={canEdit("TIPOS_EMPLEADO")} size="small" variant="outlined" onClick={() => navigate(`/employee-types/${row.TIPO_EMPLEADO_ID}`)}>Editar</PermissionButton>
                          <PermissionButton allowed={canEdit("TIPOS_EMPLEADO")} size="small" color={row.ACTIVO === 1 ? "warning" : "success"} variant="outlined" onClick={() => handleToggleStatus(row)}>{row.ACTIVO === 1 ? "Desactivar" : "Activar"}</PermissionButton>
                          <PermissionButton allowed={canDelete("TIPOS_EMPLEADO")} size="small" color="error" variant="outlined" onClick={() => handleDelete(row)}>Eliminar</PermissionButton>
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
