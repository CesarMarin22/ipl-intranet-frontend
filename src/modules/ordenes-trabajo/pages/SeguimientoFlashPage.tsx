import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  Paper,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import TimelineIcon from "@mui/icons-material/Timeline";
import EditNoteIcon from "@mui/icons-material/EditNote";
import PersonIcon from "@mui/icons-material/Person";
import EventIcon from "@mui/icons-material/Event";
import StoreIcon from "@mui/icons-material/Store";
import PlaceIcon from "@mui/icons-material/Place";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LockIcon from "@mui/icons-material/Lock";
import SaveIcon from "@mui/icons-material/Save";

import { OrdenesTrabajoService } from "../../../services/ordenesTrabajo";
import LoaderOverlay from "../../../shared/components/LoaderOverlay";
import { confirmAction, showError, showSuccess, showWarning } from "../../../shared/utils/swal";

type OT = Record<string, any>;

type RegistroSeguimiento = {
  id: number;
  estatus: string;
  responsable: string | null;
  fecha_compromiso: string | null;
  comentario: string | null;
  creado_por: string;
  creado_en: string;
};

// Same statuses as OTA
const ESTATUS = [
  { valor: "Abierto", color: "#9e9e9e" },
  { valor: "En Proceso", color: "#ffb300" },
  { valor: "Cerrado", color: "#2e7d32" },
] as const;

const colorEstatus = (estatus: string) => ESTATUS.find((e) => e.valor === estatus)?.color || "#9e9e9e";

const formatoFecha = (valor: string | null | undefined) => {
  if (!valor) return "";
  const [fechaParte, horaParte] = valor.split(" ");
  const [y, m, d] = fechaParte.slice(0, 10).split("-");
  if (!y || !m || !d) return valor;
  return horaParte ? `${d}/${m}/${y} ${horaParte.slice(0, 5)}` : `${d}/${m}/${y}`;
};

const formularioVacio = { estatus: "", responsable: "", fecha_compromiso: "", comentario: "" };

export default function SeguimientoFlashPage() {
  const { docnum } = useParams<{ docnum: string }>();
  const navigate = useNavigate();
  const theme = useTheme();

  const [ot, setOt] = useState<OT | null>(null);
  const [historial, setHistorial] = useState<RegistroSeguimiento[]>([]);
  const [yaCerrado, setYaCerrado] = useState(false);
  const [puedeSeguimiento, setPuedeSeguimiento] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(formularioVacio);

  const cargarDatos = async () => {
    if (!docnum) return;
    try {
      const [otData, seguimiento] = await Promise.all([
        OrdenesTrabajoService.verOT(docnum),
        OrdenesTrabajoService.obtenerSeguimiento(docnum),
      ]);
      setOt(otData?.ot ?? null);
      setHistorial(seguimiento?.historial || []);
      setYaCerrado(Boolean(seguimiento?.ya_cerrado));
      setPuedeSeguimiento(Boolean(seguimiento?.puede_seguimiento));
    } catch (error: any) {
      showError(error.message || "No se pudo cargar el seguimiento");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    cargarDatos();
  }, [docnum]);

  const handleGuardar = async () => {
    if (!docnum) return;
    if (!form.estatus) {
      showWarning("Selecciona el estatus del seguimiento.", "Falta el estatus");
      return;
    }
    if (form.estatus === "Cerrado") {
      const confirmado = await confirmAction(
        "Se enviará un correo de cierre y ya no se podrán agregar más seguimientos.",
        "¿Cerrar este Flash Report?",
        "Sí, cerrar"
      );
      if (!confirmado) return;
    }

    setSaving(true);
    try {
      const resultado = await OrdenesTrabajoService.guardarSeguimiento(docnum, form);
      setForm(formularioVacio);
      await cargarDatos();
      if (resultado?.correo_enviado === false) {
        showWarning(
          `El seguimiento se guardó, pero no se pudo enviar el correo de notificación.\n${resultado?.correo_error || ""}`,
          "Seguimiento guardado"
        );
      } else {
        showSuccess("Seguimiento registrado y notificado por correo.", "Guardado");
      }
    } catch (error: any) {
      showError(error.message || "No se pudo guardar el seguimiento.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoaderOverlay label="Cargando seguimiento..." />;

  if (!ot) {
    return (
      <Paper sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
          No se encontró el Flash Report
        </Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Volver
        </Button>
      </Paper>
    );
  }

  const estatusActual = historial[0]?.estatus || "";
  const indiceActual = ESTATUS.findIndex((e) => e.valor === estatusActual);
  const cierre = historial.find((h) => h.estatus === "Cerrado");
  const accent = ot.SeveridadColorFondo || "#F18700";

  return (
    <Box>
      {/* Hero */}
      <Paper
        component={motion.div}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{
          p: { xs: 2.5, md: 4 },
          mb: 3,
          borderRadius: 4,
          background: `linear-gradient(135deg, ${alpha("#F18700", 0.22)} 0%, ${theme.palette.background.paper} 60%)`,
          borderLeft: `6px solid ${accent}`,
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap", alignItems: "flex-start" }}>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", minWidth: 0 }}>
            <IconButton
              onClick={() => navigate(`/ordenes-trabajo/${ot.DocNum}`)}
              aria-label="Volver al Flash Report"
              sx={{ bgcolor: alpha(theme.palette.text.primary, 0.06) }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ minWidth: 0 }}>
              <Chip
                icon={<TimelineIcon />}
                label="Seguimiento de Flash Report"
                size="small"
                sx={{ fontWeight: 800, bgcolor: alpha("#F18700", 0.2), color: "#F18700", mb: 1 }}
              />
              <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                Folio SAP {ot.DocNum}
              </Typography>
            </Box>
          </Box>

          {ot.U_Severidad && (
            <Box
              sx={{
                px: 3,
                py: 1.5,
                borderRadius: 3,
                bgcolor: ot.SeveridadColorFondo,
                color: ot.SeveridadColorTexto,
                textAlign: "center",
                boxShadow: `0 8px 24px ${alpha(ot.SeveridadColorFondo || "#000", 0.35)}`,
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 800, textTransform: "uppercase", opacity: 0.85 }}>
                Severidad
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                {ot.SeveridadEtiqueta || ot.U_Severidad}
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 2.5 }}>
          {[
            { icon: <StoreIcon fontSize="small" />, label: ot.SucursalName },
            { icon: <PlaceIcon fontSize="small" />, label: ot.CustomerName },
            { icon: <EventIcon fontSize="small" />, label: formatoFecha(ot.StartDate) },
            { icon: <PersonIcon fontSize="small" />, label: ot.U_CreateUser },
          ]
            .filter((c) => c.label)
            .map((c) => (
              <Chip key={String(c.label)} icon={c.icon} label={c.label} variant="outlined" />
            ))}
        </Box>

        {/* Status progress */}
        <Box sx={{ display: "flex", alignItems: "center", mt: 3, maxWidth: 560 }}>
          {ESTATUS.map((e, i) => {
            const alcanzado = i <= indiceActual;
            return (
              <Box key={e.valor} sx={{ display: "flex", alignItems: "center", flex: i < ESTATUS.length - 1 ? 1 : "none" }}>
                <Box sx={{ textAlign: "center" }}>
                  <Box
                    component={motion.div}
                    initial={{ scale: 0.6 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 * i }}
                    sx={{
                      width: 30,
                      height: 30,
                      mx: "auto",
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 800,
                      fontSize: 13,
                      color: alcanzado ? "#fff" : "text.secondary",
                      bgcolor: alcanzado ? e.color : alpha(theme.palette.text.primary, 0.08),
                      boxShadow: i === indiceActual ? `0 0 0 5px ${alpha(e.color, 0.25)}` : "none",
                    }}
                  >
                    {alcanzado && e.valor === "Cerrado" ? <CheckCircleIcon fontSize="small" /> : i + 1}
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{ display: "block", mt: 0.5, fontWeight: i === indiceActual ? 800 : 500, whiteSpace: "nowrap" }}
                  >
                    {e.valor}
                  </Typography>
                </Box>
                {i < ESTATUS.length - 1 && (
                  <Box
                    sx={{
                      flex: 1,
                      height: 3,
                      mx: 1,
                      mb: 2.5,
                      borderRadius: 2,
                      bgcolor: i < indiceActual ? ESTATUS[i + 1].color : alpha(theme.palette.text.primary, 0.08),
                    }}
                  />
                )}
              </Box>
            );
          })}
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* History timeline */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, height: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
              <TimelineIcon sx={{ color: "#F18700" }} />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Historial de seguimiento
              </Typography>
              <Chip size="small" label={historial.length} />
            </Box>

            {historial.length === 0 ? (
              <Typography color="text.disabled">Aún no hay seguimientos registrados para este Flash Report.</Typography>
            ) : (
              historial.map((reg, i) => {
                const color = colorEstatus(reg.estatus);
                return (
                  <Box
                    key={reg.id}
                    component={motion.div}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                    sx={{ display: "flex", gap: 2 }}
                  >
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <Box sx={{ width: 14, height: 14, mt: 0.75, borderRadius: "50%", bgcolor: color, boxShadow: `0 0 0 4px ${alpha(color, 0.2)}` }} />
                      {i < historial.length - 1 && <Box sx={{ width: 2, flex: 1, bgcolor: "divider", my: 0.5 }} />}
                    </Box>
                    <Box sx={{ pb: 3, flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                        <Chip size="small" label={reg.estatus} sx={{ fontWeight: 800, bgcolor: color, color: "#fff" }} />
                        <Typography variant="body2" color="text.secondary">
                          {formatoFecha(reg.creado_en)} · por <strong>{reg.creado_por}</strong>
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", gap: 2.5, flexWrap: "wrap", mt: 1 }}>
                        <Typography variant="body2" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <PersonIcon fontSize="inherit" /> Responsable: <strong>{reg.responsable || "N/A"}</strong>
                        </Typography>
                        <Typography variant="body2" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <EventIcon fontSize="inherit" /> Compromiso: <strong>{formatoFecha(reg.fecha_compromiso) || "N/A"}</strong>
                        </Typography>
                      </Box>
                      {reg.comentario && (
                        <Typography
                          variant="body2"
                          sx={{
                            mt: 1,
                            p: 1.5,
                            borderRadius: 2,
                            whiteSpace: "pre-line",
                            wordBreak: "break-word",
                            bgcolor: alpha(theme.palette.text.primary, 0.04),
                          }}
                        >
                          {reg.comentario}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                );
              })
            )}
          </Paper>
        </Grid>

        {/* Action panel */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, position: { md: "sticky" }, top: { md: 16 } }}>
            {yaCerrado ? (
              <Box sx={{ textAlign: "center", py: 2 }}>
                <CheckCircleIcon sx={{ fontSize: 56, color: "#2e7d32" }} />
                <Typography variant="h6" sx={{ fontWeight: 800, mt: 1 }}>
                  Flash Report cerrado
                </Typography>
                {cierre && (
                  <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    El {formatoFecha(cierre.creado_en)} por {cierre.creado_por}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                  Ya no se pueden agregar más seguimientos. Aún puedes consultar el historial.
                </Typography>
              </Box>
            ) : !puedeSeguimiento ? (
              <Box sx={{ textAlign: "center", py: 2 }}>
                <LockIcon sx={{ fontSize: 48, color: "text.disabled" }} />
                <Typography sx={{ fontWeight: 800, mt: 1 }}>Solo consulta</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  El seguimiento lo registra el área que corresponde a la Clasificación del Suceso.
                </Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
                  <EditNoteIcon sx={{ color: "#F18700" }} />
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Agregar seguimiento
                  </Typography>
                </Box>

                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                  Estatus *
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  fullWidth
                  value={form.estatus}
                  onChange={(_, valor: string | null) => valor && setForm({ ...form, estatus: valor })}
                  sx={{ mt: 0.5, mb: 2.5 }}
                >
                  {ESTATUS.map((e) => (
                    <ToggleButton
                      key={e.valor}
                      value={e.valor}
                      sx={{
                        fontWeight: 800,
                        "&.Mui-selected, &.Mui-selected:hover": { bgcolor: e.color, color: "#fff" },
                      }}
                    >
                      {e.valor}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>

                <Box sx={{ display: "grid", gap: 2 }}>
                  <TextField
                    label="Responsable"
                    value={form.responsable}
                    onChange={(e) => setForm({ ...form, responsable: e.target.value })}
                    fullWidth
                  />
                  <TextField
                    label="Fecha compromiso"
                    type="date"
                    value={form.fecha_compromiso}
                    onChange={(e) => setForm({ ...form, fecha_compromiso: e.target.value })}
                    slotProps={{ inputLabel: { shrink: true } }}
                    fullWidth
                  />
                  <TextField
                    label={form.estatus === "Cerrado" ? "Comentario final" : "Comentario"}
                    value={form.comentario}
                    onChange={(e) => setForm({ ...form, comentario: e.target.value })}
                    multiline
                    minRows={3}
                    fullWidth
                  />
                </Box>

                {form.estatus === "Cerrado" && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Al cerrar se enviará el correo de cierre y ya no se podrán agregar más seguimientos.
                  </Alert>
                )}

                <Button
                  variant="contained"
                  color={form.estatus === "Cerrado" ? "success" : "primary"}
                  size="large"
                  fullWidth
                  startIcon={form.estatus === "Cerrado" ? <CheckCircleIcon /> : <SaveIcon />}
                  onClick={handleGuardar}
                  disabled={saving}
                  sx={{ mt: 2.5, fontWeight: 800 }}
                >
                  {saving ? "Guardando..." : form.estatus === "Cerrado" ? "Cerrar Flash Report" : "Guardar seguimiento"}
                </Button>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
