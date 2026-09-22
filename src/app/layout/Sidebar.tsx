import {
  Box,
  Collapse,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import SavingsIcon from "@mui/icons-material/Savings";
import AddCardIcon from "@mui/icons-material/AddCard";
import PeopleIcon from "@mui/icons-material/People";
import BadgeIcon from "@mui/icons-material/Badge";
import ApartmentIcon from "@mui/icons-material/Apartment";
import BusinessIcon from "@mui/icons-material/Business";
import CategoryIcon from "@mui/icons-material/Category";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import RuleIcon from "@mui/icons-material/Rule";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SettingsIcon from "@mui/icons-material/Settings";
import AssessmentIcon from "@mui/icons-material/Assessment";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import FolderIcon from "@mui/icons-material/Folder";
import DescriptionIcon from "@mui/icons-material/Description";
import DashboardIcon from "@mui/icons-material/Dashboard";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IPL } from "../../shared/theme/theme";
import { usePermissions } from "../../shared/hooks/usePermissions";
import { ModulesService } from "../../services/modules";

const drawerW = 280;
const drawerWCollapsed = 86;

type MenuItem = {
  id: number;
  label: string;
  path: string;
  icon: ReactNode;
};

type MenuGroup = {
  id: number;
  label: string;
  icon: ReactNode;
  items: MenuItem[];
};

type ModuleDb = {
  MODULOID: number;
  NOMBRE: string;
  CLAVE: string;
  RUTA?: string | null;
  PADRE_ID?: number | null;
  ORDEN?: number | null;
  ACTIVO: number;
};

export default function Sidebar({
  open,
  onNavigate,
  variant = "permanent",
}: {
  open: boolean;
  onNavigate?: () => void;
  variant?: "permanent" | "temporary";
}) {
  const nav = useNavigate();
  const loc = useLocation();
  const { canView } = usePermissions();

  const [modules, setModules] = useState<ModuleDb[]>([]);
  const [openGroups, setOpenGroups] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let alive = true;

    const loadModules = async () => {
      try {
        const data = await ModulesService.getAll();

        if (!alive) return;

        setModules(
          (data ?? [])
            .filter((m: ModuleDb) => Number(m.ACTIVO) === 1)
            .sort(
              (a: ModuleDb, b: ModuleDb) =>
                Number(a.ORDEN ?? 999999) - Number(b.ORDEN ?? 999999) ||
                Number(a.MODULOID) - Number(b.MODULOID),
            ),
        );
      } catch (error) {
        console.error("Error cargando módulos del sidebar:", error);
      }
    };

    loadModules();

    return () => {
      alive = false;
    };
  }, []);

  const getModuleIcon = (clave: string): ReactNode => {
    const key = String(clave ?? "").toUpperCase();

    const icons: Record<string, ReactNode> = {
      DASHBOARD: <DashboardIcon />,

      COMEDOR: <RestaurantIcon />,
      ESCANEO_COMEDOR: <QrCodeScannerIcon />,
      ESCANEO_QR: <QrCodeScannerIcon />,
      MY_QR: <QrCode2Icon />,
      RECARGAS_COMEDOR: <AddCardIcon />,
      CONSUMO_COMEDOR: <SavingsIcon />,
      MI_SALDO: <SavingsIcon />,
      PRECIOS_COMEDOR: <AttachMoneyIcon />,
      PAQUETES_COMEDOR: <Inventory2Icon />,
      REPORTES_COMEDOR: <AssessmentIcon />,

      SGC: <DescriptionIcon />,
      SGC_DOCUMENTOS: <DescriptionIcon />,

      ADMINISTRACION: <SettingsIcon />,
      USUARIOS: <PeopleIcon />,
      PERFILES: <BadgeIcon />,
      DEPARTAMENTOS: <ApartmentIcon />,
      SOCIOS: <BusinessIcon />,
      TIPOS_EMPLEADO: <CategoryIcon />,
      MODULOS: <ViewModuleIcon />,
      ACCIONES: <RuleIcon />,
      PERMISOS: <AdminPanelSettingsIcon />,
      PERMISOS_USUARIO: <AdminPanelSettingsIcon />,
    };

    return icons[key] ?? <FolderIcon />;
  };

  const toggleGroup = (groupId: number) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !(prev[groupId] ?? true),
    }));
  };

  const menuGroups = useMemo<MenuGroup[]>(() => {
    const hasChildren = (moduloId: number) =>
      modules.some((m) => Number(m.PADRE_ID) === Number(moduloId));

    const getChildren = (parentId: number) =>
      modules
        .filter((m) => Number(m.PADRE_ID) === Number(parentId))
        .filter((m) => Boolean(m.RUTA))
        .filter((m) => canView(m.CLAVE))
        .sort(
          (a, b) =>
            Number(a.ORDEN ?? 999999) - Number(b.ORDEN ?? 999999) ||
            Number(a.MODULOID) - Number(b.MODULOID),
        );

    const parentModules = modules
      .filter((m) => !m.PADRE_ID && hasChildren(Number(m.MODULOID)))
      .sort(
        (a, b) =>
          Number(a.ORDEN ?? 999999) - Number(b.ORDEN ?? 999999) ||
          Number(a.MODULOID) - Number(b.MODULOID),
      );

    const standaloneModules = modules
      .filter((m) => !m.PADRE_ID && !hasChildren(Number(m.MODULOID)))
      .filter((m) => Boolean(m.RUTA))
      .filter((m) => canView(m.CLAVE))
      .sort(
        (a, b) =>
          Number(a.ORDEN ?? 999999) - Number(b.ORDEN ?? 999999) ||
          Number(a.MODULOID) - Number(b.MODULOID),
      );

    const groups: MenuGroup[] = [];

    standaloneModules.forEach((m) => {
      groups.push({
        id: Number(m.MODULOID),
        label: m.NOMBRE,
        icon: getModuleIcon(m.CLAVE),
        items: [
          {
            id: Number(m.MODULOID),
            label: m.NOMBRE,
            path: m.RUTA || "/",
            icon: getModuleIcon(m.CLAVE),
          },
        ],
      });
    });

    parentModules.forEach((parent) => {
      const children = getChildren(Number(parent.MODULOID));

      if (children.length === 0) return;

      groups.push({
        id: Number(parent.MODULOID),
        label: parent.NOMBRE,
        icon: getModuleIcon(parent.CLAVE),
        items: children.map((child) => ({
          id: Number(child.MODULOID),
          label: child.NOMBRE,
          path: child.RUTA || "/",
          icon: getModuleIcon(child.CLAVE),
        })),
      });
    });

    return groups.sort(
      (a, b) =>
        Number(
          modules.find((m) => Number(m.MODULOID) === Number(a.id))?.ORDEN ??
            999999,
        ) -
          Number(
            modules.find((m) => Number(m.MODULOID) === Number(b.id))?.ORDEN ??
              999999,
          ) || Number(a.id) - Number(b.id),
    );
  }, [modules, canView]);

  const go = (path: string) => {
    nav(path);
    onNavigate?.();
  };

  const width =
    variant === "temporary" ? drawerW : open ? drawerW : drawerWCollapsed;

  return (
    <Drawer
      variant={variant}
      open={variant === "temporary" ? open : true}
      onClose={variant === "temporary" ? onNavigate : undefined}
      ModalProps={variant === "temporary" ? { keepMounted: true } : undefined}
      sx={{
        width,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width,
          overflowX: "hidden",
          borderRight: `1px solid ${IPL.border}`,
          background:
            "linear-gradient(180deg, #0B0B0D 0%, #111214 45%, #0B0B0D 100%)",
          boxSizing: "border-box",
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            height: 54,
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            gap: 1.4,
            px: 1.6,
            border: `1px solid rgba(255,255,255,.08)`,
            background: "rgba(255,255,255,.02)",
            boxShadow: "0 0 18px rgba(241,136,0,.10)",
            backdropFilter: "blur(10px)",
          }}
        >
          <Box
            component="img"
            src="/forklift.svg"
            alt="IPL"
            sx={{
              width: 32,
              height: 32,
              objectFit: "contain",
              filter:
                "brightness(0) saturate(100%) invert(64%) sepia(91%) saturate(749%) hue-rotate(359deg) brightness(101%) contrast(95%) drop-shadow(0 0 6px rgba(241,136,0,.35))",
            }}
          />

          {(open || variant === "temporary") && (
            <Typography
              fontWeight={800}
              sx={{
                color: "rgba(255,255,255,.96)",
                letterSpacing: 0.3,
              }}
            >
              Inter Price Logística
            </Typography>
          )}
        </Box>
      </Box>

      <Divider />

      <List sx={{ px: 1 }}>
        {menuGroups.map((group) => {
          const expanded = openGroups[group.id] ?? true;

          return (
            <Box key={group.id} sx={{ mb: 1 }}>
              <ListItemButton
                disableRipple
                disableTouchRipple
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleGroup(group.id);
                }}
                sx={{
                  borderRadius: 2,
                  my: 0.5,
                  transition: "all .18s ease",

                  "&:hover": {
                    backgroundColor: "rgba(241,136,0,.12)",
                    transform: "translateX(2px)",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 44,
                    color: IPL.orange,
                  }}
                >
                  {group.icon}
                </ListItemIcon>

                {(open || variant === "temporary") && (
                  <>
                    <ListItemText
                      primary={group.label}
                      primaryTypographyProps={{
                        fontWeight: 800,
                        fontSize: 12,
                        letterSpacing: 1,
                        textTransform: "uppercase",
                        color: IPL.orange,
                      }}
                    />

                    {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </>
                )}
              </ListItemButton>

              <Collapse
                in={open || variant === "temporary" ? expanded : true}
                timeout="auto"
                unmountOnExit={false}
              >
                {group.items.map((item) => {
                  const active = loc.pathname === item.path;

                  return (
                    <ListItemButton
                      key={item.id}
                      disableRipple
                      disableTouchRipple
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        go(item.path);
                      }}
                      sx={{
                        my: 0.5,
                        ml: open || variant === "temporary" ? 1.4 : 0,
                        borderRadius: 2,
                        border: active
                          ? `1px solid rgba(241,136,0,.35)`
                          : "1px solid transparent",
                        backgroundColor: active
                          ? "rgba(241,136,0,.12)"
                          : "transparent",
                        transition: "all .18s ease",

                        "&:hover": {
                          backgroundColor: "rgba(241,136,0,.12)",
                          transform: "translateX(2px)",
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 44 }}>
                        {item.icon}
                      </ListItemIcon>

                      {(open || variant === "temporary") && (
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{
                            fontWeight: 700,
                            color: "rgba(255,255,255,.92)",
                          }}
                        />
                      )}
                    </ListItemButton>
                  );
                })}
              </Collapse>
            </Box>
          );
        })}
      </List>

      <Box sx={{ flex: 1 }} />

      {(open || variant === "temporary") && (
        <Box sx={{ px: 2, pb: 2 }}>
          <Typography color="text.secondary" variant="body2">
            Inter Price Logística • SLP
          </Typography>
        </Box>
      )}
    </Drawer>
  );
}
