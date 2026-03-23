// src/views/ParametresView.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Settings, Plus, Loader2, MapPin, Zap, Server, Sliders } from "lucide-react";
import api from "../services/api";
import type { SiteReadBack, MiniGridReadBack } from "../types/api";

type Projet = {
  id: number;
  nom: string;
  pays?: string | null;
};

type SiteForm = {
  projet_id: number | null;
  localite: string;
  latitude: string;
  longitude: string;
  score_acces: string;
  population_estimee: string;
  statut: string;
  visibilite: boolean;
};

export default function ParametresView() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [projets, setProjets] = useState<Projet[]>([]);
  const [sites, setSites] = useState<SiteReadBack[]>([]);
  const [minigrids, setMinigrids] = useState<MiniGridReadBack[]>([]);
  const [equipTypes, setEquipTypes] = useState<any[]>([]);

  const [siteForm, setSiteForm] = useState<SiteForm>({
    projet_id: null,
    localite: "",
    latitude: "",
    longitude: "",
    score_acces: "",
    population_estimee: "",
    statut: "en_service",
    visibilite: true,
  });

  const [equipTypeForm, setEquipTypeForm] = useState({
    type: "",
    description: "",
  });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const [prj, sts, mgs, tps] = await Promise.all([
          api.projets.list() as Promise<Projet[]>,
          api.sites.list() as Promise<SiteReadBack[]>,
          api.minigrids.list() as Promise<MiniGridReadBack[]>,
          api.equipementTypes.list() as Promise<any[]>,
        ]);

        setProjets(prj);
        setSites(sts);
        setMinigrids(mgs);
        setEquipTypes(tps);

        if (prj?.length) {
          setSiteForm((f) => ({
            ...f,
            projet_id: f.projet_id === null || f.projet_id === 0 ? prj[0].id : f.projet_id,
          }));
        }
      } catch (e: any) {
        setErr(
          e?.response?.data?.detail ||
            e?.message ||
            "Échec du chargement des paramètres"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const submitNewSite = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    try {
      if (!projets.length) {
        throw new Error("Aucun projet disponible. Créez d’abord un projet.");
      }

      if (siteForm.projet_id === null || siteForm.projet_id === 0) {
        throw new Error("Veuillez sélectionner un projet.");
      }

      if (!siteForm.localite.trim()) {
        throw new Error("La localité est obligatoire.");
      }

      if (!siteForm.score_acces.trim()) {
        throw new Error("Le score d’accès est obligatoire.");
      }

      const lat = parseFloat(siteForm.latitude);
      const lon = parseFloat(siteForm.longitude);
      const scoreAcces = parseInt(siteForm.score_acces, 10);
      const pop = siteForm.population_estimee.trim()
        ? parseInt(siteForm.population_estimee, 10)
        : null;

      if (!Number.isFinite(scoreAcces)) {
        throw new Error("Le score d’accès doit être un nombre valide.");
      }

      let point_wkt: string | undefined = undefined;

      const hasLat = siteForm.latitude.trim() !== "";
      const hasLon = siteForm.longitude.trim() !== "";

      if ((hasLat && !hasLon) || (!hasLat && hasLon)) {
        throw new Error("Veuillez renseigner à la fois la latitude et la longitude.");
      }

      if (hasLat && hasLon) {
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
          throw new Error("Latitude ou longitude invalide.");
        }
        point_wkt = `POINT(${lon} ${lat})`;
      }

      const payload = {
        projet_id: siteForm.projet_id,
        localite: siteForm.localite.trim(),
        score_acces: scoreAcces,
        point_wkt,
        population_estimee: pop,
        statut: siteForm.statut,
        visibilite: siteForm.visibilite,
      };

      console.log("Payload création site =", payload);

      const created = await api.sites.create(payload);

      setSites((prev) => [created as SiteReadBack, ...prev]);

      setSiteForm((f) => ({
        ...f,
        localite: "",
        latitude: "",
        longitude: "",
        score_acces: "",
        population_estimee: "",
        statut: "en_service",
        visibilite: true,
      }));

      alert("Site créé ✅");
    } catch (e: any) {
      const detail = e?.response?.data?.detail;

      if (Array.isArray(detail)) {
        const msg = detail
          .map((item: any) => `${item.loc?.join(" > ") || "champ"} : ${item.msg}`)
          .join(" | ");
        setErr(msg);
      } else {
        setErr(detail || e?.message || "Erreur lors de la création du site");
      }
    }
  };

  const submitNewEquipType = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    try {
      const created = await api.equipementTypes.create({
        type: equipTypeForm.type,
        description: equipTypeForm.description || undefined,
      });

      setEquipTypes((prev) => [created, ...prev]);
      setEquipTypeForm({ type: "", description: "" });

      alert("Type d’équipement créé ✅");
    } catch (e: any) {
      setErr(
        e?.response?.data?.detail ||
          e?.message ||
          "Erreur lors de la création du type d’équipement"
      );
    }
  };

  const projetsById = useMemo(() => {
    const map = new Map<number, Projet>();
    projets.forEach((p) => map.set(p.id, p));
    return map;
  }, [projets]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-3 text-slate-700">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Chargement des paramètres…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-7 h-7 text-slate-700" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Paramètres</h1>
            <p className="text-slate-600 text-sm">
              Configurez la plateforme, les sites, les équipements et les utilisateurs
            </p>
          </div>
        </div>
      </div>

      {err && (
        <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-700">
          {err}
        </div>
      )}

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-5 border-b border-slate-200 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-slate-700" />
          <h2 className="font-semibold text-slate-900">Paramètres généraux</h2>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Nom de la plateforme</label>
            <input
              className="w-full border rounded-lg px-3 py-2"
              placeholder="SolarPro"
              defaultValue="SolarPro"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Langue</label>
            <select className="w-full border rounded-lg px-3 py-2" defaultValue="fr">
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-5 border-b border-slate-200 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-emerald-600" />
          <h2 className="font-semibold text-slate-900">Sites (Mini-grids)</h2>
        </div>

        <form
          onSubmit={submitNewSite}
          className="p-5 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-3"
        >
          <div className="col-span-2">
            <label className="block text-sm text-slate-600 mb-1">Projet</label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={siteForm.projet_id === null ? "" : siteForm.projet_id}
              onChange={(e) =>
                setSiteForm((f) => ({
                  ...f,
                  projet_id: e.target.value ? Number(e.target.value) : null,
                }))
              }
              required
            >
              <option value="">Sélectionner un projet</option>
              {projets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm text-slate-600 mb-1">Localité</label>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={siteForm.localite}
              onChange={(e) => setSiteForm((f) => ({ ...f, localite: e.target.value }))}
              placeholder="Ex: Rimkieta"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Latitude</label>
            <input
              type="number"
              step="any"
              className="w-full border rounded-lg px-3 py-2"
              value={siteForm.latitude}
              onChange={(e) => setSiteForm((f) => ({ ...f, latitude: e.target.value }))}
              placeholder="12.36"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Longitude</label>
            <input
              type="number"
              step="any"
              className="w-full border rounded-lg px-3 py-2"
              value={siteForm.longitude}
              onChange={(e) => setSiteForm((f) => ({ ...f, longitude: e.target.value }))}
              placeholder="-1.53"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Score d’accès</label>
            <input
              type="number"
              className="w-full border rounded-lg px-3 py-2"
              value={siteForm.score_acces}
              onChange={(e) => setSiteForm((f) => ({ ...f, score_acces: e.target.value }))}
              placeholder="Ex: 5"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Population estimée</label>
            <input
              type="number"
              className="w-full border rounded-lg px-3 py-2"
              value={siteForm.population_estimee}
              onChange={(e) =>
                setSiteForm((f) => ({ ...f, population_estimee: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Statut</label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={siteForm.statut}
              onChange={(e) => setSiteForm((f) => ({ ...f, statut: e.target.value }))}
            >
              <option value="en_service">En Service</option>
              <option value="maintenance">Maintenance</option>
              <option value="hors_service">Hors Service</option>
              <option value="projete">Projeté</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={siteForm.visibilite}
                onChange={(e) =>
                  setSiteForm((f) => ({ ...f, visibilite: e.target.checked }))
                }
              />
              Visible
            </label>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={!projets.length}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white ${
                projets.length
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-slate-300 cursor-not-allowed"
              }`}
              title={projets.length ? "" : "Créez d’abord un projet"}
            >
              <Plus className="w-4 h-4" /> Créer le site
            </button>
          </div>
        </form>

        <div className="p-5 border-t border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600">
                  <th className="py-2 pr-4">ID</th>
                  <th className="py-2 pr-4">Projet</th>
                  <th className="py-2 pr-4">Localité</th>
                  <th className="py-2 pr-4">Population</th>
                  <th className="py-2 pr-4">Score accès</th>
                  <th className="py-2 pr-4">Statut</th>
                  <th className="py-2 pr-4">Visibilité</th>
                </tr>
              </thead>
              <tbody>
                {sites.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="py-2 pr-4">{s.id}</td>
                    <td className="py-2 pr-4">
                      {s.projet_id != null ? projetsById.get(s.projet_id)?.nom || "—" : "—"}
                    </td>
                    <td className="py-2 pr-4">{s.localite ?? "—"}</td>
                    <td className="py-2 pr-4">{s.population_estimee ?? "—"}</td>
                    <td className="py-2 pr-4">{(s as any).score_acces ?? "—"}</td>
                    <td className="py-2 pr-4">{s.statut ?? "—"}</td>
                    <td className="py-2 pr-4">{(s.visibilite ?? true) ? "Oui" : "Non"}</td>
                  </tr>
                ))}
                {sites.length === 0 && (
                  <tr>
                    <td className="py-4 text-slate-500" colSpan={7}>
                      Aucun site
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-5 border-b border-slate-200 flex items-center gap-2">
          <Server className="w-5 h-5 text-purple-600" />
          <h2 className="font-semibold text-slate-900">Types d’équipements</h2>
        </div>

        <form onSubmit={submitNewEquipType} className="p-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Type</label>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={equipTypeForm.type}
              onChange={(e) => setEquipTypeForm((f) => ({ ...f, type: e.target.value }))}
              placeholder="ex : onduleur, batterie…"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-slate-600 mb-1">Description</label>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={equipTypeForm.description}
              onChange={(e) =>
                setEquipTypeForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Facultatif"
            />
          </div>
          <div className="md:col-span-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
            >
              <Plus className="w-4 h-4" /> Ajouter le type
            </button>
          </div>
        </form>

        <div className="p-5 border-t border-slate-200">
          <div className="grid md:grid-cols-3 gap-3">
            {equipTypes.map((t: any) => (
              <div key={t.id} className="border rounded-lg p-4">
                <div className="font-medium">{t.type}</div>
                <div className="text-slate-600 text-sm">{t.description ?? "—"}</div>
              </div>
            ))}
            {equipTypes.length === 0 && (
              <div className="text-slate-500">Aucun type d’équipement</div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-5 border-b border-slate-200 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-600" />
          <h2 className="font-semibold text-slate-900">Mini-grids</h2>
        </div>
        <div className="p-5">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600">
                  <th className="py-2 pr-4">ID</th>
                  <th className="py-2 pr-4">Nom</th>
                  <th className="py-2 pr-4">Site ID</th>
                  <th className="py-2 pr-4">Statut</th>
                </tr>
              </thead>
              <tbody>
                {minigrids.map((m) => (
                  <tr key={m.id} className="border-t">
                    <td className="py-2 pr-4">{m.id}</td>
                    <td className="py-2 pr-4">{m.nom}</td>
                    <td className="py-2 pr-4">{m.site_id}</td>
                    <td className="py-2 pr-4">{m.statut ?? "—"}</td>
                  </tr>
                ))}
                {minigrids.length === 0 && (
                  <tr>
                    <td className="py-4 text-slate-500" colSpan={4}>
                      Aucune mini-grid
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}