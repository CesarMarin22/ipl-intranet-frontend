import {
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  FormHelperText,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import PageHeader from "../../../shared/components/PageHeader";
import LoaderOverlay from "../../../shared/components/LoaderOverlay";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createUser,
  getUserById,
  getUsers,
  updateUser,
  type UserPayload,
} from "../../../services/users";
import {
  getCatalogProfiles,
  getCatalogDepartments,
  getCatalogPartners,
  getCatalogEmployeeTypes,
} from "../../../services/catalog";
import { getSucursales } from "../../../services/sucursales";
import { useAppMutation } from "../../../shared/hooks/useAppMutation";
import { showWarning } from "../../../shared/utils/swal";

type FormState = {
  NOMBRE: string;
  USUARIO: string;
  PWD: string;
  EMAIL: string;
  PERFILID: string;
  DEPAID: string;
  SOCIOID: string;
  JEFEID: string;
  SUCURSAL: string;
  ACTIVO: string;
  NUMERO_EMPLEADO: string;
  TIPO_EMPLEADO: string;
  TIPO_EMPLEADO_ID: string;
};

const initialState: FormState = {
  NOMBRE: "",
  USUARIO: "",
  PWD: "",
  EMAIL: "",
  PERFILID: "",
  DEPAID: "",
  SOCIOID: "",
  JEFEID: "",
  SUCURSAL: "",
  ACTIVO: "1",
  NUMERO_EMPLEADO: "",
  TIPO_EMPLEADO: "",
  TIPO_EMPLEADO_ID: "",
};

export default function UserFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = useMemo(() => Boolean(id), [id]);

  const [form, setForm] = useState<FormState>(initialState);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [employeeTypes, setEmployeeTypes] = useState<any[]>([]);
  const [bosses, setBosses] = useState<any[]>([]);
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const saveMutation = useAppMutation(
    async (payload: UserPayload) => {
      if (isEdit && id) return updateUser(Number(id), payload);
      return createUser(payload);
    },
    {
      invalidateKeys: [["users"]],
      successMessage: isEdit
        ? "Usuario actualizado correctamente"
        : "Usuario creado correctamente",
      onSuccess: () => navigate("/users"),
    },
  );

  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);

        const [
          profilesData,
          departmentsData,
          partnersData,
          employeeTypesData,
          usersData,
          sucursalesData,
        ] = await Promise.all([
          getCatalogProfiles(),
          getCatalogDepartments(),
          getCatalogPartners(),
          getCatalogEmployeeTypes(),
          getUsers(),
          getSucursales(),
        ]);

        // Estos 4 ya vienen del catálogo abierto, filtrados a ACTIVO=1
        // desde el servidor (por eso ya no se filtran aquí).
        setProfiles(profilesData || []);
        setDepartments(departmentsData || []);
        setPartners(partnersData || []);
        setEmployeeTypes(employeeTypesData || []);
        setBosses((usersData || []).filter((x) => x.ACTIVO === 1));
        setSucursales((sucursalesData || []).filter((x) => x.ACTIVO === 1));

        if (id) {
          const user = await getUserById(Number(id));

          setForm({
            NOMBRE: user.NOMBRE ?? "",
            USUARIO: user.USUARIO ?? "",
            PWD: user.PWD ?? "",
            EMAIL: user.EMAIL ?? "",
            PERFILID: user.PERFILID ? String(user.PERFILID) : "",
            DEPAID: user.DEPAID ? String(user.DEPAID) : "",
            SOCIOID: user.SOCIOID ? String(user.SOCIOID) : "",
            JEFEID: user.JEFEID ? String(user.JEFEID) : "",
            SUCURSAL: user.SUCURSAL ?? "",
            ACTIVO: String(user.ACTIVO ?? 1),
            NUMERO_EMPLEADO: user.NUMERO_EMPLEADO ?? "",
            TIPO_EMPLEADO: user.TIPO_EMPLEADO ?? "",
            TIPO_EMPLEADO_ID: user.TIPO_EMPLEADO_ID
              ? String(user.TIPO_EMPLEADO_ID)
              : "",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [id]);

  const handleChange = (e: any) => {
    const name = e.target.name as string;
    const value = String(e.target.value ?? "");

    if (name === "TIPO_EMPLEADO_ID") {
      const selected = employeeTypes.find(
        (item) => String(item.TIPO_EMPLEADO_ID) === value,
      );

      setForm((prev) => ({
        ...prev,
        TIPO_EMPLEADO_ID: value,
        TIPO_EMPLEADO: selected?.CLAVE ?? "",
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validate = () => {
    const errors: Partial<Record<keyof FormState, string>> = {};

    if (!form.NOMBRE.trim()) errors.NOMBRE = "El nombre es obligatorio";
    if (!form.USUARIO.trim()) errors.USUARIO = "El usuario es obligatorio";
    if (!form.PWD.trim()) errors.PWD = "La contraseña es obligatoria";
    if (form.EMAIL.trim() && !/^\S+@\S+\.\S+$/.test(form.EMAIL.trim())) {
      errors.EMAIL = "El correo no tiene un formato válido";
    }
    if (!form.PERFILID) errors.PERFILID = "Debes seleccionar un perfil";
    if (!form.DEPAID) errors.DEPAID = "Debes seleccionar un departamento";
    if (!form.SOCIOID) errors.SOCIOID = "Debes seleccionar un socio";
    if (!form.SUCURSAL) errors.SUCURSAL = "Debes seleccionar una sucursal";
    if (!form.NUMERO_EMPLEADO.trim()) {
      errors.NUMERO_EMPLEADO = "El número de empleado es obligatorio";
    }
    if (!form.TIPO_EMPLEADO_ID) {
      errors.TIPO_EMPLEADO_ID = "Debes seleccionar un tipo de empleado";
    }

    return errors;
  };

  const errors = validate();
  const isFormValid = Object.keys(errors).length === 0;

  const fieldError = (name: keyof FormState) =>
    submitted && Boolean(errors[name]);
  const helperText = (name: keyof FormState) =>
    submitted ? errors[name] || " " : " ";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      await showWarning("Completa los campos obligatorios antes de guardar");
      return;
    }

    saveMutation.mutate({
      NOMBRE: form.NOMBRE.trim(),
      USUARIO: form.USUARIO.trim(),
      PWD: form.PWD.trim(),
      EMAIL: form.EMAIL.trim() || null,
      PERFILID: Number(form.PERFILID),
      DEPAID: form.DEPAID ? Number(form.DEPAID) : null,
      SOCIOID: form.SOCIOID ? Number(form.SOCIOID) : null,
      JEFEID: form.JEFEID ? Number(form.JEFEID) : null,
      SUCURSAL: form.SUCURSAL || null,
      ACTIVO: Number(form.ACTIVO),
      NUMERO_EMPLEADO: form.NUMERO_EMPLEADO.trim() || null,
      TIPO_EMPLEADO: form.TIPO_EMPLEADO.trim() || null,
      TIPO_EMPLEADO_ID: form.TIPO_EMPLEADO_ID
        ? Number(form.TIPO_EMPLEADO_ID)
        : null,
    });
  };

  if (loading) return <LoaderOverlay label="Cargando formulario..." />;

  return (
    <Box>
      <PageHeader
        title={isEdit ? "Editar usuario" : "Crear usuario"}
        subtitle="Completa la información base del usuario."
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
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Nombre"
                name="NOMBRE"
                value={form.NOMBRE}
                onChange={handleChange}
                required
                error={fieldError("NOMBRE")}
                helperText={helperText("NOMBRE")}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Usuario"
                name="USUARIO"
                value={form.USUARIO}
                onChange={handleChange}
                required
                error={fieldError("USUARIO")}
                helperText={helperText("USUARIO")}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Contraseña"
                name="PWD"
                type={showPassword ? "text" : "password"}
                value={form.PWD}
                onChange={handleChange}
                required
                error={fieldError("PWD")}
                helperText={helperText("PWD")}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip
                          title={
                            showPassword
                              ? "Ocultar contraseña"
                              : "Ver contraseña"
                          }
                        >
                          <IconButton
                            onClick={() => setShowPassword((prev) => !prev)}
                            edge="end"
                          >
                            {showPassword ? (
                              <VisibilityOffIcon />
                            ) : (
                              <VisibilityIcon />
                            )}
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Correo electrónico"
                name="EMAIL"
                type="email"
                placeholder="usuario@interpricelogistica.com"
                value={form.EMAIL}
                onChange={handleChange}
                error={fieldError("EMAIL")}
                helperText={
                  submitted && errors.EMAIL
                    ? errors.EMAIL
                    : "Se usa para enviarle recordatorios del SGC (documentos por vencer)."
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Perfil</InputLabel>
                <Select
                  name="PERFILID"
                  value={form.PERFILID}
                  label="Perfil"
                  onChange={handleChange}
                >
                  <MenuItem value="">Seleccione</MenuItem>
                  {profiles.map((item) => (
                    <MenuItem key={item.PERFILID} value={String(item.PERFILID)}>
                      {item.NOMBRE}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>{helperText("PERFILID")}</FormHelperText>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Departamento</InputLabel>
                <Select
                  name="DEPAID"
                  value={form.DEPAID}
                  label="Departamento"
                  onChange={handleChange}
                >
                  <MenuItem value="">Seleccione</MenuItem>
                  {departments.map((item) => (
                    <MenuItem key={item.DEPAID} value={String(item.DEPAID)}>
                      {item.NOMBRE}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>{helperText("DEPAID")}</FormHelperText>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Socio</InputLabel>
                <Select
                  name="SOCIOID"
                  value={form.SOCIOID}
                  label="Socio"
                  onChange={handleChange}
                >
                  <MenuItem value="">Seleccione</MenuItem>
                  {partners.map((item) => (
                    <MenuItem key={item.SOCIOID} value={String(item.SOCIOID)}>
                      {item.NOMBRE}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>{helperText("SOCIOID")}</FormHelperText>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Jefe</InputLabel>
                <Select
                  name="JEFEID"
                  value={form.JEFEID}
                  label="Jefe"
                  onChange={handleChange}
                >
                  <MenuItem value="">Seleccione</MenuItem>
                  {bosses
                    .filter(
                      (item) => String(item.USUARIOID) !== String(id ?? ""),
                    )
                    .map((item) => (
                      <MenuItem
                        key={item.USUARIOID}
                        value={String(item.USUARIOID)}
                      >
                        {item.NOMBRE} ({item.USUARIO})
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Sucursal</InputLabel>
                <Select
                  name="SUCURSAL"
                  value={form.SUCURSAL}
                  label="Sucursal"
                  onChange={handleChange}
                >
                  <MenuItem value="">Seleccione</MenuItem>
                  {sucursales.map((item) => (
                    <MenuItem
                      key={item.SUCURSALID}
                      value={String(item.SUCURSALID)}
                    >
                      {item.CLAVE} - {item.NOMBRE}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>{helperText("SUCURSAL")}</FormHelperText>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Número de empleado"
                name="NUMERO_EMPLEADO"
                value={form.NUMERO_EMPLEADO}
                onChange={handleChange}
                required
                error={fieldError("NUMERO_EMPLEADO")}
                helperText={helperText("NUMERO_EMPLEADO")}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Tipo de empleado</InputLabel>
                <Select
                  name="TIPO_EMPLEADO_ID"
                  value={form.TIPO_EMPLEADO_ID}
                  label="Tipo de empleado"
                  onChange={handleChange}
                >
                  <MenuItem value="">Seleccione</MenuItem>
                  {employeeTypes.map((item) => (
                    <MenuItem
                      key={item.TIPO_EMPLEADO_ID}
                      value={String(item.TIPO_EMPLEADO_ID)}
                    >
                      {item.NOMBRE}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>{helperText("TIPO_EMPLEADO_ID")}</FormHelperText>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
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
              type="submit"
              variant="contained"
              disabled={saveMutation.isPending || (submitted && !isFormValid)}
            >
              {saveMutation.isPending
                ? isEdit
                  ? "Actualizando..."
                  : "Guardando..."
                : isEdit
                  ? "Actualizar usuario"
                  : "Guardar usuario"}
            </Button>

            <Button variant="outlined" onClick={() => navigate("/users")}>
              Cancelar
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}