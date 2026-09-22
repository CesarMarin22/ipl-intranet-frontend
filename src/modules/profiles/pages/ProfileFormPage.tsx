import {
  Box,
  Button,
  Grid,
  MenuItem,
  Paper,
  TextField,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import {
  createProfile,
  getProfileById,
  updateProfile,
} from "../../../services/profiles";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../../shared/components/PageHeader";
import LoaderOverlay from "../../../shared/components/LoaderOverlay";
import { useAppMutation } from "../../../shared/hooks/useAppMutation";
import { showWarning } from "../../../shared/utils/swal";

type FormState = {
  NOMBRE: string;
  DESCRIPCION: string;
  ACTIVO: number;
};

const initialState: FormState = {
  NOMBRE: "",
  DESCRIPCION: "",
  ACTIVO: 1,
};

export default function ProfileFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = useMemo(() => Boolean(id), [id]);

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<FormState>(initialState);

  const saveMutation = useAppMutation(
    async (payload: FormState) => {
      if (isEdit && id) return updateProfile(Number(id), payload);
      return createProfile(payload);
    },
    {
      invalidateKeys: [["profiles"]],
      successMessage: isEdit
        ? "Perfil actualizado correctamente"
        : "Perfil creado correctamente",
      onSuccess: () => navigate("/profiles"),
    }
  );

  useEffect(() => {
    const load = async () => {
      if (!id) return;

      setLoading(true);

      try {
        const data = await getProfileById(Number(id));

        setForm({
          NOMBRE: data.NOMBRE ?? "",
          DESCRIPCION: data.DESCRIPCION ?? "",
          ACTIVO: Number(data.ACTIVO ?? 1),
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name as keyof FormState;
    const value = e.target.value;

    setForm((prev) => ({
      ...prev,
      [name]: name === "ACTIVO" ? Number(value) : value,
    }));
  };

  const validate = () => {
    const errors: Partial<Record<keyof FormState, string>> = {};

    if (!form.NOMBRE.trim()) {
      errors.NOMBRE = "El nombre del perfil es obligatorio";
    }

    if (![0, 1].includes(Number(form.ACTIVO))) {
      errors.ACTIVO = "Debes seleccionar si el perfil está activo";
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
      DESCRIPCION: form.DESCRIPCION.trim(),
      ACTIVO: Number(form.ACTIVO),
    });
  };

  if (loading) return <LoaderOverlay label="Cargando perfil..." />;

  return (
    <Box sx={{ width: "100%" }}>
      <PageHeader
        title={isEdit ? "Editar perfil" : "Crear perfil"}
        subtitle="Captura la información del perfil."
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

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              required
              select
              label="Activo"
              name="ACTIVO"
              value={form.ACTIVO}
              onChange={handleChange}
              error={fieldError("ACTIVO")}
              helperText={helperText("ACTIVO")}
            >
              <MenuItem value={1}>Sí</MenuItem>
              <MenuItem value={0}>No</MenuItem>
            </TextField>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Descripción"
              name="DESCRIPCION"
              value={form.DESCRIPCION}
              onChange={handleChange}
              helperText=" "
            />
          </Grid>
        </Grid>

        <Box
          sx={{
            mt: 3,
            display: "flex",
            gap: 1.2,
            flexWrap: "wrap",
            justifyContent: { xs: "stretch", sm: "flex-start" },
            "& .MuiButton-root": {
              width: { xs: "100%", sm: "auto" },
            },
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
                ? "Actualizar perfil"
                : "Guardar perfil"}
          </Button>

          <Button variant="outlined" onClick={() => navigate("/profiles")}>
            Cancelar
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}