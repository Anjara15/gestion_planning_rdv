import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { FileText, Pill, Plus, Trash2, Download, Send, Search, Calendar, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

const STORAGE_KEY = "medecinPrescriptions"; // legacy fallback
const EMPTY_MEDICATION = { name: "", dosage: "", frequency: "", duration: "" };

import axios from "axios";
const _apiBaseRaw = import.meta.env.VITE_API_URL || "http://localhost:3000";
const _apiBase = String(_apiBaseRaw).replace(/\/+$/, "");
const API_BASE_URL = _apiBase.endsWith("/api") ? _apiBase : `${_apiBase}/api`;

const getTokenHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function fetchPrescriptionsFromApi() {
  const resp = await axios.get(`${API_BASE_URL}/prescriptions`, { headers: getTokenHeader() });
  return resp.data;
}

async function createPrescriptionApi(body) {
  const resp = await axios.post(`${API_BASE_URL}/prescriptions`, body, { headers: { "Content-Type": "application/json", ...getTokenHeader() } });
  return resp.data;
}

async function updatePrescriptionApi(id, body) {
  const resp = await axios.put(`${API_BASE_URL}/prescriptions/${id}`, body, { headers: { "Content-Type": "application/json", ...getTokenHeader() } });
  return resp.data;
}

async function deletePrescriptionApi(id) {
  const resp = await axios.delete(`${API_BASE_URL}/prescriptions/${id}`, { headers: getTokenHeader() });
  return resp.data;
}

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const OrdonnancesPage = ({ currentUser, addToHistory, patients = [] }) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sendChannels, setSendChannels] = useState({});
  const [formData, setFormData] = useState({
    patientId: "",
    patientName: "",
    date: new Date().toISOString().split("T")[0],
    medications: [{ ...EMPTY_MEDICATION }],
    instructions: "",
  });

  const normalizePrescription = (item) => {
    if (!item || typeof item !== "object") return item;
    const patientName =
      item.patientName ||
      item.patient_name ||
      item.patient?.username ||
      item.patient?.email ||
      "Patient";
    const doctorName =
      item.doctor ||
      item.doctorName ||
      item.doctor_name ||
      item.doctor?.username ||
      currentUser?.username ||
      "MÃ©decin";
    const medications = Array.isArray(item.medications) ? item.medications : [];
    return { ...item, patientName, doctor: doctorName, medications };
  };

  useEffect(() => {
    // load from API
    fetchPrescriptionsFromApi()
      .then((data) => {
        const items = Array.isArray(data) ? data : [];
        setPrescriptions(items.map(normalizePrescription));
      })
      .catch((err) => {
        console.error("Erreur chargement ordonnances:", err);
        toast.error("Erreur chargement ordonnances");
      });
  }, []);

  const filteredPrescriptions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return prescriptions;

    return prescriptions.filter((item) => {
      const bag = [item.patientName, item.doctor, item.date].join(" ").toLowerCase();
      return bag.includes(query);
    });
  }, [prescriptions, searchTerm]);

  const updateMedication = (index, field, value) => {
    setFormData((prev) => {
      const next = [...prev.medications];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, medications: next };
    });
  };

  const addMedication = () => {
    setFormData((prev) => ({
      ...prev,
      medications: [...prev.medications, { ...EMPTY_MEDICATION }],
    }));
  };

  const removeMedication = (index) => {
    setFormData((prev) => ({
      ...prev,
      medications: prev.medications.filter((_, medIndex) => medIndex !== index),
    }));
  };

  const resetForm = () => {
    setFormData({
      patientId: "",
      patientName: "",
      date: new Date().toISOString().split("T")[0],
      medications: [{ ...EMPTY_MEDICATION }],
      instructions: "",
    });
    setEditingPrescription(null);
    setShowForm(false);
  };

  const savePrescription = async () => {
    if (!formData.patientId) {
      toast.error("Veuillez sélectionner un patient.");
      return;
    }

    const validMedications = formData.medications.filter((med) => med.name.trim() !== "");
    if (validMedications.length === 0 && !formData.instructions.trim()) {
      toast.error("Ajoutez au moins un médicament ou des instructions.");
      return;
    }

    const body = {
      patient_id: formData.patientId,
      date: formData.date,
      medications: validMedications,
      instructions: formData.instructions,
    };

    try {
      let saved;
      if (editingPrescription) {
        saved = await updatePrescriptionApi(editingPrescription.id, body);
        const normalized = normalizePrescription(saved);
        setPrescriptions((prev) => prev.map((p) => (p.id === normalized.id ? normalized : p)));
        toast.success("Ordonnance mise à jour", { description: normalized.patientName });
      } else {
        saved = await createPrescriptionApi(body);
        const normalized = normalizePrescription(saved);
        setPrescriptions((prev) => [normalized, ...prev]);
        toast.success("Ordonnance enregistrée", { description: normalized.patientName });
      }
      addToHistory?.(
        editingPrescription ? "Ordonnance modifiée" : "Ordonnance",
        `${editingPrescription ? 'Modification' : 'Création'} ordonnance pour ${saved.patientName}`,
        currentUser
      );
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error("Erreur API");
    }
  };

  const handleExportPdf = (prescription) => {
    const meds = prescription.medications
      .map(
        (med, idx) =>
          `<tr><td>${idx + 1}</td><td>${escapeHtml(med.name)}</td><td>${escapeHtml(med.dosage)}</td><td>${escapeHtml(med.frequency)}</td><td>${escapeHtml(med.duration)}</td></tr>`
      )
      .join("");

    const printable = window.open("", "_blank", "width=900,height=700");
    if (!printable) {
      toast.error("Impossible d'ouvrir la fenï¿½tre d'export PDF.");
      return;
    }

    printable.document.write(`
      <html>
        <head>
          <title>Ordonnance ${escapeHtml(prescription.patientName)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
            h1 { margin-bottom: 4px; }
            p { margin: 6px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 13px; }
            th { background: #f8fafc; }
            .box { margin-top: 16px; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; }
          </style>
        </head>
        <body>
          <h1>Ordonnance mï¿½dicale</h1>
          <p><strong>Patient :</strong> ${escapeHtml(prescription.patientName)}</p>
          <p><strong>Mï¿½decin :</strong> ${escapeHtml(prescription.doctor)}</p>
          <p><strong>Date :</strong> ${escapeHtml(new Date(prescription.date).toLocaleDateString("fr-FR"))}</p>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Mï¿½dicament</th>
                <th>Dosage</th>
                <th>Frï¿½quence</th>
                <th>Durï¿½e</th>
              </tr>
            </thead>
            <tbody>
              ${meds || "<tr><td colspan='5'>Aucun mï¿½dicament</td></tr>"}
            </tbody>
          </table>
          <div class="box">
            <strong>Instructions</strong>
            <p>${escapeHtml(prescription.instructions || "Aucune instruction.")}</p>
          </div>
        </body>
      </html>
    `);

    printable.document.close();
    printable.focus();
    setTimeout(() => printable.print(), 300);

    addToHistory?.("Export PDF", `Export ordonnance PDF pour ${prescription.patientName}`, currentUser);
    toast.success("Export PDF prï¿½t", { description: "Sï¿½lectionnez 'Enregistrer en PDF' dans la fenï¿½tre d'impression." });
  };

  const handleSend = (prescription) => {
    const selectedChannel = sendChannels[prescription.id] || "messagerie";

    setPrescriptions((prev) =>
      prev.map((item) =>
        item.id === prescription.id
          ? {
              ...item,
              sentAt: new Date().toISOString(),
              sentVia: selectedChannel,
            }
          : item
      )
    );

    addToHistory?.(
      "Envoi ordonnance",
      `Ordonnance envoyï¿½e ï¿½ ${prescription.patientName} via ${selectedChannel}`,
      currentUser
    );
    toast.success("Ordonnance envoyï¿½e", { description: `${prescription.patientName} via ${selectedChannel}` });
  };

  const handlePatientSelect = (patientId) => {
    const patient = patients.find((item) => String(item.id) === String(patientId));
    setFormData((prev) => ({
      ...prev,
      patientId,
      patientName: patient?.username || "",
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">Ordonnances</h2>
          <p className="text-muted-foreground">Gestion sï¿½parï¿½e des prescriptions</p>
        </div>
        <Button
          onClick={() => setShowForm((prev) => !prev)}
          className="bg-green-600 hover:bg-green-700 text-white rounded-xl"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle ordonnance
        </Button>
      </div>

      {showForm && (
        <div className="bg-white border border-border rounded-2xl p-6 space-y-6">
          <h3 className="text-xl font-semibold text-primary">Crï¿½er une ordonnance</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Patient *</Label>
              <select
                value={formData.patientId}
                onChange={(e) => handlePatientSelect(e.target.value)}
                className="w-full rounded-xl px-4 py-3 border border-border focus:ring-4 focus:ring-primary/20 focus:outline-none"
              >
                <option value="">Sï¿½lectionner un patient</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.username}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">Mï¿½dicaments</Label>
            {formData.medications.map((medication, index) => (
              <div key={`${index}-${medication.name}`} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
                <Input
                  value={medication.name}
                  onChange={(e) => updateMedication(index, "name", e.target.value)}
                  placeholder="Nom"
                  className="rounded-xl"
                />
                <Input
                  value={medication.dosage}
                  onChange={(e) => updateMedication(index, "dosage", e.target.value)}
                  placeholder="Dosage"
                  className="rounded-xl"
                />
                <Input
                  value={medication.frequency}
                  onChange={(e) => updateMedication(index, "frequency", e.target.value)}
                  placeholder="Frï¿½quence"
                  className="rounded-xl"
                />
                <Input
                  value={medication.duration}
                  onChange={(e) => updateMedication(index, "duration", e.target.value)}
                  placeholder="Durï¿½e"
                  className="rounded-xl"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-red-200 text-red-700 hover:bg-red-50"
                  disabled={formData.medications.length === 1}
                  onClick={() => removeMedication(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" className="rounded-xl border-dashed" onClick={addMedication}>
              <Plus className="w-4 h-4 mr-2" /> Ajouter un mï¿½dicament
            </Button>
          </div>

          <div>
            <Label>Instructions</Label>
            <Textarea
              value={formData.instructions}
              onChange={(e) => setFormData((prev) => ({ ...prev, instructions: e.target.value }))}
              rows={4}
              className="rounded-xl"
              placeholder="Conseils et prï¿½cautions pour le patient"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" className="rounded-xl" onClick={resetForm}>
              Annuler
            </Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white rounded-xl" onClick={savePrescription}>
              Enregistrer
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white border border-border rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <h3 className="text-xl font-semibold text-primary">Historique des ordonnances</h3>
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10 rounded-xl"
              placeholder="Rechercher un patient"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {filteredPrescriptions.length === 0 ? (
          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-700">Aucune ordonnance disponible.</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {filteredPrescriptions.map((item) => (
              <div key={item.id} className="border border-border rounded-xl p-4 space-y-3 bg-gray-50/60">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <FileText className="w-4 h-4 text-green-700" />
                      {item.patientName}
                    </h4>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(item.date).toLocaleDateString("fr-FR")} ï¿½ {item.doctor}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => handleExportPdf(item)}
                    >
                      <Download className="w-4 h-4 mr-1" /> Export PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-indigo-600"
                      onClick={() => {
                        // load values into form for editing
                        setEditingPrescription(item);
                        setFormData({
                          patientId: item.patient_id || item.patientId || item.patient?.id || "",
                          patientName: item.patient?.username || item.patientName || "",
                          date: item.date || "",
                          medications: Array.isArray(item.medications) && item.medications.length > 0 ? item.medications : [{ ...EMPTY_MEDICATION }],
                          instructions: item.instructions || "",
                        });
                        setShowForm(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600"
                      onClick={async () => {
                        if (!window.confirm('Supprimer cette ordonnance ?')) return;
                        try {
                          await deletePrescriptionApi(item.id);
                          setPrescriptions((prev) => prev.filter((p) => p.id !== item.id));
                          toast.success('Ordonnance supprimÃ©e');
                        } catch (err) {
                          console.error(err);
                          toast.error('Erreur suppression');
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <select
                      value={sendChannels[item.id] || "messagerie"}
                      onChange={(e) => setSendChannels((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      className="rounded-xl border border-border bg-white px-3 py-1.5 text-sm"
                    >
                      <option value="messagerie">Messagerie</option>
                      <option value="email">Email</option>
                      <option value="sms">SMS</option>
                    </select>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl" onClick={() => handleSend(item)}>
                      <Send className="w-4 h-4 mr-1" /> Envoyer
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {item.medications.length === 0 && <Badge variant="outline">Aucun mï¿½dicament</Badge>}
                  {item.medications.map((med, medIndex) => (
                    <Badge key={`${item.id}-med-${medIndex}`} variant="secondary" className="rounded-full">
                      <Pill className="w-3 h-3 mr-1" /> {med.name || "Mï¿½dicament"}
                    </Badge>
                  ))}
                </div>

                {item.instructions && <p className="text-sm text-muted-foreground">{item.instructions}</p>}

                {item.sentAt && (
                  <p className="text-xs text-emerald-700">
                    Envoyï¿½e le {new Date(item.sentAt).toLocaleString("fr-FR")} via {item.sentVia}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdonnancesPage;

