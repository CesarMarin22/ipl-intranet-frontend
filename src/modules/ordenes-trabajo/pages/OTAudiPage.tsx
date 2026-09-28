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
import LoaderOverlay from "../../../shared/components/LoaderOverlay";
import CampoFecha from "../../../shared/components/CampoFecha";
import { me } from "../../../services/auth";
import { useDebouncedValue } from "../../../shared/hooks/useDebouncedValue";
import {
  diaMesDesdeIso,
  formatDateForSAP,
  validateDateTimeRange,
  validateSingleDateTime,
} from "../../../shared/utils/dateUtils";
import {
  showError,
  showSuccess,
  showWarning,
} from "../../../shared/utils/swal";
import {
  OrdenesTrabajoService,
  type EmpleadoSAP,
  type EquipoSAP,
  type ItemSAP,
  type TipoProblemaSAP,
} from "../../../services/ordenesTrabajo";

import {
  AUDI_CLIENTE,
  AUDI_TIPOS_ORDEN,
  AUDI_TIPOS_PROBLEMA_PERMITIDOS,
  getAudiOptionsByDefecto,
} from "../../../shared/utils/audiCatalog";

type Refaccion = {
  cantidad: string;
  numeroParte: string;
  descripcion: string;
};

type FormState = {
  tipoCapturaAudi: string;

  folioEx: string;
  folio: string;
  ordenBase: string;

  fechaInicio: string;
  horaInicioTrabajo: string;
  fechaTermino: string;
  horaSalida: string;

  tipoOrdenAudi: string;
  tipoOrden: string;

  tipoProblema: string;
  causa: string;
  tipoDanio: string;

  personaReporta: string;
  equipoFuncionamiento: string;

  codigoCliente: string;
  nombreCliente: string;
  serie: string;

  noSerie: string;
  marca: string;
  modelo: string;
  noEconomico: string;
  itemCode: string;
  horometro: string;

  descripcionFalla: string;
  trabajoRealizado: string;
  tipoRefacciones: string;

  realizoTrabajo: string;
  realizoTrabajoEmployeeID: string;
  realizoTrabajoRoleID: string;

  tecnico3: string;
  tecnico3EmployeeID: string;

  tecnico4: string;
  tecnico4EmployeeID: string;

  NumPersonas: string;
  horasTrabajadas: string;

  nombreCssr: string;

  revisoTrabajo: string;
  revisoTrabajoEmployeeID: string;

  vistoBuenoCliente: string;
};

const initialState: FormState = {
  tipoCapturaAudi: "INGRESO",

  folioEx: "",
  folio: "",
  ordenBase: "B",

  fechaInicio: "",
  horaInicioTrabajo: "",
  fechaTermino: "",
  horaSalida: "",

  tipoOrdenAudi: "",
  tipoOrden: "",

  tipoProblema: "",
  causa: "",
  tipoDanio: "",

  personaReporta: "",
  equipoFuncionamiento: "",

  codigoCliente: AUDI_CLIENTE.codigoCliente,
  nombreCliente: AUDI_CLIENTE.nombreCliente,
  serie: AUDI_CLIENTE.serie,

  noSerie: "",
  marca: "",
  modelo: "",
  noEconomico: "",
  itemCode: "",
  horometro: "",

  descripcionFalla: "",
  trabajoRealizado: "",
  tipoRefacciones: "1",

  realizoTrabajo: "",
  realizoTrabajoEmployeeID: "",
  realizoTrabajoRoleID: "",

  tecnico3: "",
  tecnico3EmployeeID: "",

  tecnico4: "",
  tecnico4EmployeeID: "",

  NumPersonas: "",
  horasTrabajadas: "",

  nombreCssr: "",

  revisoTrabajo: "",
  revisoTrabajoEmployeeID: "",

  vistoBuenoCliente: AUDI_CLIENTE.vistoBuenoCliente,
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

const sinPrefijo = (codigo: string) => codigo.replace(/^[A-Z]+:/, "");

// fechaInicio + horaInicio + horas trabajadas, like OTA's calcularTermino
function calcularTermino(fechaIso: string, hora: string, horas: string) {
  const cantidad = Number(horas);
  if (!fechaIso || !/^\d{2}:\d{2}$/.test(hora) || !cantidad || cantidad <= 0) return null;
  const inicio = new Date(`${fechaIso}T${hora}`);
  if (Number.isNaN(inicio.getTime())) return null;
  const fin = new Date(inicio.getTime() + cantidad * 60 * 60 * 1000);
  const dos = (n: number) => String(n).padStart(2, "0");
  return {
    fecha: `${fin.getFullYear()}-${dos(fin.getMonth() + 1)}-${dos(fin.getDate())}`,
    hora: `${dos(fin.getHours())}:${dos(fin.getMinutes())}`,
  };
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

export default function OTAudiPage() {
  const [form, setForm] = useState<FormState>(initialState);
  const [refacciones, setRefacciones] = useState<Refaccion[]>(emptyRefacciones);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [usuarioCreacion, setUsuarioCreacion] = useState("");

  const [equipos, setEquipos] = useState<EquipoSAP[]>([]);
  const [empleadosRealizo, setEmpleadosRealizo] = useState<EmpleadoSAP[]>([]);
  const [empleadosTec2, setEmpleadosTec2] = useState<EmpleadoSAP[]>([]);
  const [empleadosTec3, setEmpleadosTec3] = useState<EmpleadoSAP[]>([]);
  const [empleadosReviso, setEmpleadosReviso] = useState<EmpleadoSAP[]>([]);
  const [tiposProblema, setTiposProblema] = useState<TipoProblemaSAP[]>([]);
  const [items, setItems] = useState<ItemSAP[]>([]);
  const [cssrs, setCssrs] = useState<EmpleadoSAP[]>([]);

  const [showEquipos, setShowEquipos] = useState(false);
  const [showRealizo, setShowRealizo] = useState(false);
  const [showTec2, setShowTec2] = useState(false);
  const [showTec3, setShowTec3] = useState(false);
  const [showReviso, setShowReviso] = useState(false);
  const [showItems, setShowItems] = useState(false);
  const [showCssrs, setShowCssrs] = useState(false);

  const [loadingEquipos, setLoadingEquipos] = useState(false);
  const [loadingRealizo, setLoadingRealizo] = useState(false);
  const [loadingTec2, setLoadingTec2] = useState(false);
  const [loadingTec3, setLoadingTec3] = useState(false);
  const [loadingReviso, setLoadingReviso] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingCssrs, setLoadingCssrs] = useState(false);

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

  const cssrSearch = useDebouncedValue(form.nombreCssr, 500);
  const equipoSearch = useDebouncedValue(form.noSerie, 500);
  const realizoSearch = useDebouncedValue(form.realizoTrabajo, 500);
  const tec2Search = useDebouncedValue(form.tecnico3, 500);
  const tec3Search = useDebouncedValue(form.tecnico4, 500);
  const revisoSearch = useDebouncedValue(form.revisoTrabajo, 500);
  const itemSearch = useDebouncedValue(activeRefSearch, 500);

  const isIngreso = form.tipoCapturaAudi === "INGRESO";
  const isReporte = form.tipoCapturaAudi === "REPORTE";

  // Live checks so wrong dates are visible before saving
  const errorFechaIngreso =
    form.fechaInicio && form.horaInicioTrabajo
      ? validateSingleDateTime(form.fechaInicio, form.horaInicioTrabajo)
      : null;
  const errorRangoFechas =
    form.fechaInicio && form.horaInicioTrabajo && form.fechaTermino && form.horaSalida
      ? validateDateTimeRange(form.fechaInicio, form.horaInicioTrabajo, form.fechaTermino, form.horaSalida)
      : null;

  const audiOptions = useMemo(
    () => getAudiOptionsByDefecto(form.tipoProblema),
    [form.tipoProblema],
  );

  // End date/time are not typed: OTA derives them from start + hours worked
  useEffect(() => {
    if (!isReporte) return;
    const termino = calcularTermino(form.fechaInicio, form.horaInicioTrabajo, form.horasTrabajadas);
    setForm((prev) => ({ ...prev, fechaTermino: termino?.fecha || "", horaSalida: termino?.hora || "" }));
  }, [isReporte, form.fechaInicio, form.horaInicioTrabajo, form.horasTrabajadas]);

  const requiredFields = useMemo(() => {
    // Same as OTA: every visible field except Técnico 2/3, Revisó trabajo, Número económico, Modelo
    // and Equipo en funcionamiento. Marca / Número de artículo force picking the equipment from the list.
    const base = [
      { key: "folioEx", label: "Número de aviso" },
      {
        key: "fechaInicio",
        label: isIngreso
          ? "Fecha de llegada al taller"
          : "Fecha de inicio de trabajo",
      },
      {
        key: "horaInicioTrabajo",
        label: isIngreso
          ? "Hora de llegada al taller"
          : "Hora de inicio de trabajo",
      },
      { key: "tipoOrdenAudi", label: "Tipo de orden" },
      { key: "personaReporta", label: "Persona que reporta" },
      { key: "noSerie", label: "No. de serie" },
      { key: "marca", label: "Marca (elige el equipo de la lista)" },
      { key: "itemCode", label: "Número de artículo (elige el equipo de la lista)" },
      { key: "descripcionFalla", label: "Descripción de la falla" },
      { key: "trabajoRealizado", label: "Trabajo realizado" },
      { key: "realizoTrabajo", label: "Realizó trabajo" },
      { key: "nombreCssr", label: "Nombre de REV" },
      { key: "vistoBuenoCliente", label: "Visto bueno del cliente" },
    ];

    if (isIngreso) {
      return [...base, { key: "horometro", label: "Horómetro" }];
    }

    if (isReporte) {
      return [
        ...base,
        { key: "folio", label: "Folio físico" },
        { key: "tipoProblema", label: "Defecto" },
        { key: "causa", label: "Causa" },
        { key: "tipoDanio", label: "Tipo de daño" },
        { key: "NumPersonas", label: "Número de personas que trabajaron" },
        { key: "horasTrabajadas", label: "Horas trabajadas" },
      ];
    }

    return base;
  }, [isIngreso, isReporte]);

  const handleChange = (key: keyof FormState, value: string) => {
    const rawFields: (keyof FormState)[] = [
      "fechaInicio",
      "horaInicioTrabajo",
      "fechaTermino",
      "horaSalida",
      "tipoOrden",
      "tipoOrdenAudi",
      "ordenBase",
      "tipoProblema",
      "tipoCapturaAudi",
      "equipoFuncionamiento",
      "tipoRefacciones",
      "realizoTrabajoEmployeeID",
      "realizoTrabajoRoleID",
      "tecnico3EmployeeID",
      "tecnico4EmployeeID",
      "revisoTrabajoEmployeeID",
      "serie",
    ];

    const textareaFields: (keyof FormState)[] = [
      "descripcionFalla",
      "trabajoRealizado",
    ];

    const nextValue = rawFields.includes(key)
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
    const init = async () => {
      me()
        .then((usuario) => setUsuarioCreacion(usuario.username || ""))
        .catch(() => setUsuarioCreacion(""));
      try {
        const tipos = await OrdenesTrabajoService.tiposProblema();

        setTiposProblema(
          tipos.filter((tipo) =>
            AUDI_TIPOS_PROBLEMA_PERMITIDOS.includes(String(tipo.ProblemTypeID)),
          ),
        );
      } catch {
        setTiposProblema([]);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (isIngreso) {
      setForm((prev) => ({
        ...prev,
        ordenBase: "B",
        folio: "",
        tipoProblema: "",
        causa: "",
        tipoDanio: "",
        fechaTermino: "",
        horaSalida: "",
        NumPersonas: "",
        horasTrabajadas: "",
        tecnico3: "",
        tecnico3EmployeeID: "",
        tecnico4: "",
        tecnico4EmployeeID: "",
      }));
      setRefacciones(emptyRefacciones);
    }

    if (isReporte) {
      setForm((prev) => ({
        ...prev,
        ordenBase: "N",
        horometro: "",
      }));
    }
  }, [isIngreso, isReporte]);

  useEffect(() => {
    const buscar = async () => {
      const value = equipoSearch.trim();

      if (equipoSeleccionado) return;

      if (value.length < 1) {
        setEquipos([]);
        setShowEquipos(false);
        return;
      }

      try {
        setLoadingEquipos(true);
        const rows = await OrdenesTrabajoService.buscarEquiposCliente(
          AUDI_CLIENTE.codigoCliente,
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
  }, [equipoSearch, equipoSeleccionado]);

  useEffect(() => {
    const buscar = async () => {
      const value = realizoSearch.trim();

      if (realizoSeleccionado) return;

      if (value.length < 1) {
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

      if (!isReporte || tec2Seleccionado) return;

      if (value.length < 1) {
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
  }, [tec2Search, tec2Seleccionado, isReporte]);

  useEffect(() => {
    const buscar = async () => {
      const value = tec3Search.trim();

      if (!isReporte || tec3Seleccionado) return;

      if (value.length < 1) {
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
  }, [tec3Search, tec3Seleccionado, isReporte]);

  useEffect(() => {
    const buscar = async () => {
      const value = revisoSearch.trim();

      if (revisoSeleccionado) return;

      if (value.length < 1) {
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
      const value = itemSearch.trim();

      if (!isReporte || activeRefIndex === null || value.length < 1) {
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
  }, [itemSearch, activeRefIndex, isReporte]);

  useEffect(() => {
    const buscar = async () => {
      const value = cssrSearch.trim();

      if (cssrSeleccionado) return;

      if (value.length < 1) {
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

  const seleccionarCssr = (empleado: EmpleadoSAP) => {
    setForm((prev) => ({
      ...prev,
      nombreCssr: empleado.FullName,
    }));

    setCssrSeleccionado(true);
    setCssrs([]);
    setShowCssrs(false);
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

  const validateForm = () => {
    const faltantes = requiredFields
      .filter(
        (field) => !String(form[field.key as keyof FormState] || "").trim(),
      )
      .map((field) => field.label);

    if (faltantes.length > 0) {
      showWarning(
        `Por favor, completa los siguientes campos: ${faltantes.join(", ")}`,
        "Campos incompletos en OT Audi",
      );
      return false;
    }

    if (isIngreso) {
      const singleDateError = validateSingleDateTime(
        form.fechaInicio,
        form.horaInicioTrabajo,
      );

      if (singleDateError) {
        showWarning(singleDateError, "Fecha inválida");
        return false;
      }
    }

    if (isReporte) {
      const dateError = validateDateTimeRange(
        form.fechaInicio,
        form.horaInicioTrabajo,
        form.fechaTermino,
        form.horaSalida,
      );

      if (dateError) {
        showWarning(dateError, "Fechas inválidas");
        return false;
      }
    }

    // OTA does not check the TÉCNICO role for Audi, but the employee must come from the list
    // so TechnicianCode is filled
    if (!form.realizoTrabajoEmployeeID) {
      showWarning(
        "Selecciona de la lista al empleado que realizó el trabajo.",
        "Realizó trabajo",
      );
      return false;
    }

    if (isReporte) {
      const numPersonas = Number(form.NumPersonas);
      const horas = Number(form.horasTrabajadas);

      if (!Number.isInteger(numPersonas) || numPersonas <= 0) {
        showWarning("El número de personas debe ser un número entero mayor a 0.", "Dato inválido");
        return false;
      }

      if (Number.isNaN(horas) || horas <= 0 || !Number.isInteger(horas * 2)) {
        showWarning("Las horas trabajadas deben ser mayores a 0 y en múltiplos de media hora (0.5).", "Dato inválido");
        return false;
      }

      const refaccionesCapturadas = refacciones
        .map((ref, index) => ({ ...ref, index }))
        .filter(
          (ref) =>
            ref.cantidad.trim() ||
            ref.numeroParte.trim() ||
            ref.descripcion.trim(),
        );

      const refaccionesIncompletas = refaccionesCapturadas.filter(
        (ref) => !ref.cantidad.trim() || !ref.numeroParte.trim(),
      );

      if (refaccionesIncompletas.length > 0) {
        const filas = refaccionesIncompletas
          .map((ref) => `REFACCION ${ref.index + 1}`)
          .join(", ");

        showWarning(
          `Las siguientes refacciones tienen datos incompletos:\n\n${filas}\n\nDebes capturar cantidad y número de parte.`,
          "Refacciones incompletas",
        );
        return false;
      }
    }

    return true;
  };

  const handleGuardar = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      const payload = {
        ...form,

        // Same columns OTA writes: CustomerRefNo = folio físico, U_A_Orden = ZPM code, U_A_FolioE = número de aviso
        folio: isIngreso ? "" : form.folio,
        U_A_Orden: form.tipoOrdenAudi,

        codigoCliente: AUDI_CLIENTE.codigoCliente,
        nombreCliente: AUDI_CLIENTE.nombreCliente,
        serie: AUDI_CLIENTE.serie,

        ordenBase: isIngreso ? "B" : "N",

        fechaInicio: formatDateForSAP(form.fechaInicio),
        fechaTermino: isIngreso ? "" : formatDateForSAP(form.fechaTermino),
        horaSalida: isIngreso ? "" : form.horaSalida,

        tipoProblema: isIngreso ? "" : form.tipoProblema,
        // SAP stores causa / tipo de daño without the catalog prefix ("E:FRENO" -> "FRENO"), as OTA did
        causa: isIngreso ? "" : sinPrefijo(form.causa),
        tipoDanio: isIngreso ? "" : sinPrefijo(form.tipoDanio),

        horometro: isIngreso ? form.horometro : "",

        // TechnicianCode goes by realizoTrabajoEmployeeID; U_Tecnico2/3/4 hold the names, as in OTA
        realizoTrabajo: form.realizoTrabajoEmployeeID,
        tecnico3: isIngreso ? "" : form.tecnico3,
        tecnico4: isIngreso ? "" : form.tecnico4,
        revisoTrabajo: form.revisoTrabajo,

        NumPersonas: isIngreso ? "" : form.NumPersonas,
        horasTrabajadas: isIngreso ? "" : form.horasTrabajadas,

        nombreCssr: form.nombreCssr,
        vistoBuenoCliente: AUDI_CLIENTE.vistoBuenoCliente,

        // All 20 rows keep their position: rows 11-20 are "Requeridas" and map to U_Code11-20
        refacciones: isIngreso ? [] : refacciones,

        "data-tipo": "audi",
      };

      await OrdenesTrabajoService.guardarCsv(payload);

      showSuccess("La OT Audi se guardó correctamente.", "Guardado exitoso");
      setForm(initialState);
      setRefacciones(emptyRefacciones);
    } catch (error: any) {
      showError(error.message || "No se pudo guardar la OT Audi.", "Error");
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

  const renderDropdown = (show: boolean, children: ReactNode) =>
    show ? (
      <Paper
        elevation={6}
        sx={{
          position: "absolute",
          zIndex: 30,
          width: "100%",
          maxHeight: 260,
          overflowY: "auto",
          mt: 0.5,
        }}
      >
        {children}
      </Paper>
    ) : null;

  if (loading) {
    return <LoaderOverlay label="Cargando OT Audi..." />;
  }

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "1600px",
        mx: "auto",
        px: { xs: 2, md: 3 },
      }}
    >
      {saving && <LoaderOverlay label="Guardando OT Audi..." />}

      <PageHeader
        title="Crear OT Audi"
        subtitle="Captura de Ordenes de Trabajo de Audi"
      />

      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
        <FieldRow label="Usuario de creación de OT">
          <TextField fullWidth value={usuarioCreacion} InputProps={{ readOnly: true }} />
        </FieldRow>
        <FieldRow label="Serie">
          <TextField
            fullWidth
            value={`${AUDI_CLIENTE.serieNombre}`}
            InputProps={{ readOnly: true }}
          />
        </FieldRow>
        <FieldRow label="¿Qué tipo de orden es?">
          <RadioGroup
            row
            value={form.tipoCapturaAudi}
            onChange={(e) => {
              const value = e.target.value;
              handleChange("tipoCapturaAudi", value);
              handleChange("ordenBase", value === "REPORTE" ? "N" : "B");
            }}
          >
            <FormControlLabel value="INGRESO" control={<Radio />} label="Ingreso" />
            <FormControlLabel value="REPORTE" control={<Radio />} label="Reporte de Trabajo" />
          </RadioGroup>
        </FieldRow>

        {form.tipoCapturaAudi && (
          <>
            {isReporte && (
              <FieldRow label="Folio físico">
                <TextField
                  fullWidth
                  value={form.folio}
                  onChange={(e) => handleChange("folio", e.target.value)}
                />
              </FieldRow>
            )}

            <FieldRow label="Número de aviso">
              <TextField
                fullWidth
                value={form.folioEx}
                onChange={(e) => handleChange("folioEx", e.target.value)}
              />
            </FieldRow>

            <FieldRow
              label={
                isIngreso
                  ? "Fecha de llegada al taller"
                  : "Fecha de inicio de trabajo"
              }
            >
              <CampoFecha
                value={form.fechaInicio}
                onChange={(iso) => handleChange("fechaInicio", iso)}
                error={isIngreso ? errorFechaIngreso : null}
              />
            </FieldRow>

            <FieldRow
              label={
                isIngreso
                  ? "Hora de llegada al taller"
                  : "Hora de inicio de trabajo"
              }
            >
              <TextField
                fullWidth
                type="time"
                InputLabelProps={{ shrink: true }}
                value={form.horaInicioTrabajo}
                onChange={(e) =>
                  handleChange("horaInicioTrabajo", e.target.value)
                }
              />
            </FieldRow>

            <FieldRow label="Tipo de orden">
              <TextField
                select
                fullWidth
                value={form.tipoOrdenAudi}
                onChange={(e) => {
                  const selected = AUDI_TIPOS_ORDEN.find(
                    (tipo) => tipo.value === e.target.value,
                  );

                  handleChange("tipoOrdenAudi", e.target.value);
                  handleChange("tipoOrden", selected?.callType || "");
                }}
              >
                {AUDI_TIPOS_ORDEN.map((tipo) => (
                  <MenuItem key={tipo.value} value={tipo.value}>
                    {tipo.label.charAt(0) + tipo.label.slice(1).toLowerCase()}
                  </MenuItem>
                ))}
              </TextField>
            </FieldRow>

            {isReporte && (
              <>
                <FieldRow label="Defecto">
                  <TextField
                    select
                    fullWidth
                    value={form.tipoProblema}
                    onChange={(e) => {
                      handleChange("tipoProblema", e.target.value);
                      handleChange("causa", "");
                      handleChange("tipoDanio", "");
                    }}
                  >
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

                <FieldRow label="Causas">
                  <TextField
                    select
                    fullWidth
                    value={form.causa}
                    onChange={(e) => handleChange("causa", e.target.value)}
                    disabled={!form.tipoProblema}
                  >
                    {audiOptions.causas.map((item) => (
                      <MenuItem key={item.code} value={item.code}>
                        {item.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </FieldRow>

                <FieldRow label="Tipo de daño">
                  <TextField
                    select
                    fullWidth
                    value={form.tipoDanio}
                    onChange={(e) => handleChange("tipoDanio", e.target.value)}
                    disabled={!form.tipoProblema}
                  >
                    {audiOptions.tiposDanio.map((item) => (
                      <MenuItem key={item.code} value={item.code}>
                        {item.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </FieldRow>
              </>
            )}

            <FieldRow label="Persona que reporta">
              <TextField
                fullWidth
                value={form.personaReporta}
                onChange={(e) => handleChange("personaReporta", e.target.value)}
              />
            </FieldRow>

            <FieldRow label="Equipo en funcionamiento">
              <RadioGroup
                row
                value={form.equipoFuncionamiento}
                onChange={(e) =>
                  handleChange("equipoFuncionamiento", e.target.value)
                }
              >
                <FormControlLabel value="1" control={<Radio />} label="SI" />
                <FormControlLabel value="0" control={<Radio />} label="NO" />
              </RadioGroup>
            </FieldRow>

            <FieldRow label="Código del cliente">
              <TextField
                fullWidth
                value={AUDI_CLIENTE.codigoCliente}
                InputProps={{ readOnly: true }}
              />
            </FieldRow>

            <FieldRow label="Nombre del cliente">
              <TextField
                fullWidth
                value={AUDI_CLIENTE.nombreCliente}
                InputProps={{ readOnly: true }}
              />
            </FieldRow>

            <FieldRow label="No. de serie">
              <Box sx={{ position: "relative" }}>
                <TextField
                  fullWidth
                  value={form.noSerie}
                  placeholder="Buscar por serie, económico o modelo"
                  onChange={(e) => {
                    const value = normalizeInput(e.target.value);

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
                          secondary={`ECONOMICO: ${equipo.CustomerEquipmentCards.U_NoEconomico || "N/A"}`}
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

            <FieldRow label="Número económico">
              <TextField
                fullWidth
                value={form.noEconomico}
                InputProps={{ readOnly: true }}
              />
            </FieldRow>

            <FieldRow label="Número de artículo">
              <TextField
                fullWidth
                value={form.itemCode}
                InputProps={{ readOnly: true }}
              />
            </FieldRow>

            {isIngreso && (
              <FieldRow label="Horómetro">
                <TextField
                  fullWidth
                  type="number"
                  value={form.horometro}
                  onChange={(e) => handleChange("horometro", e.target.value)}
                />
              </FieldRow>
            )}

            <FieldRow label="Descripción de la falla">
              <TextField
                fullWidth
                multiline
                rows={4}
                value={form.descripcionFalla}
                onChange={(e) =>
                  handleChange("descripcionFalla", e.target.value)
                }
              />
            </FieldRow>

            <FieldRow
              label={
                "Trabajo realizado"
              }
            >
              <TextField
                fullWidth
                multiline
                rows={4}
                value={form.trabajoRealizado}
                onChange={(e) =>
                  handleChange("trabajoRealizado", e.target.value)
                }
              />
            </FieldRow>

            {isReporte && (
              <>
                <Box sx={{ mt: 3, mb: 2 }}>
                  <FormLabel sx={{ fontWeight: 900 }}>Refacciones</FormLabel>
                  <RadioGroup
                    row
                    value={form.tipoRefacciones}
                    onChange={(e) =>
                      handleChange("tipoRefacciones", e.target.value)
                    }
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
                    <FormControlLabel
                      value="2"
                      control={<Radio />}
                      label="Ambas"
                    />
                  </RadioGroup>
                </Box>

                <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                  {refaccionesVisibles.map((ref, index) => {
                    const realIndex = index + refaccionOffset;

                    // In OTA every row (installed and required) searches the item catalog
                    const usaBusqueda = true;

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
                            handleRefaccionChange(
                              realIndex,
                              "cantidad",
                              e.target.value,
                            )
                          }
                        />

                        <Box sx={{ position: "relative" }}>
                          <TextField
                            fullWidth
                            label="Número de parte"
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
                              const value = normalizeInput(e.target.value);

                              handleRefaccionChange(
                                realIndex,
                                "numeroParte",
                                value,
                              );

                              if (usaBusqueda) {
                                setActiveRefIndex(realIndex);
                                handleRefaccionChange(
                                  realIndex,
                                  "descripcion",
                                  "",
                                );
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
                                sx={{
                                  position: "absolute",
                                  right: 10,
                                  top: 17,
                                }}
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
                          InputProps={{ readOnly: true }}
                          helperText={ref.numeroParte && !ref.descripcion ? "Elige el número de parte de la lista" : " "}
                        />
                      </Box>
                    );
                  })}
                </Paper>

                <FieldRow label="Número de personas que trabajaron">
                  <TextField
                    fullWidth
                    type="number"
                    value={form.NumPersonas}
                    onChange={(e) =>
                      handleChange("NumPersonas", e.target.value)
                    }
                  />
                </FieldRow>

                <FieldRow label="Horas trabajadas">
                  <TextField
                    fullWidth
                    type="number"
                    value={form.horasTrabajadas}
                    onChange={(e) =>
                      handleChange("horasTrabajadas", e.target.value)
                    }
                    slotProps={{ htmlInput: { min: 0.5, step: 0.5 } }}
                    helperText="En múltiplos de media hora, por ejemplo 1.5"
                  />
                </FieldRow>

                <FieldRow label="Fecha de término de trabajo">
                  <TextField
                    fullWidth
                    value={form.fechaTermino ? `${diaMesDesdeIso(form.fechaTermino)}/${form.fechaTermino.slice(0, 4)}` : ""}
                    placeholder="Se calcula automáticamente"
                    InputProps={{ readOnly: true }}
                    error={Boolean(errorRangoFechas)}
                    helperText={errorRangoFechas || "Hora de inicio + horas trabajadas"}
                  />
                </FieldRow>

                <FieldRow label="Hora de término de trabajo">
                  <TextField
                    fullWidth
                    value={form.horaSalida}
                    placeholder="Se calcula automáticamente"
                    InputProps={{ readOnly: true }}
                    error={Boolean(errorRangoFechas)}
                  />
                </FieldRow>
              </>
            )}

            <FieldRow label="Realizó trabajo">
              <Box sx={{ position: "relative" }}>
                <TextField
                  fullWidth
                  value={form.realizoTrabajo}
                  onChange={(e) => {
                    const value = normalizeInput(e.target.value);

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

            {isReporte && (
              <>
                <FieldRow label="Técnico 2 (opcional)">
                  <Box sx={{ position: "relative" }}>
                    <TextField
                      fullWidth
                      value={form.tecnico3}
                      onChange={(e) => {
                        const value = normalizeInput(e.target.value);

                        setTec2Seleccionado(false);
                        handleChange("tecnico3", value);
                        handleChange("tecnico3EmployeeID", "");

                        if (!value.trim()) {
                          setEmpleadosTec2([]);
                          setShowTec2(false);
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
                        const value = normalizeInput(e.target.value);

                        setTec3Seleccionado(false);
                        handleChange("tecnico4", value);
                        handleChange("tecnico4EmployeeID", "");

                        if (!value.trim()) {
                          setEmpleadosTec3([]);
                          setShowTec3(false);
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
              </>
            )}

            <FieldRow label="Nombre de REV">
              <Box sx={{ position: "relative" }}>
                <TextField
                  fullWidth
                  value={form.nombreCssr}
                  onChange={(e) => {
                    const value = normalizeInput(e.target.value);

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
                    sx={{
                      position: "absolute",
                      right: 12,
                      top: 16,
                    }}
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

            <FieldRow label="Revisó trabajo (opcional)">
              <Box sx={{ position: "relative" }}>
                <TextField
                  fullWidth
                  value={form.revisoTrabajo}
                  onChange={(e) => {
                    const value = normalizeInput(e.target.value);

                    setRevisoSeleccionado(false);
                    handleChange("revisoTrabajo", value);
                    handleChange("revisoTrabajoEmployeeID", "");

                    if (!value.trim()) {
                      setEmpleadosReviso([]);
                      setShowReviso(false);
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

            <FieldRow label="Visto bueno del cliente">
              <TextField
                fullWidth
                value={form.vistoBuenoCliente}
                InputProps={{ readOnly: true }}
              />
            </FieldRow>

            <Box textAlign="right" mt={3}>
              <Button
                variant="contained"
                onClick={handleGuardar}
                disabled={saving}
              >
                {saving ? "Guardando..." : "Guardar OT Audi"}
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}
