import { useContext } from "react";
import { AuthContext, type AuthI } from ".";

export const useAuth = (): AuthI => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
