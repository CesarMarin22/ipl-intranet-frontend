import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
} from "@mui/material";
import PageHeader from "../../../shared/components/PageHeader";
import LoaderOverlay from "../../../shared/components/LoaderOverlay";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DepartmentsService } from "../../../services/departments";
import { useAppMutation } from "../../../shared/hooks/useAppMutation";
import { showWarning } from "../../../shared/utils/swal";

type FormState = {
  NOMBRE: string;
  ACTIVO: string;
};

const initialState: FormState = {
  NOMBRE: "",
  ACTIVO: "1",
};

export default function DepartmentFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = useMemo(() => Boolean(id), [id]);

  const [form, setForm] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(Boolean(id));
  const [submitted, setSubmitted] = useState(false);

  const saveMutation = useAppMutation(
    async (payload: { NOMBRE: string; ACTIVO: number }) => {
      if (isEdit && id) return DepartmentsService.update(Number(id), payload);
      return DepartmentsService.create(payload);
    },
    {
      invalidateKeys: [["departments"]],
      successMessage: isEdit
        ? "Departamento actualizado correctamente"
        : "Departamento creado correctamente",
      onSuccess: () => navigate("/departments"),
    }
  );

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await DepartmentsService.getById(Number(id));

        setForm({
          NOMBRE: data.NOMBRE ?? "",
          ACTIVO: String(data.ACTIVO ?? 1),
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (e: any) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: String(e.target.value ?? ""),
    }));
  };

  const validate = () => {
    const errors: Partial<Record<keyof FormState, string>> = {};

    if (!form.NOMBRE.trim()) {
      errors.NOMBRE = "El nombre del departamento es obligatorio";
    }

    if (!["0", "1"].includes(String(form.ACTIVO))) {
      errors.ACTIVO = "Debes seleccionar si el departamento está activo";
    }

    return errors;
  };

  const errors = validate();
  const isFormValid = Object.keys(errors).length === 0;

  const fieldError = (name: keyof FormState) =>
    submitted && Boolean(errors[name]);

  const helperText = (name: keyof FormState) =>
    submitted ? errors[name] || " " : " ";

  const save = async () => {
    setSubmitted(true);

    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      await showWarning("Completa los campos obligatorios antes de guardar");
      return;
    }

    try {
      await saveMutation.mutateAsync({
        NOMBRE: form.NOMBRE.trim(),
        ACTIVO: Number(form.ACTIVO),
      });
    } catch (error) {
      console.error("Error al guardar departamento:", error);
    }
  };

  if (loading) return <LoaderOverlay label="Cargando departamento..." />;

  return (
    <Box>
      <PageHeader
        title={isEdit ? "Editar departamento" : "Crear departamento"}
        subtitle="Captura la información del departamento."
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
          <Grid size={{ xs: 12, md: 8 }}>
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
            <FormControl fullWidth required error={fieldError("ACTIVO")}>
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
              <FormHelperText>{helperText("ACTIVO")}</FormHelperText>
            </FormControl>
          </Grid>
        </Grid>

        <Box
          sx={{
            mt: 3,
            display: "flex",
            gap: 1.2,
            flexWrap: "wrap",
            "& .MuiButton-root": { width: { xs: "100%", sm: "auto" } },
          }}
        >
          <Button
            variant="contained"
            onClick={save}
            disabled={saveMutation.isPending || (submitted && !isFormValid)}
          >
            {saveMutation.isPending
              ? isEdit
                ? "Actualizando..."
                : "Guardando..."
              : isEdit
                ? "Actualizar departamento"
                : "Guardar departamento"}
          </Button>

          <Button variant="outlined" onClick={() => navigate("/departments")}>
            Cancelar
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}