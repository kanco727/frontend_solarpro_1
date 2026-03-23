import React from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapPin, Zap, Sun, Wifi } from "lucide-react";
import { markerIcons } from "./markerIcons";
import { useMiniGrids } from "../../contexts/MiniGridContext"; // 🔗 données partagées avec Dashboard

// ======== COMPOSANT PRINCIPAL =========
export default function MiniGridMap() {
  // Correction Leaflet pour les icônes par défaut
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });

  // Données venant du contexte
  const { miniGrids } = useMiniGrids();

  // Choisir l’icône selon le statut
  const normalizeStatus = (statut?: string) => {
  const s = (statut || "").toLowerCase().trim();

  if (s === "en service" || s === "en_service" || s === "en_ligne") return "en_service";
  if (s === "maintenance") return "maintenance";
  if (s === "hors service" || s === "hors_service") return "hors_service";
  if (s === "projete" || s === "projeté") return "projete";

  return s;
};

const getIconByStatut = (statut: string) => {
  switch (normalizeStatus(statut)) {
    case "en_service":
      return markerIcons.en_service;
    case "maintenance":
      return markerIcons.maintenance;
    case "hors_service":
      return markerIcons.hors_service;
    default:
      return markerIcons.default;
  }
};
  // Calculs de synthèse
  const totalProduction = miniGrids.reduce((sum, m) => sum + (m.production_kw || 0), 0).toFixed(1);

  return (
    <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
      {/* ======== HEADER ======== */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-5 h-5" /> Cartographie des Installations
          </h2>
          <p className="text-gray-500 text-sm">
            Vue géographique de toutes les mini-grids au Burkina Faso
          </p>
        </div>
        <div className="flex gap-3 items-center text-sm">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div> En Service
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div> Maintenance
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div> Hors Service
          </span>
        </div>
      </div>

      {/* ======== CARTE ======== */}
      <MapContainer
        center={[12.4, -1.6]}
        zoom={7}
        style={{ height: "420px", width: "100%", borderRadius: "0.75rem" }}
      >
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {miniGrids.filter(mg => mg.latitude != null && mg.longitude != null).map((mg) => (
          <Marker
            key={mg.id}
            position={[mg.latitude, mg.longitude]}
            icon={getIconByStatut(mg.statut)}
          >
            <Popup>
              <div className="text-sm font-medium">
                <div className="font-semibold text-base">{mg.nom}</div>
                <div className="text-gray-600">{mg.localite}</div>
                <hr className="my-1" />
                ⚡ Production : {mg.production_kw} kW<br />
                🔋 Batterie : {mg.batterie_soc}%<br />
                🌡️ Température : {mg.temperature} °C<br />
                👥 Usagers : {mg.utilisateurs_actifs}<br />
                🌐 Réseau : {mg.statut_reseau}
              </div>
            </Popup>
            <Tooltip>{mg.nom}</Tooltip>
          </Marker>
        ))}
      </MapContainer>

      {/* ======== SYNTHÈSE ======== */}
      <div className="grid grid-cols-3 gap-4 mt-5">
        <div className="p-4 border rounded-xl bg-gray-50 flex flex-col">
          <div className="flex items-center gap-2 text-green-600 font-semibold">
            <Zap className="w-4 h-4" /> Mini-Grids
          </div>
          <p className="text-gray-500 text-sm mt-2">
            Total : {miniGrids.length}
            <br />
            Puissance totale : {totalProduction} kW
          </p>
        </div>

        <div className="p-4 border rounded-xl bg-gray-50 flex flex-col">
          <div className="flex items-center gap-2 text-orange-600 font-semibold">
            <Sun className="w-4 h-4" /> Systèmes SHS
          </div>
          <p className="text-gray-500 text-sm mt-2">En développement…</p>
        </div>

        <div className="p-4 border rounded-xl bg-gray-50 flex flex-col">
          <div className="flex items-center gap-2 text-blue-600 font-semibold">
            <Wifi className="w-4 h-4" /> Couverture
          </div>
          <p className="text-gray-500 text-sm mt-2">
            Régions couvertes : {new Set(miniGrids.map((m) => m.localite)).size}
            <br />
            Disponibilité : <span className="text-green-600 font-semibold">96.2%</span>
          </p>
        </div>
      </div>
    </div>
  );
}
