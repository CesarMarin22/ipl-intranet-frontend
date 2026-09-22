import { createTheme } from "@mui/material/styles";

export const IPL = {
  orange: "#F18800",
  black: "#000000",
  bg: "#0B0B0C",
  surface: "#121214",
  surface2: "#16161A",
  border: "#242428",
  text: "#F4F4F5",
  muted: "#A1A1AA",
};

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: IPL.orange },
    background: { default: IPL.bg, paper: IPL.surface },
    text: { primary: IPL.text, secondary: IPL.muted },
    divider: IPL.border,
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: `"Inter", system-ui, -apple-system, Segoe UI, Roboto, Arial`,
    h4: { fontWeight: 900, letterSpacing: -0.6 },
    h6: { fontWeight: 900 },
    button: { fontWeight: 900, textTransform: "none" },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: `1px solid ${IPL.border}`,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 14, paddingInline: 16, paddingBlock: 10 },
        containedPrimary: {
          boxShadow: "0 14px 40px rgba(241,136,0,.18)",
        },
      },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 999 } },
    },
  },
});
