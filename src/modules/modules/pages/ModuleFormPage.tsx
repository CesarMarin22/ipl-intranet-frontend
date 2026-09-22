import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import PageHeader from "../../../shared/components/PageHeader";
import LoaderOverlay from "../../../shared/components/LoaderOverlay";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ModulesService,
  type ModuleAction,
} from "../../../services/modules";
import { useAppMutation } from "../../../shared/hooks/useAppMutation";
import { showWarning } from "../../../shared/utils/swal";

type FormState = {
  NOMBRE: string;
  CLAVE: string;
  PADRE_ID: string;
  RUTA: string;
  ORDEN: string;
  ACTIVO: string;
};

const initialState: FormState = {
  NOMBRE: "",
  CLAVE: "",
  PADRE_ID: "",
  RUTA: "",
  ORDEN: "",
  ACTIVO: "1",
};

export default function ModuleFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = useMemo(() => Boolean(id), [id]);

  const [form, setForm] = useState<FormState>(initialState);
  const [parents, setParents] = useState<any[]>([]);
  const [moduleActions, setModuleActions] = useState<ModuleAction[]>([]);
  const [loading, setLoading] = useState(Boolean(id));
  const [submitted, setSubmitted] = useState(false);

  const normalizeClave = (value: string) =>
    value.trim().toUpperCase().replace(/\s+/g, "_");

  const validate = () => {
    const errors: Partial<Record<keyof FormState, string>> = {};

    if (!form.NOMBRE.trim()) {
      errors.NOMBRE = "El nombre es obligatorio";
    }

    if (!form.CLAVE.trim()) {
      errors.CLAVE = "La clave es obligatoria";
    } else if (!/^[A-Z0-9_]+$/.test(form.CLAVE.trim())) {
      errors.CLAVE =
        "La clave solo puede tener letras, números y guion bajo";
    }

    if (form.RUTA.trim() && !form.RUTA.trim().startsWith("/")) {
      errors.RUTA = "La ruta debe iniciar con /";
    }

    if (form.ORDEN.trim()) {
      const orden = Number(form.ORDEN);

      if (Number.isNaN(orden) || orden < 0) {
        errors.ORDEN =
          "El orden debe ser un número mayor o igual a 0";
      }
    }

    return errors;
  };

  const errors = validate();

  const isFormValid = Object.keys(errors).length === 0;

  const fieldError = (name: keyof FormState) =>
    submitted && Boolean(errors[name]);

  const helperText = (name: keyof FormState) =>
    submitted ? errors[name] || " " : " ";

  const saveMutation = useAppMutation(
    async (payload: {
      NOMBRE: string;
      CLAVE: string;
      PADRE_ID: number | null;
      RUTA: string | null;
      ORDEN: number | null;
      ACTIVO: number;
    }) => {
      if (isEdit && id) {
        await ModulesService.update(Number(id), payload);

        await ModulesService.updateActions(
          Number(id),
          moduleActions
        );

        return;
      }

      return ModulesService.create(payload);
    },
    {
      invalidateKeys: [["modules"], ["my-permissions"]],
      successMessage: isEdit
        ? "Módulo actualizado correctamente"
        : "Módulo creado correctamente",
      onSuccess: () => navigate("/modules"),
    }
  );

  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);

        const tree = await ModulesService.getTree();
        setParents(tree);

        if (id) {
          const [data, actions] = await Promise.all([
            ModulesService.getById(Number(id)),
            ModulesService.getActions(Number(id)),
          ]);

          setForm({
            NOMBRE: data.NOMBRE ?? "",
            CLAVE: data.CLAVE ?? "",
            PADRE_ID: data.PADRE_ID
              ? String(data.PADRE_ID)
              : "",
            RUTA: data.RUTA ?? "",
            ORDEN:
              data.ORDEN != null
                ? String(data.ORDEN)
                : "",
            ACTIVO: String(data.ACTIVO ?? 1),
          });

          setModuleActions(actions);
        }
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [id]);

  const handleChange = (e: any) => {
    const name = e.target.name as keyof FormState;
    const value = String(e.target.value ?? "");

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "CLAVE"
          ? normalizeClave(value)
          : value,
    }));
  };

  const toggleAction = (accionId: number) => {
    setModuleActions((prev) =>
      prev.map((action) =>
        action.ACCIONID === accionId
          ? {
              ...action,
              ASIGNADA:
                action.ASIGNADA === 1 ? 0 : 1,
            }
          : action
      )
    );
  };

  const save = async () => {
    setSubmitted(true);

    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      await showWarning(
        "Completa los campos obligatorios antes de guardar"
      );
      return;
    }

    saveMutation.mutate({
      NOMBRE: form.NOMBRE.trim(),
      CLAVE: normalizeClave(form.CLAVE),
      PADRE_ID: form.PADRE_ID
        ? Number(form.PADRE_ID)
        : null,
      RUTA: form.RUTA.trim() || null,
      ORDEN: form.ORDEN
        ? Number(form.ORDEN)
        : null,
      ACTIVO: Number(form.ACTIVO),
    });
  };

  if (loading)
    return <LoaderOverlay label="Cargando módulo..." />;

  return (
    <Box>
      <PageHeader
        title={
          isEdit
            ? "Editar módulo"
            : "Crear módulo"
        }
        subtitle="Captura la información del módulo y configura sus acciones permitidas."
      />

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5, md: 3 },
          bgcolor: "background.paper",
          borderRadius: 3,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              required
              label="Nombre"
              name="NOMBRE"
              value={form.NOMBRE}
              onChange={handleChange}
              error={fieldError("NOMBRE")}
              helperText={helperText("NOMBRE")}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              required
              label="Clave"
              name="CLAVE"
              value={form.CLAVE}
              onChange={handleChange}
              error={fieldError("CLAVE")}
              helperText={
                submitted
                  ? errors.CLAVE || " "
                  : "Ejemplo: COMEDOR, USUARIOS, REPORTES_COMEDOR"
              }
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Padre</InputLabel>

              <Select
                name="PADRE_ID"
                value={form.PADRE_ID}
                label="Padre"
                onChange={handleChange}
              >
                <MenuItem value="">
                  Sin padre
                </MenuItem>

                {parents
                  .filter(
                    (item) =>
                      String(item.MODULOID) !==
                      String(id ?? "")
                  )
                  .map((item) => (
                    <MenuItem
                      key={item.MODULOID}
                      value={String(item.MODULOID)}
                    >
                      {item.NOMBRE}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Ruta"
              name="RUTA"
              value={form.RUTA}
              onChange={handleChange}
              error={fieldError("RUTA")}
              helperText={
                submitted
                  ? errors.RUTA || " "
                  : "Opcional. Ejemplo: /users"
              }
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Orden"
              name="ORDEN"
              value={form.ORDEN}
              onChange={handleChange}
              type="number"
              error={fieldError("ORDEN")}
              helperText={
                submitted
                  ? errors.ORDEN || " "
                  : "Ejemplo: 1000"
              }
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Activo</InputLabel>

              <Select
                name="ACTIVO"
                value={form.ACTIVO}
                label="Activo"
                onChange={handleChange}
              >
                <MenuItem value="1">Sí</MenuItem>
                <MenuItem value="0">No</MenuItem>
              </Select>

              <FormHelperText>
                {" "}
              </FormHelperText>
            </FormControl>
          </Grid>
        </Grid>

        {isEdit && (
          <Paper
            variant="outlined"
            sx={{
              mt: 3,
              p: 2.5,
              borderRadius: 3,
              bgcolor: "background.default",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
                gap: 2,
                flexWrap: "wrap",
                mb: 1.5,
              }}
            >
              <Box>
                <Typography fontWeight={900}>
                  Acciones permitidas para este
                  módulo
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Selecciona qué acciones
                  aparecerán como checks en
                  permisos.
                </Typography>
              </Box>

              <Chip
                label={`${
                  moduleActions.filter(
                    (a) => a.ASIGNADA === 1
                  ).length
                } seleccionada(s)`}
                color="warning"
                variant="outlined"
              />
            </Box>

            <Grid container spacing={1}>
              {moduleActions.map((action) => (
                <Grid
                  key={action.ACCIONID}
                  size={{
                    xs: 12,
                    sm: 6,
                    md: 3,
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={
                          action.ASIGNADA === 1
                        }
                        onChange={() =>
                          toggleAction(
                            action.ACCIONID
                          )
                        }
                      />
                    }
                    label={action.NOMBRE}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}

        {!isEdit && (
          <Paper
            variant="outlined"
            sx={{
              mt: 3,
              p: 2.5,
              borderRadius: 3,
              bgcolor: "background.default",
            }}
          >
            <Typography fontWeight={900}>
              Acciones permitidas para este
              módulo
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Primero guarda el módulo.
              Después podrás editarlo y
              seleccionar sus acciones.
            </Typography>
          </Paper>
        )}

        <Box
          sx={{
            mt: 3,
            display: "flex",
            gap: 1.2,
            flexWrap: "wrap",
            "& .MuiButton-root": {
              width: {
                xs: "100%",
                sm: "auto",
              },
            },
          }}
        >
          <Button
            variant="contained"
            onClick={save}
            disabled={
              saveMutation.isPending ||
              (submitted && !isFormValid)
            }
          >
            {saveMutation.isPending
              ? isEdit
                ? "Actualizando..."
                : "Guardando..."
              : isEdit
                ? "Actualizar módulo"
                : "Guardar módulo"}
          </Button>

          <Button
            variant="outlined"
            onClick={() =>
              navigate("/modules")
            }
          >
            Cancelar
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}