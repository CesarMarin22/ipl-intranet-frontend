import { api } from "./api";

type ApiResponse<T> = {
  ok: boolean;
  message: string;
  data: T;
};

export type PaqueteComedor = {
  PAQUETEID: number;
  CANTIDAD_COMIDAS: number;
  NOMBRE: string;
  PORCENTAJE_DESCUENTO: number;
  ACTIVO: number;
};

export async function getPaquetesComedor() {
  const { data } = await api.get<ApiResponse<PaqueteComedor[]>>(
    "/comedor/paquetes",
  );
  return data.data ?? [];
}

export async function createPaqueteComedor(payload: {
  CANTIDAD_COMIDAS: number;
  NOMBRE: string;
  PORCENTAJE_DESCUENTO: number;
}) {
  const { data } = await api.post("/comedor/paquetes", payload);
  return data;
}

export async function updatePaqueteComedor(
  id: number,
  payload: {
    CANTIDAD_COMIDAS: number;
    NOMBRE: string;
    PORCENTAJE_DESCUENTO: number;
    ACTIVO: number;
  },
) {
  const { data } = await api.put(`/comedor/paquetes/${id}`, payload);
  return data;
}

export async function deletePaqueteComedor(id: number) {
  const { data } = await api.delete(`/comedor/paquetes/${id}`);
  return data;
}