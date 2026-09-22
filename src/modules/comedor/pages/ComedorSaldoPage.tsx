import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Chip,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import BadgeIcon from "@mui/icons-material/Badge";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import HistoryIcon from "@mui/icons-material/History";
import ShareIcon from "@mui/icons-material/Share";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

import PageHeader from "../../../shared/components/PageHeader";
import LoaderOverlay from "../../../shared/components/LoaderOverlay";
import { getMiSaldo } from "../../../services/comedor";

function formatearFecha(fecha?: string | null) {
  if (!fecha) return "Sin información";

  const fechaLimpia = String(fecha).slice(0, 10);
  const partes = fechaLimpia.split("-");

  if (partes.length !== 3) {
    return fechaLimpia;
  }

  const [anio, mes, dia] = partes;

  return `${dia}/${mes}/${anio}`;
}

function formatearHora(hora?: string | null) {
  if (!hora) return "";

  return String(hora).slice(0, 5);
}

export default function ComedorSaldoPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["comedor-mi-saldo"],
    queryFn: getMiSaldo,
  });

  const resumen = data?.data;

  return (
    <Box>
      {isLoading && <LoaderOverlay label="Cargando tus comidas..." />}

      <PageHeader
        title="Mis comidas"
        subtitle="Consulta tus comidas disponibles y actividad reciente."
      />

      {isError && (
        <Alert severity="error">
          No se pudo consultar la información de tus comidas.
        </Alert>
      )}

      {resumen && (
        <Stack spacing={3}>
          <Paper sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 4 }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <BadgeIcon color="primary" />

                <Typography variant="h6" fontWeight={900}>
                  Información del colaborador
                </Typography>
              </Stack>

              <Stack spacing={1}>
                <Typography>
                  <strong>Nombre:</strong> {resumen.NOMBRE}
                </Typography>

                <Typography>
                  <strong>Número de empleado:</strong>{" "}
                  {resumen.NUMERO_EMPLEADO}
                </Typography>
              </Stack>
            </Stack>
          </Paper>

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <Paper
                sx={{
                  height: "100%",
                  p: 3,
                  borderRadius: 4,
                }}
              >
                <Stack spacing={1.5}>
                  <RestaurantMenuIcon
                    color="primary"
                    sx={{ fontSize: 34 }}
                  />

                  <Typography color="text.secondary" fontWeight={700}>
                    Comidas disponibles
                  </Typography>

                  <Typography
                    variant="h3"
                    color="primary.main"
                    fontWeight={900}
                  >
                    {resumen.COMIDAS_DISPONIBLES}
                  </Typography>
                </Stack>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <Paper
                sx={{
                  height: "100%",
                  p: 3,
                  borderRadius: 4,
                }}
              >
                <Stack spacing={1.5}>
                  <HistoryIcon
                    color="success"
                    sx={{ fontSize: 34 }}
                  />

                  <Typography color="text.secondary" fontWeight={700}>
                    Consumidas este mes
                  </Typography>

                  <Typography variant="h3" fontWeight={900}>
                    {resumen.CONSUMIDAS_MES}
                  </Typography>
                </Stack>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <Paper
                sx={{
                  height: "100%",
                  p: 3,
                  borderRadius: 4,
                }}
              >
                <Stack spacing={1.5}>
                  <ShareIcon
                    color="warning"
                    sx={{ fontSize: 34 }}
                  />

                  <Typography color="text.secondary" fontWeight={700}>
                    Compartidas activas
                  </Typography>

                  <Typography variant="h3" fontWeight={900}>
                    {resumen.COMPARTIDAS_ACTIVAS}
                  </Typography>
                </Stack>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <Paper
                sx={{
                  height: "100%",
                  p: 3,
                  borderRadius: 4,
                }}
              >
                <Stack spacing={1.5}>
                  <ShareIcon
                    color="info"
                    sx={{ fontSize: 34 }}
                  />

                  <Typography color="text.secondary" fontWeight={700}>
                    Compartidas este mes
                  </Typography>

                  <Typography variant="h3" fontWeight={900}>
                    {resumen.COMPARTIDAS_MES}
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                sx={{
                  height: "100%",
                  p: 3,
                  borderRadius: 4,
                }}
              >
                <Stack spacing={2}>
                  <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                  >
                    <AddCircleOutlineIcon color="primary" />

                    <Typography variant="h6" fontWeight={900}>
                      Última recarga
                    </Typography>
                  </Stack>

                  {resumen.ULTIMA_RECARGA ? (
                    <Stack spacing={1}>
                      <Typography>
                        <strong>Fecha:</strong>{" "}
                        {formatearFecha(
                          resumen.ULTIMA_RECARGA.FECHA,
                        )}
                      </Typography>

                      <Typography>
                        <strong>Hora:</strong>{" "}
                        {formatearHora(
                          resumen.ULTIMA_RECARGA.HORA,
                        )}
                      </Typography>

                      <Typography>
                        <strong>Comidas agregadas:</strong>{" "}
                        {resumen.ULTIMA_RECARGA.COMIDAS_AGREGADAS}
                      </Typography>
                    </Stack>
                  ) : (
                    <Typography color="text.secondary">
                      No se encontraron recargas.
                    </Typography>
                  )}
                </Stack>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                sx={{
                  height: "100%",
                  p: 3,
                  borderRadius: 4,
                }}
              >
                <Stack spacing={2}>
                  <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                  >
                    <CalendarMonthIcon color="primary" />

                    <Typography variant="h6" fontWeight={900}>
                      Último consumo
                    </Typography>
                  </Stack>

                  {resumen.ULTIMO_CONSUMO ? (
                    <Stack spacing={1}>
                      <Typography>
                        <strong>Fecha:</strong>{" "}
                        {formatearFecha(
                          resumen.ULTIMO_CONSUMO.FECHA,
                        )}
                      </Typography>

                      <Typography>
                        <strong>Hora:</strong>{" "}
                        {formatearHora(
                          resumen.ULTIMO_CONSUMO.HORA,
                        )}
                      </Typography>

                      <Box>
                        <Chip
                          size="small"
                          color={
                            resumen.ULTIMO_CONSUMO.TIPO ===
                            "COMPARTIDA"
                              ? "warning"
                              : "success"
                          }
                          label={
                            resumen.ULTIMO_CONSUMO.TIPO ===
                            "COMPARTIDA"
                              ? "Comida compartida"
                              : "Consumo personal"
                          }
                        />
                      </Box>
                    </Stack>
                  ) : (
                    <Typography color="text.secondary">
                      No se encontraron consumos.
                    </Typography>
                  )}
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Stack>
      )}
    </Box>
  );
}