import {
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import PageHeader from "../../../shared/components/PageHeader";
import { showError, showSuccess } from "../../../shared/utils/swal";
import { OrdenesTrabajoService } from "../../../services/ordenesTrabajo";
import LoaderOverlay from "../../../shared/components/LoaderOverlay";

interface OT {
  DocNum: number;
  CustomerName: string;
  CustomerRefNo: string;
  U_Severidad?: string;
  SeveridadEtiqueta?: string;
  SeveridadColorFondo?: string;
  SeveridadColorTexto?: string;
}

interface SeguimientoRecord {
  id: number;
  estatus: string;
  responsable: string;
  fecha_compromiso: string;
  comentario: string;
  creado_por: string;
  creado_en: string;
}

const ESTATUS_OPTIONS = ["Identificado", "En Análisis", "En Ejecución", "Cerrado"];

export default function SeguimientoFlashPage() {
  const { docnum } = useParams<{ docnum: string }>();
  const navigate = useNavigate();

  const [ot, setOt] = useState<OT | null>(null);
  const [historial, setHistorial] = useState<SeguimientoRecord[]>([]);
  const [yaCerrado, setYaCerrado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    estatus: "",
    responsable: "",
    fecha_compromiso: "",
    comentario: "",
  });

  useEffect(() => {
    cargarDatos();
  }, [docnum]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      if (!docnum) return;

      const otData = await OrdenesTrabajoService.verOT(docnum);
      const seguimientoData = await OrdenesTrabajoService.obtenerSeguimiento(docnum);

      setOt(otData?.ot);
      setHistorial(seguimientoData?.historial || []);
      setYaCerrado(seguimientoData?.ya_cerrado || false);
    } catch (error: any) {
      showError("Error", error.message || "No se pudieron cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarSeguimiento = async () => {
    if (!formData.estatus.trim()) {
      showError("Validación", "El estatus es obligatorio");
      return;
    }

    setSaving(true);
    try {
      await OrdenesTrabajoService.guardarSeguimiento(docnum!, formData);
      showSuccess("Éxito", "Seguimiento guardado correctamente");
      setFormData({ estatus: "", responsable: "", fecha_compromiso: "", comentario: "" });
      setOpenDialog(false);
      cargarDatos();
    } catch (error: any) {
      showError("Error", error.message || "No se pudo guardar el seguimiento");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoaderOverlay label="Cargando seguimiento..." />;
  }

  if (!ot) {
    return (
      <Box>
        <PageHeader title="Seguimiento - Flash Report" />
        <Typography color="error">No se encontró la OT</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title={`Seguimiento - Doc #${ot.DocNum}`} />

      <Card sx={{ mt: 3, p: 3 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 2 }}>
          <Box>
            <Typography variant="caption" color="textSecondary">
              Cliente
            </Typography>
            <Typography variant="body2">{ot.CustomerName}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="textSecondary">
              Folio
            </Typography>
            <Typography variant="body2">{ot.CustomerRefNo}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="textSecondary">
              Severidad
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <Chip
                label={ot.SeveridadEtiqueta || ot.U_Severidad || "N/A"}
                sx={{
                  bgcolor: ot.SeveridadColorFondo || "#f0f0f0",
                  color: ot.SeveridadColorTexto || "#000",
                }}
              />
            </Box>
          </Box>
          <Box>
            <Typography variant="caption" color="textSecondary">
              Estado
            </Typography>
            <Typography variant="body2">
              {yaCerrado ? "Cerrado" : "Abierto"}
            </Typography>
          </Box>
        </Box>
      </Card>

      <Box sx={{ mt: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6">Historial de Seguimiento</Typography>
          {!yaCerrado && (
            <Button variant="contained" onClick={() => setOpenDialog(true)}>
              Agregar Seguimiento
            </Button>
          )}
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ bgcolor: "#f5f5f5" }}>
              <TableRow>
                <TableCell><strong>Estatus</strong></TableCell>
                <TableCell><strong>Responsable</strong></TableCell>
                <TableCell><strong>Fecha Compromiso</strong></TableCell>
                <TableCell><strong>Comentario</strong></TableCell>
                <TableCell><strong>Creado Por</strong></TableCell>
                <TableCell><strong>Fecha</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {historial.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography color="textSecondary">Sin registros de seguimiento</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                historial.map((reg) => (
                  <TableRow key={reg.id} hover>
                    <TableCell>
                      <Chip
                        label={reg.estatus}
                        size="small"
                        color={reg.estatus === "Cerrado" ? "success" : "primary"}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{reg.responsable || "-"}</TableCell>
                    <TableCell>{reg.fecha_compromiso || "-"}</TableCell>
                    <TableCell sx={{ maxWidth: 300, whiteSpace: "pre-wrap" }}>
                      {reg.comentario || "-"}
                    </TableCell>
                    <TableCell>{reg.creado_por}</TableCell>
                    <TableCell>{reg.creado_en}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Agregar Seguimiento</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            select
            label="Estatus"
            value={formData.estatus}
            onChange={(e) => setFormData({ ...formData, estatus: e.target.value })}
            fullWidth
            sx={{ mb: 2, mt: 1 }}
          >
            {ESTATUS_OPTIONS.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Responsable"
            value={formData.responsable}
            onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
            fullWidth
            sx={{ mb: 2 }}
          />

          <TextField
            label="Fecha Compromiso"
            type="date"
            value={formData.fecha_compromiso}
            onChange={(e) => setFormData({ ...formData, fecha_compromiso: e.target.value })}
            InputLabelProps={{ shrink: true }}
            fullWidth
            sx={{ mb: 2 }}
          />

          <TextField
            label="Comentario"
            value={formData.comentario}
            onChange={(e) => setFormData({ ...formData, comentario: e.target.value })}
            multiline
            rows={3}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleGuardarSeguimiento} variant="contained" disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
