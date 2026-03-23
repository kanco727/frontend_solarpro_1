import React, { useEffect, useState } from 'react';
import { FileText, Download, Calendar, BarChart3, TrendingUp, Users, Zap, AlertTriangle } from 'lucide-react';
import { BASE } from '../../services/api';

interface BackendStatistique {
  id: number;
  date_rapport: string;        // ISO string
  site_id?: number | null;
  intervenant_id?: number | null;
  equip_type_id?: number | null;
  note?: number | null;
}

export default function statistiqueView() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedType, setSelectedType] = useState('mensuel');
  const [selectedFormat, setSelectedFormat] = useState('txt');
  const [selectedMiniGrid, setSelectedMiniGrid] = useState('all');
  const [isGenerating, setIsGenerating] = useState(false);

  // 🔗 NOUVEAU : données réelles depuis le backend
  const [statistiques, setStatistiques] = useState<BackendStatistique[]>([]);
  const [loadingStats, setLoadingStats] = useState<boolean>(false);
  const [errorStats, setErrorStats] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoadingStats(true);
        setErrorStats(null);
        const res = await fetch(`${BASE}/statistiques`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data: BackendStatistique[] = await res.json();
        setStatistiques(data);
      } catch (e: any) {
        console.error('Erreur chargement /statistiques:', e);
        setErrorStats("Impossible de charger les statistiques depuis l'API.");
      } finally {
        setLoadingStats(false);
      }
    };
    loadStats();
  }, []);

  // Données de synthèse (gardées simulées comme demandé)
  const donneesResume = {
    production: 45680, // kWh
    consommation: 42150, // kWh
    disponibilite: 96.2, // %
    alertes: 23,
    maintenances: 8,
    clients: 1234,
    co2Evite: 18.5 // tonnes
  };

  // Mini-grids (gardées simulées comme demandé)
  const miniGrids = [
    { id: 'all', nom: 'Toutes les mini-grids', statut: null },
    { id: 'mg1', nom: 'Mini-grid de Ouagadougou', statut: 'en_service' },
    { id: 'mg2', nom: 'Mini-grid de Bobo-Dioulasso', statut: 'en_service' },
    { id: 'mg3', nom: 'Mini-grid de Koudougou', statut: 'maintenance' },
    { id: 'mg4', nom: 'Mini-grid de Banfora', statut: 'hors_service' },
  ];

  const getStatusColor = (statut: string | null) => {
    switch (statut) {
      case 'en_service': return 'text-green-500';
      case 'maintenance': return 'text-orange-500';
      case 'hors_service': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  // Rapports disponibles (gardés simulés comme demandé)
  const rapportsDisponibles = [
    { id: 1, nom: 'Rapport Mensuel - Décembre 2024', type: 'mensuel', dateGeneration: '2024-12-19T10:00:00Z', taille: '2.4 MB', format: 'PDF' },
    { id: 2, nom: 'Analyse Performance - Q4 2024', type: 'trimestriel', dateGeneration: '2024-12-15T14:30:00Z', taille: '5.1 MB', format: 'PDF' },
    { id: 3, nom: 'Données Maintenance - Novembre 2024', type: 'maintenance', dateGeneration: '2024-12-01T09:00:00Z', taille: '1.8 MB', format: 'Excel' },
    { id: 4, nom: 'Rapport Alertes - Semaine 50', type: 'alertes', dateGeneration: '2024-12-16T16:00:00Z', taille: '856 KB', format: 'PDF' }
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const generateReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const miniGridLabel = miniGrids.find(mg => mg.id === selectedMiniGrid)?.nom || 'Mini-grid inconnue';
      let content = `Mini-grid : ${miniGridLabel}\nType de rapport : ${selectedType}\nGénéré le ${new Date().toLocaleString()}\n`;
      let mimeType = 'text/plain';
      let extension = selectedFormat;
      switch (selectedType) {
        case 'mensuel':
          content += `\nProduction: ${donneesResume.production} kWh\nConsommation: ${donneesResume.consommation} kWh\nDisponibilité Énergétique: ${donneesResume.disponibilite}%\nClients: ${donneesResume.clients}\nCO2 évité: ${donneesResume.co2Evite} t`;
          break;
        case 'trimestriel':
          content += `\nAnalyse trimestrielle des performances.\nProduction: ${donneesResume.production} kWh\nConsommation: ${donneesResume.consommation} kWh`;
          break;
        case 'maintenance':
          content += `\nSynthèse des maintenances : ${donneesResume.maintenances} interventions.`;
          break;
        case 'alertes':
          content += `\nSynthèse des alertes : ${donneesResume.alertes} alertes détectées.`;
          break;
        default:
          content += `\nRésumé indisponible.`;
      }
      switch (selectedFormat) {
        case 'csv':
          mimeType = 'text/csv';
          content = `MiniGrid,Type,Date,Production,Consommation,DisponibiliteEnergetique,Clients,CO2 Evite\n` +
            `${miniGridLabel},${selectedType},${new Date().toLocaleString()},${donneesResume.production},${donneesResume.consommation},${donneesResume.disponibilite},${donneesResume.clients},${donneesResume.co2Evite}`;
          break;
        case 'pdf':
          mimeType = 'application/pdf';
          content = `PDF SIMULÉ\n\n${content}`;
          break;
        case 'docx':
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          content = `WORD SIMULÉ\n\n${content}`;
          break;
        case 'xlsx':
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          content = `EXCEL SIMULÉ\n\n${content}`;
          break;
        case 'txt':
        default:
          mimeType = 'text/plain';
      }
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport_${selectedMiniGrid}_${selectedType}_${Date.now()}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsGenerating(false);
    }, 1200);
  };

  const downloadRapport = (rapport: any) => {
    const content = `Nom: ${rapport.nom}\nType: ${rapport.type}\nGénéré le: ${formatDate(rapport.dateGeneration)}\nTaille: ${rapport.taille}\nFormat: ${rapport.format}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${rapport.nom.replace(/\s+/g, '_').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'week': return 'Cette semaine';
      case 'month': return 'Ce mois';
      case 'quarter': return 'Ce trimestre';
      case 'year': return 'Cette année';
      default: return 'Période sélectionnée';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Statistiques et Analyses</h1>
          <p className="text-gray-600 mt-1">Génération et consultation des rapports</p>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Zap className={`w-4 h-4 ${getStatusColor(miniGrids.find(mg => mg.id === selectedMiniGrid)?.statut || null)}`} />
            <select
              className="border rounded px-2 py-1"
              value={selectedMiniGrid}
              onChange={e => setSelectedMiniGrid(e.target.value)}
              disabled={isGenerating}
            >
              {miniGrids.map(mg => (
                <option key={mg.id} value={mg.id}>{mg.nom}</option>
              ))}
            </select>
          </div>
          <select
            className="border rounded px-2 py-1"
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            disabled={isGenerating}
          >
            <option value="mensuel">Mensuel</option>
            <option value="trimestriel">Trimestriel</option>
            <option value="maintenance">Maintenance</option>
            <option value="alertes">Alertes</option>
          </select>
          <select
            className="border rounded px-2 py-1"
            value={selectedFormat}
            onChange={e => setSelectedFormat(e.target.value)}
            disabled={isGenerating}
          >
            <option value="txt">TXT</option>
            <option value="csv">CSV</option>
            <option value="pdf">PDF</option>
            <option value="docx">Word</option>
            <option value="xlsx">Excel</option>
          </select>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            onClick={generateReport}
            disabled={isGenerating}
          >
            <FileText className="w-4 h-4" />
            {isGenerating ? 'Génération...' : 'Générer Rapport'}
          </button>
        </div>
      </div>

      {/* Period Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-4">
          <Calendar className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Période d'analyse:</span>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="quarter">Ce trimestre</option>
            <option value="year">Cette année</option>
          </select>
        </div>
      </div>

      {/* Summary Cards (gardées simulées) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Production */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify_between">
            <div>
              <p className="text-sm font-medium text-gray-600">Production Totale</p>
              <p className="text-2xl font-bold text-green-600">
                {donneesResume.production.toLocaleString()} kWh
              </p>
              <p className="text-xs text-gray-500 mt-1">{getPeriodLabel(selectedPeriod)}</p>
            </div>
            <div className={`${selectedMiniGrid === 'all' ? 'bg-gray-500' : selectedMiniGrid === 'mg1' || selectedMiniGrid === 'mg2' ? 'bg-green-500' : selectedMiniGrid === 'mg3' ? 'bg-orange-500' : 'bg-red-500'} p-3 rounded-lg`}>
              <Zap className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Consommation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Consommation</p>
              <p className="text-2xl font-bold text-blue-600">
                {donneesResume.consommation.toLocaleString()} kWh
              </p>
              <p className="text-xs text-gray-500 mt-1">Efficacité: {((donneesResume.consommation / donneesResume.production) * 100).toFixed(1)}%</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Disponibilité */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Disponibilité Énergétique</p>
              <p className="text-2xl font-bold text-orange-600">{donneesResume.disponibilite}%</p>
              <p className="text-xs text-gray-500 mt-1">Énergie fournie / Énergie demandée</p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Clients */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Clients Actifs</p>
              <p className="text-2xl font-bold text-purple-600">{donneesResume.clients.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">+45 ce mois</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section (visuel conservé) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production vs Consommation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Production vs Consommation</h3>
          <div className="h-48 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Graphique interactif</p>
              <p className="text-xs text-gray-500">Production: {donneesResume.production.toLocaleString()} kWh</p>
              <p className="text-xs text-gray-500">Consommation: {donneesResume.consommation.toLocaleString()} kWh</p>
            </div>
          </div>
        </div>

        {/* Alertes et Maintenance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Alertes et Maintenance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="text-sm font-medium text-red-800">Alertes traitées</span>
              </div>
              <span className="text-lg font-bold text-red-600">{donneesResume.alertes}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-orange-500" />
                <span className="text-sm font-medium text-orange-800">Maintenances</span>
              </div>
              <span className="text-lg font-bold text-orange-600">{donneesResume.maintenances}</span>
            </div>
            <div className="flex items_center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-green-800">CO₂ évité</span>
              </div>
              <span className="text-lg font-bold text-green-600">{donneesResume.co2Evite}t</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rapports Disponibles (simulé conservé) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Rapports Disponibles</h3>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">Tous les types</option>
              <option value="mensuel">Mensuel</option>
              <option value="trimestriel">Trimestriel</option>
              <option value="maintenance">Maintenance</option>
              <option value="alertes">Alertes</option>
            </select>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {rapportsDisponibles
            .filter(rapport => selectedType === 'all' || rapport.type === selectedType)
            .map(rapport => (
              <div key={rapport.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-500 p-2 rounded-lg">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{rapport.nom}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span>Généré le {formatDate(rapport.dateGeneration)}</span>
                        <span>{rapport.taille}</span>
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                          {rapport.format}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() => downloadRapport(rapport)}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* 🔗 NOUVEAU : Données Statistiques (API) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Données Statistiques (API)</h3>
        {loadingStats && <p className="text-sm text-gray-600">Chargement…</p>}
        {errorStats && <p className="text-sm text-red-600">{errorStats}</p>}
        {!loadingStats && !errorStats && (
          <>
            {statistiques.length === 0 ? (
              <p className="text-sm text-gray-500">Aucune statistique disponible.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 border-b">
                      <th className="py-2 pr-4">ID</th>
                      <th className="py-2 pr-4">Date rapport</th>
                      <th className="py-2 pr-4">Site ID</th>
                      <th className="py-2 pr-4">Intervenant ID</th>
                      <th className="py-2 pr-4">Equip. Type ID</th>
                      <th className="py-2 pr-4">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistiques.map((s) => (
                      <tr key={s.id} className="border-b last:border-0">
                        <td className="py-2 pr-4">{s.id}</td>
                        <td className="py-2 pr-4">{formatDate(s.date_rapport)}</td>
                        <td className="py-2 pr-4">{s.site_id ?? '—'}</td>
                        <td className="py-2 pr-4">{s.intervenant_id ?? '—'}</td>
                        <td className="py-2 pr-4">{s.equip_type_id ?? '—'}</td>
                        <td className="py-2 pr-4">{s.note ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions Rapides</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <FileText className="w-6 h-6 text-blue-500 mb-2" />
            <h4 className="font-medium text-gray-900">Rapport Mensuel</h4>
            <p className="text-sm text-gray-600">Générer le rapport du mois en cours</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <BarChart3 className="w-6 h-6 text-green-500 mb-2" />
            <h4 className="font-medium text-gray-900">Analyse Performance</h4>
            <p className="text-sm text-gray-600">Rapport détaillé des performances</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <AlertTriangle className="w-6 h-6 text-orange-500 mb-2" />
            <h4 className="font-medium text-gray-900">Rapport Incidents</h4>
            <p className="text-sm text-gray-600">Synthèse des alertes et incidents</p>
          </button>
        </div>
      </div>
    </div>
  );
}
