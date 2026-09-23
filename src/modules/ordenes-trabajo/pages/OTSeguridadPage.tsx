import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  TextField,
  Typography,
  Alert,
  Card,
  CardMedia,
  CardActions,
  Chip,
} from "@mui/material";
import { useEffect, useState, useCallback, useRef } from "react";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import PrintIcon from "@mui/icons-material/Print";
import CloseIcon from "@mui/icons-material/Close";
import ImageIcon from "@mui/icons-material/Image";

import PageHeader from "../../../shared/components/PageHeader";
import { useDebouncedValue } from "../../../shared/hooks/useDebouncedValue";
import {
  formatDateForSAP,
  validateDateTimeRange,
} from "../../../shared/utils/dateUtils";
import {
  showError,
  showSuccess,
  showWarning,
} from "../../../shared/utils/swal";

import {
  OrdenesTrabajoService,
  type ClienteSAP,
  type TipoProblemaSAP,
} from "../../../services/ordenesTrabajo";

import LoaderOverlay from "../../../shared/components/LoaderOverlay";
import { me, type MeResponse } from "../../../services/auth";

const SUCURSALES = [
  { value: "87", label: "AGS" },
  { value: "82", label: "CLY" },
  { value: "88", label: "GDL" },
  { value: "89", label: "IRA" },
  { value: "83", label: "MEX" },
  { value: "85", label: "MTY" },
  { value: "86", label: "QRO" },
  { value: "90", label: "SLP" },
  { value: "84", label: "TOL" },
  { value: "374", label: "PUE" },
];

// SEVERIDADES removed - will be loaded dynamically
const CLASIFICACION_SUCESO = [
  { value: "24", label: "Seguridad" },
  { value: "28", label: "Operación" },
  { value: "27", label: "Vehículos" },
];

type Severidad = {
  value: string;
  text: string;
  color: string;
  textColor: string;
};

const LINK_CAL_SEGURIDAD =
  "https://docs.google.com/spreadsheets/d/1G-sMfF6a0tbbH6w_vLKifT-8VvbagRJo/edit?gid=439766604#gid=439766604";
const LINK_CAL_OPERACION_VEHICULOS =
  "https://docs.google.com/spreadsheets/d/1PU67h9Cfam-eAnKH0oGtcXuUhZeWKZ_S/edit?gid=752703734#gid=752703734";

function getCalFmt15Link(tipo: string, nivel: string): string | null {
  if (tipo === "24" && ["Critica", "Fatal"].includes(nivel)) return LINK_CAL_SEGURIDAD;
  if (tipo === "28" && ["Alto", "CriticaO"].includes(nivel)) return LINK_CAL_OPERACION_VEHICULOS;
  if (tipo === "27" && ["ModeradaV", "CriticaV"].includes(nivel)) return LINK_CAL_OPERACION_VEHICULOS;
  return null;
}

interface ImageFile {
  id: string;
  file: File;
  preview: string;
}

type FormState = {
  serie: string;
  clasificacionSuceso: string;
  tipoProblema: string;
  fechaInicio: string;
  horaInicioTrabajo: string;
  severidad: string;
  codigoCliente: string;
  nombreCliente: string;
  areaTrabajo: string;
  descripcionSuceso: string;
  posibleCausa: string;
  accionesSituacion: string;
  planAccion: string;
  leccionesAprendidas: string;
  costoAproximado: string;
  personaInvolucrada: string;
  nombreSupervisor: string;
};

// In OTA every visible Flash Report field is mandatory; labels match the form
const CAMPOS_REQUERIDOS: Record<keyof FormState, string> = {
  serie: "Sucursal",
  clasificacionSuceso: "Clasificación del Suceso",
  tipoProblema: "Relación del Suceso",
  fechaInicio: "Fecha",
  horaInicioTrabajo: "Hora",
  severidad: "Severidad",
  codigoCliente: "Lugar del Suceso (Cliente)",
  nombreCliente: "Nombre del Lugar del Suceso",
  areaTrabajo: "Área del Suceso",
  descripcionSuceso: "Descripción del Suceso",
  posibleCausa: "Posible Causa",
  accionesSituacion: "Acciones realizadas para atender la situación",
  planAccion: "Plan de acción",
  leccionesAprendidas: "Lecciones aprendidas",
  costoAproximado: "Costo aproximado",
  personaInvolucrada: "Persona Involucrada",
  nombreSupervisor: "Nombre del Supervisor",
};

const initialState: FormState = {
  serie: "",
  clasificacionSuceso: "24",
  tipoProblema: "",
  fechaInicio: "",
  horaInicioTrabajo: "",
  severidad: "",
  codigoCliente: "",
  nombreCliente: "",
  areaTrabajo: "",
  descripcionSuceso: "",
  posibleCausa: "",
  accionesSituacion: "",
  planAccion: "",
  leccionesAprendidas: "",
  costoAproximado: "",
  personaInvolucrada: "",
  nombreSupervisor: "",
};

export default function OTSeguridadPage() {
  const [form, setForm] = useState<FormState>(initialState);
  const [user, setUser] = useState<MeResponse | null>(null);

  const [clientes, setClientes] = useState<ClienteSAP[]>([]);
  const [tiposProblema, setTiposProblema] = useState<TipoProblemaSAP[]>([]);
  const [severidades, setSeveridades] = useState<Severidad[]>([]);

  // Autocomplete input value (separate from form.codigoCliente)
  const [clienteInputValue, setClienteInputValue] = useState("");

  const [showClientes, setShowClientes] = useState(false);

  const [loadingClientes, setLoadingClientes] = useState(false);
  const [savingStep, setSavingStep] = useState<string | null>(null);
  const saving = savingStep !== null;
  const [loading, setLoading] = useState(true);

  // Image upload states
  const [images, setImages] = useState<ImageFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [openImageDialog, setOpenImageDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clienteSearch = useDebouncedValue(clienteInputValue, 500);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Handle image drop
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const processFiles = (fileList: File[]) => {
    const validImages = fileList.filter((file) =>
      file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024 // 5MB limit
    );

    if (validImages.length !== fileList.length) {
      showError(
        "Validación",
        "Solo se aceptan imágenes menores a 5MB"
      );
    }

    validImages.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        setImages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random()}`,
            file,
            preview,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    if (selectedImage === id) {
      setSelectedImage(null);
      setOpenImageDialog(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Cargar datos al montar
  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await me();
        setUser(userData);

        let tipos = await OrdenesTrabajoService.tiposProblema();

        // FALLBACK: If empty, use hardcoded values matching OTA
        if (!tipos || tipos.length === 0) {
          tipos = [
            { ProblemTypeID: 30, Name: "SEGURIDAD" },
            { ProblemTypeID: 202, Name: "OPERACIÓN" },
            { ProblemTypeID: 203, Name: "VEHÍCULOS" },
          ];
        }

        // FILTER BY SEGURIDAD IDS (from OTA) - IDs permitidos para Flash Reports
        const idsSeguridad = ["30", "202", "203"];
        const tiposFiltrados = (tipos || []).filter((t: any) =>
          idsSeguridad.includes(String(t.ProblemTypeID))
        );
        console.log("Tipos cargados:", tipos);
        console.log("Tipos filtrados:", tiposFiltrados);
        setTiposProblema(tiposFiltrados);

        // Si el usuario tiene sucursal asignada, establecerla
        if (userData.authenticated && userData.sucursal) {
          handleChange("serie", String(userData.sucursal));
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Búsqueda de clientes
  useEffect(() => {
    if (!clienteSearch.trim()) {
      setClientes([]);
      return;
    }

    const searchClientes = async () => {
      setLoadingClientes(true);
      try {
        const results = await OrdenesTrabajoService.buscarClientes(
          clienteSearch
        );
        setClientes(results);
      } catch (error) {
        console.error("Error buscando clientes:", error);
      } finally {
        setLoadingClientes(false);
      }
    };

    searchClientes();
  }, [clienteSearch]);

  // Cargar severidades según la clasificación del suceso
  useEffect(() => {
    const loadSeveridades = async () => {
      try {
        const callType = form.clasificacionSuceso || "24"; // Default: Seguridad
        const opciones = await OrdenesTrabajoService.obtenerSeveridades(callType);
        setSeveridades(opciones);
        // Reset severidad cuando cambia clasificación
        handleChange("severidad", "");
      } catch (error) {
        console.error("Error cargando severidades:", error);
      }
    };

    loadSeveridades();
  }, [form.clasificacionSuceso]);

  const validateForm = (): boolean => {
    if (images.length === 0) {
      showWarning("Debes adjuntar al menos una foto del suceso antes de guardar.", "Falta adjuntar fotos");
      return false;
    }

    const faltantes = (Object.keys(CAMPOS_REQUERIDOS) as (keyof FormState)[])
      .filter((campo) => !String(form[campo] ?? "").trim())
      .map((campo) => CAMPOS_REQUERIDOS[campo]);

    if (faltantes.length > 0) {
      showWarning(
        `Por favor, completa los siguientes campos: ${faltantes.join(", ")}`,
        "Campos incompletos en Flash Report"
      );
      return false;
    }

    if (form.posibleCausa.length > 254) {
      showWarning("La Posible Causa no puede exceder 254 caracteres.", "Validación");
      return false;
    }

    return true;
  };

  const handleGuardar = async () => {
    if (!validateForm()) return;

    // Generate flashRefId like OTA does (timestamp + 2 random digits)
    const rand2 = Math.floor(Math.random() * 90 + 10);
    const flashRefId = String(Date.now()) + rand2;

    // Photos go to Drive first; the CSV is only created if the upload succeeds
    try {
      setSavingStep(`Subiendo ${images.length} foto(s) a Google Drive...`);
      const formDataImagenes = new FormData();
      formDataImagenes.append("flashRefId", flashRefId);
      images.forEach((img) => formDataImagenes.append("imagenes", img.file));
      await OrdenesTrabajoService.subirImagenesFlash(flashRefId, formDataImagenes);
    } catch (error: any) {
      console.error("Error al subir imágenes a Drive:", error);
      setSavingStep(null);
      showError(
        `No se pudieron subir las fotos a Google Drive, el Flash Report NO se guardó. Intenta de nuevo.\n${error.message || ""}`,
        "Error al subir fotos"
      );
      return;
    }

    try {
      setSavingStep("Guardando Flash Report...");

      // Build payload EXACTLY as OTA sends it
      const payload = {
        // Form fields - using exact names from OTA
        serie: form.serie,
        tipoOrden: form.clasificacionSuceso,
        tipoProblema: form.tipoProblema,
        fechaInicio: form.fechaInicio, // OTA sends as dd/mm
        horaInicioTrabajo: form.horaInicioTrabajo,
        U_Severidad: form.severidad,
        codigoCliente: form.codigoCliente,
        nombreCliente: form.nombreCliente,
        areaTrabajo: form.areaTrabajo,
        trabajoRealizado: form.descripcionSuceso,
        descripcionFalla: form.posibleCausa,
        accionesSituacion: form.accionesSituacion,
        planAccion: form.planAccion,
        leccionesAprendidas: form.leccionesAprendidas,
        costoAproximado: form.costoAproximado || "0",
        personaReporta: form.personaInvolucrada,
        vistoBuenoCliente: form.nombreSupervisor,
        // Meta fields
        "data-tipo": "seguridad",
        flashRefId: flashRefId,
        imagenes: images.length,
      };

      await OrdenesTrabajoService.guardarCsv(payload);

      setSavingStep(null);
      showSuccess("El Flash Report y sus fotos se guardaron correctamente.", "Guardado exitoso");
      setForm((prev) => ({ ...initialState, serie: prev.serie }));
      setClienteInputValue("");
      setImages([]);
    } catch (error: any) {
      setSavingStep(null);
      showError(
        `Las fotos ya se subieron, pero no se pudo guardar el Flash Report.\n${error.message || ""}`,
        "Error al guardar"
      );
    }
  };

  if (loading) {
    return <LoaderOverlay label="Cargando Flash Reports..." />;
  }

  const calLink = getCalFmt15Link(form.clasificacionSuceso || "24", form.severidad);

  return (
    <Box sx={{ "@media print": { "& .no-print": { display: "none" } } }}>
      {savingStep && <LoaderOverlay label={savingStep} />}
      <PageHeader title="Nuevo Flash Report" />

      <Paper sx={{ p: 3, mt: 3, "@media print": { boxShadow: "none" } }}>
        <Box sx={{ display: "grid", gap: 2 }}>
          {/* 1. Usuario que elaboró Flash Report (readonly) */}
          <TextField
            label="Usuario que elaboró Flash Report"
            value={user?.username || ""}
            fullWidth
            disabled
          />

          {/* 2. Sucursal */}
          <TextField
            select
            label="Sucursal"
            value={form.serie}
            onChange={(e) => handleChange("serie", e.target.value)}
            fullWidth
            disabled={user && ![1, 4].includes(user.perfil || 0)}
            helperText={user && ![1, 4].includes(user.perfil || 0) ? "Tu sucursal es asignada automáticamente" : ""}
          >
            {SUCURSALES.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                {s.label}
              </MenuItem>
            ))}
          </TextField>

          {/* 3. Clasificación del Suceso (BEFORE Severidad) */}
          <TextField
            select
            label="Clasificación del Suceso"
            value={form.clasificacionSuceso}
            onChange={(e) => handleChange("clasificacionSuceso", e.target.value)}
            fullWidth
          >
            {CLASIFICACION_SUCESO.map((c) => (
              <MenuItem key={c.value} value={c.value}>
                {c.label}
              </MenuItem>
            ))}
          </TextField>

          {/* 4. Relación del Suceso (Tipo de Problema) */}
          <TextField
            select
            label="Relación del Suceso"
            value={form.tipoProblema}
            onChange={(e) => handleChange("tipoProblema", e.target.value)}
            fullWidth
          >
            {tiposProblema.map((t) => (
              <MenuItem key={t.ProblemTypeID} value={t.ProblemTypeID}>
                {t.Name}
              </MenuItem>
            ))}
          </TextField>

          {/* 5 & 6. Fecha y Hora */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Fecha"
                type="date"
                value={form.fechaInicio}
                onChange={(e) => handleChange("fechaInicio", e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Hora"
                type="time"
                value={form.horaInicioTrabajo}
                onChange={(e) => handleChange("horaInicioTrabajo", e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                required
              />
            </Grid>
          </Grid>

          {/* 7. Severidad (AFTER Clasificación) */}
          <TextField
            select
            label="Severidad"
            value={form.severidad}
            onChange={(e) => handleChange("severidad", e.target.value)}
            fullWidth
            required
            disabled={severidades.length === 0}
          >
            {severidades.map((s: any) => (
              <MenuItem key={s.value} value={s.value} sx={{backgroundColor: s.color, color: s.textColor}}>
                {s.text}
              </MenuItem>
            ))}
          </TextField>

          {/* 8. Lugar del Suceso (Código Cliente) */}
          <Autocomplete
            options={clientes}
            getOptionLabel={(option) => `${option.CardCode} - ${option.CardName}`}
            inputValue={clienteInputValue}
            onInputChange={(_, value) => setClienteInputValue(value.toUpperCase())}
            onChange={(_, value) => {
              if (value) {
                handleChange("codigoCliente", value.CardCode);
                handleChange("nombreCliente", value.CardName);
                setClienteInputValue(""); // Clear input to prevent further searches
                setClientes([]); // Clear results after selection
              }
            }}
            loading={loadingClientes}
            fullWidth
            required
            renderInput={(params) => (
              <TextField
                {...params}
                label="Lugar del Suceso (Cliente)"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingClientes ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          {/* 9. Nombre del Lugar del Suceso */}
          <TextField
            label="Nombre del Lugar del Suceso"
            value={form.nombreCliente}
            fullWidth
            disabled
          />

          {/* 10. Área del Suceso */}
          <TextField
            label="Área del Suceso"
            value={form.areaTrabajo}
            onChange={(e) => handleChange("areaTrabajo", e.target.value)}
            multiline
            rows={2}
            fullWidth
            required
          />

          {/* Nota de Acción Correctiva CAL-FMT-15 */}
          {calLink && (
            <Alert severity="error">
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Debido al nivel de severidad se deberá de llenar el siguiente formato CAL-FMT-15 Acción Correctiva.{" "}
                <a href={calLink} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>
                  Da clic aquí para llenarlo
                </a>
              </Typography>
            </Alert>
          )}

          {/* 11. Descripción del Suceso */}
          <TextField
            label="Descripción del Suceso"
            value={form.descripcionSuceso}
            onChange={(e) => handleChange("descripcionSuceso", e.target.value)}
            multiline
            rows={3}
            fullWidth
            required
          />

          {/* 12. Posible Causa */}
          <TextField
            label="Posible Causa"
            value={form.posibleCausa}
            onChange={(e) => {
              if (e.target.value.length <= 254) {
                handleChange("posibleCausa", e.target.value);
              }
            }}
            multiline
            rows={2}
            fullWidth
            helperText={`${form.posibleCausa.length} / 254 caracteres`}
          />

          {/* 13. Acciones realizadas para atender la situación */}
          <TextField
            label="Acciones realizadas para atender la situación"
            value={form.accionesSituacion}
            onChange={(e) => handleChange("accionesSituacion", e.target.value)}
            multiline
            rows={2}
            fullWidth
          />

          {/* 14. Plan de acción */}
          <TextField
            label="Plan de acción"
            value={form.planAccion}
            onChange={(e) => handleChange("planAccion", e.target.value)}
            multiline
            rows={2}
            fullWidth
          />

          {/* 15. Lecciones aprendidas */}
          <TextField
            label="Lecciones aprendidas"
            value={form.leccionesAprendidas}
            onChange={(e) => handleChange("leccionesAprendidas", e.target.value)}
            multiline
            rows={2}
            fullWidth
          />

          {/* 16. Costo aproximado */}
          <TextField
            label="Costo aproximado"
            type="number"
            value={form.costoAproximado}
            onChange={(e) => handleChange("costoAproximado", e.target.value)}
            fullWidth
            inputProps={{ min: "0", step: "0.01" }}
          />

          {/* 17. Persona Involucrada */}
          <TextField
            label="Persona Involucrada"
            value={form.personaInvolucrada}
            onChange={(e) => handleChange("personaInvolucrada", e.target.value)}
            fullWidth
          />

          {/* 18. Nombre del Supervisor */}
          <TextField
            label="Nombre del Supervisor"
            value={form.nombreSupervisor}
            onChange={(e) => handleChange("nombreSupervisor", e.target.value)}
            fullWidth
          />

          {/* Upload de imágenes */}
          <Box className="no-print">
            <Typography variant="h6" sx={{ mb: 2, mt: 3 }}>
              Cargar Imágenes
            </Typography>
            <Box
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              sx={{
                p: 3,
                border: "2px dashed",
                borderColor: dragActive ? "primary.main" : "divider",
                borderRadius: 2,
                bgcolor: dragActive ? "action.hover" : "background.paper",
                cursor: "pointer",
                transition: "all 0.3s ease",
                textAlign: "center",
                "&:hover": {
                  borderColor: "primary.main",
                  bgcolor: "action.hover",
                },
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <CloudUploadIcon sx={{ fontSize: 48, color: "primary.main", mb: 1 }} />
              <Typography variant="body1" sx={{ mb: 1 }}>
                Arrastra imágenes aquí o haz clic para seleccionar
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Máximo 5MB por imagen. Formatos: JPG, PNG, GIF
              </Typography>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />
            </Box>

            {/* Vista previa de imágenes */}
            {images.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Imágenes cargadas ({images.length})
                </Typography>
                <Grid container spacing={2}>
                  {images.map((image) => (
                    <Grid item xs={12} sm={6} md={4} key={image.id}>
                      <Card>
                        <CardMedia
                          component="img"
                          height="200"
                          image={image.preview}
                          alt="preview"
                          sx={{ objectFit: "cover", cursor: "pointer" }}
                          onClick={() => {
                            setSelectedImage(image.preview);
                            setOpenImageDialog(true);
                          }}
                        />
                        <CardActions sx={{ justifyContent: "flex-end" }}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveImage(image.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Box>

          {/* Botones de acción */}
          <Box sx={{ display: "flex", gap: 2, mt: 4, justifyContent: "flex-end", "@media print": { display: "none" } }}>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              className="no-print"
            >
              Imprimir
            </Button>
            <Button
              variant="contained"
              onClick={handleGuardar}
              disabled={saving}
            >
              {saving ? "Guardando..." : "Guardar Flash Report"}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Dialog para ver imagen en grande */}
      <Dialog
        open={openImageDialog}
        onClose={() => setOpenImageDialog(false)}
        maxWidth="md"
        fullWidth
        className="no-print"
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          Vista Previa de Imagen
          <IconButton onClick={() => setOpenImageDialog(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedImage && (
            <Box
              component="img"
              src={selectedImage}
              alt="preview-large"
              sx={{ width: "100%", height: "auto", borderRadius: 1 }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
