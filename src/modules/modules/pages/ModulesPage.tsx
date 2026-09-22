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
import { ModulesService, type ModuleRow } from "../../../services/modules";
import { useAppMutation } from "../../../shared/hooks/useAppMutation";
import PermissionButton from "../../../shared/components/PermissionButton";
import { usePermissions } from "../../../shared/hooks/usePermissions";
import { confirmDelete, showWarning } from "../../../shared/utils/swal";

export default function ModulesPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const isMobile = useMediaQuery("(max-width:700px)");
  const { canCreate, canEdit, canDelete } = usePermissions();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["modules"],
    queryFn: ModulesService.getAll,
  });

  const toggleStatusMutation = useAppMutation(
    ({ id, activo }: { id: number; activo: number }) =>
      ModulesService.changeStatus(id, activo),
    {
      invalidateKeys: [["modules"]],
      successMessage: "Estado actualizado correctamente",
    }
  );

  const deleteMutation = useAppMutation(
    (id: number) => ModulesService.delete(id),
    {
      invalidateKeys: [["modules"]],
      successMessage: "Módulo eliminado correctamente",
    }
  );

  const rows = useMemo(() => data ?? [], [data]);

  const parentMap = useMemo(() => {
    const map = new Map<number, string>();
    rows.forEach((r) => map.set(r.MODULOID, r.NOMBRE));
    return map;
  }, [rows]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;

    return rows.filter((row) =>
      [row.NOMBRE, row.CLAVE, row.RUTA]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(s))
    );
  }, [q, rows, parentMap]);

  const handleToggleStatus = (row: ModuleRow) => {
    if (!canEdit("MODULOS")) {
      showWarning("No tienes permiso para editar módulos");
      return;
    }

    toggleStatusMutation.mutate({
      id: row.MODULOID,
      activo: row.ACTIVO === 1 ? 0 : 1,
    });
  };

  const handleDelete = async (row: ModuleRow) => {
    if (!canDelete("MODULOS")) {
      showWarning("No tienes permiso para eliminar módulos");
      return;
    }

    const confirmed = await confirmDelete(
      `¿Deseas eliminar el módulo ${row.NOMBRE}?`,
      "Eliminar módulo"
    );

    if (!confirmed) return;

    deleteMutation.mutate(row.MODULOID);
  };

  return (
    <Box sx={{ width: "100%" }}>
      {(isLoading || isFetching) && (
        <LoaderOverlay label="Cargando módulos..." />
      )}

      <PageHeader
        title="Módulos"
        subtitle="Catálogo de módulos del sistema."
        action={
          <PermissionButton
            allowed={canCreate("MODULOS")}
            variant="contained"
            onClick={() => navigate("/modules/new")}
          >
            Crear módulo
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
          label="Buscar módulo"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />

        {isMobile ? (
          <Stack spacing={1.5}>
            {filtered.length === 0 ? (
              <Typography color="text.secondary" sx={{ p: 1 }}>
                No se encontraron módulos.
              </Typography>
            ) : (
              filtered.map((row) => (
                <Card key={row.MODULOID} variant="outlined" sx={{ borderColor: IPL.border, borderRadius: 3, bgcolor: "background.default" }}>
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "flex-start" }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={900} noWrap>
                          {row.NOMBRE || "-"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {row.MODULOID}
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
                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                      <Typography variant="caption" color="text.secondary">Padre</Typography>
                      <Typography variant="body2" fontWeight={700} textAlign="right" sx={{ wordBreak: "break-word" }}>
                        {row.PADRE_ID ? parentMap.get(row.PADRE_ID) ?? row.PADRE_ID : "-"}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                      <Typography variant="caption" color="text.secondary">Ruta</Typography>
                      <Typography variant="body2" fontWeight={700} textAlign="right" sx={{ wordBreak: "break-word" }}>
                        {row.RUTA || "-"}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                      <Typography variant="caption" color="text.secondary">Orden</Typography>
                      <Typography variant="body2" fontWeight={700} textAlign="right" sx={{ wordBreak: "break-word" }}>
                        {row.ORDEN ?? "-"}
                      </Typography>
                    </Box>
                    </Stack>
                    <Divider sx={{ my: 1.5 }} />
                    <Stack spacing={1}>
                      <PermissionButton allowed={canEdit("MODULOS")} size="small" variant="outlined" fullWidth onClick={() => navigate(`/modules/${row.MODULOID}`)}>Editar</PermissionButton>
                      <PermissionButton allowed={canEdit("MODULOS")} size="small" color={row.ACTIVO === 1 ? "warning" : "success"} variant="outlined" fullWidth onClick={() => handleToggleStatus(row)}>{row.ACTIVO === 1 ? "Desactivar" : "Activar"}</PermissionButton>
                      <PermissionButton allowed={canDelete("MODULOS")} size="small" color="error" variant="outlined" fullWidth onClick={() => handleDelete(row)}>Eliminar</PermissionButton>
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
                <th style={{ padding: 10 }}>Clave</th>
                <th style={{ padding: 10 }}>Padre</th>
                <th style={{ padding: 10 }}>Ruta</th>
                <th style={{ padding: 10 }}>Orden</th>
                  <th style={{ padding: 10 }}>Activo</th>
                  <th style={{ padding: 10 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: 14, color: "#A1A1AA" }}>No se encontraron módulos.</td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr key={row.MODULOID} style={{ borderTop: `1px solid ${IPL.border}` }}>
                      <td style={{ padding: 10, fontWeight: 900 }}>{row.MODULOID}</td>
                      <td style={{ padding: 10 }}>{row.NOMBRE}</td>
                      <td style={{ padding: 10 }}>{row.CLAVE}</td>
                      <td style={{ padding: 10 }}>{row.PADRE_ID ? parentMap.get(row.PADRE_ID) ?? row.PADRE_ID : "-"}</td>
                      <td style={{ padding: 10 }}>{row.RUTA ?? "-"}</td>
                      <td style={{ padding: 10 }}>{row.ORDEN ?? "-"}</td>
                      <td style={{ padding: 10 }}><Chip label={row.ACTIVO === 1 ? "Activo" : "Inactivo"} color={row.ACTIVO === 1 ? "success" : "default"} size="small" /></td>
                      <td style={{ padding: 10 }}>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                          <PermissionButton allowed={canEdit("MODULOS")} size="small" variant="outlined" onClick={() => navigate(`/modules/${row.MODULOID}`)}>Editar</PermissionButton>
                          <PermissionButton allowed={canEdit("MODULOS")} size="small" color={row.ACTIVO === 1 ? "warning" : "success"} variant="outlined" onClick={() => handleToggleStatus(row)}>{row.ACTIVO === 1 ? "Desactivar" : "Activar"}</PermissionButton>
                          <PermissionButton allowed={canDelete("MODULOS")} size="small" color="error" variant="outlined" onClick={() => handleDelete(row)}>Eliminar</PermissionButton>
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
