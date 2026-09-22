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
import { EmployeeTypesService } from "../../../services/employeeTypes";
import { useAppMutation } from "../../../shared/hooks/useAppMutation";
import { showWarning } from "../../../shared/utils/swal";

type FormState = {
  CLAVE: string;
  NOMBRE: string;
  ACTIVO: string;
};

const initialState: FormState = {
  CLAVE: "",
  NOMBRE: "",
  ACTIVO: "1",
};

export default function EmployeeTypeFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = useMemo(() => Boolean(id), [id]);

  const [form, setForm] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(Boolean(id));
  const [submitted, setSubmitted] = useState(false);

  const saveMutation = useAppMutation(
    async (payload: {
      CLAVE: string | null;
      NOMBRE: string;
      ACTIVO: number;
    }) => {
      if (isEdit && id) return EmployeeTypesService.update(Number(id), payload);
      return EmployeeTypesService.create(payload);
    },
    {
      invalidateKeys: [["employee-types"]],
      successMessage: isEdit
        ? "Tipo de empleado actualizado correctamente"
        : "Tipo de empleado creado correctamente",
      onSuccess: () => navigate("/employee-types"),
    }
  );

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await EmployeeTypesService.getById(Number(id));

        setForm({
          CLAVE: data.CLAVE ?? "",
          NOMBRE: data.NOMBRE ?? "",
          ACTIVO: String(data.ACTIVO ?? 1),
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const normalizeClave = (value: string) => {
    return value.trim().toUpperCase().replace(/\s+/g, "_");
  };

  const handleChange = (e: any) => {
    const name = e.target.name as keyof FormState;
    const value = String(e.target.value ?? "");

    setForm((prev) => ({
      ...prev,
      [name]: name === "CLAVE" ? normalizeClave(value) : value,
    }));
  };

  const validate = () => {
    const errors: Partial<Record<keyof FormState, string>> = {};

    if (!form.CLAVE.trim()) {
      errors.CLAVE = "La clave es obligatoria";
    } else if (!/^[A-Z0-9_]+$/.test(form.CLAVE.trim())) {
      errors.CLAVE = "La clave solo puede tener letras, números y guion bajo";
    }

    if (!form.NOMBRE.trim()) {
      errors.NOMBRE = "El nombre del tipo de empleado es obligatorio";
    }

    if (!["0", "1"].includes(String(form.ACTIVO))) {
      errors.ACTIVO = "Debes seleccionar si el tipo está activo";
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

    saveMutation.mutate({
      CLAVE: normalizeClave(form.CLAVE),
      NOMBRE: form.NOMBRE.trim(),
      ACTIVO: Number(form.ACTIVO),
    });
  };

  if (loading) return <LoaderOverlay label="Cargando tipo de empleado..." />;

  return (
    <Box>
      <PageHeader
        title={isEdit ? "Editar tipo de empleado" : "Crear tipo de empleado"}
        subtitle="Captura la información del tipo de empleado."
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
              label="Clave"
              name="CLAVE"
              value={form.CLAVE}
              onChange={handleChange}
              error={fieldError("CLAVE")}
              helperText={
                submitted
                  ? errors.CLAVE || " "
                  : "Ejemplo: PLANTA, OFICINA, EXTERNO"
              }
            />
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
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

          <Grid size={{ xs: 12, md: 3 }}>
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
                ? "Actualizar tipo"
                : "Guardar tipo"}
          </Button>

          <Button
            variant="outlined"
            onClick={() => navigate("/employee-types")}
          >
            Cancelar
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}