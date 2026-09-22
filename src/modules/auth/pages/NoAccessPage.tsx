// src/modules/auth/pages/NoAccessPage.tsx

import { Box, Paper, Typography } from "@mui/material";

export default function NoAccessPage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Paper sx={{ p: 4, maxWidth: 520, textAlign: "center", borderRadius: 3 }}>
        <Typography variant="h4" fontWeight={900} sx={{ mb: 1 }}>
          Sin permisos asignados
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Tu usuario no tiene módulos habilitados. Solicita acceso al
          administrador del sistema.
        </Typography>
      </Paper>
    </Box>
  );
}