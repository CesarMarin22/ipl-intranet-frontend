import { api } from "./api";

export type ModuleRow = {
  MODULOID: number;
  NOMBRE: string;
  PADRE_ID?: number | null;
  CLAVE: string;
  RUTA?: string | null;
  ORDEN?: number | null;
  ACTIVO: number;
};

export type ModuleAction = {
  ACCIONID: number;
  CLAVE: string;
  NOMBRE: string;
  ACTIVO: number;
  ASIGNADA: number;
};

export type ModuleActionMapRow = {
  MODULOID: number;
  ACCIONID: number;
  CLAVE: string;
  NOMBRE: string;
  ACTIVO: number;
  ASIGNADA: number;
};

type ApiResponse<T> = {
  ok: boolean;
  message: string;
  data: T;
};

export const ModulesService = {
  getAll: async (): Promise<ModuleRow[]> => {
    const { data } = await api.get<ApiResponse<ModuleRow[]>>("/modules");
    return data.data ?? [];
  },

  getTree: async (): Promise<ModuleRow[]> => {
    const { data } = await api.get<ApiResponse<ModuleRow[]>>(
      "/modules/tree"
    );
    return data.data ?? [];
  },

  getById: async (id: number): Promise<ModuleRow> => {
    const { data } = await api.get<ApiResponse<ModuleRow>>(
      `/modules/${id}`
    );
    return data.data;
  },

  create: async (payload: {
    NOMBRE: string;
    PADRE_ID?: number | null;
    CLAVE: string;
    RUTA?: string | null;
    ORDEN?: number | null;
    ACTIVO: number;
  }) => {
    const { data } = await api.post("/modules", payload);
    return data;
  },

  update: async (
    id: number,
    payload: {
      NOMBRE: string;
      PADRE_ID?: number | null;
      CLAVE: string;
      RUTA?: string | null;
      ORDEN?: number | null;
      ACTIVO: number;
    }
  ) => {
    const { data } = await api.put(`/modules/${id}`, payload);
    return data;
  },

  changeStatus: async (id: number, activo: number) => {
    const { data } = await api.patch(`/modules/${id}/status`, {
      ACTIVO: activo,
    });
    return data;
  },

  delete: async (id: number) => {
    const { data } = await api.delete(`/modules/${id}`);
    return data;
  },

  getActions: async (id: number): Promise<ModuleAction[]> => {
    const { data } = await api.get<ApiResponse<ModuleAction[]>>(
      `/modules/${id}/actions`
    );
    return data.data ?? [];
  },

  getActionsMap: async (): Promise<ModuleActionMapRow[]> => {
  const { data } = await api.get<ApiResponse<ModuleActionMapRow[]>>(
    "/modules/actions-map"
  );
  return data.data ?? [];
},

  updateActions: async (id: number, actions: ModuleAction[]) => {
    const { data } = await api.put(`/modules/${id}/actions`, {
      actions,
    });
    return data;
  },
};