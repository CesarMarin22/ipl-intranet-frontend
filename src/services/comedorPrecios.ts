import { api } from "./api";

export type PrecioComedor = {
  PRECIOID: number;
  TIPO_EMPLEADO_ID: number;
  CLAVE?: string;
  NOMBRE: string;
  PRECIO_NORMAL: number;
  ACTIVO: number;
  PRECIO_X10?: number;
  PRECIO_X20?: number;
};

export type CreatePrecioComedorPayload = {
  TIPO_EMPLEADO_ID: number;
  PRECIO_NORMAL: number;
  PRECIO_X10?: number;
  PRECIO_X20?: number;
};

export type UpdatePrecioComedorPayload = {
  PRECIO_NORMAL: number;
  ACTIVO: number;
  PRECIO_X10?: number;
  PRECIO_X20?: number;
};

type ApiResponse<T> = {
  ok: boolean;
  message: string;
  data: T;
};

export async function getPreciosComedor(): Promise<PrecioComedor[]> {
  const { data } =
    await api.get<ApiResponse<PrecioComedor[]>>("/comedor/precios");

  return data.data ?? [];
}

export async function createPrecioComedor(payload: CreatePrecioComedorPayload) {
  const { data } = await api.post<ApiResponse<{ PRECIOID: number }>>(
    "/comedor/precios",
    payload,
  );

  return data.data;
}

export async function updatePrecioComedor(
  id: number,
  payload: UpdatePrecioComedorPayload,
) {
  const { data } = await api.put<ApiResponse<{ PRECIOID: number }>>(
    `/comedor/precios/${id}`,
    payload,
  );

  return data.data;
}

export async function deletePrecioComedor(id: number) {
  const { data } = await api.delete<ApiResponse<{ PRECIOID: number }>>(
    `/comedor/precios/${id}`,
  );

  return data.data;
}
