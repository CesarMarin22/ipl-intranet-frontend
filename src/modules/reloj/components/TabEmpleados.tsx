import {
  Box,
  Button,
  Checkbox,
  Chip,
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
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import LoaderOverlay from "../../../shared/components/LoaderOverlay";
import PermissionButton from "../../../shared/components/PermissionButton";
import { useAppMutation } from "../../../shared/hooks/useAppMutation";
import { usePermissions } from "../../../shared/hooks/usePermissions";
import { showWarning } from "../../../shared/utils/swal";
import { RelojService, type Empleado } from "../../../services/reloj";
import type { FiltrosPanel } from "./comunes";

const SIN_CAMBIO = "__sin_cambio__";

export default function TabEmpleados({ filtros }: { filtros: FiltrosPanel }) {
  const { canEdit } = usePermissions();
  const puedeEditar = canEdit("RELOJ_ASISTENCIA");
  const [seleccion, setSeleccion] = useState<number[]>([]);
  const [asignar, setAsignar] = useState(false);
  const [horario, setHorario] = useState<string>(SIN_CAMBIO);
  const [ubicacion, setUbicacion] = useState<string>(SIN_CAMBIO);
  const [checa, setCheca] = useState<string>(SIN_CAMBIO);
  const [celulares, setCelulares] = useState<Empleado | null>(null);

  const { data = [], isFetching } = useQuery({
    queryKey: ["reloj-empleados", filtros.sucursal, filtros.q],
    queryFn: () => RelojService.empleados({ sucursal: filtros.sucursal, q: filtros.q }),
  });
  const { data: horarios = [] } = useQuery({ queryKey: ["reloj-horarios"], queryFn: RelojService.horarios });
  const { data: ubicaciones = [] } = useQuery({ queryKey: ["reloj-ubicaciones"], queryFn: RelojService.ubicaciones });

  const dispositivos = useQuery({
    queryKey: ["reloj-dispositivos", celulares?.USUARIOID],
    queryFn: () => RelojService.dispositivos(celulares!.USUARIOID),
    enabled: !!celulares,
  });

  const guardar = useAppMutation(
    () => {
      const body: Parameters<typeof RelojService.configurarEmpleados>[0] = { USUARIOIDS: seleccion };
      if (horario !== SIN_CAMBIO) body.HORARIOID = horario ? Number(horario) : null;
      if (ubicacion !== SIN_CAMBIO) body.UBICACIONID = ubicacion ? Number(ubicacion) : null;
      if (checa !== SIN_CAMBIO) body.CHECA = checa === "1";
      return RelojService.configurarEmpleados(body);
    },
    {
      successMessage: "Empleados actualizados",
      invalidateKeys: [["reloj-empleados"], ["reloj-asistencia"]],
      onSuccess: () => {
        setAsignar(false);
        setSeleccion([]);
      },
    },
  );

  const cambiarCelular = useAppMutation(
    (v: { id: number; accion: "autorizar" | "revocar" }) => RelojService.cambiarDispositivo(v.id, v.accion),
    { successMessage: "Celular actualizado", invalidateKeys: [["reloj-dispositivos"], ["reloj-empleados"]] },
  );

  const todos = useMemo(() => data.map((e) => e.USUARIOID), [data]);
  const todosMarcados = todos.length > 0 && todos.every((id) => seleccion.includes(id));

  const abrirAsignar = async () => {
    if (!seleccion.length) {
      await showWarning("Selecciona uno o varios empleados de la lista");
      return;
    }
    setHorario(SIN_CAMBIO);
    setUbicacion(SIN_CAMBIO);
    setCheca(SIN_CAMBIO);
    setAsignar(true);
  };

  return (
    <Box>
      {isFetching && <LoaderOverlay label="Cargando empleados..." />}

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }} gap={1} flexWrap="wrap">
        <Typography variant="body2" color="text.secondary">
          Horario fijo y lugar habitual de cada empleado. Selecciona varios para asignarles lo mismo de una vez.
          {data.filter((e) => !e.HORARIOID).length > 0 && ` ${data.filter((e) => !e.HORARIOID).length} sin horario.`}
        </Typography>
        <PermissionButton allowed={puedeEditar} variant="contained" onClick={abrirAsignar}>
          Asignar a seleccionados ({seleccion.length})
        </PermissionButton>
      </Stack>

      <TableContainer component={Paper} sx={{ maxHeight: "65vh" }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={todosMarcados}
                  indeterminate={!todosMarcados && seleccion.length > 0}
                  onChange={() => setSeleccion(todosMarcados ? [] : todos)}
                />
              </TableCell>
              <TableCell>Empleado</TableCell>
              <TableCell>Sucursal</TableCell>
              <TableCell>Horario</TableCell>
              <TableCell>Lugar habitual</TableCell>
              <TableCell>Celular</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((e) => (
              <TableRow key={e.USUARIOID} hover selected={seleccion.includes(e.USUARIOID)}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={seleccion.includes(e.USUARIOID)}
                    onChange={() =>
                      setSeleccion((s) => (s.includes(e.USUARIOID) ? s.filter((x) => x !== e.USUARIOID) : [...s, e.USUARIOID]))
                    }
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={800}>{e.NOMBRE}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {[e.NUMERO_EMPLEADO, e.PERFIL, e.DEPARTAMENTO].filter(Boolean).join(" · ")}
                  </Typography>
                </TableCell>
                <TableCell>{e.SUCURSAL_CLAVE}</TableCell>
                <TableCell>
                  {e.CHECA === 0 ? (
                    <Chip size="small" label="No checa" />
                  ) : e.HORARIO_NOMBRE ? (
                    e.HORARIO_NOMBRE
                  ) : (
                    <Chip size="small" color="warning" variant="outlined" label="Sin horario" />
                  )}
                </TableCell>
                <TableCell>{e.UBICACION_NOMBRE ?? "Geocercas de su sucursal"}</TableCell>
                <TableCell>
                  <Button
                    size="small"
                    startIcon={<PhoneAndroidIcon />}
                    color={e.DISPOSITIVOS_PENDIENTES ? "warning" : "inherit"}
                    onClick={() => setCelulares(e)}
                  >
                    {e.DISPOSITIVOS_ACTIVOS ? "Registrado" : "Sin registrar"}
                    {e.DISPOSITIVOS_PENDIENTES ? ` · ${e.DISPOSITIVOS_PENDIENTES} por autorizar` : ""}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={asignar} onClose={() => setAsignar(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Asignar a {seleccion.length} empleado(s)</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField select label="Horario fijo" value={horario} onChange={(e) => setHorario(e.target.value)}>
              <MenuItem value={SIN_CAMBIO}>(sin cambio)</MenuItem>
              <MenuItem value="">Sin horario</MenuItem>
              {horarios.filter((h) => h.ACTIVO === 1).map((h) => (
                <MenuItem key={h.HORARIOID} value={String(h.HORARIOID)}>
                  {h.NOMBRE} · {h.HORA_ENTRADA}–{h.HORA_SALIDA}
                </MenuItem>
              ))}
            </TextField>
            <TextField select label="Lugar habitual" value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} helperText="Además del lugar habitual, cuentan como válidas las geocercas de su sucursal">
              <MenuItem value={SIN_CAMBIO}>(sin cambio)</MenuItem>
              <MenuItem value="">Solo geocercas de su sucursal</MenuItem>
              {ubicaciones.filter((u) => u.ACTIVO === 1).map((u) => (
                <MenuItem key={u.UBICACIONID} value={String(u.UBICACIONID)}>{u.NOMBRE}</MenuItem>
              ))}
            </TextField>
            <TextField select label="¿Checa?" value={checa} onChange={(e) => setCheca(e.target.value)} helperText="Quien no checa no genera faltas ni retardos">
              <MenuItem value={SIN_CAMBIO}>(sin cambio)</MenuItem>
              <MenuItem value="1">Sí checa</MenuItem>
              <MenuItem value="0">No checa</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAsignar(false)}>Cancelar</Button>
          <Button variant="contained" onClick={() => guardar.mutate()} disabled={guardar.isPending}>Guardar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!celulares} onClose={() => setCelulares(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Celulares de {celulares?.NOMBRE}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Cada empleado checa desde un solo celular. El primero queda registrado solo; si cambia de celular,
            autoriza el nuevo aquí y el anterior se da de baja.
          </Typography>
          {dispositivos.isFetching && <Typography>Cargando...</Typography>}
          <Stack spacing={1}>
            {(dispositivos.data ?? []).map((d) => (
              <Paper key={d.DISPOSITIVOID} variant="outlined" sx={{ p: 1.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} flexWrap="wrap">
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Chip
                      size="small"
                      color={d.ESTADO === "ACTIVO" ? "success" : d.ESTADO === "PENDIENTE" ? "warning" : "default"}
                      label={d.ESTADO === "ACTIVO" ? "Activo" : d.ESTADO === "PENDIENTE" ? "Por autorizar" : "Revocado"}
                    />
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5, wordBreak: "break-word" }}>
                      {d.DESCRIPCION}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      Registrado {d.FECHA_REGISTRO?.slice(0, 16).replace("T", " ")} · último uso {d.ULTIMO_USO?.slice(0, 16).replace("T", " ") ?? "—"}
                    </Typography>
                    {d.COMPARTIDO_CON && (
                      <Typography variant="caption" display="block" color="error">
                        También lo usa: {d.COMPARTIDO_CON}
                      </Typography>
                    )}
                  </Box>
                  <Stack direction="row" spacing={1}>
                    {d.ESTADO !== "ACTIVO" && (
                      <PermissionButton allowed={puedeEditar} size="small" variant="outlined" color="success" onClick={() => cambiarCelular.mutate({ id: d.DISPOSITIVOID, accion: "autorizar" })}>
                        Autorizar
                      </PermissionButton>
                    )}
                    {d.ESTADO !== "REVOCADO" && (
                      <PermissionButton allowed={puedeEditar} size="small" variant="outlined" color="error" onClick={() => cambiarCelular.mutate({ id: d.DISPOSITIVOID, accion: "revocar" })}>
                        Revocar
                      </PermissionButton>
                    )}
                  </Stack>
                </Stack>
              </Paper>
            ))}
            {!dispositivos.isFetching && !(dispositivos.data ?? []).length && (
              <Typography color="text.secondary">Aún no ha checado desde ningún celular.</Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCelulares(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
