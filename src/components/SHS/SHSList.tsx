import React, { useState } from 'react';
import { Sun, Battery, Zap, MapPin, Plus, Search, Filter, Home, TrendingUp } from 'lucide-react';

interface SHSSystem {
  id: number;
  numeroSerie: string;
  beneficiaire: string;
  localite: string;
  position: { latitude: number; longitude: number };
  dateInstallation: string;
  statut: 'actif' | 'maintenance' | 'hors_service';
  puissancePanneau: number;
  capaciteBatterie: number;
  consommationMoyenne: number;
  derniereMaintenance?: string;
}

export default function SHSList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Données simulées pour les SHS
  const shsSystems: SHSSystem[] = [
    {
      id: 1,
      numeroSerie: 'SHS-BF-001',
      beneficiaire: 'Famille Ouédraogo',
      localite: 'Koudougou',
      position: { latitude: 12.2530, longitude: -2.3616 },
      dateInstallation: '2024-01-15',
      statut: 'actif',
      puissancePanneau: 100,
      capaciteBatterie: 200,
      consommationMoyenne: 2.5,
      derniereMaintenance: '2024-11-01'
    },
    {
      id: 2,
      numeroSerie: 'SHS-BF-002',
      beneficiaire: 'Famille Sawadogo',
      localite: 'Banfora',
      position: { latitude: 10.6339, longitude: -4.7610 },
      dateInstallation: '2024-02-20',
      statut: 'actif',
      puissancePanneau: 150,
      capaciteBatterie: 300,
      consommationMoyenne: 3.8
    },
    {
      id: 3,
      numeroSerie: 'SHS-BF-003',
      beneficiaire: 'Famille Compaoré',
      localite: 'Tenkodogo',
      position: { latitude: 11.7800, longitude: -0.3700 },
      dateInstallation: '2024-03-10',
      statut: 'maintenance',
      puissancePanneau: 100,
      capaciteBatterie: 200,
      consommationMoyenne: 1.9,
      derniereMaintenance: '2024-12-15'
    }
  ];

  const filteredSystems = shsSystems.filter(system => {
    const matchesSearch = system.beneficiaire.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         system.localite.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         system.numeroSerie.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || system.statut === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatutBadge = (statut: string) => {
    const badges = {
      'actif': 'bg-green-100 text-green-800 border border-green-200',
      'maintenance': 'bg-orange-100 text-orange-800 border border-orange-200',
      'hors_service': 'bg-red-100 text-red-800 border border-red-200'
    };
    
    const labels = {
      'actif': 'Actif',
      'maintenance': 'Maintenance',
      'hors_service': 'Hors Service'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[statut as keyof typeof badges]}`}>
        {labels[statut as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Systèmes SHS</h1>
          <p className="text-gray-600 mt-1">Gestion des systèmes solaires domestiques</p>
        </div>
        <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nouveau SHS
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total SHS</p>
              <p className="text-2xl font-bold text-gray-900">{shsSystems.length}</p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg">
              <Sun className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Systèmes Actifs</p>
              <p className="text-2xl font-bold text-green-600">
                {shsSystems.filter(s => s.statut === 'actif').length}
              </p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En Maintenance</p>
              <p className="text-2xl font-bold text-orange-600">
                {shsSystems.filter(s => s.statut === 'maintenance').length}
              </p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg">
              <Battery className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Familles Servies</p>
              <p className="text-2xl font-bold text-blue-600">{shsSystems.length * 6}</p>
              <p className="text-xs text-gray-500">~6 pers/famille</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <Home className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher un système SHS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-600" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">Tous les statuts</option>
            <option value="actif">Actif</option>
            <option value="maintenance">Maintenance</option>
            <option value="hors_service">Hors Service</option>
          </select>
        </div>
      </div>

      {/* SHS Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSystems.map(system => (
          <div key={system.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-500 p-2 rounded-lg">
                    <Sun className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{system.numeroSerie}</h3>
                    <p className="text-sm text-gray-600">{system.beneficiaire}</p>
                  </div>
                </div>
                {getStatutBadge(system.statut)}
              </div>

              {/* Location */}
              <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{system.localite}</span>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <Sun className="w-4 h-4 text-orange-500 mx-auto mb-1" />
                  <p className="text-xs text-gray-600">Panneau</p>
                  <p className="text-sm font-semibold text-orange-600">
                    {system.puissancePanneau}W
                  </p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <Battery className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                  <p className="text-xs text-gray-600">Batterie</p>
                  <p className="text-sm font-semibold text-blue-600">
                    {system.capaciteBatterie}Ah
                  </p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg col-span-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mx-auto mb-1" />
                  <p className="text-xs text-gray-600">Consommation moyenne</p>
                  <p className="text-sm font-semibold text-green-600">
                    {system.consommationMoyenne} kWh/jour
                  </p>
                </div>
              </div>

              {/* Installation Date */}
              <div className="text-xs text-gray-500 mb-4">
                Installé le {new Date(system.dateInstallation).toLocaleDateString('fr-FR')}
                {system.derniereMaintenance && (
                  <span className="block">
                    Dernière maintenance: {new Date(system.derniereMaintenance).toLocaleDateString('fr-FR')}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                  Détails
                </button>
                <button className="flex-1 bg-orange-600 text-white py-2 px-3 rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium">
                  Monitoring
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredSystems.length === 0 && (
        <div className="text-center py-12">
          <Sun className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun système SHS trouvé</h3>
          <p className="text-gray-600">Essayez de modifier vos critères de recherche.</p>
        </div>
      )}
    </div>
  );
}