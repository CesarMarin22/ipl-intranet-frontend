import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import HistoryIcon from "@mui/icons-material/History";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "../../../shared/components/PageHeader";
import LoaderOverlay from "../../../shared/components/LoaderOverlay";
import {
  SGCExternalDocumentsService,
  SGCCatalogService,
  type SGCExternalDocument,
  type SGCCatalogDepartment,
  type SGCVigenciaExterno,
} from "../../../services/sgc";
import { getSucursales, type SucursalRow as Sucursal } from "../../../services/sucursales";
import { useAppMutation } from "../../../shared/hooks/useAppMutation";
import { useAuth } from "../../../app/providers/useAuth";
import { confirmDelete, showWarning } from "../../../shared/utils/swal";

const VIGENCIA_COLOR: Record<SGCVigenciaExterno, "success" | "warning" | "error" | "info" | "default"> = {
  VIGENTE: "success",
  PROXIMO_A_VENCER: "warning",
  URGENTE: "warning",
  VENCIDO: "error",
  SIN_CADUCIDAD: "info",
  SIN_FECHA: "default",
};

const fecha = (valor?: string | null) => {
  if (!valor) return "";
  const [y, m, d] = valor.slice(0, 10).split("-");
  return d && m && y ? `${d}/${m}/${y}` : valor;
};

function textoVigencia(row: SGCExternalDocument) {
  const dias = row.DIAS_VIGENCIA ?? 0;
  switch (row.ESTADO_VIGENCIA) {
    case "SIN_CADUCIDAD":
      return "Sin caducidad";
    case "SIN_FECHA":
      return "Sin vigencia capturada";
    case "VENCIDO":
      return `Vencido desde ${fecha(row.FECHA_VIGENCIA)}`;
    case "URGENTE":
    case "PROXIMO_A_VENCER":
      return `Vence en ${dias} día${dias === 1 ? "" : "s"} (${fecha(row.FECHA_VIGENCIA)})`;
    default:
      return `Vigente hasta ${fecha(row.FECHA_VIGENCIA)}`;
  }
}

type FormState = {
  titulo: string;
  origen: string;
  edicion: string;
  fechaRecepcion: string;
  sinCaducidad: boolean;
  fechaVigencia: string;
  depaid: string;
  sucursal: string;
  file: File | null;
};

const formularioVacio: FormState = {
  titulo: "",
  origen: "",
  edicion: "",
  fechaRecepcion: "",
  sinCaducidad: false,
  fechaVigencia: "",
  depaid: "",
  sucursal: "",
  file: null,
};

export default function SGCExternalDocumentsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  // Calidad sees every department's external documents; everyone else only their own
  const esCalidad = (user?.perfil_nombre ?? "").trim().toLowerCase() === "calidad";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<SGCExternalDocument | null>(null);
  const [form, setForm] = useState<FormState>(formularioVacio);
  const [departments, setDepartments] = useState<SGCCatalogDepartment[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [filtroDepa, setFiltroDepa] = useState("");
  const [filtroSucursal, setFiltroSucursal] = useState("");
  const [historialAbierto, setHistorialAbierto] = useState<Set<number>>(new Set());

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["sgc-external-documents"],
    queryFn: SGCExternalDocumentsService.getAll,
  });

  useEffect(() => {
    SGCCatalogService.getDepartments()
      .then(setDepartments)
      .catch(() => setDepartments([]));
    getSucursales()
      .then((lista) => setSucursales((lista || []).filter((s) => s.ACTIVO === 1)))
      .catch(() => setSucursales([]));
  }, []);

  const payload = () => ({
    TITULO: form.titulo.trim(),
    ORIGEN: form.origen.trim() || null,
    EDICION: form.edicion.trim(),
    FECHA_RECEPCION: form.fechaRecepcion || null,
    SIN_CADUCIDAD: form.sinCaducidad,
    FECHA_VIGENCIA: form.sinCaducidad ? null : form.fechaVigencia || null,
    DEPAID: esCalidad && form.depaid ? Number(form.depaid) : null,
    SUCURSAL: esCalidad && form.sucursal ? form.sucursal : null,
    file: form.file,
  });

  const saveMutation = useAppMutation(
    () =>
      editando
        ? SGCExternalDocumentsService.update(editando.SGCEXTID, payload())
        : SGCExternalDocumentsService.create(payload()),
    {
      invalidateKeys: [["sgc-external-documents"]],
      successMessage: editando ? "Documento externo actualizado" : "Documento externo registrado",
      onSuccess: () => setDialogOpen(false),
    },
  );

  const statusMutation = useAppMutation(
    ({ id, activo }: { id: number; activo: number }) =>
      SGCExternalDocumentsService.changeStatus(id, activo),
    {
      invalidateKeys: [["sgc-external-documents"]],
      successMessage: "Estado actualizado",
    },
  );

  const deleteMutation = useAppMutation(
    (id: number) => SGCExternalDocumentsService.delete(id),
    {
      invalidateKeys: [["sgc-external-documents"]],
      successMessage: "Documento externo eliminado",
    },
  );

  const rows = useMemo(() => data ?? [], [data]);

  const nombreSucursal = (sucursalId?: string | null) => {
    if (!sucursalId) return "";
    const match = sucursales.find((s) => String(s.SUCURSALID) === String(sucursalId));
    return match ? `${match.CLAVE} - ${match.NOMBRE}` : sucursalId;
  };

  // Filter options come from the documents the user can see, so every option returns results
  const opcionesDepa = useMemo(
    () =>
      [...new Map(rows.filter((r) => r.DEPAID != null).map((r) => [String(r.DEPAID), r.DEPARTAMENTO_NOMBRE || `Depto ${r.DEPAID}`] as [string, string])).entries()].sort(
        (a, b) => a[1].localeCompare(b[1], "es"),
      ),
    [rows],
  );
  const opcionesSucursal = useMemo(
    () => [...new Set(rows.map((r) => r.SUCURSAL).filter((s): s is string => Boolean(s)))],
    [rows],
  );

  const filtrados = rows.filter(
    (r) =>
      (!filtroDepa || String(r.DEPAID ?? "") === filtroDepa) &&
      (!filtroSucursal || String(r.SUCURSAL ?? "") === filtroSucursal),
  );

  const abrirNuevo = () => {
    setEditando(null);
    setForm(formularioVacio);
    setDialogOpen(true);
  };

  const abrirEditar = (row: SGCExternalDocument) => {
    setEditando(row);
    setForm({
      titulo: row.TITULO || "",
      origen: row.ORIGEN || "",
      edicion: row.EDICION || "",
      fechaRecepcion: (row.FECHA_RECEPCION || "").slice(0, 10),
      sinCaducidad: Number(row.SIN_CADUCIDAD) === 1,
      fechaVigencia: (row.FECHA_VIGENCIA || "").slice(0, 10),
      depaid: row.DEPAID != null ? String(row.DEPAID) : "",
      sucursal: row.SUCURSAL || "",
      file: null,
    });
    setDialogOpen(true);
  };

  const guardar = async () => {
    if (!form.titulo.trim()) return showWarning("Captura el título del documento externo.");
    if (!form.edicion.trim()) return showWarning("Captura la edición o versión del documento externo.");
    if (!form.sinCaducidad && !form.fechaVigencia)
      return showWarning("Captura la fecha de vigencia o marca que el documento no caduca.");
    if (!editando && !form.file) return showWarning("Adjunta el archivo del documento externo.");
    saveMutation.mutate();
  };

  const toggleHistorial = (id: number) =>
    setHistorialAbierto((prev) => {
      const siguiente = new Set(prev);
      if (siguiente.has(id)) siguiente.delete(id);
      else siguiente.add(id);
      return siguiente;
    });

  const handleDelete = async (row: SGCExternalDocument) => {
    const confirmado = await confirmDelete(
      `¿Deseas eliminar el documento externo "${row.TITULO}"? Se borra también su historial y no se puede deshacer.`,
      "Eliminar documento externo",
    );
    if (confirmado) deleteMutation.mutate(row.SGCEXTID);
  };

  const cambio = <K extends keyof FormState>(clave: K, valor: FormState[K]) =>
    setForm((prev) => ({ ...prev, [clave]: valor }));

  return (
    <Box sx={{ width: "100%" }}>
      {(isLoading || isFetching) && <LoaderOverlay label="Cargando documentos externos..." />}

      <PageHeader
        title="Documentos Externos"
        subtitle={
          esCalidad
            ? "Normas, manuales y referencias de terceros de todos los departamentos."
            : "Normas, manuales y referencias de terceros de tu departamento. Solo los ven tu departamento y Calidad."
        }
        action={
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
            <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate("/sgc/documentos")}>
              Regresar
            </Button>
            <Button variant="contained" startIcon={<UploadFileIcon />} onClick={abrirNuevo}>
              Registrar documento externo
            </Button>
          </Stack>
        }
      />

      <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2.2 }, width: "100%", boxSizing: "border-box" }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Departamento</InputLabel>
            <Select label="Departamento" value={filtroDepa} onChange={(e) => setFiltroDepa(e.target.value)}>
              <MenuItem value="">Todos</MenuItem>
              {opcionesDepa.map(([id, nombre]) => (
                <MenuItem key={id} value={id}>
                  {nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Sucursal</InputLabel>
            <Select label="Sucursal" value={filtroSucursal} onChange={(e) => setFiltroSucursal(e.target.value)}>
              <MenuItem value="">Todas</MenuItem>
              {opcionesSucursal.map((s) => (
                <MenuItem key={s} value={s}>
                  {nombreSucursal(s)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Stack spacing={1.5}>
          {filtrados.length === 0 ? (
            <Typography color="text.secondary" sx={{ p: 1 }}>
              {rows.length === 0 ? "No hay documentos externos registrados." : "Ningún documento coincide con los filtros."}
            </Typography>
          ) : (
            filtrados.map((row) => (
              <Card key={row.SGCEXTID} variant="outlined" sx={{ borderRadius: 3, opacity: row.ACTIVO === 1 ? 1 : 0.7 }}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={900}>{row.TITULO}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.ORIGEN || "Sin origen especificado"}
                        {row.FECHA_RECEPCION ? ` · Recibido ${fecha(row.FECHA_RECEPCION)}` : ""}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 0.5 }}>
                      {row.EDICION && <Chip label={`Edición: ${row.EDICION}`} size="small" variant="outlined" />}
                      <Chip label={textoVigencia(row)} size="small" color={VIGENCIA_COLOR[row.ESTADO_VIGENCIA] ?? "default"} />
                      {row.ACTIVO !== 1 && <Chip label="Inactivo" size="small" />}
                    </Stack>
                  </Box>

                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    Registrado por {row.REGISTRADO_POR_NOMBRE || "-"}
                    {row.FECHA_REGISTRO ? ` el ${fecha(row.FECHA_REGISTRO)}` : ""}
                    {row.DEPARTAMENTO_NOMBRE ? ` · Departamento: ${row.DEPARTAMENTO_NOMBRE}` : ""}
                    {row.SUCURSAL ? ` · Sucursal: ${nombreSucursal(row.SUCURSAL)}` : ""}
                  </Typography>

                  <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: "wrap", gap: 1 }}>
                    {row.ARCHIVO_DISPONIBLE && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={() => window.open(SGCExternalDocumentsService.downloadUrl(row.SGCEXTID), "_blank")}
                      >
                        Descargar
                      </Button>
                    )}
                    <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => abrirEditar(row)}>
                      Editar / nueva versión
                    </Button>
                    <Button size="small" variant="outlined" startIcon={<HistoryIcon />} onClick={() => toggleHistorial(row.SGCEXTID)}>
                      Historial ({row.HISTORIAL.length})
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color={row.ACTIVO === 1 ? "warning" : "success"}
                      onClick={() => statusMutation.mutate({ id: row.SGCEXTID, activo: row.ACTIVO === 1 ? 0 : 1 })}
                    >
                      {row.ACTIVO === 1 ? "Desactivar" : "Activar"}
                    </Button>
                    <Button size="small" color="error" variant="outlined" onClick={() => handleDelete(row)}>
                      Eliminar
                    </Button>
                  </Stack>

                  <Collapse in={historialAbierto.has(row.SGCEXTID)}>
                    <Box sx={{ mt: 1.5, pl: 1.5, borderLeft: 3, borderColor: "divider" }}>
                      {row.HISTORIAL.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          Sin versiones registradas todavía.
                        </Typography>
                      ) : (
                        row.HISTORIAL.map((h, i) => (
                          <Typography key={`${h.FECHA}-${i}`} variant="body2" sx={{ py: 0.25 }}>
                            <strong>{fecha(h.FECHA)}</strong> · Nueva versión: {h.EDICION || "-"}
                          </Typography>
                        ))
                      )}
                    </Box>
                  </Collapse>
                </CardContent>
              </Card>
            ))
          )}
        </Stack>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editando ? "Editar documento externo" : "Registrar documento externo"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Título" required fullWidth value={form.titulo} onChange={(e) => cambio("titulo", e.target.value)} />
            <TextField
              label="Origen"
              fullWidth
              value={form.origen}
              onChange={(e) => cambio("origen", e.target.value)}
              placeholder="Ej. STPS, cliente, proveedor..."
            />
            <TextField
              label="Edición o versión"
              required
              fullWidth
              value={form.edicion}
              onChange={(e) => cambio("edicion", e.target.value)}
              placeholder="Ej. NOM-035-STPS-2018, Rev. 4"
              helperText={editando ? "Si cambias la edición se registra como nueva versión en el historial." : " "}
            />
            <TextField
              label="Fecha de recepción"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={form.fechaRecepcion}
              onChange={(e) => cambio("fechaRecepcion", e.target.value)}
            />

            <Box>
              <FormControlLabel
                control={<Switch checked={form.sinCaducidad} onChange={(e) => cambio("sinCaducidad", e.target.checked)} />}
                label="Este documento no caduca"
              />
              {!form.sinCaducidad && (
                <TextField
                  label="Fecha de vigencia"
                  type="date"
                  required
                  fullWidth
                  sx={{ mt: 1 }}
                  InputLabelProps={{ shrink: true }}
                  value={form.fechaVigencia}
                  onChange={(e) => cambio("fechaVigencia", e.target.value)}
                  helperText="Hasta cuándo es válido el documento."
                />
              )}
            </Box>

            {esCalidad ? (
              <>
                <FormControl fullWidth>
                  <InputLabel>Departamento</InputLabel>
                  <Select label="Departamento" value={form.depaid} onChange={(e) => cambio("depaid", e.target.value)}>
                    <MenuItem value="">{editando ? "Sin cambio" : "Mi departamento"}</MenuItem>
                    {departments.map((d) => (
                      <MenuItem key={d.DEPAID} value={String(d.DEPAID)}>
                        {d.NOMBRE}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Sucursal</InputLabel>
                  <Select label="Sucursal" value={form.sucursal} onChange={(e) => cambio("sucursal", e.target.value)}>
                    <MenuItem value="">{editando ? "Sin cambio" : "Mi sucursal"}</MenuItem>
                    {sucursales.map((s) => (
                      <MenuItem key={s.SUCURSALID} value={String(s.SUCURSALID)}>
                        {s.CLAVE} - {s.NOMBRE}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            ) : (
              !editando && (
                <Alert severity="info">Se registrará para tu departamento y tu sucursal. Solo lo verán tu departamento y Calidad.</Alert>
              )
            )}

            <Box>
              <Button component="label" variant="outlined" startIcon={<UploadFileIcon />} fullWidth>
                {form.file ? form.file.name : editando ? "Subir archivo de la nueva versión (opcional)" : "Seleccionar archivo *"}
                <input type="file" hidden onChange={(e) => cambio("file", e.target.files?.[0] ?? null)} />
              </Button>
              {editando && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  El archivo nuevo reemplaza al actual (el anterior no se conserva) y se registra como nueva versión en el historial.
                </Typography>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={guardar} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Guardando..." : editando ? "Guardar cambios" : "Registrar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
