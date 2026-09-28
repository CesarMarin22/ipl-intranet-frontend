import { Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";

export default function BotonVolverServicio() {
  const navigate = useNavigate();
  return (
    <Button
      variant="outlined"
      startIcon={<ArrowBackIcon />}
      onClick={() => navigate("/ordenes-trabajo/dashboard")}
      className="no-print"
    >
      Volver a Servicio
    </Button>
  );
}
