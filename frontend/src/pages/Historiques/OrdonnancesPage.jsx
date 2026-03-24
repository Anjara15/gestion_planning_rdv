import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Download, Edit, FileText, Pill, Plus, Search, Send, Trash2 } from "lucide-react";

const EMPTY_MEDICATION = { name: "", dosage: "", frequency: "", duration: "" };
const _apiBaseRaw = import.meta.env.VITE_API_URL || "http://localhost:3000";
const _apiBase = String(_apiBaseRaw).replace(/\/+$/, "");
const API_BASE_URL = _apiBase.endsWith("/api") ? _apiBase : `${_apiBase}/api`;

const getTokenHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const fetchPrescriptionsFromApi = async () => {
  const resp = await axios.get(`${API_BASE_URL}/prescriptions`, { headers: getTokenHeader() });
  return resp.data;
};

const createPrescriptionApi = async (body) => {
  const resp = await axios.post(`${API_BASE_URL}/prescriptions`, body, {
    headers: { "Content-Type": "application/json", ...getTokenHeader() },
  });
  return resp.data;
};

const updatePrescriptionApi = async (id, body) => {
  const resp = await axios.put(`${API_BASE_URL}/prescriptions/${id}`, body, {
    headers: { "Content-Type": "application/json", ...getTokenHeader() },
  });
  return resp.data;
};

const deletePrescriptionApi = async (id) => {
  const resp = await axios.delete(`${API_BASE_URL}/prescriptions/${id}`, {
    headers: getTokenHeader(),
  });
  return resp.data;
};

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const normalizePrescription = (item, currentUser) => ({
  ...item,
  patientId: item?.patient_id || item?.patient?.id || "",
  patientName: item?.patientName || item?.patient?.username || "Patient",
  doctor: item?.doctor?.username || item?.doctor || currentUser?.username || "Médecin",
  medications: Array.isArray(item?.medications) ? item.medications : [],
  instructions: item?.instructions || "",
  date: item?.date || new Date().toISOString().split("T")[0],
});

const OrdonnancesPage = ({ currentUser, addToHistory, patients = [] }) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sendChannels, setSendChannels] = useState({});
  const [formData, setFormData] = useState({
    patientId: "",
    date: new Date().toISOString().split("T")[0],
    medications: [{ ...EMPTY_MEDICATION }],
    instructions: "",
  });

  useEffect(() => {
    fetchPrescriptionsFromApi()
      .then((data) => {
        setPrescriptions(
          Array.isArray(data) ? data.map((item) => normalizePrescription(item, currentUser)) : []
        );
      })
      .catch((err) => {
        console.error("Erreur chargement ordonnances:", err);
        toast.error("Erreur chargement ordonnances");
      });
  }, [currentUser]);

  const filteredPrescriptions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return prescriptions;

    return prescriptions.filter((item) =>
      [item.patientName, item.doctor, item.date].join(" ").toLowerCase().includes(query)
    );
  }, [prescriptions, searchTerm]);

  const resetForm = () => {
    setFormData({
      patientId: "",
      date: new Date().toISOString().split("T")[0],
      medications: [{ ...EMPTY_MEDICATION }],
      instructions: "",
    });
    setEditingPrescription(null);
    setShowForm(false);
  };

  const updateMedication = (index, field, value) => {
    setFormData((prev) => {
      const medications = [...prev.medications];
      medications[index] = { ...medications[index], [field]: value };
      return { ...prev, medications };
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
      medications: prev.medications.filter((_, medicationIndex) => medicationIndex !== index),
    }));
  };

  const savePrescription = async () => {
    if (!formData.patientId) {
      toast.error("Veuillez sélectionner un patient.");
      return;
    }

    const medications = formData.medications.filter((item) => item.name.trim() !== "");
    if (medications.length === 0 && !formData.instructions.trim()) {
      toast.error("Ajoutez au moins un médicament ou des instructions.");
      return;
    }

    const payload = {
      patient_id: formData.patientId,
      date: formData.date,
      medications,
      instructions: formData.instructions,
    };

    try {
      const saved = editingPrescription
        ? normalizePrescription(await updatePrescriptionApi(editingPrescription.id, payload), currentUser)
        : normalizePrescription(await createPrescriptionApi(payload), currentUser);

      setPrescriptions((prev) =>
        editingPrescription
          ? prev.map((item) => (item.id === saved.id ? saved : item))
          : [saved, ...prev]
      );

      toast.success(editingPrescription ? "Ordonnance mise à jour" : "Ordonnance enregistrée");
      await addToHistory?.(
        editingPrescription ? "Ordonnance modifiée" : "Ordonnance créée",
        `${editingPrescription ? "Mise à jour" : "Création"} ordonnance pour ${saved.patientName}`,
        currentUser
      );
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Erreur API ordonnance");
    }
  };

  const handleDelete = async (prescription) => {
    if (!window.confirm("Supprimer cette ordonnance ?")) return;
    try {
      await deletePrescriptionApi(prescription.id);
      setPrescriptions((prev) => prev.filter((item) => item.id !== prescription.id));
      toast.success("Ordonnance supprimée");
      await addToHistory?.("Ordonnance supprimée", `Suppression ordonnance pour ${prescription.patientName}`, currentUser);
    } catch (err) {
      console.error(err);
      toast.error("Erreur suppression ordonnance");
    }
  };

  const handleExportPdf = (prescription) => {
    const meds = prescription.medications
      .map(
        (medication, index) =>
          `<tr><td>${index + 1}</td><td>${escapeHtml(medication.name)}</td><td>${escapeHtml(
            medication.dosage
          )}</td><td>${escapeHtml(medication.frequency)}</td><td>${escapeHtml(medication.duration)}</td></tr>`
      )
      .join("");

    const printable = window.open("", "_blank", "width=900,height=700");
    if (!printable) {
      toast.error("Impossible d'ouvrir la fenêtre d'export PDF.");
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
          <h1>Ordonnance médicale</h1>
          <p><strong>Patient :</strong> ${escapeHtml(prescription.patientName)}</p>
          <p><strong>Médecin :</strong> ${escapeHtml(prescription.doctor)}</p>
          <p><strong>Date :</strong> ${escapeHtml(new Date(prescription.date).toLocaleDateString("fr-FR"))}</p>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Médicament</th>
                <th>Dosage</th>
                <th>Fréquence</th>
                <th>Durée</th>
              </tr>
            </thead>
            <tbody>
              ${meds || "<tr><td colspan='5'>Aucun médicament</td></tr>"}
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
    toast.success("Export PDF prêt");
  };

  const handleSend = async (prescription) => {
    const selectedChannel = sendChannels[prescription.id] || "messagerie";
    setPrescriptions((prev) =>
      prev.map((item) =>
        item.id === prescription.id
          ? { ...item, sentAt: new Date().toISOString(), sentVia: selectedChannel }
          : item
      )
    );
    await addToHistory?.(
      "Envoi ordonnance",
      `Ordonnance envoyée à ${prescription.patientName} via ${selectedChannel}`,
      currentUser
    );
    toast.success("Ordonnance envoyée");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">Ordonnances</h2>
          <p className="text-muted-foreground">Gestion des prescriptions reliées au backend</p>
        </div>
        <Button
          onClick={() => setShowForm((prev) => !prev)}
          className="rounded-xl bg-green-600 text-white hover:bg-green-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle ordonnance
        </Button>
      </div>

      {showForm && (
        <div className="space-y-6 rounded-2xl border border-border bg-white p-6">
          <h3 className="text-xl font-semibold text-primary">
            {editingPrescription ? "Modifier l'ordonnance" : "Créer une ordonnance"}
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>Patient *</Label>
              <select
                value={formData.patientId}
                onChange={(e) => setFormData((prev) => ({ ...prev, patientId: e.target.value }))}
                className="w-full rounded-xl border border-border px-4 py-3 focus:outline-none focus:ring-4 focus:ring-primary/20"
              >
                <option value="">Sélectionner un patient</option>
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
            <Label className="text-base font-semibold">Médicaments</Label>
            {formData.medications.map((medication, index) => (
              <div key={`medication-form-${index}`} className="grid grid-cols-1 gap-2 md:grid-cols-5 md:items-end">
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
                  placeholder="Fréquence"
                  className="rounded-xl"
                />
                <Input
                  value={medication.duration}
                  onChange={(e) => updateMedication(index, "duration", e.target.value)}
                  placeholder="Durée"
                  className="rounded-xl"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-red-200 text-red-700 hover:bg-red-50"
                  disabled={formData.medications.length === 1}
                  onClick={() => removeMedication(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" className="rounded-xl border-dashed" onClick={addMedication}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un médicament
            </Button>
          </div>

          <div>
            <Label>Instructions</Label>
            <Textarea
              value={formData.instructions}
              onChange={(e) => setFormData((prev) => ({ ...prev, instructions: e.target.value }))}
              rows={4}
              className="rounded-xl"
              placeholder="Conseils et précautions pour le patient"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" className="rounded-xl" onClick={resetForm}>
              Annuler
            </Button>
            <Button className="rounded-xl bg-green-600 text-white hover:bg-green-700" onClick={savePrescription}>
              Enregistrer
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4 rounded-2xl border border-border bg-white p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-xl font-semibold text-primary">Historique des ordonnances</h3>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="rounded-xl pl-10"
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
              <div key={item.id} className="space-y-3 rounded-xl border border-border bg-gray-50/60 p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h4 className="flex items-center gap-2 font-semibold text-foreground">
                      <FileText className="h-4 w-4 text-green-700" />
                      {item.patientName}
                    </h4>
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {new Date(item.date).toLocaleDateString("fr-FR")} • {item.doctor}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => handleExportPdf(item)}>
                      <Download className="mr-1 h-4 w-4" />
                      Export PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-indigo-600"
                      onClick={() => {
                        setEditingPrescription(item);
                        setFormData({
                          patientId: item.patientId,
                          date: item.date,
                          medications: item.medications.length > 0 ? item.medications : [{ ...EMPTY_MEDICATION }],
                          instructions: item.instructions,
                        });
                        setShowForm(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(item)}>
                      <Trash2 className="h-4 w-4" />
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
                    <Button size="sm" className="rounded-xl bg-blue-600 text-white hover:bg-blue-700" onClick={() => handleSend(item)}>
                      <Send className="mr-1 h-4 w-4" />
                      Envoyer
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {item.medications.length === 0 && <Badge variant="outline">Aucun médicament</Badge>}
                  {item.medications.map((medication, index) => (
                    <Badge key={`${item.id}-med-${index}`} variant="secondary" className="rounded-full">
                      <Pill className="mr-1 h-3 w-3" />
                      {medication.name || "Médicament"}
                    </Badge>
                  ))}
                </div>

                {item.instructions && <p className="text-sm text-muted-foreground">{item.instructions}</p>}
                {item.sentAt && (
                  <p className="text-xs text-emerald-700">
                    Envoyée le {new Date(item.sentAt).toLocaleString("fr-FR")} via {item.sentVia}
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
