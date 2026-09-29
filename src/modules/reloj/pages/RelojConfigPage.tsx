import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Link,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "../../../shared/components/PageHeader";
import LoaderOverlay from "../../../shared/components/LoaderOverlay";
import PermissionButton from "../../../shared/components/PermissionButton";
import { useAppMutation } from "../../../shared/hooks/useAppMutation";
import { usePermissions } from "../../../shared/hooks/usePermissions";
import { confirmDelete, showError, showWarning } from "../../../shared/utils/swal";
import {
  RelojService,
  diasTexto,
  hoyIso,
  mapaUrl,
  sumarDias,
  type Horario,
  type Rev,
  type Ubicacion,
} from "../../../services/reloj";
import { SelectorDias } from "../components/comunes";
import { useSucursales } from "../components/useReloj";

const TIPOS_UBICACION = [
  { value: "MATRIZ", label: "Matriz" },
  { value: "SUCURSAL", label: "Sucursal" },
  { value: "POLIZA", label: "Póliza / cliente" },
  { value: "OTRO", label: "Otro" },
];

function useEditar() {
  const { canEdit } = usePermissions();
  return canEdit("RELOJ_CONFIG");
}

// ---------------------------------------------------------------- Ubicaciones

const ubicacionVacia = (): Partial<Ubicacion> => ({
  NOMBRE: "",
  TIPO: "SUCURSAL",
  SUCURSALID: null,
  LATITUD: undefined,
  LONGITUD: undefined,
  RADIO_M: 150,
  DIRECCION: "",
  ACTIVO: 1,
});

function Ubicaciones() {
  const puedeEditar = useEditar();
  const sucursales = useSucursales();
  const [form, setForm] = useState<Partial<Ubicacion> | null>(null);
  const [buscando, setBuscando] = useState(false);

  const { data = [], isFetching } = useQuery({ queryKey: ["reloj-ubicaciones"], queryFn: RelojService.ubicaciones });

  const guardar = useAppMutation(() => RelojService.guardarUbicacion(form!), {
    successMessage: "Ubicación guardada",
    invalidateKeys: [["reloj-ubicaciones"]],
    onSuccess: () => setForm(null),
  });

  const usarMiUbicacion = () => {
    if (!window.isSecureContext || !navigator.geolocation) {
      showError("Para tomar la ubicación del celular se necesita HTTPS. Captura las coordenadas desde Google Maps.");
      return;
    }
    setBuscando(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setBuscando(false);
        setForm((f) => ({ ...f, LATITUD: +p.coords.latitude.toFixed(7), LONGITUD: +p.coords.longitude.toFixed(7) }));
      },
      () => {
        setBuscando(false);
        showError("No se pudo obtener la ubicación");
      },
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 },
    );
  };

  const enviar = async () => {
    if (!form?.NOMBRE?.trim()) return showWarning("El nombre es obligatorio");
    if (form.LATITUD == null || form.LONGITUD == null || Number.isNaN(form.LATITUD) || Number.isNaN(form.LONGITUD))
      return showWarning("Captura latitud y longitud");
    guardar.mutate();
  };

  return (
    <Box>
      {isFetching && <LoaderOverlay label="Cargando..." />}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }} gap={1} flexWrap="wrap">
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 720 }}>
          Geocercas donde se puede checar. Una checada fuera del radio de las ubicaciones permitidas al empleado
          (su sucursal, su lugar habitual o el lugar del turno) se registra, pero queda marcada para revisión.
        </Typography>
        <PermissionButton allowed={puedeEditar} variant="contained" startIcon={<AddIcon />} onClick={() => setForm(ubicacionVacia())}>
          Nueva ubicación
        </PermissionButton>
      </Stack>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Sucursal</TableCell>
              <TableCell>Coordenadas</TableCell>
              <TableCell>Radio</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((u) => (
              <TableRow key={u.UBICACIONID} hover sx={{ opacity: u.ACTIVO ? 1 : 0.5 }}>
                <TableCell>
                  <Typography variant="body2" fontWeight={800}>{u.NOMBRE}</Typography>
                  <Typography variant="caption" color="text.secondary">{u.DIRECCION}</Typography>
                </TableCell>
                <TableCell>{TIPOS_UBICACION.find((t) => t.value === u.TIPO)?.label ?? u.TIPO}</TableCell>
                <TableCell>{u.SUCURSAL_CLAVE ?? "—"}</TableCell>
                <TableCell>
                  <Link href={mapaUrl(u.LATITUD, u.LONGITUD)} target="_blank" rel="noopener">
                    {u.LATITUD.toFixed(5)}, {u.LONGITUD.toFixed(5)}
                  </Link>
                </TableCell>
                <TableCell>{u.RADIO_M} m</TableCell>
                <TableCell align="right">
                  <PermissionButton allowed={puedeEditar} size="small" variant="outlined" onClick={() => setForm(u)}>
                    Editar
                  </PermissionButton>
                </TableCell>
              </TableRow>
            ))}
            {!data.length && !isFetching && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography color="text.secondary" sx={{ p: 1 }}>
                    Aún no hay ubicaciones. Da de alta la matriz y cada sucursal para poder validar las checadas.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!form} onClose={() => setForm(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{form?.UBICACIONID ? "Editar ubicación" : "Nueva ubicación"}</DialogTitle>
        {form && (
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Nombre" required value={form.NOMBRE ?? ""} onChange={(e) => setForm({ ...form, NOMBRE: e.target.value })} />
              <Stack direction="row" spacing={1}>
                <TextField fullWidth select label="Tipo" value={form.TIPO} onChange={(e) => setForm({ ...form, TIPO: e.target.value as Ubicacion["TIPO"] })}>
                  {TIPOS_UBICACION.map((t) => (
                    <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                  ))}
                </TextField>
                <TextField fullWidth select label="Sucursal" value={form.SUCURSALID ?? ""} onChange={(e) => setForm({ ...form, SUCURSALID: e.target.value || null })} helperText="Sus empleados podrán checar aquí">
                  <MenuItem value="">Ninguna</MenuItem>
                  {sucursales.map((s) => (
                    <MenuItem key={s.SUCURSALID} value={String(s.SUCURSALID)}>{s.CLAVE} - {s.NOMBRE}</MenuItem>
                  ))}
                </TextField>
              </Stack>
              <Button variant="outlined" startIcon={<MyLocationIcon />} onClick={usarMiUbicacion} disabled={buscando}>
                {buscando ? "Obteniendo ubicación..." : "Usar mi ubicación actual (estando en el lugar)"}
              </Button>
              <Stack direction="row" spacing={1}>
                <TextField fullWidth type="number" label="Latitud" value={form.LATITUD ?? ""} onChange={(e) => setForm({ ...form, LATITUD: e.target.value === "" ? undefined : Number(e.target.value) })} />
                <TextField fullWidth type="number" label="Longitud" value={form.LONGITUD ?? ""} onChange={(e) => setForm({ ...form, LONGITUD: e.target.value === "" ? undefined : Number(e.target.value) })} />
                <TextField sx={{ width: 160 }} type="number" label="Radio (m)" value={form.RADIO_M ?? 150} onChange={(e) => setForm({ ...form, RADIO_M: Number(e.target.value) })} />
              </Stack>
              <Typography variant="caption" color="text.secondary">
                También puedes copiar las coordenadas desde Google Maps (clic derecho sobre el lugar). Un radio de
                100 a 200 m funciona bien; el GPS dentro de edificios puede desviarse.
              </Typography>
              <TextField label="Dirección" value={form.DIRECCION ?? ""} onChange={(e) => setForm({ ...form, DIRECCION: e.target.value })} />
              <FormControlLabel control={<Switch checked={form.ACTIVO === 1} onChange={(e) => setForm({ ...form, ACTIVO: e.target.checked ? 1 : 0 })} />} label="Activa" />
            </Stack>
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={() => setForm(null)}>Cancelar</Button>
          <Button variant="contained" onClick={enviar} disabled={guardar.isPending}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ---------------------------------------------------------------- Horarios

function Horarios() {
  const puedeEditar = useEditar();
  const [form, setForm] = useState<Partial<Horario> | null>(null);
  const { data = [], isFetching } = useQuery({ queryKey: ["reloj-horarios"], queryFn: RelojService.horarios });

  const guardar = useAppMutation(() => RelojService.guardarHorario(form!), {
    successMessage: "Horario guardado",
    invalidateKeys: [["reloj-horarios"], ["reloj-asistencia"]],
    onSuccess: () => setForm(null),
  });

  return (
    <Box>
      {isFetching && <LoaderOverlay label="Cargando..." />}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }} gap={1} flexWrap="wrap">
        <Typography variant="body2" color="text.secondary">
          Horarios fijos. La tolerancia se cuenta al minuto: con entrada 7:30 y 15 min, 7:45 es a tiempo y 7:46 es retardo.
        </Typography>
        <PermissionButton
          allowed={puedeEditar}
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setForm({ CLAVE: "", NOMBRE: "", HORA_ENTRADA: "08:00", HORA_SALIDA: "17:30", TOLERANCIA_MIN: 15, DIAS: "1111100", ACTIVO: 1 })}
        >
          Nuevo horario
        </PermissionButton>
      </Stack>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Entrada</TableCell>
              <TableCell>Tolerancia</TableCell>
              <TableCell>Retardo desde</TableCell>
              <TableCell>Salida</TableCell>
              <TableCell>Días</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((h) => {
              const [hh, mm] = h.HORA_ENTRADA.split(":").map(Number);
              const retardo = hh * 60 + mm + h.TOLERANCIA_MIN + 1;
              return (
                <TableRow key={h.HORARIOID} hover sx={{ opacity: h.ACTIVO ? 1 : 0.5 }}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={800}>{h.NOMBRE}</Typography>
                    <Typography variant="caption" color="text.secondary">{h.CLAVE}</Typography>
                  </TableCell>
                  <TableCell>{h.HORA_ENTRADA}</TableCell>
                  <TableCell>{h.TOLERANCIA_MIN} min</TableCell>
                  <TableCell>{`${String(Math.floor(retardo / 60)).padStart(2, "0")}:${String(retardo % 60).padStart(2, "0")}`}</TableCell>
                  <TableCell>{h.HORA_SALIDA}</TableCell>
                  <TableCell>{diasTexto(h.DIAS)}</TableCell>
                  <TableCell align="right">
                    <PermissionButton allowed={puedeEditar} size="small" variant="outlined" onClick={() => setForm(h)}>
                      Editar
                    </PermissionButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!form} onClose={() => setForm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{form?.HORARIOID ? "Editar horario" : "Nuevo horario"}</DialogTitle>
        {form && (
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Clave" required value={form.CLAVE ?? ""} onChange={(e) => setForm({ ...form, CLAVE: e.target.value.toUpperCase() })} />
              <TextField label="Nombre" required value={form.NOMBRE ?? ""} onChange={(e) => setForm({ ...form, NOMBRE: e.target.value })} />
              <Stack direction="row" spacing={1}>
                <TextField fullWidth type="time" label="Entrada" value={form.HORA_ENTRADA} onChange={(e) => setForm({ ...form, HORA_ENTRADA: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
                <TextField fullWidth type="time" label="Salida" value={form.HORA_SALIDA} onChange={(e) => setForm({ ...form, HORA_SALIDA: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
              </Stack>
              <TextField type="number" label="Tolerancia (min)" value={form.TOLERANCIA_MIN} onChange={(e) => setForm({ ...form, TOLERANCIA_MIN: Number(e.target.value) })} />
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Días que se trabajan</Typography>
                <SelectorDias value={form.DIAS ?? "1111100"} onChange={(v) => setForm({ ...form, DIAS: v })} />
              </Box>
              <FormControlLabel control={<Switch checked={form.ACTIVO === 1} onChange={(e) => setForm({ ...form, ACTIVO: e.target.checked ? 1 : 0 })} />} label="Activo" />
            </Stack>
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={() => setForm(null)}>Cancelar</Button>
          <Button variant="contained" onClick={() => guardar.mutate()} disabled={guardar.isPending}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ---------------------------------------------------------------- Festivos

function Festivos() {
  const puedeEditar = useEditar();
  const sucursales = useSucursales();
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [form, setForm] = useState<{ FECHA: string; NOMBRE: string; SUCURSALID: string } | null>(null);

  const { data = [], isFetching } = useQuery({ queryKey: ["reloj-festivos", anio], queryFn: () => RelojService.festivos(anio) });

  const crear = useAppMutation(() => RelojService.crearFestivo({ ...form!, SUCURSALID: form!.SUCURSALID || null }), {
    successMessage: "Día festivo agregado",
    invalidateKeys: [["reloj-festivos"], ["reloj-asistencia"]],
    onSuccess: () => setForm(null),
  });
  const eliminar = useAppMutation((id: number) => RelojService.eliminarFestivo(id), {
    successMessage: "Día festivo eliminado",
    invalidateKeys: [["reloj-festivos"], ["reloj-asistencia"]],
  });

  return (
    <Box>
      {isFetching && <LoaderOverlay label="Cargando..." />}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }} gap={1} flexWrap="wrap">
        <Stack direction="row" spacing={1} alignItems="center">
          <Button size="small" onClick={() => setAnio(anio - 1)}>‹</Button>
          <Typography fontWeight={900}>{anio}</Typography>
          <Button size="small" onClick={() => setAnio(anio + 1)}>›</Button>
          <Typography variant="body2" color="text.secondary">
            Los festivos no generan faltas; si alguien trabaja, todo cuenta como tiempo extra.
          </Typography>
        </Stack>
        <PermissionButton allowed={puedeEditar} variant="contained" startIcon={<AddIcon />} onClick={() => setForm({ FECHA: hoyIso(), NOMBRE: "", SUCURSALID: "" })}>
          Agregar festivo
        </PermissionButton>
      </Stack>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Aplica a</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((f) => (
              <TableRow key={f.FESTIVOID} hover>
                <TableCell sx={{ textTransform: "capitalize" }}>
                  {new Date(`${f.FECHA}T12:00:00`).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
                </TableCell>
                <TableCell>{f.NOMBRE}</TableCell>
                <TableCell>{f.SUCURSAL_CLAVE ?? "Todas las sucursales"}</TableCell>
                <TableCell align="right">
                  <PermissionButton
                    allowed={puedeEditar}
                    size="small"
                    color="error"
                    variant="outlined"
                    onClick={async () => {
                      if (await confirmDelete(`¿Eliminar el festivo "${f.NOMBRE}"?`)) eliminar.mutate(f.FESTIVOID);
                    }}
                  >
                    Eliminar
                  </PermissionButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!form} onClose={() => setForm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Agregar día festivo</DialogTitle>
        {form && (
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField type="date" label="Fecha" value={form.FECHA} onChange={(e) => setForm({ ...form, FECHA: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
              <TextField label="Nombre" required value={form.NOMBRE} onChange={(e) => setForm({ ...form, NOMBRE: e.target.value })} />
              <TextField select label="Aplica a" value={form.SUCURSALID} onChange={(e) => setForm({ ...form, SUCURSALID: e.target.value })}>
                <MenuItem value="">Todas las sucursales</MenuItem>
                {sucursales.map((s) => (
                  <MenuItem key={s.SUCURSALID} value={String(s.SUCURSALID)}>{s.CLAVE} - {s.NOMBRE}</MenuItem>
                ))}
              </TextField>
            </Stack>
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={() => setForm(null)}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={crear.isPending}
            onClick={() => (form?.NOMBRE.trim() ? crear.mutate() : showWarning("Escribe el nombre del festivo"))}
          >
            Agregar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ---------------------------------------------------------------- REV por sucursal

function Revs() {
  const puedeEditar = useEditar();
  const sucursales = useSucursales();
  const [form, setForm] = useState<{ USUARIOID: number | null; SUCURSALES: string[] } | null>(null);

  const { data = [], isFetching } = useQuery({ queryKey: ["reloj-revs"], queryFn: RelojService.revs });
  const { data: usuarios = [] } = useQuery({ queryKey: ["reloj-usuarios"], queryFn: RelojService.usuarios, enabled: !!form });

  const guardar = useAppMutation(() => RelojService.guardarRev(form!.USUARIOID!, form!.SUCURSALES), {
    successMessage: "Sucursales del REV guardadas",
    invalidateKeys: [["reloj-revs"]],
    onSuccess: () => setForm(null),
  });

  const editar = (r?: Rev) => setForm({ USUARIOID: r?.USUARIOID ?? null, SUCURSALES: r?.SUCURSALES ?? [] });

  return (
    <Box>
      {isFetching && <LoaderOverlay label="Cargando..." />}
      <Alert severity="info" sx={{ mb: 1.5 }}>
        Un REV solo ve y autoriza a los empleados de las sucursales que tenga asignadas aquí (si no tiene ninguna,
        solo la suya). Además necesita el permiso <b>ASISTENCIA (REV)</b> en Permisos: VER para consultar, EDITAR
        para turnos, incidencias y revisar checadas, y APROBAR para autorizar tiempo extra. Quien tiene VER en
        Configuración reloj ve todas las sucursales.
      </Alert>
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1.5 }}>
        <PermissionButton allowed={puedeEditar} variant="contained" startIcon={<AddIcon />} onClick={() => editar()}>
          Asignar REV
        </PermissionButton>
      </Stack>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>REV</TableCell>
              <TableCell>Sucursales</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((r) => (
              <TableRow key={r.USUARIOID} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={800}>{r.NOMBRE}</Typography>
                  <Typography variant="caption" color="text.secondary">{r.NUMERO_EMPLEADO}</Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {r.SUCURSALES_CLAVE.map((s) => <Chip key={s} size="small" label={s} />)}
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  <PermissionButton allowed={puedeEditar} size="small" variant="outlined" onClick={() => editar(r)}>
                    Editar
                  </PermissionButton>
                </TableCell>
              </TableRow>
            ))}
            {!data.length && !isFetching && (
              <TableRow>
                <TableCell colSpan={3}>
                  <Typography color="text.secondary" sx={{ p: 1 }}>Aún no hay REV asignados.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!form} onClose={() => setForm(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Sucursales del REV</DialogTitle>
        {form && (
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Autocomplete
                options={usuarios}
                value={usuarios.find((u) => u.USUARIOID === form.USUARIOID) ?? null}
                onChange={(_, v) => setForm({ ...form, USUARIOID: v?.USUARIOID ?? null })}
                getOptionLabel={(u) => `${u.NOMBRE}${u.NUMERO_EMPLEADO ? ` (${u.NUMERO_EMPLEADO})` : ""}${u.SUCURSAL_CLAVE ? ` · ${u.SUCURSAL_CLAVE}` : ""}`}
                isOptionEqualToValue={(a, b) => a.USUARIOID === b.USUARIOID}
                renderInput={(params) => <TextField {...params} label="Usuario REV" required />}
              />
              <Autocomplete
                multiple
                disableCloseOnSelect
                options={sucursales.map((s) => String(s.SUCURSALID))}
                value={form.SUCURSALES}
                onChange={(_, v) => setForm({ ...form, SUCURSALES: v })}
                getOptionLabel={(id) => {
                  const s = sucursales.find((x) => String(x.SUCURSALID) === id);
                  return s ? `${s.CLAVE} - ${s.NOMBRE}` : id;
                }}
                renderInput={(params) => <TextField {...params} label="Sucursales que revisa" />}
              />
            </Stack>
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={() => setForm(null)}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={guardar.isPending}
            onClick={() => (form?.USUARIOID ? guardar.mutate() : showWarning("Selecciona el usuario"))}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ---------------------------------------------------------------- Integridad

function Integridad() {
  const [rango, setRango] = useState({ desde: sumarDias(hoyIso(), -30), hasta: hoyIso() });
  const [consulta, setConsulta] = useState<typeof rango | null>(null);
  const { data, isFetching } = useQuery({
    queryKey: ["reloj-integridad", consulta],
    queryFn: () => RelojService.integridad(consulta!),
    enabled: !!consulta,
  });

  return (
    <Box>
      {isFetching && <LoaderOverlay label="Verificando registros..." />}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, maxWidth: 760 }}>
        Cada checada lleva una firma (hash) que encadena sus datos, su foto y la checada anterior del mismo
        empleado. Esta verificación recalcula las firmas: si alguien modificó o borró un registro directamente en
        la base de datos, o reemplazó una foto, aparece aquí.
      </Typography>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <TextField size="small" type="date" label="Desde" value={rango.desde} onChange={(e) => setRango({ ...rango, desde: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField size="small" type="date" label="Hasta" value={rango.hasta} onChange={(e) => setRango({ ...rango, hasta: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
        <Button variant="contained" onClick={() => setConsulta({ ...rango })}>Verificar</Button>
      </Stack>
      {data && (
        data.PROBLEMAS.length === 0 ? (
          <Alert severity="success">
            {data.REVISADAS} checadas de {data.EMPLEADOS} empleado(s) verificadas: ningún registro fue alterado.
          </Alert>
        ) : (
          <Alert severity="error">
            <Typography fontWeight={900}>{data.PROBLEMAS.length} registro(s) con alteraciones</Typography>
            {data.PROBLEMAS.map((p) => (
              <Typography key={p.CHECADAID} variant="body2">
                Checada {p.CHECADAID} · usuario {p.USUARIOID} · {p.FECHA_HORA.replace("T", " ")}: {p.MOTIVO}
              </Typography>
            ))}
          </Alert>
        )
      )}
    </Box>
  );
}

// ----------------------------------------------------------------

const PESTANAS = ["Ubicaciones", "Horarios", "Días festivos", "REV por sucursal", "Integridad"];

export default function RelojConfigPage() {
  const [pestana, setPestana] = useState(0);
  return (
    <Box sx={{ width: "100%" }}>
      <PageHeader title="Configuración del reloj checador" subtitle="Geocercas, horarios, festivos y responsables por sucursal." />
      <Paper sx={{ mb: 2 }}>
        <Tabs value={pestana} onChange={(_, v) => setPestana(v)} variant="scrollable" scrollButtons="auto">
          {PESTANAS.map((p) => <Tab key={p} label={p} />)}
        </Tabs>
      </Paper>
      {pestana === 0 && <Ubicaciones />}
      {pestana === 1 && <Horarios />}
      {pestana === 2 && <Festivos />}
      {pestana === 3 && <Revs />}
      {pestana === 4 && <Integridad />}
    </Box>
  );
}
