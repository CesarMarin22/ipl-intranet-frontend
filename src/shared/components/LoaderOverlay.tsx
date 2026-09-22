import { Box, CircularProgress, Typography } from "@mui/material";
import { IPL } from "../theme/theme";
import { motion } from "framer-motion";

export default function LoaderOverlay({ label = "Cargando..." }: { label?: string }) {
  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        background: "rgba(0,0,0,.55)",
        backdropFilter: "blur(7px)",
        display: "grid",
        placeItems: "center",
        p: 2,
      }}
    >
      <Box
        sx={{
          width: 320,
          maxWidth: "90vw",
          p: 3,
          borderRadius: 3,
          border: `1px solid ${IPL.border}`,
          background: `linear-gradient(180deg, ${IPL.surface2} 0%, ${IPL.surface} 100%)`,
          textAlign: "center",
        }}
      >
        <CircularProgress />
        <Typography sx={{ mt: 2, fontWeight: 900 }}>{label}</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          IPL Portal • Inter Price Logística
        </Typography>
      </Box>
    </Box>
  );
}
