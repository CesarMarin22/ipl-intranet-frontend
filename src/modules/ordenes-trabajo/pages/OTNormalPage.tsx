import {
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  FormLabel,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import PageHeader from "../../../shared/components/PageHeader";
import CampoFecha from "../../../shared/components/CampoFecha";
import { useDebouncedValue } from "../../../shared/hooks/useDebouncedValue";
import {
  formatDateForSAP,
  validateDateTimeRange,
} from "../../../shared/utils/dateUtils";
import {
  showError,
  showSuccess,
  showWarning,
} from "../../../shared/utils/swal";

import {
  OrdenesTrabajoService,
  type ClienteSAP,
  type EmpleadoSAP,
  type EquipoSAP,
  type ItemSAP,
  type TipoProblemaSAP,
} from "../../../services/ordenesTrabajo";

import LoaderOverlay from "../../../shared/components/LoaderOverlay";
import { me } from "../../../services/auth";

const SUCURSALES_SAP = [
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

function getSucursalLabel(value: string) {
  const sucursal = SUCURSALES_SAP.find((item) => item.value === value);
  return sucursal ? `${sucursal.value} - ${sucursal.label}` : value;
}

type Refaccion = {
  cantidad: string;
  numeroParte: string;
  descripcion: string;
};

type FormState = {
  folio: string;
  fechaInicio: string;
  horaInicioTrabajo: string;
  tipoOrden: string;
  tipoProblema: string;
  personaReporta: string;
  equipoFuncionamiento: string;
  codigoCliente: string;
  nombreCliente: string;
  noSerie: string;
  marca: string;
  modelo: string;
  noEconomico: string;
  itemCode: string;
  horometro: string;
  descripcionFalla: string;
  trabajoRealizado: string;
  tipoRefacciones: string;
  fechaTermino: string;
  horaSalida: string;
  serie: string;

  realizoTrabajo: string;
  realizoTrabajoEmployeeID: string;
  realizoTrabajoRoleID: string;

  tecnico3: string;
  tecnico3EmployeeID: string;

  tecnico4: string;
  tecnico4EmployeeID: string;

  nombreCssr: string;

  revisoTrabajo: string;
  revisoTrabajoEmployeeID: string;

  vistoBuenoCliente: string;
};

const initialState: FormState = {
  folio: "",
  fechaInicio: "",
  horaInicioTrabajo: "",
  tipoOrden: "",
  tipoProblema: "",
  personaReporta: "",
  equipoFuncionamiento: "",
  codigoCliente: "",
  nombreCliente: "",
  noSerie: "",
  marca: "",
  modelo: "",
  noEconomico: "",
  itemCode: "",
  horometro: "",
  descripcionFalla: "",
  trabajoRealizado: "",
  tipoRefacciones: "1",
  fechaTermino: "",
  horaSalida: "",
  serie: "",

  realizoTrabajo: "",
  realizoTrabajoEmployeeID: "",
  realizoTrabajoRoleID: "",

  tecnico3: "",
  tecnico3EmployeeID: "",

  tecnico4: "",
  tecnico4EmployeeID: "",

  nombreCssr: "",

  revisoTrabajo: "",
  revisoTrabajoEmployeeID: "",

  vistoBuenoCliente: "",
};

const emptyRefacciones: Refaccion[] = Array.from({ length: 20 }, () => ({
  cantidad: "",
  numeroParte: "",
  descripcion: "",
}));

function normalizeInput(value: string) {
  return value
    .toUpperCase()
    .replace(/[ÁÀÂÄ]/g, "A")
    .replace(/[ÉÈÊË]/g, "E")
    .replace(/[ÍÌÎÏ]/g, "I")
    .replace(/[ÓÒÔÖ]/g, "O")
    .replace(/[ÚÙÛÜ]/g, "U")
    .replace(/Ñ/g, "N");
}

function normalizeTextarea(value: string) {
  return normalizeInput(value)
    .replace(/\r?\n+/g, ". ")
    .replace(/\s+/g, " ")
    .trimStart();
}

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "260px 1fr" },
        gap: 1.5,
        alignItems: "center",
        mb: 2,
      }}
    >
      <Typography fontWeight={700}>{label}</Typography>
      <Box>{children}</Box>
    </Box>
  );
}

export default function OTNormalPage() {
  const [form, setForm] = useState<FormState>(initialState);
  const [refacciones, setRefacciones] = useState<Refaccion[]>(emptyRefacciones);

  const [clientes, setClientes] = useState<ClienteSAP[]>([]);
  const [equipos, setEquipos] = useState<EquipoSAP[]>([]);
  const [empleadosRealizo, setEmpleadosRealizo] = useState<EmpleadoSAP[]>([]);
  const [empleadosTec2, setEmpleadosTec2] = useState<EmpleadoSAP[]>([]);
  const [empleadosTec3, setEmpleadosTec3] = useState<EmpleadoSAP[]>([]);
  const [empleadosReviso, setEmpleadosReviso] = useState<EmpleadoSAP[]>([]);
  const [cssrs, setCssrs] = useState<EmpleadoSAP[]>([]);
  const [items, setItems] = useState<ItemSAP[]>([]);
  const [tiposProblema, setTiposProblema] = useState<TipoProblemaSAP[]>([]);
  const [canChangeSucursal, setCanChangeSucursal] = useState(false);
  

  const [showClientes, setShowClientes] = useState(false);
  const [showEquipos, setShowEquipos] = useState(false);
  const [showRealizo, setShowRealizo] = useState(false);
  const [showTec2, setShowTec2] = useState(false);
  const [showTec3, setShowTec3] = useState(false);
  const [showReviso, setShowReviso] = useState(false);
  const [showCssrs, setShowCssrs] = useState(false);
  const [showItems, setShowItems] = useState(false);

  const [loadingClientes, setLoadingClientes] = useState(false);
  const [loadingEquipos, setLoadingEquipos] = useState(false);
  const [loadingRealizo, setLoadingRealizo] = useState(false);
  const [loadingTec2, setLoadingTec2] = useState(false);
  const [loadingTec3, setLoadingTec3] = useState(false);
  const [loadingReviso, setLoadingReviso] = useState(false);
  const [loadingCssrs, setLoadingCssrs] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [clienteSeleccionado, setClienteSeleccionado] = useState(false);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(false);
  const [realizoSeleccionado, setRealizoSeleccionado] = useState(false);
  const [tec2Seleccionado, setTec2Seleccionado] = useState(false);
  const [tec3Seleccionado, setTec3Seleccionado] = useState(false);
  const [revisoSeleccionado, setRevisoSeleccionado] = useState(false);
  const [cssrSeleccionado, setCssrSeleccionado] = useState(false);

  const [activeRefIndex, setActiveRefIndex] = useState<number | null>(null);
  const activeRefSearch =
    activeRefIndex !== null
      ? refacciones[activeRefIndex]?.numeroParte || ""
      : "";

  const clienteSearch = useDebouncedValue(form.codigoCliente, 500);
  const equipoSearch = useDebouncedValue(form.noSerie, 500);
  const realizoSearch = useDebouncedValue(form.realizoTrabajo, 500);
  const tec2Search = useDebouncedValue(form.tecnico3, 500);
  const tec3Search = useDebouncedValue(form.tecnico4, 500);
  const revisoSearch = useDebouncedValue(form.revisoTrabajo, 500);
  const cssrSearch = useDebouncedValue(form.nombreCssr, 500);
  const itemSearch = useDebouncedValue(activeRefSearch, 500);

  const requiredFields = useMemo(
    () => [
      { key: "folio", label: "Folio" },
      { key: "fechaInicio", label: "Fecha Inicio" },
      { key: "horaInicioTrabajo", label: "Hora Inicio Trabajo" },
      { key: "tipoOrden", label: "Tipo de Orden" },
      { key: "personaReporta", label: "Persona que Reporta" },
      { key: "equipoFuncionamiento", label: "Equipo en Funcionamiento" },
      { key: "codigoCliente", label: "Código de Cliente" },
      { key: "nombreCliente", label: "Nombre del Cliente" },
      { key: "noSerie", label: "No. de Serie" },
      { key: "horometro", label: "Horómetro" },
      { key: "descripcionFalla", label: "Descripción de la Falla" },
      { key: "trabajoRealizado", label: "Trabajo Realizado" },
      { key: "fechaTermino", label: "Fecha de Término" },
      { key: "horaSalida", label: "Hora de Salida" },
      { key: "realizoTrabajo", label: "Realizó Trabajo" },
      { key: "nombreCssr", label: "Nombre de REV" },
      { key: "vistoBuenoCliente", label: "Visto Bueno del Cliente" },
      { key: "serie", label: "Sucursal" },
    ],
    [],
  );

  const handleChange = (key: keyof FormState, value: string) => {
    const rawAllowedFields: (keyof FormState)[] = [
      "fechaInicio",
      "horaInicioTrabajo",
      "fechaTermino",
      "horaSalida",
      "tipoOrden",
      "equipoFuncionamiento",
      "tipoRefacciones",
      "realizoTrabajoEmployeeID",
      "realizoTrabajoRoleID",
      "tecnico3EmployeeID",
      "tecnico4EmployeeID",
      "revisoTrabajoEmployeeID",
    ];

    const textareaFields: (keyof FormState)[] = [
      "descripcionFalla",
      "trabajoRealizado",
    ];

    const nextValue = rawAllowedFields.includes(key)
      ? value
      : textareaFields.includes(key)
        ? normalizeTextarea(value)
        : normalizeInput(value);

    setForm((prev) => ({ ...prev, [key]: nextValue }));
  };

  const handleRefaccionChange = (
    index: number,
    key: keyof Refaccion,
    value: string,
  ) => {
    const nextValue = key === "cantidad" ? value : normalizeInput(value);

    setRefacciones((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [key]: nextValue } : item,
      ),
    );
  };

  useEffect(() => {
    const cargarUsuario = async () => {
      const user = await me();

      if (user.authenticated && user.sucursal) {
        handleChange("serie", String(user.sucursal));
      }

      // Temporal: perfil 1 puede cambiar sucursal
      setCanChangeSucursal(user.perfil === 1);
    };

    cargarUsuario();
  }, []);
  useEffect(() => {
    const buscar = async () => {
      const value = clienteSearch.trim();

      if (clienteSeleccionado) return;

      if (value.length < 2) {
        setClientes([]);
        setShowClientes(false);
        return;
      }

      try {
        setLoadingClientes(true);
        const rows = await OrdenesTrabajoService.buscarClientes(value);
        setClientes(rows);
        setShowClientes(rows.length > 0);
      } catch {
        setClientes([]);
        setShowClientes(false);
      } finally {
        setLoadingClientes(false);
      }
    };

    buscar();
  }, [clienteSearch, clienteSeleccionado]);

  useEffect(() => {
    const cargarTiposProblema = async () => {
      try {
        const rows = await OrdenesTrabajoService.tiposProblema();
        setTiposProblema(rows);
      } catch (error) {
        console.error(error);
        setTiposProblema([]);
      }
    };

    cargarTiposProblema();
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 400));
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    const buscar = async () => {
      const value = equipoSearch.trim();

      if (equipoSeleccionado) return;

      if (!form.codigoCliente || value.length < 2) {
        setEquipos([]);
        setShowEquipos(false);
        return;
      }

      try {
        setLoadingEquipos(true);
        const rows = await OrdenesTrabajoService.buscarEquiposCliente(
          form.codigoCliente,
          value,
        );
        setEquipos(rows);
        setShowEquipos(rows.length > 0);
      } catch {
        setEquipos([]);
        setShowEquipos(false);
      } finally {
        setLoadingEquipos(false);
      }
    };

    buscar();
  }, [equipoSearch, form.codigoCliente, equipoSeleccionado]);

  useEffect(() => {
    const buscar = async () => {
      const value = realizoSearch.trim();

      if (realizoSeleccionado) return;

      if (value.length < 2) {
        setEmpleadosRealizo([]);
        setShowRealizo(false);
        return;
      }

      try {
        setLoadingRealizo(true);
        const rows = await OrdenesTrabajoService.buscarEmpleados(value);
        setEmpleadosRealizo(rows);
        setShowRealizo(rows.length > 0);
      } catch {
        setEmpleadosRealizo([]);
        setShowRealizo(false);
      } finally {
        setLoadingRealizo(false);
      }
    };

    buscar();
  }, [realizoSearch, realizoSeleccionado]);

  useEffect(() => {
    const buscar = async () => {
      const value = tec2Search.trim();

      if (tec2Seleccionado) return;

      if (value.length < 2) {
        setEmpleadosTec2([]);
        setShowTec2(false);
        return;
      }

      try {
        setLoadingTec2(true);
        const rows = await OrdenesTrabajoService.buscarEmpleados(value);
        setEmpleadosTec2(rows);
        setShowTec2(rows.length > 0);
      } catch {
        setEmpleadosTec2([]);
        setShowTec2(false);
      } finally {
        setLoadingTec2(false);
      }
    };

    buscar();
  }, [tec2Search, tec2Seleccionado]);

  useEffect(() => {
    const buscar = async () => {
      const value = tec3Search.trim();

      if (tec3Seleccionado) return;

      if (value.length < 2) {
        setEmpleadosTec3([]);
        setShowTec3(false);
        return;
      }

      try {
        setLoadingTec3(true);
        const rows = await OrdenesTrabajoService.buscarEmpleados(value);
        setEmpleadosTec3(rows);
        setShowTec3(rows.length > 0);
      } catch {
        setEmpleadosTec3([]);
        setShowTec3(false);
      } finally {
        setLoadingTec3(false);
      }
    };

    buscar();
  }, [tec3Search, tec3Seleccionado]);

  useEffect(() => {
    const buscar = async () => {
      const value = revisoSearch.trim();

      if (revisoSeleccionado) return;

      if (value.length < 2) {
        setEmpleadosReviso([]);
        setShowReviso(false);
        return;
      }

      try {
        setLoadingReviso(true);
        const rows = await OrdenesTrabajoService.buscarEmpleados(value, true);
        setEmpleadosReviso(rows);
        setShowReviso(rows.length > 0);
      } catch {
        setEmpleadosReviso([]);
        setShowReviso(false);
      } finally {
        setLoadingReviso(false);
      }
    };

    buscar();
  }, [revisoSearch, revisoSeleccionado]);

  useEffect(() => {
    const buscar = async () => {
      const value = cssrSearch.trim();

      if (cssrSeleccionado) return;

      if (value.length < 2) {
        setCssrs([]);
        setShowCssrs(false);
        return;
      }

      try {
        setLoadingCssrs(true);
        const rows = await OrdenesTrabajoService.buscarCssrs(value);
        setCssrs(rows);
        setShowCssrs(rows.length > 0);
      } catch {
        setCssrs([]);
        setShowCssrs(false);
      } finally {
        setLoadingCssrs(false);
      }
    };

    buscar();
  }, [cssrSearch, cssrSeleccionado]);

  useEffect(() => {
    const buscar = async () => {
      const value = itemSearch.trim();

      if (activeRefIndex === null || value.length < 2) {
        setItems([]);
        setShowItems(false);
        return;
      }

      if (activeRefIndex >= 10) {
        setItems([]);
        setShowItems(false);
        return;
      }

      try {
        setLoadingItems(true);
        const rows = await OrdenesTrabajoService.buscarItems(value, "538");
        setItems(rows);
        setShowItems(rows.length > 0);
      } catch {
        setItems([]);
        setShowItems(false);
      } finally {
        setLoadingItems(false);
      }
    };

    buscar();
  }, [itemSearch, activeRefIndex]);

  const seleccionarCliente = (cliente: ClienteSAP) => {
    setForm((prev) => ({
      ...prev,
      codigoCliente: cliente.CardCode,
      nombreCliente: cliente.CardName,
      noSerie: "",
      marca: "",
      modelo: "",
      noEconomico: "",
      itemCode: "",
    }));

    setClienteSeleccionado(true);
    setEquipoSeleccionado(false);
    setClientes([]);
    setEquipos([]);
    setShowClientes(false);
    setShowEquipos(false);
  };

  const seleccionarEquipo = (equipo: EquipoSAP) => {
    setForm((prev) => ({
      ...prev,
      noSerie: equipo.CustomerEquipmentCards.ManufacturerSerialNum || "",
      marca: equipo.Manufacturers.ManufacturerName || "",
      modelo: equipo.Items.U_Modelo || "",
      noEconomico: equipo.CustomerEquipmentCards.U_NoEconomico || "",
      itemCode: equipo.CustomerEquipmentCards.ItemCode || "",
    }));

    setEquipoSeleccionado(true);
    setEquipos([]);
    setShowEquipos(false);
  };

  const seleccionarEmpleadoRealizo = (empleado: EmpleadoSAP) => {
    setForm((prev) => ({
      ...prev,
      realizoTrabajo: empleado.FullName,
      realizoTrabajoEmployeeID: String(empleado.EmployeeID),
      realizoTrabajoRoleID: empleado.RoleID ? String(empleado.RoleID) : "",
    }));

    setRealizoSeleccionado(true);
    setEmpleadosRealizo([]);
    setShowRealizo(false);
  };

  const seleccionarEmpleadoSimple = (
    key: "tecnico3" | "tecnico4" | "revisoTrabajo",
    empleado: EmpleadoSAP,
  ) => {
    const idKey =
      key === "tecnico3"
        ? "tecnico3EmployeeID"
        : key === "tecnico4"
          ? "tecnico4EmployeeID"
          : "revisoTrabajoEmployeeID";

    setForm((prev) => ({
      ...prev,
      [key]: empleado.FullName,
      [idKey]: String(empleado.EmployeeID),
    }));

    if (key === "tecnico3") {
      setTec2Seleccionado(true);
      setEmpleadosTec2([]);
      setShowTec2(false);
    }

    if (key === "tecnico4") {
      setTec3Seleccionado(true);
      setEmpleadosTec3([]);
      setShowTec3(false);
    }

    if (key === "revisoTrabajo") {
      setRevisoSeleccionado(true);
      setEmpleadosReviso([]);
      setShowReviso(false);
    }
  };

  const seleccionarCssr = (empleado: EmpleadoSAP) => {
    setForm((prev) => ({
      ...prev,
      nombreCssr: empleado.FullName,
    }));

    setCssrSeleccionado(true);
    setCssrs([]);
    setShowCssrs(false);
  };

  const refaccionesCapturadas = refacciones
    .map((ref, index) => ({
      ...ref,
      index,
    }))
    .filter(
      (ref) =>
        ref.cantidad.trim() || ref.numeroParte.trim() || ref.descripcion.trim(),
    );

  const refaccionesIncompletas = refaccionesCapturadas.filter(
    (ref) => !ref.cantidad.trim() || !ref.numeroParte.trim(),
  );

  if (refaccionesIncompletas.length > 0) {
    const filas = refaccionesIncompletas
      .map((ref) => `Refacción ${ref.index + 1}`)
      .join(", ");

    showWarning(
      "Refacciones incompletas",
      `Las siguientes refacciones tienen datos incompletos:\n\n${filas}\n\nDebes capturar cantidad y número de parte.`,
    );

    return false;
  }

  // Live check once start and end are captured, so the mistake is visible before saving
  const errorRangoFechas =
    form.fechaInicio && form.horaInicioTrabajo && form.fechaTermino && form.horaSalida
      ? validateDateTimeRange(form.fechaInicio, form.horaInicioTrabajo, form.fechaTermino, form.horaSalida)
      : null;

  const validateForm = () => {
    const faltantes = requiredFields
      .filter(
        (field) => !String(form[field.key as keyof FormState] || "").trim(),
      )
      .map((field) => field.label);

    if (faltantes.length > 0) {
      showWarning(
        "Campos incompletos",
        `Faltan los siguientes campos:\n\n${faltantes.join(", ")}`,
      );
      return false;
    }

    const dateError = validateDateTimeRange(
      form.fechaInicio,
      form.horaInicioTrabajo,
      form.fechaTermino,
      form.horaSalida,
    );

    if (dateError) {
      showWarning("Fechas inválidas", dateError);
      return false;
    }

    const roleId = Number(form.realizoTrabajoRoleID);

    if (Number.isNaN(roleId) || roleId !== -2) {
      showWarning(
        "Rol inválido",
        "El empleado seleccionado en 'Realizó Trabajo' no tiene el rol TÉCNICO.",
      );
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
        serie: form.serie,
        tecnico3: form.tecnico3EmployeeID,
        tecnico4: form.tecnico4EmployeeID,
        revisoTrabajo: form.revisoTrabajoEmployeeID,

        refacciones: refacciones.filter(
          (r) => r.cantidad || r.numeroParte || r.descripcion,
        ),

        "data-tipo": "ot",
      };

      await OrdenesTrabajoService.guardarCsv(payload);

      showSuccess(
        "Guardado exitoso",
        "La orden de trabajo se guardó correctamente.",
      );

      setForm(initialState);
      setRefacciones(emptyRefacciones);
      setClienteSeleccionado(false);
      setEquipoSeleccionado(false);
      setRealizoSeleccionado(false);
      setTec2Seleccionado(false);
      setTec3Seleccionado(false);
      setRevisoSeleccionado(false);
      setCssrSeleccionado(false);
    } catch (error: any) {
      showError("Error", error.message || "No se pudo guardar la OT.");
    } finally {
      setSaving(false);
    }
  };

  const refaccionesVisibles =
    form.tipoRefacciones === "1"
      ? refacciones.slice(0, 10)
      : form.tipoRefacciones === "0"
        ? refacciones.slice(10, 20)
        : refacciones;

  const refaccionOffset = form.tipoRefacciones === "0" ? 10 : 0;

  const renderDropdown = (
    show: boolean,
    children: ReactNode,
    maxHeight = 260,
  ) =>
    show ? (
      <Paper
        elevation={6}
        sx={{
          position: "absolute",
          zIndex: 30,
          width: "100%",
          maxHeight,
          overflowY: "auto",
          mt: 0.5,
        }}
      >
        {children}
      </Paper>
    ) : null;

  if (loading) {
    return <LoaderOverlay label="Cargando orden de trabajo..." />;
  }
  return (
    <Box>
      {saving && <LoaderOverlay label="Guardando orden de trabajo..." />}
      <PageHeader title="Crear OT" subtitle="Captura de Ordenes de Trabajo " />

      <Paper sx={{ p: 3 }}>
        <FieldRow label="Sucursal">
          {canChangeSucursal ? (
            <TextField
              select
              fullWidth
              value={form.serie}
              onChange={(e) => handleChange("serie", e.target.value)}
            >
              {SUCURSALES_SAP.map((sucursal) => (
                <MenuItem key={sucursal.value} value={sucursal.value}>
                   {sucursal.label}
                </MenuItem>
              ))}
            </TextField>
          ) : (
            <TextField
              fullWidth
              value={getSucursalLabel(form.serie)}
              InputProps={{ readOnly: true }}
            />
          )}
        </FieldRow>
        <FieldRow label="Folio">
          <TextField
            fullWidth
            type="number"
            value={form.folio}
            onChange={(e) => handleChange("folio", e.target.value)}
          />
        </FieldRow>

        <FieldRow label="Fecha Inicio">
          <CampoFecha value={form.fechaInicio} onChange={(iso) => handleChange("fechaInicio", iso)} />
        </FieldRow>

        <FieldRow label="Hora Inicio Trabajo">
          <TextField
            fullWidth
            type="time"
            InputLabelProps={{ shrink: true }}
            value={form.horaInicioTrabajo}
            onChange={(e) => handleChange("horaInicioTrabajo", e.target.value)}
          />
        </FieldRow>

        <FieldRow label="Tipo de Orden">
          <TextField
            select
            fullWidth
            value={form.tipoOrden}
            onChange={(e) => handleChange("tipoOrden", e.target.value)}
          >
            <MenuItem value="1">Daños</MenuItem>
            <MenuItem value="2">Especial</MenuItem>
            <MenuItem value="3">Preventivo Equipo</MenuItem>
            <MenuItem value="15">Correctivo</MenuItem>
            <MenuItem value="18">Preventivo Batería</MenuItem>
            <MenuItem value="19">Preventivo Cargador</MenuItem>
            <MenuItem value="20">Diagnóstico</MenuItem>
          </TextField>
        </FieldRow>

        <FieldRow label="Tipo de Problema">
          <TextField
            select
            fullWidth
            value={form.tipoProblema}
            onChange={(e) => handleChange("tipoProblema", e.target.value)}
            helperText="Opcional"
          >
            <MenuItem value="">Sin tipo de problema</MenuItem>

            {tiposProblema.map((tipo) => (
              <MenuItem
                key={tipo.ProblemTypeID}
                value={String(tipo.ProblemTypeID)}
              >
                {tipo.Name}
              </MenuItem>
            ))}
          </TextField>
        </FieldRow>

        <FieldRow label="Persona que Reporta">
          <TextField
            fullWidth
            value={form.personaReporta}
            onChange={(e) => handleChange("personaReporta", e.target.value)}
          />
        </FieldRow>

        <FieldRow label="Equipo en Funcionamiento">
          <RadioGroup
            row
            value={form.equipoFuncionamiento}
            onChange={(e) =>
              handleChange("equipoFuncionamiento", e.target.value)
            }
          >
            <FormControlLabel value="1" control={<Radio />} label="Sí" />
            <FormControlLabel value="0" control={<Radio />} label="No" />
          </RadioGroup>
        </FieldRow>

        <FieldRow label="Código de Cliente">
          <Box sx={{ position: "relative" }}>
            <TextField
              fullWidth
              placeholder="Buscar por código, nombre o alias"
              value={form.codigoCliente}
              onChange={(e) => {
                const value = e.target.value.toUpperCase();

                setClienteSeleccionado(false);
                setEquipoSeleccionado(false);

                handleChange("codigoCliente", value);
                handleChange("nombreCliente", "");

                handleChange("noSerie", "");
                handleChange("marca", "");
                handleChange("modelo", "");
                handleChange("noEconomico", "");
                handleChange("itemCode", "");

                if (!value.trim()) {
                  setClientes([]);
                  setShowClientes(false);
                }
              }}
              onFocus={() => {
                if (!clienteSeleccionado && clientes.length > 0) {
                  setShowClientes(true);
                }
              }}
            />

            {loadingClientes && (
              <CircularProgress
                size={22}
                sx={{ position: "absolute", right: 12, top: 16 }}
              />
            )}

            {renderDropdown(
              showClientes && clientes.length > 0,
              <List dense>
                {clientes.map((cliente) => (
                  <ListItemButton
                    key={cliente.CardCode}
                    onClick={() => seleccionarCliente(cliente)}
                  >
                    <ListItemText
                      primary={`${cliente.CardCode} - ${cliente.CardName}`}
                      secondary={cliente.CardForeignName || ""}
                    />
                  </ListItemButton>
                ))}
              </List>,
            )}
          </Box>
        </FieldRow>

        <FieldRow label="Nombre del Cliente">
          <TextField
            fullWidth
            value={form.nombreCliente}
            InputProps={{ readOnly: true }}
          />
        </FieldRow>

        <FieldRow label="No. de Serie / Económico / Modelo">
          <Box sx={{ position: "relative" }}>
            <TextField
              fullWidth
              value={form.noSerie}
              placeholder="Buscar por serie, económico o modelo"
              onChange={(e) => {
                const value = e.target.value.toUpperCase();

                setEquipoSeleccionado(false);

                handleChange("noSerie", value);
                handleChange("marca", "");
                handleChange("modelo", "");
                handleChange("noEconomico", "");
                handleChange("itemCode", "");

                if (!value.trim()) {
                  setEquipos([]);
                  setShowEquipos(false);
                }
              }}
              onFocus={() => {
                if (!equipoSeleccionado && equipos.length > 0) {
                  setShowEquipos(true);
                }
              }}
            />

            {loadingEquipos && (
              <CircularProgress
                size={22}
                sx={{ position: "absolute", right: 12, top: 16 }}
              />
            )}

            {renderDropdown(
              showEquipos && equipos.length > 0,
              <List dense>
                {equipos.map((equipo) => (
                  <ListItemButton
                    key={`${equipo.CustomerEquipmentCards.ManufacturerSerialNum}-${equipo.CustomerEquipmentCards.U_NoEconomico}`}
                    onClick={() => seleccionarEquipo(equipo)}
                  >
                    <ListItemText
                      primary={`${equipo.CustomerEquipmentCards.ManufacturerSerialNum || "SIN SERIE"} • ${equipo.Items.U_Modelo || "SIN MODELO"}`}
                      secondary={`Económico: ${equipo.CustomerEquipmentCards.U_NoEconomico || "N/A"}`}
                    />
                  </ListItemButton>
                ))}
              </List>,
            )}
          </Box>
        </FieldRow>

        <FieldRow label="Marca">
          <TextField
            fullWidth
            value={form.marca}
            InputProps={{ readOnly: true }}
          />
        </FieldRow>

        <FieldRow label="Modelo">
          <TextField
            fullWidth
            value={form.modelo}
            InputProps={{ readOnly: true }}
          />
        </FieldRow>

        <FieldRow label="Número Económico">
          <TextField
            fullWidth
            value={form.noEconomico}
            InputProps={{ readOnly: true }}
          />
        </FieldRow>

        <FieldRow label="Número de Artículo">
          <TextField
            fullWidth
            value={form.itemCode}
            InputProps={{ readOnly: true }}
          />
        </FieldRow>

        <FieldRow label="Horómetro">
          <TextField
            fullWidth
            type="number"
            value={form.horometro}
            onChange={(e) => handleChange("horometro", e.target.value)}
          />
        </FieldRow>

        <FieldRow label="Descripción de la Falla">
          <TextField
            fullWidth
            multiline
            rows={4}
            value={form.descripcionFalla}
            onChange={(e) => handleChange("descripcionFalla", e.target.value)}
          />
        </FieldRow>

        <FieldRow label="Trabajo Realizado">
          <TextField
            fullWidth
            multiline
            rows={4}
            value={form.trabajoRealizado}
            onChange={(e) => handleChange("trabajoRealizado", e.target.value)}
          />
        </FieldRow>

        <Box sx={{ mt: 3, mb: 2 }}>
          <FormLabel sx={{ fontWeight: 900 }}>Refacciones</FormLabel>
          <RadioGroup
            row
            value={form.tipoRefacciones}
            onChange={(e) => handleChange("tipoRefacciones", e.target.value)}
          >
            <FormControlLabel
              value="1"
              control={<Radio />}
              label="Instaladas"
            />
            <FormControlLabel
              value="0"
              control={<Radio />}
              label="Requeridas"
            />
            <FormControlLabel value="2" control={<Radio />} label="Ambas" />
          </RadioGroup>
        </Box>

        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography fontWeight={900} mb={2}>
            {form.tipoRefacciones === "1"
              ? "Refacciones Instaladas"
              : form.tipoRefacciones === "0"
                ? "Refacciones Requeridas"
                : "Refacciones Instaladas y Requeridas"}
          </Typography>

          {refaccionesVisibles.map((ref, index) => {
            const realIndex = index + refaccionOffset;

            const usaBusqueda =
              form.tipoRefacciones === "1"
                ? true
                : form.tipoRefacciones === "0"
                  ? false
                  : realIndex < 10;

            return (
              <Box
                key={realIndex}
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "120px 260px 1fr",
                  },
                  gap: 1.5,
                  mb: 1.5,
                  position: "relative",
                }}
              >
                <TextField
                  label={`Cantidad ${realIndex + 1}`}
                  type="number"
                  value={ref.cantidad}
                  onChange={(e) =>
                    handleRefaccionChange(realIndex, "cantidad", e.target.value)
                  }
                />

                <Box sx={{ position: "relative" }}>
                  <TextField
                    fullWidth
                    label="Número de Parte"
                    value={ref.numeroParte}
                    onFocus={() => {
                      if (usaBusqueda) {
                        setActiveRefIndex(realIndex);
                        if (items.length > 0) setShowItems(true);
                      } else {
                        setActiveRefIndex(null);
                        setShowItems(false);
                        setItems([]);
                      }
                    }}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();

                      handleRefaccionChange(realIndex, "numeroParte", value);

                      if (usaBusqueda) {
                        setActiveRefIndex(realIndex);
                        handleRefaccionChange(realIndex, "descripcion", "");
                      } else {
                        setActiveRefIndex(null);
                        setShowItems(false);
                        setItems([]);
                      }
                    }}
                  />

                  {usaBusqueda &&
                    loadingItems &&
                    activeRefIndex === realIndex && (
                      <CircularProgress
                        size={20}
                        sx={{ position: "absolute", right: 10, top: 17 }}
                      />
                    )}

                  {usaBusqueda &&
                    activeRefIndex === realIndex &&
                    renderDropdown(
                      showItems && items.length > 0,
                      <List dense>
                        {items.map((item) => (
                          <ListItemButton
                            key={item.ItemCode}
                            onClick={() => {
                              handleRefaccionChange(
                                realIndex,
                                "numeroParte",
                                item.ItemCode,
                              );
                              handleRefaccionChange(
                                realIndex,
                                "descripcion",
                                item.ItemName,
                              );

                              setItems([]);
                              setShowItems(false);
                              setActiveRefIndex(null);
                            }}
                          >
                            <ListItemText
                              primary={item.ItemCode}
                              secondary={item.ItemName}
                            />
                          </ListItemButton>
                        ))}
                      </List>,
                    )}
                </Box>

                <TextField
                  label="Descripción"
                  value={ref.descripcion}
                  onChange={(e) =>
                    handleRefaccionChange(
                      realIndex,
                      "descripcion",
                      e.target.value,
                    )
                  }
                />
              </Box>
            );
          })}
        </Paper>

        <FieldRow label="Fecha de Término">
          <CampoFecha
            value={form.fechaTermino}
            onChange={(iso) => handleChange("fechaTermino", iso)}
            error={errorRangoFechas}
          />
        </FieldRow>

        <FieldRow label="Hora de Salida">
          <TextField
            fullWidth
            type="time"
            InputLabelProps={{ shrink: true }}
            value={form.horaSalida}
            onChange={(e) => handleChange("horaSalida", e.target.value)}
            error={Boolean(errorRangoFechas)}
          />
        </FieldRow>

        <FieldRow label="Realizó Trabajo">
          <Box sx={{ position: "relative" }}>
            <TextField
              fullWidth
              value={form.realizoTrabajo}
              onChange={(e) => {
                const value = e.target.value.toUpperCase();

                setRealizoSeleccionado(false);

                handleChange("realizoTrabajo", value);
                handleChange("realizoTrabajoEmployeeID", "");
                handleChange("realizoTrabajoRoleID", "");

                if (!value.trim()) {
                  setEmpleadosRealizo([]);
                  setShowRealizo(false);
                }
              }}
              onFocus={() => {
                if (!realizoSeleccionado && empleadosRealizo.length > 0) {
                  setShowRealizo(true);
                }
              }}
            />

            {loadingRealizo && (
              <CircularProgress
                size={22}
                sx={{ position: "absolute", right: 12, top: 16 }}
              />
            )}

            {renderDropdown(
              showRealizo && empleadosRealizo.length > 0,
              <List dense>
                {empleadosRealizo.map((empleado) => (
                  <ListItemButton
                    key={empleado.EmployeeID}
                    onClick={() => seleccionarEmpleadoRealizo(empleado)}
                  >
                    <ListItemText
                      primary={`${empleado.FullName} (${empleado.EmployeeID})`}
                    />
                  </ListItemButton>
                ))}
              </List>,
            )}
          </Box>
        </FieldRow>

        <FieldRow label="Técnico 2 (opcional)">
          <Box sx={{ position: "relative" }}>
            <TextField
              fullWidth
              value={form.tecnico3}
              onChange={(e) => {
                const value = e.target.value.toUpperCase();

                setTec2Seleccionado(false);

                handleChange("tecnico3", value);
                handleChange("tecnico3EmployeeID", "");

                if (!value.trim()) {
                  setEmpleadosTec2([]);
                  setShowTec2(false);
                }
              }}
              onFocus={() => {
                if (!tec2Seleccionado && empleadosTec2.length > 0) {
                  setShowTec2(true);
                }
              }}
            />

            {loadingTec2 && (
              <CircularProgress
                size={22}
                sx={{ position: "absolute", right: 12, top: 16 }}
              />
            )}

            {renderDropdown(
              showTec2 && empleadosTec2.length > 0,
              <List dense>
                {empleadosTec2.map((empleado) => (
                  <ListItemButton
                    key={empleado.EmployeeID}
                    onClick={() =>
                      seleccionarEmpleadoSimple("tecnico3", empleado)
                    }
                  >
                    <ListItemText
                      primary={`${empleado.FullName} (${empleado.EmployeeID})`}
                    />
                  </ListItemButton>
                ))}
              </List>,
            )}
          </Box>
        </FieldRow>

        <FieldRow label="Técnico 3 (opcional)">
          <Box sx={{ position: "relative" }}>
            <TextField
              fullWidth
              value={form.tecnico4}
              onChange={(e) => {
                const value = e.target.value.toUpperCase();

                setTec3Seleccionado(false);

                handleChange("tecnico4", value);
                handleChange("tecnico4EmployeeID", "");

                if (!value.trim()) {
                  setEmpleadosTec3([]);
                  setShowTec3(false);
                }
              }}
              onFocus={() => {
                if (!tec3Seleccionado && empleadosTec3.length > 0) {
                  setShowTec3(true);
                }
              }}
            />

            {loadingTec3 && (
              <CircularProgress
                size={22}
                sx={{ position: "absolute", right: 12, top: 16 }}
              />
            )}

            {renderDropdown(
              showTec3 && empleadosTec3.length > 0,
              <List dense>
                {empleadosTec3.map((empleado) => (
                  <ListItemButton
                    key={empleado.EmployeeID}
                    onClick={() =>
                      seleccionarEmpleadoSimple("tecnico4", empleado)
                    }
                  >
                    <ListItemText
                      primary={`${empleado.FullName} (${empleado.EmployeeID})`}
                    />
                  </ListItemButton>
                ))}
              </List>,
            )}
          </Box>
        </FieldRow>

        <FieldRow label="Nombre de REV">
          <Box sx={{ position: "relative" }}>
            <TextField
              fullWidth
              value={form.nombreCssr}
              onChange={(e) => {
                const value = e.target.value.toUpperCase();

                setCssrSeleccionado(false);
                handleChange("nombreCssr", value);

                if (!value.trim()) {
                  setCssrs([]);
                  setShowCssrs(false);
                }
              }}
              onFocus={() => {
                if (!cssrSeleccionado && cssrs.length > 0) {
                  setShowCssrs(true);
                }
              }}
            />

            {loadingCssrs && (
              <CircularProgress
                size={22}
                sx={{ position: "absolute", right: 12, top: 16 }}
              />
            )}

            {renderDropdown(
              showCssrs && cssrs.length > 0,
              <List dense>
                {cssrs.map((empleado) => (
                  <ListItemButton
                    key={empleado.EmployeeID}
                    onClick={() => seleccionarCssr(empleado)}
                  >
                    <ListItemText
                      primary={`${empleado.FullName} (${empleado.EmployeeID})`}
                    />
                  </ListItemButton>
                ))}
              </List>,
            )}
          </Box>
        </FieldRow>

        <FieldRow label="Revisó Trabajo (opcional)">
          <Box sx={{ position: "relative" }}>
            <TextField
              fullWidth
              value={form.revisoTrabajo}
              onChange={(e) => {
                const value = e.target.value.toUpperCase();

                setRevisoSeleccionado(false);

                handleChange("revisoTrabajo", value);
                handleChange("revisoTrabajoEmployeeID", "");

                if (!value.trim()) {
                  setEmpleadosReviso([]);
                  setShowReviso(false);
                }
              }}
              onFocus={() => {
                if (!revisoSeleccionado && empleadosReviso.length > 0) {
                  setShowReviso(true);
                }
              }}
            />

            {loadingReviso && (
              <CircularProgress
                size={22}
                sx={{ position: "absolute", right: 12, top: 16 }}
              />
            )}

            {renderDropdown(
              showReviso && empleadosReviso.length > 0,
              <List dense>
                {empleadosReviso.map((empleado) => (
                  <ListItemButton
                    key={empleado.EmployeeID}
                    onClick={() =>
                      seleccionarEmpleadoSimple("revisoTrabajo", empleado)
                    }
                  >
                    <ListItemText
                      primary={`${empleado.FullName} (${empleado.EmployeeID})`}
                    />
                  </ListItemButton>
                ))}
              </List>,
            )}
          </Box>
        </FieldRow>

        <FieldRow label="Visto Bueno del Cliente">
          <TextField
            fullWidth
            value={form.vistoBuenoCliente}
            onChange={(e) => handleChange("vistoBuenoCliente", e.target.value)}
          />
        </FieldRow>

        <Box textAlign="right" mt={3}>
          <Button variant="contained" onClick={handleGuardar} disabled={saving}>
            {saving ? "Guardando..." : "Guardar OT"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
