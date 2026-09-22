import axios from "axios";
import Swal from "sweetalert2";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let showingSessionExpired = false;

api.interceptors.response.use(
  (response) => {
    const data = response.data;

    if (data && data.ok === false) {
      return Promise.reject(new Error(data.message || "Ocurrió un error"));
    }

    return response;
  },
  async (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";

    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Error de conexión con el servidor.";

    const isLogoutRequest = url.includes("/auth/logout");
    const isLoginPage = window.location.pathname === "/login";

    if (
      status === 401 &&
      message === "No autenticado" &&
      !isLogoutRequest &&
      !isLoginPage &&
      !showingSessionExpired
    ) {
      showingSessionExpired = true;

      localStorage.clear();

      await Swal.fire({
        icon: "warning",
        title: "Sesión expirada",
        text: "Tu sesión expiró por inactividad. Inicia sesión nuevamente.",
        confirmButtonColor: "#F59E0B",
        allowOutsideClick: false,
        allowEscapeKey: false,
      });

      window.location.href = "/login";
    }

    return Promise.reject(new Error(message));
  },
);