import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Battery, Thermometer, Activity, Plus, Search, Filter } from 'lucide-react';
import { MiniGrid } from '../../types';
import type { SiteReadBack } from '../../types/api';
import api from '../../services/api';
import toast, { Toaster } from 'react-hot-toast';
import { useMiniGrids } from '../../contexts/MiniGridContext';

export default function MiniGridsList() {
  const navigate = useNavigate();
  const { miniGrids: rawMiniGrids, refresh, loading: contextLoading } = useMiniGrids();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [minigrids, setMinigrids] = useState<MiniGrid[]>([]);
  const [sites, setSites] = useState<SiteReadBack[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    nom: '',
    site_id: '',
    statut: 'en_service',
  });
  const [addLoading, setAddLoading] = useState(false);

  const normalizeStatut = (statut?: string) => {
    const s = (statut || '').toLowerCase().trim();

    if (['en_service', 'en service', 'actif', 'active', 'online', 'actif(ve)'].includes(s)) {
      return 'en_service';
    }
    if (['maintenance', 'maint', 'en_maintenance'].includes(s)) {
      return 'maintenance';
    }
    if (['hors_service', 'hors service', 'inactif', 'inactive', 'offline', 'arrete', 'arrêté'].includes(s)) {
      return 'hors_service';
    }
    if (['projete', 'projeté', 'planned', 'planifie', 'planifié'].includes(s)) {
      return 'projete';
    }

    return 'inconnu';
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const st = await api.sites.list();
        setSites(st);
      } catch (e: any) {
        setErr(e?.message || 'Erreur de chargement des sites');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (sites.length > 0) {
      const sitesById = Object.fromEntries(sites.map((s: SiteReadBack) => [s.id, s]));
      const enriched = rawMiniGrids.map((m: any) => {
        const site = sitesById[m.site_id];
        let point = null;

        if (site && site.point_wkt) {
          const parts = site.point_wkt.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
          if (parts && parts.length === 3) {
            point = {
              latitude: parseFloat(parts[2]),
              longitude: parseFloat(parts[1]),
            };
          }
        }

        return {
          ...m,
          statut: normalizeStatut(m.statut),
          siteId: m.site_id,
          site: site
            ? {
                id: site.id,
                projetId: site.projet_id,
                localite: site.localite,
                point,
                populationEstimee: site.population_estimee,
                statut: site.statut,
                visibilite: site.visibilite,
              }
            : null,
        };
      });

      setMinigrids(enriched);
    } else {
      setMinigrids(
        rawMiniGrids.map((m: any) => ({
          ...m,
          statut: normalizeStatut(m.statut),
        }))
      );
    }
  }, [rawMiniGrids, sites]);

  const handleAddGrid = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);

    try {
      if (!addForm.nom || !addForm.site_id) {
        throw new Error('Nom et site requis');
      }

      await api.minigrids.create({
        site_id: Number(addForm.site_id),
        nom: addForm.nom,
        statut: addForm.statut,
      });

      refresh();
      setShowAddForm(false);
      setAddForm({ nom: '', site_id: '', statut: 'en_service' });
      toast.success('Mini-grid créée avec succès !');
    } catch (e: any) {
      toast.error(e?.message || 'Erreur lors de la création');
    } finally {
      setAddLoading(false);
    }
  };

  const filteredGrids = minigrids.filter((grid) => {
    const matchesSearch =
      grid.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (grid.site?.localite || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || grid.statut === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatutBadge = (statut: string) => {
    const badges = {
      en_service: 'bg-green-100 text-green-800 border border-green-200',
      maintenance: 'bg-orange-100 text-orange-800 border border-orange-200',
      hors_service: 'bg-red-100 text-red-800 border border-red-200',
      projete: 'bg-blue-100 text-blue-800 border border-blue-200',
      inconnu: 'bg-gray-100 text-gray-800 border border-gray-200',
    };

    const labels = {
      en_service: 'En Service',
      maintenance: 'Maintenance',
      hors_service: 'Hors Service',
      projete: 'Projeté',
      inconnu: 'Inconnu',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[statut as keyof typeof badges]}`}>
        {labels[statut as keyof typeof labels]}
      </span>
    );
  };

  const getCardBackground = (statut: string) => {
    switch (statut) {
      case 'en_service':
        return 'bg-green-50';
      case 'maintenance':
        return 'bg-orange-50';
      case 'hors_service':
        return 'bg-red-50';
      case 'projete':
        return 'bg-blue-50';
      default:
        return 'bg-white';
    }
  };

  const getIconBackgroundColor = (statut: string) => {
    const colors = {
      en_service: 'bg-green-500',
      maintenance: 'bg-orange-500',
      hors_service: 'bg-red-500',
      projete: 'bg-blue-500',
      inconnu: 'bg-gray-500',
    };

    return colors[statut as keyof typeof colors] || 'bg-gray-500';
  };

  if (contextLoading || loading) {
    return <div className="p-6">Chargement…</div>;
  }

  if (err) {
    return <div className="p-6 text-red-600">Erreur : {err}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <Toaster position="top-right" reverseOrder={false} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Mini-Grids</h1>
          <p className="text-gray-600 mt-1">Supervision et contrôle de vos installations</p>
        </div>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          onClick={() => setShowAddForm((v) => !v)}
        >
          <Plus className="w-4 h-4" />
          Nouvelle Installation
        </button>
      </div>

      {showAddForm && (
        <form
          onSubmit={handleAddGrid}
          className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row gap-4 items-end"
        >
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">Nom</label>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={addForm.nom}
              onChange={(e) => setAddForm((f) => ({ ...f, nom: e.target.value }))}
              required
            />
          </div>

          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">Site</label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={addForm.site_id}
              onChange={(e) => setAddForm((f) => ({ ...f, site_id: e.target.value }))}
              required
            >
              <option value="">Sélectionner…</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.localite || `Site #${s.id}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Statut</label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={addForm.statut}
              onChange={(e) => setAddForm((f) => ({ ...f, statut: e.target.value }))}
            >
              <option value="en_service">En Service</option>
              <option value="maintenance">Maintenance</option>
              <option value="hors_service">Hors Service</option>
              <option value="projete">Projeté</option>
            </select>
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
            disabled={addLoading}
          >
            {addLoading ? <span>Ajout…</span> : (<><Plus className="w-4 h-4" />Créer</>)}
          </button>
        </form>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher une mini-grid..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-600" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">Tous les statuts</option>
            <option value="en_service">En Service</option>
            <option value="maintenance">Maintenance</option>
            <option value="hors_service">Hors Service</option>
            <option value="projete">Projeté</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredGrids.map((grid) => (
          <div
            key={grid.id}
            className={`rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow ${getCardBackground(grid.statut)}`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`${getIconBackgroundColor(grid.statut)} p-2 rounded-lg`}>
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{grid.nom}</h3>
                    <p className="text-sm text-gray-600">{grid.site?.localite}</p>
                  </div>
                </div>
                {getStatutBadge(grid.statut)}
              </div>

              {grid.derniereMesure && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <Battery className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                    <p className="text-xs text-gray-600">Tension</p>
                    <p className="text-sm font-semibold text-blue-600">
                      {grid.derniereMesure.voltage}V
                    </p>
                  </div>

                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <Activity className="w-4 h-4 text-green-500 mx-auto mb-1" />
                    <p className="text-xs text-gray-600">Puissance</p>
                    <p className="text-sm font-semibold text-green-600">
                      {(grid.derniereMesure.puissanceW! / 1000).toFixed(1)}kW
                    </p>
                  </div>

                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <Thermometer className="w-4 h-4 text-orange-500 mx-auto mb-1" />
                    <p className="text-xs text-gray-600">Température</p>
                    <p className="text-sm font-semibold text-orange-600">
                      {grid.derniereMesure.temperature}°C
                    </p>
                  </div>

                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <Zap className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                    <p className="text-xs text-gray-600">Population</p>
                    <p className="text-sm font-semibold text-purple-600">
                      {grid.site?.populationEstimee?.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 mt-2">
                <button
                  className="w-full bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  onClick={() => {
                    localStorage.setItem('selectedMiniGridId', String(grid.id));
                    navigate('/monitoring');
                  }}
                >
                  Monitoring
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredGrids.length === 0 && (
        <div className="text-center py-12">
          <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune mini-grid trouvée</h3>
          <p className="text-gray-600">Essayez de modifier vos critères de recherche.</p>
        </div>
      )}
    </div>
  );
}