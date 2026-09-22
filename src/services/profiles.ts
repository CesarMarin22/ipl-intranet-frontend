import { api } from "./api";

type ApiResponse<T> = {
  ok: boolean;
  message: string;
  data: T;
};

export type ProfileRow = {
  PERFILID: number;
  NOMBRE: string;
  DESCRIPCION?: string | null;
  ACTIVO: number;
};

export async function getProfiles() {
  const { data } = await api.get<ApiResponse<ProfileRow[]>>("/profiles");
  return data.data ?? [];
}

export async function getProfileById(id: number) {
  const { data } = await api.get<ApiResponse<ProfileRow>>(`/profiles/${id}`);
  return data.data;
}

export async function createProfile(payload: {
  NOMBRE: string;
  DESCRIPCION?: string | null;
  ACTIVO?: number;
}) {
  const { data } = await api.post<ApiResponse<{ PERFILID: number }>>(
    "/profiles",
    payload
  );
  return data;
}

export async function updateProfile(
  id: number,
  payload: {
    NOMBRE: string;
    DESCRIPCION?: string | null;
    ACTIVO?: number;
  }
) {
  const { data } = await api.put<ApiResponse<null>>(`/profiles/${id}`, payload);
  return data;
}

export async function updateProfileStatus(id: number, activo: number) {
  const { data } = await api.patch<ApiResponse<null>>(
    `/profiles/${id}/status`,
    { ACTIVO: activo }
  );
  return data;
}

export async function deleteProfile(id: number) {
  const { data } = await api.delete<ApiResponse<null>>(`/profiles/${id}`);
  return data;
}