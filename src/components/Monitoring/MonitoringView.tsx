// src/components/Monitoring/MonitoringView.tsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer
} from "recharts";
import {
  Battery,
  Users,
  Wifi,
  Zap,
  Radio,
  LayoutDashboard,
  History,
  AlertTriangle,
  Wrench,
  Settings,
  Activity,
} from "lucide-react";
import api from '../../services/api';
import { useMiniGrids } from "../../contexts/MiniGridContext";
import { useRealtime } from "../../contexts";
import type {
  MonitoringKPI,
  EnergyCurvePoint,
  EnergyDistribution,
  SiteStatus
} from "../../types/api";
import type {
  MinigridHistoryItem,
  HistoryCategory,
  HistorySeverity,
} from "../../types/history";

const COLORS = ["#34d399", "#facc15", "#3b82f6"];

type MonitoringTab = "overview" | "history";

export default function MonitoringView() {
  const { miniGrids, loading: loadingMiniGrids } = useMiniGrids();
  const { isConnected, realtimeData, subscribeToMiniGrid, unsubscribeFromMiniGrid } = useRealtime();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<MonitoringTab>("overview");

  const [kpis, setKpis] = useState<MonitoringKPI | null>(null);
  const [energyCurves, setEnergyCurves] = useState<EnergyCurvePoint[]>([]);
  const [energyDistribution, setEnergyDistribution] = useState<EnergyDistribution[]>([]);
  const [sitesStatus, setSitesStatus] = useState<SiteStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Historique
  const [historyItems, setHistoryItems] = useState<MinigridHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historySearch, setHistorySearch] = useState("");
  const [historyCategory, setHistoryCategory] = useState<HistoryCategory | "">("");
  const [historySeverity, setHistorySeverity] = useState<HistorySeverity | "">("");
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<MinigridHistoryItem | null>(null);

  const cacheRef = useRef<Map<number, {
    timestamp: number;
    data: {
      kpis: MonitoringKPI;
      curves: EnergyCurvePoint[];
      distribution: EnergyDistribution[];
      sites: SiteStatus[];
    };
  }>>(new Map());

  const CACHE_DURATION = 30000;

  useEffect(() => {
    if (miniGrids.length > 0 && !selectedId) {
      const storedId = localStorage.getItem('selectedMiniGridId');
      if (storedId && miniGrids.some(m => m.id === Number(storedId))) {
        setSelectedId(Number(storedId));
      } else {
        setSelectedId(miniGrids[0].id);
      }
    }
  }, [miniGrids, selectedId]);

  useEffect(() => {
    if (selectedId && isConnected) {
      subscribeToMiniGrid(selectedId);
      return () => {
        if (selectedId) {
          unsubscribeFromMiniGrid(selectedId);
        }
      };
    }
  }, [selectedId, isConnected, subscribeToMiniGrid, unsubscribeFromMiniGrid]);

  useEffect(() => {
    if (selectedId && realtimeData.has(selectedId)) {
      const realtime = realtimeData.get(selectedId)!;

      setKpis(prev => prev ? {
        ...prev,
        productionTotale_kw: realtime.production,
        consommation_kw: realtime.consumption,
        batterie_pourcentage: realtime.batteryLevel,
        utilisateurs_connectes: prev.utilisateurs_connectes,
        reseau_statut: 'online'
      } : null);

      setSitesStatus(realtime.sites);
    }
  }, [selectedId, realtimeData]);

  useEffect(() => {
    if (!selectedId) return;

    const loadHistoricalMonitoringData = async () => {
      setLoading(true);
      setError(null);
      const cached = cacheRef.current.get(selectedId);
      const now = Date.now();

      if (cached && now - cached.timestamp < CACHE_DURATION) {
        setEnergyCurves(cached.data.curves);
        setEnergyDistribution(cached.data.distribution);
        setLoading(false);
        return;
      }

      try {
        const [curvesData, distributionData] = await Promise.all([
          api.minigrids.getEnergyCurves(selectedId),
          api.minigrids.getEnergyDistribution(selectedId)
        ]);

        setEnergyCurves(curvesData);
        setEnergyDistribution(distributionData);

        cacheRef.current.set(selectedId, {
          timestamp: now,
          data: {
            kpis: {} as MonitoringKPI,
            curves: curvesData,
            distribution: distributionData,
            sites: []
          }
        });

        localStorage.setItem('selectedMiniGridId', selectedId.toString());
      } catch (err) {
        setError("Erreur lors du chargement des données historiques");
        console.error("Erreur monitoring:", err);
      } finally {
        setLoading(false);
      }
    };

    loadHistoricalMonitoringData();
  }, [selectedId]);

  const loadHistory = async () => {
    if (!selectedId) return;

    try {
      setHistoryLoading(true);
      setHistoryError(null);

      const response = await api.minigrids.getHistory(selectedId, {
        page: 1,
        page_size: 20,
        search: historySearch || undefined,
        category: historyCategory || undefined,
        severity: historySeverity || undefined,
      });

      setHistoryItems(response.items ?? []);
    } catch (err) {
      console.error(err);
      setHistoryError("Erreur lors du chargement de l’historique.");
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history" && selectedId) {
      loadHistory();
    }
  }, [activeTab, selectedId, historyCategory, historySeverity]);

  const displayKpis = kpis
    ? [
        {
          icon: <Zap className="text-yellow-500" />,
          title: "Production",
          value: `${kpis.productionTotale_kw?.toFixed(1) ?? 0} kW`,
        },
        {
          icon: <Zap className="text-blue-500" />,
          title: "Consommation",
          value: `${kpis.consommation_kw?.toFixed(1) ?? 0} kW`,
        },
        {
          icon: <Battery className="text-green-500" />,
          title: "Stockage",
          value: `${kpis.batterie_pourcentage ?? 0}%`,
        },
        {
          icon: <Users className="text-purple-500" />,
          title: "Utilisateurs",
          value: kpis.utilisateurs_connectes ?? 0,
        },
        {
          icon: (
            <Wifi
              className={`${
                kpis.reseau_statut === "online"
                  ? "text-green-500"
                  : kpis.reseau_statut === "alerte"
                  ? "text-yellow-500"
                  : "text-red-500"
              }`}
            />
          ),
          title: "Réseau",
          value:
            kpis.reseau_statut === "online"
              ? "En ligne"
              : kpis.reseau_statut === "alerte"
              ? "Alerte"
              : "Hors ligne",
        },
      ]
    : [];

  const historySummary = useMemo(() => {
    return {
      total: historyItems.length,
      alerts: historyItems.filter(item => item.category === "ALERT").length,
      connectivity: historyItems.filter(item => item.category === "CONNECTIVITY").length,
      maintenance: historyItems.filter(item => item.category === "MAINTENANCE").length,
      userActions: historyItems.filter(item => item.category === "USER_ACTION").length,
      critical: historyItems.filter(item => item.severity === "CRITICAL").length,
    };
  }, [historyItems]);

  return (
    <div className="p-6 space-y-6">
      {/* Header + sélection */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm text-gray-600">
                Sélectionner une mini-grid
              </label>

              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                  {isConnected ? 'Temps réel' : 'Hors ligne'}
                </span>
                {isConnected && <Radio className="w-4 h-4 text-green-500" />}
              </div>
            </div>

            <select
              className="w-full md:w-1/2 border rounded-xl px-3 py-2.5 bg-white"
              value={selectedId ?? ""}
              onChange={(e) => setSelectedId(Number(e.target.value))}
              disabled={loadingMiniGrids}
            >
              {miniGrids.map((mg) => (
                <option key={mg.id} value={mg.id}>
                  {mg.nom} — {mg.localite}
                </option>
              ))}
            </select>
          </div>

          {/* Onglets */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1 w-fit">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === "overview"
                  ? "bg-white shadow text-gray-900"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Vue générale
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === "history"
                  ? "bg-white shadow text-gray-900"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <History className="w-4 h-4" />
              Historique
            </button>
          </div>
        </div>
      </div>

      {loading && activeTab === "overview" && (
        <div className="text-center py-8 text-gray-500">
          Chargement des données...
        </div>
      )}

      {error && activeTab === "overview" && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Vue générale */}
      {activeTab === "overview" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {displayKpis.map((k, i) => (
              <KpiCard key={i} icon={k.icon} title={k.title} value={k.value} />
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card title="Production vs Consommation">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={energyCurves}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date_label" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="production_kw"
                    stroke="#34d399"
                    strokeWidth={3}
                    name="Production (kW)"
                  />
                  <Line
                    type="monotone"
                    dataKey="consommation_kw"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    name="Consommation (kW)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card title="État des Batteries">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={energyCurves}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date_label" />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="batterie_pourcentage"
                    fill="#facc15"
                    radius={[6, 6, 0, 0]}
                    name="Batterie (%)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Répartition Énergie" className="md:col-span-2">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={energyDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label
                  >
                    {COLORS.map((c, i) => (
                      <Cell key={i} fill={c} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Sites Mini-Grid</h2>
            <div className="divide-y">
              {sitesStatus.map((site) => (
                <SiteRow
                  key={site.id}
                  name={site.name}
                  status={
                    site.status === "online"
                      ? "En ligne"
                      : site.status === "alerte"
                      ? "Alerte"
                      : "Hors ligne"
                  }
                  production={
                    site.production_kw
                      ? `${site.production_kw.toFixed(1)} kW`
                      : "-"
                  }
                  users={site.users_count}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Historique */}
      {activeTab === "history" && (
        <div className="space-y-6">
          {historyError && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
              {historyError}
            </div>
          )}

          {/* Cartes résumé */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatsCard title="Événements" value={historySummary.total} icon={<Activity className="w-5 h-5 text-slate-600" />} />
            <StatsCard title="Alertes" value={historySummary.alerts} icon={<AlertTriangle className="w-5 h-5 text-amber-600" />} />
            <StatsCard title="Connectivité" value={historySummary.connectivity} icon={<Wifi className="w-5 h-5 text-blue-600" />} />
            <StatsCard title="Maintenance" value={historySummary.maintenance} icon={<Wrench className="w-5 h-5 text-orange-600" />} />
            <StatsCard title="Actions" value={historySummary.userActions} icon={<Settings className="w-5 h-5 text-purple-600" />} />
            <StatsCard title="Critiques" value={historySummary.critical} icon={<AlertTriangle className="w-5 h-5 text-red-600" />} />
          </div>

          {/* Barre filtres */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Rechercher dans l’historique..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") loadHistory();
                }}
                className="border rounded-xl px-3 py-2.5"
              />

              <select
                value={historyCategory}
                onChange={(e) => setHistoryCategory(e.target.value as HistoryCategory | "")}
                className="border rounded-xl px-3 py-2.5"
              >
                <option value="">Toutes les catégories</option>
                <option value="ALERT">Alertes</option>
                <option value="USER_ACTION">Actions utilisateur</option>
                <option value="CONNECTIVITY">Connectivité</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="COMMAND">Commandes</option>
                <option value="CONFIG">Configuration</option>
              </select>

              <select
                value={historySeverity}
                onChange={(e) => setHistorySeverity(e.target.value as HistorySeverity | "")}
                className="border rounded-xl px-3 py-2.5"
              >
                <option value="">Toutes les criticités</option>
                <option value="INFO">Info</option>
                <option value="LOW">Faible</option>
                <option value="MEDIUM">Moyenne</option>
                <option value="HIGH">Haute</option>
                <option value="CRITICAL">Critique</option>
              </select>

              <button
                onClick={loadHistory}
                className="rounded-xl bg-blue-600 text-white font-medium px-4 py-2.5 hover:bg-blue-700 transition"
              >
                Filtrer
              </button>
            </div>
          </div>

          {/* Liste historique */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold">Journal des événements</h2>
              <p className="text-sm text-gray-500 mt-1">
                Trace détaillée des actions, alertes, maintenances et incidents de la mini-grid.
              </p>
            </div>

            {historyLoading ? (
              <div className="p-8 text-center text-gray-500">Chargement de l’historique...</div>
            ) : historyItems.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Aucun événement trouvé.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {historyItems.map((item) => (
                  <HistoryRow
                    key={item.id}
                    item={item}
                    onClick={() => setSelectedHistoryItem(item)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Drawer détail */}
          {selectedHistoryItem && (
            <HistoryDetailsDrawer
              item={selectedHistoryItem}
              onClose={() => setSelectedHistoryItem(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}

/* --- Sous composants --- */

const KpiCard = ({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
}) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col items-center">
    <div className="text-2xl mb-2">{icon}</div>
    <div className="text-sm text-gray-500">{title}</div>
    <div className="text-lg font-bold">{value}</div>
  </div>
);

const StatsCard = ({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
}) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
    <div className="flex items-center justify-between mb-3">
      <div className="p-2 rounded-xl bg-gray-50">{icon}</div>
    </div>
    <div className="text-sm text-gray-500">{title}</div>
    <div className="text-2xl font-bold mt-1">{value}</div>
  </div>
);

const Card = ({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`bg-white rounded-2xl shadow-lg p-4 ${className}`}>
    <h2 className="text-lg font-semibold mb-4">{title}</h2>
    {children}
  </div>
);

const SiteRow = ({
  name,
  status,
  production,
  users,
}: {
  name: string;
  status: string;
  production: string | number;
  users: string | number;
}) => {
  const color =
    status === "En ligne"
      ? "text-green-600"
      : status === "Alerte"
      ? "text-yellow-600"
      : "text-red-600";

  return (
    <div className="py-3">
      <div className="flex justify-between items-center">
        <span className="font-medium">{name}</span>
        <span className={color}>{status}</span>
        <span>{production}</span>
        <span>{users} users</span>
        <button className="text-blue-500 hover:underline text-sm">Gérer</button>
      </div>
    </div>
  );
};

const HistoryRow = ({
  item,
  onClick,
}: {
  item: MinigridHistoryItem;
  onClick: () => void;
}) => {
  const badgeClass = getSeverityBadgeClass(item.severity);
  const icon = getHistoryCategoryIcon(item.category);

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-5 py-4 hover:bg-gray-50 transition"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-1">{icon}</div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-gray-900">{item.title}</h3>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${badgeClass}`}>
                {item.severity}
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                {formatCategoryLabel(item.category)}
              </span>
            </div>

            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {item.description}
            </p>

            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-gray-500">
              <span>{formatDate(item.created_at)}</span>
              <span>Source : {formatSourceLabel(item.source)}</span>
              {item.actor_name && <span>Acteur : {item.actor_name}</span>}
              <span>Type : {item.event_type}</span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};

const HistoryDetailsDrawer = ({
  item,
  onClose,
}: {
  item: MinigridHistoryItem;
  onClose: () => void;
}) => {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
      <div className="w-full max-w-lg h-full bg-white shadow-2xl p-6 overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {getHistoryCategoryIcon(item.category)}
              <span className="text-sm text-gray-500">{formatCategoryLabel(item.category)}</span>
            </div>
            <h2 className="text-xl font-semibold">{item.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200"
          >
            Fermer
          </button>
        </div>

        <div className="space-y-5">
          <DetailBlock label="Description" value={item.description} />
          <DetailBlock label="Date" value={formatDate(item.created_at)} />
          <DetailBlock label="Criticité" value={item.severity} />
          <DetailBlock label="Catégorie" value={formatCategoryLabel(item.category)} />
          <DetailBlock label="Type d’événement" value={item.event_type} />
          <DetailBlock label="Source" value={formatSourceLabel(item.source)} />
          {item.actor_name && <DetailBlock label="Acteur" value={item.actor_name} />}
          {item.status && <DetailBlock label="Statut" value={item.status} />}
          {item.old_value && <DetailBlock label="Ancienne valeur" value={item.old_value} />}
          {item.new_value && <DetailBlock label="Nouvelle valeur" value={item.new_value} />}

          {item.metadata && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Métadonnées</div>
              <pre className="bg-gray-50 border rounded-xl p-3 text-xs overflow-auto">
                {JSON.stringify(item.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DetailBlock = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div>
    <div className="text-sm font-medium text-gray-700 mb-1">{label}</div>
    <div className="text-sm text-gray-600">{value}</div>
  </div>
);

function getSeverityBadgeClass(severity: string) {
  switch (severity) {
    case "CRITICAL":
      return "bg-red-100 text-red-700";
    case "HIGH":
      return "bg-orange-100 text-orange-700";
    case "MEDIUM":
      return "bg-yellow-100 text-yellow-700";
    case "LOW":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getHistoryCategoryIcon(category: string) {
  switch (category) {
    case "ALERT":
      return <AlertTriangle className="w-4 h-4 text-amber-600" />;
    case "MAINTENANCE":
      return <Wrench className="w-4 h-4 text-orange-600" />;
    case "CONNECTIVITY":
      return <Wifi className="w-4 h-4 text-blue-600" />;
    case "CONFIG":
      return <Settings className="w-4 h-4 text-purple-600" />;
    case "USER_ACTION":
      return <Activity className="w-4 h-4 text-slate-600" />;
    default:
      return <History className="w-4 h-4 text-gray-500" />;
  }
}

function formatCategoryLabel(category: string) {
  switch (category) {
    case "ALERT":
      return "Alerte";
    case "USER_ACTION":
      return "Action utilisateur";
    case "CONNECTIVITY":
      return "Connectivité";
    case "MAINTENANCE":
      return "Maintenance";
    case "COMMAND":
      return "Commande";
    case "CONFIG":
      return "Configuration";
    default:
      return category;
  }
}

function formatSourceLabel(source: string) {
  switch (source) {
    case "SYSTEM":
      return "Système";
    case "USER":
      return "Utilisateur";
    case "DEVICE":
      return "Équipement";
    case "GATEWAY":
      return "Passerelle";
    case "TECHNICIAN":
      return "Technicien";
    default:
      return source;
  }
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}