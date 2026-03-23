import React, { useMemo, useState } from "react";
import {
  MapPin,
  Zap,
  Sun,
  Layers,
  Navigation,
  X,
  Wifi,
} from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  ZoomControl,
  useMap,
} from "react-leaflet";
import L, { DivIcon, LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useMiniGrids } from "../../contexts/MiniGridContext";

// =============================================
// === CARTOGRAPHIE DES INSTALLATIONS SOLAIRES ===
// =============================================
export default function MapView() {
  const { miniGrids, loading } = useMiniGrids();
  const [selectedStatus, setSelectedStatus] = useState<
    "all" | "en_service" | "maintenance" | "hors_service"
  >("all");
  const [activeGrid, setActiveGrid] = useState<any | null>(null);

  // === Filtrage ===
  const filtered = useMemo(() => {
    return miniGrids.filter(
      (m) => selectedStatus === "all" || m.statut === selectedStatus
    );
  }, [miniGrids, selectedStatus]);

  // === Style de statut ===
  const getStatusColor = (statut: string) => {
    switch (statut) {
      case "en_service":
        return { bg: "#22c55e", border: "#16a34a" };
      case "maintenance":
        return { bg: "#f59e0b", border: "#d97706" };
      case "hors_service":
        return { bg: "#ef4444", border: "#dc2626" };
      default:
        return { bg: "#9ca3af", border: "#6b7280" };
    }
  };

  // === Icône personnalisée (identique à MiniGridMap) ===
  const makeDivIcon = (grid: any): DivIcon => {
    const { bg, border } = getStatusColor(grid.statut);
    const html = `
      <div style="
        width:32px;height:32px;
        border-radius:50%;
        background:${bg};
        border:2px solid ${border};
        display:flex;
        align-items:center;
        justify-content:center;
        color:white;
        font-size:14px;
        font-weight:bold;
        box-shadow:0 3px 8px rgba(0,0,0,0.25);
        transition:transform 0.15s ease-in-out;
      ">⚡</div>`;
    return L.divIcon({
      className: "custom-marker",
      html,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });
  };

  // === Adapter la carte aux marqueurs ===
  function FitToMarkers({ points }: { points: LatLngExpression[] }) {
    const map = useMap();
    React.useEffect(() => {
      if (!points.length) return;
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds.pad(0.2));
    }, [points, map]);
    return null;
  }

  const points = filtered.map(
    (m) => [m.latitude, m.longitude] as LatLngExpression
  );

  const totalPower = miniGrids.reduce(
    (s, m) => s + (m.production_kw || 0),
    0
  );
  const regions = new Set(miniGrids.map((m) => m.localite)).size;

  const centerBurkina: LatLngExpression = [12.2383, -1.5616];

  if (loading)
    return <p className="p-6 text-gray-500">Chargement de la carte...</p>;

  return (
    <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 space-y-6">
      {/* ======== HEADER ======== */}
      <div className="flex items-center justify-between mb-2">
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

      {/* === FILTRES === */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <Layers className="w-4 h-4" />
          <span>Filtres:</span>
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as any)}
          className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="all">Tous les statuts</option>
          <option value="en_service">En Service</option>
          <option value="maintenance">Maintenance</option>
          <option value="hors_service">Hors Service</option>
        </select>
      </div>

      {/* ======== CARTE ======== */}
      <MapContainer
        center={centerBurkina}
        zoom={6}
        zoomControl={false}
        style={{ height: "420px", width: "100%", borderRadius: "0.75rem" }}
      >
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="topright" />
        <FitToMarkers points={points} />

        {filtered.map((mg) => (
          <Marker
            key={mg.id}
            position={[mg.latitude, mg.longitude]}
            icon={makeDivIcon(mg)}
            eventHandlers={{
              click: () => setActiveGrid(mg),
            }}
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
            Puissance totale : {totalPower.toFixed(1)} kW
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
            Régions couvertes : {regions}
            <br />
            Disponibilité : <span className="text-green-600 font-semibold">96.2%</span>
          </p>
        </div>
      </div>

      {/* === DÉTAIL INSTALLATION CLIQUÉE === */}
      {activeGrid && (
        <div className="fixed right-6 top-6 w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-2xl z-[999]">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getStatusColor(activeGrid.statut).bg }}
              />
              <h4 className="font-semibold text-gray-900">{activeGrid.nom}</h4>
            </div>
            <button
              onClick={() => setActiveGrid(null)}
              className="p-1 rounded-lg hover:bg-gray-100"
              aria-label="Fermer"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="p-5 space-y-4 text-sm">
            <DetailRow label="Localité" value={activeGrid.localite} />
            <DetailRow label="Statut" value={activeGrid.statut.replace("_", " ")} />
            <DetailRow label="Production" value={`${activeGrid.production_kw} kW`} />
            <DetailRow label="Batterie" value={`${activeGrid.batterie_soc}%`} />
            <DetailRow label="Température" value={`${activeGrid.temperature} °C`} />
            <DetailRow label="Usagers actifs" value={activeGrid.utilisateurs_actifs} />
            <DetailRow label="Réseau" value={activeGrid.statut_reseau} />
          </div>
        </div>
      )}
    </div>
  );
}

// ======== Composants internes réutilisables ========

function DetailRow({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}
