import React, { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { useRealtime } from '../contexts';

type AlertType = 'critical' | 'warning' | 'info' | 'success';

interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  timestamp: string;
  miniGridId: number;
}

const ALERT_ICONS = {
  critical: <XCircle className="text-red-500" />,
  warning: <AlertTriangle className="text-yellow-500" />,
  info: <Info className="text-blue-500" />,
  success: <CheckCircle className="text-green-500" />
};

const ALERT_COLORS = {
  critical: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  success: 'bg-green-50 border-green-200 text-green-800'
};

export default function RealtimeNotifications() {
  const { realtimeData } = useRealtime();

  useEffect(() => {
    // Vérifier les nouvelles alertes dans toutes les mini-grids
    realtimeData.forEach((data, miniGridId) => {
      data.alerts.forEach((alert) => {
        // Vérifier si l'alerte n'a pas déjà été notifiée
        const alertKey = `alert_${alert.id}`;
        const alreadyNotified = localStorage.getItem(alertKey);

        if (!alreadyNotified && !alert.resolved) {
          // Afficher la notification push
          showPushNotification(alert, miniGridId);

          // Marquer comme notifiée
          localStorage.setItem(alertKey, 'true');

          // Nettoyer après 1 heure
          setTimeout(() => {
            localStorage.removeItem(alertKey);
          }, 60 * 60 * 1000);
        }
      });
    });
  }, [realtimeData]);

  const showPushNotification = (alert: Alert, miniGridId: number) => {
    const icon = ALERT_ICONS[alert.type] || ALERT_ICONS.info;

    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full ${ALERT_COLORS[alert.type]} shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              {icon}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium">
                Alerte Mini-grid #{miniGridId}
              </p>
              <p className="mt-1 text-sm">
                {alert.message}
              </p>
              <p className="mt-1 text-xs opacity-75">
                {new Date(alert.timestamp).toLocaleString('fr-FR')}
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium hover:bg-opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2"
          >
            Fermer
          </button>
        </div>
      </div>
    ), {
      duration: alert.type === 'critical' ? Infinity : 8000, // Les alertes critiques restent jusqu'à fermeture manuelle
      position: 'top-right',
    });

    // Notification navigateur si permission accordée
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Alerte Mini-grid #${miniGridId}`, {
        body: alert.message,
        icon: '/favicon.ico',
        tag: `alert-${alert.id}`
      });
    }
  };

  // Demander la permission pour les notifications navigateur
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return null; // Ce composant ne rend rien, il gère seulement les notifications
};