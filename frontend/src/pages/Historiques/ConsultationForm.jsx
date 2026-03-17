import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Calendar, User, FileText, Save, Pill, Plus, X, Stethoscope, Clock, Search, Filter, Eye, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

import axios from "axios";

const _apiBaseRaw = import.meta.env.VITE_API_URL || "http://localhost:3000";
const _apiBase = String(_apiBaseRaw).replace(/\/+$/, "");
const API_BASE_URL = _apiBase.endsWith("/api") ? _apiBase : `${_apiBase}/api`;

const getTokenHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function fetchConsultationsFromApi(patientId) {
  const params = {};
  if (patientId) params.patient_id = patientId;
  const resp = await axios.get(`${API_BASE_URL}/consultations`, { params, headers: getTokenHeader() });
  return resp.data;
}

async function createConsultationApi(body) {
  const resp = await axios.post(`${API_BASE_URL}/consultations`, body, { headers: { "Content-Type": "application/json", ...getTokenHeader() } });
  return resp.data;
}

async function updateConsultationApi(id, body) {
  const resp = await axios.put(`${API_BASE_URL}/consultations/${id}`, body, { headers: { "Content-Type": "application/json", ...getTokenHeader() } });
  return resp.data;
}

async function deleteConsultationApi(id) {
  const resp = await axios.delete(`${API_BASE_URL}/consultations/${id}`, { headers: getTokenHeader() });
  return resp.data;
}

const ConsultationCard = ({ consultation }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr) => {
    return timeStr || 'Non spécifiée';
  };

  const getDiagnosisColor = (diagnosis) => {
    if (diagnosis.toLowerCase().includes('urgent') || diagnosis.toLowerCase().includes('grave')) {
      return 'border-red-200 bg-red-50 text-red-800';
    }
    if (diagnosis.toLowerCase().includes('suivi') || diagnosis.toLowerCase().includes('contrôle')) {
      return 'border-blue-200 bg-blue-50 text-blue-800';
    }
    return 'border-green-200 bg-green-50 text-green-800';
  };

  return (
    <div className="border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-200 bg-gradient-to-r from-white to-gray-50/30">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
            {consultation.patientName?.charAt(0)?.toUpperCase() || 'P'}
          </div>
          <div>
            <h4 className="font-bold text-lg text-foreground">{consultation.patientName}</h4>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(consultation.date)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatTime(consultation.time)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* edit/delete actions could be wired up by parent via context or callbacks; placeholder icons for now */}
          <Button
            size="sm"
            variant="ghost"
            className="text-indigo-600"
            onClick={() => {
              // event will bubble; parent component does not currently have handler; we will use a custom event to signal
              const evt = new CustomEvent('editConsultation', { detail: consultation });
              window.dispatchEvent(evt);
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-600"
            onClick={async () => {
              if (!window.confirm('Supprimer cette consultation ?')) return;
              try {
                await deleteConsultationApi(consultation.id);
                const evt = new CustomEvent('deletedConsultation', { detail: consultation.id });
                window.dispatchEvent(evt);
              } catch (err) {
                console.error(err);
                toast.error('Erreur suppression');
              }
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded-xl"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Diagnostic - Toujours visible */}
        <div>
          <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getDiagnosisColor(consultation.diagnosis)}`}>
            <Stethoscope className="w-4 h-4 inline mr-1" />
            {consultation.diagnosis}
          </div>
        </div>

        {/* Symptômes - Toujours visibles si présents */}
        {consultation.symptoms && consultation.symptoms.length > 0 && (
          <div>
            <div className="flex flex-wrap gap-2">
              {consultation.symptoms.slice(0, 3).map((symptom, index) => (
                <Badge key={index} variant="secondary" className="rounded-full text-xs">
                  {symptom}
                </Badge>
              ))}
              {consultation.symptoms.length > 3 && !isExpanded && (
                <Badge variant="outline" className="rounded-full text-xs text-muted-foreground">
                  +{consultation.symptoms.length - 3} autres
                </Badge>
              )}
              {isExpanded && consultation.symptoms.slice(3).map((symptom, index) => (
                <Badge key={index + 3} variant="secondary" className="rounded-full text-xs">
                  {symptom}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Détails étendus */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h5 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-600" />
                    Examen clinique
                  </h5>
                  <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg leading-relaxed">
                    {consultation.examination}
                  </p>
                </div>

                {consultation.treatment && (
                  <div>
                    <h5 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Pill className="w-4 h-4 text-blue-600" />
                      Traitement
                    </h5>
                    <p className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg leading-relaxed">
                      {consultation.treatment}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {consultation.recommendations && consultation.recommendations.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <User className="w-4 h-4 text-purple-600" />
                      Recommandations
                    </h5>
                    <div className="space-y-2">
                      {consultation.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm text-muted-foreground bg-purple-50 p-2 rounded-lg">
                          <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="leading-relaxed">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {consultation.followUp && (
                  <div>
                    <h5 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-orange-600" />
                      Suivi recommandé
                    </h5>
                    <p className="text-sm text-muted-foreground bg-orange-50 p-3 rounded-lg">
                      {consultation.followUp}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {consultation.medications && consultation.medications.length > 0 && (
              <div>
                <h5 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Pill className="w-4 h-4 text-green-600" />
                  Médicaments prescrits
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {consultation.medications.map((med, index) => (
                    <div key={index} className="bg-green-50 border border-green-200 p-3 rounded-lg">
                      <div className="font-medium text-green-800">{med.name}</div>
                      <div className="text-sm text-green-600 mt-1">
                        {med.dosage} • {med.frequency} • {med.duration}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const EnhancedConsultationsPage = ({ currentUser, addToHistory, patients }) => {
  const [consultations, setConsultations] = useState([]);
  const [filteredConsultations, setFilteredConsultations] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingConsultation, setEditingConsultation] = useState(null);
  const [currentSymptom, setCurrentSymptom] = useState("");
  const [currentRecommendation, setCurrentRecommendation] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  // Filtres et recherche
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("desc"); // "desc" pour le plus récent en premier

  const [formData, setFormData] = useState({
    patientId: "",
    patientName: "",
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().slice(0, 5),
    symptoms: [],
    examination: "",
    diagnosis: "",
    treatment: "",
    recommendations: [],
    followUp: "",
    medications: [],
  });

  const loadConsultations = useCallback(async () => {
    try {
      const data = await fetchConsultationsFromApi();
      setConsultations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erreur chargement consultations:", err);
    }
  }, [currentUser]);

  // listen for edit/delete events from ConsultationCard
  useEffect(() => {
    const onEdit = (e) => {
      const item = e.detail;
      setEditingConsultation(item);
      setFormData({
        patientId: item.patient_id || item.patientId || item.patient?.id || "",
        patientName: item.patient?.username || item.patientName || "",
        date: item.date || "",
        time: item.time || "",
        symptoms: item.symptoms || [],
        examination: item.examination || "",
        diagnosis: item.diagnosis || "",
        treatment: item.treatment || "",
        recommendations: item.recommendations || [],
        followUp: item.follow_up || item.followUp || "",
        medications: item.medications || [],
      });
      setShowForm(true);
    };
    const onDeleted = (e) => {
      const id = e.detail;
      setConsultations((prev) => prev.filter((c) => c.id !== id));
    };
    window.addEventListener('editConsultation', onEdit);
    window.addEventListener('deletedConsultation', onDeleted);
    return () => {
      window.removeEventListener('editConsultation', onEdit);
      window.removeEventListener('deletedConsultation', onDeleted);
    };
  }, []);

  useEffect(() => {
    loadConsultations();
  }, [loadConsultations]);

  // Filtrage et tri des consultations
  useEffect(() => {
    let filtered = [...consultations];

    // Recherche par nom de patient ou diagnostic
    if (searchTerm) {
      filtered = filtered.filter(consultation => 
        consultation.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        consultation.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
        consultation.symptoms.some(symptom => 
          symptom.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Filtre par date
    if (dateFilter) {
      filtered = filtered.filter(consultation => consultation.date === dateFilter);
    }

    // Tri par date
    filtered.sort((a, b) => {
      const dateA = new Date(a.date + ' ' + (a.time || '00:00'));
      const dateB = new Date(b.date + ' ' + (b.time || '00:00'));
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    setFilteredConsultations(filtered);
  }, [consultations, searchTerm, dateFilter, sortOrder]);

  const handleFormSubmit = async () => {
    if (!formData.patientId || !formData.examination || !formData.diagnosis) {
      toast.error("Champs requis manquants", { description: "Patient, examen et diagnostic sont obligatoires." });
      return;
    }

    const body = {
      patient_id: formData.patientId,
      date: formData.date || "",
      time: formData.time || "",
      symptoms: formData.symptoms || [],
      examination: formData.examination || "",
      diagnosis: formData.diagnosis || "",
      treatment: formData.treatment || "",
      recommendations: formData.recommendations || [],
      follow_up: formData.followUp || "",
      medications: formData.medications || [],
    };

    try {
      let saved;
      if (editingConsultation) {
        saved = await updateConsultationApi(editingConsultation.id, body);
        setConsultations((prev) => prev.map((c) => (c.id === saved.id ? saved : c)));
      } else {
        saved = await createConsultationApi(body);
        setConsultations([...consultations, saved]);
      }

      setSuccessMessage("Note de consultation enregistrée avec succès !");
      setShowSuccess(true);
      toast.success("Consultation enregistrée", { description: `${saved.patientName} — ${saved.date} à ${saved.time}` });

      addToHistory?.(
        editingConsultation ? "Consultation modifiée" : "Nouvelle consultation",
        `${editingConsultation ? 'Mise à jour' : 'Consultation enregistrée'} pour ${saved.patientName}`,
        currentUser
      );

      setTimeout(() => {
        setShowSuccess(false);
        setEditingConsultation(null);
      }, 2000);

      resetForm();
      setEditingConsultation(null);
    } catch (err) {
      console.error(err);
      toast.error(`Erreur API: ${err.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      patientId: "",
      patientName: "",
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().slice(0, 5),
      symptoms: [],
      examination: "",
      diagnosis: "",
      treatment: "",
      recommendations: [],
      followUp: "",
      medications: [],
    });
    setShowForm(false);
  };

  const addSymptom = () => {
    if (currentSymptom.trim()) {
      setFormData((prev) => ({
        ...prev,
        symptoms: [...(prev.symptoms || []), currentSymptom.trim()],
      }));
      setCurrentSymptom("");
    }
  };

  const removeSymptom = (index) => {
    setFormData((prev) => ({
      ...prev,
      symptoms: prev.symptoms?.filter((_, i) => i !== index) || [],
    }));
  };

  const addRecommendation = () => {
    if (currentRecommendation.trim()) {
      setFormData((prev) => ({
        ...prev,
        recommendations: [...(prev.recommendations || []), currentRecommendation.trim()],
      }));
      setCurrentRecommendation("");
    }
  };

  const removeRecommendation = (index) => {
    setFormData((prev) => ({
      ...prev,
      recommendations: prev.recommendations?.filter((_, i) => i !== index) || [],
    }));
  };

  const handlePatientSelect = (patientId) => {
    const selectedPatient = patients?.find((p) => p.id === patientId);
    setFormData((prev) => ({
      ...prev,
      patientId,
      patientName: selectedPatient?.username || "",
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold text-primary">Consultations</h2>
            <p className="text-muted-foreground">Gérer les notes de consultation</p>
          </div>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle consultation
        </Button>
      </div>

      {showSuccess && (
        <Alert className="border-green-300 bg-green-50">
          <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
        </Alert>
      )}

      {showForm && (
        <div className="bg-white border border-border rounded-2xl p-6 space-y-6">
          <h3 className="text-xl font-semibold text-primary">Nouvelle note de consultation</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Patient *</Label>
              <select
                value={formData.patientId}
                onChange={(e) => handlePatientSelect(e.target.value)}
                className="w-full rounded-xl px-4 py-3 border border-border focus:ring-4 focus:ring-primary/20 focus:outline-none"
              >
                <option value="">Sélectionner un patient</option>
                {patients?.map((patient) => (
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
            <div className="flex gap-2 mt-2">
              <Input
                value={currentSymptom}
                onChange={(e) => setCurrentSymptom(e.target.value)}
                placeholder="Ajouter un symptôme"
                className="rounded-xl"
                onKeyPress={(e) => e.key === "Enter" && addSymptom()}
              />
              <Button onClick={addSymptom} variant="outline" className="rounded-xl">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {formData.symptoms?.map((symptom, index) => (
                <Badge key={index} variant="secondary" className="rounded-xl">
                  {symptom}
                  <button
                    onClick={() => removeSymptom(index)}
                    className="ml-2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
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
            <div className="flex gap-2 mt-2">
              <Input
                value={currentRecommendation}
                onChange={(e) => setCurrentRecommendation(e.target.value)}
                placeholder="Ajouter une recommandation"
                className="rounded-xl"
                onKeyPress={(e) => e.key === "Enter" && addRecommendation()}
              />
              <Button onClick={addRecommendation} variant="outline" className="rounded-xl">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {formData.recommendations?.map((rec, index) => (
                <Badge key={index} variant="outline" className="rounded-xl">
                  {rec}
                  <button
                    onClick={() => removeRecommendation(index)}
                    className="ml-2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
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
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl"
            >
              <Save className="w-4 h-4 mr-2" />
              Enregistrer
            </Button>
          </div>
        </div>
      )}

      {/* Section Historique améliorée */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-primary">Historique des consultations</h3>
          </div>
          
          {/* Barre de recherche et filtres */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par patient ou diagnostic..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl w-full sm:w-72"
              />
            </div>
          </div>
        </div>


        {/* Liste des consultations */}
        {filteredConsultations.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-600 mb-2">
              {searchTerm || dateFilter ? "Aucun résultat trouvé" : "Aucune consultation enregistrée"}
            </h4>
            <p className="text-gray-500 mb-6">
              {searchTerm || dateFilter 
                ? "Essayez de modifier vos critères de recherche" 
                : "Commencez par créer votre première consultation"
              }
            </p>
            {(searchTerm || dateFilter) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setDateFilter("");
                }}
                className="rounded-xl"
              >
                Effacer les filtres
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredConsultations.map((consultation) => (
              <ConsultationCard
                key={consultation.id}
                consultation={consultation}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedConsultationsPage;


