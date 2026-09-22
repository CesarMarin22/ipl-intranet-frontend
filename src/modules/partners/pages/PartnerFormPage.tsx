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
import { PartnersService } from "../../../services/partners";
import { useAppMutation } from "../../../shared/hooks/useAppMutation";
import { showWarning } from "../../../shared/utils/swal";

type FormState = {
  NOMBRE: string;
  RFC: string;
  ACTIVO: string;
};

const initialState: FormState = {
  NOMBRE: "",
  RFC: "",
  ACTIVO: "1",
};

export default function PartnerFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = useMemo(() => Boolean(id), [id]);

  const [form, setForm] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(Boolean(id));
  const [submitted, setSubmitted] = useState(false);

  const saveMutation = useAppMutation(
    async (payload: { NOMBRE: string; RFC: string | null; ACTIVO: number }) => {
      if (isEdit && id) return PartnersService.update(Number(id), payload);
      return PartnersService.create(payload);
    },
    {
      invalidateKeys: [["partners"]],
      successMessage: isEdit
        ? "Socio actualizado correctamente"
        : "Socio creado correctamente",
      onSuccess: () => navigate("/partners"),
    }
  );

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await PartnersService.getById(Number(id));

        setForm({
          NOMBRE: data.NOMBRE ?? "",
          RFC: data.RFC ?? "",
          ACTIVO: String(data.ACTIVO ?? 1),
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const normalizeRFC = (value: string) => {
    return value.replace(/\s+/g, "").toUpperCase();
  };

  const handleChange = (e: any) => {
    const name = e.target.name as keyof FormState;
    const value = String(e.target.value ?? "");

    setForm((prev) => ({
      ...prev,
      [name]: name === "RFC" ? normalizeRFC(value) : value,
    }));
  };

  const validate = () => {
    const errors: Partial<Record<keyof FormState, string>> = {};

    if (!form.NOMBRE.trim()) {
      errors.NOMBRE = "El nombre del socio es obligatorio";
    }

    if (form.RFC.trim()) {
      const rfc = normalizeRFC(form.RFC);
      const validRfc = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(rfc);

      if (!validRfc) {
        errors.RFC = "El RFC no tiene un formato válido";
      }
    }

    if (!["0", "1"].includes(String(form.ACTIVO))) {
      errors.ACTIVO = "Debes seleccionar si el socio está activo";
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
      NOMBRE: form.NOMBRE.trim(),
      RFC: form.RFC.trim() ? normalizeRFC(form.RFC) : null,
      ACTIVO: Number(form.ACTIVO),
    });
  };

  if (loading) return <LoaderOverlay label="Cargando socio..." />;

  return (
    <Box>
      <PageHeader
        title={isEdit ? "Editar socio" : "Crear socio"}
        subtitle="Captura la información del socio."
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
          <Grid size={{ xs: 12, md: 6 }}>
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
            <TextField
              fullWidth
              label="RFC"
              name="RFC"
              value={form.RFC}
              onChange={handleChange}
              error={fieldError("RFC")}
              helperText={
                submitted
                  ? errors.RFC || "Opcional"
                  : "Opcional. Ejemplo: XAXX010101000"
              }
              inputProps={{ maxLength: 13 }}
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
                ? "Actualizar socio"
                : "Guardar socio"}
          </Button>

          <Button variant="outlined" onClick={() => navigate("/partners")}>
            Cancelar
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}