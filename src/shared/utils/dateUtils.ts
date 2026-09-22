export function formatDateForSAP(date: string) {
  return date.replaceAll("-", "");
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

  const inicio = new Date(`${fechaInicio}T${horaInicio}`);
  const termino = new Date(`${fechaTermino}T${horaTermino}`);

  if (Number.isNaN(inicio.getTime())) {
    return "La fecha u hora de inicio no tiene un formato válido.";
  }

  if (Number.isNaN(termino.getTime())) {
    return "La fecha u hora de término no tiene un formato válido.";
  }

  const yearInicio = inicio.getFullYear();
  const yearTermino = termino.getFullYear();

  if (yearInicio < 2020 || yearInicio > 2100) {
    return "El año de la fecha de inicio no es válido.";
  }

  if (yearTermino < 2020 || yearTermino > 2100) {
    return "El año de la fecha de término no es válido.";
  }

  if (inicio > termino) {
    return "La fecha y hora de inicio no puede ser mayor que la fecha y hora de término.";
  }

  return null;
}