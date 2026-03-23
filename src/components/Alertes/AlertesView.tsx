import React, { useState, useEffect } from "react";
import axios from "axios";
import { Bell, Search, X } from "lucide-react";
import bgDashboard from "../../assets/bg-dashboard.jpg";
import { BASE } from "../../services/api";

interface Alerte {
  id: number;
  minigrid_id: number;
  minigrid_nom: string;
  type_alerte: string;
  niveau: string;
  message: string;
  time_stamp: string;
  statut?: string;
}

export default function AlertesView() {
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterNiveau, setFilterNiveau] = useState("all");
  const [filterStatut, setFilterStatut] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const API_URL = `${BASE}/alertes`;

  // 🔹 Charger les alertes
  const fetchAlertes = async () => {
    try {
      const res = await axios.get(`${API_URL}/full`);
      setAlertes(res.data);
    } catch (err) {
      console.error(err);
      setError("Erreur de chargement des alertes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertes();
    const interval = setInterval(fetchAlertes, 5000);
    return () => clearInterval(interval);
  }, []);

  // 🔹 Mettre à jour le statut (nouvelle logique)
  const handleChangeStatut = async (alerteId: number, nouveauStatut: string) => {
    try {
      if (nouveauStatut === "resolue") {
        const res = await axios.patch(`${API_URL}/${alerteId}/resolve`);
        alert(res.data.message);
      } else {
        await axios.patch(`${API_URL}/${alerteId}`, { statut: nouveauStatut });
      }

      // 🔄 Rechargement local
      fetchAlertes();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Erreur lors du changement de statut");
      console.error(err);
    }
  };

  // 🔹 Supprimer
  const handleDeleteAlerte = async (alerteId: number) => {
    if (!window.confirm("Supprimer cette alerte ?")) return;
    try {
      await axios.delete(`${API_URL}/${alerteId}`);
      setAlertes((prev) => prev.filter((a) => a.id !== alerteId));
    } catch (err) {
      console.error("Erreur suppression:", err);
    }
  };

  // 🔹 Filtres
  const filteredAlertes = alertes.filter((alerte) => {
    const matchesNiveau =
      filterNiveau === "all" || alerte.niveau === filterNiveau;
    const matchesStatut =
      filterStatut === "all" ||
      (filterStatut === "active" && alerte.statut !== "resolue") ||
      (filterStatut === "resolved" && alerte.statut === "resolue");
    const matchesSearch =
      alerte.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (alerte.minigrid_nom &&
        alerte.minigrid_nom.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (alerte.type_alerte &&
        alerte.type_alerte.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesNiveau && matchesStatut && matchesSearch;
  });

  const getNiveauBadge = (niveau: string) => {
    const styles: Record<string, string> = {
      crit: "bg-red-100 text-red-700 border-red-200",
      warn: "bg-orange-100 text-orange-700 border-orange-200",
      info: "bg-blue-100 text-blue-700 border-blue-200",
    };
    const labels: Record<string, string> = {
      crit: "Critique",
      warn: "Attention",
      info: "Information",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold border ${styles[niveau]}`}
      >
        {labels[niveau]}
      </span>
    );
  };

  const formatDate = (ts: string) =>
    new Date(ts).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading)
    return <p className="p-6 text-gray-300">Chargement des alertes...</p>;
  if (error) return <p className="p-6 text-red-400">{error}</p>;

  const alertesActives = alertes.filter((a) => a.statut !== "resolue");
  const alertesCritiques = alertes.filter((a) => a.niveau === "crit");

  return (
    <div
      className="relative min-h-screen bg-cover bg-center bg-fixed bg-no-repeat"
      style={{
        backgroundImage: `url(${bgDashboard})`,
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/30"></div>

      <div className="relative p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white drop-shadow-md flex items-center gap-2">
              ⚠️ Centre d'Alertes
            </h1>
            <p className="text-gray-200 mt-1">
              Suivi des alertes générées par les mini-grids SolarPro
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-red-400">
              {alertesCritiques.length} critiques
            </span>
            <span className="text-sm font-semibold text-green-400">
              {alertesActives.length} actives
            </span>
          </div>
        </div>

        {/* Filtres + Recherche */}
        <div className="bg-white/95 rounded-2xl shadow-xl border border-gray-200 p-4 flex flex-wrap items-center gap-4 backdrop-blur-md">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher une alerte..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={filterNiveau}
              onChange={(e) => setFilterNiveau(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-1 focus:ring-green-400"
            >
              <option value="all">Tous niveaux</option>
              <option value="crit">Critique</option>
              <option value="warn">Attention</option>
              <option value="info">Information</option>
            </select>
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-1 focus:ring-green-400"
            >
              <option value="all">Tous statuts</option>
              <option value="active">Actives</option>
              <option value="resolved">Résolues</option>
            </select>
          </div>
        </div>

        {/* Liste des alertes */}
        <div className="space-y-4">
          {filteredAlertes.map((alerte) => (
            <div
              key={alerte.id}
              className="bg-white/90 rounded-2xl shadow-md border border-gray-200 p-5 hover:shadow-2xl transition-all backdrop-blur-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {alerte.type_alerte}
                    </h3>
                    {getNiveauBadge(alerte.niveau)}
                    {alerte.statut && (
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${
                          alerte.statut === "resolue"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : alerte.statut === "en_traitement"
                            ? "bg-orange-100 text-orange-700 border-orange-200"
                            : "bg-red-100 text-red-700 border-red-200"
                        }`}
                      >
                        {alerte.statut}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700">{alerte.message}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {alerte.minigrid_nom} • {formatDate(alerte.time_stamp)}
                  </p>
                </div>

                <div className="flex gap-2">
                  {alerte.statut !== "resolue" && (
                    <>
                      <button
                        onClick={() =>
                          handleChangeStatut(alerte.id, "en_traitement")
                        }
                        className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-sm hover:bg-orange-200"
                      >
                        En cours
                      </button>
                      <button
                        onClick={() =>
                          handleChangeStatut(alerte.id, "resolue")
                        }
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200"
                      >
                        Résolue
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDeleteAlerte(alerte.id)}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredAlertes.length === 0 && (
            <div className="text-center py-12 text-gray-400 bg-white/80 rounded-xl backdrop-blur-sm">
              <Bell className="w-10 h-10 mx-auto mb-3 text-green-500" />
              Aucune alerte trouvée.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
