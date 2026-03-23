import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

export type MiniGrid = {
  id: number;
  nom: string;
  statut: string;
  site_id: number;
  localite: string;
  latitude: number;
  longitude: number;
  production_kw?: number;
  batterie_soc?: number;
  temperature?: number;
  utilisateurs_actifs?: number;
  statut_reseau?: string;
};

type MiniGridContextType = {
  miniGrids: MiniGrid[];
  refresh: () => void;
  loading: boolean;
};

const MiniGridContext = createContext<MiniGridContextType>({
  miniGrids: [],
  refresh: () => {},
  loading: true,
});

export const useMiniGrids = () => useContext(MiniGridContext);

export const MiniGridProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [miniGrids, setMiniGrids] = useState<MiniGrid[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMiniGrids = async () => {
    try {
      setLoading(true);
      const data = await api.minigrids.list();
      setMiniGrids(data);
    } catch (err) {
      console.error("Erreur MiniGrids:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMiniGrids();

    //const interval = setInterval(fetchMiniGrids, 5000); // ✅ 5 secondes
    //return () => clearInterval(interval);
  }, []);

  return (
    <MiniGridContext.Provider value={{ miniGrids, refresh: fetchMiniGrids, loading }}>
      {children}
    </MiniGridContext.Provider>
  );
};