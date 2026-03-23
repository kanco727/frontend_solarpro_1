import React, { useEffect, useState } from 'react';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { BASE } from '../../services/api';

type AlerteApi = {
  id: number;
  minigrid_id?: number;
  type_alerte: string;
  niveau: string;
  message: string;
  time_stamp: string;
  statut?: string;
};

type AlerteUi = {
  id: number;
  minigridId: number;
  typeAlerte: string;
  niveau: string;
  message: string;
  timeStamp: string;
};

export default function AlertsList() {
  const [alertes, setAlertes] = useState<AlerteUi[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('solarpro_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  useEffect(() => {
    const loadAlertes = async () => {
      try {
        setLoading(true);
        setErr(null);

        const res = await fetch(`${BASE}/alertes/full`, {
          headers: getAuthHeaders(),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `${res.status} ${res.statusText}`);
        }

        const data: AlerteApi[] = await res.json();

        const mapped: AlerteUi[] = data
          .sort(
            (a, b) =>
              new Date(b.time_stamp).getTime() - new Date(a.time_stamp).getTime()
          )
          .slice(0, 5)
          .map((a) => ({
            id: a.id,
            minigridId: a.minigrid_id ?? 0,
            typeAlerte: a.type_alerte,
            niveau: normalizeNiveau(a.niveau),
            message: a.message,
            timeStamp: a.time_stamp,
          }));

        setAlertes(mapped);
      } catch (e: any) {
        console.error('Erreur chargement alertes :', e);
        setErr(e?.message || 'Erreur de chargement des alertes');
      } finally {
        setLoading(false);
      }
    };

    loadAlertes();
  }, []);

  const normalizeNiveau = (niveau: string) => {
    const n = (niveau || '').toLowerCase();

    if (n.includes('crit')) return 'crit';
    if (n.includes('élev') || n.includes('eleve')) return 'warn';
    if (n.includes('moy')) return 'warn';
    if (n.includes('faible') || n.includes('info')) return 'info';

    return 'info';
  };

  const getNiveauColor = (niveau: string) => {
    switch (niveau) {
      case 'crit':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warn':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getIcon = (niveau: string) => {
    switch (niveau) {
      case 'crit':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warn':
        return <Clock className="w-5 h-5 text-orange-500" />;
      case 'info':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Alertes Récentes</h3>
        <button className="text-sm text-green-600 hover:text-green-700 font-medium">
          Voir toutes
        </button>
      </div>

      {loading && <p className="text-sm text-gray-500">Chargement des alertes…</p>}
      {err && <p className="text-sm text-red-600">Erreur : {err}</p>}

      {!loading && !err && (
        <div className="space-y-4">
          {alertes.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune alerte récente.</p>
          ) : (
            alertes.map((alerte) => (
              <div
                key={alerte.id}
                className={`border rounded-lg p-4 ${getNiveauColor(alerte.niveau)}`}
              >
                <div className="flex items-start gap-3">
                  {getIcon(alerte.niveau)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium">{alerte.typeAlerte}</h4>
                      <span className="text-xs text-gray-500">
                        {formatTime(alerte.timeStamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{alerte.message}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}