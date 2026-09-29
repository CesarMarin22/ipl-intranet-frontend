import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  FormControlLabel,
  Link,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import PlaceIcon from "@mui/icons-material/Place";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import LoaderOverlay from "../../../shared/components/LoaderOverlay";
import PermissionButton from "../../../shared/components/PermissionButton";
import { useAppMutation } from "../../../shared/hooks/useAppMutation";
import { usePermissions } from "../../../shared/hooks/usePermissions";
import { promptText, showWarning } from "../../../shared/utils/swal";
import { RelojService, hora, mapaUrl, type Checada } from "../../../services/reloj";
import type { FiltrosPanel } from "./comunes";

export default function TabChecadas({ filtros }: { filtros: FiltrosPanel }) {
  const { canEdit } = usePermissions();
  const puedeRevisar = canEdit("RELOJ_ASISTENCIA");
  const [soloAlertas, setSoloAlertas] = useState(true);
  const [sinRevisar, setSinRevisar] = useState(true);
  const [foto, setFoto] = useState<Checada | null>(null);

  const consulta = { ...filtros, alertas: soloAlertas, sin_revisar: sinRevisar };
  const { data = [], isFetching } = useQuery({
    queryKey: ["reloj-checadas", consulta],
    queryFn: () => RelojService.checadas(consulta),
  });

  const revisar = useAppMutation(
    (v: { id: number; estado: "VALIDADA" | "RECHAZADA"; comentario: string }) =>
      RelojService.revisarChecada(v.id, v.estado, v.comentario),
    {
      successMessage: "Revisión guardada",
      invalidateKeys: [["reloj-checadas"], ["reloj-asistencia"]],
    },
  );

  const validar = (c: Checada) => revisar.mutate({ id: c.CHECADAID, estado: "VALIDADA", comentario: "" });

  const rechazar = async (c: Checada) => {
    const motivo = await promptText(
      "La checada dejará de contar como asistencia. Explica el motivo (por ejemplo: la foto no es del empleado, no estaba en la póliza).",
      "Rechazar checada",
    );
    if (motivo === null) return;
    if (motivo.trim().length < 10) {
      await showWarning("El motivo debe tener al menos 10 caracteres");
      return;
    }
    revisar.mutate({ id: c.CHECADAID, estado: "RECHAZADA", comentario: motivo.trim() });
  };

  return (
    <Box>
      {isFetching && <LoaderOverlay label="Cargando checadas..." />}

      <Stack direction="row" spacing={2} sx={{ mb: 1.5 }} flexWrap="wrap">
        <FormControlLabel
          control={<Switch checked={soloAlertas} onChange={(e) => setSoloAlertas(e.target.checked)} />}
          label="Solo con alertas"
        />
        <FormControlLabel
          control={<Switch checked={sinRevisar} onChange={(e) => setSinRevisar(e.target.checked)} />}
          label="Solo sin revisar"
        />
      </Stack>

      {!data.length && !isFetching && (
        <Typography color="text.secondary">No hay checadas con estos filtros.</Typography>
      )}

      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr", xl: "1fr 1fr 1fr" },
        }}
      >
        {data.map((c) => (
          <Card key={c.CHECADAID} variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent sx={{ display: "flex", gap: 1.5 }}>
              <Box
                component="img"
                src={RelojService.fotoUrl(c.CHECADAID)}
                alt="Foto de la checada"
                loading="lazy"
                onClick={() => setFoto(c)}
                sx={{ width: 96, height: 96, objectFit: "cover", borderRadius: 2, cursor: "zoom-in", flexShrink: 0, bgcolor: "#000" }}
              />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography fontWeight={900} noWrap>
                  {c.NOMBRE}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {c.TIPO === "ENTRADA" ? "Entrada" : "Salida"} · {c.FECHA_HORA.slice(0, 10)} {hora(c.FECHA_HORA)}
                  {c.SUCURSAL_CLAVE ? ` · ${c.SUCURSAL_CLAVE}` : ""}
                </Typography>
                <Link
                  href={mapaUrl(c.LATITUD, c.LONGITUD)}
                  target="_blank"
                  rel="noopener"
                  variant="body2"
                  sx={{ display: "inline-flex", alignItems: "center", gap: 0.3 }}
                >
                  <PlaceIcon sx={{ fontSize: 16 }} />
                  {c.UBICACION_NOMBRE
                    ? `${c.DISTANCIA_M ?? "?"} m de ${c.UBICACION_NOMBRE}${c.RADIO_M ? ` (radio ${c.RADIO_M} m)` : ""}`
                    : "Ver en mapa"}
                  {c.PRECISION_M != null ? ` · ±${c.PRECISION_M} m` : ""}
                </Link>
                <Stack direction="row" spacing={0.5} sx={{ mt: 0.8 }} flexWrap="wrap" useFlexGap>
                  {c.BANDERAS_TEXTO.map((b) => (
                    <Chip key={b} size="small" color="warning" variant="outlined" label={b} />
                  ))}
                  {c.REVISION && (
                    <Chip
                      size="small"
                      color={c.REVISION === "VALIDADA" ? "success" : "error"}
                      label={`${c.REVISION === "VALIDADA" ? "Validada" : "Rechazada"}${c.REVISO_NOMBRE ? ` por ${c.REVISO_NOMBRE}` : ""}`}
                    />
                  )}
                </Stack>
                {c.REVISION_COMENTARIO && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    {c.REVISION_COMENTARIO}
                  </Typography>
                )}
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <PermissionButton
                    allowed={puedeRevisar}
                    size="small"
                    variant="outlined"
                    color="success"
                    startIcon={<CheckIcon />}
                    onClick={() => validar(c)}
                    disabled={c.REVISION === "VALIDADA"}
                  >
                    Validar
                  </PermissionButton>
                  <PermissionButton
                    allowed={puedeRevisar}
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<CloseIcon />}
                    onClick={() => rechazar(c)}
                    disabled={c.REVISION === "RECHAZADA"}
                  >
                    Rechazar
                  </PermissionButton>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Dialog open={!!foto} onClose={() => setFoto(null)} maxWidth="sm">
        {foto && (
          <DialogContent sx={{ p: 1 }}>
            <Box component="img" src={RelojService.fotoUrl(foto.CHECADAID)} alt="Foto" sx={{ width: "100%", borderRadius: 2 }} />
            <Typography variant="body2" sx={{ mt: 1 }}>
              {foto.NOMBRE} · {foto.TIPO === "ENTRADA" ? "Entrada" : "Salida"} {foto.FECHA_HORA.replace("T", " ").slice(0, 16)}
            </Typography>
            {foto.FECHA_HORA_DISPOSITIVO && (
              <Typography variant="caption" color="text.secondary">
                Hora que marcaba el celular: {foto.FECHA_HORA_DISPOSITIVO.replace("T", " ").slice(0, 16)}
              </Typography>
            )}
            <Box sx={{ textAlign: "right" }}>
              <Button onClick={() => setFoto(null)}>Cerrar</Button>
            </Box>
          </DialogContent>
        )}
      </Dialog>
    </Box>
  );
}
