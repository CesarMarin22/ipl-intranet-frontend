import {
  Autocomplete,
  Box,
  Chip,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from "@mui/material";
import { DIAS_SEMANA, estadoDia, type Empleado } from "../../../services/reloj";
import { useEmpleadosReloj, useSucursales } from "./useReloj";

export type FiltrosPanel = {
  desde: string;
  hasta: string;
  sucursal: string;
  q: string;
};

export function BarraFiltros({
  filtros,
  onChange,
  sinFechas,
}: {
  filtros: FiltrosPanel;
  onChange: (f: FiltrosPanel) => void;
  sinFechas?: boolean;
}) {
  const sucursales = useSucursales();
  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
      {!sinFechas && (
        <>
          <TextField
            size="small"
            type="date"
            label="Desde"
            value={filtros.desde}
            onChange={(e) => onChange({ ...filtros, desde: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            size="small"
            type="date"
            label="Hasta"
            value={filtros.hasta}
            onChange={(e) => onChange({ ...filtros, hasta: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </>
      )}
      <TextField
        size="small"
        select
        label="Sucursal"
        value={filtros.sucursal}
        onChange={(e) => onChange({ ...filtros, sucursal: e.target.value })}
        sx={{ minWidth: 180 }}
      >
        <MenuItem value="">Todas las mías</MenuItem>
        {sucursales.map((s) => (
          <MenuItem key={s.SUCURSALID} value={String(s.SUCURSALID)}>
            {s.CLAVE} - {s.NOMBRE}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        size="small"
        label="Buscar empleado"
        value={filtros.q}
        onChange={(e) => onChange({ ...filtros, q: e.target.value })}
        placeholder="Nombre o número"
        sx={{ minWidth: 220 }}
      />
    </Stack>
  );
}

export function SelectorEmpleados({
  value,
  onChange,
  multiple = true,
  label = "Empleados",
}: {
  value: number[];
  onChange: (ids: number[]) => void;
  multiple?: boolean;
  label?: string;
}) {
  const { data = [], isLoading } = useEmpleadosReloj();
  const seleccionados = data.filter((e) => value.includes(e.USUARIOID));
  const etiqueta = (e: Empleado) =>
    `${e.NOMBRE}${e.NUMERO_EMPLEADO ? ` (${e.NUMERO_EMPLEADO})` : ""}${e.SUCURSAL_CLAVE ? ` · ${e.SUCURSAL_CLAVE}` : ""}`;

  if (!multiple) {
    return (
      <Autocomplete
        options={data}
        loading={isLoading}
        value={seleccionados[0] ?? null}
        onChange={(_, v) => onChange(v ? [v.USUARIOID] : [])}
        getOptionLabel={etiqueta}
        isOptionEqualToValue={(a, b) => a.USUARIOID === b.USUARIOID}
        renderInput={(params) => <TextField {...params} label={label} required />}
      />
    );
  }

  return (
    <Autocomplete
      multiple
      disableCloseOnSelect
      options={data}
      loading={isLoading}
      value={seleccionados}
      onChange={(_, v) => onChange(v.map((e) => e.USUARIOID))}
      getOptionLabel={etiqueta}
      isOptionEqualToValue={(a, b) => a.USUARIOID === b.USUARIOID}
      renderInput={(params) => <TextField {...params} label={label} required />}
    />
  );
}

export function SelectorDias({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const activos = DIAS_SEMANA.map((_, i) => String(i)).filter((i) => value[Number(i)] === "1");
  return (
    <ToggleButtonGroup
      size="small"
      value={activos}
      onChange={(_, v: string[]) => onChange(DIAS_SEMANA.map((_, i) => (v.includes(String(i)) ? "1" : "0")).join(""))}
    >
      {DIAS_SEMANA.map((d, i) => (
        <ToggleButton key={d} value={String(i)} sx={{ px: 1.6, fontWeight: 900 }}>
          {d}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

export function ChipEstado({ estado, detalle, compacto }: { estado: string; detalle?: string | null; compacto?: boolean }) {
  const e = estadoDia(estado);
  const chip = (
    <Chip
      size="small"
      label={compacto ? e.corto || " " : e.label}
      sx={{
        bgcolor: e.color,
        color: "#fff",
        fontWeight: 800,
        minWidth: compacto ? 34 : undefined,
        height: compacto ? 24 : undefined,
      }}
    />
  );
  return detalle || compacto ? (
    <Tooltip title={`${e.label}${detalle ? ` · ${detalle}` : ""}`}>{chip}</Tooltip>
  ) : (
    chip
  );
}

export function Leyenda() {
  const estados = ["ASISTENCIA", "RETARDO", "FALTA", "INCAPACIDAD", "VACACIONES", "PERMISO_CON_GOCE", "FESTIVO", "DESCANSO", "DESCANSO_TRABAJADO", "SIN_HORARIO"];
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1.5 }}>
      {estados.map((e) => (
        <Box key={e} sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
          <ChipEstado estado={e} compacto />
          <Box component="span" sx={{ fontSize: 12, color: "text.secondary" }}>
            {estadoDia(e).label}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
