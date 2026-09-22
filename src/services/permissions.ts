import { api } from "./api";

export type ProfilePermissionRow = {
  PERFILID: number;
  MODULOID: number;
  ACCIONID: number;
  PERMITIDO: number;
  ACTIVO: number;
};

export type UserPermissionRow = {
  USUARIOID: number;
  MODULOID: number;
  ACCIONID: number;
  PERMITIDO: number;
  ORIGEN: string;
  ACTIVO: number;
};

export type EffectivePermissionRow = {
  USUARIOID: number;
  USUARIO: string;
  CLAVE_MODULO: string;
  NOMBRE_USUARIO: string;
  PERFILID: number;
  NOMBRE_PERFIL: string;
  MODULOID: number;
  NOMBRE_MODULO: string;
  RUTA?: string | null;
  ACCIONID: number;
  CLAVE_ACCION: string;
  NOMBRE_ACCION: string;
  PERMITIDO_FINAL: number;
  ORIGEN_FINAL: string;
};

type ApiResponse<T> = {
  ok: boolean;
  message: string;
  data: T;
};

export const PermissionsService = {
  getProfilePermissions: async (perfilId: number): Promise<ProfilePermissionRow[]> => {
    const { data } = await api.get<ApiResponse<ProfilePermissionRow[]>>(
      `/permissions/profile-permissions/${perfilId}`
    );
    return data.data ?? [];
  },

  replaceProfilePermissions: async (
    perfilId: number,
    permissions: ProfilePermissionRow[]
  ) => {
    const { data } = await api.put(
      `/permissions/profile-permissions/${perfilId}`,
      { permissions }
    );
    return data;
  },

  getUserPermissions: async (usuarioId: number): Promise<UserPermissionRow[]> => {
    const { data } = await api.get<ApiResponse<UserPermissionRow[]>>(
      `/permissions/user-permissions/${usuarioId}`
    );
    return data.data ?? [];
  },

  replaceUserPermissions: async (
    usuarioId: number,
    permissions: UserPermissionRow[]
  ) => {
    const { data } = await api.put(
      `/permissions/user-permissions/${usuarioId}`,
      { permissions }
    );
    return data;
  },

  getMyPermissions: async (): Promise<EffectivePermissionRow[]> => {
  const { data } = await api.get<ApiResponse<EffectivePermissionRow[]>>(
    "/permissions/me"
  );
  return data.data ?? [];
},

  getEffectivePermissions: async (usuarioId: number): Promise<EffectivePermissionRow[]> => {
    const { data } = await api.get<ApiResponse<EffectivePermissionRow[]>>(
      `/permissions/effective/${usuarioId}`
    );
    return data.data ?? [];
  },
};