import { api } from "./api";

type ApiResponse<T> = {
  ok: boolean;
  message: string;
  data: T;
};

export type ComedorEmpleado = {
  USUARIOID: number;
  NOMBRE: string;
  NUMERO_EMPLEADO: string;
  SUCURSAL: string;
  TIPO_EMPLEADO_ID?: number;
  TIPO_EMPLEADO_NOMBRE?: string;
  PRECIO_NORMAL?: number;
  PRECIO_VIGENTE?: number;
  COMIDAS_DISPONIBLES: number;
  COMIDAS_PROMO?: number;
  COMIDAS_NORMALES?: number;
  SALDO: number;
  PRECIO_X10?: number;
  PRECIO_X20?: number;
};

export type ComedorConfig = {
  COSTO_COMIDA: string | number;
  BLOQUE_COMPRA?: string | number;
  MAXIMO_CONSUMO_DIARIO?: string | number;
};

export type EmpleadoConsumoDia = {
  FECHA: string;
  USUARIOID: number;
  NOMBRE: string;
  NUMERO_EMPLEADO: string;
  COMIDAS_CONSUMIDAS: number;
  TOTAL_MOVIMIENTOS: number;
};

export type UltimoConsumoComedor = {
  FECHA: string;
  HORA: string;
  COMIDAS: number;
  TIPO: "PERSONAL" | "COMPARTIDA";
};

export type UltimaRecargaComedor = {
  FECHA: string;
  HORA: string;
  COMIDAS_AGREGADAS: number;
};

export type MiComedorResumen = {
  USUARIOID: number;
  NOMBRE: string;
  NUMERO_EMPLEADO: string;
  SUCURSAL: string;
  COMIDAS_DISPONIBLES: number;
  CONSUMIDAS_MES: number;
  COMPARTIDAS_ACTIVAS: number;
  COMPARTIDAS_MES: number;
  ULTIMO_CONSUMO: UltimoConsumoComedor | null;
  ULTIMA_RECARGA: UltimaRecargaComedor | null;
};

export async function getEmpleadoComedor(numeroEmpleado: string) {
  const { data } = await api.get<ApiResponse<ComedorEmpleado>>(
    `/comedor/empleado/${encodeURIComponent(numeroEmpleado)}`,
  );
  return data;
}

export async function consumirPorScan(payload: {
  NUMERO_EMPLEADO: string;
  QR_FOLIO?: string;
}) {
  const { data } = await api.post<ApiResponse<any>>(
    "/comedor/consumos/scan",
    payload,
  );
  return data;
}

export async function getComedorConfig() {
  const { data } = await api.get<ApiResponse<ComedorConfig>>("/comedor/config");
  return data;
}

export async function getMiSaldo() {
  const { data } =
    await api.get<ApiResponse<MiComedorResumen>>("/comedor/mi-saldo");

  return data;
}

export async function getConsumosDiarios() {
  const { data } = await api.get("/comedor/reportes/consumos-diarios");
  return data;
}

export async function createRecarga(payload: {
  USUARIOID: number;
  CANTIDAD_COMIDAS: number;
  OBSERVACIONES?: string;
}) {
  const { data } = await api.post<ApiResponse<any>>(
    "/comedor/recargas",
    payload,
  );
  return data;
}

export async function getResumenComedor(params?: any) {
  const { data } = await api.get("/comedor/reportes/resumen", { params });
  return data;
}

export async function getRecargas() {
  const { data } = await api.get("/comedor/recargas");
  return data;
}

export async function deleteRecarga(id: number) {
  const { data } = await api.delete(`/comedor/recargas/${id}`);
  return data;
}

export async function getMovimientosDiarios(params?: any) {
  const { data } = await api.get("/comedor/reportes/movimientos-diarios", {
    params,
  });
  return data;
}

export async function getPaquetesRecargas(params?: any) {
  const { data } = await api.get("/comedor/reportes/paquetes-recargas", {
    params,
  });
  return data;
}

export async function getTopConsumos(params?: any) {
  const { data } = await api.get("/comedor/reportes/top-consumos", { params });
  return data;
}

export async function getSaldosBajos() {
  const { data } = await api.get("/comedor/reportes/saldos-bajos");
  return data;
}

export async function getEmpleadosConsumosDia(params?: any) {
  const { data } = await api.get<ApiResponse<EmpleadoConsumoDia[]>>(
    "/comedor/reportes/empleados-consumos-dia",
    { params },
  );
  return data;
}

export async function getCorteDiario(fecha?: string) {
  const { data } = await api.get("/comedor/reportes/corte-diario", {
    params: {
      fecha,
    },
  });

  return data;
}
