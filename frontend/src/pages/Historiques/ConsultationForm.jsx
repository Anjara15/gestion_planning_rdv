import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Calendar, User, FileText, Save, Pill, Plus, X, Stethoscope, Clock, Search, Filter, Eye, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

const PrescriptionModal = ({ isOpen, onClose, patientName, consultationId, currentUser, addToHistory }) => {
  const [medications, setMedications] = useState([{ name: "", dosage: "", frequency: "", duration: "" }]);
  const [instructions, setInstructions] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const addMedication = () => {
    setMedications([...medications, { name: "", dosage: "", frequency: "", duration: "" }]);
  };

  const removeMedication = (index) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const updateMedication = (index, field, value) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);
  };

  const generatePrescription = () => {
    const validMedications = medications.filter((med) => med.name.trim() !== "");
    if (validMedications.length === 0 && !instructions.trim()) {
      toast.error("Veuillez ajouter au moins un médicament ou des instructions.");
      return;
    }

    const prescription = {
      id: Date.now().toString(),
      consultationId,
      patientName,
      doctor: currentUser?.username || "Dr. Martin",
      date: new Date().toISOString().split("T")[0],
      medications: validMedications,
      instructions,
      createdAt: new Date().toISOString(),
    };

    addToHistory?.("Génération ordonnance", `Ordonnance générée pour ${patientName}`, currentUser);

    setShowSuccess(true);
    toast.success("Ordonnance générée", { description: `${patientName} • ${new Date().toLocaleDateString('fr-FR')}` });
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
        <Button variant="ghost" onClick={onClose} className="rounded-xl absolute top-4 right-4">
          <X className="w-5 h-5" />
        </Button>

        <div className="p-6 space-y-6">
          <div className="flex items-start justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-2xl font-bold text-primary">Génération d'Ordonnance</h2>
              <p className="text-muted-foreground">Patient : {patientName}</p>
            </div>
          </div>
          {showSuccess && (
            <Alert className="border-green-300 bg-green-50">
              <AlertDescription className="text-green-700">
                Ordonnance générée avec succès !
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label className="text-lg font-semibold">Médicaments prescrits</Label>
            <div className="space-y-4 mt-3">
              {medications.map((med, index) => (
                <div key={index} className="border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Médicament {index + 1}</h4>
                    {medications.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMedication(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nom du médicament</Label>
                      <Input
                        value={med.name}
                        onChange={(e) => updateMedication(index, "name", e.target.value)}
                        placeholder="Ex: Paracétamol"
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <Label>Dosage</Label>
                      <Input
                        value={med.dosage}
                        onChange={(e) => updateMedication(index, "dosage", e.target.value)}
                        placeholder="Ex: 500mg"
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <Label>Fréquence</Label>
                      <Input
                        value={med.frequency}
                        onChange={(e) => updateMedication(index, "frequency", e.target.value)}
                        placeholder="Ex: 3 fois par jour"
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <Label>Durée</Label>
                      <Input
                        value={med.duration}
                        onChange={(e) => updateMedication(index, "duration", e.target.value)}
                        placeholder="Ex: 7 jours"
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={addMedication}
                className="w-full rounded-xl border-dashed"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un médicament
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-lg font-semibold">Instructions spéciales</Label>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Instructions particulières pour le patient..."
              rows={4}
              className="rounded-xl mt-3"
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button variant="outline" onClick={onClose} className="rounded-xl">
              Annuler
            </Button>
            <Button
              onClick={generatePrescription}
              disabled={medications.every((med) => med.name.trim() === "") && !instructions.trim()}
              className="bg-green-600 hover:bg-green-700 text-white rounded-xl"
            >
              Générer l'ordonnance
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ConsultationCard = ({ consultation, onGeneratePrescription }) => {
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
          <Button
            size="sm"
            variant="outline"
            onClick={() => onGeneratePrescription(consultation.id, consultation.patientName)}
            className="rounded-xl text-green-600 border-green-200 hover:bg-green-50"
          >
            <Pill className="w-4 h-4 mr-1" />
            Ordonnance
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
  const [currentSymptom, setCurrentSymptom] = useState("");
  const [currentRecommendation, setCurrentRecommendation] = useState("");
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [selectedConsultationForPrescription, setSelectedConsultationForPrescription] = useState("");
  const [selectedPatientForPrescription, setSelectedPatientForPrescription] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showGeneratePrescriptionButton, setShowGeneratePrescriptionButton] = useState(false);
  const [lastSavedConsultationId, setLastSavedConsultationId] = useState("");
  
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

  const loadConsultations = useCallback(() => {
    // Simulation de données pour la démo
    const mockConsultations = [
      {
        id: "1",
        patientName: "Marie Dupont",
        date: "2025-01-15",
        time: "14:30",
        symptoms: ["Fièvre", "Maux de tête", "Fatigue"],
        examination: "Température 38.5°C, tension artérielle normale, examen physique révèle une légère inflammation de la gorge.",
        diagnosis: "Syndrome grippal",
        treatment: "Repos, hydratation, paracétamol en cas de fièvre",
        recommendations: ["Repos complet 48h", "Hydratation importante", "Consulter si aggravation"],
        followUp: "Revoir dans 5 jours si pas d'amélioration",
        doctor: currentUser?.username || "Dr. Martin",
        medications: [
          { name: "Paracétamol", dosage: "500mg", frequency: "3 fois/jour", duration: "7 jours" }
        ]
      },
      {
        id: "2",
        patientName: "Jean Martin",
        date: "2025-01-14",
        time: "10:15",
        symptoms: ["Douleur abdominale", "Nausées"],
        examination: "Abdomen souple, douleur épigastrique à la palpation, pas de défense.",
        diagnosis: "Gastrite probable",
        treatment: "Inhibiteur de pompe à protons, régime alimentaire",
        recommendations: ["Éviter les épices", "Repas fractionnés", "Arrêt tabac/alcool"],
        followUp: "Contrôle dans 2 semaines",
        doctor: currentUser?.username || "Dr. Martin",
        medications: [
          { name: "Oméprazole", dosage: "20mg", frequency: "1 fois/jour", duration: "15 jours" }
        ]
      },
      {
        id: "3",
        patientName: "Sophie Laurent",
        date: "2025-01-13",
        time: "16:45",
        symptoms: ["Toux persistante", "Essoufflement"],
        examination: "Auscultation pulmonaire : râles sibilants bilatéraux, SpO2 96%.",
        diagnosis: "Exacerbation asthmatique légère",
        treatment: "Bronchodilatateurs, corticoïdes inhalés",
        recommendations: ["Éviter les allergènes", "Peak flow quotidien", "Plan d'action asthme"],
        followUp: "Suivi dans 1 semaine",
        doctor: currentUser?.username || "Dr. Martin",
        medications: [
          { name: "Salbutamol", dosage: "100μg", frequency: "2 bouffées 4 fois/jour", duration: "10 jours" },
          { name: "Beclometasone", dosage: "250μg", frequency: "2 bouffées 2 fois/jour", duration: "1 mois" }
        ]
      }
    ];
    
    setConsultations(mockConsultations);
  }, [currentUser]);

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

  const handleFormSubmit = () => {
    if (!formData.patientId || !formData.examination || !formData.diagnosis) {
      toast.error("Champs requis manquants", { description: "Patient, examen et diagnostic sont obligatoires." });
      return;
    }

    const newConsultation = {
      id: Date.now().toString(),
      patientId: formData.patientId,
      patientName: formData.patientName || "",
      date: formData.date || "",
      time: formData.time || "",
      symptoms: formData.symptoms || [],
      examination: formData.examination || "",
      diagnosis: formData.diagnosis || "",
      treatment: formData.treatment || "",
      recommendations: formData.recommendations || [],
      followUp: formData.followUp || "",
      doctor: currentUser?.username || "Dr. Martin",
      medications: formData.medications || [],
    };

    setConsultations([...consultations, newConsultation]);
    setSuccessMessage("Note de consultation enregistrée avec succès !");
    setShowSuccess(true);
    toast.success("Consultation enregistrée", { description: `${newConsultation.patientName} — ${newConsultation.date} à ${newConsultation.time}` });
    setShowGeneratePrescriptionButton(true);
    setLastSavedConsultationId(newConsultation.id);
    setSelectedPatientForPrescription(newConsultation.patientName);

    addToHistory?.("Nouvelle consultation", `Consultation enregistrée pour ${newConsultation.patientName}`, currentUser);

    setTimeout(() => {
      setShowSuccess(false);
    }, 2000);

    resetForm();
  };

  const handleGeneratePrescriptionClick = () => {
    setSelectedConsultationForPrescription(lastSavedConsultationId);
    setShowPrescriptionModal(true);
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
            {showGeneratePrescriptionButton && (
              <Button
                onClick={handleGeneratePrescriptionClick}
                className="bg-green-600 hover:bg-green-700 text-white rounded-xl"
              >
                Générer l'ordonnance
              </Button>
            )}
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
                onGeneratePrescription={(consultationId, patientName) => {
                  setSelectedConsultationForPrescription(consultationId);
                  setSelectedPatientForPrescription(patientName);
                  setShowPrescriptionModal(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      <PrescriptionModal
        isOpen={showPrescriptionModal}
        onClose={() => {
          setShowPrescriptionModal(false);
          setShowGeneratePrescriptionButton(false);
        }}
        patientName={selectedPatientForPrescription}
        consultationId={selectedConsultationForPrescription}
        currentUser={currentUser}
        addToHistory={addToHistory}
      />
    </div>
  );
};

export default EnhancedConsultationsPage;