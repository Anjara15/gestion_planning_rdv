import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Plus, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const _apiBaseRaw = import.meta.env.VITE_API_URL || "http://localhost:3000";
const _apiBase = String(_apiBaseRaw).replace(/\/+$/, "");
const API_BASE_URL = _apiBase.endsWith("/api") ? _apiBase : `${_apiBase}/api`;

const getTokenHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const buildDefaultForm = () => ({
  patientId: "",
  severity: "modere",
  motif: "",
  date: new Date().toISOString().split("T")[0],
  time: new Date().toTimeString().slice(0, 5),
});

const AdminEmergency = ({ addToHistory, currentUser, patients = [] }) => {
  const [emergencies, setEmergencies] = useState([]);
  const [form, setForm] = useState(buildDefaultForm());
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    // Load urgences from appointments (marked as urgence type)
    const loadEmergencies = async () => {
      try {
        const resp = await axios.get(`${API_BASE_URL}/appointments?type=urgence`, {
          headers: getTokenHeader(),
        });
        setEmergencies(Array.isArray(resp.data) ? resp.data : []);
      } catch (err) {
        console.error("Erreur chargement urgences:", err);
        toast.error("Erreur chargement urgences");
      }
    };
    loadEmergencies();
  }, []);

  const resetForm = () => {
    setForm(buildDefaultForm());
    setEditingId(null);
  };

  const addOrUpdateEmergency = async () => {
    if (!form.patientId || !form.motif.trim()) return;
    const payload = {
      patient_id: form.patientId,
      date: form.date,
      time: form.time,
      specialite: "Urgence",
      demande: form.motif,
      type_consultation: "urgence",
      severity: form.severity,
    };

    try {
      if (editingId) {
        const resp = await axios.put(`${API_BASE_URL}/appointments/${editingId}`, payload, {
          headers: { "Content-Type": "application/json", ...getTokenHeader() },
        });
        setEmergencies((prev) => prev.map((item) => (item.id === editingId ? resp.data : item)));
        addToHistory?.("Urgence modifiée", `Urgence mise à jour`, currentUser);
      } else {
        const resp = await axios.post(
          `${API_BASE_URL}/appointments`,
          payload,
          { headers: { "Content-Type": "application/json", ...getTokenHeader() } }
        );
        setEmergencies((prev) => [resp.data, ...prev]);
        addToHistory?.("Urgence créée", `Nouvelle urgence`, currentUser);
      }
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error(editingId ? "Erreur mise à jour urgence" : "Erreur création urgence");
    }
  };

  const startEdit = (item) => {
    setForm({
      patientId: item.patient_id || item.patient?.id || "",
      severity: item.severity || "modere",
      motif: item.demande || "",
      date: item.date || new Date().toISOString().split("T")[0],
      time: item.time || new Date().toTimeString().slice(0, 5),
    });
    setEditingId(item.id);
  };

  const removeEmergency = async (id) => {
    if (!window.confirm("Supprimer cette urgence ?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/appointments/${id}`, { headers: getTokenHeader() });
      setEmergencies((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error(err);
      toast.error("Erreur suppression urgence");
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 p-4 sm:p-6">
      <h3 className="text-xl sm:text-2xl font-semibold text-gray-700 text-center mb-6 flex items-center justify-center gap-2">
        <AlertTriangle className="w-6 h-6 text-red-500" />
        Gestion des urgences
      </h3>

      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h4 className="font-semibold text-red-800 mb-3">{editingId ? "Modifier une urgence" : "Créer une urgence"}</h4>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            <select
              value={form.patientId}
              onChange={(e) => setForm((p) => ({ ...p, patientId: e.target.value }))}
              className="rounded-xl px-4 py-2 border border-red-200"
            >
              <option value="">Patient</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>{patient.username}</option>
              ))}
            </select>
            <select
              value={form.severity}
              onChange={(e) => setForm((p) => ({ ...p, severity: e.target.value }))}
              className="rounded-xl px-4 py-2 border border-red-200"
            >
              <option value="leger">Léger</option>
              <option value="modere">Modéré</option>
              <option value="critique">Critique</option>
            </select>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              className="rounded-xl px-4 py-2 border border-red-200"
            />
            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
              className="rounded-xl px-4 py-2 border border-red-200"
            />
            <input
              placeholder="Motif"
              value={form.motif}
              onChange={(e) => setForm((p) => ({ ...p, motif: e.target.value }))}
              className="rounded-xl px-4 py-2 border border-red-200"
            />
          </div>
          <div className="flex gap-2 mt-3">
            <Button onClick={addOrUpdateEmergency} className="bg-red-500 hover:bg-red-600 text-white">
              <Plus className="w-4 h-4 mr-2" />
              {editingId ? "Mettre à jour" : "Créer"}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={resetForm} className="border-red-200 text-red-700">
                Annuler
              </Button>
            )}
          </div>
        </div>

        {emergencies.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Aucune urgence actuellement.</p>
        ) : (
          <div className="space-y-3">
            {emergencies.map((emergency) => {
              const sev = emergency.severity || "modere";
              return (
                <div key={emergency.id} className={`p-4 rounded-xl border ${
                  sev === "critique" ? "bg-red-50 border-red-300" :
                  sev === "modere" ? "bg-orange-50 border-orange-300" :
                  "bg-yellow-50 border-yellow-300"
                }`}>
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <h5 className="font-semibold text-gray-800">
                        {emergency.patient?.username || emergency.patient_name || "Patient"}
                      </h5>
                      <p className="text-sm text-gray-600">{emergency.demande || emergency.motif}</p>
                      <p className="text-xs text-gray-500 mt-1">Sévérité: {sev}</p>
                      <p className="text-xs text-gray-500 mt-1">Date: {emergency.date} {emergency.time || ""}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="text-indigo-600" onClick={() => startEdit(emergency)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-600" onClick={() => removeEmergency(emergency.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminEmergency;
