import React, { useState } from 'react';
import { FileText, Download, Calendar, BarChart3, TrendingUp, Users, Zap, AlertTriangle } from 'lucide-react';

export default function RapportsView() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedType, setSelectedType] = useState('mensuel');
  const [selectedFormat, setSelectedFormat] = useState('txt');
  const [selectedMiniGrid, setSelectedMiniGrid] = useState('all');
  const [isGenerating, setIsGenerating] = useState(false);

  // Données de synthèse pour la période sélectionnée
  const donneesResume = {
    production: 45680, // kWh
    consommation: 42150, // kWh
    disponibilite: 96.2, // %
    alertes: 23,
    maintenances: 8,
    clients: 1234,
    co2Evite: 18.5 // tonnes
  };

  // Liste simulée des mini-grids
  const miniGrids = [
    { id: 'all', nom: 'Toutes les mini-grids' },
    { id: 'mg1', nom: 'Mini-grid de Ouagadougou' },
    { id: 'mg2', nom: 'Mini-grid de Bobo-Dioulasso' },
    { id: 'mg3', nom: 'Mini-grid de Koudougou' },
    { id: 'mg4', nom: 'Mini-grid de Banfora' },
  ];

  // Données simulées pour les rapports
  const rapportsDisponibles = [
    {
      id: 1,
      nom: 'Rapport Mensuel - Décembre 2024',
      type: 'mensuel',
      dateGeneration: '2024-12-19T10:00:00Z',
      taille: '2.4 MB',
      format: 'PDF'
    },
    {
      id: 2,
      nom: 'Analyse Performance - Q4 2024',
      type: 'trimestriel',
      dateGeneration: '2024-12-15T14:30:00Z',
      taille: '5.1 MB',
      format: 'PDF'
    },
    {
      id: 3,
      nom: 'Données Maintenance - Novembre 2024',
      type: 'maintenance',
      dateGeneration: '2024-12-01T09:00:00Z',
      taille: '1.8 MB',
      format: 'Excel'
    },
    {
      id: 4,
      nom: 'Rapport Alertes - Semaine 50',
      type: 'alertes',
      dateGeneration: '2024-12-16T16:00:00Z',
      taille: '856 KB',
      format: 'PDF'
    }
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Génération d'un rapport fictif selon le type et le format choisis
  const generateReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const miniGridLabel = miniGrids.find(mg => mg.id === selectedMiniGrid)?.nom || 'Mini-grid inconnue';
      let content = `Mini-grid : ${miniGridLabel}\nType de rapport : ${selectedType}\nGénéré le ${new Date().toLocaleString()}\n`;
      let mimeType = 'text/plain';
      let extension = selectedFormat;
      switch (selectedType) {
        case 'mensuel':
          content += `\nProduction: ${donneesResume.production} kWh\nConsommation: ${donneesResume.consommation} kWh\nDisponibilité: ${donneesResume.disponibilite}%\nClients: ${donneesResume.clients}\nCO2 évité: ${donneesResume.co2Evite} t`;
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
      // Formatage selon le format choisi
      switch (selectedFormat) {
        case 'csv':
          mimeType = 'text/csv';
          content = `MiniGrid,Type,Date,Production,Consommation,Disponibilite,Clients,CO2 Evite\n` +
            `${miniGridLabel},${selectedType},${new Date().toLocaleString()},${donneesResume.production},${donneesResume.consommation},${donneesResume.disponibilite},${donneesResume.clients},${donneesResume.co2Evite}`;
          break;
        case 'pdf':
          mimeType = 'application/pdf';
          // Simule un PDF (vrai PDF nécessiterait une lib externe)
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

  // Téléchargement d'un rapport existant (fictif)
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
          <p className="text-gray-600 mt-1">Génération et consultation des statistiques</p>
        </div>
        <div className="flex items-center gap-4 mb-4">
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
            {isGenerating ? 'Génération...' : 'Générer Statistique'}
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Production Totale</p>
              <p className="text-2xl font-bold text-green-600">
                {donneesResume.production.toLocaleString()} kWh
              </p>
              <p className="text-xs text-gray-500 mt-1">{getPeriodLabel(selectedPeriod)}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

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

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Disponibilité</p>
              <p className="text-2xl font-bold text-orange-600">{donneesResume.disponibilite}%</p>
              <p className="text-xs text-gray-500 mt-1">Objectif: 95%</p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

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

      {/* Charts Section */}
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
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-green-800">CO₂ évité</span>
              </div>
              <span className="text-lg font-bold text-green-600">{donneesResume.co2Evite}t</span>
            </div>
          </div>
        </div>
      </div>

      {/* Available Reports */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Statistiques Disponibles</h3>
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

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions Rapides</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <FileText className="w-6 h-6 text-blue-500 mb-2" />
            <h4 className="font-medium text-gray-900">Statistique Mensuelle</h4>
            <p className="text-sm text-gray-600">Générer la statistique du mois en cours</p>
          </button>
          
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <BarChart3 className="w-6 h-6 text-green-500 mb-2" />
            <h4 className="font-medium text-gray-900">Analyse Performance</h4>
            <p className="text-sm text-gray-600">Statistique détaillée des performances</p>
          </button>
          
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <AlertTriangle className="w-6 h-6 text-orange-500 mb-2" />
            <h4 className="font-medium text-gray-900">Statistique Incidents</h4>
            <p className="text-sm text-gray-600">Synthèse des alertes et incidents</p>
          </button>
        </div>
      </div>
    </div>
  );
}