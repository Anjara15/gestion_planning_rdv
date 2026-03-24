import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  Edit,
  FileText,
  Pill,
  Plus,
  Save,
  Search,
  Stethoscope,
  Trash2,
  User,
  X,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const _apiBaseRaw = import.meta.env.VITE_API_URL || "http://localhost:3000";
const _apiBase = String(_apiBaseRaw).replace(/\/+$/, "");
const API_BASE_URL = _apiBase.endsWith("/api") ? _apiBase : `${_apiBase}/api`;

const getTokenHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const fetchConsultationsFromApi = async () => {
  const resp = await axios.get(`${API_BASE_URL}/consultations`, {
    headers: getTokenHeader(),
  });
  return resp.data;
};

const createConsultationApi = async (body) => {
  const resp = await axios.post(`${API_BASE_URL}/consultations`, body, {
    headers: { "Content-Type": "application/json", ...getTokenHeader() },
  });
  return resp.data;
};

const updateConsultationApi = async (id, body) => {
  const resp = await axios.put(`${API_BASE_URL}/consultations/${id}`, body, {
    headers: { "Content-Type": "application/json", ...getTokenHeader() },
  });
  return resp.data;
};

const deleteConsultationApi = async (id) => {
  const resp = await axios.delete(`${API_BASE_URL}/consultations/${id}`, {
    headers: getTokenHeader(),
  });
  return resp.data;
};

const EMPTY_FORM = {
  patientId: "",
  date: new Date().toISOString().split("T")[0],
  time: new Date().toTimeString().slice(0, 5),
  symptoms: [],
  examination: "",
  diagnosis: "",
  treatment: "",
  recommendations: [],
  followUp: "",
  medications: [],
};

const normalizeConsultation = (item, patients = []) => {
  const fallbackPatient =
    patients.find((patient) => String(patient.id) === String(item?.patient_id || item?.patientId)) || null;

  return {
    ...item,
    patient_id: item?.patient_id || item?.patientId || fallbackPatient?.id || "",
    patientName: item?.patientName || item?.patient?.username || fallbackPatient?.username || "Patient",
    date: item?.date || "",
    time: item?.time || "",
    symptoms: Array.isArray(item?.symptoms) ? item.symptoms : [],
    examination: item?.examination || "",
    diagnosis: item?.diagnosis || "",
    treatment: item?.treatment || "",
    recommendations: Array.isArray(item?.recommendations) ? item.recommendations : [],
    followUp: item?.followUp || item?.follow_up || "",
    medications: Array.isArray(item?.medications) ? item.medications : [],
  };
};

const ConsultationCard = ({ consultation, onEdit, onDelete }) => {
  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const diagnosisColor = (() => {
    const diagnosis = String(consultation.diagnosis || "").toLowerCase();
    if (diagnosis.includes("urgent") || diagnosis.includes("grave")) {
      return "border-red-200 bg-red-50 text-red-800";
    }
    if (diagnosis.includes("suivi") || diagnosis.includes("contrôle")) {
      return "border-blue-200 bg-blue-50 text-blue-800";
    }
    return "border-green-200 bg-green-50 text-green-800";
  })();

  return (
    <div className="rounded-xl border border-border bg-gradient-to-r from-white to-gray-50/30 p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-600 text-lg font-semibold text-white">
            {consultation.patientName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h4 className="text-lg font-bold text-foreground">{consultation.patientName}</h4>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(consultation.date)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{consultation.time || "Non spécifiée"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="text-indigo-600" onClick={() => onEdit(consultation)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="text-red-600" onClick={() => onDelete(consultation)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${diagnosisColor}`}>
          <Stethoscope className="mr-1 inline h-4 w-4" />
          {consultation.diagnosis}
        </div>

        {consultation.symptoms.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {consultation.symptoms.map((symptom, index) => (
              <Badge key={`${consultation.id}-symptom-${index}`} variant="secondary" className="rounded-full text-xs">
                {symptom}
              </Badge>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <h5 className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                <FileText className="h-4 w-4 text-teal-600" />
                Examen clinique
              </h5>
              <p className="rounded-lg bg-gray-50 p-3 text-sm text-muted-foreground">
                {consultation.examination || "Non renseigné"}
              </p>
            </div>

            {consultation.treatment && (
              <div>
                <h5 className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                  <Pill className="h-4 w-4 text-blue-600" />
                  Traitement
                </h5>
                <p className="rounded-lg bg-blue-50 p-3 text-sm text-muted-foreground">
                  {consultation.treatment}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {consultation.recommendations.length > 0 && (
              <div>
                <h5 className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                  <User className="h-4 w-4 text-purple-600" />
                  Recommandations
                </h5>
                <div className="space-y-2">
                  {consultation.recommendations.map((recommendation, index) => (
                    <div
                      key={`${consultation.id}-recommendation-${index}`}
                      className="rounded-lg bg-purple-50 p-2 text-sm text-muted-foreground"
                    >
                      {recommendation}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {consultation.followUp && (
              <div>
                <h5 className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                  <Calendar className="h-4 w-4 text-orange-600" />
                  Suivi recommandé
                </h5>
                <p className="rounded-lg bg-orange-50 p-3 text-sm text-muted-foreground">
                  {consultation.followUp}
                </p>
              </div>
            )}
          </div>
        </div>

        {consultation.medications.length > 0 && (
          <div>
            <h5 className="mb-2 flex items-center gap-2 font-semibold text-foreground">
              <Pill className="h-4 w-4 text-green-600" />
              Médicaments prescrits
            </h5>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {consultation.medications.map((medication, index) => (
                <div
                  key={`${consultation.id}-medication-${index}`}
                  className="rounded-lg border border-green-200 bg-green-50 p-3"
                >
                  <div className="font-medium text-green-800">{medication.name || "Médicament"}</div>
                  <div className="mt-1 text-sm text-green-700">
                    {[medication.dosage, medication.frequency, medication.duration].filter(Boolean).join(" • ")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const EnhancedConsultationsPage = ({ currentUser, addToHistory, patients = [] }) => {
  const [consultations, setConsultations] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingConsultation, setEditingConsultation] = useState(null);
  const [currentSymptom, setCurrentSymptom] = useState("");
  const [currentRecommendation, setCurrentRecommendation] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [formData, setFormData] = useState(EMPTY_FORM);

  const loadConsultations = useCallback(async () => {
    try {
      const data = await fetchConsultationsFromApi();
      setConsultations(Array.isArray(data) ? data.map((item) => normalizeConsultation(item, patients)) : []);
    } catch (err) {
      console.error("Erreur chargement consultations:", err);
      toast.error("Erreur chargement consultations");
    }
  }, [patients]);

  useEffect(() => {
    loadConsultations();
  }, [loadConsultations]);

  const filteredConsultations = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return consultations;

    return consultations.filter((consultation) => {
      const bag = [
        consultation.patientName,
        consultation.diagnosis,
        consultation.examination,
        ...consultation.symptoms,
      ]
        .join(" ")
        .toLowerCase();
      return bag.includes(query);
    });
  }, [consultations, searchTerm]);

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditingConsultation(null);
    setCurrentSymptom("");
    setCurrentRecommendation("");
    setShowForm(false);
  };

  const handleEdit = (consultation) => {
    setEditingConsultation(consultation);
    setFormData({
      patientId: consultation.patient_id,
      date: consultation.date,
      time: consultation.time,
      symptoms: consultation.symptoms,
      examination: consultation.examination,
      diagnosis: consultation.diagnosis,
      treatment: consultation.treatment,
      recommendations: consultation.recommendations,
      followUp: consultation.followUp,
      medications: consultation.medications,
    });
    setShowForm(true);
  };

  const handleDelete = async (consultation) => {
    if (!window.confirm("Supprimer cette consultation ?")) return;
    try {
      await deleteConsultationApi(consultation.id);
      setConsultations((prev) => prev.filter((item) => item.id !== consultation.id));
      toast.success("Consultation supprimée");
      await addToHistory?.("Consultation supprimée", `Suppression de la consultation de ${consultation.patientName}`, currentUser);
    } catch (err) {
      console.error(err);
      toast.error("Erreur suppression consultation");
    }
  };

  const handleFormSubmit = async () => {
    if (!formData.patientId || !formData.examination.trim() || !formData.diagnosis.trim()) {
      toast.error("Patient, examen et diagnostic sont obligatoires.");
      return;
    }

    const payload = {
      patient_id: formData.patientId,
      date: formData.date,
      time: formData.time,
      symptoms: formData.symptoms,
      examination: formData.examination,
      diagnosis: formData.diagnosis,
      treatment: formData.treatment,
      recommendations: formData.recommendations,
      follow_up: formData.followUp,
      medications: formData.medications,
    };

    try {
      const saved = editingConsultation
        ? normalizeConsultation(await updateConsultationApi(editingConsultation.id, payload), patients)
        : normalizeConsultation(await createConsultationApi(payload), patients);

      setConsultations((prev) =>
        editingConsultation
          ? prev.map((item) => (item.id === saved.id ? saved : item))
          : [saved, ...prev]
      );

      setSuccessMessage(
        editingConsultation
          ? "Consultation mise à jour avec succès."
          : "Consultation enregistrée avec succès."
      );
      toast.success(editingConsultation ? "Consultation mise à jour" : "Consultation enregistrée");
      await addToHistory?.(
        editingConsultation ? "Consultation modifiée" : "Nouvelle consultation",
        `${editingConsultation ? "Mise à jour" : "Création"} consultation pour ${saved.patientName}`,
        currentUser
      );
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Erreur API consultation");
    }
  };

  const addSymptom = () => {
    const value = currentSymptom.trim();
    if (!value) return;
    setFormData((prev) => ({ ...prev, symptoms: [...prev.symptoms, value] }));
    setCurrentSymptom("");
  };

  const removeSymptom = (index) => {
    setFormData((prev) => ({
      ...prev,
      symptoms: prev.symptoms.filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  const addRecommendation = () => {
    const value = currentRecommendation.trim();
    if (!value) return;
    setFormData((prev) => ({ ...prev, recommendations: [...prev.recommendations, value] }));
    setCurrentRecommendation("");
  };

  const removeRecommendation = (index) => {
    setFormData((prev) => ({
      ...prev,
      recommendations: prev.recommendations.filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  const handlePatientSelect = (patientId) => {
    setFormData((prev) => ({ ...prev, patientId }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">Consultations</h2>
          <p className="text-muted-foreground">Gérer les notes de consultation</p>
        </div>
        <Button
          onClick={() => {
            if (showForm && !editingConsultation) {
              resetForm();
            } else {
              setShowForm((prev) => !prev);
            }
          }}
          className="rounded-xl bg-teal-600 text-white hover:bg-teal-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle consultation
        </Button>
      </div>

      {successMessage && (
        <Alert className="border-green-300 bg-green-50">
          <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
        </Alert>
      )}

      {showForm && (
        <div className="space-y-6 rounded-2xl border border-border bg-white p-6">
          <h3 className="text-xl font-semibold text-primary">
            {editingConsultation ? "Modifier la consultation" : "Nouvelle note de consultation"}
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label>Patient *</Label>
              <select
                value={formData.patientId}
                onChange={(e) => handlePatientSelect(e.target.value)}
                className="w-full rounded-xl border border-border px-4 py-3 focus:outline-none focus:ring-4 focus:ring-primary/20"
              >
                <option value="">Sélectionner un patient</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.username} ({patient.age} ans)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Date *</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div>
              <Label>Heure *</Label>
              <Input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData((prev) => ({ ...prev, time: e.target.value }))}
                className="rounded-xl"
              />
            </div>
          </div>

          <div>
            <Label>Symptômes</Label>
            <div className="mt-2 flex gap-2">
              <Input
                value={currentSymptom}
                onChange={(e) => setCurrentSymptom(e.target.value)}
                placeholder="Ajouter un symptôme"
                className="rounded-xl"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSymptom();
                  }
                }}
              />
              <Button onClick={addSymptom} variant="outline" className="rounded-xl">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {formData.symptoms.map((symptom, index) => (
                <Badge key={`symptom-${index}`} variant="secondary" className="rounded-xl">
                  {symptom}
                  <button
                    type="button"
                    onClick={() => removeSymptom(index)}
                    className="ml-2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label>Examen clinique *</Label>
            <Textarea
              value={formData.examination}
              onChange={(e) => setFormData((prev) => ({ ...prev, examination: e.target.value }))}
              placeholder="Décrire l'examen clinique..."
              rows={4}
              className="rounded-xl"
            />
          </div>

          <div>
            <Label>Diagnostic *</Label>
            <Textarea
              value={formData.diagnosis}
              onChange={(e) => setFormData((prev) => ({ ...prev, diagnosis: e.target.value }))}
              placeholder="Diagnostic médical..."
              rows={3}
              className="rounded-xl"
            />
          </div>

          <div>
            <Label>Traitement proposé</Label>
            <Textarea
              value={formData.treatment}
              onChange={(e) => setFormData((prev) => ({ ...prev, treatment: e.target.value }))}
              placeholder="Traitement recommandé..."
              rows={3}
              className="rounded-xl"
            />
          </div>

          <div>
            <Label>Recommandations</Label>
            <div className="mt-2 flex gap-2">
              <Input
                value={currentRecommendation}
                onChange={(e) => setCurrentRecommendation(e.target.value)}
                placeholder="Ajouter une recommandation"
                className="rounded-xl"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addRecommendation();
                  }
                }}
              />
              <Button onClick={addRecommendation} variant="outline" className="rounded-xl">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {formData.recommendations.map((recommendation, index) => (
                <Badge key={`recommendation-${index}`} variant="outline" className="rounded-xl">
                  {recommendation}
                  <button
                    type="button"
                    onClick={() => removeRecommendation(index)}
                    className="ml-2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label>Suivi recommandé</Label>
            <Input
              value={formData.followUp}
              onChange={(e) => setFormData((prev) => ({ ...prev, followUp: e.target.value }))}
              placeholder="Délai pour le prochain rendez-vous..."
              className="rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={resetForm} className="rounded-xl">
              Annuler
            </Button>
            <Button
              onClick={handleFormSubmit}
              disabled={!formData.patientId || !formData.examination || !formData.diagnosis}
              className="rounded-xl bg-teal-600 text-white hover:bg-teal-700"
            >
              <Save className="mr-2 h-4 w-4" />
              Enregistrer
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-xl font-bold text-primary">Historique des consultations</h3>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par patient ou diagnostic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-xl pl-10"
            />
          </div>
        </div>

        {filteredConsultations.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
              <FileText className="h-10 w-10 text-gray-400" />
            </div>
            <h4 className="mb-2 text-lg font-semibold text-gray-600">
              {searchTerm ? "Aucun résultat trouvé" : "Aucune consultation enregistrée"}
            </h4>
            <p className="text-gray-500">
              {searchTerm ? "Essayez de modifier vos critères de recherche." : "Commencez par créer votre première consultation."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredConsultations.map((consultation) => (
              <ConsultationCard
                key={consultation.id}
                consultation={consultation}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedConsultationsPage;
