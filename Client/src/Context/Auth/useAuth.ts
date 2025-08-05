import { createContext, useContext } from "react";
import type { AuthI } from ".";

const AuthContext = createContext<AuthI | null>(null);

export const useAuth = (): AuthI => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
