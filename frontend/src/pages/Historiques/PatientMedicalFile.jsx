import { useState, useEffect, useMemo } from "react";
import { X, FileText, Calendar, User, Heart, Pill, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PropTypes from "prop-types";

// Constants for record types and their styles
const RECORD_TYPES = {
  consultation: { label: "Consultation", icon: FileText, color: "bg-blue-100 text-blue-800" },
  prescription: { label: "Ordonnance", icon: Pill, color: "bg-green-100 text-green-800" },
  analysis: { label: "Analyse", icon: Heart, color: "bg-purple-100 text-purple-800" },
  surgery: { label: "Chirurgie", icon: AlertTriangle, color: "bg-red-100 text-red-800" },
};

// Custom hook for loading medical records
const useMedicalRecords = (isOpen, patient) => {
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !patient) return;

    const loadPatientMedicalHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const _apiBaseRaw = import.meta.env.VITE_API_URL || "http://localhost:3000";
const _apiBase = _apiBaseRaw.replace(/\/+$/, "");
const API_BASE_URL = _apiBase.endsWith("/api") ? _apiBase : `${_apiBase}/api`;
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/medical-records?patient_id=${encodeURIComponent(patient.id)}`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || body.message || "Failed to load medical records");
        }

        const records = await res.json();
        // normalize to expected shape
        const normalized = records.map((r) => ({
          id: r.id,
          patientId: r.patient_id || r.patientId || (r.patient && r.patient.id),
          date: r.date,
          type: r.type,
          title: r.title,
          description: r.description,
          symptoms: r.symptoms || [],
          diagnosis: r.diagnosis,
          recommendations: r.recommendations || [],
          medications: r.medications || [],
          doctor: r.doctor || (r.doctor_id ? `Dr. ${r.doctor_id}` : "MÃ©decin inconnu"),
        }));

        setMedicalRecords(normalized);
      } catch (err) {
        console.error("[useMedicalRecords]", err);
        setError("Erreur lors du chargement des dossiers mÃ©dicaux: " + (err.message || ""));
      } finally {
        setLoading(false);
      }
    };

    loadPatientMedicalHistory();
  }, [isOpen, patient]);

  return { medicalRecords, loading, error };
};

// Component for rendering individual medical record
const MedicalRecordCard = ({ record }) => {
  const { label, icon: Icon, color } = RECORD_TYPES[record.type] || RECORD_TYPES.consultation;
  const formattedDate = new Date(record.date).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="border border-border rounded-xl p-4 sm:p-6 hover:shadow-md transition-shadow bg-white">
      <div className="flex flex-col sm:flex-row items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${color}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-semibold text-base sm:text-lg text-foreground">{record.title}</h4>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {formattedDate} â€¢ Dr. {record.doctor}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="mt-2 sm:mt-0 rounded-xl">
          {label}
        </Badge>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">{record.description}</p>

        {record.symptoms?.length > 0 && (
          <div>
            <h5 className="font-medium text-sm sm:text-base text-foreground mb-2">SymptÃ´mes :</h5>
            <div className="flex flex-wrap gap-2">
              {record.symptoms.map((symptom, index) => (
                <Badge key={index} variant="secondary" className="rounded-xl text-xs sm:text-sm">
                  {symptom}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {record.diagnosis && (
          <div>
            <h5 className="font-medium text-sm sm:text-base text-foreground mb-2">Diagnostic :</h5>
            <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-xl">
              {record.diagnosis}
            </p>
          </div>
        )}

        {record.medications?.length > 0 && (
          <div>
            <h5 className="font-medium text-sm sm:text-base text-foreground mb-2">MÃ©dicaments prescrits :</h5>
            <div className="space-y-1">
              {record.medications.map((med, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Pill className="w-4 h-4" />
                  <span className="truncate">
                    {typeof med === "string"
                      ? med
                      : `${med.name} (${med.dosage}, ${med.frequency}, ${med.duration})`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {record.recommendations?.length > 0 && (
          <div>
            <h5 className="font-medium text-sm sm:text-base text-foreground mb-2">Recommandations :</h5>
            <ul className="space-y-1">
              {record.recommendations.map((rec, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-1">â€¢</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

const PatientMedicalFile = ({ isOpen, onClose, patient, currentUser, addToHistory, setIsSidebarOpen }) => {
  const [activeTab, setActiveTab] = useState("consultations");
  const { medicalRecords, loading, error } = useMedicalRecords(isOpen, patient);

  // Memoize sorted and filtered records
  const filteredRecords = useMemo(() => {
    return medicalRecords
      .filter((record) => {
        if (activeTab === "consultations") return record.type === "consultation";
        if (activeTab === "prescriptions") return record.type === "prescription";
        if (activeTab === "analyses") return record.type === "analysis";
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [medicalRecords, activeTab]);

  // Close sidebar when modal opens on mobile
  useEffect(() => {
    if (isOpen && window.innerWidth < 768) {
      setIsSidebarOpen?.(false);
    }
  }, [isOpen, setIsSidebarOpen]);

  useEffect(() => {
    if (isOpen && patient) {
      addToHistory?.(
        "Consultation dossier mÃ©dical",
        `Ouverture du dossier mÃ©dical de ${patient.username}`,
        currentUser
      );
    }
  }, [isOpen, patient, currentUser, addToHistory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-2 sm:px-4">
      <div className="bg-white rounded-2xl w-full max-w-[calc(100vw-1rem)] sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col shadow-2xl">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full hover:bg-gray-100 w-10 h-10"
          aria-label="Fermer le dossier mÃ©dical"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Patient Info */}
        <div className="p-4 sm:p-6 sticky top-0 bg-white z-10 border-b border-border">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Patient</p>
                <p className="font-medium text-sm sm:text-base">{patient.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Ã‚ge</p>
                <p className="font-medium text-sm sm:text-base">{patient.age} ans</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Dossiers</p>
                <p className="font-medium text-sm sm:text-base">{medicalRecords.length} entrÃ©es</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-col sm:flex-row gap-2 p-4 sm:p-6 pb-0 sticky top-[72px] sm:top-[88px] bg-white z-10 overflow-x-auto">
          {["consultations", "prescriptions", "analyses"].map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "ghost"}
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl capitalize text-sm sm:text-base py-2 px-4 min-w-[120px] ${
                activeTab === tab ? "bg-primary text-white" : "hover:bg-gray-100"
              }`}
              aria-label={`Afficher les ${tab}`}
            >
              {tab}
            </Button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm sm:text-base text-muted-foreground mt-4">
                Chargement des dossiers mÃ©dicaux...
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-red-500" />
              <h3 className="text-base sm:text-lg font-medium text-muted-foreground mb-2">
                {error}
              </h3>
              <Button variant="outline" onClick={() => window.location.reload()}>
                RÃ©essayer
              </Button>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-base sm:text-lg font-medium text-muted-foreground mb-2">
                Aucun dossier mÃ©dical
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Ce patient n'a pas encore de dossier mÃ©dical enregistrÃ©.
              </p>
              <Button variant="outline" className="mt-4 text-sm sm:text-base">
                Ajouter un nouveau dossier
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecords.map((record) => (
                <MedicalRecordCard key={record.id} record={record} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-border bg-white">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs sm:text-sm text-muted-foreground">
              DerniÃ¨re consultation :{" "}
              {medicalRecords.length > 0
                ? new Date(
                    medicalRecords.sort(
                      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                    )[0].date
                  ).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "Aucune consultation"}
            </p>
            <Button onClick={onClose} className="rounded-xl text-sm sm:text-base w-full sm:w-auto">
              Fermer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

PatientMedicalFile.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  patient: PropTypes.shape({
    id: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    age: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    telephone: PropTypes.string.isRequired,
  }).isRequired,
  currentUser: PropTypes.shape({
    username: PropTypes.string,
    specialite: PropTypes.string,
    email: PropTypes.string,
  }),
  addToHistory: PropTypes.func,
  setIsSidebarOpen: PropTypes.func, // Added to control sidebar visibility
};

export default PatientMedicalFile;