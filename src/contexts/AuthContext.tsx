// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { AuthContextType, User } from "../types/ui";
import { BASE, USE_MOCK_DATA } from "../services/api";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const SESSION_DURATION_MS = 60 * 60 * 1000; // 1h

  const clearSession = () => {
    localStorage.removeItem("solarpro_user");
    localStorage.removeItem("solarpro_expire");
    localStorage.removeItem("solarpro_token");
  };

  const checkAuth = () => {
    const savedUser = localStorage.getItem("solarpro_user");
    const expireAt = localStorage.getItem("solarpro_expire");
    const token = localStorage.getItem("solarpro_token");
    const now = Date.now();

    if (savedUser && expireAt && token && now < parseInt(expireAt, 10)) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        clearSession();
        setUser(null);
      }
    } else {
      clearSession();
      setUser(null);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    checkAuth();
    const interval = setInterval(checkAuth, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
  try {
    setIsLoading(true);
    setMessage(null);

    if (USE_MOCK_DATA) {
      const mockUser: User = {
        id: 1,
        email,
        nomComplet: "Utilisateur Mock",
        role: "admin",
        locataireId: 1,
        mfaActive: false,
      };

      const expireAt = Date.now() + SESSION_DURATION_MS;
      localStorage.setItem("solarpro_user", JSON.stringify(mockUser));
      localStorage.setItem("solarpro_expire", expireAt.toString());
      localStorage.setItem("solarpro_token", "mock-token");

      setUser(mockUser);
      navigate("/");
      return true;
    }

    const res = await fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        mot_de_passe: password,
      }),
    });

    const text = await res.text();
    let data: any = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { detail: text || "Réponse non JSON du serveur." };
    }

    console.log("Réponse login complète:", data);

    if (!res.ok) {
      setMessage(
        typeof data?.detail === "string"
          ? data.detail
          : "Email ou mot de passe incorrect."
      );
      return false;
    }

    const backendUser = data?.user;
    const accessToken = data?.access_token;

    if (!backendUser || !accessToken) {
      setMessage("Réponse de connexion invalide.");
      console.error("Réponse login inattendue :", data);
      return false;
    }

    const userData: User = {
      id: backendUser.id,
      email: backendUser.email,
      nomComplet:
        backendUser.nom_complet ??
        backendUser.nom ??
        backendUser.email ??
        "Utilisateur",
      role: backendUser.role,
      mfaActive: backendUser.mfa_active ?? false,
      dernierLogin: backendUser.dernier_login ?? undefined,
    };

    const expireAt = Date.now() + SESSION_DURATION_MS;

    localStorage.setItem("solarpro_user", JSON.stringify(userData));
    localStorage.setItem("solarpro_expire", expireAt.toString());
    localStorage.setItem("solarpro_token", accessToken);

    setUser(userData);
    setMessage(null);
    navigate("/");
    return true;
  } catch (err: any) {
    console.error("Erreur de connexion:", err);
    setMessage(err?.message || "Erreur de connexion au serveur.");
    return false;
  } finally {
    setIsLoading(false);
  }
};

  const logout = (reason?: string) => {
    setUser(null);
    clearSession();
    setMessage(reason || "Déconnecté.");
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, message }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};