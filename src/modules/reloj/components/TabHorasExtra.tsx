import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
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
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import LoaderOverlay from "../../../shared/components/LoaderOverlay";
import PermissionButton from "../../../shared/components/PermissionButton";
import { useAppMutation } from "../../../shared/hooks/useAppMutation";
import { usePermissions } from "../../../shared/hooks/usePermissions";
import { showWarning } from "../../../shared/utils/swal";
import { RelojService, estadoDia, hora, minutosTexto, type HoraExtra } from "../../../services/reloj";
import type { FiltrosPanel } from "./comunes";

const COLOR_ESTADO = { PENDIENTE: "warning", AUTORIZADA: "success", RECHAZADA: "error" } as const;

export default function TabHorasExtra({ filtros }: { filtros: FiltrosPanel }) {
  const { hasPermission } = usePermissions();
  const puedeAprobar = hasPermission("RELOJ_ASISTENCIA", "APROBAR");
  const [decision, setDecision] = useState<{ fila: HoraExtra; estado: "AUTORIZADA" | "RECHAZADA" } | null>(null);
  const [minutos, setMinutos] = useState("");
  const [comentario, setComentario] = useState("");

  const { data = [], isFetching } = useQuery({
    queryKey: ["reloj-horas-extra", filtros],
    queryFn: () => RelojService.horasExtra(filtros),
  });

  const decidir = useAppMutation(
    () =>
      RelojService.decidirHorasExtra({
        USUARIOID: decision!.fila.USUARIOID,
        FECHA: decision!.fila.FECHA,
        ESTADO: decision!.estado,
        MINUTOS_AUTORIZADOS: decision!.estado === "AUTORIZADA" ? Number(minutos) : undefined,
        COMENTARIO: comentario.trim(),
      }),
    {
      successMessage: "Tiempo extra actualizado",
      invalidateKeys: [["reloj-horas-extra"], ["reloj-asistencia"]],
      onSuccess: () => setDecision(null),
    },
  );

  const abrir = (fila: HoraExtra, estado: "AUTORIZADA" | "RECHAZADA") => {
    setDecision({ fila, estado });
    setMinutos(String(fila.MINUTOS_AUTORIZADOS || fila.MINUTOS_CALCULADOS));
    setComentario(fila.COMENTARIO ?? "");
  };

  const guardar = async () => {
    if (!decision) return;
    if (decision.estado === "AUTORIZADA") {
      const m = Number(minutos);
      if (!Number.isInteger(m) || m <= 0 || m > decision.fila.MINUTOS_CALCULADOS) {
        await showWarning(`Los minutos deben estar entre 1 y ${decision.fila.MINUTOS_CALCULADOS}`);
        return;
      }
    } else if (comentario.trim().length < 5) {
      await showWarning("Indica el motivo del rechazo");
      return;
    }
    decidir.mutate();
  };

  const pendientes = data.filter((f) => f.ESTADO === "PENDIENTE");

  return (
    <Box>
      {isFetching && <LoaderOverlay label="Calculando tiempo extra..." />}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Se propone tiempo extra cuando la salida pasa al menos 30 minutos de la hora programada, o cuando se
        trabaja en descanso o festivo. {pendientes.length} por revisar (
        {minutosTexto(pendientes.reduce((s, f) => s + f.MINUTOS_CALCULADOS, 0))}).
      </Typography>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Empleado</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Horario</TableCell>
              <TableCell>Checadas</TableCell>
              <TableCell>Extra registrado</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((f) => (
              <TableRow key={`${f.USUARIOID}-${f.FECHA}`} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={800}>{f.NOMBRE}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {[f.NUMERO_EMPLEADO, f.SUCURSAL_CLAVE].filter(Boolean).join(" · ")}
                  </Typography>
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>
                  {f.FECHA}
                  <Typography variant="caption" display="block" color="text.secondary">
                    {estadoDia(f.ESTADO_DIA).label}
                  </Typography>
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>
                  {f.HORARIO ? `${f.HORARIO.HORA_ENTRADA}–${f.HORARIO.HORA_SALIDA}` : "Descanso"}
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>{hora(f.ENTRADA)} – {hora(f.SALIDA)}</TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>{minutosTexto(f.MINUTOS_CALCULADOS)}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    color={COLOR_ESTADO[f.ESTADO]}
                    label={
                      f.ESTADO === "AUTORIZADA"
                        ? `Autorizada ${minutosTexto(f.MINUTOS_AUTORIZADOS ?? 0)}`
                        : f.ESTADO === "RECHAZADA"
                          ? "Rechazada"
                          : "Pendiente"
                    }
                  />
                  {f.AUTORIZO_NOMBRE && (
                    <Typography variant="caption" display="block" color="text.secondary">
                      {f.AUTORIZO_NOMBRE}
                      {f.COMENTARIO ? ` · ${f.COMENTARIO}` : ""}
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <PermissionButton allowed={puedeAprobar} size="small" variant="outlined" color="success" onClick={() => abrir(f, "AUTORIZADA")}>
                      Autorizar
                    </PermissionButton>
                    <PermissionButton allowed={puedeAprobar} size="small" variant="outlined" color="error" onClick={() => abrir(f, "RECHAZADA")}>
                      Rechazar
                    </PermissionButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {!data.length && !isFetching && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography color="text.secondary" sx={{ p: 1 }}>Sin tiempo extra en este periodo.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!decision} onClose={() => setDecision(null)} maxWidth="xs" fullWidth>
        {decision && (
          <>
            <DialogTitle>
              {decision.estado === "AUTORIZADA" ? "Autorizar tiempo extra" : "Rechazar tiempo extra"}
            </DialogTitle>
            <DialogContent>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {decision.fila.NOMBRE} · {decision.fila.FECHA} · registró {minutosTexto(decision.fila.MINUTOS_CALCULADOS)}
              </Typography>
              <Stack spacing={2}>
                {decision.estado === "AUTORIZADA" && (
                  <TextField
                    label="Minutos a autorizar"
                    type="number"
                    value={minutos}
                    onChange={(e) => setMinutos(e.target.value)}
                    helperText={`Máximo ${decision.fila.MINUTOS_CALCULADOS} (lo registrado en las checadas)`}
                  />
                )}
                <TextField
                  label={decision.estado === "AUTORIZADA" ? "Comentario (opcional)" : "Motivo del rechazo"}
                  multiline
                  minRows={2}
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  required={decision.estado === "RECHAZADA"}
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDecision(null)}>Cancelar</Button>
              <Button variant="contained" onClick={guardar} disabled={decidir.isPending}>
                Guardar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
