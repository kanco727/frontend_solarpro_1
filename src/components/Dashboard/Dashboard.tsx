import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Zap,
  Sun,
  AlertTriangle,
  Activity,
  Battery,
  TrendingUp,
  LogOut,
  FileText,
  Wrench,
} from "lucide-react";
import StatsCard from "./StatsCard";
import AlertsList from "./AlertsList";
import EnergyChart from "./EnergyChart";
import MiniGridMap from "./MiniGridMap";
import { useAuth } from "../../contexts/AuthContext";
import { useRealtime } from "../../contexts/RealtimeContext";
import toast, { Toaster } from "react-hot-toast";
import { Link } from "react-router-dom";
import bgImage from "../../assets/bg-dashboard.jpg";
import { useMiniGrids } from "../../contexts/MiniGridContext";
import { BASE } from "../../services/api";

interface GlobalStats {
  total_minigrids: number;
  total_alertes: number;
  total_tickets: number;
  tickets_en_cours: number;
  tickets_termines: number;
  tickets_rapport_envoye: number;
}

interface RapportMaintenance {
  id: number;
  minigrid_id: number;
  type: string;
  priorite: string;
  statut: string;
  rapport: string | null;
  date_creation: string;
}

function getAuthHeaders() {
  const token = localStorage.getItem("solarpro_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function Dashboard() {
  const { logout } = useAuth();
  const { miniGrids, loading: miniGridsLoading } = useMiniGrids();
  const { isConnected, realtimeData } = useRealtime();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [rapports, setRapports] = useState<RapportMaintenance[]>([]);
  const [nouveauxRapports, setNouveauxRapports] = useState(0);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchStats = async () => {
      try {
        if (!stats) {
          setLoading(true);
        }

        const [resStats, resRapports] = await Promise.all([
          fetch(`${BASE}/statistiques/globales`, {
            headers: getAuthHeaders(),
          }),
          fetch(`${BASE}/statistiques/maintenance_rapports`, {
            headers: getAuthHeaders(),
          }),
        ]);

        if (!resStats.ok) {
          throw new Error(`Erreur stats globales: ${resStats.status}`);
        }

        if (!resRapports.ok) {
          throw new Error(`Erreur rapports maintenance: ${resRapports.status}`);
        }

        const [dataStats, dataRapports]: [
          GlobalStats,
          RapportMaintenance[]
        ] = await Promise.all([resStats.json(), resRapports.json()]);

        if (!mountedRef.current) return;

        setStats(dataStats);
        setRapports(dataRapports);

        const now = new Date();
        const recents = dataRapports.filter((r) => {
          if (!r.date_creation) return false;
          const diff =
            (now.getTime() - new Date(r.date_creation).getTime()) /
            (1000 * 60 * 60 * 24);
          return diff < 2;
        });

        setNouveauxRapports(recents.length);
      } catch (error) {
        console.error("Erreur chargement dashboard :", error);
        if (mountedRef.current) {
          toast.error("Erreur lors du chargement des statistiques globales");
        }
      } finally {
        if (!mountedRef.current) return;
        setLoading(false);
      }
    };

    const delayedStart = setTimeout(fetchStats, 300);
    const interval = setInterval(fetchStats, 120_000);

    return () => {
      mountedRef.current = false;
      clearTimeout(delayedStart);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!stats || realtimeData.size === 0) return;

    const totalRealtimeAlerts = Array.from(realtimeData.values()).reduce(
      (sum, data) => sum + data.alerts.filter((a: any) => !a.resolved).length,
      0
    );

    setStats((prev) =>
      prev
        ? {
            ...prev,
            total_alertes: Math.max(prev.total_alertes, totalRealtimeAlerts),
          }
        : null
    );
  }, [realtimeData]);

  const productionTotale = useMemo(() => {
    return miniGrids.reduce((sum, m) => sum + Number(m.production_kw || 0), 0);
  }, [miniGrids]);

  const normalizeStatus = (statut?: string) => {
    const s = (statut || "").toLowerCase().trim();

    if (s === "en service" || s === "en_service" || s === "en_ligne") {
      return "en_service";
    }
    if (s === "maintenance") return "maintenance";
    if (s === "hors service" || s === "hors_service") return "hors_service";
    if (s === "projete" || s === "projeté") return "projete";

    return s;
  };

  const minigridsActives = useMemo(() => {
    return miniGrids.filter((m) => normalizeStatus(m.statut) === "en_service")
      .length;
  }, [miniGrids]);

  const minigridsMaintenance = useMemo(() => {
    return miniGrids.filter((m) => normalizeStatus(m.statut) === "maintenance")
      .length;
  }, [miniGrids]);

  const moyenneBatterie = useMemo(() => {
    return miniGrids.length
      ? Math.round(
          miniGrids.reduce((sum, m) => sum + Number(m.batterie_soc || 0), 0) /
            miniGrids.length
        )
      : 0;
  }, [miniGrids]);

  if (loading && miniGridsLoading && !stats) {
    return <div className="p-6 text-gray-100">Chargement des données...</div>;
  }

  if (!stats) {
    return (
      <div className="p-6 text-red-500">
        Impossible de charger les statistiques.
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat p-6 relative"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <Toaster position="top-right" />
      <div className="absolute inset-0 bg-black/40"></div>

      <div className="relative z-10 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Tableau de bord SolarPro
            </h1>
            <p className="text-white/80 mt-1">
              Bienvenue sur la supervision temps réel des mini-grids
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                isConnected
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {isConnected ? "Temps réel actif" : "Temps réel indisponible"}
            </div>

            <button
              onClick={() => logout()}
              className="bg-white/90 hover:bg-white text-gray-800 px-4 py-2 rounded-md transition"
              title="Déconnexion"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {nouveauxRapports > 0 && (
          <div className="bg-green-100/80 backdrop-blur-sm border border-green-200 rounded-xl p-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <Wrench className="text-green-700 w-5 h-5" />
              <span className="text-green-900 font-medium">
                🛠️ {nouveauxRapports} nouveau(x) rapport(s) de maintenance soumis
                récemment
              </span>
            </div>
            <Link
              to="/statistiques"
              className="text-green-800 hover:text-green-950 font-semibold underline text-sm"
            >
              Voir les rapports
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Mini-Grids Actives"
            value={minigridsActives}
            icon={Zap}
            color="green"
            change={`${minigridsMaintenance} en maintenance`}
            changeType="neutral"
          />

          <StatsCard
            title="Production Totale"
            value={`${productionTotale.toFixed(1)} kW`}
            icon={Sun}
            color="orange"
            change={
              productionTotale > 0
                ? "mise à jour temps réel"
                : "aucune production"
            }
            changeType={productionTotale > 0 ? "positive" : "neutral"}
          />

          <StatsCard
            title="Alertes Actives"
            value={stats.total_alertes}
            icon={AlertTriangle}
            color="red"
            change="alertes critiques"
            changeType={stats.total_alertes > 0 ? "negative" : "neutral"}
          />

          <StatsCard
            title="Rapports envoyés"
            value={stats.tickets_rapport_envoye}
            icon={FileText}
            color="blue"
            change={`${rapports.length} total`}
            changeType="positive"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <MiniGridMap />
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              État global du système
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Battery className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-700">Niveau Batteries</span>
                </div>
                <span className="text-sm font-medium text-green-700">
                  {moyenneBatterie}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-gray-700">Tickets en cours</span>
                </div>
                <span className="text-sm font-medium text-blue-700">
                  {stats.tickets_en_cours}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  <span className="text-sm text-gray-700">Tickets terminés</span>
                </div>
                <span className="text-sm font-medium text-orange-600">
                  {stats.tickets_termines}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <EnergyChart />
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 p-4">
            <AlertsList />
          </div>
        </div>
      </div>
    </div>
  );
}