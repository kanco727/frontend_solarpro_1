// src/types/history.ts

export type HistoryCategory =
  | "ALERT"
  | "USER_ACTION"
  | "CONNECTIVITY"
  | "MAINTENANCE"
  | "COMMAND"
  | "CONFIG";

export type HistorySeverity =
  | "INFO"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type HistorySource =
  | "SYSTEM"
  | "USER"
  | "DEVICE"
  | "GATEWAY"
  | "TECHNICIAN";

export interface MinigridHistoryMetadata {
  [key: string]: unknown;
}

export interface MinigridHistoryItem {
  id: string;
  site_id?: string | null;
  minigrid_id: string;
  equipment_id?: string | null;

  category: HistoryCategory;
  event_type: string;
  severity: HistorySeverity;

  title: string;
  description: string;

  source: HistorySource;
  actor_id?: string | null;
  actor_name?: string | null;

  status?: string | null;

  old_value?: string | null;
  new_value?: string | null;

  metadata?: MinigridHistoryMetadata | null;

  related_alert_id?: string | null;
  related_ticket_id?: string | null;
  related_command_id?: string | null;

  created_at: string;
}

export interface PaginatedMinigridHistory {
  items: MinigridHistoryItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface HistoryFilters {
  category?: HistoryCategory | "";
  severity?: HistorySeverity | "";
  search?: string;
  page?: number;
  page_size?: number;
  start_date?: string;
  end_date?: string;
  equipment_id?: string;
  actor_id?: string;
  event_type?: string;
}

export interface HistorySummary {
  total: number;
  alerts: number;
  connectivity: number;
  maintenance: number;
  userActions: number;
  critical: number;
}

export interface HistoryStatsCard {
  title: string;
  value: number | string;
  subtitle?: string;
}