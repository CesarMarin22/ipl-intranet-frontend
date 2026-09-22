import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  LinearProgress,
  Button,
  Stack,
  TextField,
  Divider,
  Chip,
} from "@mui/material";
import axios from "axios";
import Swal from "sweetalert2";
type SharedQR = {
  QRID: number;
  QR_FOLIO: string;
  CANTIDAD_COMIDAS: number;
  USADO: number;
  CANCELADO: number;
  EXPIRADO?: number;
  DEVUELTO?: number;
  FECHA_CREACION: string;
  FECHA_USO?: string;
  FECHA_EXPIRACION?: string;
  OBSERVACIONES?: string;
};

export default function MyQRPage() {
  const [qr, setQr] = useState("");
  const [time, setTime] = useState(60);

  const [sharedQR, setSharedQR] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [observaciones, setObservaciones] = useState("");
  const [sharedList, setSharedList] = useState<SharedQR[]>([]);
  const [loadingShare, setLoadingShare] = useState(false);
  const [sharedQRExpiration, setSharedQRExpiration] = useState("");

  const getBackMessage = (error: any, fallback: string) => {
    return (
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.response?.data?.msg ||
      fallback
    );
  };

  const loadQR = async () => {
    try {
      const res = await axios.get("/api/qr/usuario/dinamico");
      setQr(res.data.data.qr_string);
      setTime(res.data.data.expira_en_segundos);
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error al cargar QR",
        text: getBackMessage(error, "No se pudo cargar tu QR dinámico."),
        confirmButtonText: "Entendido",
      });
    }
  };

  const loadSharedQRs = async () => {
    try {
      const res = await axios.get("/api/comedor/qr-compartidos/mis");
      setSharedList(res.data.data || []);
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error al cargar QR compartidos",
        text: getBackMessage(
          error,
          "No se pudieron cargar tus QR compartidos.",
        ),
        confirmButtonText: "Entendido",
      });
    }
  };

  const generateSharedQR = async () => {
    try {
      setLoadingShare(true);

      const res = await axios.post("/api/comedor/qr-compartidos", {
        CANTIDAD_COMIDAS: cantidad,
        OBSERVACIONES: observaciones,
      });

      setSharedQR(res.data.data.QR_FOLIO);
      setSharedQRExpiration(res.data.data.FECHA_EXPIRACION || "Hoy 23:59:59");
      setObservaciones("");
      await loadSharedQRs();

      Swal.fire({
        icon: "success",
        title: "QR generado",
        text: res.data.message || "El QR compartido se generó correctamente.",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (error: any) {
      Swal.fire({
        icon: "warning",
        title: "No se pudo generar el QR",
        text: getBackMessage(
          error,
          "No tienes comidas disponibles o ocurrió un error al generar el QR.",
        ),
        confirmButtonText: "Entendido",
      });
    } finally {
      setLoadingShare(false);
    }
  };

  const cancelSharedQR = async (qrId: number) => {
    try {
      const currentQr = sharedList.find((x) => x.QRID === qrId);

      const result = await Swal.fire({
        icon: "warning",
        title: "¿Cancelar QR?",
        text: "Se cancelará el QR y se devolverá la comida.",
        showCancelButton: true,
        confirmButtonText: "Sí, cancelar",
        cancelButtonText: "No",
        confirmButtonColor: "#d33",
      });

      if (!result.isConfirmed) return;

      const res = await axios.post(
        `/api/comedor/qr-compartidos/${qrId}/cancelar`,
      );

      await loadSharedQRs();

      if (currentQr?.QR_FOLIO === sharedQR) {
        setSharedQR("");
      }

      Swal.fire({
        icon: "success",
        title: "QR cancelado",
        text: res.data.message || "El QR fue cancelado correctamente.",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "No se pudo cancelar",
        text: getBackMessage(error, "Ocurrió un error al cancelar el QR."),
        confirmButtonText: "Entendido",
      });
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadQR();
      loadSharedQRs();
    }, 0);

    const qrInterval = setInterval(() => {
      loadQR();
    }, 60000);

    const timer = setInterval(() => {
      setTime((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      clearTimeout(timeout);
      clearInterval(qrInterval);
      clearInterval(timer);
    };
  }, []);

  return (
    <Box>
      <Typography variant="h5" fontWeight={900}>
        QR de Comedor
      </Typography>

      <Paper sx={{ p: 3, mt: 2, textAlign: "center" }}>
        <Typography fontWeight={800} mb={2}>
          Mi QR dinámico
        </Typography>

        {qr && (
          <img
            src={`/api/qr/image?tipo=USR-DYN&valor=${encodeURIComponent(qr)}`}
            width={250}
          />
        )}

        <LinearProgress
          variant="determinate"
          value={(time / 60) * 100}
          sx={{ mt: 2 }}
        />

        <Typography mt={1} fontSize={12}>
          Expira en {time}s
        </Typography>
      </Paper>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" fontWeight={900}>
          Compartir comida
        </Typography>

        <Typography fontSize={13} color="text.secondary" mt={1}>
          Al generar este QR se apartará la comida de tu saldo. El QR vence al
          final del día. Si no se usa antes de vencer, la comida será devuelta
          automáticamente.
        </Typography>

        <Stack spacing={2} mt={2}>
          <TextField
            label="Cantidad de comidas"
            type="number"
            value={cantidad}
            onChange={(e) => setCantidad(Number(e.target.value))}
            inputProps={{ min: 1 }}
          />

          <TextField
            label="Observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Ej. Para Juan"
          />

          <Button
            variant="contained"
            onClick={generateSharedQR}
            disabled={loadingShare || cantidad <= 0}
          >
            {loadingShare ? "Generando..." : "Generar QR compartido"}
          </Button>
        </Stack>

        {sharedQR && (
          <Box textAlign="center" mt={3}>
            <Typography fontWeight={800} mb={2}>
              QR compartido generado
            </Typography>

            <Box>
              <img
                src={`/api/qr/image?tipo=USR-DYN&valor=${encodeURIComponent(sharedQR)}`}
                width={250}
                alt="QR compartido"
              />
            </Box>

            {sharedQRExpiration && (
              <Typography
                fontSize={13}
                mt={1}
                color="warning.main"
                fontWeight={800}
              >
                Válido hasta: {sharedQRExpiration}
              </Typography>
            )}

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              justifyContent="center"
              alignItems="center"
              mt={2}
            >
              <Button
                variant="contained"
                sx={{ backgroundColor: "#25D366", color: "#fff" }}
                onClick={() => {
                  const token = sharedQR.replace("IPL|SHARE|", "");
                  const shareUrl = `${window.location.origin}/shared-qr/${token}`;

                  const text = `Te comparto una comida IPL 🍽️

Abre este enlace y presenta el QR en comedor:

${shareUrl}

Este QR solo puede usarse una vez y vence hoy a las 23:59:59.`;

                  window.open(
                    `https://wa.me/?text=${encodeURIComponent(text)}`,
                    "_blank",
                  );
                }}
              >
                Compartir por WhatsApp
              </Button>

              <Button
                variant="outlined"
                onClick={async () => {
                  const imageUrl = `/api/qr/image?tipo=USR-DYN&valor=${encodeURIComponent(sharedQR)}`;

                  const response = await fetch(imageUrl);
                  const blob = await response.blob();

                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");

                  a.href = url;
                  a.download = "qr-compartido.png";
                  a.click();

                  window.URL.revokeObjectURL(url);
                }}
              >
                Descargar QR
              </Button>
            </Stack>

            <Typography fontSize={12} mt={1} sx={{ wordBreak: "break-all" }}>
              {sharedQR}
            </Typography>
          </Box>
        )}
      </Paper>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" fontWeight={900}>
          Mis QR compartidos
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Stack spacing={2}>
          {sharedList.length === 0 && (
            <Typography fontSize={13} color="text.secondary">
              No tienes QR compartidos.
            </Typography>
          )}

          {sharedList.map((item) => {
            const usado = Number(item.USADO) === 1;
            const cancelado = Number(item.CANCELADO) === 1;
            const expirado = Number(item.EXPIRADO) === 1;
            const devuelto = Number(item.DEVUELTO) === 1;
            const pendiente = !usado && !cancelado && !expirado;

            return (
              <Paper key={item.QRID} variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography fontWeight={800}>QR #{item.QRID}</Typography>

                    {usado && (
                      <Chip label="Usado" color="success" size="small" />
                    )}
                    {cancelado && (
                      <Chip label="Cancelado" color="default" size="small" />
                    )}
                    {pendiente && (
                      <Chip label="Pendiente" color="warning" size="small" />
                    )}
                    {expirado && (
                      <Chip
                        label={devuelto ? "Expirado / Devuelto" : "Expirado"}
                        color="error"
                        size="small"
                      />
                    )}
                  </Stack>

                  <Typography fontSize={13}>
                    Comidas: {item.CANTIDAD_COMIDAS}
                  </Typography>

                  {item.FECHA_EXPIRACION && (
                    <Typography fontSize={13} color="warning.main">
                      Expira: {item.FECHA_EXPIRACION}
                    </Typography>
                  )}

                  {item.OBSERVACIONES && (
                    <Typography fontSize={13}>
                      Obs: {item.OBSERVACIONES}
                    </Typography>
                  )}

                  <Typography fontSize={12} color="text.secondary">
                    {item.QR_FOLIO}
                  </Typography>

                  {pendiente && (
                    <Button
                      color="error"
                      variant="outlined"
                      onClick={() => cancelSharedQR(item.QRID)}
                    >
                      Cancelar y devolver comida
                    </Button>
                  )}
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      </Paper>
    </Box>
  );
}
