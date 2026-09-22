import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import AddCardIcon from "@mui/icons-material/AddCard";
import SearchIcon from "@mui/icons-material/Search";
import PageHeader from "../../../shared/components/PageHeader";
import {
  getPaquetesComedor,
  type PaqueteComedor,
} from "../../../services/comedorPaquetes";
import {
  createRecarga,
  getEmpleadoComedor,
  getRecargas,
  deleteRecarga,
  type ComedorEmpleado,
} from "../../../services/comedor";
import {
  showSuccess,
  showError,
  confirmDelete,
} from "../../../shared/utils/swal";

export default function ComedorRecargasPage() {
  const [numeroEmpleado, setNumeroEmpleado] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [observaciones, setObservaciones] = useState("");
  const [empleado, setEmpleado] = useState<ComedorEmpleado | null>(null);
  const [busy, setBusy] = useState(false);
  const [paquetes, setPaquetes] = useState<PaqueteComedor[]>([]);
  const isMobile = useMediaQuery("(max-width:900px)");

  const [recargas, setRecargas] = useState<any[]>([]);
  const [filtro, setFiltro] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const formatFecha = (fecha: string) => {
    if (!fecha) return "-";
    return new Date(fecha.replace(" GMT", "")).toLocaleString("es-MX");
  };

  const formatMoney = (value: number) => {
    return Number(value || 0).toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
    });
  };

  const loadRecargas = async () => {
    try {
      const res = await getRecargas();
      if (res.ok) setRecargas(res.data ?? []);
    } catch {
      showError("No se pudo cargar el historial de recargas");
    }
  };

  const loadPaquetes = async () => {
    try {
      const data = await getPaquetesComedor();
      setPaquetes(data ?? []);
    } catch {
      showError("No se pudieron cargar los paquetes");
    }
  };

  useEffect(() => {
    loadRecargas();
    loadPaquetes();
  }, []);

  const onBuscar = async () => {
    setEmpleado(null);

    if (!numeroEmpleado.trim()) {
      showError("Captura el número de empleado");
      return;
    }

    try {
      const res = await getEmpleadoComedor(numeroEmpleado.trim());
      if (res.ok) {
        setEmpleado(res.data);
      } else {
        showError(res.message);
      }
    } catch (err: any) {
      showError(err?.response?.data?.message ?? "No se encontró el empleado");
    }
  };

  const onRecargar = async () => {
    if (!empleado) {
      showError("Primero busca un empleado");
      return;
    }

    setBusy(true);

    try {
      const res = await createRecarga({
        USUARIOID: empleado.USUARIOID,
        CANTIDAD_COMIDAS: Number(cantidad),
        OBSERVACIONES: observaciones,
      });

      if (res.ok) {
        showSuccess("Recarga realizada correctamente");

        setNumeroEmpleado("");
        setCantidad("1");
        setObservaciones("");
        setEmpleado(null);

        loadRecargas();
      } else {
        showError(res.message);
      }
    } catch (err: any) {
      showError(
        err?.response?.data?.message ?? "No se pudo realizar la recarga",
      );
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (id: number) => {
    const confirm = await confirmDelete(
      "Esta acción revertirá las comidas y el saldo de esta recarga. ¿Deseas continuar?",
      "Eliminar recarga",
    );

    if (!confirm) return;

    try {
      const res = await deleteRecarga(id);
      if (res.ok) {
        showSuccess("Recarga eliminada");
        loadRecargas();
      } else {
        showError(res.message);
      }
    } catch (err: any) {
      showError(
        err?.response?.data?.message ?? "No se pudo eliminar la recarga",
      );
    }
  };

  const recargasFiltradas = useMemo(() => {
    const texto = filtro.trim().toLowerCase();

    return recargas.filter((r) => {
      const empleadoTexto = [
        r.NOMBRE,
        r.NUMERO_EMPLEADO,
        r.USUARIOID,
        r.NOMBRE_USUARIO_RECARGA,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const cumpleTexto = !texto || empleadoTexto.includes(texto);

      const fecha = r.FECHA
        ? new Date(String(r.FECHA).replace(" GMT", ""))
        : null;

      const cumpleInicio =
        !fechaInicio || (fecha && fecha >= new Date(`${fechaInicio}T00:00:00`));

      const cumpleFin =
        !fechaFin || (fecha && fecha <= new Date(`${fechaFin}T23:59:59`));

      return cumpleTexto && cumpleInicio && cumpleFin;
    });
  }, [recargas, filtro, fechaInicio, fechaFin]);

  const cantidadNumero = Number(cantidad || 0);


  const montoPaquete = useMemo(() => {
    if (!empleado) return 0;

    if (cantidadNumero === 1) {
      return Number(empleado.PRECIO_NORMAL ?? empleado.PRECIO_VIGENTE ?? 0);
    }

    if (cantidadNumero === 10) {
      return Number(empleado.PRECIO_X10 ?? 0);
    }

    if (cantidadNumero === 20) {
      return Number(empleado.PRECIO_X20 ?? 0);
    }

    return 0;
  }, [empleado, cantidadNumero]);

  const costoUnitario = cantidadNumero > 0 ? montoPaquete / cantidadNumero : 0;

  const subtotal = montoPaquete;
  const total = montoPaquete;

  return (
    <Box>
      <PageHeader
        title="Recargas"
        subtitle="Recarga de comidas para empleados."
      />

      <Stack spacing={3}>
        <Paper sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 4 }}>
          <Stack spacing={2.5}>
            <Typography fontWeight={900}>Buscar empleado</Typography>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Número de empleado"
                value={numeroEmpleado}
                onChange={(e) => setNumeroEmpleado(e.target.value)}
                fullWidth
              />

              <Button
                variant="outlined"
                onClick={onBuscar}
                startIcon={<SearchIcon />}
                sx={{ minWidth: { md: 160 } }}
              >
                Buscar
              </Button>
            </Stack>

            {empleado && (
              <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                <Typography fontWeight={900}>{empleado.NOMBRE}</Typography>

                <Typography>Número: {empleado.NUMERO_EMPLEADO}</Typography>

                <Typography>
                  Tipo empleado: {empleado.TIPO_EMPLEADO_NOMBRE ?? "-"}
                </Typography>

                <Typography>
                  Precio por comida: {formatMoney(empleado.PRECIO_VIGENTE ?? 0)}
                </Typography>

                <Typography>Comidas: {empleado.COMIDAS_DISPONIBLES}</Typography>

                <Typography>Saldo: {formatMoney(empleado.SALDO)}</Typography>
              </Paper>
            )}

            <TextField
              label="Paquete de comidas"
              select
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
            >
              {paquetes.map((p) => (
                <MenuItem key={p.PAQUETEID} value={String(p.CANTIDAD_COMIDAS)}>
                  {p.NOMBRE}
                  {Number(p.PORCENTAJE_DESCUENTO) > 0
                    ? ` - ${p.PORCENTAJE_DESCUENTO}% descuento`
                    : ""}
                </MenuItem>
              ))}
            </TextField>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
              <Typography fontWeight={900}>Resumen de recarga</Typography>

              <Typography color="text.secondary">
                Cantidad: {cantidadNumero} comida(s)
              </Typography>

              <Typography color="text.secondary">
                Precio unitario: {formatMoney(costoUnitario)}
              </Typography>

              <Typography color="text.secondary">
                Subtotal: {formatMoney(subtotal)}
              </Typography>

              <Typography fontWeight={900} fontSize={20}>
                Total: {formatMoney(total)}
              </Typography>
            </Paper>

            <TextField
              label="Observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />

            <Button
              variant="contained"
              onClick={onRecargar}
              disabled={busy}
              startIcon={<AddCardIcon />}
            >
              {busy ? "Procesando..." : "Recargar"}
            </Button>
          </Stack>
        </Paper>

        <Paper sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 4 }}>
          <Stack spacing={2}>
            <Typography fontWeight={900}>Historial de recargas</Typography>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Buscar empleado, número o usuario"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                fullWidth
              />

              <TextField
                label="Fecha inicio"
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: { md: 180 } }}
              />

              <TextField
                label="Fecha fin"
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: { md: 180 } }}
              />
            </Stack>

            {isMobile ? (
              <Stack spacing={2}>
                {recargasFiltradas.length === 0 ? (
                  <Paper sx={{ p: 2 }}>
                    <Typography color="text.secondary">
                      No se encontraron recargas.
                    </Typography>
                  </Paper>
                ) : (
                  recargasFiltradas.map((r) => (
                    <Paper
                      key={r.RECARGAID}
                      sx={{
                        p: 2,
                        borderRadius: 3,
                      }}
                    >
                      <Stack spacing={1}>
                        <Typography fontWeight={900}>
                          {r.NOMBRE ?? "-"}
                        </Typography>

                        <Typography variant="body2">
                          Empleado: {r.NUMERO_EMPLEADO ?? "-"}
                        </Typography>

                        <Typography variant="body2">
                          Comidas: {r.CANTIDAD_COMIDAS}
                        </Typography>

                        <Typography variant="body2">
                          Unitario: {formatMoney(r.COSTO_UNITARIO)}
                        </Typography>

                        <Typography variant="body2">
                          Descuento: {formatMoney(r.DESCUENTO_APLICADO)}
                        </Typography>

                        <Typography fontWeight={800}>
                          Total: {formatMoney(r.MONTO_TOTAL)}
                        </Typography>

                        <Typography variant="body2">
                          Recargó: {r.NOMBRE_USUARIO_RECARGA ?? "-"}
                        </Typography>

                        <Typography variant="body2">
                          Fecha: {formatFecha(r.FECHA)}
                        </Typography>

                        <Button
                          color="error"
                          variant="outlined"
                          onClick={() => onDelete(r.RECARGAID)}
                        >
                          Eliminar
                        </Button>
                      </Stack>
                    </Paper>
                  ))
                )}
              </Stack>
            ) : (
              <Box sx={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    minWidth: 1200,
                    borderCollapse: "collapse",
                  }}
                >
                  <thead>
                    <tr style={{ textAlign: "left" }}>
                      <th style={{ padding: "12px 10px" }}>ID</th>
                      <th style={{ padding: "12px 10px" }}>Empleado</th>
                      <th style={{ padding: "12px 10px" }}>No. empleado</th>
                      <th style={{ padding: "12px 10px" }}>Comidas</th>
                      <th style={{ padding: "12px 10px" }}>Unitario</th>
                      <th style={{ padding: "12px 10px" }}>Descuento</th>
                      <th style={{ padding: "12px 10px" }}>Monto</th>
                      <th style={{ padding: "12px 10px" }}>Recargó</th>
                      <th style={{ padding: "12px 10px" }}>Fecha</th>
                      <th style={{ padding: "12px 10px", textAlign: "right" }}>
                        Acciones
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {recargasFiltradas.length === 0 ? (
                      <tr>
                        <td
                          colSpan={10}
                          style={{
                            padding: "16px 10px",
                            color: "#A1A1AA",
                          }}
                        >
                          No se encontraron recargas.
                        </td>
                      </tr>
                    ) : (
                      recargasFiltradas.map((r) => (
                        <tr
                          key={r.RECARGAID}
                          style={{
                            borderTop: "1px solid rgba(255,255,255,.08)",
                          }}
                        >
                          <td style={{ padding: "12px 10px" }}>
                            {r.RECARGAID}
                          </td>

                          <td style={{ padding: "12px 10px" }}>
                            {r.NOMBRE ?? "-"}
                          </td>

                          <td style={{ padding: "12px 10px" }}>
                            {r.NUMERO_EMPLEADO ?? "-"}
                          </td>

                          <td style={{ padding: "12px 10px" }}>
                            {r.CANTIDAD_COMIDAS}
                          </td>

                          <td style={{ padding: "12px 10px" }}>
                            {formatMoney(r.COSTO_UNITARIO)}
                          </td>

                          <td style={{ padding: "12px 10px" }}>
                            {formatMoney(r.DESCUENTO_APLICADO)}
                          </td>

                          <td style={{ padding: "12px 10px" }}>
                            {formatMoney(r.MONTO_TOTAL)}
                          </td>

                          <td style={{ padding: "12px 10px" }}>
                            {r.NOMBRE_USUARIO_RECARGA ?? "-"}
                          </td>

                          <td style={{ padding: "12px 10px" }}>
                            {formatFecha(r.FECHA)}
                          </td>

                          <td
                            style={{
                              padding: "12px 10px",
                              textAlign: "right",
                            }}
                          >
                            <Button
                              color="error"
                              onClick={() => onDelete(r.RECARGAID)}
                            >
                              Eliminar
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </Box>
            )}
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
