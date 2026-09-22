import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import DownloadIcon from "@mui/icons-material/Download";
import FilterAltIcon from "@mui/icons-material/FilterAlt";

import PageHeader from "../../../shared/components/PageHeader";
import LoaderOverlay from "../../../shared/components/LoaderOverlay";
import { IPL } from "../../../shared/theme/theme";

type DashboardItem = {
  DocNum: number;
  CustomerRefNo?: string;
  CustomerName?: string;
  ManufacturerSerialNum?: string;
  AssignedDate?: string; // ISO
  FechaFormateada?: string; // dd/mm/yyyy
};

type DashboardResponse = {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  items: DashboardItem[];
};

async function getMe() {
  const res = await fetch("/api/me", { credentials: "include" });
  return res.json();
}

async function getDashboard(page: number, per_page: number) {
  const res = await fetch(`/api/dashboard?page=${page}&per_page=${per_page}`, {
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || err?.error || "No se pudo cargar dashboard");
  }
  return (await res.json()) as DashboardResponse;
}

function StatCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <Card
      sx={{
        border: `1px solid ${IPL.border}`,
        borderRadius: 4,
        background: `linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.06))`,
        boxShadow: "0 10px 40px rgba(0,0,0,.22)",
      }}
    >
      <CardContent sx={{ p: 2.3 }}>
        <Typography variant="body2" sx={{ color: "#A1A1AA" }}>
          {label}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 900, mt: 0.5 }}>
          {value}
        </Typography>
        {helper ? (
          <Typography variant="body2" sx={{ color: "#A1A1AA", mt: 0.5 }}>
            {helper}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
}

// Helpers de fecha (front only)
function parseDDMMYYYY(value?: string) {
  if (!value) return null;
  // "30/10/2025"
  const parts = value.split("/");
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts.map((x) => Number(x));
  if (!dd || !mm || !yyyy) return null;
  return new Date(yyyy, mm - 1, dd, 0, 0, 0, 0);
}

function isWithinDays(date: Date, days: number) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - days);
  start.setHours(0, 0, 0, 0);
  return date >= start && date <= now;
}

type QuickRange = "ALL" | "TODAY" | "7D" | "30D";

export default function DashboardPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const nav = useNavigate();

  const [sp, setSp] = useSearchParams();
  const page = Math.max(1, Number(sp.get("page") || 1));
  const per_page = 10;

  const [q, setQ] = useState("");
  const [range, setRange] = useState<QuickRange>("ALL");

  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const dashQuery = useQuery({
    queryKey: ["dashboard", page, per_page],
    queryFn: () => getDashboard(page, per_page),
  });

  const loading = meQuery.isLoading || dashQuery.isLoading;
  const me = meQuery.data;
  const data = dashQuery.data;

  const username = me?.username ?? "";
  const perfil = me?.perfil ?? 0;

  const createOt = useMemo(() => {
    if (perfil === 5) return { href: "/audi", label: "Crear OT AUDI" };
    if (perfil === 4) return { href: "/seguridad", label: "Flash Report" };
    return { href: "/ot", label: "Crear OT" };
  }, [perfil]);

  const items = useMemo(() => data?.items ?? [], [data?.items]);

  const filteredItems = useMemo(() => {
    const s = q.trim().toLowerCase();

    return items.filter((x) => {
      // 1) filtro de texto
      if (s) {
        const doc = String(x.DocNum ?? "").toLowerCase();
        const folio = String(x.CustomerRefNo ?? "").toLowerCase();
        const cliente = String(x.CustomerName ?? "").toLowerCase();
        const serie = String(x.ManufacturerSerialNum ?? "").toLowerCase();
        const fecha = String(x.FechaFormateada ?? "").toLowerCase();

        const match =
          doc.includes(s) ||
          folio.includes(s) ||
          cliente.includes(s) ||
          serie.includes(s) ||
          fecha.includes(s);

        if (!match) return false;
      }

      // 2) filtro por rango rápido (front)
      if (range === "ALL") return true;

      const d = parseDDMMYYYY(x.FechaFormateada);
      if (!d) return true; // si no hay fecha, no lo ocultamos

      if (range === "TODAY") {
        const now = new Date();
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate()
        );
      }

      if (range === "7D") return isWithinDays(d, 7);
      if (range === "30D") return isWithinDays(d, 30);

      return true;
    });
  }, [items, q, range]);

  const activeFilters = (q.trim() ? 1 : 0) + (range !== "ALL" ? 1 : 0);

  const start = data ? (data.page - 1) * data.per_page + 1 : 0;
  const end = data ? (data.page - 1) * data.per_page + (items?.length || 0) : 0;

  useEffect(() => {
    const ultimaOT = localStorage.getItem("ultimaOTVista");
    if (!ultimaOT) return;

    const t = setTimeout(() => {
      const el = document.getElementById(`ot-${ultimaOT}`);
      if (el) {
        el.classList.add("table-active");
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => el.classList.remove("table-active"), 5000);
      }
    }, 150);

    return () => clearTimeout(t);
  }, [data?.items]);

  const prevDisabled = !data || data.page <= 1;
  const nextDisabled = !data || data.page >= data.total_pages;

  const exportCsv = () => {
    const rows = filteredItems;

    const header = ["DocNum", "CustomerRefNo", "CustomerName", "ManufacturerSerialNum", "FechaFormateada"];
    const csv = [
      header.join(","),
      ...rows.map((r) =>
        [
          r.DocNum ?? "",
          (r.CustomerRefNo ?? "").replaceAll(",", " "),
          (r.CustomerName ?? "").replaceAll(",", " "),
          (r.ManufacturerSerialNum ?? "").replaceAll(",", " "),
          r.FechaFormateada ?? "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dashboard_ot_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openDetail = (docNum: number) => {
    localStorage.setItem("ultimaOTVista", String(docNum));
    nav(`/ver-ot/${docNum}?page=${data?.page ?? 1}`);
  };

  const clearFilters = () => {
    setQ("");
    setRange("ALL");
  };

  if (loading) return <LoaderOverlay label="Cargando dashboard..." />;

  if (dashQuery.isError) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">
          {(dashQuery.error as Error)?.message || "Error al cargar dashboard"}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Historial de OT"
        subtitle={`Usuario: ${username}`}
        action={
          <Button
            component={Link}
            to={createOt.href}
            variant="contained"
            sx={{ minWidth: 220 }}
          >
            {createOt.label}
          </Button>
        }
      />

      {/* ✅ Stats */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" },
          gap: 2,
          mb: 2,
        }}
      >
        <StatCard
          label="Registros"
          value={data ? `Mostrando ${start} – ${end}` : "—"}
          helper={data ? `Total: ${data.total}` : ""}
        />
        <StatCard
          label="Paginación"
          value={data ? `Página ${data.page} de ${data.total_pages}` : "—"}
        />
        <StatCard
          label="Perfil"
          value={
            perfil === 5 ? "AUDI" : perfil === 4 ? "SEGURIDAD" : perfil === 1 ? "ADMIN" : "USUARIO"
          }
        />
      </Box>

      <Paper sx={{ p: { xs: 1.2, md: 2.2 }, borderRadius: 4 }}>
        {/* ✅ Buscador + acciones */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr auto auto" },
            gap: 1.2,
            mb: 1.5,
            alignItems: "center",
          }}
        >
          <TextField
            label="Buscar OT, cliente, serie, folio o fecha"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: q ? (
                <InputAdornment position="end">
                  <IconButton onClick={() => setQ("")} edge="end" aria-label="clear">
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />

          <Tooltip title="Exportar los resultados visibles">
            <span>
              <Button
                variant="outlined"
                onClick={exportCsv}
                disabled={filteredItems.length === 0}
                startIcon={<DownloadIcon />}
                sx={{ minWidth: 190 }}
              >
                Exportar
              </Button>
            </span>
          </Tooltip>

          <Tooltip title="Limpiar filtros">
            <span>
              <Button
                variant="outlined"
                onClick={clearFilters}
                disabled={activeFilters === 0}
                startIcon={<FilterAltIcon />}
                sx={{ minWidth: 190 }}
              >
                Limpiar
              </Button>
            </span>
          </Tooltip>
        </Box>

        {/* ✅ chips de filtros rápidos */}
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1, mb: 2 }}>
          <Chip
            label="Todo"
            clickable
            color={range === "ALL" ? "warning" : "default"}
            onClick={() => setRange("ALL")}
          />
          <Chip
            label="Hoy"
            clickable
            color={range === "TODAY" ? "warning" : "default"}
            onClick={() => setRange("TODAY")}
          />
          <Chip
            label="Últimos 7 días"
            clickable
            color={range === "7D" ? "warning" : "default"}
            onClick={() => setRange("7D")}
          />
          <Chip
            label="Últimos 30 días"
            clickable
            color={range === "30D" ? "warning" : "default"}
            onClick={() => setRange("30D")}
          />

          <Box sx={{ flex: 1 }} />

          <Chip
            size="small"
            label={`Resultados: ${filteredItems.length}`}
            sx={{ fontWeight: 900 }}
          />
        </Stack>

        {/* ✅ Tabla desktop / Cards móvil */}
        {!isMobile ? (
          <TableContainer>
            <Table sx={{ minWidth: 950 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 900 }}>OT SAP</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Folio OT Física</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Cliente</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Serie</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Fecha</TableCell>
                  <TableCell sx={{ fontWeight: 900, textAlign: "center" }}>Ver</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ color: "#A1A1AA" }}>
                      No hay resultados con los filtros actuales.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((x) => (
                    <TableRow
                      key={x.DocNum}
                      id={`ot-${x.DocNum}`}
                      onClick={() => openDetail(x.DocNum)}
                      sx={{
                        borderTop: `1px solid ${IPL.border}`,
                        cursor: "pointer",
                        transition: "transform .12s ease, background-color .12s ease",
                        "&:hover": {
                          backgroundColor: "rgba(241,136,0,.07)",
                          transform: "translateY(-1px)",
                        },
                        "&.table-active": {
                          backgroundColor: "rgba(241,136,0,.12)",
                        },
                      }}
                    >
                      <TableCell sx={{ fontWeight: 900 }}>{x.DocNum}</TableCell>
                      <TableCell>{x.CustomerRefNo ?? ""}</TableCell>
                      <TableCell>{x.CustomerName ?? ""}</TableCell>
                      <TableCell>{x.ManufacturerSerialNum ?? ""}</TableCell>
                      <TableCell>
                        <Chip label={x.FechaFormateada ?? ""} size="small" />
                      </TableCell>
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <IconButton
                          component={Link}
                          to={`/ver-ot/${x.DocNum}?page=${data?.page ?? 1}`}
                          onClick={() => localStorage.setItem("ultimaOTVista", String(x.DocNum))}
                          aria-label="ver"
                        >
                          <VisibilityOutlinedIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Stack spacing={1.2}>
            {filteredItems.length === 0 ? (
              <Typography sx={{ color: "#A1A1AA", p: 1 }}>
                No hay resultados con los filtros actuales.
              </Typography>
            ) : (
              filteredItems.map((x) => (
                <Card
                  key={x.DocNum}
                  id={`ot-${x.DocNum}`}
                  sx={{
                    border: `1px solid ${IPL.border}`,
                    borderRadius: 4,
                    "&.table-active": {
                      backgroundColor: "rgba(241,136,0,.12)",
                    },
                  }}
                >
                  <CardContent sx={{ p: 1.6 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography sx={{ fontWeight: 900 }}>OT {x.DocNum}</Typography>
                      <Chip label={x.FechaFormateada ?? ""} size="small" />
                    </Stack>

                    <Divider sx={{ my: 1.2 }} />

                    <Stack spacing={0.6}>
                      <Typography variant="body2" sx={{ color: "#A1A1AA" }}>
                        Folio OT Física
                      </Typography>
                      <Typography sx={{ fontWeight: 700 }}>
                        {x.CustomerRefNo ?? "—"}
                      </Typography>

                      <Typography variant="body2" sx={{ color: "#A1A1AA", mt: 0.5 }}>
                        Cliente
                      </Typography>
                      <Typography sx={{ fontWeight: 700 }}>
                        {x.CustomerName ?? "—"}
                      </Typography>

                      <Typography variant="body2" sx={{ color: "#A1A1AA", mt: 0.5 }}>
                        Serie
                      </Typography>
                      <Typography sx={{ fontWeight: 700 }}>
                        {x.ManufacturerSerialNum ?? "—"}
                      </Typography>
                    </Stack>

                    <Button
                      fullWidth
                      sx={{ mt: 1.4 }}
                      variant="outlined"
                      component={Link}
                      to={`/ver-ot/${x.DocNum}?page=${data?.page ?? 1}`}
                      onClick={() => localStorage.setItem("ultimaOTVista", String(x.DocNum))}
                      startIcon={<VisibilityOutlinedIcon />}
                    >
                      Ver detalle
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </Stack>
        )}

        {/* ✅ Paginación responsiva */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: 1,
            mt: 2,
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <Button
            variant="outlined"
            disabled={prevDisabled}
            onClick={() => setSp({ page: String(page - 1) })}
            fullWidth={isMobile}
          >
            Anterior
          </Button>

          <Button
            variant="outlined"
            disabled={nextDisabled}
            onClick={() => setSp({ page: String(page + 1) })}
            fullWidth={isMobile}
          >
            Siguiente
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
