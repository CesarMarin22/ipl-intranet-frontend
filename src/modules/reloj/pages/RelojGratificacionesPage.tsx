import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
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
import PageHeader from "../../../shared/components/PageHeader";
import LoaderOverlay from "../../../shared/components/LoaderOverlay";
import PermissionButton from "../../../shared/components/PermissionButton";
import { useAppMutation } from "../../../shared/hooks/useAppMutation";
import { useDebouncedValue } from "../../../shared/hooks/useDebouncedValue";
import { usePermissions } from "../../../shared/hooks/usePermissions";
import { confirmDelete, showWarning } from "../../../shared/utils/swal";
import { RelojService, hoyIso, sumarDias } from "../../../services/reloj";
import { BarraFiltros, SelectorEmpleados, type FiltrosPanel } from "../components/comunes";

const MIN_JUSTIFICACION = 20;

const moneda = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

export default function RelojGratificacionesPage() {
  const { canCreate, canDelete } = usePermissions();
  const [filtros, setFiltros] = useState<FiltrosPanel>({
    desde: sumarDias(hoyIso(), -30),
    hasta: hoyIso(),
    sucursal: "",
    q: "",
  });
  const q = useDebouncedValue(filtros.q, 400);
  const consulta = { ...filtros, q };

  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState({ USUARIOID: 0, FECHA: hoyIso(), MONTO: "", JUSTIFICACION: "" });

  const { data = [], isFetching } = useQuery({
    queryKey: ["reloj-gratificaciones", consulta],
    queryFn: () => RelojService.gratificaciones(consulta),
  });

  const crear = useAppMutation(
    () =>
      RelojService.crearGratificacion({
        USUARIOID: form.USUARIOID,
        FECHA: form.FECHA,
        MONTO: form.MONTO ? Number(form.MONTO) : null,
        JUSTIFICACION: form.JUSTIFICACION.trim(),
      }),
    {
      successMessage: "Gratificación registrada",
      invalidateKeys: [["reloj-gratificaciones"]],
      onSuccess: () => setAbierto(false),
    },
  );

  const cancelar = useAppMutation((id: number) => RelojService.cancelarGratificacion(id), {
    successMessage: "Gratificación cancelada",
    invalidateKeys: [["reloj-gratificaciones"]],
  });

  const guardar = async () => {
    if (!form.USUARIOID) return showWarning("Selecciona el empleado");
    if (form.JUSTIFICACION.trim().length < MIN_JUSTIFICACION)
      return showWarning(`Explica por qué se da la gratificación (mínimo ${MIN_JUSTIFICACION} caracteres)`);
    if (form.MONTO && !(Number(form.MONTO) > 0)) return showWarning("El monto debe ser mayor a cero");
    crear.mutate();
  };

  const total = data.reduce((s, g) => s + (g.MONTO ?? 0), 0);

  return (
    <Box sx={{ width: "100%" }}>
      {isFetching && <LoaderOverlay label="Cargando gratificaciones..." />}

      <PageHeader
        title="Gratificaciones"
        subtitle="Registro de gratificaciones con su justificación. Cada registro guarda quién lo dio y cuándo."
        action={
          <PermissionButton
            allowed={canCreate("RELOJ_GRATIFICACIONES")}
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setForm({ USUARIOID: 0, FECHA: hoyIso(), MONTO: "", JUSTIFICACION: "" });
              setAbierto(true);
            }}
          >
            Registrar gratificación
          </PermissionButton>
        }
      />

      <BarraFiltros filtros={filtros} onChange={setFiltros} />

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {data.length} gratificación(es){total ? ` · total ${moneda(total)}` : ""}
      </Typography>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Empleado</TableCell>
              <TableCell align="right">Monto</TableCell>
              <TableCell>Justificación</TableCell>
              <TableCell>Registró</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((g) => (
              <TableRow key={g.GRATIFICACIONID} hover>
                <TableCell sx={{ whiteSpace: "nowrap" }}>{g.FECHA}</TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={800}>{g.NOMBRE}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {[g.NUMERO_EMPLEADO, g.SUCURSAL_CLAVE].filter(Boolean).join(" · ")}
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>{g.MONTO != null ? moneda(g.MONTO) : "—"}</TableCell>
                <TableCell sx={{ maxWidth: 420 }}>{g.JUSTIFICACION}</TableCell>
                <TableCell>
                  {g.CREADO_POR_NOMBRE}
                  <Typography variant="caption" display="block" color="text.secondary">
                    {g.FECHA_CREACION?.slice(0, 16).replace("T", " ")}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <PermissionButton
                    allowed={canDelete("RELOJ_GRATIFICACIONES")}
                    size="small"
                    color="error"
                    variant="outlined"
                    onClick={async () => {
                      if (await confirmDelete(`¿Cancelar la gratificación de ${g.NOMBRE}?`, "Cancelar gratificación"))
                        cancelar.mutate(g.GRATIFICACIONID);
                    }}
                  >
                    Cancelar
                  </PermissionButton>
                </TableCell>
              </TableRow>
            ))}
            {!data.length && !isFetching && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography color="text.secondary" sx={{ p: 1 }}>Sin gratificaciones en este periodo.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={abierto} onClose={() => setAbierto(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar gratificación</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <SelectorEmpleados
              multiple={false}
              label="Empleado"
              value={form.USUARIOID ? [form.USUARIOID] : []}
              onChange={(v) => setForm({ ...form, USUARIOID: v[0] ?? 0 })}
            />
            <Stack direction="row" spacing={1}>
              <TextField fullWidth type="date" label="Fecha" value={form.FECHA} onChange={(e) => setForm({ ...form, FECHA: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
              <TextField
                fullWidth
                type="number"
                label="Monto (opcional)"
                value={form.MONTO}
                onChange={(e) => setForm({ ...form, MONTO: e.target.value })}
                slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }}
              />
            </Stack>
            <TextField
              label="Justificación"
              required
              multiline
              minRows={4}
              value={form.JUSTIFICACION}
              onChange={(e) => setForm({ ...form, JUSTIFICACION: e.target.value })}
              placeholder="Qué hizo el empleado y por qué merece la gratificación"
              helperText={`${form.JUSTIFICACION.trim().length}/${MIN_JUSTIFICACION} caracteres mínimo`}
              error={form.JUSTIFICACION.length > 0 && form.JUSTIFICACION.trim().length < MIN_JUSTIFICACION}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAbierto(false)}>Cancelar</Button>
          <Button variant="contained" onClick={guardar} disabled={crear.isPending}>Registrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
