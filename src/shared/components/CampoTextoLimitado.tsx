import { TextField } from "@mui/material";
import type { ClipboardEvent } from "react";

import { showWarning } from "../utils/swal";

type Props = {
  value: string;
  onChange: (valor: string) => void;
  /** Name shown in the warning, e.g. "Descripción de la falla" */
  nombre: string;
  limite?: number;
  rows?: number;
};

/**
 * Multiline field capped like OTA: the browser blocks typing past the limit and pasted text is
 * trimmed with a warning. The SAP Subject column only stores 254 characters.
 */
export default function CampoTextoLimitado({ value, onChange, nombre, limite = 254, rows = 4 }: Props) {
  const avisarSiSePasa = (e: ClipboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const campo = e.currentTarget;
    const seleccion = (campo.selectionEnd ?? 0) - (campo.selectionStart ?? 0);
    const pegado = e.clipboardData.getData("text");
    if (value.length - seleccion + pegado.length > limite) {
      showWarning(
        `"${nombre}" tiene un límite de ${limite} caracteres. Se recortó el texto pegado para que quepa.`,
        "Texto recortado",
      );
    }
  };

  return (
    <TextField
      fullWidth
      multiline
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value.slice(0, limite))}
      helperText={`${value.length} / ${limite} caracteres`}
      slotProps={{
        htmlInput: { maxLength: limite, onPaste: avisarSiSePasa },
        formHelperText: {
          sx: { textAlign: "right", color: value.length >= limite ? "warning.main" : undefined, fontWeight: value.length >= limite ? 700 : undefined },
        },
      }}
    />
  );
}
