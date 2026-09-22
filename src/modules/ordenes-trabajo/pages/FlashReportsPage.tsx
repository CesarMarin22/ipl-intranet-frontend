import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  Chip,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageHeader from "../../../shared/components/PageHeader";
import { showError } from "../../../shared/utils/swal";
import { OrdenesTrabajoService } from "../../../services/ordenesTrabajo";
import LoaderOverlay from "../../../shared/components/LoaderOverlay";

const SEVERIDAD_COLORS: Record<string, "error" | "warning" | "success" | "info"> = {
  "Fatal": "error",
  "Critica": "error",
  "CriticaO": "error",
  "CriticaV": "error",
  "Moderada": "warning",
  "ModeradaO": "warning",
  "ModeradaV": "warning",
  "Alto": "warning",
  "Menor": "success",
  "Bajo": "success",
  "MenorV": "success",
};

type FlashReport = {
  DocNum: number;
  CustomerRefNo: string;
  CustomerName: string;
  ManufacturerSerialNum: string;
  FechaFormateada: string;
  Series: number;
  U_Severidad: string;
  U_CreateUser: string;
};

export default function FlashReportsPage() {
  const navigate = useNavigate();

  const [reportes, setReportes] = useState<FlashReport[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarReportes();
  }, [page]);

  const cargarReportes = async () => {
    setLoading(true);
    try {
      const data = await OrdenesTrabajoService.listarFlashReports(page);
      setReportes(data.llamadas || []);
      setTotalPages(data.total_paginas || 1);
    } catch (error: any) {
      showError("Error", error.message || "No se pudieron cargar los Flash Reports");
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalles = (docnum: number) => {
    navigate(`/ordenes-trabajo/seguridad/${docnum}`);
  };

  const handleSeguimiento = (docnum: number) => {
    navigate(`/ordenes-trabajo/seguridad/${docnum}/seguimiento`);
  };

  if (loading && reportes.length === 0) {
    return <LoaderOverlay label="Cargando Flash Reports..." />;
  }

  return (
    <Box>
      <PageHeader title="Flash Reports (OT Seguridad)" />

      <Paper sx={{ mt: 3, overflow: "auto" }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: "#f5f5f5" }}>
              <TableRow>
                <TableCell><strong>Doc. #</strong></TableCell>
                <TableCell><strong>Cliente</strong></TableCell>
                <TableCell><strong>Folio</strong></TableCell>
                <TableCell><strong>Serie Equipo</strong></TableCell>
                <TableCell><strong>Fecha</strong></TableCell>
                <TableCell><strong>Severidad</strong></TableCell>
                <TableCell><strong>Usuario</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reportes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <Typography color="textSecondary">
                      No hay Flash Reports disponibles
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                reportes.map((reporte) => (
                  <TableRow key={reporte.DocNum} hover>
                    <TableCell>{reporte.DocNum}</TableCell>
                    <TableCell>{reporte.CustomerName}</TableCell>
                    <TableCell>{reporte.CustomerRefNo}</TableCell>
                    <TableCell>{reporte.ManufacturerSerialNum}</TableCell>
                    <TableCell>{reporte.FechaFormateada}</TableCell>
                    <TableCell>
                      <Chip
                        label={reporte.U_Severidad}
                        size="small"
                        color={SEVERIDAD_COLORS[reporte.U_Severidad] || "default"}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{reporte.U_CreateUser}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleVerDetalles(reporte.DocNum)}
                        >
                          Ver
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleSeguimiento(reporte.DocNum)}
                        >
                          Seguimiento
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
          />
        </Box>
      )}
    </Box>
  );
}
