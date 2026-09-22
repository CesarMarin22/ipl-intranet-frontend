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
  MenuItem,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AssignmentIcon from "@mui/icons-material/Assignment";
import SecurityIcon from "@mui/icons-material/Security";
import Gavel from "@mui/icons-material/Gavel";

import PageHeader from "../../../shared/components/PageHeader";
import { OrdenesTrabajoService } from "../../../services/ordenesTrabajo";
import { me, type MeResponse } from "../../../services/auth";
import LoaderOverlay from "../../../shared/components/LoaderOverlay";
import { showError } from "../../../shared/utils/swal";

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

  useEffect(() => {
    cargarDatos();
  }, [page, filterType]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const userData = await me();
      setUser(userData);

      if (!userData.authenticated) {
        navigate("/login");
        return;
      }

      // Cargar todas las OT del usuario
      const dataNormal = await OrdenesTrabajoService.listarFlashReports(page);

      const llamadas = (dataNormal.llamadas || []).map((ot: any) => ({
        ...ot,
        tipo: determinaTipo(ot),
      }));

      // Filtrar por tipo si es necesario
      const filtered = filterType === "all"
        ? llamadas
        : llamadas.filter((ot: OT) => ot.tipo === filterType);

      setOts(filtered);
      setTotalPages(dataNormal.total_paginas || 1);
    } catch (error: any) {
      showError("Error", error.message || "No se pudieron cargar las OT");
    } finally {
      setLoading(false);
    }
  };

  const determinaTipo = (ot: any): "normal" | "audi" | "seguridad" => {
    if (ot.CallType === 28) return "audi";
    if (ot.CallType === 24) return "seguridad";
    return "normal";
  };

  const handleCrearOT = () => {
    if (!user) return;
    if (user.perfil === 4) {
      navigate("/ordenes-trabajo/seguridad");
    } else if (user.perfil === 5) {
      navigate("/ordenes-trabajo/audi");
    } else {
      navigate("/ordenes-trabajo/normal");
    }
  };

  const handleVer = (docnum: number) => {
    localStorage.setItem("ultimaOTVista", String(docnum));
    navigate(`/ordenes-trabajo/${docnum}`);
  };

  const statsNormal = ots.filter((ot) => ot.tipo === "normal").length;
  const statsAudi = ots.filter((ot) => ot.tipo === "audi").length;
  const statsSeguridad = ots.filter((ot) => ot.tipo === "seguridad").length;

  if (loading && ots.length === 0) {
    return <LoaderOverlay label="Cargando Órdenes de Trabajo..." />;
  }

  return (
    <Box>
      <PageHeader title="Dashboard - Órdenes de Trabajo" />

      {/* Botón crear (visible en móvil) */}
      {user && [1, 2, 3, 4, 5].includes(user.perfil || 0) && (
        <Box sx={{ display: { xs: "block", md: "none" }, textAlign: "center", mb: 3 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={handleCrearOT}
            sx={{ mt: 2 }}
          >
            Crear OT
          </Button>
        </Box>
      )}

      {/* Cards resumen */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
            <CardContent sx={{ color: "white" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <AssignmentIcon sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Órdenes de Trabajo
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {statsNormal}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" }}>
            <CardContent sx={{ color: "white" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Gavel sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    OT Audi
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {statsAudi}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)" }}>
            <CardContent sx={{ color: "#333" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <SecurityIcon sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Flash Reports
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {statsSeguridad}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" }}>
            <CardContent sx={{ color: "white" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography variant="h3">📊</Typography>
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Total
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {ots.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
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
              <MenuItem value="all">Todas las OT</MenuItem>
              <MenuItem value="normal">Órdenes de Trabajo</MenuItem>
              <MenuItem value="audi">OT Audi</MenuItem>
              <MenuItem value="seguridad">Flash Reports</MenuItem>
            </TextField>
          </Box>
        </Box>

        {/* Tabla */}
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: "#f5f5f5" }}>
              <TableRow>
                <TableCell>
                  <strong>OT SAP #</strong>
                </TableCell>
                <TableCell>
                  <strong>Tipo</strong>
                </TableCell>
                <TableCell>
                  <strong>Cliente</strong>
                </TableCell>
                <TableCell>
                  <strong>Fecha</strong>
                </TableCell>
                <TableCell>
                  <strong>Severidad</strong>
                </TableCell>
                <TableCell>
                  <strong>Creado por</strong>
                </TableCell>
                <TableCell align="center">
                  <strong>Acción</strong>
                </TableCell>
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
