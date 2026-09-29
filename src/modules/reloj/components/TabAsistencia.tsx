import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PermissionButton from "../../../shared/components/PermissionButton";
import LoaderOverlay from "../../../shared/components/LoaderOverlay";
import { exportToExcel } from "../../../shared/utils/exportExcel";
import { usePermissions } from "../../../shared/hooks/usePermissions";
import { IPL } from "../../../shared/theme/theme";
import {
  RelojService,
  diaCorto,
  estadoDia,
  hora,
  minutosTexto,
  type DiaEvaluado,
  type FilaAsistencia,
} from "../../../services/reloj";
import { ChipEstado, Leyenda, type FiltrosPanel } from "./comunes";

const TOTALES: [keyof FilaAsistencia["TOTALES"], string][] = [
  ["ASISTENCIAS", "A"],
  ["RETARDOS", "R"],
  ["FALTAS", "F"],
  ["INCAPACIDADES", "IN"],
  ["VACACIONES", "V"],
  ["PERMISOS", "P"],
];

export default function TabAsistencia({ filtros }: { filtros: FiltrosPanel }) {
  const { hasPermission } = usePermissions();
  const [detalle, setDetalle] = useState<{ emp: FilaAsistencia; dia: DiaEvaluado } | null>(null);

  const { data, isFetching } = useQuery({
    queryKey: ["reloj-asistencia", filtros],
    queryFn: () => RelojService.asistencia(filtros),
  });

  const empleados = data?.EMPLEADOS ?? [];
  const dias = data?.DIAS ?? [];

  const exportar = () => {
    const filas = empleados.map((e) => {
      const fila: Record<string, string | number> = {
        Empleado: e.NOMBRE,
        Numero: e.NUMERO_EMPLEADO ?? "",
        Sucursal: e.SUCURSAL_CLAVE ?? "",
        Horario: e.HORARIO_NOMBRE ?? "Sin horario",
      };
      e.DIAS.forEach((d) => {
        const entradaSalida = d.ENTRADA || d.SALIDA ? ` ${hora(d.ENTRADA)}-${hora(d.SALIDA)}` : "";
        fila[d.FECHA] = `${estadoDia(d.ESTADO).label}${entradaSalida}`;
      });
      fila.Asistencias = e.TOTALES.ASISTENCIAS;
      fila.Retardos = e.TOTALES.RETARDOS;
      fila.Faltas = e.TOTALES.FALTAS;
      fila.Incapacidades = e.TOTALES.INCAPACIDADES;
      fila.Vacaciones = e.TOTALES.VACACIONES;
      fila.Permisos = e.TOTALES.PERMISOS;
      fila["Horas extra autorizadas"] = +(e.TOTALES.MINUTOS_EXTRA_AUTORIZADOS / 60).toFixed(2);
      fila["Horas extra pendientes"] = +(e.TOTALES.MINUTOS_EXTRA_PENDIENTES / 60).toFixed(2);
      return fila;
    });
    exportToExcel(filas, `asistencia_${filtros.desde}_${filtros.hasta}`, "Asistencia");
  };

  return (
    <Box>
      {isFetching && <LoaderOverlay label="Calculando asistencia..." />}

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }} flexWrap="wrap" gap={1}>
        <Typography color="text.secondary" variant="body2">
          {empleados.length} empleado(s). Toca un día para ver el detalle.
        </Typography>
        <PermissionButton
          allowed={hasPermission("RELOJ_ASISTENCIA", "EXPORTAR")}
          variant="outlined"
          size="small"
          startIcon={<FileDownloadIcon />}
          onClick={exportar}
          disabled={!empleados.length}
        >
          Exportar a Excel
        </PermissionButton>
      </Stack>

      <TableContainer component={Paper} sx={{ maxHeight: "65vh" }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ position: "sticky", left: 0, zIndex: 3, bgcolor: IPL.surface, minWidth: 200 }}>
                Empleado
              </TableCell>
              {dias.map((d) => (
                <TableCell key={d} align="center" sx={{ textTransform: "capitalize", px: 0.5, whiteSpace: "nowrap" }}>
                  {diaCorto(d)}
                </TableCell>
              ))}
              {TOTALES.map(([k, l]) => (
                <TableCell key={k} align="center" sx={{ px: 0.8 }}>
                  {l}
                </TableCell>
              ))}
              <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>Extra</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {empleados.map((e) => (
              <TableRow key={e.USUARIOID} hover>
                <TableCell sx={{ position: "sticky", left: 0, zIndex: 1, bgcolor: IPL.surface }}>
                  <Typography variant="body2" fontWeight={800} noWrap sx={{ maxWidth: 240 }}>
                    {e.NOMBRE}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap component="div">
                    {[e.NUMERO_EMPLEADO, e.SUCURSAL_CLAVE, e.HORARIO_NOMBRE ?? "Sin horario"].filter(Boolean).join(" · ")}
                  </Typography>
                </TableCell>
                {e.DIAS.map((d) => (
                  <TableCell
                    key={d.FECHA}
                    align="center"
                    sx={{ px: 0.5, cursor: "pointer" }}
                    onClick={() => setDetalle({ emp: e, dia: d })}
                  >
                    <Box sx={{ position: "relative", display: "inline-block" }}>
                      <ChipEstado estado={d.ESTADO} detalle={d.DETALLE} compacto />
                      {d.ALERTAS > 0 && (
                        <WarningAmberIcon
                          sx={{ position: "absolute", top: -8, right: -10, fontSize: 15, color: "#F59E0B" }}
                        />
                      )}
                    </Box>
                  </TableCell>
                ))}
                {TOTALES.map(([k]) => (
                  <TableCell key={k} align="center" sx={{ fontWeight: 800, px: 0.8 }}>
                    {e.TOTALES[k] || ""}
                  </TableCell>
                ))}
                <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                  {e.TOTALES.MINUTOS_EXTRA_AUTORIZADOS ? minutosTexto(e.TOTALES.MINUTOS_EXTRA_AUTORIZADOS) : ""}
                  {e.TOTALES.MINUTOS_EXTRA_PENDIENTES ? (
                    <Typography variant="caption" display="block" color="warning.main">
                      {minutosTexto(e.TOTALES.MINUTOS_EXTRA_PENDIENTES)} por revisar
                    </Typography>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
            {!empleados.length && !isFetching && (
              <TableRow>
                <TableCell colSpan={dias.length + 8}>
                  <Typography color="text.secondary" sx={{ p: 2 }}>
                    No hay empleados en tus sucursales con estos filtros.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Leyenda />

      <Dialog open={!!detalle} onClose={() => setDetalle(null)} maxWidth="xs" fullWidth>
        {detalle && (
          <>
            <DialogTitle>
              {detalle.emp.NOMBRE}
              <Typography variant="body2" color="text.secondary" sx={{ textTransform: "capitalize" }}>
                {new Date(`${detalle.dia.FECHA}T12:00:00`).toLocaleDateString("es-MX", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </Typography>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={1}>
                <Box>
                  <ChipEstado estado={detalle.dia.ESTADO} />
                </Box>
                {detalle.dia.DETALLE && <Typography variant="body2">{detalle.dia.DETALLE}</Typography>}
                <Typography variant="body2">
                  Horario:{" "}
                  {detalle.dia.HORARIO
                    ? `${detalle.dia.HORARIO.HORA_ENTRADA} a ${detalle.dia.HORARIO.HORA_SALIDA} (${detalle.dia.HORARIO.ORIGEN === "TURNO" ? "turno asignado" : detalle.dia.HORARIO.NOMBRE})`
                    : "sin horario ese día"}
                </Typography>
                <Typography variant="body2">
                  Entrada {hora(detalle.dia.ENTRADA)} · Salida {hora(detalle.dia.SALIDA)}
                </Typography>
                {detalle.dia.MINUTOS_TRABAJADOS > 0 && (
                  <Typography variant="body2">Trabajado: {minutosTexto(detalle.dia.MINUTOS_TRABAJADOS)}</Typography>
                )}
                {detalle.dia.MINUTOS_RETARDO > 0 && (
                  <Typography variant="body2">Retardo: {detalle.dia.MINUTOS_RETARDO} min</Typography>
                )}
                {detalle.dia.SALIDA_ANTICIPADA && (
                  <Typography variant="body2" color="warning.main">Salió antes de su hora</Typography>
                )}
                {detalle.dia.MINUTOS_EXTRA > 0 && (
                  <Typography variant="body2">
                    Tiempo extra: {minutosTexto(detalle.dia.MINUTOS_EXTRA)} ({(detalle.dia.EXTRA_ESTADO ?? "").toLowerCase()})
                  </Typography>
                )}
                {detalle.dia.ALERTAS > 0 && (
                  <Typography variant="body2" color="warning.main">
                    {detalle.dia.ALERTAS} checada(s) con alertas sin revisar (pestaña Checadas)
                  </Typography>
                )}
                {detalle.dia.RECHAZADAS > 0 && (
                  <Typography variant="body2" color="error">
                    {detalle.dia.RECHAZADAS} checada(s) rechazada(s) por el REV; no cuentan
                  </Typography>
                )}
              </Stack>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
}
