import { useEffect, useRef, useState, useMemo } from "react";
import {
  Calendar,
  Heart,
  Clock,
  User,
  List,
  ArrowLeft,
  Menu,
  X as XIcon,
  LogOut,
  Settings,
  CalendarCheck,
  FileText,
  Plus,
  Trash2,
  Search,
  Home,
  Star,
  RefreshCw,
  Loader2,
  MessageSquare,
  Video,
  BarChart3,
  Activity,
  Wallet,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import fr from "date-fns/locale/fr";
import { useSpecialties } from "@/hooks/useSpecialties";
import MessagingPanel from "@/components/MessagingPanel";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

registerLocale("fr", fr);

const PATIENT_ACTIVITY_STORAGE_KEY = "patientActivities";
const PATIENT_SPORTS_ACTIVITY_STORAGE_KEY = "patientSportsActivities";

// Health tips data
const healthTips = [
  { id: 1, icon: Heart, text: "Buvez au moins 1,5L d'eau par jour pour rester hydraté.", color: "text-blue-600" },
  { id: 2, icon: Clock, text: "Dormez 7 Ã  8 heures par nuit pour une santé optimale.", color: "text-purple-600" },
  { id: 3, icon: Calendar, text: "Faites 30 minutes d'exercice physique 5 fois par semaine.", color: "text-green-600" },
  { id: 4, icon: FileText, text: "Planifiez des bilans de santé réguliers avec votre médecin.", color: "text-orange-600" },
];

// General notions for sidebar
const _generalNotions = [
  { id: 1, text: "Prenez vos rendez-vous Ã  l'avance pour plus de disponibilitÃ©.", color: "text-cyan-600" },
  { id: 2, text: "Mettez à jour votre profil pour une meilleure coordination.", color: "text-purple-600" },
  { id: 3, text: "Annulez les RDV non nécessaires pour libérer des créneaux.", color: "text-orange-600" },
];

const PatientDashboard = ({ currentUser, logout }) => {
  const [rendezVous, setRendezVous] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const didWelcomeRef = useRef(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");
  // Plus besoin de sélectionner un médecin cété patient
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [demande, setDemande] = useState("");
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedSpecialtyObj, setSelectedSpecialtyObj] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [profile, setProfile] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    dateNaissance: "",
    adresse: "",
  });
  const [editProfile, setEditProfile] = useState(null);
  const [secondaryView, setSecondaryView] = useState("accueil");
  const [activeDocumentCard, setActiveDocumentCard] = useState("ordonnances");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [specialtySearch, setSpecialtySearch] = useState("");
  const [isSpecialtyDropdownOpen, setIsSpecialtyDropdownOpen] = useState(false);
  const [errors, setErrors] = useState({});
  // patient document/payment form state
  const [docForm, setDocForm] = useState({ title: "", description: "", date: "" });
  const [editingDocId, setEditingDocId] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ amount: "", description: "", status: "en_attente" });
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const sidebarRef = useRef(null);

  // Enhanced specialty dropdown state
  const [favoriteSpecialties, setFavoriteSpecialties] = useState([]);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [_historyVersion, setHistoryVersion] = useState(0);
  const [sportsVersion, setSportsVersion] = useState(0);
  const [documentsVersion, setDocumentsVersion] = useState(0);
  const [lastPatientStatsRefresh, setLastPatientStatsRefresh] = useState(null);
  const [sportActivityForm, setSportActivityForm] = useState({
    sport: "",
    duration: "",
    intensity: "moderee",
    date: new Date().toISOString().split("T")[0],
    note: "",
  });

  // Load favorite specialties from localStorage on mount
  useEffect(() => {
    const storedFavorites = localStorage.getItem('favoriteSpecialties');
    if (storedFavorites) {
      try {
        setFavoriteSpecialties(JSON.parse(storedFavorites));
      } catch (error) {
        console.error('Error parsing favorite specialties:', error);
      }
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      setDebouncedSearchTerm(specialtySearch);
    }, 300);

    setSearchTimeout(timeout);

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [specialtySearch]);

  // Fetch specialties from the database
  const { data: specialties = [], isLoading: specialtiesLoading, error: specialtiesError } = useSpecialties();

  // Enhanced filtered specialties with favorites
  const filteredSpecialties = useMemo(() => {
    if (!specialties || !Array.isArray(specialties)) return [];

    let filtered = specialties.filter((specialty) => {
      if (!specialty || !specialty.name || typeof specialty.name !== 'string') return false;
      return specialty.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    });

    // Sort by favorites first
    filtered.sort((a, b) => {
      const aIsFavorite = favoriteSpecialties.includes(a.id);
      const bIsFavorite = favoriteSpecialties.includes(b.id);

      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;
      return a.name.localeCompare(b.name);
    });

    return filtered;
  }, [specialties, debouncedSearchTerm, favoriteSpecialties]);

  // API base URL
  const _apiBaseRaw = import.meta.env.VITE_API_URL || "http://localhost:3000";
  const _apiBase = _apiBaseRaw.replace(/\/+$/, "");
  const API_BASE_URL = _apiBase.endsWith("/api") ? _apiBase : `${_apiBase}/api`;

  const readStorageArray = (key) => {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error(`Erreur lecture localStorage pour ${key}:`, error);
      return [];
    }
  };

  const normalizeText = (value) => String(value || "").trim().toLowerCase();

  // Removed: patientIdentity/matchesCurrentPatient (no longer needed for pure API, backend filters by auth user)

  const sortByRecentDate = (items) =>
    [...items].sort((a, b) => {
      const aDate = new Date(a.date || a.createdAt || a.timestamp || 0).getTime();
      const bDate = new Date(b.date || b.createdAt || b.timestamp || 0).getTime();
      return bDate - aDate;
    });

  const normalizePrescription = (item) => ({
    ...item,
    doctor: item?.doctor?.username || item?.doctor || "Médecin",
    patientName: item?.patient?.username || item?.patientName || "Patient",
    medications: Array.isArray(item?.medications) ? item.medications : [],
  });

  const normalizeMedicalRecord = (record) => ({
    ...record,
    title: record?.title || "Document médical",
    description: record?.description || "",
    type: record?.type || "patient_note",
  });

  const normalizePayment = (payment) => ({
    ...payment,
    amount: Number(payment?.amount || 0),
    status: payment?.status || "en_attente",
    description: payment?.description || "",
    date: payment?.date || payment?.createdAt || "",
  });

  const [patientPrescriptions, setPatientPrescriptions] = useState([]);
  const [patientPayments, setPatientPayments] = useState([]);
  const [patientMedicalRecords, setPatientMedicalRecords] = useState([]);

  // API helpers
  const tokenHeader = () => {
    const t = localStorage.getItem("token");
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  async function loadPrescriptions() {
    try {
      const resp = await axios.get(`${API_BASE_URL}/prescriptions`, { headers: tokenHeader() });
      const data = resp.data;
      setPatientPrescriptions(sortByRecentDate(Array.isArray(data) ? data.map(normalizePrescription) : []));
    } catch (e) {
      console.error("fetch prescriptions failed", e);
      toast.error("Erreur chargement ordonnances. Vérifiez le serveur backend.");
      setPatientPrescriptions([]);
    }
  }
  async function loadPayments() {
    try {
      const resp = await axios.get(`${API_BASE_URL}/payments`, { headers: tokenHeader() });
      setPatientPayments(sortByRecentDate(Array.isArray(resp.data) ? resp.data.map(normalizePayment) : []));
    } catch (e) {
      console.error("fetch payments failed", e);
      toast.error("Erreur chargement paiements. Vérifiez le serveur backend.");
      setPatientPayments([]);
    }
  }
  async function loadMedicalRecords() {
    try {
      const resp = await axios.get(`${API_BASE_URL}/medical-records`, { headers: tokenHeader() });
      setPatientMedicalRecords(sortByRecentDate(Array.isArray(resp.data) ? resp.data.map(normalizeMedicalRecord) : []));
    } catch (e) {
      console.error("fetch medical records failed", e);
      toast.error("Erreur chargement dossiers médicaux. Vérifiez le serveur backend.");
      setPatientMedicalRecords([]);
    }
  }

  // crud operations used maybe later
  async function addMedicalRecord(body) {
    const payload = {
      date: body.date || new Date().toISOString().split("T")[0],
      type: body.type || "patient_note",
      title: body.title,
      description: body.description || "",
      symptoms: Array.isArray(body.symptoms) ? body.symptoms : [],
      recommendations: Array.isArray(body.recommendations) ? body.recommendations : [],
      medications: Array.isArray(body.medications) ? body.medications : [],
    };
    const resp = await axios.post(`${API_BASE_URL}/medical-records`, payload, { headers: { "Content-Type": "application/json", ...tokenHeader() } });
    setPatientMedicalRecords((prev) => sortByRecentDate([normalizeMedicalRecord(resp.data), ...prev]));
    setDocumentsVersion((v) => v + 1);
    return resp.data;
  }
  async function updateMedicalRecord(id, body) {
    const currentRecord = patientMedicalRecords.find((record) => String(record.id) === String(id));
    const payload = {
      date: body.date || currentRecord?.date || new Date().toISOString().split("T")[0],
      type: body.type || currentRecord?.type || "patient_note",
      title: body.title || currentRecord?.title || "Document médical",
      description: typeof body.description === "string" ? body.description : currentRecord?.description || "",
      symptoms: Array.isArray(body.symptoms) ? body.symptoms : currentRecord?.symptoms || [],
      recommendations: Array.isArray(body.recommendations) ? body.recommendations : currentRecord?.recommendations || [],
      medications: Array.isArray(body.medications) ? body.medications : currentRecord?.medications || [],
    };
    const resp = await axios.put(`${API_BASE_URL}/medical-records/${id}`, payload, { headers: { "Content-Type": "application/json", ...tokenHeader() } });
    setPatientMedicalRecords((prev) =>
      sortByRecentDate(prev.map((r) => (String(r.id) === String(id) ? normalizeMedicalRecord(resp.data) : r)))
    );
    setDocumentsVersion((v) => v + 1);
    return resp.data;
  }
  async function deleteMedicalRecord(id) {
    await axios.delete(`${API_BASE_URL}/medical-records/${id}`, { headers: tokenHeader() });
    setPatientMedicalRecords((prev) => prev.filter((r) => String(r.id) !== String(id)));
    setDocumentsVersion((v) => v + 1);
  }
  async function addPayment(body) {
    const resp = await axios.post(`${API_BASE_URL}/payments`, body, { headers: { "Content-Type": "application/json", ...tokenHeader() } });
    setPatientPayments((prev) => sortByRecentDate([normalizePayment(resp.data), ...prev]));
    setDocumentsVersion((v) => v + 1);
    return resp.data;
  }
  async function updatePayment(id, body) {
    const resp = await axios.put(`${API_BASE_URL}/payments/${id}`, body, { headers: { "Content-Type": "application/json", ...tokenHeader() } });
    setPatientPayments((prev) => sortByRecentDate(prev.map((p) => (String(p.id) === String(id) ? normalizePayment(resp.data) : p))));
    setDocumentsVersion((v) => v + 1);
    return resp.data;
  }
  async function deletePayment(id) {
    await axios.delete(`${API_BASE_URL}/payments/${id}`, { headers: tokenHeader() });
    setPatientPayments((prev) => prev.filter((p) => String(p.id) !== String(id)));
    setDocumentsVersion((v) => v + 1);
  }

  useEffect(() => {
    loadPrescriptions();
    loadPayments();
    loadMedicalRecords();
  }, [documentsVersion]);

  const patientSportActivities = useMemo(() => [], []); // Sports localStorage unchanged (out of scope)

  // Helper function to get JWT token from localStorage
  const getToken = () => localStorage.getItem("token");

  // Helper function to add to history
  const addToHistory = async (action, description) => {
    const historyEntry = {
      id: Date.now(),
      action,
      description,
      timestamp: new Date().toISOString(),
      user: `${profile?.nom || ''} ${profile?.prenom || ''}`.trim() || 'Utilisateur'
    };

    try {
      await fetch(`${API_BASE_URL}/history`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          action,
          description,
        }),
      });
    } catch (apiError) {
      console.error("Error sending history to backend:", apiError);
    }

    try {
      const localHistoryEntry = {
        ...historyEntry,
        action,
        description,
      };
      let existingHistory = [];
      try {
        const storedHistory = localStorage.getItem('appHistory');
        existingHistory = storedHistory ? JSON.parse(storedHistory) : [];
        if (!Array.isArray(existingHistory)) {
          existingHistory = [];
        }
      } catch (parseError) {
        console.error("Error parsing appHistory:", parseError);
        existingHistory = [];
      }
      existingHistory.unshift(localHistoryEntry);
      if (existingHistory.length > 50) {
        existingHistory.splice(50);
      }
      localStorage.setItem('appHistory', JSON.stringify(existingHistory));

      const activityEntries = readStorageArray(PATIENT_ACTIVITY_STORAGE_KEY);
      activityEntries.unshift(localHistoryEntry);
      if (activityEntries.length > 80) {
        activityEntries.splice(80);
      }
      localStorage.setItem(PATIENT_ACTIVITY_STORAGE_KEY, JSON.stringify(activityEntries));
      setHistoryVersion((prev) => prev + 1);
    } catch (error) {
      console.error("Error logging history:", error);
    }
  };

  // Fetch user profile
  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          logout?.();
          toast.error("Session expirée. Veuillez vous reconnecter.");
        }
        throw new Error("Failed to fetch profile");
      }
      const user = await response.json();
      const updatedProfile = {
        nom: user.username ? user.username.split(" ")[0] : user.nom || "",
        prenom: user.username ? user.username.split(" ")[1] || "" : user.prenom || "",
        email: user.email || "",
        telephone: user.telephone || "",
        dateNaissance: user.dateNaissance || "",
        adresse: user.adresse || "",
      };
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Erreur lors de la récupération du profil.");
      return null;
    }
  };

  // Fetch user appointments
  const fetchAppointments = async (silent = false) => {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/mine`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          logout?.();
          toast.error("Session expirée. Veuillez vous reconnecter.");
        }
        throw new Error("Failed to fetch appointments");
      }
      const appointments = await response.json();
      setRendezVous(appointments.map(a => ({
        id: a.id,
        date: a.date,
        time: a.time,
        specialite: a.specialite,
        demande: a.demande,
        isNew: a.is_new || a.isNew,
      })));
      if (!silent) {
        appointments
          .filter((rdv) => rdv.isNew)
          .forEach((rdv) => {
            toast.success(`Rendez-vous en attente : ${rdv.specialite || "Consultation"} le ${rdv.date} à ${rdv.time}`);
          });
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      if (!silent) {
        toast.error("Erreur lors de la récupération des rendez-vous.");
      }
    }
  };

  // Fetch available time slots for a date
  const fetchAvailableSlots = async (date) => {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/available-slots?date=${date}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          logout?.();
          toast.error("Session expirée. Veuillez vous reconnecter.");
        }
        throw new Error("Failed to fetch available slots");
      }
      const slots = await response.json();
      setAvailableSlots(slots);
    } catch (error) {
      console.error("Error fetching available slots:", error);
      toast.error("Erreur lors de la récupération des créneaux disponibles.");
    }
  };

  useEffect(() => {
    if (!initialized) {
      const init = async () => {
        const updatedProfile = await fetchProfile();
        if (updatedProfile) {
          await fetchAppointments();
          await addToHistory("Connexion", "Connexion au tableau de bord patient");
          if (!didWelcomeRef.current) {
            toast.success(`Bienvenue ${updatedProfile.nom || "Patient"} !`);
            didWelcomeRef.current = true;
          }
          setSecondaryView("accueil");
          setInitialized(true);
        }
      };
      init();
    }
  }, [initialized]);

  useEffect(() => {
    if (secondaryView !== "statsPatient") return;

    setLastPatientStatsRefresh(new Date().toISOString());
    const intervalId = setInterval(() => {
      setDocumentsVersion((prev) => prev + 1);
      setSportsVersion((prev) => prev + 1);
      setHistoryVersion((prev) => prev + 1);
      setLastPatientStatsRefresh(new Date().toISOString());
      fetchAppointments(true);
    }, 15000);

    return () => clearInterval(intervalId);
  }, [secondaryView]);

  // Removed storage listener (no localStorage for core data)

  const handleAddRdv = async () => {
    if (!selectedSpecialtyObj && !selectedSpecialty) {
      toast.error("Veuillez choisir une spécialité.", { description: "Champs requis" });
      return;
    }
    if (!selectedDate) {
      toast.error("Veuillez sélectionner une date.", { description: "Champs requis" });
      return;
    }
    if (!selectedTime) {
      toast.error("Veuillez choisir une heure.", { description: "Champs requis" });
      return;
    }

    // Fix timezone issue: Use local date components to avoid timezone conversion
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          date: dateStr,
          time: selectedTime,
          specialite: selectedSpecialtyObj?.name || selectedSpecialty,
          demande,
          status: "en attente",
        }),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          logout?.();
          toast.error("Session expirée. Veuillez vous reconnecter.");
        }
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add appointment");
      }

      const newRdv = await response.json();
      setRendezVous((prev) => [...prev, {
        id: newRdv.id,
        date: newRdv.date,
        time: newRdv.time,
        specialite: newRdv.specialite,
        demande: newRdv.demande,
        isNew: newRdv.is_new || newRdv.isNew,
      }]);

      toast.success("Rendez-vous ajouté avec succès", {
        description: `${newRdv.specialite || "Consultation"}  -  ${new Date(newRdv.date).toLocaleDateString("fr-FR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })} à ${newRdv.time}${demande ? `\nMotif: ${demande}` : ""}`,
      });

      await addToHistory(
        "Ajout rendez-vous",
        `Ajout d'un rendez-vous: ${newRdv.specialite} le ${newRdv.date} à ${newRdv.time}`
      );

      setIsModalOpen(false);
      setBookingStep(1);
      setSelectedSpecialtyObj(null);
      setSelectedDate(null);
      setSelectedTime("");
      setSelectedSpecialty("");
      setDemande("");
      setSpecialtySearch("");
      setIsSpecialtyDropdownOpen(false);
      setErrors({});
      setAvailableSlots([]);
    } catch (error) {
      console.error("Error adding appointment:", error);
      toast.error(error.message || "Erreur lors de l'ajout du rendez-vous.");
    }
  };

  const handleCancelRdv = async (rdvId) => {
    try {
      const rdvToCancel = rendezVous.find((rdv) => rdv.id === rdvId);
      const response = await fetch(`${API_BASE_URL}/appointments/${rdvId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          logout?.();
          toast.error("Session expirée. Veuillez vous reconnecter.");
        }
        throw new Error("Failed to cancel appointment");
      }

      setRendezVous((prev) => prev.filter((rdv) => rdv.id !== rdvId));
      await addToHistory(
        "Annulation rendez-vous",
        `Annulation du rendez-vous: ${rdvToCancel.specialite} le ${rdvToCancel.date} à ${rdvToCancel.time}`
      );
      toast.success("Rendez-vous annulé avec succès", { description: "Annulation confirmée" });
    } catch (error) {
      console.error("Error canceling appointment:", error);
      toast.error("Erreur lors de l'annulation du rendez-vous.");
    }
  };

  const handleEditProfile = () => {
    setEditProfile({ ...profile });
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setEditProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    if (!editProfile.nom || !editProfile.prenom || !editProfile.email) {
      toast.error("Veuillez remplir tous les champs obligatoires (Nom, Prénom, Email).");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          username: `${editProfile.nom} ${editProfile.prenom}`.trim(),
          email: editProfile.email,
          telephone: editProfile.telephone,
          adresse: editProfile.adresse,
          dateNaissance: editProfile.dateNaissance,
        }),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          logout?.();
          toast.error("Session expirée. Veuillez vous reconnecter.");
        }
        throw new Error("Failed to update profile");
      }

      await response.json();
      const updatedProfile = {
        nom: editProfile.nom,
        prenom: editProfile.prenom,
        email: editProfile.email,
        telephone: editProfile.telephone,
        dateNaissance: editProfile.dateNaissance,
        adresse: editProfile.adresse,
      };
      setProfile(updatedProfile);
      setEditProfile(null);
      await addToHistory("Modification profil", "Mise à jour des informations du profil");
      toast.success("Profil mis à jour avec succès !");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Erreur lors de la sauvegarde du profil.");
    }
  };

  const handleCancelEdit = () => {
    setEditProfile(null);
  };

  const navigateTo = (view) => {
    setSecondaryView(view);
    setIsSidebarOpen(false);
    addToHistory("Navigation", `Accès à la vue ${view}`);
  };

  const handleLogout = async () => {
    await addToHistory("Déconnexion", "Déconnexion du tableau de bord patient");
    localStorage.removeItem("token");
    logout?.();
    toast.success("Déconnexion rÃ©ussie", { description: "Vous avez été déconnecté." });
  };

  const isDateOnOrAfterToday = (dateStr) => {
    const rdvDate = new Date(dateStr);
    const today = new Date();
    rdvDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return rdvDate >= today;
  };

  const patientStats = useMemo(() => {
    const totalRdv = rendezVous.length;
    const upcomingRdv = rendezVous.filter((rdv) => isDateOnOrAfterToday(rdv.date)).length;
    const pastRdv = totalRdv - upcomingRdv;
    const pendingRdv = rendezVous.filter((rdv) => (rdv.status || "").toLowerCase().includes("attente")).length;
    const cancelledRdv = rendezVous.filter((rdv) => (rdv.status || "").toLowerCase().includes("annul")).length;

    const paidAmount = patientPayments
      .filter((item) => item.status === "paye")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const pendingAmount = patientPayments
      .filter((item) => item.status === "en_attente")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return {
      totalRdv,
      upcomingRdv,
      pastRdv,
      pendingRdv,
      cancelledRdv,
      documentsCount: patientPrescriptions.length + patientMedicalRecords.length + patientPayments.length,
      prescriptionsCount: patientPrescriptions.length,
      medicalRecordsCount: patientMedicalRecords.length,
      paymentsCount: patientPayments.length,
      activitiesCount: patientSportActivities.length,
      paidAmount,
      pendingAmount,
    };
  }, [rendezVous, patientPrescriptions, patientMedicalRecords, patientPayments, patientSportActivities]);

  const statsOverviewChartData = useMemo(
    () => [
      { name: "RDV", value: patientStats.totalRdv, fill: "#06b6d4" },
      { name: "Documents", value: patientStats.documentsCount, fill: "#f59e0b" },
      { name: "Sports", value: patientStats.activitiesCount, fill: "#ec4899" },
      { name: "Paiements", value: patientStats.paymentsCount, fill: "#10b981" },
    ],
    [patientStats]
  );

  const rdvStatusChartData = useMemo(
    () => [
      { label: "A venir", count: patientStats.upcomingRdv },
      { label: "Passes", count: patientStats.pastRdv },
      { label: "En attente", count: patientStats.pendingRdv },
      { label: "Annules", count: patientStats.cancelledRdv },
    ],
    [patientStats]
  );

  const paymentChartData = useMemo(
    () => [
      { label: "Paye", amount: patientStats.paidAmount },
      { label: "En attente", amount: patientStats.pendingAmount },
    ],
    [patientStats]
  );

  const addSportActivity = async () => {
    const sport = String(sportActivityForm.sport || "").trim();
    const duration = Number(sportActivityForm.duration);
    if (!sport) {
      toast.error("Veuillez renseigner le sport pratique.");
      return;
    }
    if (!Number.isFinite(duration) || duration <= 0) {
      toast.error("La duree doit etre superieure a 0.");
      return;
    }

    const entry = {
      id: Date.now().toString(),
      sport,
      duration,
      intensity: sportActivityForm.intensity || "moderee",
      date: sportActivityForm.date || new Date().toISOString().split("T")[0],
      note: sportActivityForm.note || "",
      userId: String(currentUser?.id || ""),
      userEmail: profile?.email || currentUser?.email || "",
      userName: `${profile?.nom || ""} ${profile?.prenom || ""}`.trim() || currentUser?.username || "Patient",
      createdAt: new Date().toISOString(),
    };

    const previous = readStorageArray(PATIENT_SPORTS_ACTIVITY_STORAGE_KEY);
    const next = [entry, ...previous].slice(0, 120);
    localStorage.setItem(PATIENT_SPORTS_ACTIVITY_STORAGE_KEY, JSON.stringify(next));
    setSportsVersion((prev) => prev + 1);
    setLastPatientStatsRefresh(new Date().toISOString());
    setSportActivityForm({
      sport: "",
      duration: "",
      intensity: "moderee",
      date: new Date().toISOString().split("T")[0],
      note: "",
    });
    await addToHistory("Activite sportive", `Ajout activite: ${sport} (${duration} min)`);
    toast.success("Activite sportive enregistree.");
  };

  const deleteSportActivity = async (id) => {
    const previous = readStorageArray(PATIENT_SPORTS_ACTIVITY_STORAGE_KEY);
    const target = previous.find((item) => String(item.id) === String(id));
    const next = previous.filter((item) => String(item.id) !== String(id));
    localStorage.setItem(PATIENT_SPORTS_ACTIVITY_STORAGE_KEY, JSON.stringify(next));
    setSportsVersion((prev) => prev + 1);
    setLastPatientStatsRefresh(new Date().toISOString());
    if (target) {
      await addToHistory("Activite sportive", `Suppression activite: ${target.sport || "sport"}`);
    }
    toast.success("Activite sportive supprimee.");
  };

  const calculateProfileCompletion = () => {
    const fields = ['nom', 'prenom', 'email', 'telephone', 'dateNaissance', 'adresse'];
    const filledFields = fields.filter(field => profile[field] && profile[field].trim() !== '').length;
    return Math.round((filledFields / fields.length) * 100);
  };



  const renderSidebar = () => (
    <>
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label={isSidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
      >
        {isSidebarOpen ? <XIcon className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>
      <div
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white/80 backdrop-blur-lg shadow-xl transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col border-r border-white/30 h-full`}
        role="navigation"
        aria-label="Menu de navigation"
      >
        <div className="p-6 border-b border-white/30">
          <h2 className="text-xl font-semibold text-gray-700">Tableau de bord</h2>
          <p className="text-sm text-gray-500">Patient {profile.nom || "Utilisateur"}</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Button
            variant={secondaryView === "accueil" ? "default" : "ghost"}
            className={`w-full justify-start gap-2 rounded-xl ${
              secondaryView === "accueil" ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white" : "text-gray-700"
            } hover:bg-gradient-to-r hover:from-cyan-600 hover:to-blue-700 hover:text-white transition-all duration-300`}
            onClick={() => navigateTo("accueil")}
            aria-label="Aller à la page d'accueil"
            aria-current={secondaryView === "accueil" ? "page" : undefined}
          >
            <Home className="w-5 h-5" />
            Accueil
          </Button>
          <Button
            variant={secondaryView === "prendreRdv" ? "default" : "ghost"}
            className={`w-full justify-start gap-2 rounded-xl ${
              secondaryView === "prendreRdv" ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white" : "text-gray-700"
            } hover:bg-gradient-to-r hover:from-purple-600 hover:to-indigo-700 hover:text-white transition-all duration-300`}
            onClick={() => {
              setIsModalOpen(true);
              navigateTo("prendreRdv");
            }}
            aria-label="Prendre un rendez-vous"
            aria-current={secondaryView === "prendreRdv" ? "page" : undefined}
          >
            <Calendar className="w-5 h-5" />
            Prendre RDV
          </Button>
          <Button
            variant={secondaryView === "mesRdv" ? "default" : "ghost"}
            className={`w-full justify-start gap-2 rounded-xl ${
              secondaryView === "mesRdv" ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white" : "text-gray-700"
            } hover:bg-gradient-to-r hover:from-emerald-600 hover:to-teal-700 hover:text-white transition-all duration-300`}
            onClick={() => navigateTo("mesRdv")}
            aria-label="Voir mes rendez-vous"
            aria-current={secondaryView === "mesRdv" ? "page" : undefined}
          >
            <CalendarCheck className="w-5 h-5" />
            Mes RDV
          </Button>
          <Button
            variant={secondaryView === "mesDocuments" ? "default" : "ghost"}
            className={`w-full justify-start gap-2 rounded-xl ${
              secondaryView === "mesDocuments" ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white" : "text-gray-700"
            } hover:bg-gradient-to-r hover:from-indigo-600 hover:to-violet-700 hover:text-white transition-all duration-300`}
            onClick={() => navigateTo("mesDocuments")}
            aria-label="Voir mes documents"
            aria-current={secondaryView === "mesDocuments" ? "page" : undefined}
          >
            <FolderOpen className="w-5 h-5" />
            Mes documents
          </Button>
          <Button
            variant={secondaryView === "statsPatient" ? "default" : "ghost"}
            className={`w-full justify-start gap-2 rounded-xl ${
              secondaryView === "statsPatient" ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white" : "text-gray-700"
            } hover:bg-gradient-to-r hover:from-amber-600 hover:to-orange-700 hover:text-white transition-all duration-300`}
            onClick={() => navigateTo("statsPatient")}
            aria-label="Voir les statistiques patient"
            aria-current={secondaryView === "statsPatient" ? "page" : undefined}
          >
            <BarChart3 className="w-5 h-5" />
            Statistiques
          </Button>
          <Button
            variant={secondaryView === "messagerie" ? "default" : "ghost"}
            className={`w-full justify-start gap-2 rounded-xl ${
              secondaryView === "messagerie" ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white" : "text-gray-700"
            } hover:bg-gradient-to-r hover:from-cyan-600 hover:to-blue-700 hover:text-white transition-all duration-300`}
            onClick={() => navigateTo("messagerie")}
            aria-label="Ouvrir la messagerie"
            aria-current={secondaryView === "messagerie" ? "page" : undefined}
          >
            <MessageSquare className="w-5 h-5" />
            Messagerie
          </Button>
        </nav>
      </div>
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        ></div>
      )}
    </>
  );

  const renderHeader = () => (
    <div className="flex justify-between items-center border-b border-white/30 pb-5 w-full">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-semibold text-gray-700 tracking-tight">
          Bienvenue, {profile.nom || "Patient"}
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          className="p-2 rounded-full text-gray-700 hover:bg-gradient-to-r hover:from-cyan-500 hover:to-blue-600 hover:text-white transition-all duration-200"
          onClick={() => navigateTo("profil")}
          aria-label="Voir mon profil"
        >
          <User className="w-6 h-6" />
        </Button>
        <Button
          variant="ghost"
          className="p-2 rounded-full text-gray-700 hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-600 hover:text-white transition-all duration-200"
          onClick={handleLogout}
          aria-label="Se déconnecter"
        >
          <LogOut className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );

  const renderAccueilPage = () => {
    const upcomingAppointments = rendezVous
      .filter((rdv) => isDateOnOrAfterToday(rdv.date))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 2);
    const profileCompletion = calculateProfileCompletion();
    let recentHistory = [];
    try {
      const storedHistory = localStorage.getItem('appHistory');
      recentHistory = storedHistory ? JSON.parse(storedHistory) : [];
      if (!Array.isArray(recentHistory)) {
        recentHistory = [];
      }
    } catch (error) {
      console.error("Error parsing recent history:", error);
      recentHistory = [];
    }
    recentHistory = recentHistory.slice(0, 5);

    return (
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 mt-8 w-full">
        <div className="p-6 border-b border-white/30">
          <h3 className="text-xl font-semibold text-gray-700 text-center w-full flex items-center justify-center gap-2">
            <Home className="w-5 h-5" />
            Accueil
          </h3>
        </div>
        <div className="p-6 space-y-8">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/30 p-6">
            <h3 className="flex items-center gap-3 text-primary font-semibold text-lg mb-4">
              <FileText className="w-6 h-6" />
              Récapitulatif d'utilisation
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Prochains rendez-vous</h4>
                {upcomingAppointments.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucun rendez-vous à venir</p>
                ) : (
                  <ul className="space-y-2">
                    {upcomingAppointments.map((rdv) => (
                      <li key={rdv.id} className="text-sm text-gray-600">
                        <span className="font-medium">{rdv.specialite}</span> -{" "}
                        {new Date(rdv.date).toLocaleDateString("fr-FR", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        ? {rdv.time}
                      </li>
                    ))}
                  </ul>
                )}
                <Button
                  variant="link"
                  className="mt-2 text-blue-600 hover:text-blue-700"
                  onClick={() => navigateTo("mesRdv")}
                  aria-label="Voir tous les rendez-vous"
                >
                  Voir tous les rendez-vous
                </Button>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Complétion du profil</h4>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2.5 rounded-full"
                    style={{ width: `${profileCompletion}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Profil complété à {profileCompletion}%{' '}
                  {profileCompletion < 100 && (
                    <Button
                      variant="link"
                      className="text-blue-600 hover:text-blue-700 p-0"
                      onClick={() => navigateTo("profil")}
                      aria-label="Compléter votre profil"
                    >
                      Compléter votre profil
                    </Button>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/30 p-6">
            <h3 className="flex items-center gap-3 text-primary font-semibold text-lg mb-4">
              <Heart className="w-6 h-6" />
              Conseils santé
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {healthTips.map((tip) => {
                const IconComponent = tip.icon;
                return (
                  <div
                    key={tip.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50/50 transition-colors"
                  >
                    <IconComponent className={`w-5 h-5 ${tip.color}`} />
                    <p className="text-sm text-gray-600">{tip.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMesRdvPage = () => (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 mt-8 w-full">
      <div className="p-6 border-b border-white/30">
        <h3 className="text-xl font-semibold text-gray-700 text-center w-full flex items-center justify-center gap-2">
          <CalendarCheck className="w-5 h-5" />
          Mes rendez-vous ({rendezVous.length})
        </h3>
      </div>
      <div className="p-6">
        {rendezVous.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="w-16 h-16 mx-auto mb-4" />
            <p>Aucun rendez-vous enregistré</p>
            <Button
              className="mt-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl"
              onClick={() => {
                setIsModalOpen(true);
                navigateTo("prendreRdv");
              }}
              aria-label="Prendre un nouveau rendez-vous"
            >
              <Plus className="w-4 h-4 mr-2" />
              Prendre un RDV
            </Button>
          </div>
        ) : (
          <div className="w-full">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse border border-white/30">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="border border-white/30 p-3 text-left text-sm font-medium text-gray-700">Date</th>
                    <th className="border border-white/30 p-3 text-left text-sm font-medium text-gray-700">Heure</th>
                    <th className="border border-white/30 p-3 text-left text-sm font-medium text-gray-700">Spécialité</th>
                    <th className="border border-white/30 p-3 text-left text-sm font-medium text-gray-700">Motif</th>
                    <th className="border border-white/30 p-3 text-left text-sm font-medium text-gray-700">Statut RDV</th>
                  </tr>
                </thead>
                <tbody>
                  {rendezVous.map((rdv) => (
                    <tr key={rdv.id} className="border-b border-white/30 hover:bg-gray-50/50 transition-colors">
                      <td className="border border-white/30 p-3 text-sm font-medium text-gray-700">
                        {new Date(rdv.date).toLocaleDateString("fr-FR", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </td>
                      <td className="border border-white/30 p-3 text-sm text-gray-500">{rdv.time}</td>
                      <td className="border border-white/30 p-3 text-sm text-gray-500">{rdv.specialite}</td>
                      <td className="border border-white/30 p-3 text-sm text-gray-500">{rdv.demande || "Non spécifié"}</td>
                      <td className="border border-white/30 p-3 text-sm">
                        <div className="flex flex-col gap-1">
                          {rdv.status === "en attente" && (
                            <span className="px-3 py-1 text-xs bg-orange-100 text-orange-800 rounded-full font-medium">
                              En attente
                            </span>
                          )}
                          {rdv.status === "confirmé" && (
                            <span className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-medium">
                              Confirm?
                            </span>
                          )}
                          {(rdv.status === "terminé" || !isDateOnOrAfterToday(rdv.date)) && (
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                              rdv.status === "terminé" ? "text-green-600 bg-green-50" : "text-gray-600 bg-gray-50"
                            }`}>
                              {rdv.status === "terminé" ? "TerminÃ©" : "Passé"}
                            </span>
                          )}
                          {(!rdv.status || rdv.status === "à venir") && isDateOnOrAfterToday(rdv.date) && (
                            <span className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium">
                              à venir
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="border border-white/30 p-3 text-sm text-gray-500">
                        {isDateOnOrAfterToday(rdv.date) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelRdv(rdv.id)}
                            className="rounded-xl border-gray-200 text-gray-700 hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-600 hover:text-white"
                            aria-label={`Annuler le rendez-vous du ${new Date(rdv.date).toLocaleDateString("fr-FR")} ? ${
                              rdv.time
                            }`}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Annuler
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile Card Layout */}
            <div className="md:hidden space-y-4">
              {rendezVous.map((rdv) => (
                <div
                  key={rdv.id}
                  className="border border-white/30 rounded-xl p-4 bg-white/80 backdrop-blur-lg shadow-md hover:bg-gray-50/50 transition-colors"
                >
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Date:</span>
                      <p className="text-sm text-gray-500">
                        {new Date(rdv.date).toLocaleDateString("fr-FR", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Heure:</span>
                      <p className="text-sm text-gray-500">{rdv.time}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Spécialité:</span>
                      <p className="text-sm text-gray-500">{rdv.specialite}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Motif:</span>
                      <p className="text-sm text-gray-500">{rdv.demande || "Non spécifié"}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Statut:</span>
                      <div className="flex flex-col gap-1 mt-1">
                        {rdv.status === "en attente" && (
                          <span className="px-3 py-1 text-xs bg-orange-100 text-orange-800 rounded-full font-medium">
                            En attente
                          </span>
                        )}
                        {rdv.status === "confirmé" && (
                          <span className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-medium">
                            Confirm?
                          </span>
                        )}
                        {(rdv.status === "terminé" || !isDateOnOrAfterToday(rdv.date)) && (
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            rdv.status === "terminé" ? "text-green-600 bg-green-50" : "text-gray-600 bg-gray-50"
                          }`}>
                            {rdv.status === "terminé" ? "TerminÃ©" : "Passé"}
                          </span>
                        )}
                        {(!rdv.status || rdv.status === "à venir") && isDateOnOrAfterToday(rdv.date) && (
                          <span className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium">
                            à venir
                          </span>
                        )}
                      </div>
                    </div>
                    {isDateOnOrAfterToday(rdv.date) && (
                      <div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelRdv(rdv.id)}
                          className="w-full rounded-xl border-gray-200 text-gray-700 hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-600 hover:text-white"
                          aria-label={`Annuler le rendez-vous du ${new Date(rdv.date).toLocaleDateString("fr-FR")} ? ${
                            rdv.time
                          }`}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Annuler
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderMesDocumentsPage = () => {
    const documentCards = [
      {
        key: "ordonnances",
        title: "Ordonnances",
        subtitle: "Envoyees par le medecin",
        count: patientPrescriptions.length,
        icon: FileText,
        className: "from-indigo-500 to-violet-600",
      },
      {
        key: "dossier",
        title: "Dossier medical",
        subtitle: "Historique et notes",
        count: patientMedicalRecords.length,
        icon: FolderOpen,
        className: "from-cyan-500 to-sky-600",
      },
      {
        key: "paiements",
        title: "Paiements",
        subtitle: "Factures et statuts",
        count: patientPayments.length,
        icon: Wallet,
        className: "from-emerald-500 to-teal-600",
      },
    ];

    const selected = documentCards.find((card) => card.key === activeDocumentCard) || documentCards[0];

    return (
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 mt-8 w-full">
        <div className="p-6 border-b border-white/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Mes documents
          </h3>
          <Button
            variant="outline"
            className="rounded-xl border-gray-200 text-gray-700 hover:bg-gray-100"
            onClick={() => setDocumentsVersion((prev) => prev + 1)}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {documentCards.map((card) => {
              const Icon = card.icon;
              const isActive = activeDocumentCard === card.key;
              return (
                <button
                  key={card.key}
                  type="button"
                  onClick={() => setActiveDocumentCard(card.key)}
                  className={`text-left rounded-2xl p-4 border transition-all ${
                    isActive ? "border-transparent shadow-lg text-white" : "border-gray-200 bg-white hover:border-gray-300"
                  } ${isActive ? `bg-gradient-to-r ${card.className}` : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={`text-xs ${isActive ? "text-white/80" : "text-gray-500"}`}>{card.subtitle}</p>
                      <p className="text-lg font-semibold">{card.title}</p>
                    </div>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className={`mt-4 text-2xl font-bold ${isActive ? "text-white" : "text-gray-700"}`}>{card.count}</p>
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h4 className="text-lg font-semibold text-gray-700 mb-4">{selected.title}</h4>

            {activeDocumentCard === "ordonnances" && (
              <div className="space-y-3">
                {patientPrescriptions.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucune ordonnance disponible pour le moment.</p>
                ) : (
                  patientPrescriptions.map((item) => (
                    <div key={item.id || `${item.date}-${item.createdAt}`} className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                      <p className="font-medium text-gray-700">{item.doctor || "Médecin"} - {item.date ? new Date(item.date).toLocaleDateString("fr-FR") : "Date non définie"}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Médicaments: {Array.isArray(item.medications) ? item.medications.length : 0}
                      </p>
                      <p className="text-sm text-gray-600">Instructions: {item.instructions || "Aucune instruction"}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {item.sentAt ? `Envoyée le ${new Date(item.sentAt).toLocaleString("fr-FR")}` : "Non marquée comme envoyée"}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeDocumentCard === "dossier" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
                  <Input placeholder="Titre" value={docForm.title} onChange={(e) => setDocForm((p) => ({ ...p, title: e.target.value }))} />
                  <Input placeholder="Description" value={docForm.description} onChange={(e) => setDocForm((p) => ({ ...p, description: e.target.value }))} />
                  <Input type="date" placeholder="Date" value={docForm.date} onChange={(e) => setDocForm((p) => ({ ...p, date: e.target.value }))} />
                  <Button onClick={async () => {
                    if (!docForm.title.trim()) return;
                    try {
                      if (editingDocId) {
                        await updateMedicalRecord(editingDocId, { title: docForm.title, description: docForm.description, date: docForm.date, type: "patient_note" });
                        toast.success('Document mis à jour');
                      } else {
                        await addMedicalRecord({ title: docForm.title, description: docForm.description, date: docForm.date, type: "patient_note" });
                        toast.success('Document ajouté');
                      }
                      setDocForm({ title: "", description: "", date: "" });
                      setEditingDocId(null);
                    } catch (e) {
                      console.error(e);
                      toast.error('Erreur sauvegarde');
                    }
                  }} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Plus className="w-4 h-4 mr-2" /> {editingDocId ? 'Modifier' : 'Ajouter'}
                  </Button>
                </div>
                <div className="rounded-xl border border-cyan-100 bg-cyan-50/40 p-4">
                  <p className="font-medium text-gray-700">
                    {`${profile.nom || ""} ${profile.prenom || ""}`.trim() || currentUser?.username || "Patient"}
                  </p>
                  <p className="text-sm text-gray-600">Email: {profile.email || "Non defini"}</p>
                  <p className="text-sm text-gray-600">Telephone: {profile.telephone || "Non defini"}</p>
                </div>
                {patientMedicalRecords.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 p-4">
                    <p className="text-sm text-gray-600">Aucun dossier medical partage actuellement.</p>
                    <p className="text-sm text-gray-500 mt-1">Les consultations et comptes-rendus apparaitront ici quand ils seront publies.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {patientMedicalRecords.map((record, index) => (
                      <div key={record.id || `record-${index}`} className="rounded-xl border border-cyan-100 bg-cyan-50/50 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-medium text-gray-700">{record.title || record.type || "Compte-rendu médical"}</p>
                            <p className="text-sm text-gray-600 mt-1">{record.description || record.notes || "Aucun détail."}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              {record.date ? new Date(record.date).toLocaleDateString("fr-FR") : "Date non définie"}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              className="rounded-xl"
                              onClick={() => {
                                setEditingDocId(record.id);
                                setDocForm({
                                  title: record.title || "",
                                  description: record.description || "",
                                  date: record.date || "",
                                });
                              }}
                            >
                              Modifier
                            </Button>
                            <Button
                              variant="outline"
                              className="rounded-xl border-red-200 text-red-700 hover:bg-red-50"
                              onClick={async () => {
                                if (!window.confirm("Supprimer ce document ?")) return;
                                try {
                                  await deleteMedicalRecord(record.id);
                                  if (editingDocId === record.id) {
                                    setEditingDocId(null);
                                    setDocForm({ title: "", description: "", date: "" });
                                  }
                                  toast.success("Document supprimé");
                                } catch (error) {
                                  console.error(error);
                                  toast.error("Erreur suppression");
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Supprimer
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeDocumentCard === "paiements" && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
                  <Input
                    type="number"
                    min="0"
                    placeholder="Montant"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
                  />
                  <Input
                    placeholder="Description"
                    value={paymentForm.description}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, description: e.target.value }))}
                  />
                  <select
                    value={paymentForm.status}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="rounded-xl border border-gray-200 px-3 py-2"
                  >
                    <option value="en_attente">En attente</option>
                    <option value="paye">Payé</option>
                    <option value="annule">Annulé</option>
                  </select>
                  <Button
                    onClick={async () => {
                      if (!String(paymentForm.amount).trim()) return;
                      try {
                        const payload = {
                          amount: Number(paymentForm.amount),
                          description: paymentForm.description,
                          status: paymentForm.status,
                        };
                        if (editingPaymentId) {
                          await updatePayment(editingPaymentId, payload);
                          toast.success("Paiement mis à jour");
                        } else {
                          await addPayment(payload);
                          toast.success("Paiement ajouté");
                        }
                        setPaymentForm({ amount: "", description: "", status: "en_attente" });
                        setEditingPaymentId(null);
                      } catch (error) {
                        console.error(error);
                        toast.error("Erreur sauvegarde paiement");
                      }
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {editingPaymentId ? "Modifier" : "Ajouter"}
                  </Button>
                </div>
                {patientPayments.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucun paiement enregistre pour le moment.</p>
                ) : (
                  patientPayments.map((payment) => {
                    const status = payment.status || "en_attente";
                    const statusClass =
                      status === "paye"
                        ? "bg-emerald-100 text-emerald-700"
                        : status === "annule"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700";
                    const statusLabel = status === "paye" ? "Paye" : status === "annule" ? "Annule" : "En attente";
                    return (
                      <div key={payment.id || payment.reference} className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <p className="font-medium text-gray-700">{Number(payment.amount || 0).toLocaleString("fr-FR")} Ar</p>
                          <Badge className={statusClass}>{statusLabel}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{payment.description || "Aucune description"}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {payment.date ? new Date(payment.date).toLocaleDateString("fr-FR") : "Date non définie"}
                        </p>
                        <div className="mt-3 flex gap-2">
                          <Button
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => {
                              setEditingPaymentId(payment.id);
                              setPaymentForm({
                                amount: String(payment.amount || ""),
                                description: payment.description || "",
                                status: payment.status || "en_attente",
                              });
                            }}
                          >
                            Modifier
                          </Button>
                          <Button
                            variant="outline"
                            className="rounded-xl border-red-200 text-red-700 hover:bg-red-50"
                            onClick={async () => {
                              if (!window.confirm("Supprimer ce paiement ?")) return;
                              try {
                                await deletePayment(payment.id);
                                if (editingPaymentId === payment.id) {
                                  setEditingPaymentId(null);
                                  setPaymentForm({ amount: "", description: "", status: "en_attente" });
                                }
                                toast.success("Paiement supprimé");
                              } catch (error) {
                                console.error(error);
                                toast.error("Erreur suppression paiement");
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTeleconsultationPage = () => {
    const upcomingAppointments = rendezVous
      .filter((rdv) => isDateOnOrAfterToday(rdv.date))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return (
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 mt-8 w-full">
        <div className="p-6 border-b border-white/30">
          <h3 className="text-xl font-semibold text-gray-700 text-center w-full flex items-center justify-center gap-2">
            <Video className="w-5 h-5" />
            Teleconsultation
          </h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              className="h-14 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-600 hover:to-cyan-700 text-white"
              onClick={() => {
                navigateTo("messagerie");
                addToHistory("Teleconsultation", "Acces direct a la messagerie depuis teleconsultation");
              }}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Ouvrir la messagerie medecin
            </Button>
            <Button
              variant="outline"
              className="h-14 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-100"
              onClick={() => setSecondaryView("mesRdv")}
            >
              <CalendarCheck className="w-4 h-4 mr-2" />
              Voir mes RDV teleconsultation
            </Button>
          </div>

          <div className="rounded-2xl border border-gray-200 p-4">
            <h4 className="font-semibold text-gray-700 mb-3">Sessions a venir</h4>
            {upcomingAppointments.length === 0 ? (
              <p className="text-sm text-gray-500">Aucune session de teleconsultation planifiee.</p>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map((rdv) => (
                  <div key={rdv.id} className="rounded-xl border border-sky-100 bg-sky-50/50 p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-700">{rdv.specialite || "Consultation"}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(rdv.date).toLocaleDateString("fr-FR")} a {rdv.time}
                      </p>
                      <p className="text-sm text-gray-500">{rdv.demande || "Motif non specifie"}</p>
                    </div>
                    <Button
                      className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                      onClick={() => {
                        toast.info("Session teleconsultation", { description: "Passage vers la messagerie en attendant la video integree." });
                        navigateTo("messagerie");
                        addToHistory("Teleconsultation", `Demarrage teleconsultation du ${rdv.date} a ${rdv.time}`);
                      }}
                    >
                      Demarrer
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderStatsPatientPage = () => (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 mt-8 w-full">
      <div className="p-6 border-b border-white/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Statistiques patient (temps reel)
        </h3>
        <Button
          variant="outline"
          className="rounded-xl border-gray-200 text-gray-700 hover:bg-gray-100"
          onClick={() => {
            setDocumentsVersion((prev) => prev + 1);
            setSportsVersion((prev) => prev + 1);
            setHistoryVersion((prev) => prev + 1);
            setLastPatientStatsRefresh(new Date().toISOString());
            fetchAppointments(true);
          }}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Rafraichir
        </Button>
      </div>
      <div className="p-6 space-y-6">
        <p className="text-xs text-gray-500">
          Derniere synchronisation: {lastPatientStatsRefresh ? new Date(lastPatientStatsRefresh).toLocaleTimeString("fr-FR") : "--:--:--"}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-gray-200 p-4">
            <h4 className="font-semibold text-gray-700 mb-3">Diagramme global</h4>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statsOverviewChartData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={4}>
                    {statsOverviewChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 p-4">
            <h4 className="font-semibold text-gray-700 mb-3">Repartition des rendez-vous</h4>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rdvStatusChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-gray-200 p-4">
            <h4 className="font-semibold text-gray-700 mb-3">Diagramme paiements (Ar)</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${Number(value || 0).toLocaleString("fr-FR")} Ar`} />
                  <Bar dataKey="amount" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 p-4">
            <h4 className="font-semibold text-gray-700 mb-3">Indicateurs rapides</h4>
            <div className="space-y-2 text-sm">
              <p className="flex items-center justify-between"><span>Total RDV</span><span className="font-medium">{patientStats.totalRdv}</span></p>
              <p className="flex items-center justify-between"><span>Documents</span><span className="font-medium">{patientStats.documentsCount}</span></p>
              <p className="flex items-center justify-between"><span>Activites sportives</span><span className="font-medium">{patientStats.activitiesCount}</span></p>
              <p className="flex items-center justify-between"><span>Paiements enregistres</span><span className="font-medium">{patientStats.paymentsCount}</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPatientActivitiesPage = () => (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 mt-8 w-full">
      <div className="p-6 border-b border-white/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Activites sportives pratiquees
        </h3>
        <Button
          variant="outline"
          className="rounded-xl border-gray-200 text-gray-700 hover:bg-gray-100"
          onClick={() => setSportsVersion((prev) => prev + 1)}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>
      <div className="p-6 space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h4 className="font-semibold text-gray-700 mb-4">Ajouter une activite sportive</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="mb-2 block text-sm font-medium text-gray-700">Sport</Label>
              <Input
                value={sportActivityForm.sport}
                onChange={(e) => setSportActivityForm((prev) => ({ ...prev, sport: e.target.value }))}
                placeholder="Ex: Course, Football, Yoga"
                className="rounded-xl"
              />
            </div>
            <div>
              <Label className="mb-2 block text-sm font-medium text-gray-700">Duree (minutes)</Label>
              <Input
                type="number"
                min="1"
                value={sportActivityForm.duration}
                onChange={(e) => setSportActivityForm((prev) => ({ ...prev, duration: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div>
              <Label className="mb-2 block text-sm font-medium text-gray-700">Date</Label>
              <Input
                type="date"
                value={sportActivityForm.date}
                onChange={(e) => setSportActivityForm((prev) => ({ ...prev, date: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div>
              <Label className="mb-2 block text-sm font-medium text-gray-700">Intensite</Label>
              <select
                value={sportActivityForm.intensity}
                onChange={(e) => setSportActivityForm((prev) => ({ ...prev, intensity: e.target.value }))}
                className="w-full rounded-xl px-4 py-3 border border-gray-200"
              >
                <option value="faible">Faible</option>
                <option value="moderee">Moderee</option>
                <option value="intense">Intense</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <Label className="mb-2 block text-sm font-medium text-gray-700">Note</Label>
              <Input
                value={sportActivityForm.note}
                onChange={(e) => setSportActivityForm((prev) => ({ ...prev, note: e.target.value }))}
                placeholder="Commentaire optionnel"
                className="rounded-xl"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-xl"
              onClick={addSportActivity}
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </div>

        {patientSportActivities.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune activite sportive enregistree pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {patientSportActivities.map((item) => (
              <div key={item.id} className="rounded-xl border border-rose-100 bg-rose-50/40 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-700">{item.sport}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {item.duration} min - Intensite: {item.intensity || "moderee"} - {item.date ? new Date(item.date).toLocaleDateString("fr-FR") : "Date non definie"}
                  </p>
                  {item.note ? <p className="text-sm text-gray-500 mt-1">{item.note}</p> : null}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl border-red-200 text-red-600 hover:bg-red-600 hover:text-white"
                  onClick={() => deleteSportActivity(item.id)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Supprimer
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderMessageriePage = () => (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 mt-8 w-full">
      <div className="p-6 border-b border-white/30">
        <h3 className="text-xl font-semibold text-gray-700 text-center w-full flex items-center justify-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Messagerie
        </h3>
      </div>
      <div className="p-6">
        <MessagingPanel
          currentUser={currentUser}
          userRole="patient"
          addToHistory={addToHistory}
        />
      </div>
    </div>
  );

  const renderProfilPage = () => (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 mt-8 w-full">
      <div className="p-6 border-b border-white/30">
        <h3 className="text-xl font-semibold text-gray-700 text-center w-full flex items-center justify-center gap-2">
          <User className="w-5 h-5" />
          Mon profil
        </h3>
      </div>
      <div className="p-6">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h4 className="text-lg font-medium text-gray-700 text-center w-full flex items-center justify-center gap-2">
              <Settings className="w-5 h-5" />
              Informations personnelles
            </h4>
            <div className="space-y-4">
              {editProfile ? (
                <>
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="nom">Nom</Label>
                    <Input
                      id="nom"
                      name="nom"
                      value={editProfile.nom || ""}
                      onChange={handleProfileChange}
                      className="w-full rounded-xl px-5 py-4 border border-gray-200 focus:ring-4 focus:ring-blue-500/50 focus:outline-none transition-all"
                      aria-required="true"
                    />
                  </div>
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="prenom">Prénom</Label>
                    <Input
                      id="prenom"
                      name="prenom"
                      value={editProfile.prenom || ""}
                      onChange={handleProfileChange}
                      className="w-full rounded-xl px-5 py-4 border border-gray-200 focus:ring-4 focus:ring-blue-500/50 focus:outline-none transition-all"
                      aria-required="true"
                    />
                  </div>
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="dateNaissance">Date de naissance</Label>
                    <Input
                      id="dateNaissance"
                      name="dateNaissance"
                      value={editProfile.dateNaissance || ""}
                      onChange={handleProfileChange}
                      type="date"
                      className="w-full rounded-xl px-5 py-4 border border-gray-200 focus:ring-4 focus:ring-blue-500/50 focus:outline-none transition-all"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">Nom</Label>
                    <p className="text-sm text-gray-500">{profile.nom || "Non défini"}</p>
                  </div>
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">Prénom</Label>
                    <p className="text-sm text-gray-500">{profile.prenom || "Non défini"}</p>
                  </div>
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">Date de naissance</Label>
                    <p className="text-sm text-gray-500">
                      {profile.dateNaissance
                        ? new Date(profile.dateNaissance).toLocaleDateString("fr-FR")
                        : "Non défini"}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="space-y-6">
            <h4 className="text-lg font-medium text-gray-700 text-center w-full flex items-center justify-center gap-2">
              <Settings className="w-5 h-5" />
              Contact
            </h4>
            <div className="space-y-4">
              {editProfile ? (
                <>
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      value={editProfile.email || ""}
                      onChange={handleProfileChange}
                      type="email"
                      className="w-full rounded-xl px-5 py-4 border border-gray-200 focus:ring-4 focus:ring-blue-500/50 focus:outline-none transition-all"
                      aria-required="true"
                    />
                  </div>
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="telephone">Téléphone</Label>
                    <Input
                      id="telephone"
                      name="telephone"
                      value={editProfile.telephone || ""}
                      onChange={handleProfileChange}
                      type="tel"
                      className="w-full rounded-xl px-5 py-4 border border-gray-200 focus:ring-4 focus:ring-blue-500/50 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="adresse">Adresse</Label>
                    <Input
                      id="adresse"
                      name="adresse"
                      value={editProfile.adresse || ""}
                      onChange={handleProfileChange}
                      className="w-full rounded-xl px-5 py-4 border border-gray-200 focus:ring-4 focus:ring-blue-500/50 focus:outline-none transition-all"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">Email</Label>
                    <p className="text-sm text-gray-500">{profile.email || "Non défini"}</p>
                  </div>
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</Label>
                    <p className="text-sm text-gray-500">{profile.telephone || "Non défini"}</p>
                  </div>
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">Adresse</Label>
                    <p className="text-sm text-gray-500">{profile.adresse || "Non défini"}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-white/30 flex justify-end gap-4">
          {editProfile ? (
            <>
              <Button
                variant="outline"
                className="px-8 py-4 rounded-xl border-gray-200 text-gray-700 hover:bg-gradient-to-r hover:from-gray-500 hover:to-gray-600 hover:text-white transition-all duration-200 shadow-md hover:shadow-lg"
                onClick={handleCancelEdit}
                aria-label="Annuler les modifications du profil"
              >
                Annuler
              </Button>
              <Button
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                onClick={handleSaveProfile}
                aria-label="Sauvegarder les modifications du profil"
              >
                Sauvegarder
              </Button>
            </>
          ) : (
            <Button
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
              onClick={handleEditProfile}
              aria-label="Modifier le profil"
            >
              Modifier le profil
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  const renderModal = () => {
    const validateStep = (step) => {
      const newErrors = {};
      if (step === 1 && !selectedSpecialtyObj) {
        newErrors.specialty = "Veuillez sélectionner une spécialité.";
      }
      if (step === 2 && !selectedDate) {
        newErrors.date = "Veuillez sélectionner une date.";
      }
      if (step === 2 && !selectedTime) {
        newErrors.time = "Veuillez sélectionner une heure.";
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-300 animate-fade-in" aria-modal="true" role="dialog">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 p-8 w-full max-w-lg mx-4 sm:mx-6 md:max-w-2xl lg:max-w-3xl h-auto max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <button
            onClick={() => {
              setIsModalOpen(false);
              setBookingStep(1);
              setSelectedSpecialtyObj(null);
              setSelectedDate(null);
              setSelectedTime("");
              setSpecialtySearch("");
              setIsSpecialtyDropdownOpen(false);
              setErrors({});
              setAvailableSlots([]);
            }}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-full p-1"
            aria-label="Fermer la fenêtre de prise de rendez-vous"
          >
            <XIcon className="w-6 h-6" />
          </button>
          <div className="text-center">
            <h3 className="text-2xl font-semibold text-gray-700">
              Prendre un rendez-vous
            </h3>
            <div className="mt-2 h-1 w-20 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mx-auto"></div>
          </div>
          <div className="mt-6 flex justify-center gap-4">
            <span className={`text-sm font-medium ${bookingStep === 1 ? "text-blue-600" : "text-gray-400"}`}>
              1. Spécialité
            </span>
            <span className={`text-sm font-medium ${bookingStep === 2 ? "text-blue-600" : "text-gray-400"}`}>
              2. Date et heure
            </span>
            <span className={`text-sm font-medium ${bookingStep === 3 ? "text-blue-600" : "text-gray-400"}`}>
              3. Confirmation
            </span>
          </div>
          {bookingStep === 1 && (
            <div className="space-y-6 mt-6">
              <h4 className="font-semibold text-lg text-gray-700">
                Choisissez une spécialité
              </h4>
              <div className="relative">
                <Input
                  type="text"
                  value={specialtySearch}
                  onChange={(e) => setSpecialtySearch(e.target.value)}
                  onFocus={() => setIsSpecialtyDropdownOpen(true)}
                  placeholder="Rechercher une spécialité..."
                  className="w-full rounded-xl px-4 py-3 pl-10 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all"
                  aria-label="Rechercher une spécialité"
                />
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                {isSpecialtyDropdownOpen && (
                  <div className="absolute z-50 mt-2 w-full bg-white rounded-xl shadow-2xl border border-gray-200 max-h-64 overflow-y-auto">
                    {specialtiesLoading ? (
                      <p className="p-4 text-gray-500 text-center">Chargement des spécialités...</p>
                    ) : specialtiesError ? (
                      <p className="p-4 text-red-500 text-center">Erreur lors du chargement des spécialités</p>
                    ) : filteredSpecialties.length === 0 ? (
                      <p className="p-4 text-gray-500 text-center">Aucune spécialité trouvée</p>
                    ) : (
                      filteredSpecialties.map((specialty) => {
                        const IconComponent = specialty.icon;
                        return (
                          <div
                            key={specialty.id}
                            onClick={() => {
                              setSelectedSpecialtyObj(specialty);
                              setSpecialtySearch(specialty.name);
                              setIsSpecialtyDropdownOpen(false);
                              setBookingStep(2);
                              addToHistory("Sélection spécialité", `Sélection de la spécialité: ${specialty.name}`);
                            }}
                            className="cursor-pointer p-4 hover:bg-blue-50 transition-all duration-200 flex items-center gap-3"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                setSelectedSpecialtyObj(specialty);
                                setSpecialtySearch(specialty.name);
                                setIsSpecialtyDropdownOpen(false);
                                setBookingStep(2);
                                addToHistory("Sélection spécialité", `Sélection de la spécialité: ${specialty.name}`);
                              }
                            }}
                            role="option"
                            aria-selected={selectedSpecialtyObj?.id === specialty.id}
                          >
                            <IconComponent className={`w-6 h-6 ${specialty.color}`} />
                            <span className="text-sm text-gray-700">{specialty.name}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
              {errors.specialty && <p className="text-red-600 text-sm">{errors.specialty}</p>}
              <div className="mt-6 flex justify-end gap-4">
                <Button
                  variant="outline"
                  className="px-8 py-4 rounded-xl border-gray-200 text-gray-700 hover:bg-gradient-to-r hover:from-gray-500 hover:to-gray-600 hover:text-white transition-all duration-200 shadow-md hover:shadow-lg"
                  onClick={() => {
                    setIsModalOpen(false);
                    setErrors({});
                  }}
                  aria-label="Annuler la prise de rendez-vous"
                >
                  Annuler
                </Button>
                <Button
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                  onClick={() => {
                    if (validateStep(1)) {
                      setBookingStep(2);
                    } else {
                      toast.error("Veuillez sélectionner une spécialité.");
                    }
                  }}
                  aria-label="Passer Ã  la sélection de date et heure"
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}

          {bookingStep === 2 && selectedSpecialtyObj && (
            <div className="space-y-6 mt-6">
              <button
                onClick={() => {
                  setBookingStep(1);
                  setSelectedDate(null);
                  setSelectedTime("");
                  setErrors({});
                  setAvailableSlots([]);
                }}
                className="text-blue-600 hover:text-blue-700 transition-colors flex items-center"
                aria-label="Retour aux spécialités"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Retour aux spécialités
              </button>
              <h4 className="font-semibold text-lg text-gray-700">
                {selectedSpecialtyObj.name} - Choisissez une date et une heure
              </h4>
              <div className="space-y-4">
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">Date</Label>
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date) => {
                      setSelectedDate(date);
                      setSelectedTime("");
                      if (date) {
                        fetchAvailableSlots(date.toISOString().split("T")[0]);
                      }
                    }}
                    minDate={new Date()}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Sélectionner une date"
                    className="w-full rounded-xl px-4 py-3 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer"
                    wrapperClassName="w-full"
                    locale="fr"
                    aria-label="Sélectionner une date"
                  />
                  {errors.date && <p className="text-red-600 text-sm">{errors.date}</p>}
                </div>
                {selectedDate && availableSlots.length > 0 && (
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">Créneaux disponibles</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {availableSlots.map((slot, index) => (
                        <Button
                          key={`${slot.time}-${index}`}
                          variant={selectedTime === slot.time ? "default" : "outline"}
                          onClick={() => {
                            setSelectedTime(slot.time);
                          }}
                          className="rounded-xl px-4 py-3 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all duration-300"
                          aria-label={`Sélectionner l'heure ${slot.time}`}
                        >
                          {slot.time}
                        </Button>
                      ))}
                    </div>
                    {errors.time && <p className="text-red-600 text-sm">{errors.time}</p>}
                  </div>
                )}
                {selectedDate && availableSlots.length === 0 && (
                  <p className="text-red-600 text-sm">Aucun créneau disponible pour cette date.</p>
                )}
              </div>
              <div className="mt-8 flex justify-end gap-4">
                <Button
                  variant="outline"
                  className="px-8 py-4 rounded-xl border-gray-200 text-gray-700 hover:bg-gradient-to-r hover:from-gray-500 hover:to-gray-600 hover:text-white transition-all duration-200 shadow-md hover:shadow-lg"
                  onClick={() => {
                    setIsModalOpen(false);
                    setErrors({});
                  }}
                  aria-label="Annuler la prise de rendez-vous"
                >
                  Annuler
                </Button>
                <Button
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                  onClick={() => {
                    if (validateStep(2)) {
                      setBookingStep(3);
                    } else {
                      toast.error("Veuillez sélectionner une date et une heure.");
                    }
                  }}
                  disabled={!selectedDate || !selectedTime}
                  aria-label="Passer Ã  la confirmation"
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}

          {bookingStep === 3 && selectedSpecialtyObj && selectedDate && selectedTime && (
            <div className="space-y-6 mt-6">
              <button
                onClick={() => {
                  setBookingStep(2);
                  setErrors({});
                }}
                className="text-blue-600 hover:text-blue-700 transition-colors flex items-center"
                aria-label="Retour Ã  la sélection de date et heure"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Retour
              </button>
              <h4 className="font-semibold text-lg text-gray-700">
                Confirmer votre rendez-vous
              </h4>
              <div className="space-y-4">
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">Spécialité</Label>
                  <p className="text-sm text-gray-500">{selectedSpecialtyObj.name}</p>
                </div>
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">Date</Label>
                  <p className="text-sm text-gray-500">
                    {new Date(selectedDate).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">Heure</Label>
                  <p className="text-sm text-gray-500">{selectedTime}</p>
                </div>
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">Motif de consultation (optionnel)</Label>
                  <Input
                    type="text"
                    value={demande}
                    onChange={(e) => setDemande(e.target.value)}
                    placeholder="Ex: Consultation de suivi, vaccination..."
                    className="w-full rounded-xl px-4 py-3 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all"
                    aria-label="Motif de consultation"
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-4">
                <Button
                  variant="outline"
                  className="px-8 py-4 rounded-xl border-gray-200 text-gray-700 hover:bg-gradient-to-r hover:from-gray-500 hover:to-gray-600 hover:text-white transition-all duration-200 shadow-md hover:shadow-lg"
                  onClick={() => {
                    setIsModalOpen(false);
                    setErrors({});
                  }}
                  aria-label="Annuler la prise de rendez-vous"
                >
                  Annuler
                </Button>
                <Button
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                  onClick={handleAddRdv}
                  aria-label="Confirmer le rendez-vous"
                >
                  Confirmer
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-cyan-50 via-blue-100 to-emerald-50 relative">
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-cyan-200 to-blue-300 rounded-full opacity-30 animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-emerald-200 to-cyan-300 rounded-full opacity-20 animate-bounce"></div>
      <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-gradient-to-br from-blue-200 to-emerald-200 rounded-full opacity-25 animate-ping"></div>
      {renderSidebar()}
      <div className={`md:ml-64 relative z-10 flex flex-col min-h-screen w-full md:w-[calc(100%-256px)] p-4 ${isSidebarOpen ? 'md:blur-none blur-sm' : ''}`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 w-full max-w-[calc(100%-2rem)]">
          {renderHeader()}
          {secondaryView === "accueil" && renderAccueilPage()}
          {secondaryView === "mesRdv" && renderMesRdvPage()}
          {secondaryView === "mesDocuments" && renderMesDocumentsPage()}
          {secondaryView === "statsPatient" && renderStatsPatientPage()}
          {secondaryView === "messagerie" && renderMessageriePage()}
          {secondaryView === "profil" && renderProfilPage()}
          {secondaryView === "prendreRdv" && renderAccueilPage()}
          {isModalOpen && renderModal()}
        </div>
      </div>
    </main>
  );
};

export default PatientDashboard;
