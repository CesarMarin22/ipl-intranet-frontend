import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

import PageHeader from "../../../shared/components/PageHeader";

import {
  showError,
  showSuccess,
  confirmDelete,
} from "../../../shared/utils/swal";

import { usePermissions } from "../../../shared/hooks/usePermissions";

import {
  getPaquetesComedor,
  createPaqueteComedor,
  updatePaqueteComedor,
  deletePaqueteComedor,
  type PaqueteComedor,
} from "../../../services/comedorPaquetes";

export default function PaquetesComedorPage() {
  const isMobile = useMediaQuery("(max-width:900px)");

  const { canCreate, canEdit, canDelete } = usePermissions();

  const canCreatePaquetes = canCreate("PAQUETES_COMEDOR");
  const canEditPaquetes = canEdit("PAQUETES_COMEDOR");
  const canDeletePaquetes = canDelete("PAQUETES_COMEDOR");

  const [loading, setLoading] = useState(false);

  const [paquetes, setPaquetes] = useState<PaqueteComedor[]>([]);

  const [open, setOpen] = useState(false);

  const [editing, setEditing] = useState<PaqueteComedor | null>(null);

  const [form, setForm] = useState({
    CANTIDAD_COMIDAS: "",
    NOMBRE: "",
    PORCENTAJE_DESCUENTO: "",
  });

  const loadPaquetes = async () => {
    try {
      setLoading(true);

      const data = await getPaquetesComedor();

      setPaquetes(data ?? []);
    } catch {
      showError("No se pudieron cargar los paquetes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaquetes();
  }, []);

  const resetForm = () => {
    setForm({
      CANTIDAD_COMIDAS: "",
      NOMBRE: "",
      PORCENTAJE_DESCUENTO: "",
    });

    setEditing(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setOpen(true);
  };

  const handleEdit = (row: PaqueteComedor) => {
    setEditing(row);

    setForm({
      CANTIDAD_COMIDAS: String(row.CANTIDAD_COMIDAS),
      NOMBRE: row.NOMBRE,
      PORCENTAJE_DESCUENTO: String(row.PORCENTAJE_DESCUENTO),
    });

    setOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!form.CANTIDAD_COMIDAS) {
        showError("Captura la cantidad de comidas");
        return;
      }

      const payload = {
        CANTIDAD_COMIDAS: Number(form.CANTIDAD_COMIDAS),
        NOMBRE: form.NOMBRE.trim(),
        PORCENTAJE_DESCUENTO: Number(
          form.PORCENTAJE_DESCUENTO || 0,
        ),
      };

      if (editing) {
        await updatePaqueteComedor(editing.PAQUETEID, {
          ...payload,
          ACTIVO: 1,
        });

        showSuccess("Paquete actualizado");
      } else {
        await createPaqueteComedor(payload);

        showSuccess("Paquete creado");
      }

      setOpen(false);

      resetForm();

      loadPaquetes();
    } catch (err: any) {
      showError(
        err?.response?.data?.message ||
          "No se pudo guardar el paquete",
      );
    }
  };

  const handleDelete = async (row: PaqueteComedor) => {
    const confirm = await confirmDelete(
      `¿Deseas eliminar el paquete ${row.NOMBRE}?`,
      "Eliminar paquete",
    );

    if (!confirm) return;

    try {
      await deletePaqueteComedor(row.PAQUETEID);

      showSuccess("Paquete eliminado");

      loadPaquetes();
    } catch (err: any) {
      showError(
        err?.response?.data?.message ||
          "No se pudo eliminar el paquete",
      );
    }
  };

  const paquetesOrdenados = useMemo(() => {
    return [...paquetes].sort(
      (a, b) =>
        a.CANTIDAD_COMIDAS - b.CANTIDAD_COMIDAS,
    );
  }, [paquetes]);

  return (
    <Box>
      <PageHeader
        title="Paquetes comedor"
        subtitle="Administra paquetes y descuentos."
      />

      <Stack spacing={3}>
        <Paper
          sx={{
            p: { xs: 2.5, md: 4 },
            borderRadius: 4,
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            spacing={2}
            mb={3}
          >
            <Typography fontWeight={900} fontSize={20}>
              Paquetes registrados
            </Typography>

            {canCreatePaquetes && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenCreate}
              >
                Nuevo paquete
              </Button>
            )}
          </Stack>

          {loading ? (
            <Typography>Cargando...</Typography>
          ) : paquetesOrdenados.length === 0 ? (
            <Typography color="text.secondary">
              No existen paquetes registrados.
            </Typography>
          ) : (
            <Stack spacing={2}>
              {paquetesOrdenados.map((row) => (
                <Paper
                  key={row.PAQUETEID}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 3,
                  }}
                >
                  <Stack
                    direction={{
                      xs: "column",
                      md: "row",
                    }}
                    justifyContent="space-between"
                    alignItems={{
                      xs: "flex-start",
                      md: "center",
                    }}
                    spacing={2}
                  >
                    <Stack spacing={0.5}>
                      <Typography fontWeight={900}>
                        {row.NOMBRE}
                      </Typography>

                      <Typography color="text.secondary">
                        Cantidad:{" "}
                        {row.CANTIDAD_COMIDAS} comida(s)
                      </Typography>

                      <Typography color="text.secondary">
                        Descuento:{" "}
                        {row.PORCENTAJE_DESCUENTO}%
                      </Typography>
                    </Stack>

                    <Stack
                      direction="row"
                      spacing={1}
                      width={{
                        xs: "100%",
                        md: "auto",
                      }}
                    >
                      {canEditPaquetes && (
                        <Button
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => handleEdit(row)}
                          fullWidth={isMobile}
                        >
                          Editar
                        </Button>
                      )}

                      {canDeletePaquetes && (
                        <Button
                          color="error"
                          variant="outlined"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDelete(row)}
                          fullWidth={isMobile}
                        >
                          Eliminar
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Paper>
      </Stack>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editing
            ? "Editar paquete"
            : "Nuevo paquete"}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Cantidad comidas"
              type="number"
              value={form.CANTIDAD_COMIDAS}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  CANTIDAD_COMIDAS: e.target.value,
                }))
              }
              fullWidth
            />

            <TextField
              label="Nombre"
              value={form.NOMBRE}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  NOMBRE: e.target.value,
                }))
              }
              fullWidth
            />

            <TextField
              label="% descuento"
              type="number"
              value={form.PORCENTAJE_DESCUENTO}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  PORCENTAJE_DESCUENTO:
                    e.target.value,
                }))
              }
              fullWidth
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>
            Cancelar
          </Button>

          <Button
            variant="contained"
            onClick={handleSave}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}