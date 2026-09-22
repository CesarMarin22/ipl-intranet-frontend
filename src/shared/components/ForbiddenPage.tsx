import { Box, Button, Paper, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Paper
        sx={{
          p: 4,
          maxWidth: 520,
          width: "100%",
          textAlign: "center",
          borderRadius: 3,
        }}
      >
        <Typography variant="h4" fontWeight={900} sx={{ mb: 1.5 }}>
          Sin acceso
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          No tienes permisos para acceder a este módulo.
        </Typography>

        <Button variant="contained" onClick={() => navigate(-1)}>
          Regresar
        </Button>
      </Paper>
    </Box>
  );
}