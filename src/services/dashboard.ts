import { api } from "./api";

export type DashboardItem = {
  DocNum: number;
  CustomerRefNo?: string;
  CustomerName?: string;
  ManufacturerSerialNum?: string;
  AssignedDate?: string;
  FechaFormateada?: string;
};

export type DashboardResponse = {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  items: DashboardItem[];
};

export async function fetchDashboard(page = 1, perPage = 10) {
  const { data } = await api.get<DashboardResponse>("/dashboard", {
    params: { page, per_page: perPage },
  });
  return data;
}
