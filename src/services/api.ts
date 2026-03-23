// src/services/api.ts
import axios from "axios";
import type { PaginatedMinigridHistory, HistoryFilters } from "../types/history";

// ======================================
// 🌍 Configuration principale
// ======================================
const RAW_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  "http://localhost:8000";

export const BASE = RAW_BASE.replace(/\/+$/, "");
export const USE_MOCK_DATA = String(import.meta.env.VITE_USE_MOCK).toLowerCase() === "true";

// ✅ Instance Axios pour appels directs éventuels
export const http = axios.create({
  baseURL: BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// ======================================
// 🧭 Helpers géo utilisables partout
// ======================================
export type LatLng = { latitude: number; longitude: number };

export function pointToWKT(lat: number, lon: number): string {
  return `POINT(${lon} ${lat})`;
}

export function parsePointWkt(wkt?: string | null): LatLng | null {
  if (!wkt) return null;
  const m = wkt.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
  if (!m) return null;
  const lon = parseFloat(m[1]);
  const lat = parseFloat(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { latitude: lat, longitude: lon };
}

// ======================================
// 🔐 Headers d'authentification
// ======================================
function getAuthHeaders(extraHeaders: Record<string, string> = {}) {
  const token = localStorage.getItem("solarpro_token");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
}

// ======================================
// 🧩 Utilitaire fetch -> JSON ou erreur
// ======================================
async function jsonOrThrow(res: Response) {
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `${res.status} ${res.statusText}`);
  }

  if (res.status === 204) return null;

  return res.json();
}

// ======================================
// 🧠 Modules API structurés
// ======================================
export const api = {
  // ================== PROJETS ==================
  projets: {
    async list(): Promise<any[]> {
      const res = await fetch(`${BASE}/projets/`, {
        headers: getAuthHeaders(),
      });
      return jsonOrThrow(res);
    },

    async get(id: number): Promise<any> {
      const res = await fetch(`${BASE}/projets/${id}`, {
        headers: getAuthHeaders(),
      });
      return jsonOrThrow(res);
    },

    async create(body: Record<string, any>): Promise<any> {
      const res = await fetch(`${BASE}/projets/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      return jsonOrThrow(res);
    },

    async update(id: number, patch: Record<string, any>): Promise<any> {
      const res = await fetch(`${BASE}/projets/${id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(patch),
      });
      return jsonOrThrow(res);
    },

    async remove(id: number): Promise<void> {
      const res = await fetch(`${BASE}/projets/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      await jsonOrThrow(res);
    },
  },

  // ================== SITES ==================
  sites: {
    async list(): Promise<any[]> {
      const res = await fetch(`${BASE}/sites/`, {
        headers: getAuthHeaders(),
      });
      return jsonOrThrow(res);
    },

    async get(id: number): Promise<any> {
      const res = await fetch(`${BASE}/sites/${id}`, {
        headers: getAuthHeaders(),
      });
      return jsonOrThrow(res);
    },

    async create(body: Record<string, any>): Promise<any> {
      const res = await fetch(`${BASE}/sites/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      return jsonOrThrow(res);
    },

    async update(id: number, patch: Record<string, any>): Promise<any> {
      const res = await fetch(`${BASE}/sites/${id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(patch),
      });
      return jsonOrThrow(res);
    },

    async remove(id: number): Promise<void> {
      const res = await fetch(`${BASE}/sites/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      await jsonOrThrow(res);
    },
  },

  // ================== MINIGRIDS ==================
  minigrids: {
    async list(): Promise<any[]> {
      const res = await fetch(`${BASE}/minigrids/geo`, {
        headers: getAuthHeaders(),
      });
      return jsonOrThrow(res);
    },

    async get(id: number): Promise<any> {
      const res = await fetch(`${BASE}/minigrids/${id}`, {
        headers: getAuthHeaders(),
      });
      return jsonOrThrow(res);
    },

    async create(body: Record<string, any>): Promise<any> {
      const res = await fetch(`${BASE}/minigrids/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      return jsonOrThrow(res);
    },

    async update(id: number, patch: Record<string, any>): Promise<any> {
      const candidates = [
        `${BASE}/minigrids/${id}/`,
        `${BASE}/minigrids/${id}`,
        `${BASE}/minigrids/${id}/statut`,
        `${BASE}/minigrids/${id}/status`,
      ];

      let lastError: any = null;

      for (const url of candidates) {
        try {
          const res = await fetch(url, {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify(patch),
          });

          if (res.ok) return jsonOrThrow(res);

          if ([405, 404, 400].includes(res.status)) {
            const resPut = await fetch(url, {
              method: "PUT",
              headers: getAuthHeaders(),
              body: JSON.stringify(patch),
            });

            if (resPut.ok) return jsonOrThrow(resPut);
            lastError = await resPut.text();
          } else {
            lastError = await res.text();
          }
        } catch (err) {
          lastError = err;
        }
      }

      throw new Error(
        `Impossible de mettre à jour la mini-grid : ${JSON.stringify(lastError)}`
      );
    },

    async remove(id: number): Promise<void> {
      const candidates = [
        `${BASE}/minigrids/${id}/`,
        `${BASE}/minigrids/${id}`,
      ];

      let lastError: any = null;

      for (const url of candidates) {
        try {
          const res = await fetch(url, {
            method: "DELETE",
            headers: getAuthHeaders(),
          });
          if (res.ok) return;
          lastError = await res.text();
        } catch (err) {
          lastError = err;
        }
      }

      throw new Error(
        `Impossible de supprimer la mini-grid : ${JSON.stringify(lastError)}`
      );
    },

    async getKpis(id: number): Promise<import("../types/api").MonitoringKPI> {
      const res = await fetch(`${BASE}/simulate/monitoring/${id}/kpis`, {
        headers: getAuthHeaders(),
      });
      return jsonOrThrow(res);
    },

    async getEnergyCurves(
      id: number,
      period = "7d"
    ): Promise<import("../types/api").EnergyCurvePoint[]> {
      const res = await fetch(
        `${BASE}/simulate/monitoring/${id}/energy-curves?period=${encodeURIComponent(period)}`,
        {
          headers: getAuthHeaders(),
        }
      );
      return jsonOrThrow(res);
    },

    async getEnergyDistribution(
      id: number
    ): Promise<import("../types/api").EnergyDistribution[]> {
      const res = await fetch(
        `${BASE}/simulate/monitoring/${id}/energy-distribution`,
        {
          headers: getAuthHeaders(),
        }
      );
      return jsonOrThrow(res);
    },

    async getSitesStatus(
      id: number
    ): Promise<import("../types/api").SiteStatus[]> {
      const res = await fetch(`${BASE}/simulate/monitoring/${id}/sites`, {
        headers: getAuthHeaders(),
      });
      return jsonOrThrow(res);
    },

    async getHistory(
      id: number,
      filters: HistoryFilters = {}
    ): Promise<PaginatedMinigridHistory> {
      const params = new URLSearchParams();

      if (filters.page) params.append("page", String(filters.page));
      if (filters.page_size) params.append("page_size", String(filters.page_size));
      if (filters.search) params.append("search", filters.search);
      if (filters.category) params.append("category", filters.category);
      if (filters.severity) params.append("severity", filters.severity);
      if (filters.start_date) params.append("start_date", filters.start_date);
      if (filters.end_date) params.append("end_date", filters.end_date);
      if (filters.equipment_id) params.append("equipment_id", filters.equipment_id);
      if (filters.actor_id) params.append("actor_id", filters.actor_id);
      if (filters.event_type) params.append("event_type", filters.event_type);

      const query = params.toString();
      const url = `${BASE}/history/minigrids/${id}${query ? `?${query}` : ""}`;

      const res = await fetch(url, {
        headers: getAuthHeaders(),
      });
      return jsonOrThrow(res);
    },

    async createHistoryEvent(body: Record<string, any>): Promise<any> {
      const res = await fetch(`${BASE}/history/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      return jsonOrThrow(res);
    },
  },

  // ================== ÉQUIPEMENTS ==================
  equipementTypes: {
    async list(): Promise<any[]> {
      const res = await fetch(`${BASE}/equipement-types/`, {
        headers: getAuthHeaders(),
      });
      return jsonOrThrow(res);
    },

    async get(id: number): Promise<any> {
      const res = await fetch(`${BASE}/equipement-types/${id}`, {
        headers: getAuthHeaders(),
      });
      return jsonOrThrow(res);
    },

    async create(body: Record<string, any>): Promise<any> {
      const res = await fetch(`${BASE}/equipement-types/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      return jsonOrThrow(res);
    },
  },

  equipements: {
    async list(minigridId: number): Promise<any[]> {
      const res = await fetch(`${BASE}/equipements?minigrid_id=${minigridId}`, {
        headers: getAuthHeaders(),
      });
      return jsonOrThrow(res);
    },

    async get(id: number): Promise<any> {
      const res = await fetch(`${BASE}/equipements/${id}`, {
        headers: getAuthHeaders(),
      });
      return jsonOrThrow(res);
    },

    async create(body: Record<string, any>): Promise<any> {
      const res = await fetch(`${BASE}/equipements/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      return jsonOrThrow(res);
    },

    async update(id: number, patch: Record<string, any>): Promise<any> {
      const res = await fetch(`${BASE}/equipements/${id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(patch),
      });
      return jsonOrThrow(res);
    },

    async remove(id: number): Promise<void> {
      const res = await fetch(`${BASE}/equipements/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      await jsonOrThrow(res);
    },

    async sendCommand(equipementId: number, action: "turn_on" | "turn_off") {
      const res = await fetch(
        `${BASE}/equipements/${equipementId}/command?action=${action}`,
        {
          method: "POST",
          headers: getAuthHeaders(),
        }
      );
      return jsonOrThrow(res);
    },
  },

  // ================== NOTIFICATIONS ==================
  notifications: {
    async list(): Promise<import("../types/api").Notification[]> {
      const res = await fetch(`${BASE}/notifications/`, {
        headers: getAuthHeaders(),
      });
      return jsonOrThrow(res);
    },

    async markRead(id: number): Promise<any> {
      const res = await fetch(`${BASE}/notifications/${id}/read`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      });
      return jsonOrThrow(res);
    },

    async remove(id: number): Promise<void> {
      const res = await fetch(`${BASE}/notifications/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      await jsonOrThrow(res);
    },

    async markAllRead(): Promise<any> {
      const res = await fetch(`${BASE}/notifications/mark-all-read`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      });
      return jsonOrThrow(res);
    },
  },
};

export default api;