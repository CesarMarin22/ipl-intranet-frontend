import { api } from "./api";

type ApiResponse<T> = {
  ok: boolean;
  message: string;
  data: T;
};

export type SGCEstado =
  | "VENCIDO"
  | "URGENTE"
  | "PROXIMO_A_VENCER"
  | "VIGENTE"
  | "SIN_FECHA";

export type SGCEstadoAprobacion =
  | "SIN_VERSION"
  | "PENDIENTE_AUTORIZACION"
  | "AUTORIZADO"
  | "RECHAZADO";

export type SGCVersion = {
  VERSIONID: number;
  SGCID?: number;
  NUMERO_VERSION: number;
  ESTADO: "BORRADOR" | "AUTORIZADO" | "RECHAZADO";
  FECHA_SUBIDA: string;
  FECHA_AUTORIZACION?: string | null;
  COMENTARIOS?: string | null;
  DESCRIPCION_CAMBIO?: string | null;
  SUBIDO_POR_NOMBRE?: string | null;
  AUTORIZADO_POR_NOMBRE?: string | null;
  ARCHIVO_DISPONIBLE: boolean;
  ARCHIVO_PDF_DISPONIBLE: boolean;
};

export type SGCDocument = {
  SGCID: number;
  CODIGO?: string | null;
  TITULO: string;
  TIPO_DOCUMENTO?: string | null;
  DEPAID?: number | null;
  DEPARTAMENTO_NOMBRE?: string | null;
  VISIBILIDAD?: string | null;
  RESPONSABLE_ID?: number | null;
  RESPONSABLE_NOMBRE?: string | null;
  RESPONSABLE_EMAIL?: string | null;
  FECHA_CREACION_DOC?: string | null;
  FECHA_ULTIMA_REVISION?: string | null;
  FECHA_LIMITE?: string | null;
  ULTIMO_RECORDATORIO_ENVIADO?: string | null;
  ACTIVO: number;
  VERSION_ACTIVA_ID?: number | null;
  VERSION_ACTIVA_NUMERO?: number | null;
  VERSION_ACTIVA_ARCHIVO?: string | null;
  VERSION_ACTIVA_PDF_URL?: string | null;
  VERSION_ACTIVA_PDF_NOMBRE?: string | null;
  FORMATO_ORIGEN_ID?: number | null;
  FORMATO_ORIGEN_TITULO?: string | null;
  OBSOLETO?: number;
  FECHA_OBSOLETO?: string | null;
  OBSOLETO_POR_NOMBRE?: string | null;
  ESTADO: SGCEstado;
  DIAS_RESTANTES: number | null;
  ESTADO_APROBACION: SGCEstadoAprobacion;
  ULTIMA_VERSION?: SGCVersion | null;
  VERSIONES?: SGCVersion[];
  PUEDE_APROBAR: boolean;
  PUEDE_VER_HISTORIAL: boolean;
  ES_RESPONSABLE: boolean;
  ES_CALIDAD: boolean;
  ES_TIPO_FORMATO: boolean;
};

export type SGCDocumentCreatePayload = {
  CODIGO?: string | null;
  TITULO: string;
  TIPO_DOCUMENTO?: string | null;
  DEPAID?: number | null;
  RESPONSABLE_ID?: number | null;
  FECHA_CREACION_DOC?: string | null;
  FECHA_ULTIMA_REVISION?: string | null;
  FECHA_LIMITE?: string | null;
  ACTIVO?: number;
  FORMATO_ORIGEN_ID?: number | null;
  file: File;
};

export type SGCDocumentUpdatePayload = {
  CODIGO?: string | null;
  TITULO: string;
  TIPO_DOCUMENTO?: string | null;
  DEPAID?: number | null;
  VISIBILIDAD?: string | null;
  RESPONSABLE_ID?: number | null;
  FECHA_CREACION_DOC?: string | null;
  FECHA_ULTIMA_REVISION?: string | null;
  FECHA_LIMITE: string;
  ACTIVO?: number;
  FORMATO_ORIGEN_ID?: number | null;
};

export const VISIBILIDAD_OPCIONES = [
  "Confidencial",
  "Interno",
  "Público",
] as const;

const validateResponse = <T>(response: ApiResponse<T>): T => {
  if (!response.ok) {
    throw new Error(response.message || "Ocurrió un error");
  }
  return response.data;
};

const toCreateFormData = (payload: SGCDocumentCreatePayload) => {
  const fd = new FormData();

  fd.append("TITULO", payload.TITULO);
  fd.append("file", payload.file);

  if (payload.FECHA_LIMITE) fd.append("FECHA_LIMITE", payload.FECHA_LIMITE);
  if (payload.CODIGO) fd.append("CODIGO", payload.CODIGO);
  if (payload.TIPO_DOCUMENTO)
    fd.append("TIPO_DOCUMENTO", payload.TIPO_DOCUMENTO);
  if (payload.DEPAID) fd.append("DEPAID", String(payload.DEPAID));
  if (payload.RESPONSABLE_ID)
    fd.append("RESPONSABLE_ID", String(payload.RESPONSABLE_ID));
  if (payload.FECHA_CREACION_DOC)
    fd.append("FECHA_CREACION_DOC", payload.FECHA_CREACION_DOC);
  if (payload.FECHA_ULTIMA_REVISION)
    fd.append("FECHA_ULTIMA_REVISION", payload.FECHA_ULTIMA_REVISION);
  if (payload.FORMATO_ORIGEN_ID)
    fd.append("FORMATO_ORIGEN_ID", String(payload.FORMATO_ORIGEN_ID));
  fd.append("ACTIVO", String(payload.ACTIVO ?? 1));

  return fd;
};

export const SGCService = {
  getAll: async (): Promise<SGCDocument[]> => {
    const { data } =
      await api.get<ApiResponse<SGCDocument[]>>("/sgc/documents");
    return validateResponse(data) ?? [];
  },

  getById: async (id: number): Promise<SGCDocument> => {
    const { data } = await api.get<ApiResponse<SGCDocument>>(
      `/sgc/documents/${id}`,
    );
    return validateResponse(data);
  },

  create: async (payload: SGCDocumentCreatePayload) => {
    const { data } = await api.post<
      ApiResponse<{ SGCID: number; VERSIONID: number }>
    >("/sgc/documents", toCreateFormData(payload), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return validateResponse(data);
  },

  update: async (id: number, payload: SGCDocumentUpdatePayload) => {
    const { data } = await api.put<ApiResponse<null>>(
      `/sgc/documents/${id}`,
      payload,
    );
    return validateResponse(data);
  },

  uploadVersion: async (id: number, file: File, descripcionCambio: string) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("DESCRIPCION_CAMBIO", descripcionCambio);

    const { data } = await api.post<
      ApiResponse<{ VERSIONID: number; NUMERO_VERSION: number }>
    >(`/sgc/documents/${id}/versions`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return validateResponse(data);
  },

  authorizeVersion: async (
    id: number,
    versionId: number,
    options?: {
      file?: File | null;
      pdf?: File | null;
      fechaLimite?: string | null;
    },
  ) => {
    const fd = new FormData();
    if (options?.file) fd.append("file", options.file);
    if (options?.pdf) fd.append("pdf", options.pdf);
    if (options?.fechaLimite) fd.append("FECHA_LIMITE", options.fechaLimite);

    const { data } = await api.patch<ApiResponse<null>>(
      `/sgc/documents/${id}/versions/${versionId}/authorize`,
      fd,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return validateResponse(data);
  },

  rejectVersion: async (
    id: number,
    versionId: number,
    comentarios: string | null,
  ) => {
    const { data } = await api.patch<ApiResponse<null>>(
      `/sgc/documents/${id}/versions/${versionId}/reject`,
      { COMENTARIOS: comentarios },
    );
    return validateResponse(data);
  },

  changeStatus: async (id: number, activo: number) => {
    const { data } = await api.patch<ApiResponse<null>>(
      `/sgc/documents/${id}/status`,
      {
        ACTIVO: activo,
      },
    );
    return validateResponse(data);
  },

  markObsolete: async (id: number) => {
    const { data } = await api.patch<ApiResponse<null>>(
      `/sgc/documents/${id}/obsolete`,
    );
    return validateResponse(data);
  },

  delete: async (id: number) => {
    const { data } = await api.delete<ApiResponse<null>>(
      `/sgc/documents/${id}`,
    );
    return validateResponse(data);
  },

  downloadUrl: (id: number) => {
    const base = (api.defaults.baseURL || "/api").replace(/\/$/, "");
    return `${base}/sgc/documents/${id}/file`;
  },

  viewUrl: (id: number) => {
    const base = (api.defaults.baseURL || "/api").replace(/\/$/, "");
    return `${base}/sgc/documents/${id}/file?inline=1`;
  },

  downloadVersionUrl: (id: number, versionId: number) => {
    const base = (api.defaults.baseURL || "/api").replace(/\/$/, "");
    return `${base}/sgc/documents/${id}/versions/${versionId}/file`;
  },

  downloadVersionPdfUrl: (id: number, versionId: number) => {
    const base = (api.defaults.baseURL || "/api").replace(/\/$/, "");
    return `${base}/sgc/documents/${id}/versions/${versionId}/pdf`;
  },
};

export type SGCTipoDocumento = {
  TIPO_DOCUMENTO_ID: number;
  NOMBRE: string;
  ACTIVO: number;
};

export const SGCTiposDocumentoService = {
  getAll: async (): Promise<SGCTipoDocumento[]> => {
    const { data } = await api.get<ApiResponse<SGCTipoDocumento[]>>(
      "/sgc/tipos-documento",
    );
    return validateResponse(data) ?? [];
  },

  getAllIncludingInactive: async (): Promise<SGCTipoDocumento[]> => {
    const { data } = await api.get<ApiResponse<SGCTipoDocumento[]>>(
      "/sgc/tipos-documento",
      { params: { all: 1 } },
    );
    return validateResponse(data) ?? [];
  },

  create: async (nombre: string) => {
    const { data } = await api.post<ApiResponse<{ TIPO_DOCUMENTO_ID: number }>>(
      "/sgc/tipos-documento",
      { NOMBRE: nombre },
    );
    return validateResponse(data);
  },

  changeStatus: async (id: number, activo: number) => {
    const { data } = await api.patch<ApiResponse<null>>(
      `/sgc/tipos-documento/${id}/status`,
      {
        ACTIVO: activo,
      },
    );
    return validateResponse(data);
  },
};

export const TIPO_FORMATO_NOMBRE = "Formato";
export const TIPO_REGISTRO_NOMBRE = "Registro";

export type SGCCatalogDepartment = {
  DEPAID: number;
  NOMBRE: string;
};

export type SGCCatalogUser = {
  USUARIOID: number;
  NOMBRE: string;
  DEPAID?: number | null;
  HAS_EMAIL: boolean;
};

export const SGCCatalogService = {
  getDepartments: async (): Promise<SGCCatalogDepartment[]> => {
    const { data } = await api.get<ApiResponse<SGCCatalogDepartment[]>>(
      "/catalog/departments",
    );
    return validateResponse(data) ?? [];
  },

  getUsers: async (): Promise<SGCCatalogUser[]> => {
    const { data } =
      await api.get<ApiResponse<SGCCatalogUser[]>>("/catalog/users");
    return validateResponse(data) ?? [];
  },
};

export type SGCDepartamentoCodigo = {
  DEPAID: number;
  NOMBRE: string;
  CODIGO_AREA?: string | null;
};

export const SGCCodificacionService = {
  getDepartamentosCodigo: async (): Promise<SGCDepartamentoCodigo[]> => {
    const { data } = await api.get<ApiResponse<SGCDepartamentoCodigo[]>>(
      "/sgc/departamentos-codigo",
    );
    return validateResponse(data) ?? [];
  },

  setDepartamentoCodigo: async (depaid: number, codigo: string) => {
    const { data } = await api.patch<ApiResponse<null>>(
      `/sgc/departamentos-codigo/${depaid}`,
      { CODIGO_AREA: codigo },
    );
    return validateResponse(data);
  },

  getNextCode: async (depaid: number, tipo: string) => {
    const { data } = await api.get<
      ApiResponse<{ CODIGO_SUGERIDO: string | null; motivo?: string }>
    >("/sgc/next-code", { params: { depaid, tipo } });
    return validateResponse(data);
  },
};

export type SGCExternalDocument = {
  SGCEXTID: number;
  TITULO: string;
  ORIGEN?: string | null;
  FECHA_RECEPCION?: string | null;
  ARCHIVO_NOMBRE_ORIGINAL?: string | null;
  ARCHIVO_DISPONIBLE: boolean;
  ACTIVO: number;
  FECHA_REGISTRO?: string | null;
  REGISTRADO_POR_NOMBRE?: string | null;
  VISIBILIDAD?: string | null;
  DEPAID?: number | null;
  DEPARTAMENTO_NOMBRE?: string | null;
  SUCURSAL?: string | null;
};

export type SGCExternalDocumentCreatePayload = {
  TITULO: string;
  ORIGEN?: string | null;
  FECHA_RECEPCION?: string | null;
  VISIBILIDAD?: string | null;
  DEPAID?: number | null;
  SUCURSAL?: string | null;
  file?: File | null;
};

export const SGCExternalDocumentsService = {
  getAll: async (): Promise<SGCExternalDocument[]> => {
    const { data } = await api.get<ApiResponse<SGCExternalDocument[]>>(
      "/sgc/external-documents",
    );
    return validateResponse(data) ?? [];
  },

  create: async (payload: SGCExternalDocumentCreatePayload) => {
    const fd = new FormData();
    fd.append("TITULO", payload.TITULO);
    if (payload.ORIGEN) fd.append("ORIGEN", payload.ORIGEN);
    if (payload.FECHA_RECEPCION)
      fd.append("FECHA_RECEPCION", payload.FECHA_RECEPCION);
    if (payload.VISIBILIDAD) fd.append("VISIBILIDAD", payload.VISIBILIDAD);
    if (payload.DEPAID) fd.append("DEPAID", String(payload.DEPAID));
    if (payload.SUCURSAL) fd.append("SUCURSAL", payload.SUCURSAL);
    if (payload.file) fd.append("file", payload.file);

    const { data } = await api.post<ApiResponse<{ SGCEXTID: number }>>(
      "/sgc/external-documents",
      fd,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return validateResponse(data);
  },

  changeStatus: async (id: number, activo: number) => {
    const { data } = await api.patch<ApiResponse<null>>(
      `/sgc/external-documents/${id}/status`,
      {
        ACTIVO: activo,
      },
    );
    return validateResponse(data);
  },

  delete: async (id: number) => {
    const { data } = await api.delete<ApiResponse<null>>(
      `/sgc/external-documents/${id}`,
    );
    return validateResponse(data);
  },

  downloadUrl: (id: number) => {
    const base = (api.defaults.baseURL || "/api").replace(/\/$/, "");
    return `${base}/sgc/external-documents/${id}/file`;
  },
};

export const ESTADO_LABELS: Record<SGCEstado, string> = {
  VENCIDO: "Vencido",
  URGENTE: "Urgente",
  PROXIMO_A_VENCER: "Próximo a vencer",
  VIGENTE: "Vigente",
  SIN_FECHA: "Sin fecha límite",
};

export const ESTADO_COLORS: Record<
  SGCEstado,
  "error" | "warning" | "success" | "default"
> = {
  VENCIDO: "error",
  URGENTE: "warning",
  PROXIMO_A_VENCER: "warning",
  VIGENTE: "success",
  SIN_FECHA: "default",
};

export const ESTADO_APROBACION_LABELS: Record<SGCEstadoAprobacion, string> = {
  SIN_VERSION: "Sin versión",
  PENDIENTE_AUTORIZACION: "Pendiente de autorización",
  AUTORIZADO: "Autorizado",
  RECHAZADO: "Rechazado",
};

export const ESTADO_APROBACION_COLORS: Record<
  SGCEstadoAprobacion,
  "default" | "warning" | "success" | "error"
> = {
  SIN_VERSION: "default",
  PENDIENTE_AUTORIZACION: "warning",
  AUTORIZADO: "success",
  RECHAZADO: "error",
};
