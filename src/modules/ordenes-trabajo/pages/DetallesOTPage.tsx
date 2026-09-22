import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import PageHeader from "../../../shared/components/PageHeader";
import { showError, showSuccess } from "../../../shared/utils/swal";
import { OrdenesTrabajoService } from "../../../services/ordenesTrabajo";
import LoaderOverlay from "../../../shared/components/LoaderOverlay";

type OT = {
  DocNum: number;
  CustomerName: string;
  CustomerRefNo: string;
  ManufacturerSerialNum: string;
  Subject?: string;
  Description?: string;
  AssignedDate?: string;
  Series: number;
  U_Severidad?: string;
  SeveridadEtiqueta?: string;
  SeveridadColorFondo?: string;
  SeveridadColorTexto?: string;
  CallTypeName?: string;
  SucursalName?: string;
  ProblemTypeName?: string;
  RealizoTrabajoNombre?: string;
  Tecnico3Nombre?: string;
  Tecnico4Nombre?: string;
  U_Horometro?: string;
  U_HoraInicio?: string;
  U_HoraFin?: string;
  resolution?: string;
};

export default function DetallesOTPage() {
  const { docnum } = useParams<{ docnum: string }>();
  const navigate = useNavigate();

  const [ot, setOt] = useState<OT | null>(null);
  const [tipoVista, setTipoVista] = useState<"normal" | "audi" | "seguridad">(
    "normal"
  );
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    cargarDetalles();
  }, [docnum]);

  const cargarDetalles = async () => {
    setLoading(true);
    try {
      if (!docnum) return;

      const data = await OrdenesTrabajoService.verOT(docnum);
      setOt(data?.ot);
      setTipoVista(data?.tipo_vista || "normal");
    } catch (error: any) {
      showError("Error", error.message || "No se pudieron cargar los detalles");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadImage = async () => {
    if (!imageFile) {
      showError("Validación", "Selecciona una imagen");
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("imagenes", imageFile);
      formData.append("flashRefId", `${docnum}`);

      // Aquí irá la llamada al servicio cuando esté implementado
      // await OrdenesTrabajoService.subirImagenFlash(docnum, formData);

      showSuccess("Éxito", "Imagen subida correctamente");
      setImageFile(null);
      setOpenDialog(false);
    } catch (error: any) {
      showError("Error", error.message || "No se pudo subir la imagen");
    } finally {
      setUploadingImage(false);
    }
  };

  const renderInfoRow = (label: string, value: string | undefined) => (
    <Grid item xs={12} sm={6}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="textSecondary" display="block">
          {label}
        </Typography>
        <Typography variant="body2">{value || "N/A"}</Typography>
      </Box>
    </Grid>
  );

  if (loading) {
    return <LoaderOverlay label="Cargando detalles..." />;
  }

  if (!ot) {
    return (
      <Box>
        <PageHeader title="Detalles - Orden de Trabajo" />
        <Typography color="error" sx={{ mt: 2 }}>
          No se encontró la OT
        </Typography>
        <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Volver
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <PageHeader title={`Doc #${ot.DocNum}`} />
        <Button onClick={() => navigate(-1)}>Volver</Button>
      </Box>

      {/* Tipo de OT */}
      <Chip
        label={
          tipoVista === "seguridad"
            ? "Flash Report"
            : tipoVista === "audi"
              ? "OT Audi"
              : "OT Normal"
        }
        color={tipoVista === "seguridad" ? "error" : "primary"}
        sx={{ mb: 3 }}
      />

      {/* Información General */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Información General
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          {renderInfoRow("Cliente", ot.CustomerName)}
          {renderInfoRow("Folio", ot.CustomerRefNo)}
          {renderInfoRow("Serie del Equipo", ot.ManufacturerSerialNum)}
          {renderInfoRow("Sucursal", ot.SucursalName)}
          {renderInfoRow("Tipo de Orden", ot.CallTypeName)}
          {renderInfoRow("Tipo de Problema", ot.ProblemTypeName)}
          {renderInfoRow("Descripción", ot.Description)}
          {renderInfoRow("Asunto", ot.Subject)}
        </Grid>
      </Paper>

      {/* Información Técnica */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Información Técnica
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          {renderInfoRow("Técnico Principal", ot.RealizoTrabajoNombre)}
          {renderInfoRow("Técnico 3", ot.Tecnico3Nombre)}
          {renderInfoRow("Técnico 4", ot.Tecnico4Nombre)}
          {renderInfoRow("Horómetro", ot.U_Horometro)}
          {renderInfoRow("Hora Inicio", ot.U_HoraInicio)}
          {renderInfoRow("Hora Fin", ot.U_HoraFin)}
          {renderInfoRow("Trabajo Realizado", ot.resolution)}
        </Grid>
      </Paper>

      {/* Severidad (si es Flash Report) */}
      {tipoVista === "seguridad" && ot.U_Severidad && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Flash Report
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Box>
            <Typography variant="caption" color="textSecondary">
              Severidad
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Chip
                label={ot.SeveridadEtiqueta || ot.U_Severidad}
                sx={{
                  bgcolor: ot.SeveridadColorFondo || "#f0f0f0",
                  color: ot.SeveridadColorTexto || "#000",
                }}
              />
            </Box>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              onClick={() => navigate(`/ordenes-trabajo/seguridad/${docnum}/seguimiento`)}
            >
              Ver Seguimiento
            </Button>
            {tipoVista === "seguridad" && (
              <Button
                variant="outlined"
                onClick={() => setOpenDialog(true)}
                sx={{ ml: 1 }}
              >
                Subir Imagen
              </Button>
            )}
          </Box>
        </Paper>
      )}

      {/* Dialog para subir imagen */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Subir Imagen</DialogTitle>
        <DialogContent sx={{ pt: 2, minWidth: 400 }}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            style={{ width: "100%", marginBottom: 16 }}
          />
          {imageFile && (
            <Typography variant="caption" color="success">
              ✓ {imageFile.name}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button
            onClick={handleUploadImage}
            variant="contained"
            disabled={uploadingImage || !imageFile}
          >
            {uploadingImage ? "Subiendo..." : "Subir"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
