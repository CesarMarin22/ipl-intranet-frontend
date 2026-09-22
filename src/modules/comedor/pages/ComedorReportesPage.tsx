import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import PageHeader from "../../../shared/components/PageHeader";
import LoaderOverlay from "../../../shared/components/LoaderOverlay";
import { exportToExcel } from "../../../shared/utils/exportExcel";
import { exportComedorReportPdf } from "../../../shared/utils/exportPdf";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import {
  getResumenComedor,
  getMovimientosDiarios,
  getPaquetesRecargas,
  getTopConsumos,
  //getSaldosBajos,
  getCorteDiario,
  getEmpleadosConsumosDia,
} from "../../../services/comedor";
import { showError } from "../../../shared/utils/swal";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function ComedorReportesPage() {
  const isMobile = useMediaQuery("(max-width:900px)");

  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState<any>(null);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [paquetes, setPaquetes] = useState<any[]>([]);
  const [topConsumos, setTopConsumos] = useState<any[]>([]);
  //const [saldosBajos, setSaldosBajos] = useState<any[]>([]);
  const [empleadosConsumosDia, setEmpleadosConsumosDia] = useState<any[]>([]);
  const [corteDiario, setCorteDiario] = useState<any>(null);

  const today = new Date();

  const toDateInput = (date: Date) => date.toISOString().slice(0, 10);

  const setQuickRange = (type: "today" | "week" | "month") => {
    const end = new Date();
    const start = new Date();

    if (type === "today") {
      setFechaInicio(toDateInput(today));
      setFechaFin(toDateInput(today));
      return;
    }

    if (type === "week") {
      start.setDate(end.getDate() - 7);
    }

    if (type === "month") {
      start.setMonth(end.getMonth() - 1);
    }

    setFechaInicio(toDateInput(start));
    setFechaFin(toDateInput(end));
  };

  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const exportPdf = () => {
    exportComedorReportPdf({
      resumen,
      corteDiario,
      topConsumos,
      //saldosBajos,
      formatMoney,
    });
  };

  const formatMoney = (value: number) =>
    Number(value || 0).toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
    });

  const formatFecha = (value: string) =>
    new Date(String(value).replace(" GMT", "")).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
    });

  const loadData = async () => {
    setLoading(true);

    try {
      const params = {
        fecha_inicio: fechaInicio || undefined,
        fecha_fin: fechaFin || undefined,
      };

      const [res1, res2, res3, res4, res5, res6] = await Promise.all([
        getResumenComedor(params),
        getMovimientosDiarios(params),
        getPaquetesRecargas(params),
        getTopConsumos(params),
        getEmpleadosConsumosDia(params),
        getCorteDiario(fechaInicio || undefined),
      ]);

      if (res1.ok) setResumen(res1.data);

      if (res2.ok) {
        setMovimientos(
          (res2.data ?? []).map((r: any) => ({
            fecha: r.FECHA,
            recargas: Number(r.RECARGAS ?? 0),
            consumos: Number(r.CONSUMOS ?? 0),
            montoRecargas: Number(r.MONTO_RECARGAS ?? 0),
            montoConsumos: Number(r.MONTO_CONSUMOS ?? 0),
          })),
        );
      }

      if (res3.ok) {
        setPaquetes(
          (res3.data ?? []).map((r: any) => ({
            paquete: `${r.PAQUETE} comidas`,
            total: Number(r.TOTAL ?? 0),
            monto: Number(r.MONTO ?? 0),
          })),
        );
      }

      if (res4.ok) setTopConsumos(res4.data ?? []);
      if (res5.ok) setEmpleadosConsumosDia(res5.data ?? []);
      if (res6.ok) setCorteDiario(res6.data);
    } catch {
      showError("Error cargando reportes");
    } finally {
      setLoading(false);
    }
  };

  const exportTopConsumos = () => {
    exportToExcel(
      topConsumos.map((row) => ({
        Empleado: row.NOMBRE,
        NumeroEmpleado: row.NUMERO_EMPLEADO,
        Consumos: row.TOTAL_CONSUMOS,
        Monto: Number(row.MONTO ?? 0),
      })),
      "top-consumos",
    );
  };

  const exportEmpleadosConsumosDia = () => {
    exportToExcel(
      empleadosConsumosDia.map((row) => ({
        Fecha: row.FECHA,
        Empleado: row.NOMBRE,
        NumeroEmpleado: row.NUMERO_EMPLEADO,
        ComidasConsumidas: row.COMIDAS_CONSUMIDAS,
        Movimientos: row.TOTAL_MOVIMIENTOS,
      })),
      "empleados-consumos-dia",
    );
  };

  const exportResumen = () => {
    exportToExcel(
      [
        {
          TotalRecargas: totalRecargas,
          MontoRecargas: montoRecargas,
          TotalConsumos: totalConsumos,
        },
      ],
      "resumen-comedor",
    );
  };

  const exportMovimientos = () => {
    exportToExcel(
      movimientos.map((row) => ({
        Fecha: row.fecha,
        Recargas: row.recargas,
        Consumos: row.consumos,
        MontoRecargas: row.montoRecargas,
      })),
      "movimientos-diarios-comedor",
    );
  };

  const exportPaquetes = () => {
    exportToExcel(
      paquetes.map((row) => ({
        Paquete: row.paquete,
        TotalVendido: row.total,
        Monto: row.monto,
      })),
      "paquetes-mas-vendidos",
    );
  };

  const exportCorteDiario = () => {
    if (!corteDiario) {
      showError("No hay información de corte diario para exportar");
      return;
    }

    exportToExcel(
      [
        {
          Fecha: corteDiario.FECHA,
          TotalRecargas: corteDiario.TOTAL_RECARGAS,
          MontoRecargas: Number(corteDiario.MONTO_RECARGAS ?? 0),
          ComidasRecargadas: corteDiario.COMIDAS_RECARGADAS,
          TotalConsumos: corteDiario.TOTAL_CONSUMOS,
          ComidasConsumidas: corteDiario.COMIDAS_CONSUMIDAS,
          UsuariosAtendidos: corteDiario.USUARIOS_ATENDIDOS,
          PaqueteMasVendido: corteDiario.PAQUETE_TOP
            ? `${corteDiario.PAQUETE_TOP} comidas`
            : "-",
        },
      ],
      "corte-diario-comedor",
    );
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <LoaderOverlay label="Cargando reportes..." />;

  const totalRecargas = Number(resumen?.recargas?.TOTAL_RECARGAS ?? 0);
  const montoRecargas = Number(resumen?.recargas?.MONTO_RECARGAS ?? 0);
  const totalConsumos = Number(resumen?.consumos?.TOTAL_CONSUMOS ?? 0);

  const KpiCard = ({
    title,
    value,
    subtitle,
    icon,
    //valueColor,
  }: {
    title: string;
    value: string;
    subtitle: string;
    icon: React.ReactNode;
    valueColor?: string;
  }) => (
    <Paper
      sx={{
        p: 3,
        borderRadius: 4,
        height: "100%",
        background:
          "linear-gradient(135deg, rgba(245,158,11,.16), rgba(255,255,255,.04))",
        border: "1px solid rgba(255,255,255,.08)",
        transition: "all .25s ease",
        "&:hover": {
          transform: "translateY(-4px)",
        },
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 3,
            display: "grid",
            placeItems: "center",
            bgcolor: "rgba(245,158,11,.18)",
          }}
        >
          {icon}
        </Box>

        <Box>
          <Typography color="text.secondary" fontSize={13}>
            {title}
          </Typography>

          <Typography variant={isMobile ? "h5" : "h4"} fontWeight={900}>
            {value}
          </Typography>

          <Typography color="text.secondary" fontSize={13}>
            {subtitle}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    return (
      <Paper
        sx={{
          p: 1.5,
          borderRadius: 2,
          background: "rgba(11,11,13,.95)",
          border: "1px solid rgba(245,158,11,.25)",
        }}
      >
        <Typography fontWeight={900} fontSize={13}>
          {formatFecha(String(label))}
        </Typography>

        {payload.map((item: any) => (
          <Typography key={item.dataKey} fontSize={13} color="text.secondary">
            {item.name}: {item.value}
          </Typography>
        ))}
      </Paper>
    );
  };
  const CustomPackageTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    return (
      <Paper
        sx={{
          p: 1.5,
          borderRadius: 2,
          background: "rgba(11,11,13,.95)",
          border: "1px solid rgba(245,158,11,.25)",
        }}
      >
        <Typography fontWeight={900} fontSize={13}>
          {label}
        </Typography>

        <Typography fontSize={13} color="text.secondary">
          Vendidos: {payload[0].value}
        </Typography>
      </Paper>
    );
  };

  return (
    <Box>
      <PageHeader
        title="Reportes comedor"
        subtitle="Resumen ejecutivo de recargas, consumos y saldos."
      />

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }}>
        <Button variant="outlined" onClick={exportResumen}>
          Exportar resumen
        </Button>

        <Button variant="outlined" onClick={exportMovimientos}>
          Exportar movimientos
        </Button>

        <Button variant="outlined" onClick={exportPaquetes}>
          Exportar paquetes
        </Button>

        <Button variant="contained" onClick={exportPdf}>
          Exportar PDF
        </Button>
      </Stack>

      <Paper
        sx={{
          p: { xs: 2, md: 3 },
          mb: 2,
          borderRadius: 4,
          background:
            "linear-gradient(135deg, rgba(255,255,255,.04), rgba(255,255,255,.02))",
          border: "1px solid rgba(255,255,255,.08)",
        }}
      >
        <Typography fontWeight={900} sx={{ mb: 2 }}>
          Filtros
        </Typography>

        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              label="Fecha inicio"
              type="date"
              fullWidth
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              label="Fecha fin"
              type="date"
              fullWidth
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => setQuickRange("today")}
              >
                Hoy
              </Button>

              <Button
                variant="outlined"
                fullWidth
                onClick={() => setQuickRange("week")}
              >
                7 días
              </Button>

              <Button
                variant="outlined"
                fullWidth
                onClick={() => setQuickRange("month")}
              >
                30 días
              </Button>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" fullWidth onClick={loadData}>
                Aplicar
              </Button>

              <Button
                variant="outlined"
                fullWidth
                onClick={() => {
                  setFechaInicio("");
                  setFechaFin("");
                  setTimeout(loadData, 0);
                }}
              >
                Limpiar
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 3 }}>
          <KpiCard
            title="Total recargado"
            value={formatMoney(montoRecargas)}
            subtitle={`${totalRecargas} recargas`}
            icon={<AttachMoneyIcon />}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <KpiCard
            title="Comidas consumidas"
            value={String(totalConsumos)}
            subtitle="Consumos registrados"
            icon={<RestaurantIcon />}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <KpiCard
            title="Comidas servidas"
            value={String(corteDiario?.COMIDAS_CONSUMIDAS ?? totalConsumos)}
            subtitle="Según consumos escaneados"
            icon={<TrendingUpIcon />}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <KpiCard
            title="Promedio diario"
            value={String(
              Number(resumen?.consumos?.PROMEDIO_DIARIO ?? 0).toFixed(1),
            )}
            subtitle="Comidas por día"
            icon={<TrendingUpIcon />}
          />
        </Grid>
      </Grid>

      <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
        <Paper
          sx={{
            p: 4,
            borderRadius: 4,
            background:
              "linear-gradient(135deg, rgba(255,255,255,.04), rgba(255,255,255,.02))",
            border: "1px solid rgba(255,255,255,.08)",
            backdropFilter: "blur(10px)",
            transition: "all .25s ease",

            "&:hover": {
              transform: "translateY(-4px)",
            },
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "center" }}
            spacing={1}
            sx={{ mb: 3 }}
          >
            <Typography fontWeight={900}>Corte diario</Typography>

            <Button variant="outlined" onClick={exportCorteDiario}>
              Exportar corte
            </Button>
          </Stack>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 3 }}>
              <Typography color="text.secondary">Fecha</Typography>

              <Typography fontWeight={900}>
                {corteDiario?.FECHA ?? "-"}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <Typography color="text.secondary">Usuarios atendidos</Typography>

              <Typography fontWeight={900}>
                {corteDiario?.USUARIOS_ATENDIDOS ?? 0}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <Typography color="text.secondary">
                Paquete más vendido
              </Typography>

              <Typography fontWeight={900}>
                {corteDiario?.PAQUETE_TOP
                  ? `${corteDiario.PAQUETE_TOP} comidas`
                  : "-"}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <Typography color="text.secondary">Diferencia</Typography>

              <Typography fontWeight={900}>
                {formatMoney(corteDiario?.DIFERENCIA ?? 0)}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper
            sx={{
              p: 4,
              borderRadius: 4,
              background:
                "linear-gradient(135deg, rgba(255,255,255,.04), rgba(255,255,255,.02))",
              border: "1px solid rgba(255,255,255,.08)",
              backdropFilter: "blur(10px)",
              transition: "all .25s ease",
              "&:hover": {
                transform: "translateY(-4px)",
              },
            }}
          >
            <Typography fontWeight={900} sx={{ mb: 2 }}>
              Recargas vs consumos por día
            </Typography>

            <Box sx={{ width: "100%", height: { xs: 260, md: 320 } }}>
              <ResponsiveContainer>
                <LineChart data={movimientos}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="fecha" tickFormatter={formatFecha} />
                  <YAxis allowDecimals={false} width={35} />
                  <Tooltip
                    content={<CustomTooltip />}
                    labelFormatter={(value) => formatFecha(String(value))}
                    formatter={(value: any, name: any) => [
                      value,
                      name === "recargas" ? "Recargas" : "Consumos",
                    ]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="recargas"
                    stroke="#4caf50"
                    strokeWidth={4}
                    dot={{ r: 5 }}
                    activeDot={{ r: 7 }}
                  />

                  <Line
                    type="monotone"
                    dataKey="consumos"
                    stroke="#ff9800"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper
            sx={{
              p: 4,
              borderRadius: 4,
              background:
                "linear-gradient(135deg, rgba(255,255,255,.04), rgba(255,255,255,.02))",
              border: "1px solid rgba(255,255,255,.08)",
              backdropFilter: "blur(10px)",
              transition: "all .25s ease",
              "&:hover": {
                transform: "translateY(-4px)",
              },
            }}
          >
            <Typography fontWeight={900} sx={{ mb: 2 }}>
              Paquetes más vendidos
            </Typography>

            <Box sx={{ width: "100%", height: { xs: 260, md: 320 } }}>
              <ResponsiveContainer>
                <BarChart data={paquetes}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />

                  <XAxis dataKey="paquete" />

                  <YAxis allowDecimals={false} width={35} />

                  <Tooltip content={<CustomPackageTooltip />} />

                  <Bar dataKey="total" fill="#ff9800" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper
            sx={{
              p: 4,
              borderRadius: 4,
              background:
                "linear-gradient(135deg, rgba(255,255,255,.04), rgba(255,255,255,.02))",
              border: "1px solid rgba(255,255,255,.08)",
              backdropFilter: "blur(10px)",
              transition: "all .25s ease",
              "&:hover": {
                transform: "translateY(-4px)",
              },
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Typography fontWeight={900}>
                Top empleados con más consumos
              </Typography>

              <Button
                size="small"
                variant="outlined"
                onClick={exportTopConsumos}
              >
                Excel
              </Button>
            </Stack>

            {isMobile ? (
              <Stack spacing={1.5}>
                {topConsumos.length === 0 ? (
                  <Typography color="text.secondary">
                    No hay consumos registrados.
                  </Typography>
                ) : (
                  topConsumos.map((row) => (
                    <Paper
                      key={row.USUARIOID}
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        transition: "all .25s ease",
                        "&:hover": {
                          transform: "translateY(-4px)",
                        },
                      }}
                    >
                      <Typography fontWeight={900}>{row.NOMBRE}</Typography>
                      <Typography variant="body2">
                        No.: {row.NUMERO_EMPLEADO ?? "-"}
                      </Typography>
                      <Typography variant="body2">
                        Consumos: {row.TOTAL_CONSUMOS}
                      </Typography>
                      <Typography fontWeight={800}>
                        {formatMoney(row.MONTO)}
                      </Typography>
                    </Paper>
                  ))
                )}
              </Stack>
            ) : (
              <Box sx={{ overflowX: "auto" }}>
                <Stack spacing={2}>
                  {topConsumos.length === 0 ? (
                    <Typography color="text.secondary">
                      No hay consumos registrados.
                    </Typography>
                  ) : (
                    topConsumos.map((row, index) => (
                      <Paper key={row.USUARIOID} sx={{ p: 2, borderRadius: 3 }}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          spacing={2}
                        >
                          <Box>
                            <Typography fontWeight={900}>
                              {index === 0
                                ? "🥇"
                                : index === 1
                                  ? "🥈"
                                  : index === 2
                                    ? "🥉"
                                    : "🏅"}{" "}
                              {row.NOMBRE}
                            </Typography>
                            <Typography color="text.secondary" fontSize={14}>
                              No. empleado: {row.NUMERO_EMPLEADO ?? "-"}
                            </Typography>
                          </Box>

                          <Box textAlign="right">
                            <Typography fontWeight={900}>
                              {row.TOTAL_CONSUMOS} consumos
                            </Typography>
                          </Box>
                        </Stack>
                      </Paper>
                    ))
                  )}
                </Stack>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper
            sx={{
              p: 4,
              borderRadius: 4,
              background:
                "linear-gradient(135deg, rgba(255,255,255,.04), rgba(255,255,255,.02))",
              border: "1px solid rgba(255,255,255,.08)",
              backdropFilter: "blur(10px)",
              transition: "all .25s ease",
              "&:hover": {
                transform: "translateY(-4px)",
                transition: "all .25s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                },
              },
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Typography fontWeight={900}>
                Empleados que consumieron
              </Typography>

              <Button
                size="small"
                variant="outlined"
                onClick={exportEmpleadosConsumosDia}
              >
                Excel
              </Button>
            </Stack>

            {isMobile ? (
              <Stack
                spacing={1.5}
                sx={{ maxHeight: 420, overflowY: "auto", pr: 1 }}
              >
                {empleadosConsumosDia.length === 0 ? (
                  <Typography color="text.secondary">
                    No hay empleados que hayan consumido.
                  </Typography>
                ) : (
                  empleadosConsumosDia.map((row, index) => (
                    <Paper
                      key={`${row.USUARIOID}-${row.FECHA}`}
                      variant="outlined"
                      sx={{ p: 2, borderRadius: 3 }}
                    >
                      <Typography fontWeight={900}>
                        {index + 1}. 🍽️ {row.NOMBRE}
                      </Typography>
                      <Typography variant="body2">
                        No.: {row.NUMERO_EMPLEADO ?? "-"}
                      </Typography>
                      <Typography variant="body2">
                        Comidas: {row.COMIDAS_CONSUMIDAS}
                      </Typography>
                    </Paper>
                  ))
                )}
              </Stack>
            ) : (
              <Box
                sx={{
                  maxHeight: 420,
                  overflowY: "auto",
                  overflowX: "auto",
                  pr: 1,
                }}
              >
                <Stack spacing={2}>
                  {empleadosConsumosDia.length === 0 ? (
                    <Typography color="text.secondary">
                      No hay empleados que hayan consumido.
                    </Typography>
                  ) : (
                    empleadosConsumosDia.map((row, index) => (
                      <Paper key={row.USUARIOID} sx={{ p: 2, borderRadius: 3 }}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          spacing={2}
                        >
                          <Box>
                            <Typography fontWeight={900}>
                              {index + 1}. 🍽️ {row.NOMBRE}
                            </Typography>
                            <Typography color="text.secondary" fontSize={14}>
                              No. empleado: {row.NUMERO_EMPLEADO ?? "-"}
                            </Typography>
                          </Box>

                          <Box textAlign="right">
                            <Typography fontWeight={900}>
                              {row.COMIDAS_CONSUMIDAS} comidas
                            </Typography>
                          </Box>
                        </Stack>
                      </Paper>
                    ))
                  )}
                </Stack>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
