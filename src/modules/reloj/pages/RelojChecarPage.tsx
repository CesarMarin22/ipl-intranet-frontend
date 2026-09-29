import { Alert, Box, Button, Chip, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";
import GpsNotFixedIcon from "@mui/icons-material/GpsNotFixed";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PageHeader from "../../../shared/components/PageHeader";
import LoaderOverlay from "../../../shared/components/LoaderOverlay";
import { showError } from "../../../shared/utils/swal";
import { IPL } from "../../../shared/theme/theme";
import {
  RelojService,
  diaCorto,
  estadoDia,
  hora,
  minutosTexto,
  type ResultadoChecada,
} from "../../../services/reloj";

type Posicion = { lat: number; lng: number; precision: number; momento: number };

// Una lectura de GPS más vieja que esto se vuelve a pedir al checar
const GPS_VIGENCIA_MS = 30_000;
const FOTO_ANCHO = 480;

function pedirPosicion(): Promise<Posicion> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (p) =>
        resolve({
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          precision: p.coords.accuracy,
          momento: Date.now(),
        }),
      (e) => reject(e),
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 },
    );
  });
}

function mensajeGps(e: GeolocationPositionError | unknown) {
  const code = (e as GeolocationPositionError)?.code;
  if (code === 1) return "Diste permiso denegado a la ubicación. Actívalo en la configuración del navegador para poder checar.";
  if (code === 3) return "El GPS tardó demasiado. Sal a un lugar abierto o activa la ubicación precisa e intenta de nuevo.";
  return "No se pudo obtener tu ubicación. Verifica que el GPS esté encendido.";
}

export default function RelojChecarPage() {
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [camaraLista, setCamaraLista] = useState(false);
  const [errorCamara, setErrorCamara] = useState<string | null>(null);
  const [posicion, setPosicion] = useState<Posicion | null>(null);
  const [errorGps, setErrorGps] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoChecada | null>(null);
  const [reloj, setReloj] = useState(new Date());

  const seguro = window.isSecureContext;

  const { data, isLoading } = useQuery({
    queryKey: ["reloj-mi-estado"],
    queryFn: RelojService.miEstado,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    const t = setInterval(() => setReloj(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const iniciarCamara = useCallback(async () => {
    setErrorCamara(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorCamara("Este navegador no permite usar la cámara.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setCamaraLista(true);
    } catch {
      setErrorCamara("No se pudo abrir la cámara. Da permiso de cámara al navegador para poder checar.");
    }
  }, []);

  useEffect(() => {
    if (!seguro) return;
    iniciarCamara();
    let watch: number | null = null;
    if (navigator.geolocation) {
      watch = navigator.geolocation.watchPosition(
        (p) => {
          setErrorGps(null);
          setPosicion({
            lat: p.coords.latitude,
            lng: p.coords.longitude,
            precision: p.coords.accuracy,
            momento: Date.now(),
          });
        },
        (e) => setErrorGps(mensajeGps(e)),
        { enableHighAccuracy: true, maximumAge: 10_000, timeout: 30_000 },
      );
    } else {
      setErrorGps("Este navegador no permite obtener la ubicación.");
    }
    return () => {
      if (watch !== null) navigator.geolocation.clearWatch(watch);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [seguro, iniciarCamara]);

  const tomarFoto = (): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const video = videoRef.current;
      if (!video || !video.videoWidth) {
        reject(new Error("La cámara no está lista"));
        return;
      }
      const escala = FOTO_ANCHO / video.videoWidth;
      const canvas = document.createElement("canvas");
      canvas.width = FOTO_ANCHO;
      canvas.height = Math.round(video.videoHeight * escala);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("No se pudo procesar la foto"));
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo procesar la foto"))), "image/jpeg", 0.75);
    });

  const checar = async (tipo: "ENTRADA" | "SALIDA") => {
    setResultado(null);
    setEnviando(true);
    try {
      const foto = await tomarFoto();
      let pos = posicion;
      if (!pos || Date.now() - pos.momento > GPS_VIGENCIA_MS) {
        try {
          pos = await pedirPosicion();
          setPosicion(pos);
        } catch (e) {
          throw new Error(mensajeGps(e));
        }
      }
      const res = await RelojService.checar({
        tipo,
        latitud: pos.lat,
        longitud: pos.lng,
        precision: Math.round(pos.precision),
        foto,
      });
      setResultado(res.data);
      await queryClient.invalidateQueries({ queryKey: ["reloj-mi-estado"] });
    } catch (e) {
      showError(e instanceof Error ? e.message : "No se pudo registrar la checada");
    } finally {
      setEnviando(false);
    }
  };

  if (!seguro) {
    return (
      <Box sx={{ width: "100%" }}>
        <PageHeader title="Checar" />
        <Alert severity="error">
          El checador necesita una conexión segura (HTTPS) para usar la cámara y el GPS del celular.
          Entra a la intranet con su dirección https:// o avisa a Sistemas.
        </Alert>
      </Box>
    );
  }

  const hoy = data?.HOY;
  const sugerido = data?.SUGERIDO ?? "ENTRADA";
  const gpsBueno = posicion && posicion.precision <= 150;
  const puedeChecar = camaraLista && !enviando;

  const boton = (tipo: "ENTRADA" | "SALIDA") => {
    const principal = tipo === sugerido;
    return (
      <Button
        fullWidth
        size="large"
        variant={principal ? "contained" : "outlined"}
        color={tipo === "ENTRADA" ? "primary" : "inherit"}
        startIcon={tipo === "ENTRADA" ? <LoginIcon /> : <LogoutIcon />}
        disabled={!puedeChecar}
        onClick={() => checar(tipo)}
        sx={{ py: principal ? 2 : 1.4, fontSize: principal ? 18 : 15 }}
      >
        {tipo === "ENTRADA" ? "Registrar entrada" : "Registrar salida"}
      </Button>
    );
  };

  return (
    <Box sx={{ width: "100%", maxWidth: 560, mx: "auto" }}>
      {isLoading && <LoaderOverlay label="Cargando..." />}

      <PageHeader title="Checar" subtitle={data?.EMPLEADO.NOMBRE} />

      <Paper sx={{ p: 2, mb: 2, textAlign: "center" }}>
        <Typography variant="h3" fontWeight={900} sx={{ fontVariantNumeric: "tabular-nums" }}>
          {reloj.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </Typography>
        <Typography color="text.secondary" sx={{ textTransform: "capitalize" }}>
          {reloj.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
        </Typography>
        {hoy && (
          <Typography sx={{ mt: 1 }} fontWeight={700}>
            {hoy.HORARIO
              ? `Tu horario hoy: ${hoy.HORARIO.HORA_ENTRADA} a ${hoy.HORARIO.HORA_SALIDA} (tolerancia ${hoy.HORARIO.TOLERANCIA_MIN} min)`
              : "Hoy no tienes horario programado"}
          </Typography>
        )}
      </Paper>

      <Paper sx={{ p: 1.5, mb: 2 }}>
        <Box
          sx={{
            position: "relative",
            width: "100%",
            aspectRatio: "4 / 3",
            borderRadius: 2,
            overflow: "hidden",
            bgcolor: "#000",
          }}
        >
          <video
            ref={videoRef}
            playsInline
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
          />
          {!camaraLista && (
            <Stack alignItems="center" justifyContent="center" spacing={1} sx={{ position: "absolute", inset: 0, p: 2 }}>
              {errorCamara ? (
                <>
                  <Typography color="error" textAlign="center">{errorCamara}</Typography>
                  <Button variant="outlined" startIcon={<CameraAltIcon />} onClick={iniciarCamara}>
                    Reintentar cámara
                  </Button>
                </>
              ) : (
                <CircularProgress />
              )}
            </Stack>
          )}
          {enviando && (
            <Stack alignItems="center" justifyContent="center" sx={{ position: "absolute", inset: 0, bgcolor: "rgba(0,0,0,.55)" }}>
              <CircularProgress />
              <Typography sx={{ mt: 1 }}>Registrando...</Typography>
            </Stack>
          )}
        </Box>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.2 }}>
          {gpsBueno ? <GpsFixedIcon color="success" fontSize="small" /> : <GpsNotFixedIcon color="warning" fontSize="small" />}
          <Typography variant="body2" color={errorGps ? "error" : "text.secondary"}>
            {errorGps
              ? errorGps
              : posicion
                ? `Ubicación lista (precisión ±${Math.round(posicion.precision)} m)`
                : "Buscando tu ubicación..."}
          </Typography>
        </Stack>
        {data?.DISPOSITIVO_ESTADO === "PENDIENTE" && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            Este celular no es tu dispositivo registrado. Tus checadas desde aquí quedarán para revisión del REV.
          </Alert>
        )}
        {data?.DISPOSITIVO_ESTADO === "REVOCADO" && (
          <Alert severity="error" sx={{ mt: 1 }}>
            Este celular fue dado de baja para checar. Tus checadas desde aquí quedarán para revisión.
          </Alert>
        )}
      </Paper>

      <Stack spacing={1.2} sx={{ mb: 2 }}>
        {sugerido === "ENTRADA" ? (
          <>
            {boton("ENTRADA")}
            {boton("SALIDA")}
          </>
        ) : (
          <>
            {boton("SALIDA")}
            {boton("ENTRADA")}
          </>
        )}
      </Stack>

      {resultado && (
        <Alert severity={resultado.BANDERAS.length ? "warning" : "success"} sx={{ mb: 2 }}>
          <Typography fontWeight={900}>
            {resultado.TIPO === "ENTRADA" ? "Entrada" : "Salida"} registrada a las {hora(resultado.FECHA_HORA)}
          </Typography>
          {resultado.UBICACION_NOMBRE && (
            <Typography variant="body2">
              {resultado.UBICACION_NOMBRE}
              {resultado.DISTANCIA_M != null ? ` · a ${resultado.DISTANCIA_M} m` : ""}
            </Typography>
          )}
          {resultado.BANDERAS_TEXTO.length > 0 && (
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Quedó marcada para revisión del REV: {resultado.BANDERAS_TEXTO.join(", ")}.
            </Typography>
          )}
        </Alert>
      )}

      {hoy && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography fontWeight={900} sx={{ mb: 1 }}>Hoy</Typography>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Chip label={estadoDia(hoy.ESTADO).label} sx={{ bgcolor: estadoDia(hoy.ESTADO).color, color: "#fff", fontWeight: 800 }} />
            <Typography variant="body2">Entrada {hora(hoy.ENTRADA)} · Salida {hora(hoy.SALIDA)}</Typography>
          </Stack>
          {data.CHECADAS_RECIENTES.length > 0 && (
            <Stack spacing={0.5} sx={{ mt: 1.5 }}>
              {data.CHECADAS_RECIENTES.map((c) => (
                <Typography key={c.CHECADAID} variant="body2" color="text.secondary">
                  {c.FECHA_HORA.slice(0, 10)} {hora(c.FECHA_HORA)} · {c.TIPO === "ENTRADA" ? "Entrada" : "Salida"}
                  {c.UBICACION_NOMBRE ? ` · ${c.UBICACION_NOMBRE}` : ""}
                  {c.REVISION === "RECHAZADA" ? " · Rechazada por el REV" : c.BANDERAS ? " · En revisión" : ""}
                </Typography>
              ))}
            </Stack>
          )}
        </Paper>
      )}

      {data && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography fontWeight={900} sx={{ mb: 1 }}>Últimos 7 días</Typography>
          <Stack spacing={0.8}>
            {[...data.SEMANA].reverse().map((d) => {
              const e = estadoDia(d.ESTADO);
              return (
                <Stack key={d.FECHA} direction="row" alignItems="center" spacing={1}>
                  <Typography variant="body2" sx={{ width: 64, textTransform: "capitalize" }}>
                    {diaCorto(d.FECHA)}
                  </Typography>
                  <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: e.color, flexShrink: 0 }} />
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {e.label}
                    {d.DETALLE ? ` · ${d.DETALLE}` : ""}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {d.ENTRADA || d.SALIDA ? `${hora(d.ENTRADA)} – ${hora(d.SALIDA)}` : ""}
                    {d.MINUTOS_EXTRA ? ` · +${minutosTexto(d.MINUTOS_EXTRA)}` : ""}
                  </Typography>
                </Stack>
              );
            })}
          </Stack>
        </Paper>
      )}

      <Typography variant="caption" color="text.secondary" component="p" sx={{ mb: 2, color: IPL.muted }}>
        Al checar se registran una foto, tu ubicación y la hora del servidor, únicamente para validar tu
        asistencia. Los registros no se pueden modificar. Si olvidas checar la entrada o la salida, el día
        cuenta como retardo; sin ninguna checada cuenta como falta.
      </Typography>
    </Box>
  );
}
