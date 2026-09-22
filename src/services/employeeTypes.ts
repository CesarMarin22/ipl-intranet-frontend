import { api } from "./api";

export type EmployeeType = {
  TIPO_EMPLEADO_ID: number;
  CLAVE?: string;
  NOMBRE: string;
  ACTIVO: number;
};

type ApiResponse<T> = {
  ok: boolean;
  message: string;
  data: T;
};

export const EmployeeTypesService = {
  getAll: async (): Promise<EmployeeType[]> => {
    const { data } = await api.get<ApiResponse<EmployeeType[]>>("/employee-types");
    return data.data ?? [];
  },

  getById: async (id: number): Promise<EmployeeType> => {
    const { data } = await api.get<ApiResponse<EmployeeType>>(`/employee-types/${id}`);
    return data.data;
  },

  create: async (payload: { CLAVE?: string | null; NOMBRE: string; ACTIVO: number }) => {
    const { data } = await api.post("/employee-types", payload);
    return data;
  },

  update: async (id: number, payload: { CLAVE?: string | null; NOMBRE: string; ACTIVO: number }) => {
    const { data } = await api.put(`/employee-types/${id}`, payload);
    return data;
  },

  changeStatus: async (id: number, activo: number) => {
    const { data } = await api.patch(`/employee-types/${id}/status`, {
      ACTIVO: activo,
    });
    return data;
  },

  delete: async (id: number) => {
    const { data } = await api.delete(`/employee-types/${id}`);
    return data;
  },
};