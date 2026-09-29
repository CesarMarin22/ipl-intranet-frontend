import { api } from "./api";

type ApiResponse<T> = {
  ok: boolean;
  message: string;
  data: T;
};

const base = () => (api.defaults.baseURL || "/api").replace(/\/$/, "");

export type EstadoDia =
  | "ASISTENCIA"
  | "RETARDO"
  | "FALTA"
  | "EN_CURSO"
  | "EN_CURSO_RETARDO"
  | "PENDIENTE"
  | "PROGRAMADO"
  | "DESCANSO"
  | "DESCANSO_TRABAJADO"
  | "FESTIVO"
  | "FESTIVO_TRABAJADO"
  | "NO_CHECA"
  | "NO_CHECA_TRABAJADO"
  | "SIN_HORARIO"
  | "SIN_REGISTRO"
  | "INCAPACIDAD"
  | "VACACIONES"
  | "PERMISO_CON_GOCE"
  | "PERMISO_SIN_GOCE"
  | "COMISION"
  | "FALTA_JUSTIFICADA";

export const ESTADOS_DIA: Record<string, { label: string; corto: string; color: string }> = {
  ASISTENCIA: { label: "Asistencia", corto: "A", color: "#22C55E" },
  RETARDO: { label: "Retardo", corto: "R", color: "#F59E0B" },
  FALTA: { label: "Falta", corto: "F", color: "#EF4444" },
  EN_CURSO: { label: "En jornada", corto: "•", color: "#22C55E" },
  EN_CURSO_RETARDO: { label: "En jornada (retardo)", corto: "R•", color: "#F59E0B" },
  PENDIENTE: { label: "Sin checar aún", corto: "…", color: "#71717A" },
  PROGRAMADO: { label: "Programado", corto: "·", color: "#52525B" },
  DESCANSO: { label: "Descanso", corto: "D", color: "#3F3F46" },
  DESCANSO_TRABAJADO: { label: "Descanso trabajado", corto: "DT", color: "#8B5CF6" },
  FESTIVO: { label: "Festivo", corto: "FE", color: "#0EA5E9" },
  FESTIVO_TRABAJADO: { label: "Festivo trabajado", corto: "FT", color: "#8B5CF6" },
  NO_CHECA: { label: "No checa", corto: "—", color: "#3F3F46" },
  NO_CHECA_TRABAJADO: { label: "No checa", corto: "—", color: "#3F3F46" },
  SIN_HORARIO: { label: "Sin horario asignado", corto: "?", color: "#52525B" },
  SIN_REGISTRO: { label: "Antes del arranque", corto: "", color: "#27272A" },
  INCAPACIDAD: { label: "Incapacidad", corto: "IN", color: "#EC4899" },
  VACACIONES: { label: "Vacaciones", corto: "V", color: "#14B8A6" },
  PERMISO_CON_GOCE: { label: "Permiso con goce", corto: "P", color: "#6366F1" },
  PERMISO_SIN_GOCE: { label: "Permiso sin goce", corto: "PS", color: "#6366F1" },
  COMISION: { label: "Comisión", corto: "C", color: "#22C55E" },
  FALTA_JUSTIFICADA: { label: "Falta justificada", corto: "FJ", color: "#6366F1" },
};

export const estadoDia = (estado: string) =>
  ESTADOS_DIA[estado] ?? { label: estado, corto: estado.slice(0, 2), color: "#52525B" };

export type HorarioDia = {
  ORIGEN: "TURNO" | "HORARIO";
  HORA_ENTRADA: string;
  HORA_SALIDA: string;
  TOLERANCIA_MIN: number;
  NOMBRE: string;
} | null;

export type DiaEvaluado = {
  FECHA: string;
  ESTADO: EstadoDia;
  DETALLE: string | null;
  HORARIO: HorarioDia;
  ENTRADA: string | null;
  SALIDA: string | null;
  MINUTOS_RETARDO: number;
  MINUTOS_TRABAJADOS: number;
  MINUTOS_EXTRA: number;
  SALIDA_ANTICIPADA: boolean;
  ALERTAS: number;
  RECHAZADAS: number;
  EXTRA_ESTADO: "PENDIENTE" | "AUTORIZADA" | "RECHAZADA" | null;
  EXTRA_AUTORIZADO: number;
};

export type Totales = {
  ASISTENCIAS: number;
  RETARDOS: number;
  FALTAS: number;
  INCAPACIDADES: number;
  VACACIONES: number;
  PERMISOS: number;
  FESTIVOS: number;
  MINUTOS_EXTRA_PENDIENTES: number;
  MINUTOS_EXTRA_AUTORIZADOS: number;
  ALERTAS: number;
};

export type ChecadaReciente = {
  CHECADAID: number;
  TIPO: "ENTRADA" | "SALIDA";
  FECHA_HORA: string;
  BANDERAS: string | null;
  DISTANCIA_M: number | null;
  UBICACION_NOMBRE: string | null;
  REVISION: string | null;
};

export type MiEstado = {
  AHORA: string;
  EMPLEADO: { USUARIOID: number; NOMBRE: string; NUMERO_EMPLEADO: string | null };
  HOY: DiaEvaluado;
  SEMANA: DiaEvaluado[];
  CHECADAS_RECIENTES: ChecadaReciente[];
  SUGERIDO: "ENTRADA" | "SALIDA";
  DISPOSITIVO_ESTADO: "ACTIVO" | "PENDIENTE" | "REVOCADO" | "SIN_REGISTRO";
  BANDERAS: Record<string, string>;
};

export type ResultadoChecada = {
  CHECADAID: number;
  TIPO: "ENTRADA" | "SALIDA";
  FECHA_HORA: string;
  UBICACION_NOMBRE: string | null;
  DISTANCIA_M: number | null;
  BANDERAS: string[];
  BANDERAS_TEXTO: string[];
};

export type Empleado = {
  USUARIOID: number;
  NOMBRE: string;
  NUMERO_EMPLEADO: string | null;
  SUCURSAL: string | null;
  SUCURSAL_CLAVE: string | null;
  SUCURSAL_NOMBRE: string | null;
  DEPARTAMENTO: string | null;
  PERFIL: string | null;
  HORARIOID: number | null;
  HORARIO_NOMBRE: string | null;
  UBICACIONID: number | null;
  UBICACION_NOMBRE: string | null;
  CHECA: number;
  CONFIGURADO: number;
  DISPOSITIVOS_ACTIVOS?: number;
  DISPOSITIVOS_PENDIENTES?: number;
};

export type FilaAsistencia = Empleado & { DIAS: DiaEvaluado[]; TOTALES: Totales };

export type Checada = {
  CHECADAID: number;
  USUARIOID: number;
  NOMBRE: string;
  NUMERO_EMPLEADO: string | null;
  SUCURSAL_CLAVE: string | null;
  TIPO: "ENTRADA" | "SALIDA";
  FECHA_HORA: string;
  FECHA_LABORAL: string;
  FECHA_HORA_DISPOSITIVO: string | null;
  LATITUD: number;
  LONGITUD: number;
  PRECISION_M: number | null;
  UBICACION_NOMBRE: string | null;
  RADIO_M: number | null;
  DISTANCIA_M: number | null;
  FUERA_ZONA: number;
  BANDERAS: string | null;
  BANDERAS_TEXTO: string[];
  REVISION: "VALIDADA" | "RECHAZADA" | null;
  REVISION_COMENTARIO: string | null;
  REVISO_NOMBRE: string | null;
};

export type Asignacion = {
  ASIGNACIONID: number;
  USUARIOID: number;
  NOMBRE: string;
  SUCURSAL_CLAVE: string | null;
  FECHA_INICIO: string;
  FECHA_FIN: string;
  HORA_ENTRADA: string;
  HORA_SALIDA: string;
  TOLERANCIA_MIN: number;
  DIAS: string;
  UBICACIONID: number | null;
  UBICACION_NOMBRE: string | null;
  COMENTARIO: string | null;
  CREADO_POR_NOMBRE: string | null;
};

export type Incidencia = {
  INCIDENCIAID: number;
  USUARIOID: number;
  NOMBRE: string;
  SUCURSAL_CLAVE: string | null;
  TIPO: string;
  TIPO_NOMBRE: string;
  FECHA_INICIO: string;
  FECHA_FIN: string;
  FOLIO: string | null;
  COMENTARIO: string | null;
  TIENE_ARCHIVO: boolean;
  CREADO_POR_NOMBRE: string | null;
  FECHA_CREACION: string;
};

export type HoraExtra = {
  USUARIOID: number;
  NOMBRE: string;
  NUMERO_EMPLEADO: string | null;
  SUCURSAL_CLAVE: string | null;
  FECHA: string;
  ESTADO_DIA: string;
  HORARIO: HorarioDia;
  ENTRADA: string | null;
  SALIDA: string | null;
  MINUTOS_CALCULADOS: number;
  ESTADO: "PENDIENTE" | "AUTORIZADA" | "RECHAZADA";
  MINUTOS_AUTORIZADOS: number | null;
  COMENTARIO: string | null;
  AUTORIZO_NOMBRE: string | null;
  FECHA_AUTORIZACION: string | null;
};

export type Dispositivo = {
  DISPOSITIVOID: number;
  DESCRIPCION: string | null;
  ESTADO: "ACTIVO" | "PENDIENTE" | "REVOCADO";
  FECHA_REGISTRO: string;
  ULTIMO_USO: string | null;
  FECHA_AUTORIZACION: string | null;
  AUTORIZO_NOMBRE: string | null;
  COMPARTIDO_CON: string | null;
};

export type Gratificacion = {
  GRATIFICACIONID: number;
  USUARIOID: number;
  NOMBRE: string;
  NUMERO_EMPLEADO: string | null;
  SUCURSAL_CLAVE: string | null;
  FECHA: string;
  MONTO: number | null;
  JUSTIFICACION: string;
  CREADO_POR_NOMBRE: string | null;
  FECHA_CREACION: string;
};

export type Horario = {
  HORARIOID: number;
  CLAVE: string;
  NOMBRE: string;
  HORA_ENTRADA: string;
  TOLERANCIA_MIN: number;
  HORA_SALIDA: string;
  DIAS: string;
  ACTIVO: number;
};

export type Ubicacion = {
  UBICACIONID: number;
  NOMBRE: string;
  TIPO: "MATRIZ" | "SUCURSAL" | "POLIZA" | "OTRO";
  SUCURSALID: string | null;
  SUCURSAL_CLAVE: string | null;
  LATITUD: number;
  LONGITUD: number;
  RADIO_M: number;
  DIRECCION: string | null;
  ACTIVO: number;
};

export type Festivo = {
  FESTIVOID: number;
  FECHA: string;
  NOMBRE: string;
  SUCURSALID: string | null;
  SUCURSAL_CLAVE: string | null;
};

export type Rev = {
  USUARIOID: number;
  NOMBRE: string;
  NUMERO_EMPLEADO: string | null;
  SUCURSALES: string[];
  SUCURSALES_CLAVE: string[];
};

export type UsuarioBasico = {
  USUARIOID: number;
  NOMBRE: string;
  NUMERO_EMPLEADO: string | null;
  SUCURSAL_CLAVE: string | null;
};

export type Filtros = {
  desde?: string;
  hasta?: string;
  sucursal?: string;
  usuario?: number | string;
  q?: string;
  alertas?: boolean;
  sin_revisar?: boolean;
};

const params = (f: Filtros = {}) => {
  const p: Record<string, string> = {};
  if (f.desde) p.desde = f.desde;
  if (f.hasta) p.hasta = f.hasta;
  if (f.sucursal) p.sucursal = f.sucursal;
  if (f.usuario) p.usuario = String(f.usuario);
  if (f.q) p.q = f.q;
  if (f.alertas) p.alertas = "1";
  if (f.sin_revisar) p.sin_revisar = "1";
  return p;
};

async function get<T>(url: string, f?: Filtros | Record<string, string>) {
  const { data } = await api.get<ApiResponse<T>>(url, { params: f });
  return data.data;
}

async function send<T = null>(method: "post" | "put" | "delete", url: string, body?: unknown) {
  const { data } = await api.request<ApiResponse<T>>({ method, url, data: body });
  return data;
}

// Identificador de este navegador/celular. Solo se envía al checar; el servidor guarda su hash.
const CLAVE_DISPOSITIVO = "ipl_reloj_dispositivo";

export function idDispositivo() {
  let id: string | null = null;
  try {
    id = localStorage.getItem(CLAVE_DISPOSITIVO);
  } catch {
    id = null;
  }
  if (!id) {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    id = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    try {
      localStorage.setItem(CLAVE_DISPOSITIVO, id);
    } catch {
      // Sin almacenamiento el celular se verá como nuevo en cada visita y el REV lo notará
    }
  }
  return id;
}

export const RelojService = {
  miEstado: () => get<MiEstado>("/reloj/mi-estado", { dispositivo: idDispositivo() }),
  misRegistros: (f: Filtros) =>
    get<{ DIAS: DiaEvaluado[]; TOTALES: Totales }>("/reloj/mis-registros", params(f)),

  checar: async (payload: {
    tipo: "ENTRADA" | "SALIDA";
    latitud: number;
    longitud: number;
    precision: number;
    foto: Blob;
  }) => {
    const fd = new FormData();
    fd.append("tipo", payload.tipo);
    fd.append("latitud", String(payload.latitud));
    fd.append("longitud", String(payload.longitud));
    fd.append("precision", String(payload.precision));
    fd.append("dispositivo", idDispositivo());
    fd.append("fecha_dispositivo", String(Date.now()));
    fd.append("foto", payload.foto, "checada.jpg");
    const { data } = await api.post<ApiResponse<ResultadoChecada>>("/reloj/checar", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  fotoUrl: (checadaid: number) => `${base()}/reloj/checadas/${checadaid}/foto`,
  archivoIncidenciaUrl: (id: number) => `${base()}/reloj/incidencias/${id}/archivo`,

  asistencia: (f: Filtros) =>
    get<{ DIAS: string[]; EMPLEADOS: FilaAsistencia[] }>("/reloj/asistencia", params(f)),
  empleados: (f: Filtros = {}) => get<Empleado[]>("/reloj/empleados", params(f)),
  configurarEmpleados: (body: {
    USUARIOIDS: number[];
    HORARIOID?: number | null;
    UBICACIONID?: number | null;
    CHECA?: boolean;
  }) => send("put", "/reloj/empleados", body),

  checadas: (f: Filtros) => get<Checada[]>("/reloj/checadas", params(f)),
  revisarChecada: (id: number, ESTADO: "VALIDADA" | "RECHAZADA", COMENTARIO: string) =>
    send("post", `/reloj/checadas/${id}/revision`, { ESTADO, COMENTARIO }),

  asignaciones: (f: Filtros) => get<Asignacion[]>("/reloj/asignaciones", params(f)),
  crearAsignacion: (body: {
    USUARIOIDS: number[];
    FECHA_INICIO: string;
    FECHA_FIN: string;
    HORA_ENTRADA: string;
    HORA_SALIDA: string;
    TOLERANCIA_MIN: number;
    DIAS: string;
    UBICACIONID: number | null;
    COMENTARIO: string;
  }) => send("post", "/reloj/asignaciones", body),
  eliminarAsignacion: (id: number) => send("delete", `/reloj/asignaciones/${id}`),

  tiposIncidencia: () => get<{ CLAVE: string; NOMBRE: string }[]>("/reloj/incidencias/tipos"),
  incidencias: (f: Filtros) => get<Incidencia[]>("/reloj/incidencias", params(f)),
  crearIncidencia: async (payload: {
    USUARIOID: number;
    TIPO: string;
    FECHA_INICIO: string;
    FECHA_FIN: string;
    FOLIO: string;
    COMENTARIO: string;
    archivo: File | null;
  }) => {
    const fd = new FormData();
    fd.append("USUARIOID", String(payload.USUARIOID));
    fd.append("TIPO", payload.TIPO);
    fd.append("FECHA_INICIO", payload.FECHA_INICIO);
    fd.append("FECHA_FIN", payload.FECHA_FIN);
    fd.append("FOLIO", payload.FOLIO);
    fd.append("COMENTARIO", payload.COMENTARIO);
    if (payload.archivo) fd.append("archivo", payload.archivo);
    const { data } = await api.post<ApiResponse<null>>("/reloj/incidencias", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
  cancelarIncidencia: (id: number) => send("delete", `/reloj/incidencias/${id}`),

  horasExtra: (f: Filtros) => get<HoraExtra[]>("/reloj/horas-extra", params(f)),
  decidirHorasExtra: (body: {
    USUARIOID: number;
    FECHA: string;
    ESTADO: "AUTORIZADA" | "RECHAZADA";
    MINUTOS_AUTORIZADOS?: number;
    COMENTARIO?: string;
  }) => send("post", "/reloj/horas-extra", body),

  dispositivos: (usuarioid: number) => get<Dispositivo[]>(`/reloj/empleados/${usuarioid}/dispositivos`),
  cambiarDispositivo: (id: number, accion: "autorizar" | "revocar") =>
    send("post", `/reloj/dispositivos/${id}/${accion}`),

  gratificaciones: (f: Filtros) => get<Gratificacion[]>("/reloj/gratificaciones", params(f)),
  crearGratificacion: (body: { USUARIOID: number; FECHA: string; MONTO: number | null; JUSTIFICACION: string }) =>
    send("post", "/reloj/gratificaciones", body),
  cancelarGratificacion: (id: number) => send("delete", `/reloj/gratificaciones/${id}`),

  horarios: () => get<Horario[]>("/reloj/horarios"),
  guardarHorario: (h: Partial<Horario>) =>
    h.HORARIOID ? send("put", `/reloj/horarios/${h.HORARIOID}`, h) : send("post", "/reloj/horarios", h),
  ubicaciones: () => get<Ubicacion[]>("/reloj/ubicaciones"),
  guardarUbicacion: (u: Partial<Ubicacion>) =>
    u.UBICACIONID ? send("put", `/reloj/ubicaciones/${u.UBICACIONID}`, u) : send("post", "/reloj/ubicaciones", u),
  festivos: (anio: number) => get<Festivo[]>("/reloj/festivos", { anio: String(anio) }),
  crearFestivo: (body: { FECHA: string; NOMBRE: string; SUCURSALID: string | null }) =>
    send("post", "/reloj/festivos", body),
  eliminarFestivo: (id: number) => send("delete", `/reloj/festivos/${id}`),
  revs: () => get<Rev[]>("/reloj/revs"),
  guardarRev: (usuarioid: number, SUCURSALES: string[]) =>
    send("put", `/reloj/revs/${usuarioid}`, { SUCURSALES }),
  usuarios: () => get<UsuarioBasico[]>("/reloj/usuarios"),
  integridad: (f: Filtros) =>
    get<{ REVISADAS: number; EMPLEADOS: number; PROBLEMAS: { CHECADAID: number; USUARIOID: number; FECHA_HORA: string; MOTIVO: string }[] }>(
      "/reloj/integridad",
      params(f),
    ),
};

// ---- utilidades de presentación ----

export const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];

export function hoyIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function sumarDias(iso: string, dias: number) {
  const [a, m, d] = iso.split("-").map(Number);
  const f = new Date(a, m - 1, d + dias);
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`;
}

/** Lunes de la semana de esa fecha */
export function inicioSemana(iso: string) {
  const [a, m, d] = iso.split("-").map(Number);
  const dia = new Date(a, m - 1, d).getDay();
  return sumarDias(iso, dia === 0 ? -6 : 1 - dia);
}

export const hora = (iso: string | null) => (iso ? iso.slice(11, 16) : "—");

export function minutosTexto(min: number) {
  if (!min) return "0 min";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h} h ${m ? `${m} min` : ""}`.trim() : `${m} min`;
}

export function diaCorto(iso: string) {
  const [a, m, d] = iso.split("-").map(Number);
  const f = new Date(a, m - 1, d);
  return `${f.toLocaleDateString("es-MX", { weekday: "short" }).replace(".", "")} ${d}`;
}

export const mapaUrl = (lat: number, lng: number) => `https://www.google.com/maps?q=${lat},${lng}`;

export function diasTexto(dias: string) {
  return DIAS_SEMANA.filter((_, i) => dias[i] === "1").join(" ");
}
