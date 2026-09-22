import { api } from "./api";

export type Department = {
  DEPAID: number;
  NOMBRE: string;
  ACTIVO: number;
};

type ApiResponse<T> = {
  ok: boolean;
  message: string;
  data: T;
};

const validateResponse = <T>(response: ApiResponse<T>): T => {
  if (!response.ok) {
    throw new Error(response.message || "Ocurrió un error");
  }

  return response.data;
};

export const DepartmentsService = {
  getAll: async (): Promise<Department[]> => {
    const { data } = await api.get<ApiResponse<Department[]>>("/departments");
    return validateResponse(data) ?? [];
  },

  getById: async (id: number): Promise<Department> => {
    const { data } = await api.get<ApiResponse<Department>>(`/departments/${id}`);
    return validateResponse(data);
  },

  create: async (payload: { NOMBRE: string; ACTIVO: number }) => {
    const { data } = await api.post<ApiResponse<Department>>("/departments", payload);
    return validateResponse(data);
  },

  update: async (id: number, payload: { NOMBRE: string; ACTIVO: number }) => {
    const { data } = await api.put<ApiResponse<Department>>(`/departments/${id}`, payload);
    return validateResponse(data);
  },

  changeStatus: async (id: number, activo: number) => {
    const { data } = await api.patch<ApiResponse<Department>>(`/departments/${id}/status`, {
      ACTIVO: activo,
    });
    return validateResponse(data);
  },

  delete: async (id: number) => {
    const { data } = await api.delete<ApiResponse<null>>(`/departments/${id}`);
    return validateResponse(data);
  },
};