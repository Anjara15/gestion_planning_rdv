import { useEffect, useState, useCallback, useMemo, Component } from "react";
import { toast } from "sonner";
import { Users2, CalendarCheck, X, Clock, User, Calendar, FileText, Settings, Plus, Edit, Trash2, Menu, X as XIcon, LogOut, BarChart3, Home, AlertTriangle, MessageSquare, FilePlus2, CreditCard, History, Pill } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PropTypes from "prop-types";
import EnhancedConsultationsPage from "./Historiques/ConsultationForm";
import OrdonnancesPage from "./Historiques/OrdonnancesPage";
import PatientMedicalFile from "./Historiques/PatientMedicalFile";
import MessagingPanel from "@/components/MessagingPanel";
import MedecinPaymentsPage from "./MedecinPaymentsPage";
import MedecinActivityHistory from "./section/MedecinActivityHistory";
import MedecinMedicamentsPage from "./MedecinMedicamentsPage";
import DatePicker from "react-datepicker";
import fr from "date-fns/locale/fr";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Error Boundary to catch rendering errors
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <h3 className="text-lg font-semibold text-red-700">Une erreur est survenue</h3>
          <p className="text-sm text-red-600">{this.state.error?.message || "Erreur inconnue"}</p>
          <Button
            className="mt-4 bg-red-600 text-white"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            RÃ©essayer
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node,
};

// For Vite projects, use import.meta.env
const _apiBaseRaw = import.meta.env.VITE_API_URL || "http://localhost:3000";
const _apiBase = String(_apiBaseRaw).replace(/\/+$/, "");
const API_BASE_URL = _apiBase.endsWith("/api") ? _apiBase : `${_apiBase}/api`;

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 transition-all duration-300 animate-fade-in overflow-y-auto">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-full p-2"
        aria-label="Fermer"
      >
        <X className="w-6 h-6" />
      </button>
      <div className="p-4 w-full max-w-4xl mx-2 sm:mx-4 min-h-[50vh] max-h-[90vh] overflow-y-auto">{children}</div>
    </div>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node,
};

const MedecinDashboard = ({ currentUser, addToHistory, logout }) => {
  const [patients, setPatients] = useState([]);
  const [rdvDuJour, setRdvDuJour] = useState([]);
  const [urgences, setUrgences] = useState([]);
  const [medecin, setMedecin] = useState(null);
  const [secondaryView, setSecondaryView] = useState("accueil");
  const [profilData, setProfilData] = useState({
    username: "",
    specialite: "",
    numero_ordre: "",
    email: "",
    telephone: "",
    adresse: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [creneauData, setCreneauData] = useState({
    date: null,
    heureDebut: "09:00",
    heureFin: "17:00",
    dureeConsultation: "30",
    typeConsultation: "consultation",
    salleConsultation: "Salle 1",
    maxPatients: "8",
  });
  const [creneaux, setCreneaux] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [lastStatsRefresh, setLastStatsRefresh] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));
  const navigate = useNavigate();

  // Map API time slot (snake_case) to UI (camelCase)
  const mapSlotApiToUi = (s) => ({
    id: s.id,
    date: s.date,
    heureDebut: s.heure_debut,
    heureFin: s.heure_fin,
    dureeConsultation: s.duree_consultation,
    typeConsultation: s.type_consultation,
    salleConsultation: s.salle_consultation,
    maxPatients: s.max_patients,
  });

  const getAppointmentStatus = (date, time) => {
    const now = new Date();
    const appointmentDateTime = new Date(`${date}T${time}:00`);
    const timeDiff = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60);

    if (timeDiff > 30) {
      return { status: "En attente", color: "text-blue-600 bg-blue-50" };
    } else if (timeDiff >= -30 && timeDiff <= 30) {
      return { status: "En cours", color: "text-green-600 bg-green-50" };
    } else {
      return { status: "TerminÃ©", color: "text-gray-600 bg-gray-50" };
    }
  };

  const axiosInstance = useMemo(() => {
    return axios.create({
      baseURL: API_BASE_URL,
    });
  }, []);

  // Register interceptors once to avoid duplicates at each render.
  useEffect(() => {
    const requestId = axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          console.warn(`[Request] ${config.method?.toUpperCase()} ${config.url} - No token found in localStorage`);
        }
        return config;
      },
      (error) => {
        console.error("[Interceptor Error]", error);
        return Promise.reject(error);
      }
    );

    const responseId = axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          setIsAuthenticated(false);
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          navigate("/");
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axiosInstance.interceptors.request.eject(requestId);
      axiosInstance.interceptors.response.eject(responseId);
    };
  }, [axiosInstance, navigate]);
  const loadAppointmentsAndAlerts = useCallback(async () => {
    if (!isAuthenticated) {
      console.log("[loadAppointmentsAndAlerts] Skipping API calls: User is not authenticated");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("[loadAppointmentsAndAlerts] Token missing in localStorage");
      toast.error("Erreur d'authentification", {
        description: "Token manquant. Veuillez vous reconnecter.",
      });
      setIsAuthenticated(false);
      navigate("/");
      return;
    }

    try {
      // Fetch medecin profile
      const medecinResponse = await axiosInstance.get("/auth/me");
      const medecinProfile = {
        username: medecinResponse.data.username || "Dr. Martin",
        specialite: medecinResponse.data.specialite || "Cardiologie",
        email: medecinResponse.data.email || "dr.martin@hopital.com",
        telephone: medecinResponse.data.telephone || "01 23 45 67 89",
        adresse: medecinResponse.data.adresse || "123 Rue de la SantÃ©, 75014 Paris",
        numero_ordre: medecinResponse.data.numero_ordre || "12345678",
      };
      setMedecin(medecinProfile);
      setProfilData(medecinProfile);

      // Fetch patients
      const usersResponse = await axiosInstance.get("/auth/users?role=patient");
      const patientList = usersResponse.data.map((user) => ({
        id: user.id,
        username: user.username,
        age: user.age || "Inconnu",
        email: user.email || "N/A",
        telephone: user.telephone || "N/A",
      }));
      setPatients(patientList);

      // Fetch appointments for today
      const today = new Date().toISOString().split("T")[0];
            const appointmentsResponse = await axiosInstance.get(`/appointments?date=${today}`);
      const rdvToday = appointmentsResponse.data
        .map((rdv) => ({
          id: rdv.id,
          // support both response shapes: patient object or flattened fields
          patientId: rdv.patient?.id || rdv.patient_id || rdv.patientId || null,
          username: (rdv.patient && rdv.patient.username) || rdv.username || rdv.patient_name || "Inconnu",
          age:
            usersResponse.data.find((user) => user.username === ((rdv.patient && rdv.patient.username) || rdv.username))?.age ||
            "Inconnu",
          email: (rdv.patient && rdv.patient.email) || rdv.email || "N/A",
          time: rdv.time,
          date: rdv.date,
          isNew: rdv.isNew || rdv.is_new || false,
          motif: rdv.demande || rdv.demande || "Non spÃ©cifiÃ©",
          typeConsultation: rdv.type_consultation || rdv.typeConsultation || "consultation",
          medecinId: rdv.medecin_id || rdv.medecinId || rdv.medecin?.id || rdv.medecin || null,
          statusInfo: getAppointmentStatus(rdv.date, rdv.heure || rdv.time),
        }));

      // Separate urgent appointments
      const urgentAppointments = rdvToday.filter((rdv) => rdv.typeConsultation === "urgence");
      const regularAppointments = rdvToday.filter((rdv) => rdv.typeConsultation !== "urgence");
      setUrgences(urgentAppointments);
      setRdvDuJour(regularAppointments);

      // Fetch time slots
      const slotsResponse = await axiosInstance.get("/time-slots");
      // Backend returns { items, total, ... } - map the items array (fallback to empty array) map the items array (fallback to empty array)
      setCreneaux(((slotsResponse.data && slotsResponse.data.items) || []).map(mapSlotApiToUi));
    } catch (error) {
      console.error("[loadAppointmentsAndAlerts] Error loading data:", error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || "Erreur inconnue";
      toast.error("Erreur lors du chargement des donnÃ©es", {
        description: errorMessage,
      });
    }
  }, [isAuthenticated, navigate, axiosInstance]);

  useEffect(() => {
    let isMounted = true;

    if (isAuthenticated && isMounted) {
      loadAppointmentsAndAlerts();
      addToHistory?.("Connexion", `Connexion au tableau de bord mÃ©decin`, currentUser);
    }

    return () => {
      isMounted = false;
    };
  }, [loadAppointmentsAndAlerts, addToHistory, currentUser, isAuthenticated]);

  const navigateTo = (view) => {
    setSecondaryView(view);
    setIsSidebarOpen(false);
    addToHistory?.("Navigation", `AccÃ¨s ? la vue ${view}`, currentUser);
  };

  const handleProfilChange = (field, value) => {
    setProfilData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveProfil = async () => {
    if (!isAuthenticated) return;

    try {
      await axiosInstance.put("/auth/me", profilData);
      setMedecin((prev) => ({ ...prev, ...profilData }));
      addToHistory?.("Mise Ã  jour profil", "Sauvegarde des modifications du profil", currentUser);
      setSecondaryView("accueil");
      toast.success("Profil mis Ã  jour", { description: "Les informations du profil ont Ã©tÃ© sauvegardÃ©es." });
    } catch (error) {
      console.error("[handleSaveProfil] Error saving profile:", error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || "Erreur inconnue";
      toast.error("Erreur lors de la sauvegarde du profil", {
        description: errorMessage,
      });
    }
  };

  const handleCreneauInputChange = (field, value) => {
    setCreneauData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveCreneau = async () => {
    if (!isAuthenticated) return;

    try {
      const username = currentUser?.username || "Dr. Martin";
      const dataToSave = {
        ...creneauData,
        date: creneauData.date ? creneauData.date.toISOString().split("T")[0] : "",
        medecin: username,
      };

      if (editingId) {
        const response = await axiosInstance.put(`/time-slots/${editingId}`, dataToSave);
        const updated = mapSlotApiToUi(response.data);
        setCreneaux((prev) => prev.map((c) => (c.id === editingId ? updated : c)));
        setSuccessMessage("CrÃ©neau modifiÃ© avec succÃ¨s !");
        setEditingId(null);
        addToHistory?.("Modification crÃ©neau", "Modification d'un crÃ©neau existant", currentUser);
        toast.success("CrÃ©neau modifiÃ©", {
          description: `${dataToSave.date} â€¢ ${dataToSave.heureDebut} - ${dataToSave.heureFin}`,
        });
      } else {
        const response = await axiosInstance.post("/time-slots", dataToSave);
        const created = mapSlotApiToUi(response.data);
        setCreneaux((prev) => [...prev, created]);
        setSuccessMessage("CrÃ©neau ajoutÃ© avec succÃ¨s !");
        addToHistory?.("CrÃ©ation crÃ©neau", "CrÃ©ation d'un nouveau crÃ©neau", currentUser);
        toast.success("CrÃ©neau ajoutÃ©", {
          description: `${dataToSave.date} â€¢ ${dataToSave.heureDebut} - ${dataToSave.heureFin}`,
        });
      }

      setShowSuccess(true);
      setSecondaryView("planning");
      setCreneauData({
        date: null,
        heureDebut: "09:00",
        heureFin: "17:00",
        dureeConsultation: "30",
        typeConsultation: "consultation",
        salleConsultation: "Salle 1",
        maxPatients: "8",
      });
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("[handleSaveCreneau] Error saving creneau:", error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || "Erreur inconnue";
      toast.error("Erreur lors de la sauvegarde du crÃ©neau", {
        description: errorMessage,
      });
    }
  };

  const handleEditCreneau = (c) => {
    if (!isAuthenticated) return;

    setCreneauData({
      ...c,
      date: c.date ? new Date(c.date) : null,
    });
    setEditingId(c.id);
    setSecondaryView("creneauForm");
    addToHistory?.("Ã‰dition crÃ©neau", "Ouverture de l'Ã©dition d'un crÃ©neau", currentUser);
  };

  const handleDeleteCreneau = async (id) => {
    if (!isAuthenticated) return;

    try {
      await axiosInstance.delete(`/time-slots/${id}`);
      setCreneaux((prev) => prev.filter((c) => c.id !== id));
      setSuccessMessage("CrÃ©neau supprimÃ© avec succÃ¨s !");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      addToHistory?.("Suppression crÃ©neau", "Suppression d'un crÃ©neau", currentUser);
      toast.success("CrÃ©neau supprimÃ©", { description: "Le crÃ©neau a Ã©tÃ© retirÃ© du planning." });
    } catch (error) {
      console.error("[handleDeleteCreneau] Error deleting creneau:", error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || "Erreur inconnue";
      toast.error("Erreur lors de la suppression du crÃ©neau", {
        description: errorMessage,
      });
    }
  };

  const handleLogout = () => {
    console.log("[handleLogout] Logging out...");
    addToHistory?.("DÃ©connexion", "DÃ©connexion du tableau de bord mÃ©decin", currentUser);
    logout?.();
    setIsAuthenticated(false);
    setPatients([]);
    setRdvDuJour([]);
    setUrgences([]);
    setCreneaux([]);
    setMedecin(null);
    setStats(null);
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
    toast.success("DÃ©connexion rÃ©ussie", { description: "Vous avez Ã©tÃ© dÃ©connectÃ©." });
  };

  const handleStartRdv = async (rdv) => {
    if (!isAuthenticated) return;

    try {
      // mark as seen / started by setting is_new to false
      await axiosInstance.put(`/appointments/${rdv.id}`, {
        patient_id: rdv.patientId,
        date: rdv.date,
        time: rdv.time,
        specialite: medecin?.specialite || currentUser?.specialite,
        demande: rdv.motif,
        is_new: false,
      });
      // refresh the list
      await loadAppointmentsAndAlerts();
      toast.success(`Rendez-vous dÃ©marrÃ© pour ${rdv.username}`);
      addToHistory?.("Action rendez-vous", `DÃ©marrage du rendez-vous pour ${rdv.username} Ã  ${rdv.time}`, currentUser);
    } catch (err) {
      console.error("[handleStartRdv] Error:", err);
      const errorMessage = err.response?.data?.error || err.message || "Erreur inconnue";
      toast.error("Impossible de dÃ©marrer le rendez-vous", { description: errorMessage });
    }
  };

  const handlePostponeRdv = async (rdv) => {
    if (!isAuthenticated) return;

    try {
      const newDate = window.prompt("Nouvelle date (YYYY-MM-DD)", rdv.date);
      if (!newDate) return;
      const newTime = window.prompt("Nouvelle heure (HH:MM)", rdv.time);
      if (!newTime) return;

      await axiosInstance.put(`/appointments/${rdv.id}`, {
        patient_id: rdv.patientId,
        date: newDate,
        time: newTime,
        specialite: medecin?.specialite || currentUser?.specialite,
        demande: rdv.motif,
        is_new: false,
      });

      await loadAppointmentsAndAlerts();
      toast.success(`Rendez-vous reportÃ© pour ${rdv.username} -> ${newDate} ${newTime}`);
      addToHistory?.("Action rendez-vous", `Report du rendez-vous pour ${rdv.username} Ã  ${newDate} ${newTime}`, currentUser);
    } catch (err) {
      console.error("[handlePostponeRdv] Error:", err);
      const errorMessage = err.response?.data?.error || err.message || "Erreur inconnue";
      toast.error("Impossible de reporter le rendez-vous", { description: errorMessage });
    }
  };

  const navItems = useMemo(
    () =>
      [
        { view: "accueil", icon: Home, label: "Accueil" },
        { view: "activites", icon: History, label: "Historique d'activites" },
        { view: "consultations", icon: FileText, label: "Consultations" },
        { view: "messagerie", icon: MessageSquare, label: "Messagerie" },
        { view: "ordonnances", icon: FilePlus2, label: "Ordonnances" },
        { view: "patients", icon: Users2, label: "Patients" },
        { view: "planning", icon: Calendar, label: "Planning" },
        { view: "rdv", icon: CalendarCheck, label: "RDV du jour" },
        { view: "stats", icon: BarChart3, label: "Statistiques" },
        { view: "urgences", icon: AlertTriangle, label: "Urgences" },
      ].sort((a, b) => a.label.localeCompare(b.label, "fr", { sensitivity: "base" })),
    []
  );

  const renderSidebar = () => (
    <>
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <XIcon className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white/80 backdrop-blur-lg shadow-xl transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col border-r border-white/30`}
      >
        <div className="p-4 border-b border-white/30">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-700">Tableau de bord</h2>
          <p className="text-sm text-gray-500">Dr. {medecin?.username || "MÃ©decin"}</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map(({ view, icon: Icon, label }) => (
            <Button
              key={view}
              variant={secondaryView === view || (view === "planning" && secondaryView === "creneauForm") ? "default" : "ghost"}
              className={`w-full justify-start gap-2 rounded-xl text-sm ${secondaryView === view || (view === "planning" && secondaryView === "creneauForm") ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white" : "text-gray-700"} hover:bg-gradient-to-r hover:from-cyan-600 hover:to-blue-700 hover:text-white transition-all duration-300`}
              onClick={() => navigateTo(view)}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Button>
          ))}
        </nav>
      </div>
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </>
  );

  const renderAccueilPage = () => {
    const upcomingCreneaux = creneaux
      .filter((c) => new Date(c.date) >= new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 3);
    const appointmentsByMonth = Array.isArray(stats?.appointmentsByMonth) ? stats.appointmentsByMonth : [];
    const consultationsByMonth = Array.isArray(stats?.consultationsByMonth) ? stats?.consultationsByMonth : [];
    const totalConsultations = consultationsByMonth.reduce((acc, item) => acc + Number(item.count || 0), 0);
    const accueilStatCards = [
      { title: "Patients suivis", value: Number(stats?.totalPatients ?? patients.length ?? 0), hint: "Base active de patients", gradient: "from-cyan-500 to-blue-600" },
      { title: "RDV planifiés", value: Number(stats?.totalAppointments ?? appointmentsByMonth.reduce((acc, item) => acc + Number(item.count || 0), 0)), hint: "Volume global de rendez-vous", gradient: "from-emerald-500 to-teal-600" },
      { title: "Consultations", value: totalConsultations, hint: "Consultations enregistrées", gradient: "from-amber-500 to-orange-600" },
      { title: "Urgences", value: urgences.length, hint: "Situations à surveiller", gradient: "from-rose-500 to-red-600" },
    ];

    return (
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 mt-8 w-full">
        <div className="p-4 sm:p-6 border-b border-white/30">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-700 text-center flex items-center justify-center gap-2">
            <Home className="w-5 h-5" />
            Accueil
          </h3>
        </div>
        <div className="p-4 sm:p-6">
          <div className="mb-8 rounded-2xl border border-cyan-100 bg-gradient-to-r from-cyan-50 via-white to-emerald-50 p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-600">Introduction rapide</p>
                <h4 className="mt-2 text-2xl font-bold text-gray-800">Statistiques clés du cabinet</h4>
                <p className="mt-2 text-sm text-gray-500">Vue immédiate de l'activité médicale avant d'entrer dans les autres modules.</p>
              </div>
              <Button
                variant="outline"
                className="rounded-xl border-cyan-200 text-cyan-700 hover:bg-cyan-50"
                onClick={() => navigateTo("stats")}
              >
                Ouvrir les statistiques détaillées
              </Button>
            </div>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {accueilStatCards.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/60 bg-white/90 p-4 shadow-sm">
                  <div className={`inline-flex rounded-full bg-gradient-to-r px-3 py-1 text-xs font-semibold text-white ${item.gradient}`}>
                    {item.title}
                  </div>
                  <p className="mt-4 text-3xl font-bold text-gray-800">{item.value}</p>
                  <p className="mt-2 text-sm text-gray-500">{item.hint}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-gray-500">
              Dernière synchronisation: {lastStatsRefresh ? new Date(lastStatsRefresh).toLocaleTimeString("fr-FR") : "--:--:--"}
            </p>
          </div>
          {upcomingCreneaux.length > 0 && (
            <div className="mt-2">
              <h4 className="text-base font-medium text-gray-700 mb-4">Prochains créneaux</h4>
              <div className="space-y-4">
                {upcomingCreneaux.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50/80 rounded-xl border border-white/30"
                  >
                    <div className="mb-2 sm:mb-0">
                      <p className="text-sm font-medium text-gray-700">
                        {c.date} • {c.heureDebut} - {c.heureFin}
                      </p>
                      <p className="text-sm text-gray-500">
                        {c.typeConsultation} - {c.salleConsultation}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl border-gray-200 text-gray-700 hover:bg-gradient-to-r hover:from-cyan-500 hover:to-blue-600 hover:text-white text-sm touch-manipulation"
                      onClick={() => handleEditCreneau(c)}
                    >
                      <Edit className="w-4 h-4 mr-1" /> Modifier
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPlanningPage = () => (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 mt-8 w-full">
      <div className="p-4 sm:p-6 border-b border-white/30">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-700 text-center flex items-center justify-center gap-2">
          <Calendar className="w-5 h-5" />
          CrÃ©neaux existants ({creneaux.length})
        </h3>
      </div>
      <div className="p-4 sm:p-6">
        {showSuccess && (
          <Alert className="border-green-300 bg-green-50 animate-fade-in rounded-xl mb-6">
            <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
          </Alert>
        )}
        <div className="flex justify-end mb-6">
          <Button
            onClick={() => {
              setCreneauData({
                date: null,
                heureDebut: "09:00",
                heureFin: "17:00",
                dureeConsultation: "30",
                typeConsultation: "consultation",
                salleConsultation: "Salle 1",
                maxPatients: "8",
              });
              setEditingId(null);
              setSecondaryView("creneauForm");
              addToHistory?.("CrÃ©ation crÃ©neau", "Ouverture du formulaire de crÃ©ation de crÃ©neau", currentUser);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white transition-colors rounded-xl text-sm touch-manipulation"
          >
            <Plus className="w-4 h-4" />
            Ajouter crÃ©neau
          </Button>
        </div>
        {creneaux.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4" />
            <p className="text-sm">Aucun crÃ©neau crÃ©Ã© pour le moment</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-white/30">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="border border-white/30 p-2 text-left text-sm font-medium text-gray-700">Date</th>
                  <th className="border border-white/30 p-2 text-left text-sm font-medium text-gray-700">Horaires</th>
                  <th className="border border-white/30 p-2 text-left text-sm font-medium text-gray-700 hidden md:table-cell">DurÃ©e</th>
                  <th className="border border-white/30 p-2 text-left text-sm font-medium text-gray-700 hidden lg:table-cell">Type</th>
                  <th className="border border-white/30 p-2 text-left text-sm font-medium text-gray-700 hidden xl:table-cell">Salle</th>
                  <th className="border border-white/30 p-2 text-left text-sm font-medium text-gray-700 hidden 2xl:table-cell">Max patients</th>
                  <th className="border border-white/30 p-2 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {creneaux.map((c) => (
                  <tr key={c.id} className="border-b border-white/30 hover:bg-gray-50/50 transition-colors">
                    <td className="border border-white/30 p-2 text-sm font-medium text-gray-700">{c.date}</td>
                    <td className="border border-white/30 p-2 text-sm text-gray-500">
                      {c.heureDebut} - {c.heureFin}
                    </td>
                    <td className="border border-white/30 p-2 text-sm text-gray-500 hidden md:table-cell">{c.dureeConsultation} min</td>
                    <td className="border border-white/30 p-2 text-sm text-gray-500 hidden lg:table-cell">{c.typeConsultation}</td>
                    <td className="border border-white/30 p-2 text-sm text-gray-500 hidden xl:table-cell">{c.salleConsultation}</td>
                    <td className="border border-white/30 p-2 text-sm text-gray-500 hidden 2xl:table-cell">{c.maxPatients}</td>
                    <td className="border border-white/30 p-2 text-sm text-gray-500">
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl border-gray-200 text-gray-700 hover:bg-gradient-to-r hover:from-cyan-500 hover:to-blue-600 hover:text-white text-sm touch-manipulation"
                          onClick={() => handleEditCreneau(c)}
                        >
                          <Edit className="w-4 h-4 mr-1" /> Modifier
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl border-gray-200 text-red-700 hover:bg-red-100 text-sm touch-manipulation"
                          onClick={() => handleDeleteCreneau(c.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" /> Supprimer
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderCreneauForm = () => (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 mt-8 w-full">
      <div className="p-4 sm:p-6 border-b border-white/30">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-700 text-center flex items-center justify-center gap-2">
          <Calendar className="w-5 h-5" />
          {editingId ? "Modifier le crÃ©neau" : "Nouveau crÃ©neau"}
        </h3>
      </div>
      <div className="p-4 sm:p-6">
        <div className="space-y-6">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Date</Label>
            <DatePicker
              selected={creneauData.date}
              onChange={(date) => handleCreneauInputChange("date", date)}
              dateFormat="dd/MM/yyyy"
              locale={fr}
              className="w-full rounded-xl px-4 py-3 border border-gray-200 focus:ring-4 focus:ring-blue-500/50 focus:outline-none transition-all text-sm touch-manipulation"
              placeholderText="SÃ©lectionnez une date"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Heure de dÃ©but</Label>
              <Input
                type="time"
                value={creneauData.heureDebut}
                onChange={(e) => handleCreneauInputChange("heureDebut", e.target.value)}
                className="w-full rounded-xl px-4 py-3 border border-gray-200 focus:ring-4 focus:ring-blue-500/50 transition-all text-sm touch-manipulation"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Heure de fin</Label>
              <Input
                type="time"
                value={creneauData.heureFin}
                onChange={(e) => handleCreneauInputChange("heureFin", e.target.value)}
                className="w-full rounded-xl px-4 py-3 border border-gray-200 focus:ring-4 focus:ring-blue-500/50 transition-all text-sm touch-manipulation"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">DurÃ©e consultation (min)</Label>
              <Input
                type="number"
                min="15"
                max="60"
                value={creneauData.dureeConsultation}
                onChange={(e) => handleCreneauInputChange("dureeConsultation", e.target.value)}
                className="w-full rounded-xl px-4 py-3 border border-gray-200 focus:ring-4 focus:ring-blue-500/50 pr-16 transition-all text-sm touch-manipulation"
              />
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                min
              </span>
            </div>
            <div className="relative">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Type de consultation</Label>
              <select
                value={creneauData.typeConsultation}
                onChange={(e) => handleCreneauInputChange("typeConsultation", e.target.value)}
                className="w-full rounded-xl px-4 py-3 border border-gray-200 focus:ring-4 focus:ring-blue-500/50 pr-8 transition-all text-sm touch-manipulation appearance-none"
              >
                <option value="consultation">Consultation</option>
                <option value="controle">ContrÃ´le</option>
                <option value="urgence">Urgence</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Salle de consultation</Label>
              <Input
                type="text"
                value={creneauData.salleConsultation}
                onChange={(e) => handleCreneauInputChange("salleConsultation", e.target.value)}
                className="w-full rounded-xl px-4 py-3 border border-gray-200 focus:ring-4 focus:ring-blue-500/50 transition-all text-sm touch-manipulation"
                placeholder="Salle 1"
              />
            </div>
            <div className="relative">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Max patients</Label>
              <Input
                type="number"
                min="1"
                max="20"
                value={creneauData.maxPatients}
                onChange={(e) => handleCreneauInputChange("maxPatients", e.target.value)}
                className="w-full rounded-xl px-4 py-3 border border-gray-200 focus:ring-4 focus:ring-blue-500/50 pr-16 transition-all text-sm touch-manipulation"
              />
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                patients
              </span>
            </div>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-white/30 flex justify-end gap-4 flex-wrap">
          <Button
            variant="outline"
            className="px-6 py-3 rounded-xl border-gray-200 text-gray-700 hover:bg-gradient-to-r hover:from-gray-500 hover:to-gray-600 hover:text-white transition-all duration-200 shadow-md hover:shadow-lg text-sm touch-manipulation"
            onClick={() => setSecondaryView("planning")}
          >
            Annuler
          </Button>
          <Button
            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg text-sm touch-manipulation"
            onClick={handleSaveCreneau}
            disabled={!creneauData.date || !creneauData.heureDebut || !creneauData.heureFin}
          >
            {editingId ? "Modifier le crÃ©neau" : "CrÃ©er le crÃ©neau"}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderHeader = () => (
    <div className="flex justify-between items-center border-b border-white/30 pb-5">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-700 tracking-tight">
        Bienvenue, {medecin?.username || "MÃ©decin"}
      </h1>
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          className="p-2 rounded-full text-gray-700 hover:bg-gradient-to-r hover:from-cyan-500 hover:to-blue-600 hover:text-white transition-all duration-200 touch-manipulation"
          onClick={() => navigateTo("profil")}
          title="Mon Profil"
        >
          <User className="w-5 sm:w-6 h-5 sm:h-6" />
        </Button>
        <Button
          variant="ghost"
          className="p-2 rounded-full text-gray-700 hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-600 hover:text-white transition-all duration-200 touch-manipulation"
          onClick={handleLogout}
          title="DÃ©connexion"
        >
          <LogOut className="w-5 sm:w-6 h-5 sm:h-6" />
        </Button>
      </div>
    </div>
  );

  const renderPatientsPage = () => {
    const filteredPatients = patients.filter(
      (patient) =>
        patient.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.telephone.includes(searchTerm)
    );

    return (
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 mt-8 w-full">
        <div className="p-4 sm:p-6 border-b border-white/30">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-700 text-center flex items-center justify-center gap-2">
            <Users2 className="w-5 h-5" />
            Liste complÃ¨te des patients ({filteredPatients.length})
          </h3>
          <div className="mt-4">
            <input
              type="text"
              placeholder="Rechercher un patient par nom, email ou tÃ©lÃ©phone"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl px-4 py-3 border border-gray-200 focus:ring-4 focus:ring-blue-500/50 focus:outline-none transition-all text-sm touch-manipulation"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          {filteredPatients.length === 0 ? (
            <p className="text-center text-gray-500 py-8 text-sm">Aucun patient trouvÃ©</p>
          ) : (
            <table className="w-full border-collapse border border-white/30">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="border border-white/30 p-2 text-left text-sm font-medium text-gray-700">Nom du patient</th>
                  <th className="border border-white/30 p-2 text-left text-sm font-medium text-gray-700 hidden md:table-cell">Ã‚ge</th>
                  <th className="border border-white/30 p-2 text-left text-sm font-medium text-gray-700 hidden lg:table-cell">Email</th>
                  <th className="border border-white/30 p-2 text-left text-sm font-medium text-gray-700 hidden xl:table-cell">TÃ©lÃ©phone</th>
                  <th className="border border-white/30 p-2 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50/50">
                    <td className="border border-white/30 p-2 text-sm font-medium text-gray-700">{patient.username}</td>
                    <td className="border border-white/30 p-2 text-sm text-gray-500 hidden md:table-cell">{patient.age} ans</td>
                    <td className="border border-white/30 p-2 text-sm text-gray-500 hidden lg:table-cell">{patient.email}</td>
                    <td className="border border-white/30 p-2 text-sm text-gray-500 hidden xl:table-cell">{patient.telephone}</td>
                    <td className="border border-white/30 p-2 text-sm text-gray-500">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl border-gray-200 text-gray-700 hover:bg-gradient-to-r hover:from-cyan-500 hover:to-blue-600 hover:text-white text-sm touch-manipulation"
                        onClick={() => {
                          setSelectedPatient(patient);
                          setShowPatientModal(true);
                          addToHistory?.(
                            "Consultation patient",
                            `Consultation des dÃ©tails du patient: ${patient.username}`,
                            currentUser
                          );
                        }}
                      >
                        Voir dÃ©tails
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  const renderRDVPage = () => (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 mt-8 w-full">
      <div className="p-4 sm:p-6 border-b border-white/30">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-700 text-center flex items-center justify-center gap-2">
          <CalendarCheck className="w-5 h-5" />
          Rendez-vous du jour ({rdvDuJour.length})
        </h3>
      </div>
      <div className="overflow-x-auto">
        {rdvDuJour.length === 0 ? (
          <p className="text-center text-gray-500 py-8 text-sm">Aucun rendez-vous aujourd'hui</p>
        ) : (
          <table className="w-full border-collapse border border-white/30">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="border border-white/30 p-2 text-left text-sm font-medium text-gray-700">Heure</th>
                <th className="border border-white/30 p-2 text-left text-sm font-medium text-gray-700">Patient</th>
                <th className="border border-white/30 p-2 text-left text-sm font-medium text-gray-700 hidden md:table-cell">Ã‚ge</th>
                <th className="border border-white/30 p-2 text-left text-sm font-medium text-gray-700 hidden lg:table-cell">Motif</th>
                <th className="border border-white/30 p-2 text-left text-sm font-medium text-gray-700 hidden xl:table-cell">Ã‰tat</th>
                <th className="border border-white/30 p-2 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rdvDuJour.map((rdv) => (
                <tr
                  key={rdv.id}
                  className={`hover:bg-gray-50/50 ${rdv.isNew ? "bg-yellow-100 border-l-4 border-yellow-400" : ""}`}
                >
                  <td className="border border-white/30 p-2 text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      {rdv.time}
                    </div>
                  </td>
                  <td className="border border-white/30 p-2 text-sm font-medium text-gray-700">
                    {rdv.username}
                    {rdv.isNew && (
                      <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                        Nouveau
                      </span>
                    )}
                  </td>
                  <td className="border border-white/30 p-2 text-sm text-gray-500 hidden md:table-cell">{rdv.age} ans</td>
                  <td className="border border-white/30 p-2 text-sm text-gray-500 hidden lg:table-cell">{rdv.motif}</td>
                  <td className="border border-white/30 p-2 text-sm hidden xl:table-cell">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${rdv.statusInfo?.color}`}>
                      {rdv.statusInfo?.status}
                    </span>
                  </td>
                  <td className="border border-white/30 p-2 text-sm text-gray-500">
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl border-gray-200 text-gray-700 hover:bg-gradient-to-r hover:from-cyan-500 hover:to-blue-600 hover:text-white text-sm touch-manipulation"
                        onClick={() => handleStartRdv(rdv)}
                      >
                        Commencer
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl border-gray-200 text-gray-700 hover:bg-gradient-to-r hover:from-orange-500 hover:to-red-600 hover:text-white text-sm touch-manipulation"
                        onClick={() => handlePostponeRdv(rdv)}
                      >
                        Reporter
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const renderUrgencesPage = () => (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-red-200 mt-8 w-full">
      <div className="p-4 sm:p-6 border-b border-red-200">
        <h3 className="text-lg sm:text-xl font-semibold text-red-700 text-center flex items-center justify-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Urgences ({urgences.length})
        </h3>
      </div>
      <div className="overflow-x-auto">
        {urgences.length === 0 ? (
          <p className="text-center text-gray-500 py-8 text-sm">Aucune urgence aujourd'hui</p>
        ) : (
          <table className="w-full border-collapse border border-red-200">
            <thead className="bg-red-50/80">
              <tr>
                <th className="border border-red-200 p-2 text-left text-sm font-medium text-red-700">Heure</th>
                <th className="border border-red-200 p-2 text-left text-sm font-medium text-red-700">Patient</th>
                <th className="border border-red-200 p-2 text-left text-sm font-medium text-red-700 hidden md:table-cell">Ã‚ge</th>
                <th className="border border-red-200 p-2 text-left text-sm font-medium text-red-700 hidden lg:table-cell">Motif</th>
                <th className="border border-red-200 p-2 text-left text-sm font-medium text-red-700 hidden xl:table-cell">Ã‰tat</th>
                <th className="border border-red-200 p-2 text-left text-sm font-medium text-red-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {urgences.map((urgence) => (
                <tr
                  key={urgence.id}
                  className={`hover:bg-red-50/50 ${urgence.isNew ? "bg-yellow-100 border-l-4 border-yellow-400" : ""}`}
                >
                  <td className="border border-red-200 p-2 text-sm font-medium text-red-700">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-red-500" />
                      {urgence.time}
                    </div>
                  </td>
                  <td className="border border-red-200 p-2 text-sm font-medium text-red-700">
                    {urgence.username}
                    {urgence.isNew && (
                      <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                        Nouveau
                      </span>
                    )}
                  </td>
                  <td className="border border-red-200 p-2 text-sm text-red-600 hidden md:table-cell">{urgence.age} ans</td>
                  <td className="border border-red-200 p-2 text-sm text-red-600 hidden lg:table-cell">{urgence.motif}</td>
                  <td className="border border-red-200 p-2 text-sm hidden xl:table-cell">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${urgence.statusInfo?.color}`}>
                      {urgence.statusInfo?.status}
                    </span>
                  </td>
                  <td className="border border-red-200 p-2 text-sm text-red-600">
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl border-red-200 text-red-700 hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-600 hover:text-white text-sm touch-manipulation"
                        onClick={() =>
                          addToHistory?.(
                            "Action urgence",
                            `DÃ©marrage de l'urgence pour ${urgence.username} Ã  ${urgence.time}`,
                            currentUser
                          )
                        }
                      >
                        Commencer
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl border-red-200 text-red-700 hover:bg-gradient-to-r hover:from-orange-500 hover:to-red-600 hover:text-white text-sm touch-manipulation"
                        onClick={() =>
                          addToHistory?.(
                            "Action urgence",
                            `Report de l'urgence pour ${urgence.username} Ã  ${urgence.time}`,
                            currentUser
                          )
                        }
                      >
                        Reporter
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const renderConsultationsPage = () => (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 w-full">
      <div className="p-4 sm:p-6">
        <ErrorBoundary>
          <EnhancedConsultationsPage
            currentUser={currentUser}
            addToHistory={addToHistory}
            patients={patients}
          />
        </ErrorBoundary>
      </div>
    </div>
  );

  const renderMedicamentsPage = () => (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 w-full">
      <div className="p-4 sm:p-6">
        <ErrorBoundary>
          <MedecinMedicamentsPage />
        </ErrorBoundary>
      </div>
    </div>
  );

  const renderOrdonnancesPage = () => (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 w-full">
      <div className="p-4 sm:p-6">
        <ErrorBoundary>
          <OrdonnancesPage
            currentUser={currentUser}
            addToHistory={addToHistory}
            patients={patients}
          />
        </ErrorBoundary>
      </div>
    </div>
  );

  const renderPaiementsPage = () => (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 w-full">
      <div className="p-4 sm:p-6">
        <ErrorBoundary>
          <MedecinPaymentsPage
            currentUser={currentUser}
            addToHistory={addToHistory}
            patients={patients}
          />
        </ErrorBoundary>
      </div>
    </div>
  );

  const renderActivitesPage = () => (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 w-full">
      <div className="p-4 sm:p-6">
        <ErrorBoundary>
          <MedecinActivityHistory currentUser={currentUser} />
        </ErrorBoundary>
      </div>
    </div>
  );

  const renderProfilPage = () => (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 mt-8 w-full">
      <div className="p-4 sm:p-6 border-b border-white/30">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-700 text-center flex items-center justify-center gap-2">
          <User className="w-5 h-5" />
          Informations du profil
        </h3>
      </div>
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-4">
            <h4 className="text-base font-medium text-gray-700 text-center flex items-center justify-center gap-2">
              <Settings className="w-5 h-5" />
              Informations personnelles
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet</label>
                <input
                  type="text"
                  value={profilData.username}
                  onChange={(e) => handleProfilChange("username", e.target.value)}
                  className="w-full rounded-xl px-4 py-3 border border-gray-200 focus:ring-4 focus:ring-blue-500/50 focus:outline-none transition-all text-sm touch-manipulation"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SpÃ©cialitÃ©</label>
                <input
                  type="text"
                  value={profilData.specialite}
                  onChange={(e) => handleProfilChange("specialite", e.target.value)}
                  className="w-full rounded-xl px-4 py-3 border border-gray-200 focus:ring-4 focus:ring-blue-500/50 focus:outline-none transition-all text-sm touch-manipulation"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">NumÃ©ro d'ordre</label>
                <input
                  type="text"
                  value={profilData.numero_ordre}
                  onChange={(e) => handleProfilChange("numero_ordre", e.target.value)}
                  className="w-full rounded-xl px-4 py-3 border border-gray-200 focus:ring-4 focus:ring-blue-500/50 focus:outline-none transition-all text-sm touch-manipulation"
                />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-base font-medium text-gray-700 text-center">Contact</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={profilData.email}
                  onChange={(e) => handleProfilChange("email", e.target.value)}
                  className="w-full rounded-xl px-4 py-3 border border-gray-200 focus:ring-4 focus:ring-blue-500/50 focus:outline-none transition-all text-sm touch-manipulation"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">TÃ©lÃ©phone</label>
                <input
                  type="tel"
                  value={profilData.telephone}
                  onChange={(e) => handleProfilChange("telephone", e.target.value)}
                  className="w-full rounded-xl px-4 py-3 border border-gray-200 focus:ring-4 focus:ring-blue-500/50 focus:outline-none transition-all text-sm touch-manipulation"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                <textarea
                  value={profilData.adresse}
                  onChange={(e) => handleProfilChange("adresse", e.target.value)}
                  rows={3}
                  className="w-full rounded-xl px-4 py-3 border border-gray-200 focus:ring-4 focus:ring-blue-500/50 focus:outline-none transition-all text-sm touch-manipulation"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-white/30 flex justify-end gap-4 flex-wrap">
          <Button
            variant="outline"
            className="px-6 py-3 rounded-xl border-gray-200 text-gray-700 hover:bg-gradient-to-r hover:from-gray-500 hover:to-gray-600 hover:text-white transition-all duration-200 shadow-md hover:shadow-lg text-sm touch-manipulation"
            onClick={() => setSecondaryView("accueil")}
          >
            Annuler
          </Button>
          <Button
            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg text-sm touch-manipulation"
            onClick={handleSaveProfil}
          >
            Sauvegarder les modifications
          </Button>
        </div>
      </div>
    </div>
  );

  const fetchStats = useCallback(
    async (options = {}) => {
      if (!isAuthenticated) return;

      const { silent = false } = options;

      try {
        console.log("[fetchStats] Fetching statistics...");
        const response = await axiosInstance.get("/stats");
        setStats(response.data);
        setLastStatsRefresh(new Date().toISOString());
      } catch (err) {
        console.error("[fetchStats] Error fetching stats:", err);
        if (!silent) {
          toast.error("Erreur lors de la recuperation des statistiques.");
        }
      }
    },
    [isAuthenticated, axiosInstance]
  );

  useEffect(() => {
    if (!isAuthenticated || secondaryView !== "stats") return;

    fetchStats();
    const intervalId = setInterval(() => {
      fetchStats({ silent: true });
    }, 15000);

    return () => clearInterval(intervalId);
  }, [secondaryView, isAuthenticated, fetchStats]);

  const formatMonthLabel = (monthValue) => {
    const date = new Date(monthValue);
    if (Number.isNaN(date.getTime())) {
      return String(monthValue || "-");
    }

    return date.toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
  };

  const renderStatsPage = () => {
    const appointmentsByMonth = Array.isArray(stats?.appointmentsByMonth) ? stats.appointmentsByMonth : [];
    const consultationsByMonth = Array.isArray(stats?.consultationsByMonth) ? stats.consultationsByMonth : [];
    const appointmentsBySpecialty = Array.isArray(stats?.appointmentsBySpecialty) ? stats.appointmentsBySpecialty : [];

    const totalConsultations = consultationsByMonth.reduce((acc, item) => acc + Number(item.count || 0), 0);

    const chartData = [
      { name: "Patients", value: Number(stats?.totalPatients || 0), fill: "#3b82f6" },
      { name: "RDV", value: Number(stats?.totalAppointments || 0), fill: "#10b981" },
      { name: "Consultations", value: totalConsultations, fill: "#f97316" },
      { name: "Specialites", value: appointmentsBySpecialty.length, fill: "#8b5cf6" },
    ];

    const monthMap = new Map();
    appointmentsByMonth.forEach((item) => {
      const key = String(item.month);
      monthMap.set(key, {
        month: key,
        rdv: Number(item.count || 0),
        consultations: monthMap.get(key)?.consultations || 0,
      });
    });

    consultationsByMonth.forEach((item) => {
      const key = String(item.month);
      monthMap.set(key, {
        month: key,
        rdv: monthMap.get(key)?.rdv || 0,
        consultations: Number(item.count || 0),
      });
    });

    const lineData = [...monthMap.values()]
      .sort((a, b) => new Date(a.month) - new Date(b.month))
      .map((item) => ({
        ...item,
        monthLabel: formatMonthLabel(item.month),
      }));

    const pieData = appointmentsBySpecialty.map((item, index) => ({
      name: item.specialty || "Non specifiee",
      value: Number(item.count || 0),
      fill: ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#9C27B0"][index % 5],
    }));

    return (
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 mt-8 w-full">
        <div className="p-4 sm:p-6 border-b border-white/30">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-700 text-center flex items-center justify-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Statistiques
          </h3>
        </div>
        <div className="p-4 sm:p-6">
          {stats ? (
            <div className="space-y-8">
              <p className="text-sm text-center text-gray-500">
                Derniere synchronisation: {lastStatsRefresh ? new Date(lastStatsRefresh).toLocaleTimeString("fr-FR") : "--:--:--"}
              </p>
              <div className="w-full">
                <h4 className="text-base font-medium text-gray-700 mb-4 text-center">Vue d'ensemble</h4>
                <div className="w-full h-64 flex justify-center">
                  <BarChart
                    width={Math.min(window.innerWidth * 0.9, 600)}
                    height={250}
                    data={chartData}
                    margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </div>
              </div>
              <div className="w-full">
                <h4 className="text-base font-medium text-gray-700 mb-4 text-center">Tendance mensuelle</h4>
                <div className="w-full h-64 flex justify-center">
                  <LineChart
                    width={Math.min(window.innerWidth * 0.9, 600)}
                    height={250}
                    data={lineData}
                    margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="monthLabel" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="rdv" stroke="#82ca9d" strokeWidth={2} name="Rendez-vous" />
                    <Line type="monotone" dataKey="consultations" stroke="#8884d8" strokeWidth={2} name="Consultations" />
                  </LineChart>
                </div>
              </div>
              <div className="w-full">
                <h4 className="text-base font-medium text-gray-700 mb-4 text-center">Repartition des rendez-vous par specialite</h4>
                <div className="w-full h-64 flex justify-center">
                  <PieChart width={Math.min(window.innerWidth * 0.9, 400)} height={250}>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={Math.min(window.innerWidth * 0.2, 80)}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">Chargement des statistiques...</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMessageriePage = () => (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 mt-8 w-full">
      <div className="p-4 sm:p-6 border-b border-white/30">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-700 text-center flex items-center justify-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Messagerie
        </h3>
      </div>
      <div className="p-6">
        <MessagingPanel
          currentUser={currentUser}
          userRole="medecin"
          addToHistory={addToHistory}
        />
      </div>
    </div>
  );

  const handleClosePatientModal = () => {
    setShowPatientModal(false);
    setSelectedPatient(null);
  };

  if (!isAuthenticated) {
    console.log("[Render] User not authenticated, returning null");
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-100 to-emerald-50 relative overflow-hidden w-full">
      <div className="absolute top-20 left-4 w-24 h-24 bg-gradient-to-br from-cyan-200 to-blue-300 rounded-full opacity-30 animate-pulse"></div>
      <div className="absolute bottom-20 right-4 w-32 h-32 bg-gradient-to-br from-emerald-200 to-cyan-300 rounded-full opacity-20 animate-bounce"></div>
      <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-gradient-to-br from-blue-200 to-emerald-200 rounded-full opacity-25 animate-ping hidden sm:block"></div>
      {renderSidebar()}
      <div className="md:ml-64 relative z-10 flex flex-col min-h-screen p-2">
        <div className="container mx-auto px-2 py-8 space-y-8 w-full">
          {renderHeader()}
          <ErrorBoundary>
            {secondaryView === "accueil" && renderAccueilPage()}
            {secondaryView === "patients" && renderPatientsPage()}
            {secondaryView === "rdv" && renderRDVPage()}
            {secondaryView === "urgences" && renderUrgencesPage()}
            {secondaryView === "planning" && renderPlanningPage()}
            {secondaryView === "creneauForm" && renderCreneauForm()}
            {secondaryView === "consultations" && renderConsultationsPage()}
            {secondaryView === "ordonnances" && renderOrdonnancesPage()}
            {secondaryView === "activites" && renderActivitesPage()}
            {secondaryView === "messagerie" && renderMessageriePage()}
            {secondaryView === "profil" && renderProfilPage()}
            {secondaryView === "stats" && renderStatsPage()}
          </ErrorBoundary>
          {showPatientModal && selectedPatient && (
            <Modal
              isOpen={showPatientModal}
              onClose={handleClosePatientModal}
            >
              <ErrorBoundary>
                <PatientMedicalFile
                  isOpen={showPatientModal}
                  onClose={handleClosePatientModal}
                  patient={selectedPatient}
                  currentUser={currentUser}
                  addToHistory={addToHistory}
                  setIsSidebarOpen={setIsSidebarOpen}
                />
              </ErrorBoundary>
            </Modal>
          )}
        </div>
      </div>
    </main>
  );
};

MedecinDashboard.propTypes = {
  currentUser: PropTypes.shape({
    username: PropTypes.string,
    specialite: PropTypes.string,
    email: PropTypes.string,
    token: PropTypes.string,
  }),
  addToHistory: PropTypes.func,
  logout: PropTypes.func,
};

export default MedecinDashboard;


