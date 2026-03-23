// ============================
// 📦 TYPES GÉNÉRAUX BACKEND
// ============================

// ----------- Mini-grid ----------
export type MiniGridReadBack = {
  id: number;
  site_id: number;
  nom: string;
  statut: string | null;
  cree_le?: string | null;
  maj_le?: string | null;
};

export type SiteReadBack = {
  id: number;
  projet_id: number | null;
  localite: string | null;
  point_wkt: string | null; // ex : "POINT(-1.4829 12.4022)"
  zone_wkt?: string | null;
  population_estimee: number | null;
  statut: string | null;
  visibilite: boolean | null;
  cree_le?: string | null;
  maj_le?: string | null;
};

// ----------- Type UI principal utilisé dans le front ----------
export type MiniGridUI = {
  id: number;
  siteId: number;
  nom: string;
  statut: string;
  site: {
    id: number;
    projetId: number | null;
    localite: string | null;
    point: { latitude: number; longitude: number } | null;
    populationEstimee: number | null;
    statut: string | null;
    visibilite: boolean | null;
  };
  equipements: any[];
  derniereMesure?: {
    id: number;
    equipId: number;
    timeStamp: string;
    voltage: number;
    courant: number;
    puissanceW: number;
    temperature: number;
  };
};

// ============================
// 📊 TYPES MONITORING
// ============================

export type MonitoringKPI = {
  productionTotale_kw: number;
  consommation_kw: number;
  batterie_pourcentage: number;
  utilisateurs_connectes: number;
  temperature_c: number;
  reseau_statut: "online" | "offline" | "alerte";
  timestamp: string;
};

export type EnergyCurvePoint = {
  timestamp: string;
  date_label: string; // "Lun", "Mar", etc.
  production_kw: number;
  consommation_kw: number;
  batterie_pourcentage: number;
};

export type EnergyDistribution = {
  name: "production" | "consommation" | "pertes";
  value: number;
  pourcentage: number;
};

export type SiteStatus = {
  id: number;
  name: string;
  status: "online" | "offline" | "alerte";
  production_kw: number | null;
  users_count: number;
  last_update: string;
};

export type MonitoringAlert = {
  id: number;
  type: "critique" | "avertissement" | "info";
  message: string;
  timestamp: string;
  resolved: boolean;
};

export type RealtimeMonitoringData = {
  kpis: MonitoringKPI;
  energy_curves: EnergyCurvePoint[];
  energy_distribution: EnergyDistribution[];
  sites_status: SiteStatus[];
  active_alerts: MonitoringAlert[];
  last_updated: string;
};

// ============================
// 📈 TYPES STATISTIQUES / RAPPORTS
// ============================

export interface BackendStatistique {
  id: number;
  date_rapport: string;
  site_id?: number | null;
  intervenant_id?: number | null;
  equip_type_id?: number | null;
  note?: number | null;
}

// ============================
// 🧱 TYPES STRUCTURE / PROJETS
// ============================

export interface Projet {
  id: number;
  nom: string;
  locataire_id?: number | null;
  pays?: string | null;
  niveau_admin?: number | null;
  visibilite_sur_carte?: boolean | null;
  style_carte_json?: string | object | null;
  cree_le?: string;
  maj_le?: string;
}

export interface EquipementType {
  id: number;
  type: string;
  description?: string | null;
  cree_le?: string;
  maj_le?: string;
}

// ============================
// 🔔 TYPES NOTIFICATIONS
// ============================

export interface Notification {
  id: number;
  alerte_id?: number | null;
  message: string;
  type: "alert" | "info" | "success" | "error";
  destinataire?: string | null;
  est_lu: boolean;
  cree_le?: string;
  title?: string;
  read?: boolean;
  date?: string;
}

// ============================
// 🧭 UTILITAIRES GÉO
// ============================

export type LatLng = { latitude: number; longitude: number };

export function parsePointWkt(wkt?: string | null): LatLng | null {
  if (!wkt) return null;
  const m = wkt.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
  if (!m) return null;
  const lon = parseFloat(m[1]);
  const lat = parseFloat(m[2]);
  return { latitude: lat, longitude: lon };
}
