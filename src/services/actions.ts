import { api } from "./api";

export type ActionRow = {
  ACCIONID: number;
  CLAVE: string;
  NOMBRE: string;
  ACTIVO: number;
};

type ApiResponse<T> = {
  ok: boolean;
  message: string;
  data: T;
};

export const ActionsService = {
  getAll: async (): Promise<ActionRow[]> => {
    const { data } = await api.get<ApiResponse<ActionRow[]>>("/actions");
    return data.data ?? [];
  },

  getById: async (id: number): Promise<ActionRow> => {
    const { data } = await api.get<ApiResponse<ActionRow>>(`/actions/${id}`);
    return data.data;
  },

  create: async (payload: {
    CLAVE: string;
    NOMBRE: string;
    ACTIVO: number;
  }) => {
    const { data } = await api.post("/actions", payload);
    return data;
  },

  update: async (
    id: number,
    payload: {
      CLAVE: string;
      NOMBRE: string;
      ACTIVO: number;
    }
  ) => {
    const { data } = await api.put(`/actions/${id}`, payload);
    return data;
  },

  changeStatus: async (id: number, activo: number) => {
    const { data } = await api.patch(`/actions/${id}/status`, {
      ACTIVO: activo,
    });
    return data;
  },

  delete: async (id: number) => {
    const { data } = await api.delete(`/actions/${id}`);
    return data;
  },
};