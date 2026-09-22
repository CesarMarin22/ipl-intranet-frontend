import { api } from "./api";

type ApiResponse<T> = {
  ok: boolean;
  message: string;
  data: T;
};

export type UserRow = {
  USUARIOID: number;
  SOCIOID?: number | null;
  PERFILID: number;
  DEPAID?: number | null;
  JEFEID?: number | null;
  NOMBRE: string;
  USUARIO: string;
  PWD?: string;
  EMAIL?: string | null;
  SUCURSAL?: string | null;
  SUCURSAL_NOMBRE?: string | null; 
  SUCURSAL_DESCRIPCION?: string | null;
  ACTIVO: number;
  NUMERO_EMPLEADO?: string | null;
  TIPO_EMPLEADO?: string | null;
  TIPO_EMPLEADO_ID?: number | null;
  PERFIL_NOMBRE?: string | null;
  DEPARTAMENTO_NOMBRE?: string | null;
  SOCIO_NOMBRE?: string | null;
  TIPO_EMPLEADO_NOMBRE?: string | null;
};

export type UserPayload = {
  SOCIOID?: number | null;
  PERFILID: number;
  DEPAID?: number | null;
  JEFEID?: number | null;
  NOMBRE: string;
  USUARIO: string;
  PWD: string;
  EMAIL?: string | null;
  SUCURSAL?: string | null;
  ACTIVO?: number;
  NUMERO_EMPLEADO?: string | null;
  TIPO_EMPLEADO?: string | null;
  TIPO_EMPLEADO_ID?: number | null;
};

export async function getUsers() {
  const { data } = await api.get<ApiResponse<UserRow[]>>("/users");
  return data.data ?? [];
}

export async function getUserById(id: number) {
  const { data } = await api.get<ApiResponse<UserRow>>(`/users/${id}`);
  return data.data;
}

export async function createUser(payload: UserPayload) {
  const { data } = await api.post<ApiResponse<{ USUARIOID: number }>>(
    "/users",
    payload
  );
  return data;
}

export async function updateUser(id: number, payload: UserPayload) {
  const { data } = await api.put<ApiResponse<null>>(
    `/users/${id}`,
    payload
  );
  return data;
}

export async function deleteUser(id: number) {
  const { data } = await api.delete(`/users/${id}`);
  return data;
}

export async function updateUserStatus(id: number, activo: number) {
  const { data } = await api.patch<ApiResponse<null>>(
    `/users/${id}/status`,
    { ACTIVO: activo }
  );
  return data;
}