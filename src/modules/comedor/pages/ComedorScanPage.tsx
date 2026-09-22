import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import KeyboardIcon from "@mui/icons-material/Keyboard";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import { Html5Qrcode } from "html5-qrcode";
import PageHeader from "../../../shared/components/PageHeader";
import { IPL } from "../../../shared/theme/theme";
import { consumirPorScan } from "../../../services/comedor";
import IplLogo from "../../../assets/logo ipl_BLANCO.png";

type ScanResult =
  | { kind: "success"; title: string; detail: string }
  | { kind: "error"; title: string; detail: string }
  | null;

const QR_REGION_ID = "ipl-comedor-qr-reader";

export default function ComedorScanPage() {
  const [numeroEmpleado, setNumeroEmpleado] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ScanResult>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const resetInput = () => {
    setNumeroEmpleado("");
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const stopCamera = async () => {
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }
      await scannerRef.current?.clear();
    } catch {
      // ignore
    }
    scannerRef.current = null;
    setCameraOpen(false);
  };

  const onConsumir = async (value?: string) => {
    const valor = (value ?? numeroEmpleado).trim();

    if (!valor || busy) return;

    const esQR = valor.startsWith("IPL|");

    setBusy(true);
    setResult(null);

    try {
      const res = await consumirPorScan({
        NUMERO_EMPLEADO: esQR ? "" : valor,
        QR_FOLIO: valor,
      });

      if (res?.ok) {
        setResult({
          kind: "success",
          title: "Consumo aprobado",
          detail: `${res.data.NOMBRE} • ${
            res.data.COMIDAS_DISPONIBLES !== undefined
              ? `Comidas restantes: ${res.data.COMIDAS_DISPONIBLES}`
              : `Comidas descontadas: ${res.data.COMIDAS_DESCONTADAS || 1}`
          }`,
        });
      } else {
        setResult({
          kind: "error",
          title: "No se pudo registrar",
          detail:
            res?.message || "Ocurrió un problema al registrar el consumo.",
        });
      }
    } catch (err: any) {
      const backendMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.response?.data?.msg ||
        err?.data?.message ||
        err?.message ||
        "Ocurrió un error inesperado.";

      setResult({
        kind: "error",
        title: "Operación rechazada",
        detail: backendMessage,
      });
    } finally {
      setBusy(false);
      resetInput();
    }
  };

  const startCamera = async () => {
    if (busy || cameraOpen) return;

    setResult(null);
    setCameraOpen(true);

    try {
      // Espera a que React renderice el contenedor
      await new Promise((resolve) => setTimeout(resolve, 300));

      const element = document.getElementById(QR_REGION_ID);
      if (!element) {
        throw new Error(`HTML Element with id=${QR_REGION_ID} not found`);
      }

      const cameras = await Html5Qrcode.getCameras();

      if (!cameras || cameras.length === 0) {
        throw new Error("No se detectó ninguna cámara.");
      }

      const scanner = new Html5Qrcode(QR_REGION_ID);
      scannerRef.current = scanner;

      const backCamera =
        cameras.find(
          (camera) =>
            camera.label.toLowerCase().includes("back") ||
            camera.label.toLowerCase().includes("rear") ||
            camera.label.toLowerCase().includes("environment"),
        ) ?? cameras[cameras.length - 1];

      await scanner.start(
        backCamera.id,
        {
          fps: 10,
          qrbox: { width: 240, height: 240 },
        },
        async (decodedText) => {
          await stopCamera();
          await onConsumir(decodedText);
        },
        () => {},
      );
    } catch (err: any) {
      console.error("Error cámara:", err);

      setResult({
        kind: "error",
        title: "No se pudo abrir la cámara",
        detail:
          err?.message ??
          "Verifica permisos de cámara en el navegador o usa HTTPS.",
      });

      setCameraOpen(false);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <Box>
      <PageHeader
        title="Comedor • Escaneo"
        subtitle="Punto de consumo para cocina • Sucursal San Luis Potosí."
      />

      <Stack spacing={3}>
        <Paper
          sx={{
            p: { xs: 2.5, md: 3.5 },
            borderRadius: 4,
            background: `linear-gradient(180deg, ${IPL.surface} 0%, ${IPL.bg} 100%)`,
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={3}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                component="img"
                src={IplLogo}
                alt="IPL"
                sx={{ height: 52, width: "auto" }}
              />
              <Box>
                <Typography variant="h5" fontWeight={900}>
                  Escanear QR del empleado
                </Typography>
                <Typography color="text.secondary">
                  El empleado solo presenta su QR. También puedes usar número
                  manual como respaldo.
                </Typography>
              </Box>
            </Stack>

            <Box
              sx={{
                px: 2,
                py: 1,
                borderRadius: 999,
                border: `1px solid ${IPL.border}`,
                backgroundColor: "rgba(241,136,0,.10)",
              }}
            >
              <Typography fontWeight={900} color="primary.main">
                SOLO SLP
              </Typography>
            </Box>
          </Stack>
        </Paper>

        <Paper sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 4 }}>
          <Stack spacing={3}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <QrCodeScannerIcon color="primary" />
              <Typography variant="h6" fontWeight={900}>
                Escaneo con cámara
              </Typography>
            </Stack>

            <Button
              variant="contained"
              startIcon={<CameraAltIcon />}
              onClick={startCamera}
              disabled={busy || cameraOpen}
              sx={{ py: 1.4, fontWeight: 900 }}
            >
              {cameraOpen ? "Cámara activa" : "Escanear QR"}
            </Button>

            {cameraOpen && (
              <Box
                sx={{
                  borderRadius: 3,
                  overflow: "hidden",
                  border: `1px solid ${IPL.border}`,
                  p: 1,
                  backgroundColor: "#000",
                }}
              >
                <Box id={QR_REGION_ID} sx={{ width: "100%", minHeight: 320 }} />
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={stopCamera}
                  sx={{ mt: 2 }}
                >
                  Cerrar cámara
                </Button>
              </Box>
            )}

            <Stack direction="row" spacing={1.5} alignItems="center">
              <KeyboardIcon color="primary" />
              <Typography variant="h6" fontWeight={900}>
                Respaldo manual
              </Typography>
            </Stack>

            <TextField
              label="Número de empleado"
              value={numeroEmpleado}
              onChange={(e) => setNumeroEmpleado(e.target.value)}
              inputRef={inputRef}
              fullWidth
              placeholder="Captura manual si el QR no se puede leer"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onConsumir(numeroEmpleado);
                }
              }}
            />

            <Button
              variant="outlined"
              startIcon={<RestaurantIcon />}
              onClick={() => onConsumir(numeroEmpleado)}
              disabled={busy}
              sx={{ py: 1.2, fontWeight: 900 }}
            >
              Descontar manualmente
            </Button>

            {busy && (
              <Alert severity="info" sx={{ borderRadius: 3 }}>
                Procesando...
              </Alert>
            )}

            {result && (
              <Alert
                severity={result.kind === "success" ? "success" : "error"}
                sx={{
                  py: 2,
                  borderRadius: 3,
                  "& .MuiAlert-message": { width: "100%" },
                }}
              >
                <Typography fontWeight={900} fontSize={22}>
                  {result.title}
                </Typography>
                <Typography mt={0.5} fontSize={16}>
                  {result.detail}
                </Typography>
              </Alert>
            )}
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
