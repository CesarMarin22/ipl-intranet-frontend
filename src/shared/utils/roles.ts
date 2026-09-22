export type Perfil = 1 | 2 | 3 | 4 | 5;

export const PERFIL_LABEL: Record<number, string> = {
  1: "Administrador",
  2: "Supervisor",
  3: "Empleado",
  4: "Seguridad",
  5: "AUDI",
};

export const can = (perfil: number, roles: number[]) => roles.includes(perfil);