import Swal from "sweetalert2";

const swal = Swal.mixin({
  customClass: {
    container: "ipl-swal-container",
  },
});

export function showSuccess(message: string, title = "Éxito") {
  return swal.fire({
    icon: "success",
    title,
    text: message,
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
  });
}

export function showError(message: string, title = "Error") {
  return swal.fire({
    icon: "error",
    title,
    text: message,
    confirmButtonText: "Entendido",
    allowOutsideClick: false,
  });
}

export function showWarning(message: string, title = "Atención") {
  return swal.fire({
    icon: "warning",
    title,
    text: message,
    confirmButtonText: "Entendido",
    allowOutsideClick: false,
  });
}

export async function confirmDelete(
  message = "¿Deseas eliminar este registro?",
  title = "Confirmar eliminación"
) {
  const result = await swal.fire({
    icon: "warning",
    title,
    text: message,
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
    reverseButtons: true,
    allowOutsideClick: false,
  });

  return result.isConfirmed;
}

export async function confirmAction(
  message: string,
  title = "Confirmar",
  confirmText = "Confirmar"
) {
  const result = await swal.fire({
    icon: "question",
    title,
    text: message,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: "Cancelar",
    reverseButtons: true,
    allowOutsideClick: false,
  });

  return result.isConfirmed;
}

export async function promptText(
  message: string,
  title = "Detalles",
  placeholder = ""
): Promise<string | null> {
  const result = await swal.fire({
    icon: "question",
    title,
    text: message,
    input: "textarea",
    inputPlaceholder: placeholder,
    showCancelButton: true,
    confirmButtonText: "Enviar",
    cancelButtonText: "Cancelar",
    reverseButtons: true,
    allowOutsideClick: false,
  });

  if (!result.isConfirmed) return null;
  return (result.value as string) ?? "";
}