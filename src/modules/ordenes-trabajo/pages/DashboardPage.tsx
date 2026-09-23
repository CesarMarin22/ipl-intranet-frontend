import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  InputAdornment,
  LinearProgress,
  Menu,
  MenuItem,
  Pagination,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AssignmentIcon from "@mui/icons-material/Assignment";
import SecurityIcon from "@mui/icons-material/Security";
import GavelIcon from "@mui/icons-material/Gavel";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import SearchIcon from "@mui/icons-material/Search";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";

import PageHeader from "../../../shared/components/PageHeader";
import { OrdenesTrabajoService } from "../../../services/ordenesTrabajo";
import { me } from "../../../services/auth";
import LoaderOverlay from "../../../shared/components/LoaderOverlay";
import { showError } from "../../../shared/utils/swal";
import { usePermissions } from "../../../shared/hooks/usePermissions";

// What each record type needs: VER to list it on the dashboard, CREAR to show it under "+ Nuevo"
const TIPOS_REGISTRO = [
  { tipo: "seguridad", label: "Flash Report", modulo: "OT_SEGURIDAD", ruta: "/ordenes-trabajo/seguridad" },
  { tipo: "normal", label: "Orden de Trabajo", modulo: "OT_NORMAL", ruta: "/ordenes-trabajo/normal" },
  { tipo: "audi", label: "OT Audi", modulo: "OT_AUDI", ruta: "/ordenes-trabajo/audi" },
] as const;

const POR_PAGINA = 10;

const ESTATUS_COLOR: Record<string, string> = {
  Abierto: "#9e9e9e",
  "En Proceso": "#ffb300",
  Cerrado: "#2e7d32",
};

type FlashReport = {
  DocNum: number;
  FechaFormateada: string;
  CustomerName: string;
  U_CreateUser: string;
  U_Severidad: string;
  SeveridadEtiqueta: string;
  SeveridadColorFondo: string;
  SeveridadColorTexto: string;
  ClasificacionNombre: string;
  RelacionNombre: string;
  SucursalName: string;
  EstatusSeguimiento: string;
};

type OrdenTrabajo = {
  DocNum: number;
  CustomerRefNo?: string;
  CustomerName: string;
  ManufacturerSerialNum?: string;
  FechaFormateada: string;
  U_CreateUser: string;
  tipo: "normal" | "audi";
};

const encabezado = { color: "white", fontWeight: 700, whiteSpace: "nowrap" } as const;

export default function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { canView, canCreate, isLoading: loadingPermisos } = usePermissions();

  const verFlash = canView("OT_SEGURIDAD");
  const verNormal = canView("OT_NORMAL");
  const verAudi = canView("OT_AUDI");
  const verOT = verNormal || verAudi;

  const [flash, setFlash] = useState<FlashReport[]>([]);
  const [ots, setOts] = useState<OrdenTrabajo[]>([]);
  const [otTotales, setOtTotales] = useState({ normal: 0, audi: 0, paginas: 1 });
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [cargandoOT, setCargandoOT] = useState(false);
  const [nuevoMenuAnchor, setNuevoMenuAnchor] = useState<HTMLElement | null>(null);

  // View state lives in the URL so returning from a detail restores tab, page and filters
  const vista: "flash" | "ot" =
    searchParams.get("vista") === "ot" && verOT ? "ot" : verFlash ? "flash" : "ot";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const q = searchParams.get("q") || "";
  const filtroSeveridad = searchParams.get("sev") || "";
  const filtroClasificacion = searchParams.get("clas") || "";
  const filtroEstatus = searchParams.get("est") || "";
  const filtroTipoOT = searchParams.get("tipo") || "";

  const actualizar = (cambios: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(cambios).forEach(([clave, valor]) => {
      if (valor === null || valor === "" || (clave === "page" && valor === 1)) params.delete(clave);
      else params.set(clave, String(valor));
    });
    setSearchParams(params, { replace: true });
  };
  const filtrar = (clave: string, valor: string) => actualizar({ [clave]: valor, page: 1 });

  useEffect(() => {
    if (loadingPermisos) return;
    const cargar = async () => {
      try {
        const usuario = await me();
        if (!usuario.authenticated) {
          navigate("/login");
          return;
        }
        if (verFlash) {
          const data = await OrdenesTrabajoService.listarFlashReports(1);
          setFlash(data?.llamadas || []);
        }
      } catch (error: any) {
        showError(error.message || "No se pudieron cargar los Flash Reports");
      } finally {
        setCargandoInicial(false);
      }
    };
    cargar();
  }, [loadingPermisos]);

  // Work orders are paginated by the backend, so they reload per page
  useEffect(() => {
    if (loadingPermisos || !verOT) return;
    const cargarOT = async () => {
      setCargandoOT(true);
      const vacio = { ordenes: [], total_registros: 0, total_paginas: 1 };
      try {
        const [normal, audi] = await Promise.all([
          verNormal ? OrdenesTrabajoService.listarNormal(vista === "ot" ? page : 1).catch(() => vacio) : vacio,
          verAudi ? OrdenesTrabajoService.listarAudi(vista === "ot" ? page : 1).catch(() => vacio) : vacio,
        ]);
        const lista: OrdenTrabajo[] = [
          ...(normal.ordenes || []).map((o: any) => ({ ...o, tipo: "normal" as const })),
          ...(audi.ordenes || []).map((o: any) => ({ ...o, tipo: "audi" as const })),
        ];
        lista.sort((a, b) => b.DocNum - a.DocNum);
        setOts(lista);
        setOtTotales({
          normal: normal.total_registros || 0,
          audi: audi.total_registros || 0,
          paginas: Math.max(normal.total_paginas || 1, audi.total_paginas || 1),
        });
      } finally {
        setCargandoOT(false);
      }
    };
    cargarOT();
  }, [loadingPermisos, vista === "ot" ? page : 0]);

  const flashFiltrados = useMemo(() => {
    const texto = q.trim().toLowerCase();
    return flash.filter(
      (f) =>
        (!texto ||
          [f.DocNum, f.CustomerName, f.U_CreateUser, f.SucursalName].some((v) =>
            String(v ?? "").toLowerCase().includes(texto)
          )) &&
        (!filtroSeveridad || f.U_Severidad === filtroSeveridad) &&
        (!filtroClasificacion || f.ClasificacionNombre === filtroClasificacion) &&
        (!filtroEstatus || f.EstatusSeguimiento === filtroEstatus)
    );
  }, [flash, q, filtroSeveridad, filtroClasificacion, filtroEstatus]);

  const opcionesSeveridad = useMemo(
    () =>
      [...new Map(flash.map((f) => [f.U_Severidad, f.SeveridadEtiqueta] as [string, string])).entries()].filter(
        ([valor]) => valor
      ),
    [flash]
  );
  const opcionesClasificacion = useMemo(
    () => [...new Set(flash.map((f) => f.ClasificacionNombre).filter(Boolean))].sort(),
    [flash]
  );

  const paginasFlash = Math.max(1, Math.ceil(flashFiltrados.length / POR_PAGINA));
  const paginaFlash = Math.min(page, paginasFlash);
  const flashPagina = flashFiltrados.slice((paginaFlash - 1) * POR_PAGINA, paginaFlash * POR_PAGINA);

  const otsVisibles = filtroTipoOT ? ots.filter((o) => o.tipo === filtroTipoOT) : ots;
  const fuentesOT = (verNormal ? 1 : 0) + (verAudi ? 1 : 0);

  const hayFiltrosFlash = Boolean(q || filtroSeveridad || filtroClasificacion || filtroEstatus);
  const tiposCrear = TIPOS_REGISTRO.filter((t) => canCreate(t.modulo));
  const ultimaVista = localStorage.getItem("ultimaOTVista");

  const handleVer = (docnum: number) => {
    localStorage.setItem("ultimaOTVista", String(docnum));
    navigate(`/ordenes-trabajo/${docnum}`, { state: { volverA: location.pathname + location.search } });
  };

  const botonNuevo =
    tiposCrear.length === 0 ? null : tiposCrear.length === 1 ? (
      <Button variant="contained" size="large" startIcon={<AddIcon />} onClick={() => navigate(tiposCrear[0].ruta)}>
        Nuevo {tiposCrear[0].label}
      </Button>
    ) : (
      <>
        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          endIcon={<ArrowDropDownIcon />}
          onClick={(e) => setNuevoMenuAnchor(e.currentTarget)}
        >
          Nuevo
        </Button>
        <Menu anchorEl={nuevoMenuAnchor} open={Boolean(nuevoMenuAnchor)} onClose={() => setNuevoMenuAnchor(null)}>
          {tiposCrear.map((t) => (
            <MenuItem
              key={t.tipo}
              onClick={() => {
                setNuevoMenuAnchor(null);
                navigate(t.ruta);
              }}
            >
              {t.label}
            </MenuItem>
          ))}
        </Menu>
      </>
    );

  const tarjetas = [
    verFlash && {
      label: "Flash Reports", valor: flash.length, color: "#333",
      fondo: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      icono: <SecurityIcon sx={{ fontSize: 40 }} />,
    },
    verFlash && {
      label: "Flash sin cerrar", valor: flash.filter((f) => f.EstatusSeguimiento !== "Cerrado").length, color: "white",
      fondo: "linear-gradient(135deg, #f7971e 0%, #e65c00 100%)",
      icono: <PendingActionsIcon sx={{ fontSize: 40 }} />,
    },
    verNormal && {
      label: "Órdenes de Trabajo", valor: otTotales.normal, color: "white",
      fondo: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      icono: <AssignmentIcon sx={{ fontSize: 40 }} />,
    },
    verAudi && {
      label: "OT Audi", valor: otTotales.audi, color: "white",
      fondo: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      icono: <GavelIcon sx={{ fontSize: 40 }} />,
    },
  ].filter(Boolean) as { label: string; valor: number; color: string; fondo: string; icono: ReactNode }[];

  if (loadingPermisos || cargandoInicial) {
    return <LoaderOverlay label="Cargando registros..." />;
  }

  const filaSeleccionada = (docnum: number) =>
    ultimaVista === String(docnum) ? { bgcolor: "action.selected" } : {};

  return (
    <Box>
      <PageHeader title="Servicio" subtitle="Mis registros" action={botonNuevo} />

      {tarjetas.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {tarjetas.map((t) => (
            <Grid key={t.label} size={{ xs: 12, sm: 6, md: 12 / tarjetas.length }}>
              <Card sx={{ background: t.fondo, height: "100%" }}>
                <CardContent sx={{ color: t.color }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    {t.icono}
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.85 }}>
                        {t.label}
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {t.valor}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {!verFlash && !verOT ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">No tienes permisos para ver registros de servicio.</Typography>
        </Paper>
      ) : (
        <Paper sx={{ mb: 3, overflow: "hidden" }}>
          <Tabs
            value={vista}
            onChange={(_, nueva) => setSearchParams(nueva === "ot" ? { vista: "ot" } : {}, { replace: true })}
            sx={{ px: 2, borderBottom: 1, borderColor: "divider" }}
          >
            {verFlash && <Tab value="flash" label={`Flash Reports (${flash.length})`} icon={<SecurityIcon />} iconPosition="start" />}
            {verOT && <Tab value="ot" label="Órdenes de Trabajo" icon={<AssignmentIcon />} iconPosition="start" />}
          </Tabs>

          <Box sx={{ p: { xs: 2, md: 3 } }}>
            {vista === "flash" ? (
              <>
                {/* Flash filters */}
                <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center", mb: 2.5 }}>
                  <TextField
                    size="small"
                    placeholder="Buscar folio, lugar, usuario o sucursal"
                    value={q}
                    onChange={(e) => filtrar("q", e.target.value)}
                    sx={{ flex: "1 1 260px" }}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  <TextField select size="small" label="Severidad" value={filtroSeveridad} onChange={(e) => filtrar("sev", e.target.value)} sx={{ minWidth: 170 }}>
                    <MenuItem value="">Todas</MenuItem>
                    {opcionesSeveridad.map(([valor, etiqueta]) => (
                      <MenuItem key={valor} value={valor}>
                        {etiqueta}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField select size="small" label="Clasificación" value={filtroClasificacion} onChange={(e) => filtrar("clas", e.target.value)} sx={{ minWidth: 160 }}>
                    <MenuItem value="">Todas</MenuItem>
                    {opcionesClasificacion.map((c) => (
                      <MenuItem key={c} value={c}>
                        {c}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField select size="small" label="Estatus" value={filtroEstatus} onChange={(e) => filtrar("est", e.target.value)} sx={{ minWidth: 150 }}>
                    <MenuItem value="">Todos</MenuItem>
                    {Object.keys(ESTATUS_COLOR).map((e) => (
                      <MenuItem key={e} value={e}>
                        {e}
                      </MenuItem>
                    ))}
                  </TextField>
                  {hayFiltrosFlash && (
                    <Button startIcon={<FilterAltOffIcon />} onClick={() => actualizar({ q: null, sev: null, clas: null, est: null, page: 1 })}>
                      Limpiar
                    </Button>
                  )}
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  {flashFiltrados.length === flash.length
                    ? `${flash.length} Flash Reports`
                    : `${flashFiltrados.length} de ${flash.length} Flash Reports`}
                </Typography>

                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "primary.main" }}>
                      <TableRow>
                        <TableCell sx={encabezado}>#</TableCell>
                        <TableCell sx={encabezado}>Folio SAP</TableCell>
                        <TableCell sx={encabezado}>Fecha</TableCell>
                        <TableCell sx={encabezado}>Severidad</TableCell>
                        <TableCell sx={encabezado}>Clasificación</TableCell>
                        <TableCell sx={encabezado}>Relación</TableCell>
                        <TableCell sx={encabezado}>Lugar</TableCell>
                        <TableCell sx={encabezado}>Sucursal</TableCell>
                        <TableCell sx={encabezado}>Usuario</TableCell>
                        <TableCell sx={encabezado}>Estatus</TableCell>
                        <TableCell sx={encabezado} align="center">
                          Ver
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {flashPagina.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
                            <Typography color="text.secondary">
                              {hayFiltrosFlash ? "Ningún Flash Report coincide con los filtros." : "No hay Flash Reports."}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        flashPagina.map((f, i) => (
                          <TableRow key={f.DocNum} hover sx={filaSeleccionada(f.DocNum)}>
                            <TableCell sx={{ color: "text.secondary" }}>{(paginaFlash - 1) * POR_PAGINA + i + 1}</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{f.DocNum}</TableCell>
                            <TableCell sx={{ whiteSpace: "nowrap" }}>{f.FechaFormateada}</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={f.SeveridadEtiqueta || f.U_Severidad}
                                sx={{ bgcolor: f.SeveridadColorFondo, color: f.SeveridadColorTexto, fontWeight: 700 }}
                              />
                            </TableCell>
                            <TableCell>{f.ClasificacionNombre}</TableCell>
                            <TableCell>{f.RelacionNombre === "N/A" ? "—" : f.RelacionNombre}</TableCell>
                            <TableCell sx={{ maxWidth: 220 }}>{f.CustomerName}</TableCell>
                            <TableCell>{f.SucursalName}</TableCell>
                            <TableCell>{f.U_CreateUser}</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={f.EstatusSeguimiento}
                                sx={{ bgcolor: ESTATUS_COLOR[f.EstatusSeguimiento] || "#9e9e9e", color: "#fff", fontWeight: 700 }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Button size="small" variant="outlined" startIcon={<VisibilityIcon />} onClick={() => handleVer(f.DocNum)}>
                                Ver
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {paginasFlash > 1 && (
                  <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                    <Pagination count={paginasFlash} page={paginaFlash} onChange={(_, value) => actualizar({ page: value })} color="primary" />
                  </Box>
                )}
              </>
            ) : (
              <>
                {/* Work orders */}
                {verNormal && verAudi && (
                  <Box sx={{ mb: 2.5 }}>
                    <TextField select size="small" label="Tipo" value={filtroTipoOT} onChange={(e) => actualizar({ tipo: e.target.value })} sx={{ minWidth: 200 }}>
                      <MenuItem value="">Todas</MenuItem>
                      <MenuItem value="normal">Orden de Trabajo</MenuItem>
                      <MenuItem value="audi">OT Audi</MenuItem>
                    </TextField>
                  </Box>
                )}

                {cargandoOT && <LinearProgress sx={{ mb: 1 }} />}

                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "primary.main" }}>
                      <TableRow>
                        <TableCell sx={encabezado}>#</TableCell>
                        <TableCell sx={encabezado}>Folio SAP</TableCell>
                        <TableCell sx={encabezado}>Tipo</TableCell>
                        <TableCell sx={encabezado}>Folio físico</TableCell>
                        <TableCell sx={encabezado}>Cliente</TableCell>
                        <TableCell sx={encabezado}>No. serie equipo</TableCell>
                        <TableCell sx={encabezado}>Fecha</TableCell>
                        <TableCell sx={encabezado}>Creado por</TableCell>
                        <TableCell sx={encabezado} align="center">
                          Ver
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {otsVisibles.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                            <Typography color="text.secondary">No hay órdenes de trabajo.</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        otsVisibles.map((o, i) => (
                          <TableRow key={`${o.tipo}-${o.DocNum}`} hover sx={filaSeleccionada(o.DocNum)}>
                            <TableCell sx={{ color: "text.secondary" }}>{(page - 1) * POR_PAGINA * fuentesOT + i + 1}</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{o.DocNum}</TableCell>
                            <TableCell>
                              <Chip size="small" label={o.tipo === "audi" ? "OT Audi" : "Orden de Trabajo"} color={o.tipo === "audi" ? "info" : "default"} />
                            </TableCell>
                            <TableCell>{o.CustomerRefNo || "—"}</TableCell>
                            <TableCell sx={{ maxWidth: 240 }}>{o.CustomerName}</TableCell>
                            <TableCell>{o.ManufacturerSerialNum || "—"}</TableCell>
                            <TableCell sx={{ whiteSpace: "nowrap" }}>{o.FechaFormateada}</TableCell>
                            <TableCell>{o.U_CreateUser}</TableCell>
                            <TableCell align="center">
                              <Button size="small" variant="outlined" startIcon={<VisibilityIcon />} onClick={() => handleVer(o.DocNum)}>
                                Ver
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {otTotales.paginas > 1 && (
                  <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                    <Pagination count={otTotales.paginas} page={page} onChange={(_, value) => actualizar({ page: value })} color="primary" />
                  </Box>
                )}
              </>
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
}
