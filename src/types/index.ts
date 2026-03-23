// Types principaux pour SolarPro
export interface User {
  id: number;
  email: string;
  nomComplet: string;
  role: 'admin' | 'ops' | 'tech' | 'analyst';
  locataireId: number;
  mfaActive: boolean;
  dernierLogin?: string;
}

export interface Site {
  id: number;
  projetId: number;
  localite: string;
  point: {
    latitude: number;
    longitude: number;
  };
  populationEstimee: number;
  statut: 'projete' | 'valide' | 'rejete' | 'en_service';
  notes?: string;
  visibilite: boolean;
}

export interface MiniGrid {
  id: number;
  siteId: number;
  nom: string;
  statut: 'projete' | 'en_service' | 'maintenance' | 'hors_service';
  site: Site;
  equipements: Equipement[];
  derniereMesure?: Mesure;
}

export interface Equipement {
  id: number;
  minigridId: number;
  type: 'PV' | 'INV' | 'BATT' | 'GEN' | 'DCU' | 'METER' | 'SENSOR';
  numeroSerie: string;
  modele?: string;
  dateInstallation?: string;
  statut: 'operationnel' | 'maintenance' | 'panne' | 'hors_service';
}

export interface Mesure {
  id: number;
  equipId: number;
  timeStamp: string;
  voltage?: number;
  courant?: number;
  puissanceW?: number;
  frequence?: number;
  temperature?: number;
}

export interface Alerte {
  id: number;
  minigridId: number;
  typeAlerte: string;
  niveau: 'info' | 'warn' | 'crit';
  message: string;
  timeStamp: string;
  resolue?: boolean;
}

export interface MaintenanceTicket {
  id: number;
  minigridId?: number;
  type: 'preventive' | 'corrective' | 'curative';
  description: string;
  priorite: 'basse' | 'normale' | 'haute' | 'urgente';
  statut: 'ouvert' | 'en_cours' | 'resolu' | 'clos';
  dateCreation: string;
  assigneA?: number;
}

export interface Client {
  id: number;
  nomClient: string;
  typeConsommateur: 'menage' | 'pme' | 'service_public';
  tel?: string;
  amperage?: number;
  statut: 'prospect' | 'actif' | 'suspendu' | 'resilié';
  position?: {
    latitude: number;
    longitude: number;
  };
}