import { Box, useMediaQuery } from "@mui/material";
import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useAuth } from "../providers/useAuth";
import { useTheme } from "@mui/material/styles";

const CLAVE_SIDEBAR = "ipl.sidebarAbierto";

function leerPreferenciaSidebar() {
  try {
    return localStorage.getItem(CLAVE_SIDEBAR) !== "0";
  } catch {
    return true;
  }
}

function guardarPreferenciaSidebar(abierto: boolean) {
  try {
    localStorage.setItem(CLAVE_SIDEBAR, abierto ? "1" : "0");
  } catch {
    // storage unavailable (private mode): the choice just isn't remembered
  }
}

export default function MainLayout() {
  const nav = useNavigate();
  const { user, signOut } = useAuth();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isTablet = useMediaQuery(theme.breakpoints.between("md", "lg"));

  // Desktop remembers whether the user left the sidebar open; tablets start collapsed to icons
  const [open, setOpen] = useState(() => leerPreferenciaSidebar());
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setOpen(isTablet ? false : leerPreferenciaSidebar());
  }, [isTablet]);

  const onLogout = async () => {
    await signOut();
    nav("/login");
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen((prev) => !prev);
    } else {
      setOpen((prev) => {
        if (!isTablet) guardarPreferenciaSidebar(!prev);
        return !prev;
      });
    }
  };

  const closeMobileDrawer = () => {
    setMobileOpen(false);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", width: "100%" }}>
      {!isMobile && (
        <Sidebar open={open} onNavigate={() => {}} variant="permanent" />
      )}

      {isMobile && (
        <Sidebar
          open={mobileOpen}
          onNavigate={closeMobileDrawer}
          variant="temporary"
        />
      )}

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Topbar
          perfil={user?.perfil ?? 0}
          perfilNombre={user?.perfil_nombre}
          nombre={user?.nombre}
          username={user?.username}
          onToggleSidebar={toggleSidebar}
          onLogout={onLogout}
        />

        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}