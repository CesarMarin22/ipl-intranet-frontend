import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  FormControlLabel,
  Radio,
  RadioGroup,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import BlockIcon from "@mui/icons-material/Block";
import { Fragment, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "../../../shared/components/PageHeader";
import LoaderOverlay from "../../../shared/components/LoaderOverlay";
import { IPL } from "../../../shared/theme/theme";
import {
  SGCService,
  SGCCatalogService,
  ESTADO_LABELS,
  ESTADO_COLORS,
  ESTADO_APROBACION_LABELS,
  ESTADO_APROBACION_COLORS,
  esRevisionSinCambios,
  type SGCDocument,
  type SGCEstado,
  type SGCEstadoAprobacion,
} from "../../../services/sgc";
import { useAppMutation } from "../../../shared/hooks/useAppMutation";
import PermissionButton from "../../../shared/components/PermissionButton";
import { usePermissions } from "../../../shared/hooks/usePermissions";
import {
  confirmAction,
  confirmDelete,
  promptText,
  showWarning,
} from "../../../shared/utils/swal";

export default function SGCDocumentsPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<string>("");
  const [aprobacionFilter, setAprobacionFilter] = useState<string>("");
  const [depaFilter, setDepaFilter] = useState<string>("");
  const [tipoFilter, setTipoFilter] = useState<string>("");
  const isMobile = useMediaQuery("(max-width:900px)");
  const { canCreate, canEdit, canDelete } = usePermissions();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetId, setUploadTargetId] = useState<number | null>(null);

  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const [authorizeDialogRow, setAuthorizeDialogRow] =
    useState<SGCDocument | null>(null);
  const [authorizeEditableFile, setAuthorizeEditableFile] =
    useState<File | null>(null);
  const [authorizePdfFile, setAuthorizePdfFile] = useState<File | null>(null);
  const [authorizeFechaLimite, setAuthorizeFechaLimite] = useState("");
  const [authorizeNumero, setAuthorizeNumero] = useState("");
  const [authorizeDescripcion, setAuthorizeDescripcion] = useState("");
  const [authorizeSinCambios, setAuthorizeSinCambios] = useState(false);

  const toggleExpanded = (sgcid: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(sgcid)) next.delete(sgcid);
      else next.add(sgcid);
      return next;
    });
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["sgc-documents"],
    queryFn: SGCService.getAll,
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: SGCCatalogService.getDepartments,
  });

  const toggleStatusMutation = useAppMutation(
    ({ id, activo }: { id: number; activo: number }) =>
      SGCService.changeStatus(id, activo),
    {
      invalidateKeys: [["sgc-documents"]],
      successMessage: "Estado actualizado correctamente",
    },
  );

  const deleteMutation = useAppMutation((id: number) => SGCService.delete(id), {
    invalidateKeys: [["sgc-documents"]],
    successMessage: "Documento eliminado correctamente",
  });

  const obsoleteMutation = useAppMutation(
    (id: number) => SGCService.markObsolete(id),
    {
      invalidateKeys: [["sgc-documents"]],
      successMessage: "Documento marcado como obsoleto",
    },
  );

  const rejectMutation = useAppMutation(
    ({
      id,
      versionId,
      comentarios,
    }: {
      id: number;
      versionId: number;
      comentarios: string | null;
    }) => SGCService.rejectVersion(id, versionId, comentarios),
    {
      invalidateKeys: [["sgc-documents"]],
      successMessage: "Versión rechazada",
    },
  );

  const authorizeMutation = useAppMutation(
    ({
      id,
      versionId,
      editableFile,
      pdfFile,
      fechaLimite,
      numeroVersion,
      descripcionCambio,
      sinCambios,
    }: {
      id: number;
      versionId: number;
      editableFile: File | null;
      pdfFile: File | null;
      fechaLimite: string | null;
      numeroVersion: number;
      descripcionCambio: string;
      sinCambios: boolean;
    }) =>
      SGCService.authorizeVersion(id, versionId, {
        file: editableFile,
        pdf: pdfFile,
        fechaLimite,
        numeroVersion,
        descripcionCambio,
        sinCambios,
      }),
    {
      invalidateKeys: [["sgc-documents"]],
      successMessage: "Versión autorizada y liberada",
      onSuccess: () => closeAuthorizeDialog(),
    },
  );

  const uploadVersionMutation = useAppMutation(
    ({ id, file }: { id: number; file: File }) => SGCService.uploadVersion(id, file),
    {
      invalidateKeys: [["sgc-documents"]],
      successMessage: "Nueva versión subida, pendiente de autorización",
    },
  );

  const rows = useMemo(() => data ?? [], [data]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        !s ||
        [row.CODIGO, row.TITULO, row.TIPO_DOCUMENTO, row.RESPONSABLE_NOMBRE]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(s));

      const matchesEstado = !estadoFilter || row.ESTADO === estadoFilter;
      const matchesAprobacion =
        !aprobacionFilter || row.ESTADO_APROBACION === aprobacionFilter;
      const matchesDepa =
        !depaFilter || String(row.DEPAID ?? "") === depaFilter;
      const matchesTipo =
        !tipoFilter ||
        (tipoFilter === "__SIN_TIPO__" ? !row.TIPO_DOCUMENTO : row.TIPO_DOCUMENTO === tipoFilter);

      return matchesSearch && matchesEstado && matchesAprobacion && matchesDepa && matchesTipo;
    });
  }, [q, rows, estadoFilter, aprobacionFilter, depaFilter, tipoFilter]);

  // Only the types the documents actually use, so every option returns results
  const tiposDocumento = useMemo(
    () =>
      [...new Set(rows.map((row) => row.TIPO_DOCUMENTO).filter((tipo): tipo is string => Boolean(tipo)))].sort((a, b) =>
        a.localeCompare(b, "es"),
      ),
    [rows],
  );
  const haySinTipo = useMemo(() => rows.some((row) => !row.TIPO_DOCUMENTO), [rows]);

  const handleToggleStatus = (row: SGCDocument) => {
    if (!canEdit("SGC_DOCUMENTOS")) {
      showWarning("No tienes permiso para editar documentos del SGC");
      return;
    }

    toggleStatusMutation.mutate({
      id: row.SGCID,
      activo: row.ACTIVO === 1 ? 0 : 1,
    });
  };

  const handleMarkObsolete = async (row: SGCDocument) => {
    const confirmed = await confirmAction(
      `¿Marcar "${row.TITULO}" como OBSOLETO? Esta acción es definitiva: el documento ya no se debe usar, ` +
        `y si tiene PDF se le imprime la marca de agua de forma permanente (no se puede deshacer).`,
      "Marcar como obsoleto",
      "Sí, marcar obsoleto",
    );

    if (!confirmed) return;

    obsoleteMutation.mutate(row.SGCID);
  };

  const handleDelete = async (row: SGCDocument) => {
    if (!canDelete("SGC_DOCUMENTOS")) {
      showWarning("No tienes permiso para eliminar documentos del SGC");
      return;
    }

    const confirmed = await confirmDelete(
      `¿Deseas eliminar el documento "${row.TITULO}"? Esto borra todas sus versiones.`,
      "Eliminar documento",
    );

    if (!confirmed) return;

    deleteMutation.mutate(row.SGCID);
  };

  const handleDownload = (row: SGCDocument) => {
    if (!row.VERSION_ACTIVA_ID) {
      showWarning("Este documento todavía no tiene una versión autorizada");
      return;
    }
    window.open(SGCService.downloadUrl(row.SGCID), "_blank");
  };

  const handleView = (row: SGCDocument) => {
    window.open(SGCService.viewUrl(row.SGCID), "_blank");
  };

  const handleDownloadVersion = (row: SGCDocument, versionId: number) => {
    window.open(SGCService.downloadVersionUrl(row.SGCID, versionId), "_blank");
  };

  const handleDownloadVersionPdf = (row: SGCDocument, versionId: number) => {
    window.open(
      SGCService.downloadVersionPdfUrl(row.SGCID, versionId),
      "_blank",
    );
  };

  const handleReject = async (row: SGCDocument) => {
    if (!row.ULTIMA_VERSION) return;

    const comentarios = await promptText(
      `Indica el motivo del rechazo para "${row.TITULO}" (obligatorio).`,
      "Rechazar documento",
      "Ej. falta la firma del responsable...",
    );

    if (comentarios === null) return;

    if (!comentarios.trim()) {
      await showWarning("El motivo del rechazo es obligatorio");
      return;
    }

    rejectMutation.mutate({
      id: row.SGCID,
      versionId: row.ULTIMA_VERSION.VERSIONID,
      comentarios: comentarios.trim(),
    });
  };

  const openAuthorizeDialog = (row: SGCDocument) => {
    setAuthorizeDialogRow(row);
    setAuthorizeEditableFile(null);
    setAuthorizePdfFile(null);
    setAuthorizeFechaLimite(
      row.FECHA_LIMITE ? row.FECHA_LIMITE.slice(0, 10) : "",
    );
    const version = row.ULTIMA_VERSION;
    setAuthorizeNumero(String(version?.NUMERO_VERSION || ""));
    const descripcionPrevia =
      version?.DESCRIPCION_CAMBIO && version.DESCRIPCION_CAMBIO !== "Pendiente de Calidad"
        ? version.DESCRIPCION_CAMBIO
        : "";
    setAuthorizeDescripcion(descripcionPrevia || (!row.VERSION_ACTIVA_ID ? "Creación del documento" : ""));
  };

  const closeAuthorizeDialog = () => {
    setAuthorizeDialogRow(null);
    setAuthorizeEditableFile(null);
    setAuthorizePdfFile(null);
    setAuthorizeFechaLimite("");
    setAuthorizeNumero("");
    setAuthorizeDescripcion("");
    setAuthorizeSinCambios(false);
  };

  const confirmAuthorize = async () => {
    if (!authorizeDialogRow || !authorizeDialogRow.ULTIMA_VERSION) return;

    const numero = Number(authorizeNumero);
    if (!authorizeSinCambios) {
      if (!Number.isInteger(numero) || numero <= 0) {
        await showWarning("Captura el número de versión (un número entero mayor a 0).");
        return;
      }
      if (!authorizeDescripcion.trim()) {
        await showWarning("Captura la descripción del cambio de esta versión.");
        return;
      }
    }

    const hoy = new Date();
    const hoyIso = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
    if (!authorizeFechaLimite) {
      await showWarning("Captura la Fecha límite: la siguiente revisión del documento.");
      return;
    }
    if (authorizeFechaLimite <= hoyIso) {
      await showWarning("La Fecha límite debe ser posterior a hoy: es la fecha de la siguiente revisión.");
      return;
    }

    if (!authorizeDialogRow.ES_TIPO_FORMATO && !authorizePdfFile) {
      await showWarning(
        "Este tipo de documento necesita un PDF para autorizarse (el editable quedará restringido a Calidad).",
      );
      return;
    }

    authorizeMutation.mutate({
      id: authorizeDialogRow.SGCID,
      versionId: authorizeDialogRow.ULTIMA_VERSION.VERSIONID,
      editableFile: authorizeEditableFile,
      pdfFile: authorizePdfFile,
      fechaLimite: authorizeFechaLimite || null,
      numeroVersion: numero,
      descripcionCambio: authorizeDescripcion.trim(),
      sinCambios: authorizeSinCambios,
    });
  };

  const handleUploadVersionClick = (row: SGCDocument) => {
    setUploadTargetId(row.SGCID);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";

    if (!file || !uploadTargetId) return;

    // Version number and change description are set by Calidad when authorizing
    uploadVersionMutation.mutate({ id: uploadTargetId, file });
    setUploadTargetId(null);
  };

  const formatFecha = (value?: string | null) => {
    if (!value) return "-";
    return String(value).slice(0, 10);
  };

  const EstadoChip = ({
    estado,
    dias,
  }: {
    estado: SGCEstado;
    dias: number | null;
  }) => {
    let label = ESTADO_LABELS[estado];
    if (dias !== null && estado !== "SIN_FECHA") {
      label += estado === "VENCIDO" ? ` (${Math.abs(dias)}d)` : ` (${dias}d)`;
    }
    return <Chip label={label} color={ESTADO_COLORS[estado]} size="small" />;
  };

  const AprobacionChip = ({ estado }: { estado: SGCEstadoAprobacion }) => (
    <Chip
      label={ESTADO_APROBACION_LABELS[estado]}
      color={ESTADO_APROBACION_COLORS[estado]}
      size="small"
      variant="outlined"
    />
  );

  const renderHistorial = (row: SGCDocument) => (
    <Stack
      spacing={1.2}
      divider={<Divider />}
      sx={{ py: 1.5, px: { xs: 0, sm: 1 } }}
    >
      {(row.VERSIONES ?? []).length === 0 && (
        <Typography variant="body2" color="text.secondary">
          Este documento no tiene versiones.
        </Typography>
      )}

      {(row.VERSIONES ?? []).map((v) => (
        <Box
          key={v.VERSIONID}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Box>
            <Typography variant="body2" fontWeight={800}>
              Versión {v.NUMERO_VERSION}{" "}
{esRevisionSinCambios(v, row.VERSIONES ?? []) && (
  <Chip size="small" variant="outlined" color="info" label="Revisión sin cambios" sx={{ ml: 1 }} />
)}
              <Chip
                size="small"
                sx={{ ml: 1 }}
                label={
                  v.ESTADO === "BORRADOR"
                    ? "Pendiente"
                    : v.ESTADO === "AUTORIZADO"
                      ? "Autorizado"
                      : "Rechazado"
                }
                color={
                  v.ESTADO === "BORRADOR"
                    ? "warning"
                    : v.ESTADO === "AUTORIZADO"
                      ? "success"
                      : "error"
                }
              />
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              Subido por {v.SUBIDO_POR_NOMBRE || "-"} el{" "}
              {(v.FECHA_SUBIDA || "").slice(0, 10)}
            </Typography>
            {v.DESCRIPCION_CAMBIO && (
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                Cambio: {v.DESCRIPCION_CAMBIO}
              </Typography>
            )}
            {v.FECHA_AUTORIZACION && (
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                {v.ESTADO === "AUTORIZADO" ? "Autorizado" : "Rechazado"} por{" "}
                {v.AUTORIZADO_POR_NOMBRE || "-"} el{" "}
                {(v.FECHA_AUTORIZACION || "").slice(0, 10)}
              </Typography>
            )}
            {v.COMENTARIOS && (
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                Comentarios: {v.COMENTARIOS}
              </Typography>
            )}
          </Box>

          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            alignItems="flex-start"
          >
            {v.ESTADO === "RECHAZADO" ? (
              <Typography variant="caption" color="text.secondary">
                Rechazado, sin descarga
              </Typography>
            ) : v.ESTADO === "BORRADOR" ? (
              v.ARCHIVO_DISPONIBLE ? (
                <PermissionButton
                  allowed
                  size="small"
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleDownloadVersion(row, v.VERSIONID)}
                >
                  Descargar editable
                </PermissionButton>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  Editable no disponible
                </Typography>
              )
            ) : row.ES_TIPO_FORMATO ? (
              v.ARCHIVO_DISPONIBLE ? (
                <PermissionButton
                  allowed
                  size="small"
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleDownloadVersion(row, v.VERSIONID)}
                >
                  Descargar editable
                </PermissionButton>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  Editable no disponible
                </Typography>
              )
            ) : v.ARCHIVO_PDF_DISPONIBLE ? (
              row.ES_CALIDAD ? (
                <PermissionButton
                  allowed
                  size="small"
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleDownloadVersionPdf(row, v.VERSIONID)}
                >
                  Descargar PDF
                </PermissionButton>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  Solo Calidad puede descargar versiones anteriores
                </Typography>
              )
            ) : (
              <Typography variant="caption" color="text.secondary">
                PDF no disponible
              </Typography>
            )}
          </Stack>
        </Box>
      ))}
    </Stack>
  );

  const renderAcciones = (row: SGCDocument, fullWidth: boolean) => {
    const puedeSubirVersion =
      row.ESTADO_APROBACION !== "PENDIENTE_AUTORIZACION" &&
      (row.ES_RESPONSABLE || canEdit("SGC_DOCUMENTOS"));

    return (
      <>
        {row.PUEDE_VER_HISTORIAL && (
          <PermissionButton
            allowed
            size="small"
            variant="outlined"
            fullWidth={fullWidth}
            startIcon={
              expandedIds.has(row.SGCID) ? (
                <ExpandLessIcon />
              ) : (
                <ExpandMoreIcon />
              )
            }
            onClick={() => toggleExpanded(row.SGCID)}
          >
            Historial
          </PermissionButton>
        )}

        {!row.ES_TIPO_FORMATO && row.VERSION_ACTIVA_PDF_URL && (
          <PermissionButton
            allowed
            size="small"
            variant="outlined"
            fullWidth={fullWidth}
            startIcon={<VisibilityIcon />}
            onClick={() => handleView(row)}
          >
            Ver
          </PermissionButton>
        )}

        {row.VERSION_ACTIVA_ID && (
          <PermissionButton
            allowed
            size="small"
            variant="outlined"
            fullWidth={fullWidth}
            startIcon={<DownloadIcon />}
            onClick={() => handleDownload(row)}
          >
            Descargar
          </PermissionButton>
        )}

        {row.PUEDE_APROBAR && (
          <>
            <PermissionButton
              allowed
              size="small"
              color="success"
              variant="outlined"
              fullWidth={fullWidth}
              startIcon={<CheckCircleIcon />}
              onClick={() => openAuthorizeDialog(row)}
            >
              Revisar y autorizar
            </PermissionButton>
            <PermissionButton
              allowed
              size="small"
              color="error"
              variant="outlined"
              fullWidth={fullWidth}
              startIcon={<CancelIcon />}
              onClick={() => handleReject(row)}
            >
              Rechazar
            </PermissionButton>
          </>
        )}

        {puedeSubirVersion && (
          <PermissionButton
            allowed
            size="small"
            variant="outlined"
            fullWidth={fullWidth}
            startIcon={<UploadFileIcon />}
            onClick={() => handleUploadVersionClick(row)}
          >
            Subir nueva versión
          </PermissionButton>
        )}

        <PermissionButton
          allowed={canEdit("SGC_DOCUMENTOS")}
          size="small"
          variant="outlined"
          fullWidth={fullWidth}
          onClick={() => navigate(`/sgc/documentos/${row.SGCID}`)}
        >
          Editar
        </PermissionButton>

        <PermissionButton
          allowed={canEdit("SGC_DOCUMENTOS")}
          size="small"
          color={row.ACTIVO === 1 ? "warning" : "success"}
          variant="outlined"
          fullWidth={fullWidth}
          onClick={() => handleToggleStatus(row)}
        >
          {row.ACTIVO === 1 ? "Desactivar" : "Activar"}
        </PermissionButton>

        <PermissionButton
          allowed={canDelete("SGC_DOCUMENTOS")}
          size="small"
          color="error"
          variant="outlined"
          fullWidth={fullWidth}
          onClick={() => handleDelete(row)}
        >
          Eliminar
        </PermissionButton>

        {row.ES_CALIDAD && !row.OBSOLETO && (
          <PermissionButton
            allowed
            size="small"
            color="error"
            variant="outlined"
            fullWidth={fullWidth}
            startIcon={<BlockIcon />}
            onClick={() => handleMarkObsolete(row)}
          >
            Marcar obsoleto
          </PermissionButton>
        )}
      </>
    );
  };

  return (
    <Box sx={{ width: "100%" }}>
      {(isLoading || isFetching) && (
        <LoaderOverlay label="Cargando documentos del SGC..." />
      )}

      <input
        type="file"
        ref={fileInputRef}
        hidden
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.txt,.csv"
        onChange={handleFileSelected}
      />

      <PageHeader
        title="Información Documentada"
        subtitle="Documentos del Sistema de Gestión de Calidad, su vigencia y su estado de autorización."
        action={
          <Stack direction="row" spacing={1}>
            <PermissionButton
              allowed
              variant="outlined"
              onClick={() => navigate("/sgc/documentos-externos")}
            >
              Documentos externos
            </PermissionButton>
            <PermissionButton
              allowed={canCreate("SGC_DOCUMENTOS")}
              variant="contained"
              onClick={() => navigate("/sgc/documentos/new")}
            >
              Subir documento
            </PermissionButton>
          </Stack>
        }
      />

      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, sm: 2.2 },
          width: "100%",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, md: 3.2 }}>
            <TextField
              label="Buscar por código, título, tipo o responsable"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              fullWidth
            />
          </Grid>

          <Grid size={{ xs: 6, md: 2.2 }}>
            <FormControl fullWidth>
              <InputLabel>Vigencia</InputLabel>
              <Select
                label="Vigencia"
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                {Object.entries(ESTADO_LABELS).map(([key, label]) => (
                  <MenuItem key={key} value={key}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 6, md: 2.2 }}>
            <FormControl fullWidth>
              <InputLabel>Autorización</InputLabel>
              <Select
                label="Autorización"
                value={aprobacionFilter}
                onChange={(e) => setAprobacionFilter(e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                {Object.entries(ESTADO_APROBACION_LABELS).map(
                  ([key, label]) => (
                    <MenuItem key={key} value={key}>
                      {label}
                    </MenuItem>
                  ),
                )}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 6, md: 2.2 }}>
            <FormControl fullWidth>
              <InputLabel>Departamento</InputLabel>
              <Select
                label="Departamento"
                value={depaFilter}
                onChange={(e) => setDepaFilter(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {(departments ?? []).map((d) => (
                  <MenuItem key={d.DEPAID} value={String(d.DEPAID)}>
                    {d.NOMBRE}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 6, md: 2.2 }}>
            <FormControl fullWidth>
              <InputLabel>Tipo de documento</InputLabel>
              <Select
                label="Tipo de documento"
                value={tipoFilter}
                onChange={(e) => setTipoFilter(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {tiposDocumento.map((tipo) => (
                  <MenuItem key={tipo} value={tipo}>
                    {tipo}
                  </MenuItem>
                ))}
                {haySinTipo && <MenuItem value="__SIN_TIPO__">Sin tipo</MenuItem>}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {isMobile ? (
          <Stack spacing={1.5}>
            {filtered.length === 0 ? (
              <Typography color="text.secondary" sx={{ p: 1 }}>
                No se encontraron documentos.
              </Typography>
            ) : (
              filtered.map((row) => (
                <Card
                  key={row.SGCID}
                  variant="outlined"
                  sx={{
                    borderColor: IPL.border,
                    borderRadius: 3,
                    bgcolor: "background.default",
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 1,
                        alignItems: "flex-start",
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={900} noWrap>
                          {row.TITULO || "-"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {row.CODIGO || "Sin código"} ·{" "}
                          {row.TIPO_DOCUMENTO || "Sin tipo"}
                        </Typography>
                      </Box>
                      <EstadoChip
                        estado={row.ESTADO}
                        dias={row.DIAS_RESTANTES}
                      />
                    </Box>

                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      {Boolean(row.OBSOLETO) && (
                        <Chip
                          label="OBSOLETO"
                          color="error"
                          size="small"
                          icon={<BlockIcon />}
                        />
                      )}
                      <AprobacionChip estado={row.ESTADO_APROBACION} />
                      {row.VERSION_ACTIVA_NUMERO && (
                        <Chip
                          label={`v${row.VERSION_ACTIVA_NUMERO} vigente`}
                          size="small"
                        />
                      )}
                    </Stack>

                    <Stack spacing={0.6} sx={{ mt: 1.4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Departamento: {row.DEPARTAMENTO_NOMBRE || "-"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Responsable: {row.RESPONSABLE_NOMBRE || "-"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Fecha límite: {formatFecha(row.FECHA_LIMITE)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Visibilidad: {row.VISIBILIDAD || "-"}
                      </Typography>
                      {row.FORMATO_ORIGEN_TITULO && (
                        <Typography variant="body2" color="text.secondary">
                          Formato de origen: {row.FORMATO_ORIGEN_TITULO}
                        </Typography>
                      )}
                    </Stack>

                    <Divider sx={{ my: 1.5 }} />
                    <Stack spacing={1}>{renderAcciones(row, true)}</Stack>

                    <Collapse in={expandedIds.has(row.SGCID)}>
                      <Divider sx={{ my: 1.5 }} />
                      {renderHistorial(row)}
                    </Collapse>
                  </CardContent>
                </Card>
              ))
            )}
          </Stack>
        ) : (
          <Box sx={{ overflowX: "auto", width: "100%" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 1300,
              }}
            >
              <thead>
                <tr style={{ textAlign: "left" }}>
                  <th style={{ padding: 10 }}>Código</th>
                  <th style={{ padding: 10 }}>Título</th>
                  <th style={{ padding: 10 }}>Departamento</th>
                  <th style={{ padding: 10 }}>Responsable</th>
                  <th style={{ padding: 10 }}>Visibilidad</th>
                  <th style={{ padding: 10 }}>Fecha límite</th>
                  <th style={{ padding: 10 }}>Vigencia</th>
                  <th style={{ padding: 10 }}>Autorización</th>
                  <th style={{ padding: 10 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: 14, color: "#A1A1AA" }}>
                      No se encontraron documentos.
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <Fragment key={row.SGCID}>
                      <tr style={{ borderTop: `1px solid ${IPL.border}` }}>
                        <td style={{ padding: 10, fontWeight: 900 }}>
                          {row.CODIGO || "-"}
                        </td>
                        <td style={{ padding: 10 }}>
                          {row.TITULO}
                          {Boolean(row.OBSOLETO) && (
                            <Chip
                              label="OBSOLETO"
                              color="error"
                              size="small"
                              icon={<BlockIcon />}
                              sx={{ ml: 1 }}
                            />
                          )}
                        </td>
                        <td style={{ padding: 10 }}>
                          {row.DEPARTAMENTO_NOMBRE || "-"}
                        </td>
                        <td style={{ padding: 10 }}>
                          {row.RESPONSABLE_NOMBRE || "-"}
                        </td>
                        <td style={{ padding: 10 }}>
                          {row.VISIBILIDAD || "-"}
                        </td>
                        <td style={{ padding: 10 }}>
                          {formatFecha(row.FECHA_LIMITE)}
                        </td>
                        <td style={{ padding: 10 }}>
                          <EstadoChip
                            estado={row.ESTADO}
                            dias={row.DIAS_RESTANTES}
                          />
                        </td>
                        <td style={{ padding: 10 }}>
                          <AprobacionChip estado={row.ESTADO_APROBACION} />
                        </td>
                        <td style={{ padding: 10 }}>
                          <Box
                            sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}
                          >
                            {renderAcciones(row, false)}
                          </Box>
                        </td>
                      </tr>
                      {expandedIds.has(row.SGCID) && (
                        <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                          <td colSpan={9} style={{ padding: "4px 16px 16px" }}>
                            {renderHistorial(row)}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))
                )}
              </tbody>
            </table>
          </Box>
        )}
      </Paper>

      <Dialog
        open={Boolean(authorizeDialogRow)}
        onClose={closeAuthorizeDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Autorizar "{authorizeDialogRow?.TITULO}"</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {authorizeDialogRow?.ES_TIPO_FORMATO
              ? "Este documento es tipo Formato: se queda editable para todos, no necesita PDF."
              : "Este documento necesita un PDF: es lo que van a leer todos los demás. El editable quedará restringido solo a Calidad."}
          </DialogContentText>

          <Stack spacing={2}>
            {/* Control de cambios: only Calidad defines the version and what changed */}
            <RadioGroup
              value={authorizeSinCambios ? "revision" : "version"}
              onChange={(e) => {
                const revision = e.target.value === "revision";
                setAuthorizeSinCambios(revision);
                setAuthorizeNumero(String((revision ? authorizeDialogRow?.VERSION_ACTIVA_NUMERO : authorizeDialogRow?.ULTIMA_VERSION?.NUMERO_VERSION) || ""));
                setAuthorizeDescripcion(revision ? "Revisión sin cambios" : "");
              }}
            >
              <FormControlLabel value="version" control={<Radio />} label="Nueva versión (hubo cambios)" />
              <FormControlLabel
                value="revision"
                control={<Radio />}
                disabled={!authorizeDialogRow?.VERSION_ACTIVA_NUMERO}
                label={authorizeDialogRow?.VERSION_ACTIVA_NUMERO ? `Revisión sin cambios (se conserva la versión ${authorizeDialogRow?.VERSION_ACTIVA_NUMERO})` : "Revisión sin cambios (requiere una versión autorizada)"}
              />
            </RadioGroup>
            <TextField
              fullWidth
              required={!authorizeSinCambios}
              disabled={authorizeSinCambios}
              type="number"
              label="Número de versión"
              value={authorizeNumero}
              onChange={(e) => setAuthorizeNumero(e.target.value)}
              slotProps={{ htmlInput: { min: 1, step: 1 } }}
              helperText={
                authorizeSinCambios
                  ? "Una revisión sin cambios conserva el número de la versión vigente."
                  : "Sugerido por el sistema; cámbialo si el documento ya traía otra revisión."
              }
            />
            <TextField
              fullWidth
              required={!authorizeSinCambios}
              multiline
              minRows={2}
              label={authorizeSinCambios ? "Notas de la revisión" : "Descripción del cambio"}
              value={authorizeDescripcion}
              onChange={(e) => setAuthorizeDescripcion(e.target.value.slice(0, 500))}
              placeholder="Ej. se corrige el paso 3, se actualiza el responsable..."
              helperText={`${authorizeDescripcion.length} / 500 caracteres`}
            />

            <TextField
              fullWidth
              required
              type="date"
              label="Fecha límite (siguiente revisión)"
              InputLabelProps={{ shrink: true }}
              value={authorizeFechaLimite}
              onChange={(e) => setAuthorizeFechaLimite(e.target.value)}
              helperText="Al autorizar, hoy queda como última revisión. Esta fecha debe ser posterior a hoy."
            />

            {!authorizeDialogRow?.ES_TIPO_FORMATO && (
              <Box>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<UploadFileIcon />}
                  fullWidth
                >
                  {authorizePdfFile
                    ? authorizePdfFile.name
                    : "Seleccionar PDF (obligatorio)"}
                  <input
                    type="file"
                    hidden
                    accept=".pdf"
                    onChange={(e) =>
                      setAuthorizePdfFile(e.target.files?.[0] ?? null)
                    }
                  />
                </Button>
              </Box>
            )}

            <Box>
              <Button
                component="label"
                variant="outlined"
                startIcon={<UploadFileIcon />}
                fullWidth
              >
                {authorizeEditableFile
                  ? authorizeEditableFile.name
                  : "Reemplazar editable (opcional)"}
                <input
                  type="file"
                  hidden
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.txt,.csv"
                  onChange={(e) =>
                    setAuthorizeEditableFile(e.target.files?.[0] ?? null)
                  }
                />
              </Button>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAuthorizeDialog}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={confirmAuthorize}
            disabled={authorizeMutation.isPending}
          >
            {authorizeMutation.isPending
              ? "Autorizando..."
              : "Autorizar y liberar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
