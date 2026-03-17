import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const _apiBaseRaw = import.meta.env.VITE_API_URL || "http://localhost:3000";
const _apiBase = String(_apiBaseRaw).replace(/\/+$/, "");
const API_BASE_URL = _apiBase.endsWith("/api") ? _apiBase : `${_apiBase}/api`;

const getTokenHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function fetchMedicalRecords() {
  const resp = await axios.get(`${API_BASE_URL}/medical-records`, { headers: getTokenHeader() });
  return resp.data;
}

async function createMedicalRecord(body) {
  const resp = await axios.post(`${API_BASE_URL}/medical-records`, body, {
    headers: { "Content-Type": "application/json", ...getTokenHeader() },
  });
  return resp.data;
}

async function updateMedicalRecord(id, body) {
  const resp = await axios.put(`${API_BASE_URL}/medical-records/${id}`, body, {
    headers: { "Content-Type": "application/json", ...getTokenHeader() },
  });
  return resp.data;
}

async function deleteMedicalRecord(id) {
  await axios.delete(`${API_BASE_URL}/medical-records/${id}`, { headers: getTokenHeader() });
}

const AdminMedicalRecords = ({ addToHistory, currentUser, patients = [], medecins = [] }) => {
  const [records, setRecords] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState({
    patientId: "",
    doctorId: "",
    date: new Date().toISOString().split("T")[0],
    type: "consultation",
    title: "",
    description: "",
  });

  useEffect(() => {
    fetchMedicalRecords()
      .then((data) => setRecords(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("Erreur chargement dossiers médicaux:", err);
        toast.error("Erreur chargement dossiers médicaux");
      });
  }, []);

  const filtered = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return records;
    return records.filter((record) => {
      const bag = [
        record.title,
        record.type,
        record.patient?.username,
        record.doctor?.username,
        record.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return bag.includes(query);
    });
  }, [records, searchTerm]);

  const resetForm = () => {
    setForm({
      patientId: "",
      doctorId: "",
      date: new Date().toISOString().split("T")[0],
      type: "consultation",
      title: "",
      description: "",
    });
    setEditingId(null);
  };

  const saveRecord = async () => {
    if (!form.patientId || !form.title.trim()) return;
    const payload = {
      patient_id: form.patientId,
      doctor_id: form.doctorId || null,
      date: form.date,
      type: form.type,
      title: form.title,
      description: form.description,
    };
    try {
      if (editingId) {
        const updated = await updateMedicalRecord(editingId, payload);
        setRecords((prev) => prev.map((r) => (r.id === editingId ? updated : r)));
        addToHistory?.("Dossier médical", `Mise à jour dossier ${updated.title}`, currentUser);
      } else {
        const saved = await createMedicalRecord(payload);
        setRecords((prev) => [saved, ...prev]);
        addToHistory?.("Dossier médical", `Création dossier ${saved.title}`, currentUser);
      }
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error(editingId ? "Erreur mise à jour dossier" : "Erreur création dossier");
    }
  };

  const startEdit = (record) => {
    setForm({
      patientId: record.patient_id || record.patient?.id || "",
      doctorId: record.doctor_id || record.doctor?.id || "",
      date: record.date || new Date().toISOString().split("T")[0],
      type: record.type || "consultation",
      title: record.title || "",
      description: record.description || "",
    });
    setEditingId(record.id);
  };

  const removeRecord = async (id) => {
    if (!window.confirm("Supprimer ce dossier médical ?")) return;
    try {
      await deleteMedicalRecord(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
      toast.error("Erreur suppression dossier");
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 p-4 sm:p-6">
      <h3 className="text-xl sm:text-2xl font-semibold text-gray-700 text-center mb-6 flex items-center justify-center gap-2">
        <FileText className="w-6 h-6 text-blue-500" />
        Dossiers médicaux
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-6">
        <select
          value={form.patientId}
          onChange={(e) => setForm((p) => ({ ...p, patientId: e.target.value }))}
          className="rounded-xl border border-gray-200 px-3"
        >
          <option value="">Patient</option>
          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>{patient.username}</option>
          ))}
        </select>
        <select
          value={form.doctorId}
          onChange={(e) => setForm((p) => ({ ...p, doctorId: e.target.value }))}
          className="rounded-xl border border-gray-200 px-3"
        >
          <option value="">Médecin (optionnel)</option>
          {medecins.map((doc) => (
            <option key={doc.id} value={doc.id}>{doc.username}</option>
          ))}
        </select>
        <Input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
        <select
          value={form.type}
          onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
          className="rounded-xl border border-gray-200 px-3"
        >
          <option value="consultation">Consultation</option>
          <option value="prescription">Prescription</option>
          <option value="analyse">Analyse</option>
        </select>
        <Input placeholder="Titre" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
        <Button onClick={saveRecord} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> {editingId ? "Mettre à jour" : "Ajouter"}
        </Button>
      </div>
      <div className="mb-4">
        <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="min-h-[90px]" />
        {editingId && (
          <Button variant="outline" onClick={resetForm} className="mt-2 border-gray-200 text-gray-700">
            Annuler
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-4">
        <Input
          placeholder="Rechercher un dossier..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="space-y-3">
        {filtered.map((record) => (
          <div key={record.id} className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-700">{record.title}</p>
                <Badge className="bg-blue-100 text-blue-700">{record.type || "consultation"}</Badge>
              </div>
              <p className="text-sm text-gray-600">
                Patient: {record.patient?.username || record.patient_id}
              </p>
              <p className="text-sm text-gray-600">
                Médecin: {record.doctor?.username || record.doctor_id || "-"}
              </p>
              <p className="text-xs text-gray-500">{record.date ? new Date(record.date).toLocaleDateString("fr-FR") : "-"}</p>
              {record.description && <p className="text-sm text-gray-600 mt-1">{record.description}</p>}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" className="text-indigo-600" onClick={() => startEdit(record)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" className="text-red-600" onClick={() => removeRecord(record.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-gray-500 text-center py-6">Aucun dossier médical.</p>}
      </div>
    </div>
  );
};

export default AdminMedicalRecords;
