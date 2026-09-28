import {
  Box,
  Collapse,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
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
import BuildIcon from "@mui/icons-material/Build";
import AssignmentIcon from "@mui/icons-material/Assignment";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import ListAltIcon from "@mui/icons-material/ListAlt";
import StoreIcon from "@mui/icons-material/Store";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import LanguageIcon from "@mui/icons-material/Language";
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
  /** A module without children: shown as a single row, not as a group header plus the same row */
  suelto: boolean;
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

const ICONOS_POR_CLAVE: Record<string, () => ReactNode> = {
  DASHBOARD: () => <DashboardIcon />,
  INTRANET: () => <LanguageIcon />,

  COMEDOR: () => <RestaurantIcon />,
  ESCANEO_COMEDOR: () => <QrCodeScannerIcon />,
  ESCANEO_QR: () => <QrCodeScannerIcon />,
  MY_QR: () => <QrCode2Icon />,
  RECARGAS_COMEDOR: () => <AddCardIcon />,
  CONSUMO_COMEDOR: () => <SavingsIcon />,
  MI_SALDO: () => <SavingsIcon />,
  PRECIOS_COMEDOR: () => <AttachMoneyIcon />,
  PAQUETES_COMEDOR: () => <Inventory2Icon />,
  REPORTES_COMEDOR: () => <AssessmentIcon />,

  DASHBOARD_SERVICIO: () => <BuildIcon />,
  SERVICIO: () => <BuildIcon />,
  OT_NORMAL: () => <AssignmentIcon />,
  OT_AUDI: () => <DirectionsCarIcon />,
  OT_SEGURIDAD: () => <ReportProblemIcon />,
  FLASH_REPORT: () => <ReportProblemIcon />,
  SEGUIMIENTO_FLASH: () => <TaskAltIcon />,
  VER_OT: () => <ListAltIcon />,

  SGC: () => <DescriptionIcon />,
  SGC_DOCUMENTOS: () => <DescriptionIcon />,

  ADMINISTRACION: () => <SettingsIcon />,
  USUARIOS: () => <PeopleIcon />,
  PERFILES: () => <BadgeIcon />,
  DEPARTAMENTOS: () => <ApartmentIcon />,
  SOCIOS: () => <BusinessIcon />,
  TIPOS_EMPLEADO: () => <CategoryIcon />,
  MODULOS: () => <ViewModuleIcon />,
  ACCIONES: () => <RuleIcon />,
  PERMISOS: () => <AdminPanelSettingsIcon />,
  PERMISOS_USUARIO: () => <AdminPanelSettingsIcon />,
};

// For modules not listed above (e.g. new ones), pick an icon from words in the key or name
const ICONOS_POR_PALABRA: [string[], () => ReactNode][] = [
  [["AUDI"], () => <DirectionsCarIcon />],
  [["FLASH", "SEGURIDAD"], () => <ReportProblemIcon />],
  [["SEGUIMIENTO"], () => <TaskAltIcon />],
  [["SERVICIO"], () => <BuildIcon />],
  [["OT", "ORDEN", "ORDENES"], () => <AssignmentIcon />],
  [["COMEDOR", "COMIDA"], () => <RestaurantIcon />],
  [["ESCANEO", "SCAN"], () => <QrCodeScannerIcon />],
  [["QR"], () => <QrCode2Icon />],
  [["SALDO", "CONSUMO"], () => <SavingsIcon />],
  [["RECARGA", "RECARGAS"], () => <AddCardIcon />],
  [["PRECIO", "PRECIOS"], () => <AttachMoneyIcon />],
  [["PAQUETE", "PAQUETES", "INVENTARIO"], () => <Inventory2Icon />],
  [["REPORTE", "REPORTES", "INDICADORES"], () => <AssessmentIcon />],
  [["DASHBOARD", "INICIO"], () => <DashboardIcon />],
  [["EXTERNO", "EXTERNOS", "AUDITORIA"], () => <FactCheckIcon />],
  [["SGC", "DOCUMENTO", "DOCUMENTOS", "FORMULARIO", "FORMULARIOS"], () => <DescriptionIcon />],
  [["USUARIO", "USUARIOS", "EMPLEADO", "EMPLEADOS"], () => <PeopleIcon />],
  [["PERFIL", "PERFILES"], () => <BadgeIcon />],
  [["DEPARTAMENTO", "DEPARTAMENTOS"], () => <ApartmentIcon />],
  [["SUCURSAL", "SUCURSALES"], () => <StoreIcon />],
  [["SOCIO", "SOCIOS", "CLIENTE", "CLIENTES"], () => <BusinessIcon />],
  [["PERMISO", "PERMISOS"], () => <AdminPanelSettingsIcon />],
  [["MODULO", "MODULOS"], () => <ViewModuleIcon />],
  [["ACCION", "ACCIONES"], () => <RuleIcon />],
  [["ADMIN", "ADMINISTRACION", "CONFIGURACION"], () => <SettingsIcon />],
];

function iconoModulo(clave: string, nombre: string): ReactNode {
  const exacto = ICONOS_POR_CLAVE[String(clave ?? "").toUpperCase()];
  if (exacto) return exacto();

  const palabras = `${clave} ${nombre}`
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^A-Z0-9]+/)
    .filter(Boolean);
  const regla = ICONOS_POR_PALABRA.find(([claves]) => claves.some((c) => palabras.includes(c)));
  return regla ? regla[1]() : <FolderIcon />;
}

const segmentos = (ruta: string) => ruta.split(/[?#]/)[0].split("/").filter(Boolean);

/**
 * Menu path that best matches the current URL, so sub-screens keep their tab highlighted
 * (e.g. /ordenes-trabajo/123/... highlights /ordenes-trabajo/dashboard).
 */
function rutaActiva(pathname: string, rutas: string[]) {
  if (rutas.includes(pathname)) return pathname;
  const actual = segmentos(pathname);
  let mejor = "";
  let mejorPuntaje = 0;
  for (const ruta of rutas) {
    const partes = segmentos(ruta);
    let comunes = 0;
    while (comunes < partes.length && comunes < actual.length && partes[comunes] === actual[comunes]) comunes++;
    // A full prefix match (the menu path contains the whole start of the URL) beats a partial one
    const puntaje = comunes === partes.length ? comunes + 0.5 : comunes;
    if (comunes > 0 && puntaje > mejorPuntaje) {
      mejor = ruta;
      mejorPuntaje = puntaje;
    }
  }
  return mejor;
}

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

  const conTexto = open || variant === "temporary";

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
        icon: iconoModulo(m.CLAVE, m.NOMBRE),
        suelto: true,
        items: [
          {
            id: Number(m.MODULOID),
            label: m.NOMBRE,
            path: m.RUTA || "/",
            icon: iconoModulo(m.CLAVE, m.NOMBRE),
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
        icon: iconoModulo(parent.CLAVE, parent.NOMBRE),
        suelto: false,
        items: children.map((child) => ({
          id: Number(child.MODULOID),
          label: child.NOMBRE,
          path: child.RUTA || "/",
          icon: iconoModulo(child.CLAVE, child.NOMBRE),
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

  const activa = useMemo(
    () => rutaActiva(loc.pathname, menuGroups.flatMap((g) => g.items.map((i) => i.path))),
    [loc.pathname, menuGroups],
  );

  // Open the group that holds the current screen, even if the user had collapsed it
  useEffect(() => {
    const grupo = menuGroups.find((g) => !g.suelto && g.items.some((i) => i.path === activa));
    if (grupo) setOpenGroups((prev) => (prev[grupo.id] === false ? { ...prev, [grupo.id]: true } : prev));
  }, [activa, menuGroups]);

  const go = (path: string) => {
    nav(path);
    onNavigate?.();
  };

  const width = conTexto ? drawerW : drawerWCollapsed;

  const renderItem = (item: MenuItem, dentroDeGrupo: boolean) => {
    const active = item.path === activa;
    return (
      <Tooltip key={item.id} title={item.label} placement="right" arrow disableHoverListener={conTexto} disableFocusListener={conTexto} disableTouchListener={conTexto}>
        <ListItemButton
          disableRipple
          disableTouchRipple
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            go(item.path);
          }}
          aria-label={item.label}
          aria-current={active ? "page" : undefined}
          sx={{
            my: 0.5,
            ml: conTexto && dentroDeGrupo ? 1.4 : 0,
            justifyContent: conTexto ? "flex-start" : "center",
            borderRadius: 2,
            border: active ? `1px solid rgba(241,136,0,.35)` : "1px solid transparent",
            backgroundColor: active ? "rgba(241,136,0,.12)" : "transparent",
            transition: "all .18s ease",
            "&:hover": {
              backgroundColor: "rgba(241,136,0,.12)",
              transform: conTexto ? "translateX(2px)" : "none",
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: conTexto ? 44 : 0,
              justifyContent: "center",
              color: active ? IPL.orange : "rgba(255,255,255,.85)",
            }}
          >
            {item.icon}
          </ListItemIcon>

          {conTexto && (
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontWeight: active ? 800 : 700,
                color: active ? IPL.orange : "rgba(255,255,255,.92)",
              }}
            />
          )}
        </ListItemButton>
      </Tooltip>
    );
  };

  return (
    <Drawer
      variant={variant}
      open={variant === "temporary" ? open : true}
      onClose={variant === "temporary" ? onNavigate : undefined}
      ModalProps={variant === "temporary" ? { keepMounted: true } : undefined}
      sx={{
        width,
        flexShrink: 0,
        transition: "width .2s ease",
        "& .MuiDrawer-paper": {
          width,
          overflowX: "hidden",
          transition: "width .2s ease",
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
            justifyContent: conTexto ? "flex-start" : "center",
            gap: 1.4,
            px: conTexto ? 1.6 : 0,
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

          {conTexto && (
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

      <List sx={{ px: 1, overflowY: "auto", overflowX: "hidden" }}>
        {menuGroups.map((group, indice) => {
          if (group.suelto) {
            return <Box key={group.id}>{renderItem(group.items[0], false)}</Box>;
          }

          // Collapsed: only the item icons, with a divider between groups
          if (!conTexto) {
            return (
              <Box key={group.id}>
                {indice > 0 && <Divider sx={{ my: 1, borderColor: "rgba(255,255,255,.08)" }} />}
                {group.items.map((item) => renderItem(item, true))}
              </Box>
            );
          }

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
                aria-expanded={expanded}
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
                <ListItemIcon sx={{ minWidth: 44, color: IPL.orange }}>{group.icon}</ListItemIcon>
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
              </ListItemButton>

              <Collapse in={expanded} timeout="auto" unmountOnExit={false}>
                {group.items.map((item) => renderItem(item, true))}
              </Collapse>
            </Box>
          );
        })}
      </List>

      <Box sx={{ flex: 1 }} />

      {conTexto && (
        <Box sx={{ px: 2, pb: 2 }}>
          <Typography color="text.secondary" variant="body2">
            Inter Price Logística • SLP
          </Typography>
        </Box>
      )}
    </Drawer>
  );
}
