import React, { useEffect, useState } from "react";
import {
  Bell,
  AlertCircle,
  CheckCircle,
  Info,
  XCircle,
  Trash2,
} from "lucide-react";
import api from "../../services/api";
import type { Notification } from "../../types/api";

// --- Toast system ---
import { toast, Toaster } from "react-hot-toast";

// --- Configuration icônes et styles ---
const ICONS: Record<string, JSX.Element> = {
  alert: <AlertCircle className="text-red-500" />,
  info: <Info className="text-blue-500" />,
  success: <CheckCircle className="text-green-500" />,
  error: <XCircle className="text-yellow-500" />,
};

const TYPE_LABELS: Record<string, string> = {
  alert: "Alerte",
  info: "Info",
  success: "Succès",
  error: "Erreur",
};

const TYPE_COLORS: Record<string, string> = {
  alert: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
  success: "bg-green-100 text-green-700",
  error: "bg-yellow-100 text-yellow-700",
};

export default function NotificationView() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.notifications.list();
        setNotifications(data);
      } catch (err: any) {
        toast.error("Erreur de chargement des notifications");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read && !n.est_lu).length;
  const filtered = notifications.filter(
    (n) => filter === "all" || n.type === filter
  );

  // 🔹 Marquer une notification comme lue
  const handleMarkRead = async (id: number) => {
    try {
      await api.notifications.markRead(id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read: true, est_lu: true } : n
        )
      );
      toast.success("Notification marquée comme lue !");
    } catch (err) {
      toast.error("Erreur lors du marquage comme lu");
    }
  };

  // 🔹 Supprimer une notification
  const handleRemove = async (id: number) => {
    try {
      await api.notifications.remove(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast("Notification supprimée 🗑️", {
        icon: "🗑️",
        style: { background: "#fff3f3", color: "#d00" },
      });
    } catch (err) {
      toast.error("Erreur lors de la suppression");
    }
  };

  // 🔹 Tout marquer comme lu
  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, est_lu: true }))
      );
      toast.success("Toutes les notifications ont été marquées comme lues !");
    } catch (err) {
      toast.error("Erreur lors du marquage global");
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* === Toast container === */}
      <Toaster position="top-right" reverseOrder={false} />

      {/* === Header === */}
      <div className="sticky top-0 bg-gray-50 z-10 p-6 pb-2 flex items-center justify-between border-b">
        <div className="flex items-center gap-3">
          <Bell className="w-7 h-7 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs font-semibold">
              {unreadCount} non lu{unreadCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition"
          >
            Tout marquer comme lu
          </button>
        )}
      </div>

      {/* === Filtre === */}
      <div className="flex gap-4 px-6 pt-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-white border rounded-lg px-2 py-1"
        >
          <option value="all">Toutes</option>
          <option value="alert">Alerte</option>
          <option value="info">Info</option>
          <option value="success">Succès</option>
          <option value="error">Erreur</option>
        </select>
      </div>

      {/* === Liste des notifications === */}
      {loading ? (
        <p className="text-gray-500 px-6 pt-10">Chargement...</p>
      ) : (
        <div className="space-y-4 px-6 pt-4">
          {filtered.map((n) => (
            <div
              key={n.id}
              className={`group bg-white rounded-xl shadow p-4 flex items-center gap-4 border-l-4 transition hover:shadow-lg hover:bg-gray-100 ${
                n.type === "alert"
                  ? "border-red-500"
                  : n.type === "info"
                  ? "border-blue-500"
                  : n.type === "success"
                  ? "border-green-500"
                  : "border-yellow-500"
              }`}
            >
              {ICONS[n.type]}
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold">{n.title}</span>
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[n.type]}`}
                  >
                    {TYPE_LABELS[n.type]}
                  </span>
                </div>
                <p className="text-gray-700">{n.message}</p>
                <span className="text-xs text-gray-400 block mt-2">
                  {n.date
                    ? new Date(n.date).toLocaleString("fr-FR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : ""}
                </span>
              </div>

              <div className="flex flex-col gap-2 items-end">
                {!n.read && !n.est_lu && (
                  <button
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-200 transition"
                    onClick={() => handleMarkRead(n.id)}
                  >
                    Marquer comme lu
                  </button>
                )}
                <button
                  className="p-1 rounded-full hover:bg-red-100 transition"
                  title="Supprimer"
                  onClick={() => handleRemove(n.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              Aucune notification.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
