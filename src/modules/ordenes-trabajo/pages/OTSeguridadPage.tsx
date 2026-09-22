import {
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

import PageHeader from "../../../shared/components/PageHeader";
import { useDebouncedValue } from "../../../shared/hooks/useDebouncedValue";
import {
  formatDateForSAP,
  validateDateTimeRange,
} from "../../../shared/utils/dateUtils";
import {
  showError,
  showSuccess,
} from "../../../shared/utils/swal";

import {
  OrdenesTrabajoService,
  type ClienteSAP,
  type EmpleadoSAP,
  type EquipoSAP,
  type TipoProblemaSAP,
} from "../../../services/ordenesTrabajo";

import LoaderOverlay from "../../../shared/components/LoaderOverlay";

const SUCURSALES = [
  { value: "87", label: "AGS" },
  { value: "82", label: "CLY" },
  { value: "88", label: "GDL" },
  { value: "89", label: "IRA" },
  { value: "83", label: "MEX" },
  { value: "85", label: "MTY" },
  { value: "86", label: "QRO" },
  { value: "90", label: "SLP" },
  { value: "84", label: "TOL" },
  { value: "374", label: "PUE" },
];

const SEVERIDADES = [
  { value: "Menor", label: "Menor" },
  { value: "Moderada", label: "Moderada" },
  { value: "Critica", label: "Crítica" },
  { value: "Fatal", label: "Fatal" },
];

type FormState = {
  folio: string;
  fechaInicio: string;
  horaInicioTrabajo: string;
  codigoCliente: string;
  nombreCliente: string;
  noSerie: string;
  itemCode: string;
  horometro: string;
  descripcionFalla: string;
  trabajoRealizado: string;
  fechaTermino: string;
  horaSalida: string;
  serie: string;

  realizoTrabajo: string;
  realizoTrabajoEmployeeID: string;

  tipoProblema: string;
  severidad: string;
  areaTrabajo: string;
  accionesSituacion: string;
  planAccion: string;
  leccionesAprendidas: string;

  personaReporta: string;
  vistoBuenoCliente: string;
};

const initialState: FormState = {
  folio: "",
  fechaInicio: "",
  horaInicioTrabajo: "",
  codigoCliente: "",
  nombreCliente: "",
  noSerie: "",
  itemCode: "",
  horometro: "",
  descripcionFalla: "",
  trabajoRealizado: "",
  fechaTermino: "",
  horaSalida: "",
  serie: "",

  realizoTrabajo: "",
  realizoTrabajoEmployeeID: "",

  tipoProblema: "",
  severidad: "",
  areaTrabajo: "",
  accionesSituacion: "",
  planAccion: "",
  leccionesAprendidas: "",

  personaReporta: "",
  vistoBuenoCliente: "",
};

export default function OTSeguridadPage() {
  const [form, setForm] = useState<FormState>(initialState);

  const [clientes, setClientes] = useState<ClienteSAP[]>([]);
  const [equipos, setEquipos] = useState<EquipoSAP[]>([]);
  const [empleadosRealizo, setEmpleadosRealizo] = useState<EmpleadoSAP[]>([]);
  const [tiposProblema, setTiposProblema] = useState<TipoProblemaSAP[]>([]);

  const [showClientes, setShowClientes] = useState(false);
  const [showEquipos, setShowEquipos] = useState(false);
  const [showRealizo, setShowRealizo] = useState(false);

  const [loadingClientes, setLoadingClientes] = useState(false);
  const [loadingEquipos, setLoadingEquipos] = useState(false);
  const [loadingRealizo, setLoadingRealizo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const clienteSearch = useDebouncedValue(form.codigoCliente, 500);
  const equipoSearch = useDebouncedValue(form.noSerie, 500);
  const realizoSearch = useDebouncedValue(form.realizoTrabajo, 500);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Cargar tipos de problema al montar
  useEffect(() => {
    const loadData = async () => {
      try {
        const tipos = await OrdenesTrabajoService.tiposProblema();
        setTiposProblema(tipos);
      } catch (error) {
        console.error("Error cargando tipos de problema:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Búsqueda de clientes
  useEffect(() => {
    if (!clienteSearch.trim()) {
      setClientes([]);
      return;
    }

    const searchClientes = async () => {
      setLoadingClientes(true);
      try {
        const results = await OrdenesTrabajoService.buscarClientes(
          clienteSearch
        );
        setClientes(results);
      } catch (error) {
        console.error("Error buscando clientes:", error);
      } finally {
        setLoadingClientes(false);
      }
    };

    searchClientes();
  }, [clienteSearch]);

  // Búsqueda de equipos
  useEffect(() => {
    if (!form.codigoCliente || !equipoSearch.trim()) {
      setEquipos([]);
      return;
    }

    const searchEquipos = async () => {
      setLoadingEquipos(true);
      try {
        const results = await OrdenesTrabajoService.buscarEquiposCliente(
          form.codigoCliente,
          equipoSearch
        );
        setEquipos(results);
      } catch (error) {
        console.error("Error buscando equipos:", error);
      } finally {
        setLoadingEquipos(false);
      }
    };

    searchEquipos();
  }, [form.codigoCliente, equipoSearch]);

  // Búsqueda de técnicos
  useEffect(() => {
    if (!realizoSearch.trim()) {
      setEmpleadosRealizo([]);
      return;
    }

    const searchEmpleados = async () => {
      setLoadingRealizo(true);
      try {
        const results = await OrdenesTrabajoService.buscarEmpleados(
          realizoSearch,
          false
        );
        setEmpleadosRealizo(results);
      } catch (error) {
        console.error("Error buscando técnicos:", error);
      } finally {
        setLoadingRealizo(false);
      }
    };

    searchEmpleados();
  }, [realizoSearch]);

  const validateForm = (): boolean => {
    const required = [
      "codigoCliente",
      "fechaInicio",
      "horaInicioTrabajo",
      "descripcionFalla",
      "trabajoRealizado",
      "severidad",
      "areaTrabajo",
    ];

    for (const field of required) {
      if (!form[field as keyof FormState]?.trim()) {
        showError("Validación", `${field} es obligatorio`);
        return false;
      }
    }

    if (!validateDateTimeRange(form.fechaInicio, form.horaInicioTrabajo,
        form.fechaTermino, form.horaSalida)) {
      showError("Validación", "Las fechas/horas no son válidas");
      return false;
    }

    return true;
  };

  const handleGuardar = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      const payload = {
        ...form,
        fechaInicio: formatDateForSAP(form.fechaInicio),
        fechaTermino: formatDateForSAP(form.fechaTermino),
        realizoTrabajo: form.realizoTrabajoEmployeeID,
        "data-tipo": "seguridad",
        U_Severidad: form.severidad,
      };

      await OrdenesTrabajoService.guardarCsv(payload);

      showSuccess(
        "Guardado exitoso",
        "El Flash Report se guardó correctamente."
      );

      setForm(initialState);
    } catch (error: any) {
      showError("Error", error.message || "No se pudo guardar el Flash Report.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoaderOverlay label="Cargando Flash Reports..." />;
  }

  return (
    <Box>
      <PageHeader title="Crear Flash Report (OT Seguridad)" />

      <Paper sx={{ p: 3, mt: 3 }}>
        <Box sx={{ display: "grid", gap: 2 }}>
          {/* Sucursal */}
          <TextField
            select
            label="Sucursal"
            value={form.serie}
            onChange={(e) => handleChange("serie", e.target.value)}
            fullWidth
          >
            {SUCURSALES.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                {s.label}
              </MenuItem>
            ))}
          </TextField>

          {/* Cliente */}
          <TextField
            label="Código Cliente"
            value={form.codigoCliente}
            onChange={(e) => handleChange("codigoCliente", e.target.value.toUpperCase())}
            fullWidth
            InputProps={{
              endAdornment: loadingClientes && <CircularProgress size={20} />,
            }}
          />
          {showClientes && clientes.length > 0 && (
            <Box sx={{ mt: -1.5, p: 1, border: "1px solid #ccc", maxHeight: 200, overflowY: "auto" }}>
              {clientes.map((c) => (
                <Box
                  key={c.CardCode}
                  onClick={() => {
                    handleChange("codigoCliente", c.CardCode);
                    handleChange("nombreCliente", c.CardName);
                    setShowClientes(false);
                  }}
                  sx={{ p: 1, cursor: "pointer", "&:hover": { bgcolor: "#f0f0f0" } }}
                >
                  {c.CardName}
                </Box>
              ))}
            </Box>
          )}

          {/* Equipo */}
          <TextField
            label="No. Serie / Equipo"
            value={form.noSerie}
            onChange={(e) => handleChange("noSerie", e.target.value.toUpperCase())}
            fullWidth
            disabled={!form.codigoCliente}
            InputProps={{
              endAdornment: loadingEquipos && <CircularProgress size={20} />,
            }}
          />

          {/* Fechas */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TextField
              label="Fecha Inicio"
              type="date"
              value={form.fechaInicio}
              onChange={(e) => handleChange("fechaInicio", e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Hora Inicio"
              type="time"
              value={form.horaInicioTrabajo}
              onChange={(e) => handleChange("horaInicioTrabajo", e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Box>

          {/* Descripción de falla */}
          <TextField
            label="Descripción de la Falla"
            value={form.descripcionFalla}
            onChange={(e) => handleChange("descripcionFalla", e.target.value)}
            multiline
            rows={3}
            fullWidth
          />

          {/* Trabajo realizado */}
          <TextField
            label="Trabajo Realizado"
            value={form.trabajoRealizado}
            onChange={(e) => handleChange("trabajoRealizado", e.target.value)}
            multiline
            rows={3}
            fullWidth
          />

          {/* Técnico */}
          <TextField
            label="Técnico que Realizó"
            value={form.realizoTrabajo}
            onChange={(e) => handleChange("realizoTrabajo", e.target.value.toUpperCase())}
            fullWidth
            InputProps={{
              endAdornment: loadingRealizo && <CircularProgress size={20} />,
            }}
          />

          {/* Severidad */}
          <TextField
            select
            label="Severidad"
            value={form.severidad}
            onChange={(e) => handleChange("severidad", e.target.value)}
            fullWidth
            required
          >
            {SEVERIDADES.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                {s.label}
              </MenuItem>
            ))}
          </TextField>

          {/* Área de trabajo */}
          <TextField
            label="Área de Trabajo"
            value={form.areaTrabajo}
            onChange={(e) => handleChange("areaTrabajo", e.target.value)}
            multiline
            rows={2}
            fullWidth
            required
          />

          {/* Acciones para la situación */}
          <TextField
            label="Acciones para la Situación"
            value={form.accionesSituacion}
            onChange={(e) => handleChange("accionesSituacion", e.target.value)}
            multiline
            rows={2}
            fullWidth
          />

          {/* Plan de acción */}
          <TextField
            label="Plan de Acción"
            value={form.planAccion}
            onChange={(e) => handleChange("planAccion", e.target.value)}
            multiline
            rows={2}
            fullWidth
          />

          {/* Lecciones aprendidas */}
          <TextField
            label="Lecciones Aprendidas"
            value={form.leccionesAprendidas}
            onChange={(e) => handleChange("leccionesAprendidas", e.target.value)}
            multiline
            rows={2}
            fullWidth
          />

          {/* Botón guardar */}
          <Button
            variant="contained"
            onClick={handleGuardar}
            disabled={saving}
            sx={{ mt: 3 }}
          >
            {saving ? "Guardando..." : "Guardar Flash Report"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
