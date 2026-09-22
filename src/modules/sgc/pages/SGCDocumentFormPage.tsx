import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DescriptionIcon from "@mui/icons-material/Description";
import DownloadIcon from "@mui/icons-material/Download";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import AddIcon from "@mui/icons-material/Add";
import BlockIcon from "@mui/icons-material/Block";
import PageHeader from "../../../shared/components/PageHeader";
import LoaderOverlay from "../../../shared/components/LoaderOverlay";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  SGCService,
  SGCCatalogService,
  SGCTiposDocumentoService,
  SGCCodificacionService,
  TIPO_REGISTRO_NOMBRE,
  VISIBILIDAD_OPCIONES,
  type SGCDocument,
  type SGCDocumentCreatePayload,
  type SGCDocumentUpdatePayload,
  type SGCCatalogDepartment,
  type SGCCatalogUser,
  type SGCTipoDocumento,
  type SGCVersion,
  type SGCDepartamentoCodigo,
} from "../../../services/sgc";
import { useAuth } from "../../../app/providers/useAuth";
import { usePermissions } from "../../../shared/hooks/usePermissions";
import { useAppMutation } from "../../../shared/hooks/useAppMutation";
import {
  confirmAction,
  promptText,
  showWarning,
} from "../../../shared/utils/swal";

type FormState = {
  CODIGO: string;
  TITULO: string;
  TIPO_DOCUMENTO: string;
  DEPAID: string;
  VISIBILIDAD: string;
  RESPONSABLE_ID: string;
  FECHA_CREACION_DOC: string;
  FECHA_ULTIMA_REVISION: string;
  FECHA_LIMITE: string;
  ACTIVO: string;
  FORMATO_ORIGEN_ID: string;
};

const initialState: FormState = {
  CODIGO: "",
  TITULO: "",
  TIPO_DOCUMENTO: "",
  DEPAID: "",
  VISIBILIDAD: "Confidencial",
  RESPONSABLE_ID: "",
  FECHA_CREACION_DOC: "",
  FECHA_ULTIMA_REVISION: "",
  FECHA_LIMITE: "",
  ACTIVO: "1",
  FORMATO_ORIGEN_ID: "",
};

export default function SGCDocumentFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = useMemo(() => Boolean(id), [id]);

  const { user } = useAuth();
  const { canEdit } = usePermissions();

  const esFormularioCompleto =
    (user?.perfil_nombre ?? "").trim().toLowerCase() === "calidad" ||
    canEdit("SGC_DOCUMENTOS");

  const [form, setForm] = useState<FormState>(initialState);
  const [departments, setDepartments] = useState<SGCCatalogDepartment[]>([]);
  const [users, setUsers] = useState<SGCCatalogUser[]>([]);
  const [tiposDocumento, setTiposDocumento] = useState<SGCTipoDocumento[]>([]);
  const [todosLosTipos, setTodosLosTipos] = useState<SGCTipoDocumento[]>([]);
  const [gestionarTiposOpen, setGestionarTiposOpen] = useState(false);
  const [nuevoTipoNombre, setNuevoTipoNombre] = useState("");
  const [addingTipo, setAddingTipo] = useState(false);
  const [formatosDisponibles, setFormatosDisponibles] = useState<SGCDocument[]>(
    [],
  );
  const [departamentosCodigo, setDepartamentosCodigo] = useState<
    SGCDepartamentoCodigo[]
  >([]);
  const [nuevoCodigoArea, setNuevoCodigoArea] = useState("");
  const [savingCodigoArea, setSavingCodigoArea] = useState(false);
  const [sugiriendoCodigo, setSugiriendoCodigo] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [document, setDocument] = useState<SGCDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const newVersionInputRef = useRef<HTMLInputElement>(null);

  const [authorizeDialogVersion, setAuthorizeDialogVersion] =
    useState<SGCVersion | null>(null);
  const [authorizeEditableFile, setAuthorizeEditableFile] =
    useState<File | null>(null);
  const [authorizePdfFile, setAuthorizePdfFile] = useState<File | null>(null);
  const [authorizeFechaLimite, setAuthorizeFechaLimite] = useState("");

  const esTipoRegistro =
    form.TIPO_DOCUMENTO.trim().toLowerCase() ===
    TIPO_REGISTRO_NOMBRE.toLowerCase();

  const saveMutation = useAppMutation(
    async (payload: SGCDocumentCreatePayload | SGCDocumentUpdatePayload) => {
      if (isEdit && id)
        return SGCService.update(
          Number(id),
          payload as SGCDocumentUpdatePayload,
        );
      return SGCService.create(payload as SGCDocumentCreatePayload);
    },
    {
      invalidateKeys: [["sgc-documents"]],
      successMessage: isEdit
        ? "Documento actualizado correctamente"
        : "Documento creado, pendiente de autorización de Calidad",
      onSuccess: () => navigate("/sgc/documentos"),
    },
  );

  const authorizeMutation = useAppMutation(
    ({
      versionId,
      editableFile,
      pdfFile,
      fechaLimite,
    }: {
      versionId: number;
      editableFile: File | null;
      pdfFile: File | null;
      fechaLimite: string | null;
    }) =>
      SGCService.authorizeVersion(Number(id), versionId, {
        file: editableFile,
        pdf: pdfFile,
        fechaLimite,
      }),
    {
      invalidateKeys: [["sgc-documents"]],
      successMessage: "Versión autorizada y liberada",
      onSuccess: () => {
        closeAuthorizeDialog();
        loadDocument();
      },
    },
  );

  const rejectMutation = useAppMutation(
    ({
      versionId,
      comentarios,
    }: {
      versionId: number;
      comentarios: string | null;
    }) => SGCService.rejectVersion(Number(id), versionId, comentarios),
    {
      invalidateKeys: [["sgc-documents"]],
      successMessage: "Versión rechazada",
      onSuccess: () => loadDocument(),
    },
  );

  const obsoleteMutation = useAppMutation(
    () => SGCService.markObsolete(Number(id)),
    {
      invalidateKeys: [["sgc-documents"]],
      successMessage: "Documento marcado como obsoleto",
      onSuccess: () => loadDocument(),
    },
  );

  const uploadVersionMutation = useAppMutation(
    ({ file, descripcion }: { file: File; descripcion: string }) =>
      SGCService.uploadVersion(Number(id), file, descripcion),
    {
      invalidateKeys: [["sgc-documents"]],
      successMessage: "Nueva versión subida, pendiente de autorización",
      onSuccess: () => loadDocument(),
    },
  );

  const loadDocument = async () => {
    if (!id) return;
    const doc = await SGCService.getById(Number(id));
    setDocument(doc);

    setForm({
      CODIGO: doc.CODIGO ?? "",
      TITULO: doc.TITULO ?? "",
      TIPO_DOCUMENTO: doc.TIPO_DOCUMENTO ?? "",
      DEPAID: doc.DEPAID ? String(doc.DEPAID) : "",
      VISIBILIDAD: doc.VISIBILIDAD ?? "Confidencial",
      RESPONSABLE_ID: doc.RESPONSABLE_ID ? String(doc.RESPONSABLE_ID) : "",
      FECHA_CREACION_DOC: (doc.FECHA_CREACION_DOC ?? "").slice(0, 10),
      FECHA_ULTIMA_REVISION: (doc.FECHA_ULTIMA_REVISION ?? "").slice(0, 10),
      FECHA_LIMITE: (doc.FECHA_LIMITE ?? "").slice(0, 10),
      ACTIVO: String(doc.ACTIVO ?? 1),
      FORMATO_ORIGEN_ID: doc.FORMATO_ORIGEN_ID
        ? String(doc.FORMATO_ORIGEN_ID)
        : "",
    });
  };

  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);

        const tiposData = await SGCTiposDocumentoService.getAll();
        setTiposDocumento(tiposData);

        if (esFormularioCompleto) {
          const [departmentsData, usersData, codigosData] = await Promise.all([
            SGCCatalogService.getDepartments(),
            SGCCatalogService.getUsers(),
            SGCCodificacionService.getDepartamentosCodigo(),
          ]);
          setDepartments(departmentsData);
          setUsers(usersData);
          setDepartamentosCodigo(codigosData);
        }

        try {
          const allDocs = await SGCService.getAll();
          setFormatosDisponibles(
            allDocs.filter(
              (d) => d.ES_TIPO_FORMATO && d.ESTADO_APROBACION === "AUTORIZADO",
            ),
          );
        } catch {
          setFormatosDisponibles([]);
        }

        if (id) {
          await loadDocument();
        } else if (!esFormularioCompleto) {
          setForm((prev) => ({
            ...prev,
            RESPONSABLE_ID: user?.user_id ? String(user.user_id) : "",
          }));
        }
      } finally {
        setLoading(false);
      }
    };

    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, esFormularioCompleto]);

  const handleChange = (e: any) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: String(e.target.value ?? ""),
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
  };

  const codigoAreaDepartamentoActual = departamentosCodigo.find(
    (d) => String(d.DEPAID) === form.DEPAID,
  );

  const handleSugerirCodigo = async () => {
    if (!form.DEPAID || !form.TIPO_DOCUMENTO) {
      await showWarning("Selecciona primero Departamento y Tipo de documento");
      return;
    }

    try {
      setSugiriendoCodigo(true);
      const resultado = await SGCCodificacionService.getNextCode(
        Number(form.DEPAID),
        form.TIPO_DOCUMENTO,
      );

      if (!resultado.CODIGO_SUGERIDO) {
        await showWarning(
          resultado.motivo ||
            "No se pudo sugerir un código (falta configurar área o tipo)",
        );
        return;
      }

      setForm((prev) => ({
        ...prev,
        CODIGO: resultado.CODIGO_SUGERIDO as string,
      }));
    } catch (error) {
      await showWarning(
        error instanceof Error ? error.message : "No se pudo sugerir el código",
      );
    } finally {
      setSugiriendoCodigo(false);
    }
  };

  const handleGuardarCodigoArea = async () => {
    const codigo = nuevoCodigoArea.trim();
    if (!form.DEPAID || !codigo) return;

    try {
      setSavingCodigoArea(true);
      await SGCCodificacionService.setDepartamentoCodigo(
        Number(form.DEPAID),
        codigo,
      );
      const codigosData = await SGCCodificacionService.getDepartamentosCodigo();
      setDepartamentosCodigo(codigosData);
      setNuevoCodigoArea("");
    } catch (error) {
      await showWarning(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el código de área",
      );
    } finally {
      setSavingCodigoArea(false);
    }
  };

  const handleAddTipo = async () => {
    const nombre = nuevoTipoNombre.trim();
    if (!nombre) return;

    try {
      setAddingTipo(true);
      await SGCTiposDocumentoService.create(nombre);
      const tiposData = await SGCTiposDocumentoService.getAll();
      setTiposDocumento(tiposData);
      setForm((prev) => ({ ...prev, TIPO_DOCUMENTO: nombre }));
      setNuevoTipoNombre("");
    } catch (error) {
      await showWarning(
        error instanceof Error ? error.message : "No se pudo agregar el tipo",
      );
    } finally {
      setAddingTipo(false);
    }
  };

  const openGestionarTipos = async () => {
    try {
      const data = await SGCTiposDocumentoService.getAllIncludingInactive();
      setTodosLosTipos(data);
      setGestionarTiposOpen(true);
    } catch (error) {
      await showWarning(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los tipos",
      );
    }
  };

  const closeGestionarTipos = () => setGestionarTiposOpen(false);

  const handleToggleTipoStatus = async (tipo: SGCTipoDocumento) => {
    try {
      await SGCTiposDocumentoService.changeStatus(
        tipo.TIPO_DOCUMENTO_ID,
        tipo.ACTIVO === 1 ? 0 : 1,
      );
      const [todos, activos] = await Promise.all([
        SGCTiposDocumentoService.getAllIncludingInactive(),
        SGCTiposDocumentoService.getAll(),
      ]);
      setTodosLosTipos(todos);
      setTiposDocumento(activos);
    } catch (error) {
      await showWarning(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el tipo",
      );
    }
  };

  const validate = () => {
    const errors: Partial<Record<keyof FormState, string>> = {};

    if (!form.TITULO.trim()) errors.TITULO = "El título es obligatorio";
    if (esFormularioCompleto && !form.FECHA_LIMITE) {
      errors.FECHA_LIMITE = "La fecha límite es obligatoria";
    }

    if (
      form.FECHA_CREACION_DOC &&
      form.FECHA_LIMITE &&
      form.FECHA_CREACION_DOC > form.FECHA_LIMITE
    ) {
      errors.FECHA_LIMITE =
        "La fecha límite no puede ser anterior a la de creación";
    }

    return errors;
  };

  const errors = validate();
  const isFormValid = Object.keys(errors).length === 0;

  const fieldError = (name: keyof FormState) =>
    submitted && Boolean(errors[name]);
  const helperText = (name: keyof FormState) =>
    submitted ? errors[name] || " " : " ";

  const save = async () => {
    setSubmitted(true);

    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      await showWarning("Completa los campos obligatorios antes de guardar");
      return;
    }

    if (!isEdit && !file) {
      await showWarning("Debes adjuntar el archivo del documento");
      return;
    }

    const depaid = esFormularioCompleto
      ? form.DEPAID
        ? Number(form.DEPAID)
        : null
      : (user?.depaid ?? null);

    const responsableId = esFormularioCompleto
      ? form.RESPONSABLE_ID
        ? Number(form.RESPONSABLE_ID)
        : null
      : (user?.user_id ?? null);

    const formatoOrigenId =
      esTipoRegistro && form.FORMATO_ORIGEN_ID
        ? Number(form.FORMATO_ORIGEN_ID)
        : null;

    try {
      if (isEdit) {
        await saveMutation.mutateAsync({
          CODIGO: form.CODIGO.trim() || null,
          TITULO: form.TITULO.trim(),
          TIPO_DOCUMENTO: form.TIPO_DOCUMENTO || null,
          DEPAID: depaid,
          VISIBILIDAD: form.VISIBILIDAD || "Confidencial",
          RESPONSABLE_ID: responsableId,
          FECHA_CREACION_DOC: form.FECHA_CREACION_DOC || null,
          FECHA_ULTIMA_REVISION: form.FECHA_ULTIMA_REVISION || null,
          FECHA_LIMITE: form.FECHA_LIMITE,
          ACTIVO: Number(form.ACTIVO),
          FORMATO_ORIGEN_ID: formatoOrigenId,
        } satisfies SGCDocumentUpdatePayload);
      } else {
        await saveMutation.mutateAsync({
          CODIGO: form.CODIGO.trim() || null,
          TITULO: form.TITULO.trim(),
          TIPO_DOCUMENTO: form.TIPO_DOCUMENTO || null,
          DEPAID: depaid,
          RESPONSABLE_ID: responsableId,
          FECHA_CREACION_DOC: form.FECHA_CREACION_DOC || null,
          FECHA_ULTIMA_REVISION: form.FECHA_ULTIMA_REVISION || null,
          FECHA_LIMITE: form.FECHA_LIMITE || null,
          ACTIVO: Number(form.ACTIVO),
          FORMATO_ORIGEN_ID: formatoOrigenId,
          file: file as File,
        } satisfies SGCDocumentCreatePayload);
      }
    } catch (error) {
      console.error("Error al guardar documento SGC:", error);
    }
  };

  const handleDownloadVersion = (versionId: number) => {
    window.open(SGCService.downloadVersionUrl(Number(id), versionId), "_blank");
  };

  const handleDownloadVersionPdf = (versionId: number) => {
    window.open(
      SGCService.downloadVersionPdfUrl(Number(id), versionId),
      "_blank",
    );
  };

  const openAuthorizeDialog = (version: SGCVersion) => {
    setAuthorizeDialogVersion(version);
    setAuthorizeEditableFile(null);
    setAuthorizePdfFile(null);
    setAuthorizeFechaLimite(form.FECHA_LIMITE || "");
  };

  const closeAuthorizeDialog = () => {
    setAuthorizeDialogVersion(null);
    setAuthorizeEditableFile(null);
    setAuthorizePdfFile(null);
    setAuthorizeFechaLimite("");
  };

  const confirmAuthorize = async () => {
    if (!authorizeDialogVersion) return;

    const yaHayFechaLimite = Boolean(form.FECHA_LIMITE);

    if (!yaHayFechaLimite && !authorizeFechaLimite) {
      await showWarning(
        "Este documento no tiene Fecha límite. Captúrala para poder autorizar.",
      );
      return;
    }

    if (!document?.ES_TIPO_FORMATO && !authorizePdfFile) {
      await showWarning(
        "Este tipo de documento necesita un PDF para autorizarse (todos lo van a leer en PDF, el editable queda restringido a Calidad).",
      );
      return;
    }

    authorizeMutation.mutate({
      versionId: authorizeDialogVersion.VERSIONID,
      editableFile: authorizeEditableFile,
      pdfFile: authorizePdfFile,
      fechaLimite: authorizeFechaLimite || null,
    });
  };

  const handleReject = async (versionId: number) => {
    const comentarios = await promptText(
      "Indica el motivo del rechazo (obligatorio).",
      "Rechazar documento",
      "Ej. falta la firma del responsable...",
    );
    if (comentarios === null) return;

    if (!comentarios.trim()) {
      await showWarning("El motivo del rechazo es obligatorio");
      return;
    }

    rejectMutation.mutate({ versionId, comentarios: comentarios.trim() });
  };

  const handleMarkObsolete = async () => {
    const confirmed = await confirmAction(
      `¿Marcar este documento como OBSOLETO? Esta acción es definitiva: ya no se debe usar, ` +
        `y si tiene PDF se le imprime la marca de agua de forma permanente (no se puede deshacer).`,
      "Marcar como obsoleto",
      "Sí, marcar obsoleto",
    );
    if (!confirmed) return;
    obsoleteMutation.mutate();
  };

  const handleUploadNewVersionClick = () => {
    newVersionInputRef.current?.click();
  };

  const handleNewVersionSelected = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selected = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!selected) return;

    const descripcion = await promptText(
      "Describe brevemente qué cambió respecto a la versión anterior (obligatorio).",
      "Descripción del cambio",
      "Ej. se corrige el paso 3, se actualiza el responsable...",
    );

    if (descripcion === null) return;

    if (!descripcion.trim()) {
      await showWarning("La descripción del cambio es obligatoria");
      return;
    }

    uploadVersionMutation.mutate({
      file: selected,
      descripcion: descripcion.trim(),
    });
  };

  if (loading) return <LoaderOverlay label="Cargando documento..." />;

  const puedeSubirVersion =
    isEdit &&
    document &&
    document.ESTADO_APROBACION !== "PENDIENTE_AUTORIZACION" &&
    (document.ES_RESPONSABLE || document.ES_CALIDAD);

  return (
    <Box>
      <PageHeader
        title={isEdit ? "Editar documento" : "Subir documento"}
        subtitle={
          isEdit
            ? "Edita los datos del documento y gestiona sus versiones."
            : esFormularioCompleto
              ? "Captura la información de control del documento del SGC. Se sube en estado Borrador, pendiente de autorización de Calidad."
              : `Se subirá a nombre de ${user?.nombre ?? "tu usuario"}, departamento ${user?.departamento_nombre ?? "-"}. Queda en estado Borrador, pendiente de autorización de Calidad.`
        }
      />

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5, md: 3 },
          bgcolor: "background.paper",
          borderRadius: 3,
          width: "100%",
          boxSizing: "border-box",
          mb: 3,
        }}
      >
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            {esFormularioCompleto ? (
              <>
                <Stack direction="row" spacing={1}>
                  <TextField
                    fullWidth
                    label="Código de documento"
                    name="CODIGO"
                    placeholder="Ej. SIS-PRO-01"
                    value={form.CODIGO}
                    onChange={handleChange}
                  />
                  <Button
                    variant="outlined"
                    onClick={handleSugerirCodigo}
                    disabled={sugiriendoCodigo}
                    sx={{ whiteSpace: "nowrap" }}
                  >
                    {sugiriendoCodigo ? "..." : "Sugerir"}
                  </Button>
                </Stack>
                <FormHelperText>
                  Según Área-Tipo-Consecutivo. Puedes escribirlo manual o usar
                  "Sugerir".
                </FormHelperText>
              </>
            ) : (
              <TextField
                fullWidth
                disabled
                label="Código de documento"
                value="Calidad lo asignará"
                helperText="El código oficial lo asigna Calidad al revisar el documento."
              />
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <TextField
              fullWidth
              required
              label="Título"
              name="TITULO"
              value={form.TITULO}
              onChange={handleChange}
              error={fieldError("TITULO")}
              helperText={helperText("TITULO")}
            />
          </Grid>

          <Grid size={{ xs: 12, md: esFormularioCompleto ? 4 : 6 }}>
            <FormControl fullWidth>
              <InputLabel>Tipo de documento</InputLabel>
              <Select
                name="TIPO_DOCUMENTO"
                value={form.TIPO_DOCUMENTO}
                label="Tipo de documento"
                onChange={handleChange}
              >
                <MenuItem value="">Seleccione</MenuItem>
                {tiposDocumento.map((tipo) => (
                  <MenuItem key={tipo.TIPO_DOCUMENTO_ID} value={tipo.NOMBRE}>
                    {tipo.NOMBRE}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                &quot;Formato&quot; se queda editable para todos. Los demás
                tipos se autorizan con un PDF que ve todo el mundo.
              </FormHelperText>
            </FormControl>

            {esFormularioCompleto && (
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Agregar tipo nuevo..."
                  value={nuevoTipoNombre}
                  onChange={(e) => setNuevoTipoNombre(e.target.value)}
                />
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddIcon />}
                  disabled={addingTipo || !nuevoTipoNombre.trim()}
                  onClick={handleAddTipo}
                >
                  Agregar
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={openGestionarTipos}
                >
                  Gestionar
                </Button>
              </Stack>
            )}
          </Grid>

          {esTipoRegistro && (
            <Grid size={{ xs: 12, md: esFormularioCompleto ? 4 : 6 }}>
              <FormControl fullWidth>
                <InputLabel>Formato de origen (opcional)</InputLabel>
                <Select
                  name="FORMATO_ORIGEN_ID"
                  value={form.FORMATO_ORIGEN_ID}
                  label="Formato de origen (opcional)"
                  onChange={handleChange}
                >
                  <MenuItem value="">Ninguno</MenuItem>
                  {formatosDisponibles.map((f) => (
                    <MenuItem key={f.SGCID} value={String(f.SGCID)}>
                      {f.CODIGO ? `${f.CODIGO} - ` : ""}
                      {f.TITULO}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  ¿De qué Formato en blanco viene este llenado? Ayuda a filtrar
                  evidencias en auditorías.
                </FormHelperText>
              </FormControl>
            </Grid>
          )}

          <Grid size={{ xs: 12, md: 4 }}>
            {esFormularioCompleto ? (
              <FormControl fullWidth>
                <InputLabel>Departamento</InputLabel>
                <Select
                  name="DEPAID"
                  value={form.DEPAID}
                  label="Departamento"
                  onChange={handleChange}
                >
                  <MenuItem value="">Seleccione</MenuItem>
                  {departments.map((item) => (
                    <MenuItem key={item.DEPAID} value={String(item.DEPAID)}>
                      {item.NOMBRE}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <TextField
                fullWidth
                disabled
                label="Departamento"
                value={user?.departamento_nombre ?? "Sin departamento asignado"}
                helperText="Se toma de tu sesión, no se puede cambiar aquí."
              />
            )}

            {esFormularioCompleto &&
              form.DEPAID &&
              !codigoAreaDepartamentoActual?.CODIGO_AREA && (
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Código de área (ej. SIS)"
                    value={nuevoCodigoArea}
                    onChange={(e) =>
                      setNuevoCodigoArea(e.target.value.toUpperCase())
                    }
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={savingCodigoArea || !nuevoCodigoArea.trim()}
                    onClick={handleGuardarCodigoArea}
                  >
                    Asignar
                  </Button>
                </Stack>
              )}
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            {isEdit ? (
              <FormControl fullWidth>
                <InputLabel>Visibilidad</InputLabel>
                <Select
                  name="VISIBILIDAD"
                  value={form.VISIBILIDAD}
                  label="Visibilidad"
                  onChange={handleChange}
                >
                  {VISIBILIDAD_OPCIONES.map((v) => (
                    <MenuItem key={v} value={v}>
                      {v}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Confidencial: solo el departamento. Interno: toda la sucursal
                  del responsable. Público: cualquiera.
                </FormHelperText>
              </FormControl>
            ) : (
              <TextField
                fullWidth
                disabled
                label="Visibilidad"
                value="Confidencial (inicial)"
                helperText="Todo documento nuevo inicia como Confidencial. Calidad puede cambiarlo después."
              />
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            {esFormularioCompleto ? (
              <FormControl fullWidth>
                <InputLabel>Responsable</InputLabel>
                <Select
                  name="RESPONSABLE_ID"
                  value={form.RESPONSABLE_ID}
                  label="Responsable"
                  onChange={handleChange}
                >
                  <MenuItem value="">Seleccione (tú, por defecto)</MenuItem>
                  {users.map((item) => (
                    <MenuItem
                      key={item.USUARIOID}
                      value={String(item.USUARIOID)}
                    >
                      {item.NOMBRE} {item.HAS_EMAIL ? "" : "(sin correo)"}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Solo usuarios con correo configurado recibirán recordatorios
                  automáticos.
                </FormHelperText>
              </FormControl>
            ) : (
              <TextField
                fullWidth
                disabled
                label="Responsable"
                value={user?.nombre ?? "Tu usuario"}
                helperText="Quedas tú como responsable de este documento."
              />
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Activo</InputLabel>
              <Select
                name="ACTIVO"
                value={form.ACTIVO}
                label="Activo"
                onChange={handleChange}
              >
                <MenuItem value="1">Sí</MenuItem>
                <MenuItem value="0">No</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {esFormularioCompleto ? (
            <>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha de creación"
                  name="FECHA_CREACION_DOC"
                  InputLabelProps={{ shrink: true }}
                  value={form.FECHA_CREACION_DOC}
                  onChange={handleChange}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha de última revisión"
                  name="FECHA_ULTIMA_REVISION"
                  InputLabelProps={{ shrink: true }}
                  value={form.FECHA_ULTIMA_REVISION}
                  onChange={handleChange}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  required
                  type="date"
                  label="Fecha límite"
                  name="FECHA_LIMITE"
                  InputLabelProps={{ shrink: true }}
                  value={form.FECHA_LIMITE}
                  onChange={handleChange}
                  error={fieldError("FECHA_LIMITE")}
                  helperText={helperText("FECHA_LIMITE")}
                />
              </Grid>
            </>
          ) : (
            <Grid size={{ xs: 12 }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontStyle: "italic" }}
              >
                Las fechas de control (creación, última revisión y fecha límite)
                las define Calidad al revisar el documento, no se capturan aquí.
              </Typography>
            </Grid>
          )}

          {!isEdit && (
            <Grid size={{ xs: 12 }}>
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
                  Seleccionar archivo
                  <input
                    type="file"
                    hidden
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.txt,.csv"
                    onChange={handleFileChange}
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
              {submitted && !file && (
                <FormHelperText error>
                  El archivo del documento es obligatorio
                </FormHelperText>
              )}
            </Grid>
          )}
        </Grid>

        <Box
          sx={{
            mt: 3,
            display: "flex",
            gap: 1.2,
            flexWrap: "wrap",
            "& .MuiButton-root": { width: { xs: "100%", sm: "auto" } },
          }}
        >
          <Button
            variant="contained"
            onClick={save}
            disabled={saveMutation.isPending || (submitted && !isFormValid)}
          >
            {saveMutation.isPending
              ? isEdit
                ? "Actualizando..."
                : "Guardando..."
              : isEdit
                ? "Actualizar datos"
                : "Guardar documento"}
          </Button>

          <Button
            variant="outlined"
            onClick={() => navigate("/sgc/documentos")}
          >
            Cancelar
          </Button>
        </Box>
      </Paper>

      {isEdit && document && document.VERSION_ACTIVA_ID && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 2.5, md: 3 },
            bgcolor: "background.paper",
            borderRadius: 3,
            width: "100%",
            boxSizing: "border-box",
            mb: 3,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1,
              mb: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="h6" fontWeight={900}>
                Documento vigente
              </Typography>
              {Boolean(document.OBSOLETO) && (
                <Chip
                  label="OBSOLETO"
                  color="error"
                  size="small"
                  icon={<BlockIcon />}
                />
              )}
            </Box>

            {document.ES_CALIDAD && !document.OBSOLETO && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<BlockIcon />}
                onClick={handleMarkObsolete}
              >
                Marcar obsoleto
              </Button>
            )}
          </Box>

          {Boolean(document.OBSOLETO) && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Marcado como obsoleto por {document.OBSOLETO_POR_NOMBRE || "-"} el{" "}
              {(document.FECHA_OBSOLETO || "").slice(0, 10)}. Ya no debe usarse.
            </Typography>
          )}

          {document.ES_TIPO_FORMATO ? (
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() =>
                window.open(SGCService.downloadUrl(document.SGCID), "_blank")
              }
            >
              Descargar Formato (editable)
            </Button>
          ) : document.VERSION_ACTIVA_PDF_URL ? (
            <Box>
              <Box
                component="iframe"
                src={SGCService.viewUrl(document.SGCID)}
                sx={{
                  width: "100%",
                  height: 500,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                }}
              />
              <Button
                sx={{ mt: 1 }}
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() =>
                  window.open(SGCService.downloadUrl(document.SGCID), "_blank")
                }
              >
                Descargar PDF
              </Button>
            </Box>
          ) : (
            <Typography color="text.secondary">
              El PDF de este documento todavía no está disponible.
            </Typography>
          )}
        </Paper>
      )}

      {isEdit && document && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 2.5, md: 3 },
            bgcolor: "background.paper",
            borderRadius: 3,
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1,
              mb: 2,
            }}
          >
            <Typography variant="h6" fontWeight={900}>
              Historial de versiones
            </Typography>

            {puedeSubirVersion && (
              <Button
                variant="outlined"
                startIcon={<UploadFileIcon />}
                onClick={handleUploadNewVersionClick}
              >
                Subir nueva versión
              </Button>
            )}
          </Box>

          <input
            type="file"
            ref={newVersionInputRef}
            hidden
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.txt,.csv"
            onChange={handleNewVersionSelected}
          />

          <Stack spacing={1.5} divider={<Divider />}>
            {(document.VERSIONES ?? []).length === 0 && (
              <Typography color="text.secondary">
                Este documento no tiene versiones.
              </Typography>
            )}

            {(document.VERSIONES ?? []).map((v) => (
              <Box key={v.VERSIONID}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: 1,
                  }}
                >
                  <Box>
                    <Typography fontWeight={800}>
                      Versión {v.NUMERO_VERSION}{" "}
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
                    <Typography variant="body2" color="text.secondary">
                      Subido por {v.SUBIDO_POR_NOMBRE || "-"} el{" "}
                      {(v.FECHA_SUBIDA || "").slice(0, 10)}
                    </Typography>
                    {v.DESCRIPCION_CAMBIO && (
                      <Typography variant="body2" color="text.secondary">
                        Cambio: {v.DESCRIPCION_CAMBIO}
                      </Typography>
                    )}
                    {v.FECHA_AUTORIZACION && (
                      <Typography variant="body2" color="text.secondary">
                        {v.ESTADO === "AUTORIZADO" ? "Autorizado" : "Rechazado"}{" "}
                        por {v.AUTORIZADO_POR_NOMBRE || "-"} el{" "}
                        {(v.FECHA_AUTORIZACION || "").slice(0, 10)}
                      </Typography>
                    )}
                    {v.COMENTARIOS && (
                      <Typography variant="body2" color="text.secondary">
                        Comentarios: {v.COMENTARIOS}
                      </Typography>
                    )}
                  </Box>

                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {v.ESTADO === "RECHAZADO" ? (
                      <Typography variant="caption" color="text.secondary">
                        Rechazado, sin descarga
                      </Typography>
                    ) : v.ESTADO === "BORRADOR" ? (
                      v.ARCHIVO_DISPONIBLE ? (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<DownloadIcon />}
                          onClick={() => handleDownloadVersion(v.VERSIONID)}
                        >
                          Descargar editable
                        </Button>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Editable no disponible
                        </Typography>
                      )
                    ) : document.ES_TIPO_FORMATO ? (
                      v.ARCHIVO_DISPONIBLE ? (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<DownloadIcon />}
                          onClick={() => handleDownloadVersion(v.VERSIONID)}
                        >
                          Descargar editable
                        </Button>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Editable no disponible
                        </Typography>
                      )
                    ) : v.ARCHIVO_PDF_DISPONIBLE ? (
                      document.ES_CALIDAD ? (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<DownloadIcon />}
                          onClick={() => handleDownloadVersionPdf(v.VERSIONID)}
                        >
                          Descargar PDF
                        </Button>
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

                    {document.ES_CALIDAD && v.ESTADO === "BORRADOR" && (
                      <>
                        <Button
                          size="small"
                          variant="outlined"
                          color="success"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => openAuthorizeDialog(v)}
                        >
                          Autorizar
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<CancelIcon />}
                          onClick={() => handleReject(v.VERSIONID)}
                        >
                          Rechazar
                        </Button>
                      </>
                    )}
                  </Stack>
                </Box>
              </Box>
            ))}
          </Stack>
        </Paper>
      )}

      <Dialog
        open={Boolean(authorizeDialogVersion)}
        onClose={closeAuthorizeDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Autorizar versión {authorizeDialogVersion?.NUMERO_VERSION}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {document?.ES_TIPO_FORMATO
              ? "Este documento es tipo Formato: se queda editable para todos, no necesita PDF."
              : "Este documento necesita un PDF: es lo que van a leer todos los demás. El editable quedará restringido solo a Calidad."}
          </DialogContentText>

          <Stack spacing={2}>
            {!form.FECHA_LIMITE && (
              <TextField
                fullWidth
                required
                type="date"
                label="Fecha límite"
                InputLabelProps={{ shrink: true }}
                value={authorizeFechaLimite}
                onChange={(e) => setAuthorizeFechaLimite(e.target.value)}
                helperText="Este documento todavía no tiene Fecha límite; captúrala aquí para poder autorizar."
              />
            )}

            {!document?.ES_TIPO_FORMATO && (
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

      <Dialog
        open={gestionarTiposOpen}
        onClose={closeGestionarTipos}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Gestionar tipos de documento</DialogTitle>
        <DialogContent>
          <Stack spacing={1} sx={{ mt: 1 }}>
            {todosLosTipos.length === 0 && (
              <Typography color="text.secondary">
                No hay tipos registrados.
              </Typography>
            )}
            {todosLosTipos.map((tipo) => (
              <Box
                key={tipo.TIPO_DOCUMENTO_ID}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  py: 0.5,
                }}
              >
                <Typography sx={{ opacity: tipo.ACTIVO === 1 ? 1 : 0.5 }}>
                  {tipo.NOMBRE} {tipo.ACTIVO !== 1 && "(inactivo)"}
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  color={tipo.ACTIVO === 1 ? "warning" : "success"}
                  onClick={() => handleToggleTipoStatus(tipo)}
                >
                  {tipo.ACTIVO === 1 ? "Desactivar" : "Activar"}
                </Button>
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeGestionarTipos}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
