// src/components/Dashboard/Dashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
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

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { miniGrids } = useMiniGrids();
  const { isConnected, realtimeData } = useRealtime();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [rapports, setRapports] = useState<RapportMaintenance[]>([]);
  const [nouveauxRapports, setNouveauxRapports] = useState(0);

  // === Chargement des données générales ===
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        const resStats = await fetch(`${BASE}/statistiques/globales`);
        if (!resStats.ok) {
          throw new Error(`Erreur stats globales: ${resStats.status}`);
        }
        const dataStats: GlobalStats = await resStats.json();
        setStats(dataStats);

        const resRapports = await fetch(`${BASE}/statistiques/maintenance_rapports`);
        if (!resRapports.ok) {
          throw new Error(`Erreur rapports maintenance: ${resRapports.status}`);
        }
        const dataRapports: RapportMaintenance[] = await resRapports.json();
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
        toast.error("Erreur lors du chargement des statistiques globales");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // === Mise à jour temps réel des alertes ===
  useEffect(() => {
    if (!stats || realtimeData.size === 0) return;

    const totalRealtimeAlerts = Array.from(realtimeData.values()).reduce(
      (sum, data) => sum + data.alerts.filter((a) => !a.resolved).length,
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

  // === Calculs synchronisés avec les mini-grids ===
  const productionTotale = useMemo(() => {
    return miniGrids.reduce((sum, m) => sum + Number(m.production_kw || 0), 0);
  }, [miniGrids]);

  const normalizeStatus = (statut?: string) => {
  const s = (statut || "").toLowerCase().trim();

  if (s === "en service" || s === "en_service" || s === "en_ligne") return "en_service";
  if (s === "maintenance") return "maintenance";
  if (s === "hors service" || s === "hors_service") return "hors_service";
  if (s === "projete" || s === "projeté") return "projete";

  return s;
};

const minigridsActives = useMemo(() => {
  return miniGrids.filter((m) => normalizeStatus(m.statut) === "en_service").length;
}, [miniGrids]);

const minigridsMaintenance = useMemo(() => {
  return miniGrids.filter((m) => normalizeStatus(m.statut) === "maintenance").length;
}, [miniGrids]);

  const moyenneBatterie = useMemo(() => {
    return miniGrids.length
      ? Math.round(
          miniGrids.reduce((sum, m) => sum + Number(m.batterie_soc || 0), 0) /
            miniGrids.length
        )
      : 0;
  }, [miniGrids]);

  if (loading) {
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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

      <div className="relative space-y-6 z-10">
        <Toaster position="top-right" />

        {/* Header */}
        <div className="flex items-center justify-between text-white">
          <div>
            <h1 className="text-3xl font-bold drop-shadow-lg">
              🌞 Tableau de Bord SolarPro
            </h1>
            <p className="text-gray-200 mt-1 drop-shadow-sm">
              Vue d'ensemble des installations solaires du Burkina Faso
            </p>
          </div>

          {/* Utilisateur */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 shadow-lg">
            <div className="bg-green-500 p-2 rounded-full text-white font-bold">
              {user?.nomComplet
                ? user.nomComplet[0].toUpperCase()
                : user?.email?.[0]?.toUpperCase() ?? "U"}
            </div>

            <div className="text-right mr-2 leading-tight">
              <p className="text-sm font-semibold text-white">{user?.email}</p>
              <p className="text-xs text-green-300 capitalize">{user?.role}</p>
            </div>

            <div className="flex items-center gap-2 mr-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"
                }`}
              ></div>
              <span className="text-xs text-white/80">
                {isConnected ? "RT" : "OFF"}
              </span>
            </div>

            <button
              onClick={() => logout()}
              className="flex items-center gap-1 px-2 py-1 text-white/80 hover:text-white hover:bg-white/10 rounded-md transition"
              title="Déconnexion"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notification maintenance */}
        {nouveauxRapports > 0 && (
          <div className="bg-green-100/80 backdrop-blur-sm border border-green-200 rounded-xl p-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <Wrench className="text-green-700 w-5 h-5" />
              <span className="text-green-900 font-medium">
                🛠️ {nouveauxRapports} nouveau(x) rapport(s) de maintenance soumis récemment
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

        {/* Cartes principales */}
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
            change={productionTotale > 0 ? "mise à jour temps réel" : "aucune production"}
            changeType={productionTotale > 0 ? "positive" : "neutral"}
          />

          <StatsCard
            title="Alertes Actives"
            value={stats.total_alertes}
            icon={AlertTriangle}
            color="red"
            change="alertes critiques"
            changeType={stats.total_alertes > 0 ? "negative" : "positive"}
          />

          <StatsCard
            title="Rapports Envoyés"
            value={stats.tickets_rapport_envoye}
            icon={FileText}
            color="blue"
            change={`${stats.tickets_termines} terminés`}
            changeType="positive"
          />
        </div>

        {/* Graphique + carte */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 p-4">
            <EnergyChart />
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 p-4">
            <MiniGridMap />
          </div>
        </div>

        {/* Performance + alertes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Performance Générale
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

          <div className="lg:col-span-2 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 p-4">
            <AlertsList />
          </div>
        </div>
      </div>
    </div>
  );
}