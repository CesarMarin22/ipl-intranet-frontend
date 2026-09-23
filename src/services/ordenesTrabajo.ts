import { api } from "./api";

type ApiResponse<T> = {
  ok: boolean;
  message?: string;
  data: T;
};

export type SapListResponse<T> = {
  value: T[];
};

export type ClienteSAP = {
  CardCode: string;
  CardName: string;
  CardForeignName?: string;
};


export type EquipoSAP = {
  Items: {
    ItemCode: string;
    U_Modelo: string;
  };
  CustomerEquipmentCards: {
    U_NoEconomico: string;
    ItemCode: string;
    ManufacturerSerialNum: string;
  };
  Manufacturers: {
    ManufacturerName: string;
  };
};

export type ItemSAP = {
  ItemCode: string;
  ItemName: string;
};

export type EmpleadoSAP = {
  FirstName?: string;
  LastName?: string;
  MiddleName?: string;
  EmployeeID: number;
  FullName: string;
  RoleID?: number;
};

export type TipoProblemaSAP = {
  ProblemTypeID: number;
  Name: string;
};

export type GuardarCSVPayload = Record<string, any>;

export type ArchivoDrive = {
  id: string;
  name: string;
  mimeType: string;
};

export const OrdenesTrabajoService = {
  buscarClientes: async (query: string) => {
    const res = await api.get<ApiResponse<SapListResponse<ClienteSAP>>>(
      "/ordenes-trabajo/clientes",
      { params: { query } }
    );

    return res.data.data?.value || [];
  },

  buscarEquiposCliente: async (customerCode: string, searchValue: string) => {
    const res = await api.get<ApiResponse<SapListResponse<EquipoSAP>>>(
      "/ordenes-trabajo/equipos-cliente",
      {
        params: {
          customer_code: customerCode,
          search_value: searchValue,
        },
      }
    );

    return res.data.data?.value || [];
  },

  buscarItems: async (query: string, groupCode = "538") => {
    const res = await api.get<ApiResponse<SapListResponse<ItemSAP>>>(
      "/ordenes-trabajo/items",
      {
        params: {
          query,
          groupCode,
        },
      }
    );

    return res.data.data?.value || [];
  },

  buscarEmpleados: async (query: string, todos = false) => {
    const res = await api.get<ApiResponse<SapListResponse<EmpleadoSAP>>>(
      "/ordenes-trabajo/empleados",
      {
        params: {
          query,
          todos: todos ? "1" : "0",
        },
      }
    );

    return res.data.data?.value || [];
  },

  buscarCssrs: async (query: string) => {
    const res = await api.get<ApiResponse<SapListResponse<EmpleadoSAP>>>(
      "/ordenes-trabajo/cssrs",
      { params: { query } }
    );

    return res.data.data?.value || [];
  },

  tiposProblema: async () => {
    const res = await api.get<ApiResponse<SapListResponse<TipoProblemaSAP>>>(
      "/ordenes-trabajo/tipos-problema"
    );

    return res.data.data?.value || [];
  },

  obtenerSeveridades: async (callType: string = "24") => {
    const res = await api.get<ApiResponse<any>>(
      "/ordenes-trabajo/severidades",
      { params: { call_type: callType } }
    );
    return res.data.data?.opciones || [];
  },

  guardarCsv: async (payload: GuardarCSVPayload) => {
    const res = await api.post<ApiResponse<any>>(
      "/ordenes-trabajo/guardar-csv",
      payload
    );

    return res.data.data;
  },

  verOT: async (docnum: number | string) => {
    const res = await api.get<ApiResponse<any>>(`/ordenes-trabajo/${docnum}`);
    return res.data.data;
  },

  // Flash Reports (OT Seguridad)
  listarFlashReports: async (page = 1) => {
    const res = await api.get<ApiResponse<any>>(
      "/ordenes-trabajo/flash-reports",
      { params: { page } }
    );
    return res.data.data;
  },

  listarNormal: async (page = 1) => {
    const res = await api.get<ApiResponse<any>>(
      "/ordenes-trabajo/normal",
      { params: { page } }
    );
    return res.data.data;
  },

  obtenerSeguimiento: async (docnum: number | string) => {
    const res = await api.get<ApiResponse<any>>(
      `/ordenes-trabajo/${docnum}/seguimiento`
    );
    return res.data.data;
  },

  guardarSeguimiento: async (docnum: number | string, payload: any) => {
    const res = await api.post<ApiResponse<any>>(
      `/ordenes-trabajo/${docnum}/seguimiento`,
      payload
    );
    return res.data.data;
  },

  // OT Audi
  listarAudi: async (page = 1) => {
    const res = await api.get<ApiResponse<any>>(
      "/ordenes-trabajo/audi",
      { params: { page } }
    );
    return res.data.data;
  },

  // Upload de imágenes para Flash Reports
  subirImagenesFlash: async (flashRefId: string, formData: FormData) => {
    const res = await api.post<ApiResponse<any>>(
      "/ordenes-trabajo/subir-imagenes-flash",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        params: { flashRefId },
      }
    );
    return res.data.data;
  },

  verImagenesFlash: async (refId: string) => {
    const res = await api.get<ApiResponse<{ archivos: ArchivoDrive[] }>>(
      `/ordenes-trabajo/ver-imagenes-flash/${encodeURIComponent(refId)}`
    );
    return res.data.data?.archivos || [];
  },

  urlImagenDrive: (fileId: string) =>
    `${api.defaults.baseURL}/ordenes-trabajo/imagen-drive/${encodeURIComponent(fileId)}`,
};