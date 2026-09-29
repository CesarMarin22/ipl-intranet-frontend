import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
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
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import LoaderOverlay from "../../../shared/components/LoaderOverlay";
import PermissionButton from "../../../shared/components/PermissionButton";
import { useAppMutation } from "../../../shared/hooks/useAppMutation";
import { usePermissions } from "../../../shared/hooks/usePermissions";
import { confirmDelete, showWarning } from "../../../shared/utils/swal";
import { RelojService, hoyIso } from "../../../services/reloj";
import { SelectorEmpleados, type FiltrosPanel } from "./comunes";

const vacio = () => ({
  USUARIOID: 0,
  TIPO: "INCAPACIDAD",
  FECHA_INICIO: hoyIso(),
  FECHA_FIN: hoyIso(),
  FOLIO: "",
  COMENTARIO: "",
  archivo: null as File | null,
});

export default function TabIncidencias({ filtros }: { filtros: FiltrosPanel }) {
  const { canEdit } = usePermissions();
  const puedeEditar = canEdit("RELOJ_ASISTENCIA");
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState(vacio);

  const { data = [], isFetching } = useQuery({
    queryKey: ["reloj-incidencias", filtros],
    queryFn: () => RelojService.incidencias(filtros),
  });
  const { data: tipos = [] } = useQuery({ queryKey: ["reloj-tipos-incidencia"], queryFn: RelojService.tiposIncidencia });

  const crear = useAppMutation(() => RelojService.crearIncidencia(form), {
    successMessage: "Incidencia registrada",
    invalidateKeys: [["reloj-incidencias"], ["reloj-asistencia"]],
    onSuccess: () => setAbierto(false),
  });
  const cancelar = useAppMutation((id: number) => RelojService.cancelarIncidencia(id), {
    successMessage: "Incidencia cancelada",
    invalidateKeys: [["reloj-incidencias"], ["reloj-asistencia"]],
  });

  const guardar = async () => {
    if (!form.USUARIOID) return showWarning("Selecciona el empleado");
    if (!form.FECHA_INICIO || form.FECHA_FIN < form.FECHA_INICIO) return showWarning("Revisa el rango de fechas");
    if (!form.COMENTARIO.trim()) return showWarning("Agrega un comentario");
    crear.mutate();
  };

  return (
    <Box>
      {isFetching && <LoaderOverlay label="Cargando incidencias..." />}

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }} gap={1} flexWrap="wrap">
        <Typography variant="body2" color="text.secondary">
          Incapacidades, vacaciones, permisos y justificaciones. Los días cubiertos no cuentan como falta.
        </Typography>
        <PermissionButton
          allowed={puedeEditar}
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setForm(vacio());
            setAbierto(true);
          }}
        >
          Registrar incidencia
        </PermissionButton>
      </Stack>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Empleado</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Fechas</TableCell>
              <TableCell>Folio</TableCell>
              <TableCell>Comentario</TableCell>
              <TableCell>Comprobante</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((i) => (
              <TableRow key={i.INCIDENCIAID} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={800}>{i.NOMBRE}</Typography>
                  <Typography variant="caption" color="text.secondary">{i.SUCURSAL_CLAVE}</Typography>
                </TableCell>
                <TableCell>{i.TIPO_NOMBRE}</TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>
                  {i.FECHA_INICIO === i.FECHA_FIN ? i.FECHA_INICIO : `${i.FECHA_INICIO} → ${i.FECHA_FIN}`}
                </TableCell>
                <TableCell>{i.FOLIO ?? "—"}</TableCell>
                <TableCell>
                  {i.COMENTARIO}
                  <Typography variant="caption" display="block" color="text.secondary">
                    {i.CREADO_POR_NOMBRE} · {i.FECHA_CREACION?.slice(0, 10)}
                  </Typography>
                </TableCell>
                <TableCell>
                  {i.TIENE_ARCHIVO ? (
                    <Link href={RelojService.archivoIncidenciaUrl(i.INCIDENCIAID)} target="_blank" rel="noopener">
                      Ver
                    </Link>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell align="right">
                  <PermissionButton
                    allowed={puedeEditar}
                    size="small"
                    color="error"
                    variant="outlined"
                    onClick={async () => {
                      if (await confirmDelete(`¿Cancelar la ${i.TIPO_NOMBRE.toLowerCase()} de ${i.NOMBRE}?`, "Cancelar incidencia"))
                        cancelar.mutate(i.INCIDENCIAID);
                    }}
                  >
                    Cancelar
                  </PermissionButton>
                </TableCell>
              </TableRow>
            ))}
            {!data.length && !isFetching && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography color="text.secondary" sx={{ p: 1 }}>Sin incidencias en este periodo.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={abierto} onClose={() => setAbierto(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar incidencia</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <SelectorEmpleados
              multiple={false}
              label="Empleado"
              value={form.USUARIOID ? [form.USUARIOID] : []}
              onChange={(v) => setForm({ ...form, USUARIOID: v[0] ?? 0 })}
            />
            <TextField select label="Tipo" value={form.TIPO} onChange={(e) => setForm({ ...form, TIPO: e.target.value })}>
              {tipos.map((t) => (
                <MenuItem key={t.CLAVE} value={t.CLAVE}>{t.NOMBRE}</MenuItem>
              ))}
            </TextField>
            <Stack direction="row" spacing={1}>
              <TextField fullWidth type="date" label="Desde" value={form.FECHA_INICIO} onChange={(e) => setForm({ ...form, FECHA_INICIO: e.target.value, FECHA_FIN: form.FECHA_FIN < e.target.value ? e.target.value : form.FECHA_FIN })} slotProps={{ inputLabel: { shrink: true } }} />
              <TextField fullWidth type="date" label="Hasta" value={form.FECHA_FIN} onChange={(e) => setForm({ ...form, FECHA_FIN: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
            </Stack>
            {form.TIPO === "INCAPACIDAD" && (
              <TextField label="Folio de incapacidad IMSS" value={form.FOLIO} onChange={(e) => setForm({ ...form, FOLIO: e.target.value })} />
            )}
            <TextField label="Comentario" multiline minRows={2} required value={form.COMENTARIO} onChange={(e) => setForm({ ...form, COMENTARIO: e.target.value })} />
            <Button component="label" variant="outlined" startIcon={<AttachFileIcon />}>
              {form.archivo ? form.archivo.name : "Adjuntar comprobante (PDF o imagen)"}
              <input hidden type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setForm({ ...form, archivo: e.target.files?.[0] ?? null })} />
            </Button>
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
