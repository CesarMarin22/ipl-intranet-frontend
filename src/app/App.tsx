import { ThemeProvider, CssBaseline } from "@mui/material";
import { theme } from "../shared/theme/theme";
import QueryProvider from "./providers/QueryProvider";
import AuthProvider from "./providers/AuthProvider";
import { useAuth } from "./providers/useAuth";
import LoaderOverlay from "../shared/components/LoaderOverlay";
import AppRoutes from "./routes";

function Shell() {
  const { loading, user } = useAuth();

  if (loading) {
    return <LoaderOverlay label="Validando sesión..." />;
  }

  return <AppRoutes authenticated={!!user?.authenticated} />;
}

export default function App() {
  return (
    <QueryProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Shell />
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}