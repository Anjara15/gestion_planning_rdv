import { useEffect, useRef, useState, useMemo } from "react";
import {Calendar,  Heart,  Clock,  User,  List,  ArrowLeft,  Menu,  X as XIcon,  LogOut,  Settings,  CalendarCheck,  FileText,  Plus,  Trash2,  Search,  Home,  Star,  RefreshCw,  Loader2} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import fr from "date-fns/locale/fr";
import { useSpecialties } from "@/hooks/useSpecialties";

registerLocale("fr", fr);

// Health tips data
const healthTips = [
  { id: 1, icon: Heart, text: "Buvez au moins 1,5L d'eau par jour pour rester hydratÃƒÂ©.", color: "text-blue-600" },
  { id: 2, icon: Clock, text: "Dormez 7 ÃƒÂ  8 heures par nuit pour une santÃƒÂ© optimale.", color: "text-purple-600" },
  { id: 3, icon: Calendar, text: "Faites 30 minutes d'exercice physique 5 fois par semaine.", color: "text-green-600" },
  { id: 4, icon: FileText, text: "Planifiez des bilans de santÃƒÂ© rÃƒÂ©guliers avec votre mÃƒÂ©decin.", color: "text-orange-600" },
];

// General notions for sidebar
const _generalNotions = [
  { id: 1, text: "Prenez vos rendez-vous ÃƒÂ  l'avance pour plus de disponibilitÃƒÂ©.", color: "text-cyan-600" },
  { id: 2, text: "Mettez ÃƒÂ  jour votre profil pour une meilleure coordination.", color: "text-purple-600" },
  { id: 3, text: "Annulez les RDV non nÃƒÂ©cessaires pour libÃƒÂ©rer des crÃƒÂ©neaux.", color: "text-orange-600" },
];

const PatientDashboard = ({ logout }) => {
  const [rendezVous, setRendezVous] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const didWelcomeRef = useRef(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");
  // Plus besoin de sÃƒÂ©lectionner un mÃƒÂ©decin cÃƒÂ´tÃƒÂ© patient
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [specialtySearch, setSpecialtySearch] = useState("");
  const [isSpecialtyDropdownOpen, setIsSpecialtyDropdownOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [availableSlots, setAvailableSlots] = useState([]);
  const sidebarRef = useRef(null);

  // Enhanced specialty dropdown state
  const [favoriteSpecialties, setFavoriteSpecialties] = useState([]);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [searchTimeout, setSearchTimeout] = useState(null);

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
          toast.error("Session expirÃƒÂ©e. Veuillez vous reconnecter.");
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
      toast.error("Erreur lors de la rÃƒÂ©cupÃƒÂ©ration du profil.");
      return null;
    }
  };

  // Fetch user appointments
  const fetchAppointments = async () => {
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
          toast.error("Session expirÃƒÂ©e. Veuillez vous reconnecter.");
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
      appointments
        .filter((rdv) => rdv.isNew)
        .forEach((rdv) => {
          toast.success(`Rendez-vous en attente : ${rdv.specialite || "Consultation"} le ${rdv.date} ÃƒÂ  ${rdv.time}`);
        });
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Erreur lors de la rÃƒÂ©cupÃƒÂ©ration des rendez-vous.");
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
          toast.error("Session expirÃƒÂ©e. Veuillez vous reconnecter.");
        }
        throw new Error("Failed to fetch available slots");
      }
      const slots = await response.json();
      setAvailableSlots(slots);
    } catch (error) {
      console.error("Error fetching available slots:", error);
      toast.error("Erreur lors de la rÃƒÂ©cupÃƒÂ©ration des crÃƒÂ©neaux disponibles.");
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

  const handleAddRdv = async () => {
    if (!selectedSpecialtyObj && !selectedSpecialty) {
      toast.error("Veuillez choisir une spÃƒÂ©cialitÃƒÂ©.", { description: "Champs requis" });
      return;
    }
    if (!selectedDate) {
      toast.error("Veuillez sÃƒÂ©lectionner une date.", { description: "Champs requis" });
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
          toast.error("Session expirÃƒÂ©e. Veuillez vous reconnecter.");
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

      toast.success("Rendez-vous ajoutÃƒÂ© avec succÃƒÂ¨s", {
        description: `${newRdv.specialite || "Consultation"} Ã¢â‚¬â€ ${new Date(newRdv.date).toLocaleDateString("fr-FR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })} ÃƒÂ  ${newRdv.time}${demande ? `\nMotif: ${demande}` : ""}`,
      });

      await addToHistory(
        "Ajout rendez-vous",
        `Ajout d'un rendez-vous: ${newRdv.specialite} le ${newRdv.date} ÃƒÂ  ${newRdv.time}`
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
          toast.error("Session expirÃƒÂ©e. Veuillez vous reconnecter.");
        }
        throw new Error("Failed to cancel appointment");
      }

      setRendezVous((prev) => prev.filter((rdv) => rdv.id !== rdvId));
      await addToHistory(
        "Annulation rendez-vous",
        `Annulation du rendez-vous: ${rdvToCancel.specialite} le ${rdvToCancel.date} ÃƒÂ  ${rdvToCancel.time}`
      );
      toast.success("Rendez-vous annulÃƒÂ© avec succÃƒÂ¨s", { description: "Annulation confirmÃƒÂ©e" });
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
      toast.error("Veuillez remplir tous les champs obligatoires (Nom, PrÃƒÂ©nom, Email).");
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
          toast.error("Session expirÃƒÂ©e. Veuillez vous reconnecter.");
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
      await addToHistory("Modification profil", "Mise ÃƒÂ  jour des informations du profil");
      toast.success("Profil mis ÃƒÂ  jour avec succÃƒÂ¨s !");
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
    addToHistory("Navigation", `AccÃƒÂ¨s ÃƒÂ  la vue ${view}`);
  };

  const handleLogout = async () => {
    await addToHistory("DÃƒÂ©connexion", "DÃƒÂ©connexion du tableau de bord patient");
    localStorage.removeItem("token");
    logout?.();
    toast.success("DÃƒÂ©connexion rÃƒÂ©ussie", { description: "Vous avez ÃƒÂ©tÃƒÂ© dÃƒÂ©connectÃƒÂ©." });
  };

  const isDateOnOrAfterToday = (dateStr) => {
    const rdvDate = new Date(dateStr);
    const today = new Date();
    rdvDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return rdvDate >= today;
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
            aria-label="Aller ÃƒÂ  la page d'accueil"
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
            Mes RDV ({rendezVous.length})
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
          aria-label="Se dÃƒÂ©connecter"
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
              RÃƒÂ©capitulatif d'utilisation
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Prochains rendez-vous</h4>
                {upcomingAppointments.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucun rendez-vous ÃƒÂ  venir</p>
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
                        ÃƒÂ  {rdv.time}
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
                <h4 className="text-sm font-medium text-gray-700 mb-2">ComplÃƒÂ©tion du profil</h4>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2.5 rounded-full"
                    style={{ width: `${profileCompletion}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Profil complÃƒÂ©tÃƒÂ© ÃƒÂ  {profileCompletion}%{' '}
                  {profileCompletion < 100 && (
                    <Button
                      variant="link"
                      className="text-blue-600 hover:text-blue-700 p-0"
                      onClick={() => navigateTo("profil")}
                      aria-label="ComplÃƒÂ©ter votre profil"
                    >
                      ComplÃƒÂ©ter votre profil
                    </Button>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/30 p-6">
            <h3 className="flex items-center gap-3 text-primary font-semibold text-lg mb-4">
              <Heart className="w-6 h-6" />
              Conseils santÃƒÂ©
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
            <p>Aucun rendez-vous enregistrÃƒÂ©</p>
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
                    <th className="border border-white/30 p-3 text-left text-sm font-medium text-gray-700">SpÃƒÂ©cialitÃƒÂ©</th>
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
                      <td className="border border-white/30 p-3 text-sm text-gray-500">{rdv.demande || "Non spÃƒÂ©cifiÃƒÂ©"}</td>
                      <td className="border border-white/30 p-3 text-sm">
                        <div className="flex flex-col gap-1">
                          {rdv.status === "en attente" && (
                            <span className="px-3 py-1 text-xs bg-orange-100 text-orange-800 rounded-full font-medium">
                              En attente
                            </span>
                          )}
                          {rdv.status === "confirmÃƒÂ©" && (
                            <span className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-medium">
                              ConfirmÃƒÂ©
                            </span>
                          )}
                          {(rdv.status === "terminÃƒÂ©" || !isDateOnOrAfterToday(rdv.date)) && (
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                              rdv.status === "terminÃƒÂ©" ? "text-green-600 bg-green-50" : "text-gray-600 bg-gray-50"
                            }`}>
                              {rdv.status === "terminÃƒÂ©" ? "TerminÃƒÂ©" : "PassÃƒÂ©"}
                            </span>
                          )}
                          {(!rdv.status || rdv.status === "ÃƒÂ  venir") && isDateOnOrAfterToday(rdv.date) && (
                            <span className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium">
                              Ãƒâ‚¬ venir
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
                            aria-label={`Annuler le rendez-vous du ${new Date(rdv.date).toLocaleDateString("fr-FR")} ÃƒÂ  ${
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
                      <span className="text-sm font-medium text-gray-700">SpÃƒÂ©cialitÃƒÂ©:</span>
                      <p className="text-sm text-gray-500">{rdv.specialite}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Motif:</span>
                      <p className="text-sm text-gray-500">{rdv.demande || "Non spÃƒÂ©cifiÃƒÂ©"}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Statut:</span>
                      <div className="flex flex-col gap-1 mt-1">
                        {rdv.status === "en attente" && (
                          <span className="px-3 py-1 text-xs bg-orange-100 text-orange-800 rounded-full font-medium">
                            En attente
                          </span>
                        )}
                        {rdv.status === "confirmÃƒÂ©" && (
                          <span className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-medium">
                            ConfirmÃƒÂ©
                          </span>
                        )}
                        {(rdv.status === "terminÃƒÂ©" || !isDateOnOrAfterToday(rdv.date)) && (
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            rdv.status === "terminÃƒÂ©" ? "text-green-600 bg-green-50" : "text-gray-600 bg-gray-50"
                          }`}>
                            {rdv.status === "terminÃƒÂ©" ? "TerminÃƒÂ©" : "PassÃƒÂ©"}
                          </span>
                        )}
                        {(!rdv.status || rdv.status === "ÃƒÂ  venir") && isDateOnOrAfterToday(rdv.date) && (
                          <span className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium">
                            Ãƒâ‚¬ venir
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
                          aria-label={`Annuler le rendez-vous du ${new Date(rdv.date).toLocaleDateString("fr-FR")} ÃƒÂ  ${
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
                    <Label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="prenom">PrÃƒÂ©nom</Label>
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
                    <p className="text-sm text-gray-500">{profile.nom || "Non dÃƒÂ©fini"}</p>
                  </div>
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">PrÃƒÂ©nom</Label>
                    <p className="text-sm text-gray-500">{profile.prenom || "Non dÃƒÂ©fini"}</p>
                  </div>
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">Date de naissance</Label>
                    <p className="text-sm text-gray-500">
                      {profile.dateNaissance
                        ? new Date(profile.dateNaissance).toLocaleDateString("fr-FR")
                        : "Non dÃƒÂ©fini"}
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
                    <Label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="telephone">TÃ©lÃ©phone</Label>
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
                    <p className="text-sm text-gray-500">{profile.email || "Non dÃƒÂ©fini"}</p>
                  </div>
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">TÃ©lÃ©phone</Label>
                    <p className="text-sm text-gray-500">{profile.telephone || "Non dÃƒÂ©fini"}</p>
                  </div>
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">Adresse</Label>
                    <p className="text-sm text-gray-500">{profile.adresse || "Non dÃƒÂ©fini"}</p>
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
        newErrors.specialty = "Veuillez sÃƒÂ©lectionner une spÃƒÂ©cialitÃƒÂ©.";
      }
      if (step === 2 && !selectedDate) {
        newErrors.date = "Veuillez sÃƒÂ©lectionner une date.";
      }
      if (step === 2 && !selectedTime) {
        newErrors.time = "Veuillez sÃƒÂ©lectionner une heure.";
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
            aria-label="Fermer la fenÃƒÂªtre de prise de rendez-vous"
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
              1. SpÃƒÂ©cialitÃƒÂ©
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
                Choisissez une spÃƒÂ©cialitÃƒÂ©
              </h4>
              <div className="relative">
                <Input
                  type="text"
                  value={specialtySearch}
                  onChange={(e) => setSpecialtySearch(e.target.value)}
                  onFocus={() => setIsSpecialtyDropdownOpen(true)}
                  placeholder="Rechercher une spÃƒÂ©cialitÃƒÂ©..."
                  className="w-full rounded-xl px-4 py-3 pl-10 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all"
                  aria-label="Rechercher une spÃƒÂ©cialitÃƒÂ©"
                />
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                {isSpecialtyDropdownOpen && (
                  <div className="absolute z-50 mt-2 w-full bg-white rounded-xl shadow-2xl border border-gray-200 max-h-64 overflow-y-auto">
                    {specialtiesLoading ? (
                      <p className="p-4 text-gray-500 text-center">Chargement des spÃƒÂ©cialitÃƒÂ©s...</p>
                    ) : specialtiesError ? (
                      <p className="p-4 text-red-500 text-center">Erreur lors du chargement des spÃƒÂ©cialitÃƒÂ©s</p>
                    ) : filteredSpecialties.length === 0 ? (
                      <p className="p-4 text-gray-500 text-center">Aucune spÃƒÂ©cialitÃƒÂ© trouvÃƒÂ©e</p>
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
                              addToHistory("SÃƒÂ©lection spÃƒÂ©cialitÃƒÂ©", `SÃƒÂ©lection de la spÃƒÂ©cialitÃƒÂ©: ${specialty.name}`);
                            }}
                            className="cursor-pointer p-4 hover:bg-blue-50 transition-all duration-200 flex items-center gap-3"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                setSelectedSpecialtyObj(specialty);
                                setSpecialtySearch(specialty.name);
                                setIsSpecialtyDropdownOpen(false);
                                setBookingStep(2);
                                addToHistory("SÃƒÂ©lection spÃƒÂ©cialitÃƒÂ©", `SÃƒÂ©lection de la spÃƒÂ©cialitÃƒÂ©: ${specialty.name}`);
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
                      toast.error("Veuillez sÃƒÂ©lectionner une spÃƒÂ©cialitÃƒÂ©.");
                    }
                  }}
                  aria-label="Passer ÃƒÂ  la sÃƒÂ©lection de date et heure"
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
                aria-label="Retour aux spÃƒÂ©cialitÃƒÂ©s"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Retour aux spÃƒÂ©cialitÃƒÂ©s
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
                    placeholderText="SÃƒÂ©lectionner une date"
                    className="w-full rounded-xl px-4 py-3 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer"
                    wrapperClassName="w-full"
                    locale="fr"
                    aria-label="SÃƒÂ©lectionner une date"
                  />
                  {errors.date && <p className="text-red-600 text-sm">{errors.date}</p>}
                </div>
                {selectedDate && availableSlots.length > 0 && (
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">CrÃƒÂ©neaux disponibles</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {availableSlots.map((slot, index) => (
                        <Button
                          key={`${slot.time}-${index}`}
                          variant={selectedTime === slot.time ? "default" : "outline"}
                          onClick={() => {
                            setSelectedTime(slot.time);
                          }}
                          className="rounded-xl px-4 py-3 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all duration-300"
                          aria-label={`SÃƒÂ©lectionner l'heure ${slot.time}`}
                        >
                          {slot.time}
                        </Button>
                      ))}
                    </div>
                    {errors.time && <p className="text-red-600 text-sm">{errors.time}</p>}
                  </div>
                )}
                {selectedDate && availableSlots.length === 0 && (
                  <p className="text-red-600 text-sm">Aucun crÃƒÂ©neau disponible pour cette date.</p>
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
                      toast.error("Veuillez sÃƒÂ©lectionner une date et une heure.");
                    }
                  }}
                  disabled={!selectedDate || !selectedTime}
                  aria-label="Passer ÃƒÂ  la confirmation"
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
                aria-label="Retour ÃƒÂ  la sÃƒÂ©lection de date et heure"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Retour
              </button>
              <h4 className="font-semibold text-lg text-gray-700">
                Confirmer votre rendez-vous
              </h4>
              <div className="space-y-4">
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">SpÃƒÂ©cialitÃƒÂ©</Label>
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
          {secondaryView === "profil" && renderProfilPage()}
          {secondaryView === "prendreRdv" && renderAccueilPage()}
          {isModalOpen && renderModal()}
        </div>
      </div>
    </main>
  );
};

export default PatientDashboard;
