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

export type DepartmentRow = {
  DEPAID: number;
  NOMBRE: string;
  ACTIVO: number;
};

export type PartnerRow = {
  SOCIOID: number;
  NOMBRE: string;
  RFC?: string | null;
  ACTIVO: number;
};

export type EmployeeTypeRow = {
  TIPO_EMPLEADO_ID: number;
  CLAVE: string;
  NOMBRE: string;
  ACTIVO: number;
};

export async function getProfiles() {
  const { data } = await api.get<ApiResponse<ProfileRow[]>>("/profiles");
  return data.data ?? [];
}

export async function getDepartments() {
  const { data } = await api.get<ApiResponse<DepartmentRow[]>>("/departments");
  return data.data ?? [];
}

export async function getPartners() {
  const { data } = await api.get<ApiResponse<PartnerRow[]>>("/partners");
  return data.data ?? [];
}

export async function getEmployeeTypes() {
  const { data } =
    await api.get<ApiResponse<EmployeeTypeRow[]>>("/employee-types");
  return data.data ?? [];
}

// ----------------------------------------------------------------
// Catálogo abierto (solo lectura, sin permiso de módulo, solo sesión
// activa). Úsalo para dropdowns de referencia en CUALQUIER formulario
// nuevo (Perfil, Socio, Tipo de empleado, Departamento, Usuario). NO
// uses las funciones de arriba (getProfiles, getDepartments, etc.)
// para eso: esas exigen el permiso de administración completo del
// módulo correspondiente y le abrirían ese módulo entero a quien no
// debería administrarlo.
// ----------------------------------------------------------------

export type CatalogProfile = {
  PERFILID: number;
  NOMBRE: string;
};

export type CatalogPartner = {
  SOCIOID: number;
  NOMBRE: string;
};

export type CatalogEmployeeType = {
  TIPO_EMPLEADO_ID: number;
  CLAVE: string;
  NOMBRE: string;
};

export type CatalogDepartment = {
  DEPAID: number;
  NOMBRE: string;
};

export type CatalogUser = {
  USUARIOID: number;
  NOMBRE: string;
  DEPAID?: number | null;
  HAS_EMAIL: boolean;
};

export async function getCatalogProfiles() {
  const { data } =
    await api.get<ApiResponse<CatalogProfile[]>>("/catalog/profiles");
  return data.data ?? [];
}

export async function getCatalogPartners() {
  const { data } =
    await api.get<ApiResponse<CatalogPartner[]>>("/catalog/partners");
  return data.data ?? [];
}

export async function getCatalogEmployeeTypes() {
  const { data } = await api.get<ApiResponse<CatalogEmployeeType[]>>(
    "/catalog/employee-types",
  );
  return data.data ?? [];
}

export async function getCatalogDepartments() {
  const { data } = await api.get<ApiResponse<CatalogDepartment[]>>(
    "/catalog/departments",
  );
  return data.data ?? [];
}

export async function getCatalogUsers() {
  const { data } = await api.get<ApiResponse<CatalogUser[]>>("/catalog/users");
  return data.data ?? [];
}
