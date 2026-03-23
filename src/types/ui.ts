// ==============================
// 👤 UTILISATEUR / AUTHENTIFICATION
// ==============================
export interface User {
  id: number;
  email: string;
  nomComplet: string;
  role: "admin" | "technicien" | "utilisateur";
  locataireId?: number | null;
  mfaActive?: boolean;
  dernierLogin?: string;
}

// ==============================
// 🧭 ETATS DU FRONT-END
// ==============================

// État du chargement global (ex. pour contextes)
export interface LoadingState {
  isLoading: boolean;
  message?: string | null;
}

// État générique d’un formulaire
export interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  isSubmitting: boolean;
  submitted?: boolean;
}

// ==============================
// ⚙️ MINI-GRIDS & CARTOGRAPHIE
// ==============================

export interface MiniGridMarker {
  id: number;
  nom: string;
  statut: "active" | "maintenance" | "hors_service" | "projete";
  localite?: string | null;
  latitude: number;
  longitude: number;
  productionKw?: number;
  batteriePourcentage?: number;
  temperature?: number;
  utilisateursConnectes?: number;
  reseauStatut?: "online" | "offline" | "alerte";
}

export interface MapFilterState {
  projetId?: number | null;
  statut?: "active" | "maintenance" | "hors_service" | "projete" | "tous";
  visibilite?: boolean;
  search?: string;
}

// ==============================
// 📊 TABLEAU DE BORD / STATISTIQUES
// ==============================

export interface DashboardSummary {
  productionTotaleKw: number;
  consommationTotaleKw: number;
  utilisateursActifs: number;
  tauxDisponibilite: number;
  co2EviteTonnes: number;
  alertesActives: number;
  temperatureMoyenne?: number;
}

export interface AlertItem {
  id: number;
  type: "critique" | "avertissement" | "info";
  message: string;
  siteNom?: string;
  date: string;
  resolved?: boolean;
}

// ==============================
// 🔧 EQUIPEMENTS / CONFIGURATION
// ==============================

export interface Equipement {
  id: number;
  type: string;
  modele?: string;
  marque?: string;
  statut?: "actif" | "hors_service" | "maintenance";
  siteId?: number;
  derniereMaj?: string;
}

export interface EquipementGroup {
  type: string;
  total: number;
  actifs: number;
  enMaintenance: number;
}

// ==============================
// 📑 STATISTIQUES & RAPPORTS (UI)
// ==============================

export interface Rapport {
  id: number;
  nom: string;
  type: "mensuel" | "trimestriel" | "maintenance" | "alertes";
  dateGeneration: string;
  taille: string;
  format: "PDF" | "Excel" | "Word" | "TXT" | "CSV";
}

// ==============================
// 🧠 AUTRES STRUCTURES UTILITAIRES
// ==============================

export interface FilterOption {
  label: string;
  value: string | number | null;
}

export interface ToastMessage {
  type: "success" | "error" | "warning" | "info";
  message: string;
  duration?: number; // en ms
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
}

// ==============================
// 🌐 UTILITAIRES GÉO POUR UI
// ==============================

export interface GeoPoint {
  latitude: number;
  longitude: number;
  altitude?: number;
}

export interface GeoBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// ==============================
// 🔌 CONTEXTES FRONT-END
// ==============================

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: (reason?: string) => void;
  isLoading: boolean;
  message: string | null;
}

export interface MiniGridContextType {
  miniGrids: MiniGridMarker[];
  loading: boolean;
  refresh: () => Promise<void>;
}
