import { Box, Paper, Tab, Tabs } from "@mui/material";
import { useState } from "react";
import PageHeader from "../../../shared/components/PageHeader";
import { useDebouncedValue } from "../../../shared/hooks/useDebouncedValue";
import { hoyIso, inicioSemana } from "../../../services/reloj";
import { BarraFiltros, type FiltrosPanel } from "../components/comunes";
import TabAsistencia from "../components/TabAsistencia";
import TabChecadas from "../components/TabChecadas";
import TabHorasExtra from "../components/TabHorasExtra";
import TabTurnos from "../components/TabTurnos";
import TabIncidencias from "../components/TabIncidencias";
import TabEmpleados from "../components/TabEmpleados";

const PESTANAS = ["Asistencia", "Checadas", "Tiempo extra", "Turnos", "Incidencias", "Empleados"];
const CLAVE_PESTANA = "ipl_reloj_pestana";

export default function RelojAsistenciaPage() {
  const [pestana, setPestana] = useState(() => {
    try {
      return Number(sessionStorage.getItem(CLAVE_PESTANA)) || 0;
    } catch {
      return 0;
    }
  });
  const [filtros, setFiltros] = useState<FiltrosPanel>({
    desde: inicioSemana(hoyIso()),
    hasta: hoyIso(),
    sucursal: "",
    q: "",
  });

  const q = useDebouncedValue(filtros.q, 400);
  const consulta = { ...filtros, q };

  const cambiar = (v: number) => {
    setPestana(v);
    try {
      sessionStorage.setItem(CLAVE_PESTANA, String(v));
    } catch {
      // sin almacenamiento solo se pierde la pestaña recordada
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <PageHeader
        title="Asistencia"
        subtitle="Checadas, retardos, faltas, turnos, incidencias y tiempo extra de los empleados de tus sucursales."
      />

      <Paper sx={{ mb: 2 }}>
        <Tabs value={pestana} onChange={(_, v) => cambiar(v)} variant="scrollable" scrollButtons="auto">
          {PESTANAS.map((p) => (
            <Tab key={p} label={p} />
          ))}
        </Tabs>
      </Paper>

      <BarraFiltros filtros={filtros} onChange={setFiltros} sinFechas={pestana === 5} />

      {pestana === 0 && <TabAsistencia filtros={consulta} />}
      {pestana === 1 && <TabChecadas filtros={consulta} />}
      {pestana === 2 && <TabHorasExtra filtros={consulta} />}
      {pestana === 3 && <TabTurnos filtros={consulta} />}
      {pestana === 4 && <TabIncidencias filtros={consulta} />}
      {pestana === 5 && <TabEmpleados filtros={consulta} />}
    </Box>
  );
}
