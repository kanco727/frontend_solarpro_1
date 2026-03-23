// src/components/Layout/Sidebar.tsx
import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Zap,
  Sun,
  MapPin,
  Activity,
  Bell,
  BellRing,
  FileText,
  Sliders,
  Wrench,
  Cpu, // ✅ pour l'icône des équipements
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export default function Sidebar() {
  const { user } = useAuth();
  const userRole = user?.role || "utilisateur";

  const menuItems = [
    { id: "dashboard", label: "Tableau de Bord", icon: LayoutDashboard },
    { id: "minigrids", label: "Mini-Grids", icon: Zap },
    { id: "shs", label: "Systèmes SHS", icon: Sun },
    { id: "cartographie", label: "Cartographie", icon: MapPin },
    { id: "monitoring", label: "Monitoring", icon: Activity },
    { id: "equipements", label: "Équipements", icon: Cpu }, // ✅ ajouté ici
    { id: "alertes", label: "Alertes", icon: Bell },
    { id: "notifications", label: "Notifications", icon: BellRing },
    { id: "maintenance", label: "Maintenance", icon: Wrench },
    { id: "parametres", label: "Paramètres", icon: Sliders },
    { id: "statistiques", label: "Statistiques", icon: FileText },
  ];

  return (
    <div className="bg-slate-900 text-white w-64 min-h-screen flex flex-col relative">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700 mt-16">
        <div className="flex items-center gap-3">
          <div className="bg-green-500 p-2 rounded-lg">
            <Sun className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">SolarPro</h1>
            <p className="text-sm text-slate-400">Burkina Faso</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const to = item.id === "dashboard" ? "/" : `/${item.id}`;

            // 🧠 Condition : si c’est “Équipements” et utilisateur ≠ admin
            const isEquipement = item.id === "equipements";
            const isDisabled = isEquipement && userRole !== "admin";

            return (
              <li key={item.id}>
                {isDisabled ? (
                  <div
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 bg-slate-800/40 cursor-not-allowed opacity-60"
                    title="Réservé aux administrateurs"
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                ) : (
                  <NavLink
                    to={to}
                    className={({ isActive }) =>
                      `w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? "bg-green-600 text-white"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`
                    }
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </NavLink>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
