import React, { useEffect, useState } from "react";
import {
  Search,
  Filter,
  AlertTriangle,
  Wrench,
  Wifi,
  Settings,
  User,
} from "lucide-react";
import { fetchMinigridHistory } from "../../services/historyService";
import type {
  MinigridHistoryItem,
  HistoryCategory,
  HistorySeverity,
} from "../../types/history";

interface Props {
  minigridId: number;
}

function getCategoryIcon(category: string) {
  switch (category) {
    case "ALERT":
      return <AlertTriangle size={16} />;
    case "MAINTENANCE":
      return <Wrench size={16} />;
    case "CONNECTIVITY":
      return <Wifi size={16} />;
    case "CONFIG":
      return <Settings size={16} />;
    case "USER_ACTION":
      return <User size={16} />;
    default:
      return <Filter size={16} />;
  }
}

function getSeverityClass(severity: string) {
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

export default function MinigridHistoryTab({ minigridId }: Props) {
  const [items, setItems] = useState<MinigridHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<HistoryCategory | "">("");
  const [severity, setSeverity] = useState<HistorySeverity | "">("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchMinigridHistory(minigridId, {
        page: 1,
        page_size: 20,
        search: search.trim() ? search : undefined,
        category: category === "" ? undefined : category,
        severity: severity === "" ? undefined : severity,
      });

      setItems(data.items);
    } catch (err) {
      console.error("Erreur chargement historique", err);
      setError("Erreur lors du chargement de l'historique.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (minigridId) {
      loadData();
    }
  }, [minigridId, category, severity]);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2 border rounded-lg px-3 py-2">
            <Search size={16} />
            <input
              type="text"
              placeholder="Rechercher dans l'historique..."
              className="w-full outline-none text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") loadData();
              }}
            />
          </div>

          <select
            className="border rounded-lg px-3 py-2 text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value as HistoryCategory | "")}
          >
            <option value="">Toutes les catégories</option>
            <option value="ALERT">Alertes</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="CONNECTIVITY">Connectivité</option>
            <option value="COMMAND">Commandes</option>
            <option value="CONFIG">Configuration</option>
            <option value="USER_ACTION">Actions utilisateur</option>
          </select>

          <select
            className="border rounded-lg px-3 py-2 text-sm"
            value={severity}
            onChange={(e) => setSeverity(e.target.value as HistorySeverity | "")}
          >
            <option value="">Toutes les criticités</option>
            <option value="INFO">Info</option>
            <option value="LOW">Faible</option>
            <option value="MEDIUM">Moyenne</option>
            <option value="HIGH">Haute</option>
            <option value="CRITICAL">Critique</option>
          </select>

          <button
            className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm"
            onClick={loadData}
          >
            Filtrer
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-4 py-3 border-b font-semibold">
          Historique des événements
        </div>

        {loading ? (
          <div className="p-6 text-sm text-gray-500">Chargement...</div>
        ) : error ? (
          <div className="p-6 text-sm text-red-600">{error}</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">Aucun événement trouvé.</div>
        ) : (
          <div className="divide-y">
            {items.map((item) => (
              <div key={item.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <div className="mt-1 text-gray-600">
                      {getCategoryIcon(item.category)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-sm">{item.title}</h4>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getSeverityClass(
                            item.severity
                          )}`}
                        >
                          {item.severity}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                          {item.category}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mt-1">
                        {item.description}
                      </p>

                      <div className="text-xs text-gray-500 mt-2 flex flex-wrap gap-3">
                        <span>{new Date(item.created_at).toLocaleString()}</span>
                        <span>Source: {item.source}</span>
                        {item.actor_name && <span>Acteur: {item.actor_name}</span>}
                        <span>Type: {item.event_type}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {(item.old_value || item.new_value) && (
                  <div className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                    {item.old_value && (
                      <div>Ancienne valeur: {item.old_value}</div>
                    )}
                    {item.new_value && (
                      <div>Nouvelle valeur: {item.new_value}</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}