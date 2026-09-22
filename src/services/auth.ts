import { api } from "./api";

type ApiResponse<T> = {
  ok: boolean;
  message: string;
  data: T;
};

export type MeResponse = {
  authenticated: boolean;
  user_id?: number;
  username?: string;
  nombre?: string;
  perfil?: number;
  perfil_nombre?: string;
  sucursal?: string;
  socio_id?: number;
  tipo_empleado_id?: number;
  depaid?: number;
  departamento_nombre?: string;
};

export async function login(username: string, password: string) {
  const { data } = await api.post<ApiResponse<any>>("/auth/login", {
    username,
    password,
  });

  return data;
}

export async function logout() {
  const { data } = await api.post<ApiResponse<any>>("/auth/logout");
  return data;
}

export async function me(): Promise<MeResponse> {
  const { data } = await api.get<ApiResponse<any>>("/auth/me");

  if (!data?.ok || !data?.data) {
    return { authenticated: false };
  }

  return {
    authenticated: true,
    user_id: data.data.USUARIOID,
    username: data.data.USUARIO,
    nombre: data.data.NOMBRE,
    perfil: data.data.PERFILID,
    perfil_nombre: data.data.PERFIL_NOMBRE,
    sucursal: data.data.SUCURSAL,
    socio_id: data.data.SOCIOID,
    tipo_empleado_id: data.data.TIPO_EMPLEADO_ID,
    depaid: data.data.DEPAID,
    departamento_nombre: data.data.DEPARTAMENTO_NOMBRE,
  };
}