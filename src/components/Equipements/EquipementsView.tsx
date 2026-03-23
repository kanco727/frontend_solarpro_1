import React, { useEffect, useState } from "react";
import { Cpu, Loader2, Power, Radio } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useRealtime } from "../../contexts";
import api from "../../services/api";
import { toast } from "react-hot-toast";

export default function EquipementsView() {
  const { user } = useAuth();
  const { isConnected, sendCommand } = useRealtime();
  const [equipements, setEquipements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMinigrid, setSelectedMinigrid] = useState<number | null>(null);
  const [minigrids, setMinigrids] = useState<any[]>([]);

  // Charger les mini-grids pour le sélecteur
  useEffect(() => {
    api.minigrids
      .list()
      .then(setMinigrids)
      .catch((err) => console.error("Erreur minigrids:", err));
  }, []);

  // Charger les équipements du site sélectionné
  const loadEquipements = async () => {
    if (!selectedMinigrid) return;
    try {
      setLoading(true);
      const data = await api.equipements.list(selectedMinigrid);
      setEquipements(data);
    } catch (err) {
      console.error("Erreur équipements:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMinigrid) loadEquipements();
  }, [selectedMinigrid]);

  // --- Commande temps réel ON/OFF ---
  const toggleEquipement = async (id: number, statut: string) => {
    if (!selectedMinigrid) {
      toast.error("Veuillez d'abord sélectionner une mini-grid");
      return;
    }

    const action = statut === "actif" ? "turn_off" : "turn_on";
    const confirmMessage = `Voulez-vous vraiment ${action === "turn_on" ? "activer" : "désactiver"} cet équipement ?`;

    if (!confirm(confirmMessage)) return;

    try {
      if (isConnected) {
        // Commande temps réel via WebSocket
        await sendCommand(selectedMinigrid, action, { equipementId: id });
        toast.success(`Commande ${action} envoyée (temps réel)`);

        // Optimistic update - mise à jour immédiate de l'interface
        setEquipements((prev) =>
          prev.map((eq) =>
            eq.id === id
              ? { ...eq, statut: action === "turn_on" ? "actif" : "inactif" }
              : eq
          )
        );
      } else {
        // Fallback vers HTTP si WebSocket non connecté
        const data = await api.equipements.sendCommand(id, action);
        setEquipements((prev) =>
          prev.map((eq) => (eq.id === id ? { ...eq, statut: data.statut } : eq))
        );
        toast.success("Commande exécutée (HTTP)");
      }
    } catch (err) {
      console.error("Erreur lors du changement de statut:", err);
      toast.error("Erreur lors de l'exécution de la commande");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Cpu className="text-blue-600 w-6 h-6" /> Gestion des équipements
        </h1>
        <div className="flex items-center gap-4">
          {/* Indicateur de connexion temps réel */}
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
              {isConnected ? 'Temps réel' : 'Hors ligne'}
            </span>
            {isConnected && <Radio className="w-4 h-4 text-green-500" />}
          </div>
          <p className="text-gray-500 text-sm">
            {user?.role === "admin" || user?.role === "technicien"
              ? "Mode contrôle activé"
              : "Mode lecture seule"}
          </p>
        </div>
      </div>

      {/* Sélecteur MiniGrid */}
      <div className="mb-4">
        <label className="block text-sm text-gray-600 mb-1">
          Sélectionner une mini-grid
        </label>
        <select
          className="w-full md:w-1/3 border rounded-lg px-3 py-2"
          value={selectedMinigrid ?? ""}
          onChange={(e) => setSelectedMinigrid(Number(e.target.value))}
        >
          <option value="">-- Choisir un site --</option>
          {minigrids.map((mg) => (
            <option key={mg.id} value={mg.id}>
              {mg.nom} — {mg.localite}
            </option>
          ))}
        </select>
      </div>

      {/* Liste des équipements */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Liste des équipements</h2>

        {loading ? (
          <div className="flex justify-center items-center py-6 text-gray-500">
            <Loader2 className="animate-spin w-5 h-5 mr-2" /> Chargement...
          </div>
        ) : (
          <>
            {equipements.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucun équipement trouvé pour ce site.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {equipements.map((eq) => (
                  <div key={eq.id} className="py-3 flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-800">{eq.modele ?? "Inconnu"}</span>
                      <span className="text-xs text-gray-500">N° série : {eq.numero_serie}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          eq.statut === "actif"
                            ? "bg-green-100 text-green-700"
                            : eq.statut === "maintenance"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {eq.statut || "inconnu"}
                      </span>

                      {/* Bouton de contrôle visible uniquement pour les admins / techniciens */}
                      {(user?.role === "admin" || user?.role === "technicien") && (
                        <button
                          onClick={() => toggleEquipement(eq.id, eq.statut)}
                          className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition ${
                            eq.statut === "actif"
                              ? "bg-red-500 hover:bg-red-600 text-white"
                              : "bg-green-500 hover:bg-green-600 text-white"
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          {eq.statut === "actif" ? "Désactiver" : "Activer"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
