const DIA_MS = 24 * 60 * 60 * 1000;

/** yyyy-mm-dd -> yyyymmdd, the format the DataTransfer CSV expects */
export function formatDateForSAP(date: string) {
  return date.replaceAll("-", "");
}

const inicioDelDia = (fecha: Date) => new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());

const aIso = (fecha: Date) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;

const MENSAJE_DIA_MES = (texto: string) =>
  `El valor ${texto} no es una fecha válida. Recuerda que el formato es día/mes (ej. 13 de febrero = 13/02, no 02/13).`;

/**
 * Turns "dd/mm" into an ISO date, filling the year automatically like OTA.
 * A date more than 30 days ahead is taken as last year (e.g. typing 30/12 on January 2nd);
 * a date 1-30 days ahead is rejected as a future date.
 */
export function isoDesdeDiaMes(texto: string, hoy = new Date()): { iso: string } | { error: string } {
  const partes = /^(\d{2})\/(\d{2})$/.exec(texto);
  if (!partes) return { error: "Escribe la fecha como día/mes, por ejemplo 23/09." };

  const dia = Number(partes[1]);
  const mes = Number(partes[2]);
  if (mes < 1 || mes > 12 || dia < 1) return { error: MENSAJE_DIA_MES(texto) };

  const construir = (anio: number) => {
    const fecha = new Date(anio, mes - 1, dia);
    return fecha.getMonth() === mes - 1 ? fecha : null;
  };

  const hoySinHora = inicioDelDia(hoy);
  let fecha = construir(hoy.getFullYear());
  if (fecha && (fecha.getTime() - hoySinHora.getTime()) / DIA_MS > 30) {
    fecha = construir(hoy.getFullYear() - 1);
  }
  if (!fecha) return { error: MENSAJE_DIA_MES(texto) };

  if (fecha.getTime() > hoySinHora.getTime()) {
    return { error: `La fecha ${texto} es futura. Solo se pueden registrar fechas de hoy o anteriores.` };
  }
  return { iso: aIso(fecha) };
}

/** yyyy-mm-dd -> "dd/mm" (empty if not a valid ISO date) */
export function diaMesDesdeIso(iso: string) {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  return partes ? `${partes[3]}/${partes[2]}` : "";
}

/** yyyy-mm-dd -> "martes, 23 de septiembre de 2026" */
export function fechaEnPalabras(iso: string) {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  if (!partes) return "";
  const fecha = new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]));
  return fecha.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

const fechaHora = (fecha: string, hora: string) => new Date(`${fecha}T${hora}`);

function validarAnio(fecha: Date, cual: string) {
  const anioActual = new Date().getFullYear();
  const anio = fecha.getFullYear();
  if (anio < anioActual - 1 || anio > anioActual) {
    return `El año de la fecha de ${cual} (${anio}) no es válido.`;
  }
  return null;
}

export function validateSingleDateTime(fecha: string, hora: string) {
  if (!fecha || !hora) return "Debes capturar fecha y hora.";

  const valor = fechaHora(fecha, hora);
  if (Number.isNaN(valor.getTime())) return "La fecha u hora no tiene un formato válido.";

  const errorAnio = validarAnio(valor, "registro");
  if (errorAnio) return errorAnio;

  if (valor.getTime() > Date.now()) return "La fecha y hora no pueden ser futuras.";
  return null;
}

export function validateDateTimeRange(
  fechaInicio: string,
  horaInicio: string,
  fechaTermino: string,
  horaTermino: string,
) {
  if (!fechaInicio || !horaInicio || !fechaTermino || !horaTermino) {
    return "Debes capturar fecha y hora de inicio y término.";
  }

  const inicio = fechaHora(fechaInicio, horaInicio);
  const termino = fechaHora(fechaTermino, horaTermino);

  if (Number.isNaN(inicio.getTime())) return "La fecha u hora de inicio no tiene un formato válido.";
  if (Number.isNaN(termino.getTime())) return "La fecha u hora de término no tiene un formato válido.";

  const errorAnio = validarAnio(inicio, "inicio") || validarAnio(termino, "término");
  if (errorAnio) return errorAnio;

  if (inicio > termino) {
    return "La fecha y hora de término no pueden ser menores que la fecha y hora de inicio.";
  }
  if (termino.getTime() > Date.now()) {
    return "La fecha y hora de término no pueden ser futuras.";
  }
  return null;
}
