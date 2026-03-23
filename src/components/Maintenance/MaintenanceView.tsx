import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  User,
  FileText,
  Wrench,
  ShieldAlert,
  CalendarClock,
  X,
  PlayCircle,
  ClipboardCheck,
  CalendarPlus,
} from "lucide-react";
import { BASE } from "../../services/api";

interface MaintenanceTicket {
  id: number;
  minigrid_id?: number | null;
  equipement_id?: number | null;
  alerte_id?: number | null;

  titre?: string | null;
  type?: string | null;
  source_ticket?: string | null;

  description?: string | null;
  priorite?: string | null;
  statut?: string | null;

  date_creation?: string | null;
  date_planifiee?: string | null;
  date_debut?: string | null;
  date_fin?: string | null;
  date_validation?: string | null;

  rapport?: string | null;
  observation_technicien?: string | null;

  cree_par?: number | null;
  assigne_a?: number | null;
  valide_par?: number | null;

  cout_estime?: number | null;
  cout_reel?: number | null;
  duree_estimee_h?: number | null;
  duree_reelle_h?: number | null;
}

interface DashboardStats {
  total: number;
  ouverts: number;
  planifies?: number;
  en_cours: number;
  rapport_envoye: number;
  termines: number;
  urgents: number;
  haute_priorite: number;
  preventives?: number;
  correctives?: number;
}

type ActionModalType =
  | "assigner"
  | "planifier"
  | "demarrer"
  | "cloturer"
  | "valider"
  | null;

export default function MaintenanceView() {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [filterPriorite, setFilterPriorite] = useState("");
  const [filterType, setFilterType] = useState("");

  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null);

  const [modalType, setModalType] = useState<ActionModalType>(null);
  const [modalTicket, setModalTicket] = useState<MaintenanceTicket | null>(null);
  const [formValue, setFormValue] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const API_URL = `${BASE}/maintenance`;

  const getAuthHeaders = () => {
    const token = localStorage.getItem("solarpro_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [ticketsRes, dashboardRes] = await Promise.all([
        axios.get(`${API_URL}/tickets`, { headers: getAuthHeaders() }),
        axios.get(`${API_URL}/dashboard`, { headers: getAuthHeaders() }),
      ]);

      setTickets(ticketsRes.data);
      setStats(dashboardRes.data);
    } catch (err) {
      console.error(err);
      setError("Impossible de charger les données du serveur.");
    } finally {
      setLoading(false);
    }
  };

  const refreshTickets = async () => {
    try {
      const [ticketsRes, dashboardRes] = await Promise.all([
        axios.get(`${API_URL}/tickets`, { headers: getAuthHeaders() }),
        axios.get(`${API_URL}/dashboard`, { headers: getAuthHeaders() }),
      ]);
      setTickets(ticketsRes.data);
      setStats(dashboardRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const openActionModal = (type: ActionModalType, ticket: MaintenanceTicket) => {
    setModalType(type);
    setModalTicket(ticket);
    setFormValue("");
  };

  const closeActionModal = () => {
    setModalType(null);
    setModalTicket(null);
    setFormValue("");
  };

  const submitAction = async () => {
    if (!modalTicket || !modalType) return;

    try {
      setActionLoading(true);

      if (modalType === "assigner") {
        if (!formValue.trim()) return;
        await axios.patch(
          `${API_URL}/tickets/${modalTicket.id}/assigner?assigne_a=${encodeURIComponent(formValue)}`,
          {},
          { headers: getAuthHeaders() }
        );
      }

      if (modalType === "planifier") {
        if (!formValue.trim()) return;
        await axios.patch(
          `${API_URL}/tickets/${modalTicket.id}/planifier?date_planifiee=${encodeURIComponent(formValue)}`,
          {},
          { headers: getAuthHeaders() }
        );
      }

      if (modalType === "demarrer") {
        await axios.patch(
          `${API_URL}/tickets/${modalTicket.id}/demarrer`,
          {},
          { headers: getAuthHeaders() }
        );
      }

      if (modalType === "cloturer") {
        if (!formValue.trim()) return;
        await axios.patch(
          `${API_URL}/tickets/${modalTicket.id}/cloturer?rapport=${encodeURIComponent(formValue)}`,
          {},
          { headers: getAuthHeaders() }
        );
      }

      if (modalType === "valider") {
        if (!formValue.trim()) return;
        await axios.patch(
          `${API_URL}/tickets/${modalTicket.id}/valider?valide_par=${encodeURIComponent(formValue)}`,
          {},
          { headers: getAuthHeaders() }
        );
      }

      closeActionModal();
      refreshTickets();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'action.");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const haystack = [
        ticket.id,
        ticket.titre,
        ticket.description,
        ticket.type,
        ticket.priorite,
        ticket.statut,
        ticket.source_ticket,
        ticket.minigrid_id,
        ticket.equipement_id,
        ticket.assigne_a,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !search || haystack.includes(search.toLowerCase());
      const matchesStatut = !filterStatut || ticket.statut === filterStatut;
      const matchesPriorite = !filterPriorite || ticket.priorite === filterPriorite;
      const matchesType = !filterType || ticket.type === filterType;

      return matchesSearch && matchesStatut && matchesPriorite && matchesType;
    });
  }, [tickets, search, filterStatut, filterPriorite, filterType]);

  const urgentTickets = useMemo(
    () => filteredTickets.filter((t) => t.priorite === "urgente" || t.priorite === "haute"),
    [filteredTickets]
  );

  const plannedTickets = useMemo(
    () =>
      filteredTickets.filter(
        (t) =>
          t.statut === "planifie" ||
          t.type === "preventive" ||
          t.type === "planifiee"
      ),
    [filteredTickets]
  );

  const waitingValidationTickets = useMemo(
    () => filteredTickets.filter((t) => t.statut === "rapport_envoye"),
    [filteredTickets]
  );

  const inProgressTickets = useMemo(
    () => filteredTickets.filter((t) => t.statut === "en_cours"),
    [filteredTickets]
  );

  if (loading) {
    return <p className="p-6 text-gray-600">Chargement des données...</p>;
  }

  if (error) {
    return <p className="p-6 text-red-600">{error}</p>;
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Centre de maintenance</h1>
            <p className="text-sm text-gray-500 mt-1">
              Gestion des interventions préventives, correctives, urgentes et planifiées.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <CalendarClock className="w-4 h-4" />
            <span>Mise à jour : {new Date().toLocaleString("fr-FR")}</span>
          </div>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard title="Total" value={stats.total} tone="slate" icon={<Wrench className="w-5 h-5" />} />
          <StatCard title="Ouverts" value={stats.ouverts} tone="blue" icon={<AlertCircle className="w-5 h-5" />} />
          <StatCard title="Urgents" value={stats.urgents} tone="red" icon={<ShieldAlert className="w-5 h-5" />} />
          <StatCard title="Planifiés" value={stats.planifies ?? 0} tone="purple" icon={<CalendarPlus className="w-5 h-5" />} />
          <StatCard title="En cours" value={stats.en_cours} tone="orange" icon={<Clock className="w-5 h-5" />} />
          <StatCard title="Terminés" value={stats.termines} tone="green" icon={<CheckCircle className="w-5 h-5" />} />
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-5 gap-3">
          <div className="flex items-center gap-2 border rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher ticket, mini-grid, type, priorité..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full outline-none text-sm"
            />
          </div>

          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm"
          >
            <option value="">Tous les statuts</option>
            <option value="ouvert">Ouvert</option>
            <option value="planifie">Planifié</option>
            <option value="en_cours">En cours</option>
            <option value="rapport_envoye">Rapport envoyé</option>
            <option value="termine">Terminé</option>
          </select>

          <select
            value={filterPriorite}
            onChange={(e) => setFilterPriorite(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm"
          >
            <option value="">Toutes les priorités</option>
            <option value="faible">Faible</option>
            <option value="moyenne">Moyenne</option>
            <option value="haute">Haute</option>
            <option value="urgente">Urgente</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm"
          >
            <option value="">Tous les types</option>
            <option value="preventive">Préventive</option>
            <option value="corrective">Corrective</option>
            <option value="curative">Curative</option>
            <option value="planifiee">Planifiée</option>
            <option value="urgence">Urgence</option>
          </select>

          <button
            onClick={fetchData}
            className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm hover:bg-slate-800"
          >
            Rafraîchir
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <SectionCard title="Urgents / haute priorité" subtitle={`${urgentTickets.length} ticket(s)`} tone="red">
          {urgentTickets.length === 0 ? (
            <EmptyState text="Aucune intervention urgente." />
          ) : (
            <div className="space-y-3">
              {urgentTickets.slice(0, 5).map((ticket) => (
                <CompactTicket key={ticket.id} ticket={ticket} onOpen={() => setSelectedTicket(ticket)} />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Planifiés / préventifs" subtitle={`${plannedTickets.length} ticket(s)`} tone="purple">
          {plannedTickets.length === 0 ? (
            <EmptyState text="Aucune maintenance planifiée." />
          ) : (
            <div className="space-y-3">
              {plannedTickets.slice(0, 5).map((ticket) => (
                <CompactTicket key={ticket.id} ticket={ticket} onOpen={() => setSelectedTicket(ticket)} />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="En cours" subtitle={`${inProgressTickets.length} ticket(s)`} tone="orange">
          {inProgressTickets.length === 0 ? (
            <EmptyState text="Aucune intervention en cours." />
          ) : (
            <div className="space-y-3">
              {inProgressTickets.slice(0, 5).map((ticket) => (
                <CompactTicket key={ticket.id} ticket={ticket} onOpen={() => setSelectedTicket(ticket)} />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="À valider" subtitle={`${waitingValidationTickets.length} ticket(s)`} tone="green">
          {waitingValidationTickets.length === 0 ? (
            <EmptyState text="Aucun rapport en attente." />
          ) : (
            <div className="space-y-3">
              {waitingValidationTickets.slice(0, 5).map((ticket) => (
                <CompactTicket key={ticket.id} ticket={ticket} onOpen={() => setSelectedTicket(ticket)} />
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Liste des interventions</h2>
          <p className="text-sm text-gray-500 mt-1">{filteredTickets.length} ticket(s) affiché(s)</p>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="p-10">
            <EmptyState text="Aucun ticket de maintenance pour le moment." />
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredTickets.map((ticket) => (
              <div key={ticket.id} className="p-5 hover:bg-gray-50 transition">
                <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-base font-bold text-gray-900">
                        {ticket.titre || `Ticket #${ticket.id}`}
                      </h3>
                      <Badge label={`#${ticket.id}`} tone="slate" />
                      <Badge label={formatType(ticket.type)} tone={getTypeTone(ticket.type)} />
                      <Badge label={formatPriorite(ticket.priorite)} tone={getPrioriteTone(ticket.priorite)} />
                      <Badge label={formatStatut(ticket.statut)} tone={getStatutTone(ticket.statut)} />
                    </div>

                    <p className="text-sm text-gray-700 mb-3">
                      {ticket.description || "Aucune description"}
                    </p>

                    <TicketStatusTimeline statut={ticket.statut || "ouvert"} />

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 text-sm">
                      <InfoItem label="Mini-grid" value={ticket.minigrid_id ? `#${ticket.minigrid_id}` : "—"} />
                      <InfoItem label="Équipement" value={ticket.equipement_id ? `#${ticket.equipement_id}` : "—"} />
                      <InfoItem label="Créé le" value={formatDate(ticket.date_creation)} />
                      <InfoItem label="Planifié pour" value={formatDate(ticket.date_planifiee)} />
                    </div>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 text-sm">
                      <InfoItem label="Assigné à" value={ticket.assigne_a ? `#${ticket.assigne_a}` : "Non assigné"} />
                      <InfoItem label="Début" value={formatDate(ticket.date_debut)} />
                      <InfoItem label="Fin" value={formatDate(ticket.date_fin)} />
                      <InfoItem label="Validation" value={formatDate(ticket.date_validation)} />
                    </div>

                    {ticket.rapport && (
                      <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-100 p-3 text-sm text-amber-800">
                        <FileText className="w-4 h-4 mt-0.5" />
                        <div>
                          <span className="font-semibold">Rapport :</span> {ticket.rapport}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 xl:w-48">
                    <button
                      onClick={() => setSelectedTicket(ticket)}
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-100"
                    >
                      Voir détails
                    </button>

                    {ticket.statut === "ouvert" && (
                      <>
                        <button
                          onClick={() => openActionModal("assigner", ticket)}
                          className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
                        >
                          Assigner
                        </button>
                        <button
                          onClick={() => openActionModal("planifier", ticket)}
                          className="px-3 py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-700"
                        >
                          Planifier
                        </button>
                      </>
                    )}

                    {ticket.statut === "planifie" && (
                      <button
                        onClick={() => openActionModal("demarrer", ticket)}
                        className="px-3 py-2 rounded-lg bg-orange-500 text-white text-sm hover:bg-orange-600"
                      >
                        Démarrer
                      </button>
                    )}

                    {ticket.statut === "en_cours" && (
                      <button
                        onClick={() => openActionModal("cloturer", ticket)}
                        className="px-3 py-2 rounded-lg bg-amber-500 text-white text-sm hover:bg-amber-600"
                      >
                        Clôturer
                      </button>
                    )}

                    {ticket.statut === "rapport_envoye" && (
                      <button
                        onClick={() => openActionModal("valider", ticket)}
                        className="px-3 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700"
                      >
                        Valider
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTicket && (
        <DetailsDrawer ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
      )}

      {modalType && modalTicket && (
        <ActionModal
          type={modalType}
          ticket={modalTicket}
          value={formValue}
          onChange={setFormValue}
          onClose={closeActionModal}
          onSubmit={submitAction}
          loading={actionLoading}
        />
      )}
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  tone,
  children,
}: {
  title: string;
  subtitle: string;
  tone: "red" | "purple" | "orange" | "green";
  children: React.ReactNode;
}) {
  const toneMap = {
    red: "bg-red-50 border-red-100",
    purple: "bg-purple-50 border-purple-100",
    orange: "bg-orange-50 border-orange-100",
    green: "bg-green-50 border-green-100",
  };

  return (
    <div className={`rounded-2xl border p-4 ${toneMap[tone]}`}>
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-gray-500">{text}</p>;
}

function CompactTicket({
  ticket,
  onOpen,
}: {
  ticket: MaintenanceTicket;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className="w-full text-left bg-white rounded-xl border border-gray-100 p-3 hover:shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-semibold text-sm text-gray-900">
            {ticket.titre || `Ticket #${ticket.id}`}
          </div>
          <div className="text-xs text-gray-500 mt-1 line-clamp-2">
            {ticket.description || "Sans description"}
          </div>
        </div>
        <Badge label={formatStatut(ticket.statut)} tone={getStatutTone(ticket.statut)} />
      </div>
    </button>
  );
}

function DetailsDrawer({
  ticket,
  onClose,
}: {
  ticket: MaintenanceTicket;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
      <div className="w-full max-w-lg h-full bg-white shadow-2xl p-6 overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {ticket.titre || `Ticket #${ticket.id}`}
            </h2>
            <p className="text-sm text-gray-500 mt-1">Détail complet de l’intervention</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-100 p-2 hover:bg-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <DetailRow label="ID ticket" value={`#${ticket.id}`} />
          <DetailRow label="Type" value={formatType(ticket.type)} />
          <DetailRow label="Source" value={ticket.source_ticket || "—"} />
          <DetailRow label="Priorité" value={formatPriorite(ticket.priorite)} />
          <DetailRow label="Statut" value={formatStatut(ticket.statut)} />
          <DetailRow label="Mini-grid" value={ticket.minigrid_id ? `#${ticket.minigrid_id}` : "—"} />
          <DetailRow label="Équipement" value={ticket.equipement_id ? `#${ticket.equipement_id}` : "—"} />
          <DetailRow label="Créé le" value={formatDate(ticket.date_creation)} />
          <DetailRow label="Planifié pour" value={formatDate(ticket.date_planifiee)} />
          <DetailRow label="Début" value={formatDate(ticket.date_debut)} />
          <DetailRow label="Fin" value={formatDate(ticket.date_fin)} />
          <DetailRow label="Validation" value={formatDate(ticket.date_validation)} />
          <DetailRow label="Créé par" value={ticket.cree_par ? `#${ticket.cree_par}` : "—"} />
          <DetailRow label="Assigné à" value={ticket.assigne_a ? `#${ticket.assigne_a}` : "—"} />
          <DetailRow label="Validé par" value={ticket.valide_par ? `#${ticket.valide_par}` : "—"} />
          <DetailRow label="Coût estimé" value={ticket.cout_estime != null ? `${ticket.cout_estime}` : "—"} />
          <DetailRow label="Coût réel" value={ticket.cout_reel != null ? `${ticket.cout_reel}` : "—"} />
          <DetailRow label="Durée estimée (h)" value={ticket.duree_estimee_h != null ? `${ticket.duree_estimee_h}` : "—"} />
          <DetailRow label="Durée réelle (h)" value={ticket.duree_reelle_h != null ? `${ticket.duree_reelle_h}` : "—"} />

          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">Description</div>
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-sm text-gray-700">
              {ticket.description || "Aucune description"}
            </div>
          </div>

          {ticket.observation_technicien && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">Observation technicien</div>
              <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-sm text-blue-800">
                {ticket.observation_technicien}
              </div>
            </div>
          )}

          {ticket.rapport && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">Rapport</div>
              <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-sm text-amber-800">
                {ticket.rapport}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-sm font-medium text-gray-700 mb-1">{label}</div>
      <div className="text-sm text-gray-600">{value}</div>
    </div>
  );
}

function ActionModal({
  type,
  ticket,
  value,
  onChange,
  onClose,
  onSubmit,
  loading,
}: {
  type: ActionModalType;
  ticket: MaintenanceTicket;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  const config =
    type === "assigner"
      ? {
          title: `Assigner le ticket #${ticket.id}`,
          label: "ID du technicien",
          placeholder: "Ex: 12",
          button: "Confirmer l’assignation",
          icon: <User className="w-5 h-5" />,
        }
      : type === "planifier"
      ? {
          title: `Planifier le ticket #${ticket.id}`,
          label: "Date planifiée",
          placeholder: "Ex: 2026-03-20T09:00:00+00:00",
          button: "Planifier",
          icon: <CalendarPlus className="w-5 h-5" />,
        }
      : type === "demarrer"
      ? {
          title: `Démarrer l’intervention #${ticket.id}`,
          label: "Confirmation",
          placeholder: "",
          button: "Démarrer maintenant",
          icon: <PlayCircle className="w-5 h-5" />,
        }
      : type === "cloturer"
      ? {
          title: `Clôturer le ticket #${ticket.id}`,
          label: "Rapport de maintenance",
          placeholder: "Décrire l’intervention réalisée...",
          button: "Envoyer le rapport",
          icon: <FileText className="w-5 h-5" />,
        }
      : {
          title: `Valider le ticket #${ticket.id}`,
          label: "ID du validateur",
          placeholder: "Ex: 3",
          button: "Valider définitivement",
          icon: <ClipboardCheck className="w-5 h-5" />,
        };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-slate-100 text-slate-700">{config.icon}</div>
          <h3 className="text-lg font-semibold text-gray-900">{config.title}</h3>
        </div>

        {type !== "demarrer" ? (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">{config.label}</label>

            {type === "cloturer" ? (
              <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={config.placeholder}
                className="w-full min-h-[120px] border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              />
            ) : (
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={config.placeholder}
                className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              />
            )}
          </div>
        ) : (
          <div className="rounded-xl bg-orange-50 border border-orange-100 p-4 text-sm text-orange-800">
            Cette action va démarrer immédiatement l’intervention et renseigner la date de début.
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={onSubmit}
            disabled={loading || (type !== "demarrer" && !value.trim())}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "Traitement..." : config.button}
          </button>
        </div>
      </div>
    </div>
  );
}

function TicketStatusTimeline({ statut }: { statut: string }) {
  const steps = [
    { id: "ouvert", label: "Ouvert" },
    { id: "planifie", label: "Planifié" },
    { id: "en_cours", label: "En cours" },
    { id: "rapport_envoye", label: "Rapport" },
    { id: "termine", label: "Terminé" },
  ];

  const currentIndex = steps.findIndex((s) => s.id === statut);

  return (
    <div className="mt-2 mb-3 w-full">
      <div className="flex items-center justify-between gap-2">
        {steps.map((step, i) => {
          const active = i <= currentIndex;
          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center min-w-[56px]">
                <div
                  className={`w-4 h-4 rounded-full border-2 ${
                    active ? "bg-slate-900 border-slate-900" : "bg-white border-gray-300"
                  }`}
                />
                <span
                  className={`text-[11px] mt-1 font-medium ${
                    i === currentIndex
                      ? "text-slate-900"
                      : active
                      ? "text-gray-700"
                      : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {i < steps.length - 1 && (
                <div className={`flex-1 h-[2px] ${i < currentIndex ? "bg-slate-900" : "bg-gray-300"}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  tone,
  icon,
}: {
  title: string;
  value: number;
  tone: "slate" | "blue" | "red" | "orange" | "purple" | "green";
  icon: React.ReactNode;
}) {
  const toneMap = {
    slate: { text: "text-slate-700", icon: "bg-slate-700" },
    blue: { text: "text-blue-700", icon: "bg-blue-600" },
    red: { text: "text-red-700", icon: "bg-red-600" },
    orange: { text: "text-orange-700", icon: "bg-orange-500" },
    purple: { text: "text-purple-700", icon: "bg-purple-600" },
    green: { text: "text-green-700", icon: "bg-green-600" },
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${toneMap[tone].text}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-xl text-white ${toneMap[tone].icon}`}>{icon}</div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
      <div className="text-xs uppercase tracking-wide text-gray-400">{label}</div>
      <div className="text-sm font-medium text-gray-800 mt-1">{value}</div>
    </div>
  );
}

function Badge({
  label,
  tone,
}: {
  label: string;
  tone: "gray" | "blue" | "green" | "yellow" | "red" | "purple" | "slate";
}) {
  const toneMap = {
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    yellow: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
    purple: "bg-purple-100 text-purple-700",
    slate: "bg-slate-100 text-slate-700",
  };

  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${toneMap[tone]}`}>{label}</span>;
}

function formatDate(d?: string | null) {
  return d ? new Date(d).toLocaleString("fr-FR") : "—";
}

function formatType(type?: string | null) {
  switch (type) {
    case "preventive":
      return "Préventive";
    case "corrective":
      return "Corrective";
    case "curative":
      return "Curative";
    case "planifiee":
      return "Planifiée";
    case "urgence":
      return "Urgence";
    default:
      return type || "Non défini";
  }
}

function formatPriorite(priorite?: string | null) {
  switch (priorite) {
    case "faible":
      return "Faible";
    case "moyenne":
      return "Moyenne";
    case "haute":
      return "Haute";
    case "urgente":
      return "Urgente";
    default:
      return priorite || "Non définie";
  }
}

function formatStatut(statut?: string | null) {
  switch (statut) {
    case "ouvert":
      return "Ouvert";
    case "planifie":
      return "Planifié";
    case "en_cours":
      return "En cours";
    case "rapport_envoye":
      return "Rapport envoyé";
    case "termine":
      return "Terminé";
    default:
      return statut || "Inconnu";
  }
}

function getTypeTone(type?: string | null) {
  switch (type) {
    case "preventive":
      return "blue";
    case "corrective":
      return "yellow";
    case "curative":
      return "purple";
    case "planifiee":
      return "slate";
    case "urgence":
      return "red";
    default:
      return "gray";
  }
}

function getPrioriteTone(priorite?: string | null) {
  switch (priorite) {
    case "faible":
      return "gray";
    case "moyenne":
      return "blue";
    case "haute":
      return "yellow";
    case "urgente":
      return "red";
    default:
      return "gray";
  }
}

function getStatutTone(statut?: string | null) {
  switch (statut) {
    case "ouvert":
      return "blue";
    case "planifie":
      return "purple";
    case "en_cours":
      return "yellow";
    case "rapport_envoye":
      return "slate";
    case "termine":
      return "green";
    default:
      return "gray";
  }
}