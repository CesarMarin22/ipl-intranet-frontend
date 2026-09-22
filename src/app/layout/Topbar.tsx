import {
  AppBar,
  Avatar,
  Box,
  Chip,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
  TextField,
  InputAdornment,
  useMediaQuery,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import LogoutIcon from "@mui/icons-material/Logout";
import { IPL } from "../../shared/theme/theme";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";

export default function Topbar({
  perfil,
  username,
  nombre,
  perfilNombre,
  onToggleSidebar,
}: {
  perfil: number;
  username?: string;
  nombre?: string;
  perfilNombre?: string;
  onToggleSidebar: () => void;
  onLogout: () => void;
}) {
  const isMobile = useMediaQuery("(max-width:900px)");
  const isSmall = useMediaQuery("(max-width:600px)");
  const queryClient = useQueryClient();

  const handleLogout = async () => {
  try {
    await api.post("/auth/logout");
  } catch {
    // ignorar error
  } finally {
    queryClient.clear();
    localStorage.clear();
    sessionStorage.clear();

    window.location.href = "/login";
  }
};

  const userInitial = (nombre?.[0] || username?.[0] || "I").toUpperCase();

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: "rgba(11,11,12,.78)",
        backdropFilter: "blur(10px)",
        borderBottom: `1px solid ${IPL.border}`,
        zIndex: 1200,
      }}
    >
      <Toolbar
        sx={{
          minHeight: { xs: 64, md: 72 },
          gap: { xs: 0.8, sm: 1.2, md: 1.5 },
          px: { xs: 1, sm: 2 },
        }}
      >
        <Tooltip title="Menú">
          <IconButton onClick={onToggleSidebar} size={isSmall ? "small" : "medium"}>
            <MenuIcon />
          </IconButton>
        </Tooltip>

        <Box
          sx={{
            minWidth: 0,
            maxWidth: { xs: "46vw", sm: "38vw", md: "none" },
          }}
        >
          <Typography
            noWrap
            sx={{
              fontWeight: 900,
              fontSize: { xs: 12.5, sm: 14, md: 18 },
              lineHeight: 1.15,
            }}
          >
            Bienvenido{nombre ? "," : ""}
          </Typography>

          <Typography
            noWrap
            sx={{
              fontWeight: 800,
              color: IPL.orange,
              fontSize: { xs: 11.5, sm: 13, md: 15 },
              maxWidth: { xs: "46vw", sm: "38vw", md: 320 },
            }}
          >
            {nombre || username || "Usuario"}
          </Typography>
        </Box>

        <Box sx={{ flex: 1 }} />

        {!isMobile && (
          <TextField
            size="small"
            placeholder="Buscar OT, cliente, serie…"
            sx={{
              width: { md: 280, lg: 360 },
              "& .MuiOutlinedInput-root": {
                borderRadius: 999,
                background: "rgba(255,255,255,.02)",
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        )}

        {!isSmall && (
          <Chip
            label={perfilNombre || `Perfil ${perfil}`}
            size={isMobile ? "small" : "medium"}
            sx={{
              maxWidth: { sm: 120, md: 180 },
              border: `1px solid ${IPL.border}`,
              background: "rgba(241,136,0,.10)",
              fontWeight: 900,
              color: "white",
              "& .MuiChip-label": {
                overflow: "hidden",
                textOverflow: "ellipsis",
              },
            }}
          />
        )}

        <Avatar
          sx={{
            width: { xs: 34, md: 40 },
            height: { xs: 34, md: 40 },
            bgcolor: IPL.orange,
            color: IPL.black,
            fontWeight: 900,
            fontSize: { xs: 15, md: 18 },
          }}
        >
          {userInitial}
        </Avatar>

        <Tooltip title="Cerrar sesión">
          <IconButton onClick={handleLogout} size={isSmall ? "small" : "medium"}>
            <LogoutIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
}