// src/services/historyService.ts

import api from "./api";
import type {
  PaginatedMinigridHistory,
  HistoryFilters,
  MinigridHistoryItem,
} from "../types/history";

export async function fetchMinigridHistory(
  minigridId: number,
  filters: HistoryFilters = {}
): Promise<PaginatedMinigridHistory> {
  return api.minigrids.getHistory(minigridId, filters);
}

export function getHistorySummary(items: MinigridHistoryItem[]) {
  return {
    total: items.length,
    alerts: items.filter((item) => item.category === "ALERT").length,
    connectivity: items.filter((item) => item.category === "CONNECTIVITY").length,
    maintenance: items.filter((item) => item.category === "MAINTENANCE").length,
    userActions: items.filter((item) => item.category === "USER_ACTION").length,
    critical: items.filter((item) => item.severity === "CRITICAL").length,
  };
}