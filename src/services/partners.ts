import { api } from "./api";

export type Partner = {
  SOCIOID: number;
  NOMBRE: string;
  RFC?: string;
  ACTIVO: number;
};

type ApiResponse<T> = {
  ok: boolean;
  message: string;
  data: T;
};

export const PartnersService = {
  getAll: async (): Promise<Partner[]> => {
    const { data } = await api.get<ApiResponse<Partner[]>>("/partners");
    return data.data ?? [];
  },

  getById: async (id: number): Promise<Partner> => {
    const { data } = await api.get<ApiResponse<Partner>>(`/partners/${id}`);
    return data.data;
  },

  create: async (payload: { NOMBRE: string; RFC?: string | null; ACTIVO: number }) => {
    const { data } = await api.post("/partners", payload);
    return data;
  },

  update: async (id: number, payload: { NOMBRE: string; RFC?: string | null; ACTIVO: number }) => {
    const { data } = await api.put(`/partners/${id}`, payload);
    return data;
  },

  changeStatus: async (id: number, activo: number) => {
    const { data } = await api.patch(`/partners/${id}/status`, {
      ACTIVO: activo,
    });
    return data;
  },

  delete: async (id: number) => {
    const { data } = await api.delete(`/partners/${id}`);
    return data;
  },
};