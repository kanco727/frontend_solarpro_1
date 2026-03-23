import React, { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';

type EnergyDay = {
  jour: string;
  production: number;
  consommation: number;
};

type EnergyResponse = {
  jours: EnergyDay[];
  production_totale: number;
  consommation_totale: number;
};

export default function EnergyChart() {
  const [data, setData] = useState<EnergyDay[]>([]);
  const [productionTotale, setProductionTotale] = useState(0);
  const [consommationTotale, setConsommationTotale] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEnergy = async () => {
      try {
        setError(null);

        const response = await fetch('/api/statistiques/energie-semaine');

        if (!response.ok) {
          throw new Error(`Erreur API: ${response.status}`);
        }

        const json: EnergyResponse = await response.json();

        const orderedDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

        const normalized = orderedDays.map((jour) => {
          const found = json.jours.find((d) => d.jour === jour);
          return found || { jour, production: 0, consommation: 0 };
        });

        setData(normalized);
        setProductionTotale(json.production_totale || 0);
        setConsommationTotale(json.consommation_totale || 0);
      } catch (err) {
        console.error('Erreur chargement énergie :', err);
        setError('Impossible de charger les données énergie.');
      } finally {
        setLoading(false);
      }
    };

    loadEnergy();

    const interval = setInterval(loadEnergy, 5000);
    return () => clearInterval(interval);
  }, []);

  const maxValue =
    data.length > 0
      ? Math.max(...data.flatMap((d) => [d.production, d.consommation]), 1)
      : 1;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Production vs Consommation
          </h3>
          <p className="text-sm text-gray-600 mt-1">Cette semaine (kWh)</p>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">Production</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">Consommation</span>
          </div>
        </div>
      </div>

      {loading && (
        <p className="text-gray-500 text-sm">
          Chargement des données...
        </p>
      )}

      {!loading && error && (
        <p className="text-red-500 text-sm">
          {error}
        </p>
      )}

      {!loading && !error && (
        <>
          <div className="h-48 flex items-end justify-between gap-2">
            {data.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex gap-1 items-end h-36">
                  <div
                    className="bg-green-500 rounded-t"
                    style={{
                      width: '50%',
                      height: `${(item.production / maxValue) * 100}%`,
                    }}
                  ></div>

                  <div
                    className="bg-blue-500 rounded-t"
                    style={{
                      width: '50%',
                      height: `${(item.consommation / maxValue) * 100}%`,
                    }}
                  ></div>
                </div>

                <span className="text-xs text-gray-600 font-medium">
                  {item.jour}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-center gap-6 text-sm">
            <div className="text-center">
              <p className="text-gray-600">Production totale</p>
              <p className="font-bold text-green-600">
                {productionTotale.toFixed(1)} kWh
              </p>
            </div>

            <div className="text-center">
              <p className="text-gray-600">Consommation totale</p>
              <p className="font-bold text-blue-600">
                {consommationTotale.toFixed(1)} kWh
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}