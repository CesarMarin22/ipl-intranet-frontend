import { createContext } from "react";
import type { MeResponse } from "../../services/auth";

export type AuthState = {
  loading: boolean;
  user: MeResponse | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthState | null>(null);