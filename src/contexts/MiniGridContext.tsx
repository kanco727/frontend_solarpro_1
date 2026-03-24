import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
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
  refresh: (force?: boolean) => Promise<void>;
  loading: boolean;
};

const MiniGridContext = createContext<MiniGridContextType>({
  miniGrids: [],
  refresh: async () => {},
  loading: true,
});

export const useMiniGrids = () => useContext(MiniGridContext);

const CACHE_DURATION_MS = 60_000;

export const MiniGridProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [miniGrids, setMiniGrids] = useState<MiniGrid[]>([]);
  const [loading, setLoading] = useState(true);

  const lastFetchRef = useRef(0);
  const mountedRef = useRef(true);

  const fetchMiniGrids = useCallback(async (force = false) => {
    const token = localStorage.getItem("solarpro_token");

    if (!token) {
      if (!mountedRef.current) return;
      setMiniGrids([]);
      setLoading(false);
      lastFetchRef.current = 0;
      return;
    }

    const now = Date.now();
    const hasFreshCache =
      !force &&
      miniGrids.length > 0 &&
      now - lastFetchRef.current < CACHE_DURATION_MS;

    if (hasFreshCache) {
      return;
    }

    try {
      if (miniGrids.length === 0) {
        setLoading(true);
      }

      const data = await api.minigrids.list();

      if (!mountedRef.current) return;

      setMiniGrids(Array.isArray(data) ? data : []);
      lastFetchRef.current = Date.now();
    } catch (err) {
      console.error("Erreur MiniGrids:", err);

      if (!mountedRef.current) return;
      setMiniGrids([]);
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
    }
  }, [miniGrids.length]);

  useEffect(() => {
    mountedRef.current = true;
    fetchMiniGrids(true);

    return () => {
      mountedRef.current = false;
    };
  }, [fetchMiniGrids]);

  return (
    <MiniGridContext.Provider
      value={{
        miniGrids,
        refresh: fetchMiniGrids,
        loading,
      }}
    >
      {children}
    </MiniGridContext.Provider>
  );
};