import { useEffect, useMemo, useState, useCallback } from "react";
import type { ReactNode } from "react";
import Swal from "sweetalert2";

import { me, logout } from "../../services/auth";
import type { MeResponse } from "../../services/auth";

import { AuthContext } from "./authContext";
import type { AuthState } from "./authContext";

export default function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<MeResponse | null>(null);

  const showSessionExpired = useCallback(async () => {
    // Si ya estamos en login no mostrar nada
    if (window.location.pathname === "/login") {
      setUser(null);
      setLoading(false);
      return;
    }

    setUser(null);
    setLoading(false);

    // Espera un render para que desaparezca el loader
    await new Promise((resolve) => setTimeout(resolve, 100));

    await Swal.fire({
      icon: "warning",
      title: "Sesión vencida",
      text: "Tus credenciales vencieron. Inicia sesión nuevamente.",
      confirmButtonText: "Entendido",
      allowOutsideClick: false,
      allowEscapeKey: false,
    });

    window.location.replace("/login");
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);

    try {
      const res = await me();

      if (!res.authenticated) {
        await showSessionExpired();
        return;
      }

      setUser(res);
    } catch (error) {
      console.error("Error validando sesión:", error);
      await showSessionExpired();
      return;
    } finally {
      setLoading(false);
    }
  }, [showSessionExpired]);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      await logout();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      setUser(null);
      setLoading(false);
      window.location.replace("/login");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo<AuthState>(
    () => ({
      loading,
      user,
      refresh,
      signOut,
    }),
    [loading, user, refresh, signOut]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}