import { useEffect, useMemo, useState } from "react";
import { Archive } from "lucide-react";

const isPastDate = (dateValue) => {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return date.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
};

const AdminArchive = ({ api }) => {
  const [pastAppointments, setPastAppointments] = useState([]);
  const [pastSlots, setPastSlots] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [activeArchiveType, setActiveArchiveType] = useState("prescriptions");

  useEffect(() => {
    const load = async () => {
      try {
        const [rdvResp, slotResp] = await Promise.all([
          api.get("/appointments", { params: { past: true, limit: 500 } }),
          api.get("/time-slots/admin", { params: { limit: 2000 } }),
        ]);

        const slots = slotResp.data?.items || slotResp.data || [];
        setPastAppointments(Array.isArray(rdvResp.data) ? rdvResp.data : []);
        setPastSlots(Array.isArray(slots) ? slots.filter((slot) => isPastDate(slot.date)) : []);
      } catch (error) {
        console.error("Erreur chargement archives:", error);
      }

      try {
        const prescResp = await api.get("/prescriptions");
        const list = Array.isArray(prescResp.data) ? prescResp.data : [];
        setPrescriptions(list.filter((item) => isPastDate(item.date || item.createdAt)));
      } catch (error) {
        console.error("Erreur chargement prescriptions:", error);
        setPrescriptions([]);
      }
    };

    load();
  }, [api]);

  const sortedPrescriptions = useMemo(
    () => [...prescriptions].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)),
    [prescriptions]
  );
  const sortedPastAppointments = useMemo(
    () => [...pastAppointments].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)),
    [pastAppointments]
  );
  const sortedPastSlots = useMemo(
    () => [...pastSlots].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)),
    [pastSlots]
  );

  const cards = [
    {
      key: "prescriptions",
      title: "Ordonnances",
      subtitle: "Ordonnances archivees",
      count: sortedPrescriptions.length,
    },
    {
      key: "appointments",
      title: "RDV passes",
      subtitle: "Rendez-vous passes",
      count: sortedPastAppointments.length,
    },
    {
      key: "slots",
      title: "Creneaux passes",
      subtitle: "Creneaux passes",
      count: sortedPastSlots.length,
    },
  ];

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 p-4 sm:p-6 space-y-6">
      <h3 className="text-xl sm:text-2xl font-semibold text-gray-700 flex items-center gap-2">
        <Archive className="w-5 h-5" /> Archives
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {cards.map((card) => (
          <button
            key={card.key}
            type="button"
            onClick={() => setActiveArchiveType(card.key)}
            className={`p-3 rounded-xl border text-left transition-all ${activeArchiveType === card.key ? "bg-cyan-50 border-cyan-300 shadow-md" : "bg-slate-50 border-slate-200 hover:bg-slate-100"}`}
          >
            <p className="text-sm text-slate-600">{card.subtitle}</p>
            <p className="text-lg font-semibold text-slate-800">{card.count}</p>
          </button>
        ))}
      </div>

      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/70">
        {activeArchiveType === "prescriptions" && (
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Informations ordonnances</h4>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {sortedPrescriptions.map((item) => (
                <div key={item.id} className="text-sm text-gray-600 p-3 border border-gray-200 rounded-lg bg-white">
                  <p className="font-medium text-gray-700">{item.patient?.username || item.patientName || "Patient"}</p>
                  <p>Date: {item.date ? new Date(item.date).toLocaleDateString("fr-FR") : "-"}</p>
                  <p>Médecin: {item.doctor?.username || item.doctor || "-"}</p>
                  <p>Nb medicaments: {Array.isArray(item.medications) ? item.medications.length : 0}</p>
                </div>
              ))}
              {sortedPrescriptions.length === 0 && <p className="text-sm text-gray-500">Aucune ordonnance archivee.</p>}
            </div>
          </div>
        )}

        {activeArchiveType === "appointments" && (
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Informations RDV passes</h4>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {sortedPastAppointments.map((item) => (
                <div key={item.id} className="text-sm text-gray-600 p-3 border border-gray-200 rounded-lg bg-white">
                  <p className="font-medium text-gray-700">{(item.patient && item.patient.username) || item.patient_name || "Patient"}</p>
                  <p>Date: {item.date || "-"}</p>
                  <p>Heure: {item.time || item.heure || "--:--"}</p>
                  <p>Motif: {item.demande || "-"}</p>
                </div>
              ))}
              {sortedPastAppointments.length === 0 && <p className="text-sm text-gray-500">Aucun rendez-vous passe.</p>}
            </div>
          </div>
        )}

        {activeArchiveType === "slots" && (
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Informations creneaux passes</h4>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {sortedPastSlots.map((slot) => (
                <div key={slot.id} className="text-sm text-gray-600 p-3 border border-gray-200 rounded-lg bg-white">
                  <p className="font-medium text-gray-700">{slot.date || "-"}</p>
                  <p>Heures: {slot.heure_debut || slot.heureDebut || "--:--"} - {slot.heure_fin || slot.heureFin || "--:--"}</p>
                  <p>Type: {slot.type_consultation || slot.typeConsultation || "-"}</p>
                  <p>Salle: {slot.salle_consultation || slot.salleConsultation || "-"}</p>
                </div>
              ))}
              {sortedPastSlots.length === 0 && <p className="text-sm text-gray-500">Aucun creneau passe.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminArchive;
