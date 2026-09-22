import { api } from "./api";

type ApiResponse<T> = {
  ok: boolean;
  message: string;
  data: T;
};

export type SucursalRow = {
  SUCURSALID: string;
  CLAVE: string;
  NOMBRE: string;
  ACTIVO: number;
};

export async function getSucursales() {
  const { data } = await api.get<ApiResponse<SucursalRow[]>>("/branches");
  return data.data ?? [];
}