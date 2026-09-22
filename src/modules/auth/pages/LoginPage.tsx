import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
  Divider,
  Stack,
  //Chip,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../../services/auth";
import { useAuth } from "../../../app/providers/useAuth";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import SecurityIcon from "@mui/icons-material/Security";
import DashboardIcon from "@mui/icons-material/Dashboard";
//import GroupsIcon from "@mui/icons-material/Groups";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import LoaderOverlay from "../../../shared/components/LoaderOverlay";

import IplLogo from "../../../assets/logo ipl_BLANCO.png";

const IPL_ORANGE = "#F59E0B";
const IPL_BLACK = "#0B0B0D";
const IPL_BORDER = "rgba(255,255,255,0.10)";

export default function LoginPage() {
  const nav = useNavigate();
  const { refresh } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);

    try {
      const res = await login(username.trim(), password);

      if (!res?.ok) {
        setError(res?.message ?? "Credenciales incorrectas");
        return;
      }

      await refresh();

      nav("/", { replace: true });
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Error de conexión con el servidor.",
      );
    } finally {
      setBusy(false);
    }
  };

  const features = [
    {
      icon: <DashboardIcon />,
      title: "Gestión centralizada",
      text: "Herramientas internas disponibles en un solo portal.",
    },
    {
      icon: <QrCodeScannerIcon />,
      title: "Operación digital",
      text: "Procesos más rápidos, seguros y fáciles de consultar.",
    },
    {
      icon: <SecurityIcon />,
      title: "Acceso seguro",
      text: "Permisos personalizados según usuario, área y perfil.",
    },
  ];

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        width: "100%",
        background: IPL_BLACK,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(900px 520px at 12% 8%, rgba(245,158,11,0.22) 0%, transparent 62%),
            radial-gradient(800px 520px at 88% 12%, rgba(245,158,11,0.14) 0%, transparent 60%),
            radial-gradient(900px 560px at 18% 92%, rgba(245,158,11,0.10) 0%, transparent 62%),
            radial-gradient(1000px 620px at 85% 88%, rgba(245,158,11,0.12) 0%, transparent 62%),
            radial-gradient(900px 520px at 70% 35%, rgba(255,255,255,0.08) 0%, transparent 60%),
            linear-gradient(180deg, rgba(0,0,0,0.22), rgba(0,0,0,0.92))
          `,
          pointerEvents: "none",
        }}
      />

      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            pt: { xs: 3, sm: 4, md: 5 },
            pb: { xs: 1, md: 2 },
            px: 2,
          }}
        >
          <Box
            component="img"
            src={IplLogo}
            alt="IPL"
            sx={{
              height: "clamp(82px, 8vw, 140px)",
              width: "auto",
              filter: `
                drop-shadow(0 25px 55px rgba(0,0,0,0.65))
                drop-shadow(0 0 34px rgba(245,158,11,0.20))
              `,
              opacity: 0.98,
            }}
          />
        </Box>

        <Box
          sx={{
            minHeight: "calc(100dvh - 135px)",
            width: "100%",
            maxWidth: 1420,
            mx: "auto",
            px: { xs: 2, sm: 3, md: 6 },
            pb: { xs: 4, md: 6 },
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "500px 1fr" },
            gap: { xs: 3, md: 7 },
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "grid", justifyItems: "center" }}>
            <Paper
              elevation={0}
              sx={{
                width: "100%",
                maxWidth: 460,
                p: { xs: 2.6, sm: 3.2 },
                borderRadius: 5,
                border: `1px solid ${IPL_BORDER}`,
                background: "rgba(20,20,23,0.75)",
                backdropFilter: "blur(14px)",
                color: "white",
                boxShadow: "0 40px 110px rgba(0,0,0,0.70)",
              }}
            >
              <Typography
                sx={{
                  fontWeight: 950,
                  fontSize: { xs: 28, sm: 32 },
                  color: IPL_ORANGE,
                }}
              >
                IPL Intranet
              </Typography>

              <Typography
                sx={{ color: "rgba(255,255,255,0.78)", mt: 0.5, mb: 1.5 }}
              >
                Acceso seguro a la plataforma interna de IPL.
              </Typography>

              <Divider sx={{ borderColor: IPL_BORDER, mb: 2 }} />

              <form onSubmit={onSubmit}>
                <TextField
                  label="Usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  fullWidth
                  margin="normal"
                  autoFocus
                  InputLabelProps={{ style: { color: IPL_ORANGE } }}
                  sx={{
                    "& .MuiInputBase-root": { color: "white" },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: IPL_BORDER,
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(255,255,255,0.35)",
                    },
                    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                      { borderColor: IPL_ORANGE },
                  }}
                />

                <TextField
                  label="Contraseña"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  fullWidth
                  margin="normal"
                  InputLabelProps={{ style: { color: IPL_ORANGE } }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPass((s) => !s)}
                          edge="end"
                          sx={{ color: IPL_ORANGE }}
                        >
                          {showPass ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiInputBase-root": { color: "white" },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: IPL_BORDER,
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(255,255,255,0.35)",
                    },
                    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                      { borderColor: IPL_ORANGE },
                  }}
                />

                {error && (
                  <Typography sx={{ color: "#fca5a5", mt: 1 }}>
                    {error}
                  </Typography>
                )}

                {busy && <LoaderOverlay label="Iniciando sesión..." />}

                <Button
                  type="submit"
                  variant="contained"
                  disabled={busy}
                  fullWidth
                  sx={{
                    mt: 2,
                    py: 1.2,
                    fontWeight: 950,
                    backgroundColor: "white",
                    color: "#111",
                    borderRadius: 3,
                    "&:hover": { backgroundColor: IPL_ORANGE, color: "#111" },
                  }}
                >
                  {busy ? "Iniciando sesión..." : "Entrar"}
                </Button>
              </form>
            </Paper>
          </Box>

          <Box
            sx={{
              display: { xs: "none", md: "block" },
              color: "white",
              maxWidth: 720,
            }}
          >
            {/*<Chip
              icon={<GroupsIcon />}
              label="Portal interno IPL"
              sx={{
                mb: 2,
                color: "white",
                background: "rgba(245,158,11,0.16)",
                border: `1px solid rgba(245,158,11,0.35)`,
                "& .MuiChip-icon": { color: IPL_ORANGE },
              }}
            />*/}

            <Typography
              sx={{
                fontSize: { md: 48, lg: 60 },
                lineHeight: 1.02,
                fontWeight: 950,
                letterSpacing: -1.8,
                maxWidth: 780,
                background: `linear-gradient(90deg, #FFFFFF 0%, ${IPL_ORANGE} 55%, #FFFFFF 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Conecta tus procesos en una sola plataforma.
            </Typography>

            <Typography
              sx={{
                mt: 2,
                color: "rgba(255,255,255,0.74)",
                fontSize: 18,
                lineHeight: 1.7,
                maxWidth: 650,
              }}
            >
              Una plataforma interna diseñada para centralizar accesos, agilizar
              procesos y fortalecer la operación diaria con seguridad y
              eficiencia.
            </Typography>

            <Stack spacing={1.6} sx={{ mt: 4, maxWidth: 660 }}>
              {features.map((item) => (
                <Paper
                  key={item.title}
                  elevation={0}
                  sx={{
                    p: 2,
                    display: "grid",
                    gridTemplateColumns: "48px 1fr",
                    gap: 2,
                    alignItems: "center",
                    borderRadius: 4,
                    border: `1px solid ${IPL_BORDER}`,
                    background: "rgba(255,255,255,0.055)",
                    backdropFilter: "blur(10px)",
                    color: "white",
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 3,
                      display: "grid",
                      placeItems: "center",
                      color: IPL_ORANGE,
                      background: "rgba(245,158,11,0.13)",
                      border: "1px solid rgba(245,158,11,0.25)",
                    }}
                  >
                    {item.icon}
                  </Box>

                  <Box>
                    <Typography sx={{ fontWeight: 900, fontSize: 17 }}>
                      {item.title}
                    </Typography>
                    <Typography
                      sx={{ color: "rgba(255,255,255,0.66)", fontSize: 14.5 }}
                    >
                      {item.text}
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
