import { useEffect, useState } from "react";
import { Box, Paper, Typography, Chip, CircularProgress } from "@mui/material";
import { useParams } from "react-router-dom";
import axios from "axios";

type SharedQRData = {
  QRID: number;
  QR_FOLIO: string;
  CANTIDAD_COMIDAS: number;
  NOMBRE_ORIGEN: string;
  ESTADO: "PENDIENTE" | "USADO" | "CANCELADO";
  FECHA_CREACION: string;
  FECHA_USO?: string;
};

export default function SharedQRPage() {
  const { token } = useParams();
  const [data, setData] = useState<SharedQRData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadQR = async () => {
    try {
      const res = await axios.get(`/api/comedor/qr-compartidos/publico/${token}`);
      setData(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQR();
  }, [token]);

  if (loading) {
    return (
      <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  if (!data) {
    return (
      <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center">
        <Typography>QR no encontrado</Typography>
      </Box>
    );
  }

  const pendiente = data.ESTADO === "PENDIENTE";

  return (
    <Box
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{
        background: "#0B0B0D",
        p: 2,
      }}
    >
      <Paper
        sx={{
          p: 4,
          width: "100%",
          maxWidth: 420,
          textAlign: "center",
          borderRadius: 4,
        }}
      >
        <Typography variant="h5" fontWeight={900}>
          Comida IPL compartida
        </Typography>

        <Typography mt={1} fontSize={14} color="text.secondary">
          {data.NOMBRE_ORIGEN} te compartió {data.CANTIDAD_COMIDAS} comida(s)
        </Typography>

        <Box mt={2}>
          {data.ESTADO === "PENDIENTE" && (
            <Chip label="Pendiente de usar" color="warning" />
          )}
          {data.ESTADO === "USADO" && (
            <Chip label="Ya fue usado" color="success" />
          )}
          {data.ESTADO === "CANCELADO" && (
            <Chip label="Cancelado" color="default" />
          )}
        </Box>

        {pendiente ? (
          <>
            <Box mt={3}>
              <img
                src={`/api/qr/image?tipo=USR-DYN&valor=${encodeURIComponent(
                  data.QR_FOLIO
                )}`}
                width={260}
                alt="QR compartido"
              />
            </Box>

            <Typography mt={2} fontSize={13} color="text.secondary">
              Presenta este QR en comedor. Solo puede usarse una vez.
            </Typography>
          </>
        ) : (
          <Typography mt={3} fontWeight={800}>
            Este QR ya no está disponible.
          </Typography>
        )}

        <Typography mt={2} fontSize={11} sx={{ wordBreak: "break-all" }}>
          {data.QR_FOLIO}
        </Typography>
      </Paper>
    </Box>
  );
}