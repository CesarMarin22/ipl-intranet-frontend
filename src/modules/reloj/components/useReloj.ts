import { useQuery } from "@tanstack/react-query";
import { getSucursales } from "../../../services/sucursales";
import { RelojService } from "../../../services/reloj";

export function useSucursales() {
  return useQuery({
    queryKey: ["sucursales"],
    queryFn: getSucursales,
    staleTime: 10 * 60_000,
  }).data ?? [];
}

export function useEmpleadosReloj(sucursal?: string) {
  return useQuery({
    queryKey: ["reloj-empleados", sucursal ?? ""],
    queryFn: () => RelojService.empleados({ sucursal }),
    staleTime: 60_000,
  });
}
