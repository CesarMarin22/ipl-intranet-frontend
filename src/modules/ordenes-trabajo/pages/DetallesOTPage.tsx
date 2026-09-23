import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AssignmentIcon from "@mui/icons-material/Assignment";
import SecurityIcon from "@mui/icons-material/Security";
import GavelIcon from "@mui/icons-material/Gavel";
import PlaceIcon from "@mui/icons-material/Place";
import EventIcon from "@mui/icons-material/Event";
import PersonIcon from "@mui/icons-material/Person";
import StoreIcon from "@mui/icons-material/Store";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import BuildIcon from "@mui/icons-material/Build";
import InventoryIcon from "@mui/icons-material/Inventory2";
import ScheduleIcon from "@mui/icons-material/Schedule";
import GroupsIcon from "@mui/icons-material/Groups";
import DescriptionIcon from "@mui/icons-material/Description";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import { OrdenesTrabajoService, type ArchivoDrive } from "../../../services/ordenesTrabajo";
import LoaderOverlay from "../../../shared/components/LoaderOverlay";
import { showError } from "../../../shared/utils/swal";

type TipoVista = "normal" | "audi" | "seguridad";
type OT = Record<string, any>;

const TIPO_INFO: Record<TipoVista, { titulo: string; color: string; icono: ReactNode }> = {
  normal: { titulo: "Orden de Trabajo", color: "#667eea", icono: <AssignmentIcon /> },
  audi: { titulo: "OT Audi", color: "#f5576c", icono: <GavelIcon /> },
  seguridad: { titulo: "Flash Report", color: "#F18700", icono: <SecurityIcon /> },
};

const texto = (v: unknown) => {
  if (v === null || v === undefined) return "";
  return String(v).replace(/\r\n?/g, "\n").trim();
};

const fecha = (v: unknown) => {
  const s = texto(v);
  if (!s) return "";
  const [y, m, d] = s.slice(0, 10).split("-");
  return d && m && y ? `${d}/${m}/${y}` : s;
};

const hora = (v: unknown) => texto(v).slice(0, 5);

const siNo = (v: unknown) => (Number(v) === 1 ? "Sí" : Number(v) === 0 && v !== null && v !== "" ? "No" : "");

const tipoRefacciones = (v: unknown) =>
  ({ "1": "Instaladas", "0": "Requeridas", "2": "Ambas" } as Record<string, string>)[String(v)] || "";

const moneda = (v: unknown) =>
  Number(v || 0).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

function duracion(inicio: string, fin: string) {
  const [h1, m1] = inicio.split(":").map(Number);
  const [h2, m2] = fin.split(":").map(Number);
  if ([h1, m1, h2, m2].some(Number.isNaN)) return "";
  const minutos = h2 * 60 + m2 - (h1 * 60 + m1);
  if (minutos <= 0) return "";
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return h ? `${h} h ${m ? `${m} min` : ""}`.trim() : `${m} min`;
}

// ---------- building blocks ----------

function Section({
  icon,
  title,
  accent,
  children,
  delay = 0,
}: {
  icon: ReactNode;
  title: string;
  accent: string;
  children: ReactNode;
  delay?: number;
}) {
  return (
    <Paper
      component={motion.div}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      sx={{ p: { xs: 2, md: 3 }, height: "100%", borderRadius: 3 }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            color: accent,
            bgcolor: alpha(accent, 0.14),
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {title}
        </Typography>
      </Box>
      {children}
    </Paper>
  );
}

function Field({ label, value, full = false }: { label: string; value: ReactNode; full?: boolean }) {
  const vacio = value === "" || value === null || value === undefined;
  return (
    <Grid size={{ xs: 12, sm: full ? 12 : 6 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 700 }}
      >
        {label}
      </Typography>
      <Typography
        component="div"
        variant="body1"
        sx={{ mt: 0.25, whiteSpace: "pre-line", wordBreak: "break-word", color: vacio ? "text.disabled" : "text.primary" }}
      >
        {vacio ? "N/A" : value}
      </Typography>
    </Grid>
  );
}

function Fields({ children }: { children: ReactNode }) {
  return (
    <Grid container spacing={2.5}>
      {children}
    </Grid>
  );
}

// Numbered vertical flow for the long narrative fields of a Flash Report
function Narrativa({ items, accent }: { items: { label: string; value: string }[]; accent: string }) {
  return (
    <Box>
      {items.map((item, i) => (
        <Box key={item.label} sx={{ display: "flex", gap: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                fontSize: 13,
                fontWeight: 800,
                color: "#fff",
                bgcolor: accent,
                flexShrink: 0,
              }}
            >
              {i + 1}
            </Box>
            {i < items.length - 1 && <Box sx={{ width: 2, flex: 1, bgcolor: alpha(accent, 0.3), my: 0.5 }} />}
          </Box>
          <Box sx={{ pb: i < items.length - 1 ? 3 : 0, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800 }}>{item.label}</Typography>
            <Typography
              sx={{
                mt: 0.5,
                whiteSpace: "pre-line",
                wordBreak: "break-word",
                color: item.value ? "text.secondary" : "text.disabled",
              }}
            >
              {item.value || "N/A"}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

function Tiempos({ ot, accent, extra }: { ot: OT; accent: string; extra?: ReactNode }) {
  const inicio = hora(ot.U_HoraInicio || ot.StartTime);
  const fin = hora(ot.U_HoraFin || ot.EndTime);
  const dur = inicio && fin ? duracion(inicio, fin) : "";
  const Punto = ({ titulo, f, h }: { titulo: string; f: string; h: string }) => (
    <Box sx={{ textAlign: "center", minWidth: 110 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
        {titulo}
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
        {h || "--:--"}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {f || "N/A"}
      </Typography>
    </Box>
  );
  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
        <Punto titulo="Inicio" f={fecha(ot.StartDate)} h={inicio} />
        <Box sx={{ flex: 1, minWidth: 80, textAlign: "center" }}>
          <Box sx={{ height: 3, borderRadius: 2, background: `linear-gradient(90deg, ${alpha(accent, 0.25)}, ${accent})` }} />
          {dur && <Chip size="small" label={dur} sx={{ mt: 1, fontWeight: 700 }} />}
        </Box>
        <Punto titulo="Término" f={fecha(ot.EndDueDate)} h={fin} />
      </Box>
      {extra && <Box sx={{ mt: 3 }}>{extra}</Box>}
    </>
  );
}

function Refacciones({ ot }: { ot: OT }) {
  const filas = Array.from({ length: 20 }, (_, i) => ({
    n: i + 1,
    codigo: texto(ot[`U_Code${i + 1}`]),
    cantidad: ot[`U_Qty${i + 1}`],
  })).filter((f) => f.codigo);

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <Chip label={`Tipo: ${tipoRefacciones(ot.U_TipoRefacciones) || "N/A"}`} variant="outlined" />
      </Box>
      {filas.length === 0 ? (
        <Typography color="text.disabled">Sin refacciones registradas.</Typography>
      ) : (
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Número de parte</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">
                  Cantidad
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filas.map((f) => (
                <TableRow key={f.n} hover>
                  <TableCell>{f.n}</TableCell>
                  <TableCell>{f.codigo}</TableCell>
                  <TableCell align="right">{Number(f.cantidad || 0)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </>
  );
}

function GaleriaFotos({ refId }: { refId: string }) {
  const [fotos, setFotos] = useState<ArchivoDrive[] | null>(null);
  const [error, setError] = useState(false);
  const [abierta, setAbierta] = useState<number | null>(null);

  useEffect(() => {
    if (!refId) {
      setFotos([]);
      return;
    }
    OrdenesTrabajoService.verImagenesFlash(refId)
      .then(setFotos)
      .catch(() => setError(true));
  }, [refId]);

  if (error) return <Typography color="text.disabled">No se pudieron cargar las fotos.</Typography>;
  if (fotos === null)
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <CircularProgress size={20} />
        <Typography color="text.secondary">Cargando fotos...</Typography>
      </Box>
    );
  if (fotos.length === 0)
    return <Typography color="text.disabled">Este Flash Report no tiene fotos guardadas.</Typography>;

  const mover = (delta: number) =>
    setAbierta((i) => (i === null ? i : (i + delta + fotos.length) % fotos.length));

  return (
    <>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 1.5 }}>
        {fotos.map((f, i) => (
          <Box
            key={f.id}
            component={motion.img}
            whileHover={{ scale: 1.03 }}
            src={OrdenesTrabajoService.urlImagenDrive(f.id)}
            alt={f.name}
            loading="lazy"
            onClick={() => setAbierta(i)}
            sx={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover", borderRadius: 2, cursor: "zoom-in", display: "block" }}
          />
        ))}
      </Box>

      <Dialog
        open={abierta !== null}
        onClose={() => setAbierta(null)}
        maxWidth="lg"
        slotProps={{ paper: { sx: { bgcolor: "#000", position: "relative" } } }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") mover(1);
          if (e.key === "ArrowLeft") mover(-1);
        }}
      >
        {abierta !== null && (
          <>
            <Box
              component="img"
              src={OrdenesTrabajoService.urlImagenDrive(fotos[abierta].id)}
              alt={fotos[abierta].name}
              sx={{ display: "block", maxWidth: "100%", maxHeight: "85vh", mx: "auto" }}
            />
            <IconButton onClick={() => setAbierta(null)} sx={{ position: "absolute", top: 8, right: 8, color: "#fff", bgcolor: "rgba(0,0,0,.5)" }}>
              <CloseIcon />
            </IconButton>
            {fotos.length > 1 && (
              <>
                <IconButton onClick={() => mover(-1)} sx={{ position: "absolute", top: "50%", left: 8, color: "#fff", bgcolor: "rgba(0,0,0,.5)" }}>
                  <ChevronLeftIcon />
                </IconButton>
                <IconButton onClick={() => mover(1)} sx={{ position: "absolute", top: "50%", right: 8, color: "#fff", bgcolor: "rgba(0,0,0,.5)" }}>
                  <ChevronRightIcon />
                </IconButton>
                <Typography sx={{ position: "absolute", bottom: 10, width: "100%", textAlign: "center", color: "#fff" }}>
                  {abierta + 1} / {fotos.length}
                </Typography>
              </>
            )}
          </>
        )}
      </Dialog>
    </>
  );
}

// ---------- page ----------

export default function DetallesOTPage() {
  const { docnum } = useParams<{ docnum: string }>();
  const navigate = useNavigate();
  const theme = useTheme();

  const [ot, setOt] = useState<OT | null>(null);
  const [tipoVista, setTipoVista] = useState<TipoVista>("normal");
  const [puedeSeguimiento, setPuedeSeguimiento] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!docnum) return;
    setLoading(true);
    OrdenesTrabajoService.verOT(docnum)
      .then((data) => {
        setOt(data?.ot ?? null);
        setTipoVista(data?.tipo_vista || "normal");
        setPuedeSeguimiento(Boolean(data?.puede_seguimiento));
      })
      .catch((error: any) => showError(error.message || "No se pudieron cargar los detalles"))
      .finally(() => setLoading(false));
  }, [docnum]);

  if (loading) return <LoaderOverlay label="Cargando detalles..." />;

  if (!ot) {
    return (
      <Paper sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
          No se encontró información de este registro
        </Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Volver
        </Button>
      </Paper>
    );
  }

  const info = TIPO_INFO[tipoVista];
  const esFlash = tipoVista === "seguridad";
  const accent = esFlash && ot.SeveridadColorFondo ? ot.SeveridadColorFondo : info.color;

  const metaChips = [
    { icon: <StoreIcon fontSize="small" />, label: tipoVista === "audi" ? `PUE (${texto(ot.SucursalName)})` : texto(ot.SucursalName) },
    { icon: <EventIcon fontSize="small" />, label: fecha(ot.StartDate) },
    { icon: <PersonIcon fontSize="small" />, label: texto(ot.U_CreateUser) },
    { icon: <PlaceIcon fontSize="small" />, label: texto(ot.CustomerName) },
  ].filter((c) => c.label);

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
          position: "relative",
          overflow: "hidden",
          background: `linear-gradient(135deg, ${alpha(info.color, 0.22)} 0%, ${theme.palette.background.paper} 60%)`,
          borderLeft: `6px solid ${accent}`,
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap", alignItems: "flex-start" }}>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", minWidth: 0 }}>
            <IconButton onClick={() => navigate(-1)} aria-label="Volver" sx={{ bgcolor: alpha(theme.palette.text.primary, 0.06) }}>
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ minWidth: 0 }}>
              <Chip icon={info.icono as any} label={info.titulo} size="small" sx={{ fontWeight: 800, bgcolor: alpha(info.color, 0.2), color: info.color, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                Folio SAP {ot.DocNum}
              </Typography>
            </Box>
          </Box>

          {esFlash && ot.U_Severidad && (
            <Box
              component={motion.div}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15 }}
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
          {metaChips.map((c) => (
            <Chip key={c.label} icon={c.icon} label={c.label} variant="outlined" />
          ))}
        </Box>

        {esFlash && puedeSeguimiento && (
          <Button
            variant="contained"
            color="warning"
            startIcon={<TaskAltIcon />}
            onClick={() => navigate(`/ordenes-trabajo/seguridad/${ot.DocNum}/seguimiento`)}
            sx={{ mt: 2.5, fontWeight: 800 }}
          >
            Dar seguimiento / Cerrar
          </Button>
        )}
      </Paper>

      {esFlash ? <VistaFlash ot={ot} accent={info.color} /> : <VistaOT ot={ot} tipo={tipoVista} accent={info.color} />}
    </Box>
  );
}

function VistaFlash({ ot, accent }: { ot: OT; accent: string }) {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 5 }}>
        <Section icon={<InfoOutlinedIcon />} title="Datos del suceso" accent={accent}>
          <Fields>
            <Field label="Usuario que elaboró" value={texto(ot.U_CreateUser)} />
            <Field label="Sucursal" value={texto(ot.SucursalName)} />
            <Field label="Clasificación del suceso" value={texto(ot.CallTypeName)} />
            <Field label="Relación del suceso" value={texto(ot.ProblemTypeName)} />
            <Field label="Fecha" value={fecha(ot.StartDate)} />
            <Field label="Hora" value={hora(ot.StartTime || ot.U_HoraInicio)} />
            <Field label="Lugar del suceso (cliente)" value={texto(ot.CustomerCode)} />
            <Field label="Nombre del lugar" value={texto(ot.CustomerName)} />
            <Field label="Área del suceso" value={texto(ot.U_AreaT || ot.U_AreaTrabajo)} full />
          </Fields>
        </Section>
      </Grid>

      <Grid size={{ xs: 12, lg: 7 }}>
        <Section icon={<DescriptionIcon />} title="Descripción y análisis" accent={accent} delay={0.05}>
          <Narrativa
            accent={accent}
            items={[
              { label: "Descripción del suceso", value: texto(ot.Resolution) },
              { label: "Posible causa", value: texto(ot.Subject || ot.Description) },
              { label: "Acciones realizadas para atender la situación", value: texto(ot.U_AccionesR) },
              { label: "Plan de acción", value: texto(ot.U_Plan) },
              { label: "Lecciones aprendidas", value: texto(ot.U_Leccion) },
            ]}
          />
        </Section>
      </Grid>

      <Grid size={{ xs: 12, md: 5 }}>
        <Section icon={<GroupsIcon />} title="Involucrados y costo" accent={accent} delay={0.1}>
          <Fields>
            <Field label="Persona involucrada" value={texto(ot.U_PersonWhoReports)} />
            <Field label="Nombre del supervisor" value={texto(ot.U_Supervisor)} />
            <Field
              label="Costo aproximado"
              value={<Typography variant="h5" sx={{ fontWeight: 900 }}>{moneda(ot.U_Costo)}</Typography>}
              full
            />
          </Fields>
        </Section>
      </Grid>

      <Grid size={{ xs: 12, md: 7 }}>
        <Section icon={<PhotoLibraryIcon />} title="Fotos del suceso" accent={accent} delay={0.15}>
          <GaleriaFotos refId={texto(ot.U_A_FolioE)} />
        </Section>
      </Grid>
    </Grid>
  );
}

function VistaOT({ ot, tipo, accent }: { ot: OT; tipo: TipoVista; accent: string }) {
  const esAudi = tipo === "audi";
  const tipoOrdenAudi = ({ B: "Aviso", N: "Reporte de Trabajo" } as Record<string, string>)[texto(ot.U_A_TipoOT)] || "Desconocido";

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 6 }}>
        <Section icon={<InfoOutlinedIcon />} title="Datos generales" accent={accent}>
          <Fields>
            <Field label="Usuario de creación" value={texto(ot.U_CreateUser)} />
            <Field label="Sucursal" value={esAudi ? `PUE (${texto(ot.SucursalName)})` : texto(ot.SucursalName)} />
            <Field label="Tipo de orden" value={esAudi ? tipoOrdenAudi : texto(ot.CallTypeName)} />
            <Field label="Folio físico" value={texto(ot.CustomerRefNo)} />
            {esAudi ? (
              <>
                <Field label="Número de aviso" value={texto(ot.DocNum)} />
                <Field label="Código SAP de tipo de orden" value={texto(ot.U_A_Orden)} />
                <Field label="Defecto" value={texto(ot.U_A_Defectos)} />
                <Field label="Causa" value={texto(ot.U_A_Causa)} />
                <Field label="Tipo de daño" value={texto(ot.U_A_TipoDano)} />
              </>
            ) : (
              <Field label="Tipo de problema" value={ot.ProblemTypeName === "N/A" ? "" : texto(ot.ProblemTypeName)} />
            )}
            <Field label="Persona que reporta" value={texto(ot.U_PersonWhoReports)} />
            <Field
              label="Equipo en funcionamiento"
              value={
                siNo(ot.U_EquipoFunciona) && (
                  <Chip size="small" label={siNo(ot.U_EquipoFunciona)} color={siNo(ot.U_EquipoFunciona) === "Sí" ? "success" : "error"} />
                )
              }
            />
            {esAudi && <Field label="Código de cliente" value={texto(ot.CustomerCode)} />}
            <Field label={esAudi ? "Nombre del cliente" : "Cliente"} value={texto(ot.CustomerName)} full={!esAudi} />
          </Fields>
        </Section>
      </Grid>

      <Grid size={{ xs: 12, lg: 6 }}>
        <Section icon={<PrecisionManufacturingIcon />} title="Equipo" accent={accent} delay={0.05}>
          <Fields>
            <Field label="No. de serie" value={texto(ot.ManufacturerSerialNum)} />
            <Field label="Marca" value={texto(ot.ItemGroupCode)} />
            <Field label="Modelo" value={texto(ot.ItemDescription)} full />
            <Field label="Número económico" value={texto(ot.InternalSerialNum)} />
            <Field label={esAudi ? "Número de artículo" : "Código de artículo"} value={texto(ot.ItemCode)} />
            <Field label="Horómetro" value={texto(ot.U_Horometro)} />
          </Fields>
        </Section>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Section icon={<BuildIcon />} title="Trabajo" accent={accent} delay={0.1}>
          <Fields>
            <Field label="Descripción de la falla" value={texto(esAudi ? ot.Subject : ot.Subject || ot.Description)} full />
            <Field label="Trabajo realizado" value={texto(ot.Resolution)} full />
          </Fields>
        </Section>
      </Grid>

      <Grid size={{ xs: 12, lg: 6 }}>
        <Section icon={<InventoryIcon />} title="Refacciones" accent={accent} delay={0.15}>
          <Refacciones ot={ot} />
        </Section>
      </Grid>

      <Grid size={{ xs: 12, lg: 6 }}>
        <Section icon={<ScheduleIcon />} title="Tiempos" accent={accent} delay={0.2}>
          <Tiempos
            ot={ot}
            accent={accent}
            extra={
              esAudi && (
                <Fields>
                  <Field label="Personas que trabajaron" value={Number(ot.U_A_NumTec) ? Number(ot.U_A_NumTec) : ""} />
                  <Field label="Horas trabajadas" value={Number(ot.U_A_Horas) ? Number(ot.U_A_Horas) : ""} />
                </Fields>
              )
            }
          />
        </Section>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Section icon={<GroupsIcon />} title="Personal y firmas" accent={accent} delay={0.25}>
          <Fields>
            {esAudi ? (
              <>
                <Field label="Realizó trabajo" value={texto(ot.U_Tecnico2)} />
                <Field label="Técnico 2" value={texto(ot.U_Tecnico3)} />
                <Field label="Técnico 3" value={texto(ot.U_Tecnico4)} />
                <Field label="Nombre de REV" value={texto(ot.U_CSSR)} />
                <Field label="Revisó trabajo" value={texto(ot.U_Supervisor)} />
                <Field label="Visto bueno del cliente" value={texto(ot.U_Supervisor)} />
              </>
            ) : (
              <>
                <Field label="Realizó trabajo" value={texto(ot.RealizoTrabajoNombre)} />
                <Field label="Técnico 2" value={texto(ot.Tecnico3Nombre)} />
                <Field label="Técnico 3" value={texto(ot.Tecnico4Nombre)} />
                <Field label="Nombre de REV" value={texto(ot.U_CSSR)} />
                <Field label="Revisó trabajo" value={texto(ot.U_VoBoT)} />
                <Field label="Visto bueno del cliente" value={texto(ot.U_PersonWhoReports)} />
                <Field label="Área de trabajo" value={texto(ot.U_AreaT)} />
              </>
            )}
          </Fields>
        </Section>
      </Grid>
    </Grid>
  );
}
