import { Paper, Typography, Box } from "@mui/material";
import { IPL } from "../theme/theme";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

export default function StatCard({
  title,
  value,
  hint,
  icon,
}: {
  title: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <Paper
      component={motion.div}
      whileHover={{ y: -4 }}
      sx={{
        p: 2.2,
        borderRadius: 3,
        background: `linear-gradient(180deg, ${IPL.surface2} 0%, ${IPL.surface} 100%)`,
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
        <Box>
          <Typography color="text.secondary" fontWeight={900}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ mt: 0.5, fontWeight: 900 }}>
            {value}
          </Typography>
          {hint && (
            <Typography sx={{ mt: 0.5, color: "rgba(241,136,0,.95)", fontWeight: 900 }}>
              {hint}
            </Typography>
          )}
        </Box>
        {icon && (
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 3,
              border: `1px solid ${IPL.border}`,
              display: "grid",
              placeItems: "center",
              background: "rgba(241,136,0,.10)",
            }}
          >
            {icon}
          </Box>
        )}
      </Box>
    </Paper>
  );
}
