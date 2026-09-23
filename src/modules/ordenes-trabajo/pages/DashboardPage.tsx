import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  Typography,
  TextField,
  Menu,
  MenuItem,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AssignmentIcon from "@mui/icons-material/Assignment";
import SecurityIcon from "@mui/icons-material/Security";
import Gavel from "@mui/icons-material/Gavel";

import PageHeader from "../../../shared/components/PageHeader";
import { OrdenesTrabajoService } from "../../../services/ordenesTrabajo";
import { me, type MeResponse } from "../../../services/auth";
import LoaderOverlay from "../../../shared/components/LoaderOverlay";
import { showError } from "../../../shared/utils/swal";
import { usePermissions } from "../../../shared/hooks/usePermissions";

// What each record type needs: VER to list it on the dashboard, CREAR to show it under "+ Nuevo"
const TIPOS_REGISTRO = [
  { tipo: "seguridad", label: "Flash Report", modulo: "OT_SEGURIDAD", ruta: "/ordenes-trabajo/seguridad" },
  { tipo: "normal", label: "Orden de Trabajo", modulo: "OT_NORMAL", ruta: "/ordenes-trabajo/normal" },
  { tipo: "audi", label: "OT Audi", modulo: "OT_AUDI", ruta: "/ordenes-trabajo/audi" },
] as const;

type OT = {
  DocNum: number;
  CustomerRefNo: string;
  CustomerName: string;
  FechaFormateada: string;
  Series: number;
  U_Severidad?: string;
  U_CreateUser: string;
  tipo: "normal" | "audi" | "seguridad";
};

const TIPO_BADGES = {
  normal: { label: "Orden de Trabajo", color: "default" as const, icon: "📋" },
  audi: { label: "OT Audi", color: "info" as const, icon: "🔍" },
  seguridad: { label: "Flash Report", color: "error" as const, icon: "⚠️" },
};

const SEVERIDAD_COLORS: Record<string, "error" | "warning" | "success" | "info"> = {
  Fatal: "error",
  Critica: "error",
  Moderada: "warning",
  Menor: "success",
  CriticaO: "error",
  Alto: "warning",
  ModeradaO: "warning",
  Bajo: "success",
  CriticaV: "error",
  ModeradaV: "warning",
  MenorV: "success",
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<MeResponse | null>(null);
  const [ots, setOts] = useState<OT[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState<"all" | "normal" | "audi" | "seguridad">("all");
  const [nuevoMenuAnchor, setNuevoMenuAnchor] = useState<HTMLElement | null>(null);

  const { canView, canCreate, isLoading: loadingPermisos } = usePermissions();
  const tiposCrear = TIPOS_REGISTRO.filter((t) => canCreate(t.modulo));

  useEffect(() => {
    if (loadingPermisos) return;
    cargarDatos();
  }, [page, filterType, loadingPermisos]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const userData = await me();
      setUser(userData);

      if (!userData.authenticated) {
        navigate("/login");
        return;
      }

      // Only query the lists the user may view, so there are no 403s for modules they don't have
      const vacio = { ordenes: [], llamadas: [], total_paginas: 1 };
      const [dataNormal, dataAudi, dataFlash] = await Promise.all([
        canView("OT_NORMAL") ? OrdenesTrabajoService.listarNormal(page).catch(() => vacio) : vacio,
        canView("OT_AUDI") ? OrdenesTrabajoService.listarAudi(page).catch(() => vacio) : vacio,
        canView("OT_SEGURIDAD") ? OrdenesTrabajoService.listarFlashReports(page).catch(() => vacio) : vacio,
      ]);

      // Combinar todas las OT
      const otesNormales = (dataNormal.ordenes || []).map((ot: any) => ({
        ...ot,
        tipo: "normal" as const,
      }));

      const otesAudi = (dataAudi.ordenes || []).map((ot: any) => ({
        ...ot,
        tipo: "audi" as const,
      }));

      const otesFlash = (dataFlash.llamadas || []).map((ot: any) => ({
        ...ot,
        tipo: "seguridad" as const,
      }));

      const todasLasOts = [...otesNormales, ...otesAudi, ...otesFlash];

      // Ordenar por fecha descendente
      todasLasOts.sort((a, b) => {
        const dateA = new Date(a.FechaFormateada || "").getTime();
        const dateB = new Date(b.FechaFormateada || "").getTime();
        return dateB - dateA;
      });

      // Filtrar por tipo si es necesario
      const filtered =
        filterType === "all"
          ? todasLasOts
          : todasLasOts.filter((ot: OT) => ot.tipo === filterType);

      setOts(filtered);

      // Calcular total de páginas (usamos el máximo de los 3 endpoints)
      const maxPages = Math.max(
        dataNormal.total_paginas || 1,
        dataAudi.total_paginas || 1,
        dataFlash.total_paginas || 1
      );
      setTotalPages(maxPages);
    } catch (error: any) {
      showError("Error", error.message || "No se pudieron cargar las OT");
    } finally {
      setLoading(false);
    }
  };


  const botonNuevo =
    tiposCrear.length === 0 ? null : tiposCrear.length === 1 ? (
      <Button
        variant="contained"
        size="large"
        startIcon={<AddIcon />}
        onClick={() => navigate(tiposCrear[0].ruta)}
      >
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
        <Menu
          anchorEl={nuevoMenuAnchor}
          open={Boolean(nuevoMenuAnchor)}
          onClose={() => setNuevoMenuAnchor(null)}
        >
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

  const handleVer = (docnum: number) => {
    localStorage.setItem("ultimaOTVista", String(docnum));
    navigate(`/ordenes-trabajo/${docnum}`);
  };

  const statsNormal = ots.filter((ot) => ot.tipo === "normal").length;
  const statsAudi = ots.filter((ot) => ot.tipo === "audi").length;
  const statsSeguridad = ots.filter((ot) => ot.tipo === "seguridad").length;

  const tarjetas = [
    canView("OT_NORMAL") && {
      label: "Órdenes de Trabajo", valor: statsNormal, color: "white",
      fondo: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      icono: <AssignmentIcon sx={{ fontSize: 40 }} />,
    },
    canView("OT_AUDI") && {
      label: "OT Audi", valor: statsAudi, color: "white",
      fondo: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      icono: <Gavel sx={{ fontSize: 40 }} />,
    },
    canView("OT_SEGURIDAD") && {
      label: "Flash Reports", valor: statsSeguridad, color: "#333",
      fondo: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      icono: <SecurityIcon sx={{ fontSize: 40 }} />,
    },
    {
      label: "Total", valor: ots.length, color: "white",
      fondo: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      icono: <Typography variant="h3">📊</Typography>,
    },
  ].filter(Boolean) as { label: string; valor: number; color: string; fondo: string; icono: React.ReactNode }[];

  if (loading && ots.length === 0) {
    return <LoaderOverlay label="Cargando Órdenes de Trabajo..." />;
  }

  return (
    <Box>
      <PageHeader title="Servicio" subtitle="Mis registros" action={botonNuevo} />

      {/* Cards resumen */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {tarjetas.map((t) => (
          <Grid key={t.label} size={{ xs: 12, sm: 6, md: 12 / tarjetas.length }}>
            <Card sx={{ background: t.fondo, height: "100%" }}>
              <CardContent sx={{ color: t.color }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  {t.icono}
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
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

      {/* Filtro y tabla */}
      <Paper sx={{ p: 3, mb: 3 }}>
        {/* Controles */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
              Mostrando {ots.length} de {ots.length} registros
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <TextField
              select
              size="small"
              label="Filtrar por tipo"
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value as any);
                setPage(1);
              }}
              sx={{ width: 200 }}
            >
              <MenuItem value="all">Todos</MenuItem>
              {TIPOS_REGISTRO.filter((t) => canView(t.modulo)).map((t) => (
                <MenuItem key={t.tipo} value={t.tipo}>
                  {t.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Box>

        {/* Tabla */}
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: "primary.main" }}>
              <TableRow>
                <TableCell sx={{ color: "white", fontWeight: 700 }}>OT SAP #</TableCell>
                <TableCell sx={{ color: "white", fontWeight: 700 }}>Tipo</TableCell>
                <TableCell sx={{ color: "white", fontWeight: 700 }}>Cliente</TableCell>
                <TableCell sx={{ color: "white", fontWeight: 700 }}>Fecha</TableCell>
                <TableCell sx={{ color: "white", fontWeight: 700 }}>Severidad</TableCell>
                <TableCell sx={{ color: "white", fontWeight: 700 }}>Creado por</TableCell>
                <TableCell align="center" sx={{ color: "white", fontWeight: 700 }}>Acción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">
                      No hay órdenes de trabajo en este momento
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                ots.map((ot) => (
                  <TableRow
                    key={ot.DocNum}
                    hover
                    sx={{
                      "&:hover": { bgcolor: "action.hover" },
                      ...(localStorage.getItem("ultimaOTVista") === String(ot.DocNum) && {
                        bgcolor: "action.selected",
                      }),
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600 }}>{ot.DocNum}</TableCell>
                    <TableCell>
                      <Chip
                        label={TIPO_BADGES[ot.tipo].label}
                        color={TIPO_BADGES[ot.tipo].color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{ot.CustomerName}</TableCell>
                    <TableCell>{ot.FechaFormateada}</TableCell>
                    <TableCell>
                      {ot.U_Severidad ? (
                        <Chip
                          label={ot.U_Severidad}
                          color={SEVERIDAD_COLORS[ot.U_Severidad] || "default"}
                          size="small"
                          variant="outlined"
                        />
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{ot.U_CreateUser}</TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleVer(ot.DocNum)}
                      >
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Paginación */}
        {totalPages > 1 && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
            />
          </Box>
        )}
      </Paper>
    </Box>
  );
}
