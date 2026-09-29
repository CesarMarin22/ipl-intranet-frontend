import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
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
import AddIcon from "@mui/icons-material/Add";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import LoaderOverlay from "../../../shared/components/LoaderOverlay";
import PermissionButton from "../../../shared/components/PermissionButton";
import { useAppMutation } from "../../../shared/hooks/useAppMutation";
import { usePermissions } from "../../../shared/hooks/usePermissions";
import { confirmDelete, showWarning } from "../../../shared/utils/swal";
import { RelojService, diasTexto, hoyIso, inicioSemana, sumarDias } from "../../../services/reloj";
import { SelectorDias, SelectorEmpleados, type FiltrosPanel } from "./comunes";

const PLANTILLAS = [
  { nombre: "Mañana", entrada: "06:00", salida: "14:00" },
  { nombre: "Tarde", entrada: "14:00", salida: "22:00" },
  { nombre: "Noche", entrada: "22:00", salida: "06:00" },
];

export default function TabTurnos({ filtros }: { filtros: FiltrosPanel }) {
  const { canEdit } = usePermissions();
  const puedeEditar = canEdit("RELOJ_ASISTENCIA");
  const [abierto, setAbierto] = useState(false);

  const lunes = inicioSemana(sumarDias(hoyIso(), 7));
  const [form, setForm] = useState({
    USUARIOIDS: [] as number[],
    FECHA_INICIO: lunes,
    FECHA_FIN: sumarDias(lunes, 6),
    HORA_ENTRADA: "06:00",
    HORA_SALIDA: "14:00",
    TOLERANCIA_MIN: 15,
    DIAS: "1111100",
    UBICACIONID: "" as number | "",
    COMENTARIO: "",
  });

  // Los turnos se listan desde la fecha inicial del filtro hasta 8 semanas adelante
  const consulta = { ...filtros, hasta: sumarDias(filtros.desde, 62) };
  const { data = [], isFetching } = useQuery({
    queryKey: ["reloj-asignaciones", consulta],
    queryFn: () => RelojService.asignaciones(consulta),
  });
  const { data: ubicaciones = [] } = useQuery({ queryKey: ["reloj-ubicaciones"], queryFn: RelojService.ubicaciones });

  const crear = useAppMutation(
    () => RelojService.crearAsignacion({ ...form, UBICACIONID: form.UBICACIONID || null }),
    {
      successMessage: "Turno asignado",
      invalidateKeys: [["reloj-asignaciones"], ["reloj-asistencia"]],
      onSuccess: () => setAbierto(false),
    },
  );

  const eliminar = useAppMutation((id: number) => RelojService.eliminarAsignacion(id), {
    successMessage: "Turno eliminado",
    invalidateKeys: [["reloj-asignaciones"], ["reloj-asistencia"]],
  });

  const guardar = async () => {
    if (!form.USUARIOIDS.length) return showWarning("Selecciona al menos un empleado");
    if (!form.FECHA_INICIO || !form.FECHA_FIN || form.FECHA_FIN < form.FECHA_INICIO)
      return showWarning("Revisa el rango de fechas");
    if (form.DIAS === "0000000") return showWarning("Selecciona los días que se trabajan");
    crear.mutate();
  };

  return (
    <Box>
      {isFetching && <LoaderOverlay label="Cargando turnos..." />}

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }} gap={1} flexWrap="wrap">
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 720 }}>
          Un turno manda sobre el horario fijo del empleado en esas fechas. Úsalo para técnicos de póliza,
          rotación mañana/tarde o quien trabaja sábado o domingo. Los días no marcados del turno son descanso.
        </Typography>
        <PermissionButton allowed={puedeEditar} variant="contained" startIcon={<AddIcon />} onClick={() => setAbierto(true)}>
          Asignar turno
        </PermissionButton>
      </Stack>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Empleado</TableCell>
              <TableCell>Fechas</TableCell>
              <TableCell>Horario</TableCell>
              <TableCell>Días</TableCell>
              <TableCell>Lugar</TableCell>
              <TableCell>Comentario</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((a) => (
              <TableRow key={a.ASIGNACIONID} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={800}>{a.NOMBRE}</Typography>
                  <Typography variant="caption" color="text.secondary">{a.SUCURSAL_CLAVE}</Typography>
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>{a.FECHA_INICIO} → {a.FECHA_FIN}</TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>
                  {a.HORA_ENTRADA}–{a.HORA_SALIDA}
                  <Typography variant="caption" display="block" color="text.secondary">tolerancia {a.TOLERANCIA_MIN} min</Typography>
                </TableCell>
                <TableCell>{diasTexto(a.DIAS)}</TableCell>
                <TableCell>{a.UBICACION_NOMBRE ?? "—"}</TableCell>
                <TableCell>
                  {a.COMENTARIO}
                  <Typography variant="caption" display="block" color="text.secondary">{a.CREADO_POR_NOMBRE}</Typography>
                </TableCell>
                <TableCell align="right">
                  <PermissionButton
                    allowed={puedeEditar}
                    size="small"
                    color="error"
                    variant="outlined"
                    onClick={async () => {
                      if (await confirmDelete(`¿Eliminar el turno de ${a.NOMBRE}?`, "Eliminar turno")) eliminar.mutate(a.ASIGNACIONID);
                    }}
                  >
                    Eliminar
                  </PermissionButton>
                </TableCell>
              </TableRow>
            ))}
            {!data.length && !isFetching && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography color="text.secondary" sx={{ p: 1 }}>Sin turnos asignados en este periodo.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={abierto} onClose={() => setAbierto(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Asignar turno</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <SelectorEmpleados value={form.USUARIOIDS} onChange={(v) => setForm({ ...form, USUARIOIDS: v })} />
            <Stack direction="row" spacing={1}>
              <TextField fullWidth type="date" label="Desde" value={form.FECHA_INICIO} onChange={(e) => setForm({ ...form, FECHA_INICIO: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
              <TextField fullWidth type="date" label="Hasta" value={form.FECHA_FIN} onChange={(e) => setForm({ ...form, FECHA_FIN: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {PLANTILLAS.map((p) => (
                <Button key={p.nombre} size="small" variant="outlined" onClick={() => setForm({ ...form, HORA_ENTRADA: p.entrada, HORA_SALIDA: p.salida, COMENTARIO: form.COMENTARIO || `Turno ${p.nombre.toLowerCase()}` })}>
                  {p.nombre} {p.entrada}–{p.salida}
                </Button>
              ))}
            </Stack>
            <Stack direction="row" spacing={1}>
              <TextField fullWidth type="time" label="Entrada" value={form.HORA_ENTRADA} onChange={(e) => setForm({ ...form, HORA_ENTRADA: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
              <TextField fullWidth type="time" label="Salida" value={form.HORA_SALIDA} onChange={(e) => setForm({ ...form, HORA_SALIDA: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} helperText={form.HORA_SALIDA <= form.HORA_ENTRADA ? "Sale al día siguiente" : " "} />
              <TextField sx={{ width: 150 }} type="number" label="Tolerancia (min)" value={form.TOLERANCIA_MIN} onChange={(e) => setForm({ ...form, TOLERANCIA_MIN: Number(e.target.value) })} />
            </Stack>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Días que trabaja</Typography>
              <SelectorDias value={form.DIAS} onChange={(v) => setForm({ ...form, DIAS: v })} />
            </Box>
            <TextField select label="Lugar (póliza / cliente)" value={form.UBICACIONID} onChange={(e) => setForm({ ...form, UBICACIONID: e.target.value === "" ? "" : Number(e.target.value) })} helperText="Si checa fuera de este lugar (o de su sucursal) queda marcado para revisión">
              <MenuItem value="">Su lugar habitual</MenuItem>
              {ubicaciones.filter((u) => u.ACTIVO === 1).map((u) => (
                <MenuItem key={u.UBICACIONID} value={u.UBICACIONID}>{u.NOMBRE} ({u.TIPO.toLowerCase()})</MenuItem>
              ))}
            </TextField>
            <TextField label="Comentario" value={form.COMENTARIO} onChange={(e) => setForm({ ...form, COMENTARIO: e.target.value })} placeholder="Ej. Póliza cliente X, semana de tarde" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAbierto(false)}>Cancelar</Button>
          <Button variant="contained" onClick={guardar} disabled={crear.isPending}>Asignar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
