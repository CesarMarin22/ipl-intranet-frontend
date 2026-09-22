import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import DescriptionIcon from "@mui/icons-material/Description";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "../../../shared/components/PageHeader";
import LoaderOverlay from "../../../shared/components/LoaderOverlay";
import {
  SGCExternalDocumentsService,
  SGCCatalogService,
  VISIBILIDAD_OPCIONES,
  type SGCExternalDocument,
  type SGCCatalogDepartment,
} from "../../../services/sgc";
import { getSucursales, type Sucursal } from "../../../services/sucursales";
import { useAppMutation } from "../../../shared/hooks/useAppMutation";
import PermissionButton from "../../../shared/components/PermissionButton";
import { usePermissions } from "../../../shared/hooks/usePermissions";
import { confirmDelete, showWarning } from "../../../shared/utils/swal";

export default function SGCExternalDocumentsPage() {
  const navigate = useNavigate();
  const { canEdit } = usePermissions();
  const puedeRegistrar = canEdit("SGC_DOCUMENTOS");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [origen, setOrigen] = useState("");
  const [fechaRecepcion, setFechaRecepcion] = useState("");
  const [visibilidad, setVisibilidad] = useState<string>("Confidencial");
  const [depaid, setDepaid] = useState("");
  const [sucursal, setSucursal] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [departments, setDepartments] = useState<SGCCatalogDepartment[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["sgc-external-documents"],
    queryFn: SGCExternalDocumentsService.getAll,
  });

  useEffect(() => {
    SGCCatalogService.getDepartments()
      .then(setDepartments)
      .catch(() => setDepartments([]));
    getSucursales()
      .then((data) => setSucursales((data || []).filter((s) => s.ACTIVO === 1)))
      .catch(() => setSucursales([]));
  }, []);

  const createMutation = useAppMutation(
    () =>
      SGCExternalDocumentsService.create({
        TITULO: titulo.trim(),
        ORIGEN: origen.trim() || null,
        FECHA_RECEPCION: fechaRecepcion || null,
        VISIBILIDAD: visibilidad,
        DEPAID: depaid ? Number(depaid) : null,
        SUCURSAL: sucursal.trim() || null,
        file,
      }),
    {
      invalidateKeys: [["sgc-external-documents"]],
      successMessage: "Documento externo registrado",
      onSuccess: () => closeDialog(),
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

  const rows = data ?? [];

  const nombreSucursal = (sucursalId?: string | null) => {
    if (!sucursalId) return null;
    const match = sucursales.find(
      (s) => String(s.SUCURSALID) === String(sucursalId),
    );
    return match ? `${match.CLAVE} - ${match.NOMBRE}` : sucursalId;
  };

  const openDialog = () => {
    setTitulo("");
    setOrigen("");
    setFechaRecepcion("");
    setVisibilidad("Confidencial");
    setDepaid("");
    setSucursal("");
    setFile(null);
    setDialogOpen(true);
  };

  const closeDialog = () => setDialogOpen(false);

  const handleCreate = async () => {
    if (!titulo.trim()) {
      await showWarning("El título es obligatorio");
      return;
    }
    createMutation.mutate();
  };

  const handleDownload = (row: SGCExternalDocument) => {
    if (!row.ARCHIVO_DISPONIBLE) {
      showWarning("Este documento externo no tiene archivo adjunto");
      return;
    }
    window.open(
      SGCExternalDocumentsService.downloadUrl(row.SGCEXTID),
      "_blank",
    );
  };

  const handleToggleStatus = (row: SGCExternalDocument) => {
    statusMutation.mutate({
      id: row.SGCEXTID,
      activo: row.ACTIVO === 1 ? 0 : 1,
    });
  };

  const handleDelete = async (row: SGCExternalDocument) => {
    const confirmed = await confirmDelete(
      `¿Deseas eliminar el documento externo "${row.TITULO}"? Esta acción no se puede deshacer.`,
      "Eliminar documento externo",
    );
    if (!confirmed) return;
    deleteMutation.mutate(row.SGCEXTID);
  };

  return (
    <Box sx={{ width: "100%" }}>
      {(isLoading || isFetching) && (
        <LoaderOverlay label="Cargando documentos externos..." />
      )}

      <PageHeader
        title="Documentos Externos (SGC)"
        subtitle="Normas, certificados de proveedores y otras referencias externas que Calidad decide conservar como parte del sistema de gestión (sin flujo de autorización)."
        action={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/sgc/documentos")}
            >
              Regresar
            </Button>
            <PermissionButton
              allowed={puedeRegistrar}
              variant="contained"
              onClick={openDialog}
            >
              Registrar documento externo
            </PermissionButton>
          </Stack>
        }
      />

      <Paper
        elevation={0}
        sx={{ p: { xs: 1.5, sm: 2.2 }, width: "100%", boxSizing: "border-box" }}
      >
        <Stack spacing={1.5}>
          {rows.length === 0 ? (
            <Typography color="text.secondary" sx={{ p: 1 }}>
              No hay documentos externos registrados (o ninguno con Visibilidad
              para ti).
            </Typography>
          ) : (
            rows.map((row) => (
              <Card
                key={row.SGCEXTID}
                variant="outlined"
                sx={{ borderRadius: 3 }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 1,
                      flexWrap: "wrap",
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={900}>{row.TITULO}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.ORIGEN || "Sin origen especificado"}
                        {row.FECHA_RECEPCION
                          ? ` · Recibido ${row.FECHA_RECEPCION.slice(0, 10)}`
                          : ""}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      {row.VISIBILIDAD && (
                        <Chip
                          label={row.VISIBILIDAD}
                          size="small"
                          variant="outlined"
                        />
                      )}
                      {row.ACTIVO !== 1 && (
                        <Chip label="Inactivo" size="small" color="default" />
                      )}
                    </Stack>
                  </Box>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    sx={{ mt: 0.5 }}
                  >
                    Registrado por {row.REGISTRADO_POR_NOMBRE || "-"}
                    {row.FECHA_REGISTRO
                      ? ` el ${row.FECHA_REGISTRO.slice(0, 10)}`
                      : ""}
                    {row.DEPARTAMENTO_NOMBRE
                      ? ` · Departamento: ${row.DEPARTAMENTO_NOMBRE}`
                      : ""}
                    {row.SUCURSAL
                      ? ` · Sucursal: ${nombreSucursal(row.SUCURSAL)}`
                      : ""}
                  </Typography>

                  <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                    {row.ARCHIVO_DISPONIBLE && (
                      <PermissionButton
                        allowed
                        size="small"
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownload(row)}
                      >
                        Descargar
                      </PermissionButton>
                    )}

                    <PermissionButton
                      allowed={puedeRegistrar}
                      size="small"
                      variant="outlined"
                      color={row.ACTIVO === 1 ? "warning" : "success"}
                      onClick={() => handleToggleStatus(row)}
                    >
                      {row.ACTIVO === 1 ? "Desactivar" : "Activar"}
                    </PermissionButton>

                    <PermissionButton
                      allowed={puedeRegistrar}
                      size="small"
                      color="error"
                      variant="outlined"
                      onClick={() => handleDelete(row)}
                    >
                      Eliminar
                    </PermissionButton>
                  </Stack>
                </CardContent>
              </Card>
            ))
          )}
        </Stack>
      </Paper>

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar documento externo</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              required
              label="Título"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej. ISO 9001:2015"
            />
            <TextField
              fullWidth
              label="Origen"
              value={origen}
              onChange={(e) => setOrigen(e.target.value)}
              placeholder="Ej. Organismo certificador, proveedor, fabricante..."
            />
            <TextField
              fullWidth
              type="date"
              label="Fecha de recepción"
              InputLabelProps={{ shrink: true }}
              value={fechaRecepcion}
              onChange={(e) => setFechaRecepcion(e.target.value)}
            />

            <FormControl fullWidth>
              <InputLabel>Visibilidad</InputLabel>
              <Select
                label="Visibilidad"
                value={visibilidad}
                onChange={(e) => {
                  const nuevaVisibilidad = e.target.value;
                  setVisibilidad(nuevaVisibilidad);
                  if (nuevaVisibilidad !== "Confidencial") setDepaid("");
                  if (nuevaVisibilidad !== "Interno") setSucursal("");
                }}
              >
                {VISIBILIDAD_OPCIONES.map((v) => (
                  <MenuItem key={v} value={v}>
                    {v}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {visibilidad === "Confidencial" && (
              <FormControl fullWidth>
                <InputLabel>Departamento</InputLabel>
                <Select
                  label="Departamento"
                  value={depaid}
                  onChange={(e) => setDepaid(e.target.value)}
                >
                  <MenuItem value="">Ninguno</MenuItem>
                  {departments.map((d) => (
                    <MenuItem key={d.DEPAID} value={String(d.DEPAID)}>
                      {d.NOMBRE}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Solo las personas de este departamento podrán verlo.
                </FormHelperText>
              </FormControl>
            )}

            {visibilidad === "Interno" && (
              <FormControl fullWidth>
                <InputLabel>Sucursal</InputLabel>
                <Select
                  label="Sucursal"
                  value={sucursal}
                  onChange={(e) => setSucursal(e.target.value)}
                >
                  <MenuItem value="">Ninguna</MenuItem>
                  {sucursales.map((s) => (
                    <MenuItem key={s.SUCURSALID} value={String(s.SUCURSALID)}>
                      {s.CLAVE} - {s.NOMBRE}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Solo las personas de esta sucursal podrán verlo. Elígela tú
                  manualmente; no depende de tu propia sucursal.
                </FormHelperText>
              </FormControl>
            )}

            <Box
              sx={{
                border: "1px dashed",
                borderColor: "divider",
                borderRadius: 2,
                p: 2,
                display: "flex",
                alignItems: "center",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Button
                component="label"
                variant="outlined"
                startIcon={<UploadFileIcon />}
              >
                Adjuntar archivo (opcional)
                <input
                  type="file"
                  hidden
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.txt,.csv"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </Button>

              {file ? (
                <Chip
                  icon={<DescriptionIcon />}
                  label={file.name}
                  onDelete={() => setFile(null)}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Ningún archivo seleccionado.
                </Typography>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? "Guardando..." : "Registrar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
