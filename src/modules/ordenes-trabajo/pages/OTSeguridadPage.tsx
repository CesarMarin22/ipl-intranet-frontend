import {
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
} from "../../../shared/utils/swal";

import {
  OrdenesTrabajoService,
  type ClienteSAP,
  type EmpleadoSAP,
  type EquipoSAP,
  type TipoProblemaSAP,
} from "../../../services/ordenesTrabajo";

import LoaderOverlay from "../../../shared/components/LoaderOverlay";

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

const SEVERIDADES = [
  { value: "Menor", label: "Menor" },
  { value: "Moderada", label: "Moderada" },
  { value: "Critica", label: "Crítica" },
  { value: "Fatal", label: "Fatal" },
];

const CLASIFICACION_SUCESO = [
  { value: "24", label: "Seguridad" },
  { value: "28", label: "Operación" },
  { value: "27", label: "Vehículos" },
];

interface ImageFile {
  id: string;
  file: File;
  preview: string;
}

type FormState = {
  folio: string;
  fechaInicio: string;
  horaInicioTrabajo: string;
  codigoCliente: string;
  nombreCliente: string;
  noSerie: string;
  itemCode: string;
  horometro: string;
  descripcionFalla: string;
  trabajoRealizado: string;
  fechaTermino: string;
  horaSalida: string;
  serie: string;

  realizoTrabajo: string;
  realizoTrabajoEmployeeID: string;

  tipoProblema: string;
  severidad: string;
  areaTrabajo: string;
  accionesSituacion: string;
  planAccion: string;
  leccionesAprendidas: string;
  posibleCausa: string;

  personaReporta: string;
  vistoBuenoCliente: string;

  // Nuevos campos de Flash Report
  clasificacionSuceso: string;
  costoAproximado: string;
  personaInvolucrada: string;
  nombreSupervisor: string;
};

const initialState: FormState = {
  folio: "",
  fechaInicio: "",
  horaInicioTrabajo: "",
  codigoCliente: "",
  nombreCliente: "",
  noSerie: "",
  itemCode: "",
  horometro: "",
  descripcionFalla: "",
  trabajoRealizado: "",
  fechaTermino: "",
  horaSalida: "",
  serie: "",

  realizoTrabajo: "",
  realizoTrabajoEmployeeID: "",

  tipoProblema: "",
  severidad: "",
  areaTrabajo: "",
  accionesSituacion: "",
  planAccion: "",
  leccionesAprendidas: "",
  posibleCausa: "",

  personaReporta: "",
  vistoBuenoCliente: "",

  // Nuevos campos de Flash Report
  clasificacionSuceso: "",
  costoAproximado: "",
  personaInvolucrada: "",
  nombreSupervisor: "",
};

export default function OTSeguridadPage() {
  const [form, setForm] = useState<FormState>(initialState);

  const [clientes, setClientes] = useState<ClienteSAP[]>([]);
  const [equipos, setEquipos] = useState<EquipoSAP[]>([]);
  const [empleadosRealizo, setEmpleadosRealizo] = useState<EmpleadoSAP[]>([]);
  const [tiposProblema, setTiposProblema] = useState<TipoProblemaSAP[]>([]);

  const [showClientes, setShowClientes] = useState(false);
  const [showEquipos, setShowEquipos] = useState(false);
  const [showRealizo, setShowRealizo] = useState(false);

  const [loadingClientes, setLoadingClientes] = useState(false);
  const [loadingEquipos, setLoadingEquipos] = useState(false);
  const [loadingRealizo, setLoadingRealizo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Image upload states
  const [images, setImages] = useState<ImageFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [openImageDialog, setOpenImageDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clienteSearch = useDebouncedValue(form.codigoCliente, 500);
  const equipoSearch = useDebouncedValue(form.noSerie, 500);
  const realizoSearch = useDebouncedValue(form.realizoTrabajo, 500);

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

  // Cargar tipos de problema al montar
  useEffect(() => {
    const loadData = async () => {
      try {
        const tipos = await OrdenesTrabajoService.tiposProblema();
        setTiposProblema(tipos);
      } catch (error) {
        console.error("Error cargando tipos de problema:", error);
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

  // Búsqueda de equipos
  useEffect(() => {
    if (!form.codigoCliente || !equipoSearch.trim()) {
      setEquipos([]);
      return;
    }

    const searchEquipos = async () => {
      setLoadingEquipos(true);
      try {
        const results = await OrdenesTrabajoService.buscarEquiposCliente(
          form.codigoCliente,
          equipoSearch
        );
        setEquipos(results);
      } catch (error) {
        console.error("Error buscando equipos:", error);
      } finally {
        setLoadingEquipos(false);
      }
    };

    searchEquipos();
  }, [form.codigoCliente, equipoSearch]);

  // Búsqueda de técnicos
  useEffect(() => {
    if (!realizoSearch.trim()) {
      setEmpleadosRealizo([]);
      return;
    }

    const searchEmpleados = async () => {
      setLoadingRealizo(true);
      try {
        const results = await OrdenesTrabajoService.buscarEmpleados(
          realizoSearch,
          false
        );
        setEmpleadosRealizo(results);
      } catch (error) {
        console.error("Error buscando técnicos:", error);
      } finally {
        setLoadingRealizo(false);
      }
    };

    searchEmpleados();
  }, [realizoSearch]);

  const validateForm = (): boolean => {
    const required = [
      "codigoCliente",
      "fechaInicio",
      "horaInicioTrabajo",
      "descripcionFalla",
      "trabajoRealizado",
      "severidad",
      "areaTrabajo",
    ];

    for (const field of required) {
      if (!form[field as keyof FormState]?.trim()) {
        showError("Validación", `${field} es obligatorio`);
        return false;
      }
    }

    if (!validateDateTimeRange(form.fechaInicio, form.horaInicioTrabajo,
        form.fechaTermino, form.horaSalida)) {
      showError("Validación", "Las fechas/horas no son válidas");
      return false;
    }

    // Validar "Posible Causa" si está presente
    if (form.posibleCausa && form.posibleCausa.length > 254) {
      showError("Validación", "La Posible Causa no puede exceder 254 caracteres");
      return false;
    }

    return true;
  };

  const handleGuardar = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      const payload = {
        ...form,
        fechaInicio: formatDateForSAP(form.fechaInicio),
        fechaTermino: formatDateForSAP(form.fechaTermino),
        realizoTrabajo: form.realizoTrabajoEmployeeID,
        "data-tipo": "seguridad",
        U_Severidad: form.severidad,
        U_ClasificacionSuceso: form.clasificacionSuceso,
        U_CostoAproximado: form.costoAproximado,
        U_PersonaInvolucrada: form.personaInvolucrada,
        U_NombreSupervisor: form.nombreSupervisor,
        U_PosibleCausa: form.posibleCausa,
        imagenes: images.length,
      };

      await OrdenesTrabajoService.guardarCsv(payload);

      showSuccess(
        "Guardado exitoso",
        "El Flash Report se guardó correctamente."
      );

      setForm(initialState);
      setImages([]);
    } catch (error: any) {
      showError("Error", error.message || "No se pudo guardar el Flash Report.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoaderOverlay label="Cargando Flash Reports..." />;
  }

  const showCALNote = form.severidad === "Critica" || form.severidad === "Fatal";

  return (
    <Box sx={{ "@media print": { "& .no-print": { display: "none" } } }}>
      <PageHeader title="Crear Flash Report (OT Seguridad)" />

      <Paper sx={{ p: 3, mt: 3, "@media print": { boxShadow: "none" } }}>
        <Box sx={{ display: "grid", gap: 2 }}>
          {/* Sucursal */}
          <TextField
            select
            label="Sucursal"
            value={form.serie}
            onChange={(e) => handleChange("serie", e.target.value)}
            fullWidth
          >
            {SUCURSALES.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                {s.label}
              </MenuItem>
            ))}
          </TextField>

          {/* Cliente */}
          <TextField
            label="Código Cliente"
            value={form.codigoCliente}
            onChange={(e) => handleChange("codigoCliente", e.target.value.toUpperCase())}
            fullWidth
            required
            InputProps={{
              endAdornment: loadingClientes && <CircularProgress size={20} />,
            }}
            onFocus={() => setShowClientes(true)}
            onBlur={() => setTimeout(() => setShowClientes(false), 200)}
          />
          {showClientes && clientes.length > 0 && (
            <Box sx={{ mt: -1.5, p: 1, border: "1px solid #ccc", maxHeight: 200, overflowY: "auto", bgcolor: "white", zIndex: 10, position: "relative" }}>
              {clientes.map((c) => (
                <Box
                  key={c.CardCode}
                  onClick={() => {
                    handleChange("codigoCliente", c.CardCode);
                    handleChange("nombreCliente", c.CardName);
                    setShowClientes(false);
                  }}
                  sx={{ p: 1, cursor: "pointer", "&:hover": { bgcolor: "#f0f0f0" } }}
                >
                  {c.CardName}
                </Box>
              ))}
            </Box>
          )}

          {/* Equipo */}
          <TextField
            label="No. Serie / Equipo"
            value={form.noSerie}
            onChange={(e) => handleChange("noSerie", e.target.value.toUpperCase())}
            fullWidth
            disabled={!form.codigoCliente}
            InputProps={{
              endAdornment: loadingEquipos && <CircularProgress size={20} />,
            }}
          />

          {/* Fechas */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Fecha Inicio"
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
                label="Hora Inicio"
                type="time"
                value={form.horaInicioTrabajo}
                onChange={(e) => handleChange("horaInicioTrabajo", e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                required
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Fecha Término"
                type="date"
                value={form.fechaTermino}
                onChange={(e) => handleChange("fechaTermino", e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Hora Salida"
                type="time"
                value={form.horaSalida}
                onChange={(e) => handleChange("horaSalida", e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
          </Grid>

          {/* Descripción de falla */}
          <TextField
            label="Descripción de la Falla"
            value={form.descripcionFalla}
            onChange={(e) => handleChange("descripcionFalla", e.target.value)}
            multiline
            rows={3}
            fullWidth
            required
          />

          {/* Trabajo realizado */}
          <TextField
            label="Trabajo Realizado"
            value={form.trabajoRealizado}
            onChange={(e) => handleChange("trabajoRealizado", e.target.value)}
            multiline
            rows={3}
            fullWidth
            required
          />

          {/* Posible Causa */}
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

          {/* Técnico */}
          <TextField
            label="Técnico que Realizó"
            value={form.realizoTrabajo}
            onChange={(e) => handleChange("realizoTrabajo", e.target.value.toUpperCase())}
            fullWidth
            InputProps={{
              endAdornment: loadingRealizo && <CircularProgress size={20} />,
            }}
            onFocus={() => setShowRealizo(true)}
            onBlur={() => setTimeout(() => setShowRealizo(false), 200)}
          />

          {/* Severidad */}
          <TextField
            select
            label="Severidad"
            value={form.severidad}
            onChange={(e) => handleChange("severidad", e.target.value)}
            fullWidth
            required
          >
            {SEVERIDADES.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                {s.label}
              </MenuItem>
            ))}
          </TextField>

          {/* Nota de Acción Correctiva CAL */}
          {showCALNote && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Nota Importante:</strong> Debido al nivel de severidad se deberá llenar el formato <strong>CAL-FMT-15</strong>
              </Typography>
            </Alert>
          )}

          {/* Clasificación del Suceso */}
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

          {/* Costo Aproximado */}
          <TextField
            label="Costo Aproximado ($)"
            type="number"
            value={form.costoAproximado}
            onChange={(e) => handleChange("costoAproximado", e.target.value)}
            fullWidth
            inputProps={{ min: "0", step: "0.01" }}
          />

          {/* Persona Involucrada */}
          <TextField
            label="Persona Involucrada"
            value={form.personaInvolucrada}
            onChange={(e) => handleChange("personaInvolucrada", e.target.value)}
            fullWidth
          />

          {/* Nombre del Supervisor */}
          <TextField
            label="Nombre del Supervisor"
            value={form.nombreSupervisor}
            onChange={(e) => handleChange("nombreSupervisor", e.target.value)}
            fullWidth
          />

          {/* Área de trabajo */}
          <TextField
            label="Área de Trabajo"
            value={form.areaTrabajo}
            onChange={(e) => handleChange("areaTrabajo", e.target.value)}
            multiline
            rows={2}
            fullWidth
            required
          />

          {/* Acciones para la situación */}
          <TextField
            label="Acciones para la Situación"
            value={form.accionesSituacion}
            onChange={(e) => handleChange("accionesSituacion", e.target.value)}
            multiline
            rows={2}
            fullWidth
          />

          {/* Plan de acción */}
          <TextField
            label="Plan de Acción"
            value={form.planAccion}
            onChange={(e) => handleChange("planAccion", e.target.value)}
            multiline
            rows={2}
            fullWidth
          />

          {/* Lecciones aprendidas */}
          <TextField
            label="Lecciones Aprendidas"
            value={form.leccionesAprendidas}
            onChange={(e) => handleChange("leccionesAprendidas", e.target.value)}
            multiline
            rows={2}
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
