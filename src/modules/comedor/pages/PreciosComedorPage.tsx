import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PageHeader from "../../../shared/components/PageHeader";
import LoaderOverlay from "../../../shared/components/LoaderOverlay";
import {
  createPrecioComedor,
  deletePrecioComedor,
  getPreciosComedor,
  updatePrecioComedor,
  type PrecioComedor,
} from "../../../services/comedorPrecios";
import { useState } from "react";
import { showError, showSuccess } from "../../../shared/utils/swal";
import { IPL } from "../../../shared/theme/theme";
import { usePermissions } from "../../../shared/hooks/usePermissions";
import { EmployeeTypesService } from "../../../services/employeeTypes";
import Swal from "sweetalert2";

export default function PreciosComedorPage() {
  const queryClient = useQueryClient();
  const [savingId, setSavingId] = useState<number | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newForm, setNewForm] = useState({
    TIPO_EMPLEADO_ID: "",
    PRECIO_NORMAL: "",
    PRECIO_X10: "",
    PRECIO_X20: "",
  });

  const { canCreate, canEdit, canDelete } = usePermissions();

  const canCreatePrices = canCreate("PRECIOS_COMEDOR");
  const canEditPrices = canEdit("PRECIOS_COMEDOR");
  const canDeletePrices = canDelete("PRECIOS_COMEDOR");

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["precios-comedor"],
    queryFn: getPreciosComedor,
  });

  const { data: employeeTypes = [] } = useQuery({
    queryKey: ["employee-types"],
    queryFn: EmployeeTypesService.getAll,
  });

  const precios = data ?? [];

  const updateLocal = (
    precioId: number,
    field: keyof PrecioComedor,
    value: any,
  ) => {
    queryClient.setQueryData<PrecioComedor[]>(["precios-comedor"], (old = []) =>
      old.map((item) =>
        item.PRECIOID === precioId ? { ...item, [field]: value } : item,
      ),
    );
  };

  const save = async (row: PrecioComedor) => {
    if (!canEditPrices) {
      showError("No tienes permiso para editar precios comedor");
      return;
    }

    try {
      setSavingId(row.PRECIOID);

      await updatePrecioComedor(row.PRECIOID, {
        PRECIO_NORMAL: Number(row.PRECIO_NORMAL),
        PRECIO_X10: Number(row.PRECIO_X10),
        PRECIO_X20: Number(row.PRECIO_X20),
        ACTIVO: Number(row.ACTIVO),
      });

      await queryClient.invalidateQueries({ queryKey: ["precios-comedor"] });
      showSuccess("Precio actualizado correctamente");
    } catch (error: any) {
      showError(error?.message || "No se pudo actualizar el precio");
    } finally {
      setSavingId(null);
    }
  };

  const handleCreate = async () => {
    if (!canCreatePrices) {
      showError("No tienes permiso para crear precios comedor");
      return;
    }

    if (!newForm.TIPO_EMPLEADO_ID || !newForm.PRECIO_NORMAL) {
      showError("Selecciona un tipo de empleado y captura el precio normal");
      return;
    }

    try {
      setCreating(true);

      await createPrecioComedor({
        TIPO_EMPLEADO_ID: Number(newForm.TIPO_EMPLEADO_ID),
        PRECIO_NORMAL: Number(newForm.PRECIO_NORMAL),
        PRECIO_X10: Number(newForm.PRECIO_X10),
        PRECIO_X20: Number(newForm.PRECIO_X20),
      });

      await queryClient.invalidateQueries({ queryKey: ["precios-comedor"] });

      showSuccess("Precio creado correctamente");
      setOpenCreate(false);
      setNewForm({
        TIPO_EMPLEADO_ID: "",
        PRECIO_NORMAL: "",
        PRECIO_X10: "",
        PRECIO_X20: "",
      });
    } catch (error: any) {
      showError(error?.message || "No se pudo crear el precio");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (row: PrecioComedor) => {
    if (!canDeletePrices) {
      showError("No tienes permiso para eliminar precios comedor");
      return;
    }

    const result = await Swal.fire({
      title: "¿Eliminar precio?",
      text: `Se eliminará el precio de ${row.NOMBRE}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: IPL.orange,
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      backdrop: true,
    });

    if (!result.isConfirmed) return;

    try {
      setSavingId(row.PRECIOID);

      await deletePrecioComedor(row.PRECIOID);

      await queryClient.invalidateQueries({
        queryKey: ["precios-comedor"],
      });

      showSuccess("Precio eliminado correctamente");
    } catch (error: any) {
      showError(error?.message || "No se pudo eliminar el precio");
    } finally {
      setSavingId(null);
    }
  };

  if (isLoading) {
    return <LoaderOverlay label="Cargando precios comedor..." />;
  }

  return (
    <Box sx={{ width: "100%" }}>
      {isFetching && <LoaderOverlay label="Actualizando precios..." />}

      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "flex-start" }}
        spacing={2}
        sx={{ mb: 2 }}
      >
        <PageHeader
          title="Precios comedor"
          subtitle="Administra precios por tipo de empleado y promociones temporales."
        />

        <Button
          variant="contained"
          disabled={!canCreatePrices}
          onClick={() => setOpenCreate(true)}
          sx={{
            fontWeight: 800,
            whiteSpace: "nowrap",
          }}
        >
          Nuevo precio
        </Button>
      </Stack>

      {!canEditPrices && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 3,
            bgcolor: "#fff3cd",
            border: "1px solid #ffe69c",
          }}
        >
          <Typography fontWeight={800} color="#664d03">
            Solo tienes permisos de visualización. Los campos están bloqueados.
          </Typography>
        </Paper>
      )}

      <Grid container spacing={2}>
        {precios.map((row) => {
          return (
            <Grid key={row.PRECIOID} size={{ xs: 12, md: 6, xl: 4 }}>
              <Card
                variant="outlined"
                sx={{
                  height: "100%",
                  borderColor: IPL.border,
                  borderRadius: 3,
                  bgcolor: "background.paper",
                }}
              >
                <CardContent>
                  <Stack spacing={2}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 1,
                        flexWrap: "wrap",
                      }}
                    >
                      <Box>
                        <Typography fontWeight={900} fontSize="1.05rem">
                          {row.NOMBRE}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Tipo empleado ID: {row.TIPO_EMPLEADO_ID}
                        </Typography>
                      </Box>
                    </Box>

                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          label="Precio normal"
                          type="number"
                          value={row.PRECIO_NORMAL}
                          disabled={!canEditPrices}
                          onChange={(e) =>
                            updateLocal(
                              row.PRECIOID,
                              "PRECIO_NORMAL",
                              e.target.value,
                            )
                          }
                          fullWidth
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          label="Precio x10"
                          type="number"
                          value={row.PRECIO_X10 ?? ""}
                          disabled={!canEditPrices}
                          onChange={(e) =>
                            updateLocal(
                              row.PRECIOID,
                              "PRECIO_X10",
                              e.target.value,
                            )
                          }
                          fullWidth
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          label="Precio x20"
                          type="number"
                          value={row.PRECIO_X20 ?? ""}
                          disabled={!canEditPrices}
                          onChange={(e) =>
                            updateLocal(
                              row.PRECIOID,
                              "PRECIO_X20",
                              e.target.value,
                            )
                          }
                          fullWidth
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          select
                          label="Activo"
                          value={row.ACTIVO}
                          disabled={!canEditPrices}
                          onChange={(e) =>
                            updateLocal(
                              row.PRECIOID,
                              "ACTIVO",
                              Number(e.target.value),
                            )
                          }
                          fullWidth
                        >
                          <MenuItem value={0}>No</MenuItem>
                          <MenuItem value={1}>Sí</MenuItem>
                        </TextField>
                      </Grid>
                    </Grid>

                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      sx={{ mt: 1 }}
                    >
                      <Button
                        variant="contained"
                        disabled={savingId === row.PRECIOID || !canEditPrices}
                        onClick={() => save(row)}
                        fullWidth
                        sx={{
                          py: 1.2,
                          fontWeight: 800,
                        }}
                      >
                        {savingId === row.PRECIOID ? "Guardando..." : "Guardar"}
                      </Button>

                      <Button
                        variant="outlined"
                        color="error"
                        disabled={savingId === row.PRECIOID || !canDeletePrices}
                        onClick={() => handleDelete(row)}
                        fullWidth
                        sx={{
                          py: 1.2,
                          fontWeight: 800,
                        }}
                      >
                        Eliminar
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Dialog
        open={openCreate}
        onClose={() => !creating && setOpenCreate(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle fontWeight={900}>Nuevo precio comedor</DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Tipo de empleado"
              value={newForm.TIPO_EMPLEADO_ID}
              onChange={(e) =>
                setNewForm((prev) => ({
                  ...prev,
                  TIPO_EMPLEADO_ID: e.target.value,
                }))
              }
              fullWidth
            >
              {employeeTypes.map((type: any) => (
                <MenuItem
                  key={type.TIPO_EMPLEADO_ID}
                  value={type.TIPO_EMPLEADO_ID}
                >
                  {type.NOMBRE}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Precio normal"
              type="number"
              value={newForm.PRECIO_NORMAL}
              onChange={(e) =>
                setNewForm((prev) => ({
                  ...prev,
                  PRECIO_NORMAL: e.target.value,
                }))
              }
              fullWidth
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setOpenCreate(false)}
            disabled={creating}
            color="inherit"
          >
            Cancelar
          </Button>

          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={creating || !canCreatePrices}
          >
            {creating ? "Guardando..." : "Crear precio"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
