import { TextField } from "@mui/material";
import { useEffect, useRef, useState } from "react";

import { diaMesDesdeIso, fechaEnPalabras, isoDesdeDiaMes } from "../utils/dateUtils";
import { showWarning } from "../utils/swal";

type Props = {
  /** ISO date yyyy-mm-dd, or "" while empty/invalid */
  value: string;
  onChange: (iso: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  /** External error (e.g. end before start); replaces the confirmation text */
  error?: string | null;
};

/**
 * Date input where users type only day/month; the year is filled in automatically and the
 * resulting date is spelled out underneath so swapped day/month is noticed before saving.
 */
export default function CampoFecha({ value, onChange, label, required, disabled, error }: Props) {
  const [texto, setTexto] = useState(diaMesDesdeIso(value));
  const [errorLocal, setErrorLocal] = useState("");
  const ultimoEmitido = useRef(value);

  // Only follow the parent when it changes the value itself (e.g. form reset after saving)
  useEffect(() => {
    if (value !== ultimoEmitido.current) {
      ultimoEmitido.current = value;
      setTexto(diaMesDesdeIso(value));
      setErrorLocal("");
    }
  }, [value]);

  const emitir = (iso: string) => {
    ultimoEmitido.current = iso;
    if (iso !== value) onChange(iso);
  };

  const evaluar = (valor: string, alSalir: boolean) => {
    if (!valor) {
      setErrorLocal("");
      emitir("");
      return;
    }
    if (valor.length < 5) {
      if (alSalir) setErrorLocal("Escribe la fecha completa como día/mes, por ejemplo 23/09.");
      emitir("");
      return;
    }
    const resultado = isoDesdeDiaMes(valor);
    if ("error" in resultado) {
      setErrorLocal(resultado.error);
      emitir("");
      if (alSalir) {
        showWarning(resultado.error, "Fecha inválida");
        setTexto("");
        setErrorLocal("");
      }
      return;
    }
    setErrorLocal("");
    emitir(resultado.iso);
  };

  const handleInput = (bruto: string) => {
    let digitos = bruto.replace(/\D/g, "").slice(0, 4);
    if (digitos.length >= 3) digitos = `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
    setTexto(digitos);
    evaluar(digitos, false);
  };

  const mensajeError = errorLocal || error || "";
  const ayuda = mensajeError || (value ? `Se registrará: ${fechaEnPalabras(value)}` : "Escribe día/mes, por ejemplo 23/09");

  return (
    <TextField
      fullWidth
      label={label}
      required={required}
      disabled={disabled}
      placeholder="dd/mm"
      value={texto}
      onChange={(e) => handleInput(e.target.value)}
      onBlur={() => evaluar(texto, true)}
      error={Boolean(mensajeError)}
      helperText={ayuda}
      slotProps={{
        htmlInput: { inputMode: "numeric", maxLength: 5, autoComplete: "off" },
        inputLabel: { shrink: true },
        formHelperText: {
          sx: !mensajeError && value ? { color: "success.main", fontWeight: 600 } : undefined,
        },
      }}
    />
  );
}
