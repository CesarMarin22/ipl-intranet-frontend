import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import DescriptionIcon from "@mui/icons-material/Description";
import { useMemo, useState } from "react";

const documentos = [
  {
    titulo: "Formato de Viáticos",
    categoria: "RH",
    archivo: "/documentos/viaticos.pdf",
  },
  {
    titulo: "Solicitud de Compra",
    categoria: "Compras",
    archivo: "/documentos/solicitud_compra.pdf",
  },
  {
    titulo: "Formato OT",
    categoria: "Servicio",
    archivo: "/documentos/formato_ot.pdf",
  },
];

export default function FormulariosPage() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return documentos.filter((doc) =>
      doc.titulo.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>
        Formularios IPL
      </Typography>

      <TextField
        fullWidth
        placeholder="Buscar formulario..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 4 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
          },
          gap: 3,
        }}
      >
        {filtered.map((doc) => (
          <Card key={doc.titulo} sx={{ height: "100%", borderRadius: 3 }}>
            <CardContent>
              <DescriptionIcon sx={{ fontSize: 45, mb: 2 }} />

              <Typography variant="h6" fontWeight={700} mb={1}>
                {doc.titulo}
              </Typography>

              <Typography variant="body2" color="text.secondary" mb={3}>
                {doc.categoria}
              </Typography>

              <Button
                variant="contained"
                fullWidth
                href={doc.archivo}
                target="_blank"
              >
                Abrir Documento
              </Button>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}