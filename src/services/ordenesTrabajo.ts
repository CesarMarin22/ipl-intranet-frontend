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
};