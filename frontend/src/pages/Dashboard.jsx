import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import PatientDashboard from "./PatientDashboard";
import MedecinDashboard from "./MedecinDashboard";

import RdvPage from "./section/RdvPage";
import TimeSlotsAdmin from "./section/TimeSlotsAdmin";
import AdminInventoryStock from "./section/AdminInventoryStock";
import AdminAuditLog from "./section/AdminAuditLog";
import AdminConfiguration from "./section/AdminConfiguration";
import AdminArchive from "./section/AdminArchive";
import AdminAIAssistant from "./section/AdminAIAssistant";
import AdminEmergency from "./section/AdminEmergency";
import AdminMedicalRecords from "./section/AdminMedicalRecords";

import { Users2, CalendarCheck, X, Bell, History, Plus, UserCheck, Stethoscope, Search, Menu, BarChart3, LogOut, User, AlertTriangle, FileText, Archive, Package, Settings2, Bot } from "lucide-react";
import Swal from 'sweetalert2';
import axios from "axios";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import Loading from "@/components/ui/loading";
import EmptyState from "@/components/ui/empty-state";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import React from "react";
import { toast as sonnerToast } from "sonner";

const _apiBaseRaw = import.meta.env.VITE_API_URL || "http://localhost:3000";
const _apiBase = String(_apiBaseRaw).replace(/\/+$/, "");
const API_BASE_URL = _apiBase.endsWith("/api") ? _apiBase : `${_apiBase}/api`;

const Dashboard = () => {
  const [role, setRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [activeView, setActiveView] = useState("stats");
  const [activeUserTab, setActiveUserTab] = useState("all");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSortConfig, setUserSortConfig] = useState({ key: "username", direction: "asc" });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "patient",
    specialite: "",
    age: "",
  });
  const [rendezVous, setRendezVous] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [timeSlotsTotal, setTimeSlotsTotal] = useState(0);
  const [serverStats, setServerStats] = useState(null);
  const [lastStatsRefresh, setLastStatsRefresh] = useState(null);

  const [showAlerts, setShowAlerts] = useState(false);
  const [alerts, setAlerts] = useState([]);

  const [editUserData, setEditUserData] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profilData, setProfilData] = useState({
    username: "",
    email: "",
    telephone: "",
    adresse: "",
  });
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientModal, setShowPatientModal] = useState(false);

  const patientList = useMemo(() => users.filter((u) => u.role === "patient"), [users]);
  const medecinList = useMemo(() => users.filter((u) => u.role === "medecin"), [users]);

  const navigate = useNavigate();

  // Keep a stable API client to avoid repeated effects and duplicate calls.
  const api = useMemo(() => {
    return axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
  }, []);

  // Update Axios headers when token changes
  useEffect(() => {
    api.defaults.headers.Authorization = `Bearer ${localStorage.getItem("token")}`;
  }, [api, currentUser?.id]);

  // Fetch initial data (user, users, history, alerts)
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");

    if (!token || !storedRole) {
      navigate("/");
      return;
    }

    setRole(storedRole);

    const fetchUser = async () => {
      try {
        const response = await api.get("/auth/me");
        const user = response.data;
        setCurrentUser(user);
        setProfilData({
          username: user.username || "",
          email: user.email || "",
          telephone: user.telephone || "",
          adresse: user.adresse || "",
        });
      } catch (err) {
        console.error("Error fetching user:", err);
        sonnerToast.error("Erreur lors de la récupération du profil utilisateur.");
        navigate("/");
      }
    };

    const fetchUsers = async () => {
      if (storedRole === "admin" || storedRole === "staff" || storedRole === "medecin") {
        try {
          const response = await api.get("/auth/users");
          setUsers(response.data);
        } catch (err) {
          console.error("Error fetching users:", err);
          sonnerToast.error("Erreur lors de la récupération des utilisateurs." );
        }
      }
    };



    const fetchAlerts = async () => {
      try {
        if (['admin', 'staff'].includes(storedRole)) {
          const usersResponse = await api.get("/auth/users", { params: { role: "patient" } });
          const appointmentsResponse = await api.get("/appointments");
          const newUserAlerts = usersResponse.data
            .filter((user) => user.isNew)
            .map((user) => ({
              id: `user-${user.id}`,
              message: `Nouvel utilisateur ajouté: ${user.username} (${user.role})`,
            }));
          const newRdvAlerts = appointmentsResponse.data
            .filter((rdv) => rdv.isNew)
            .map((rdv) => ({
              id: `rdv-${rdv.id}`,
              message: `Nouveau rendez-vous pour ${rdv.patient?.username || "Patient"} le ${rdv.date}`,
            }));
          setAlerts([...newUserAlerts, ...newRdvAlerts]);
        }
      } catch (err) {
        console.error("Error fetching alerts:", err);
        sonnerToast.error("Erreur lors de la récupération des alertes." );
      }
    };

    fetchUser();
    fetchUsers();
    fetchAlerts();
  }, [navigate, api]);

  // Fetch appointments for relevant roles
  useEffect(() => {
    if (currentUser && ['medecin', 'admin', 'staff'].includes(currentUser.role)) {
      const fetchAppointments = async () => {
        try {
          const response = await api.get("/appointments", { params: { limit: 100, recent: true } });
          setRendezVous(response.data);
        } catch (err) {
          console.error("Error fetching appointments:", err);
          sonnerToast.error("Erreur lors de la récupération des rendez-vous." );
        }
      };
      fetchAppointments();
    }
  }, [api, currentUser]);

  // Fetch time slots for admin
  useEffect(() => {
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'staff')) {
      const fetchTimeSlots = async () => {
        try {
          const response = await api.get("/time-slots/admin", { params: { limit: 1000 } });
          const items = response.data.items || response.data || [];
          const total = response.data.total || items.length;
          setTimeSlots(Array.isArray(items) ? items : []);
          setTimeSlotsTotal(total);
          console.log("Time slots loaded:", items.length, "/ Total:", total);
        } catch (err) {
          console.error("Error fetching time slots:", err);
        }
      };
      fetchTimeSlots();
    }
  }, [api, currentUser?.id, currentUser?.role]);

  // Memoize stats calculation to optimize performance and ensure persistence
  const stats = useMemo(() => {
    if (serverStats) return serverStats;
    if (!users || !rendezVous) return <Loading />;

    const calculatedStats = {
      totalPatients: users.filter(user => user.role === "patient").length,
      totalMedecins: users.filter(user => user.role === "medecin").length,
    };

    const userRoleData = [
      { name: 'Patients', value: calculatedStats.totalPatients, fill: '#3b82f6' },
      { name: 'Médecins', value: calculatedStats.totalMedecins, fill: '#10b981' },
    ];

    const appointmentMap = rendezVous.reduce((acc, rdv) => {
      const date = new Date(rdv.date).toLocaleDateString("fr-FR");
      if (!acc[date]) acc[date] = 0;
      acc[date]++;
      return acc;
    }, {});

    const appointmentData = Object.entries(appointmentMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-7);

    return {
      ...calculatedStats,
      userRoleData,
      appointmentData,
    };
  }, [users, rendezVous, serverStats]);

  // Add entry to history log
  const addToHistory = async (action, details, user = currentUser) => {
    const historyEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      user: user?.username || "Système",
      role: user?.role || "system",
      action,
      details,
      date: new Date().toLocaleDateString("fr-FR"),
      time: new Date().toLocaleTimeString("fr-FR"),
    };

    try {
      await api.post("/history", {
        userId: user?.id || currentUser?.id,
        action,
        description: details,
      });
    } catch (apiError) {
      console.error("Error sending history to backend:", apiError);
    }

    try {
      const existingHistory = JSON.parse(localStorage.getItem("appHistory") || "[]");
      const updatedHistory = [historyEntry, ...existingHistory].slice(0, 1000);
      localStorage.setItem("appHistory", JSON.stringify(updatedHistory));
    } catch (err) {
      console.error("Error adding to history:", err);
      sonnerToast.error("Erreur lors de l'ajout Ã  l'historique." );
    }
  };

  // Handle user logout
  const logout = async () => {
    try {
      await addToHistory("Déconnexion", "Déconnexion de l'application");
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      setCurrentUser(null);
      navigate("/");
      sonnerToast.success("Déconnexion réussie" );
    } catch (err) {
      console.error("Error during logout:", err);
      sonnerToast.error("Erreur lors de la déconnexion." );
    }
  };

  // Update profile data
  const handleProfilChange = (field, value) => {
    setProfilData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Save profile changes
  const handleSaveProfil = async () => {
    try {
      await api.put("/auth/me", profilData);
      setCurrentUser((prev) => ({ ...prev, ...profilData }));
      addToHistory("Mise à jour profil", "Sauvegarde des modifications du profil", currentUser);
      setActiveView("users");
      sonnerToast.success("Profil mis à jour", { description: "Les informations du profil ont été sauvegardées." });
    } catch (error) {
      console.error("Error saving profile:", error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || "Erreur inconnue";
      sonnerToast.error("Erreur lors de la sauvegarde du profil", {
        description: errorMessage,
      });
    }
  };

  // Filter and sort displayed users
  const getDisplayedUsers = () => {
    let filteredUsers = users;

    if (activeUserTab !== "all") {
      filteredUsers = filteredUsers.filter((user) => user.role === activeUserTab);
    }

    if (userSearchQuery) {
      const query = userSearchQuery.toLowerCase();
      filteredUsers = filteredUsers.filter(
        (user) =>
          user.username.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          (user.specialite && user.specialite.toLowerCase().includes(query))
      );
    }

    filteredUsers.sort((a, b) => {
      const valueA = a[userSortConfig.key] || "";
      const valueB = b[userSortConfig.key] || "";
      if (valueA < valueB) return userSortConfig.direction === "asc" ? -1 : 1;
      if (valueA > valueB) return userSortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return filteredUsers;
  };

  const displayUsers = getDisplayedUsers();
  const patientCount = users.filter((user) => user.role === "patient").length;
  const medecinCount = users.filter((user) => user.role === "medecin").length;

  // Start editing a user
  const _startEditing = (index) => {
    const userToEdit = displayUsers[index];
    setEditUserData({ ...userToEdit });
  };

  // Handle user data changes during editing
  const _handleUserChange = (field, value) => {
    setEditUserData((prev) => ({ ...prev, [field]: value }));
  };

  // Save edited user
  const _saveUser = async (index) => {
    const userToUpdate = displayUsers[index];
    try {
      const response = await api.put(`/auth/users/${userToUpdate.id}`, editUserData);
      const updatedUsers = users.map((u) =>
        u.id === userToUpdate.id ? { ...response.data, isNew: false } : u
      );
      setUsers(updatedUsers);
      setAlerts((prev) => prev.filter((alert) => alert.id !== `user-${userToUpdate.id}`));
      sonnerToast.success(`Utilisateur "${editUserData.username}" sauvegarde !`);
      await addToHistory(
        "Modification utilisateur",
        `Modification du profil de ${editUserData.username}`
      );
      setEditUserData(null);
    } catch (err) {
      console.error("Error updating user:", err);
      sonnerToast.error("Erreur lors de la mise a jour de l'utilisateur.");
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!newUserForm.username.trim() || !newUserForm.email.trim() || !newUserForm.password.trim()) {
        sonnerToast.error("Nom, email et mot de passe sont requis.");
        return;
      }

      const payload = {
        username: newUserForm.username.trim(),
        email: newUserForm.email.trim(),
        password: newUserForm.password,
        role: newUserForm.role,
        age: newUserForm.age ? Number(newUserForm.age) : undefined,
        specialite: newUserForm.role === "medecin" ? newUserForm.specialite : undefined,
      };

      const response = await api.post("/auth/users", payload);
      setUsers((prev) => [...prev, response.data]);
      await addToHistory("Creation utilisateur", `Creation du compte ${response.data.username} (${response.data.role})`);
      sonnerToast.success(`Utilisateur "${response.data.username}" ajoute.`);

      setNewUserForm({
        username: "",
        email: "",
        password: "",
        role: "patient",
        specialite: "",
        age: "",
      });
      setShowAddModal(false);
    } catch (error) {
      console.error("Error creating user:", error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || "Erreur de creation utilisateur";
      sonnerToast.error(errorMessage);
    }
  };

  // Delete a user
  const _deleteUser = async (index) => {
    if (!window.confirm("Etes-vous sur de vouloir supprimer cet utilisateur ?")) return;

    const userToDelete = displayUsers[index];
    try {
      await api.delete(`/auth/users/${userToDelete.id}`);
      const updatedUsers = users.filter((u) => u.id !== userToDelete.id);
      setUsers(updatedUsers);
      setAlerts((prev) => prev.filter((alert) => alert.id !== `user-${userToDelete.id}`));
      sonnerToast.success(`Utilisateur "${userToDelete.username}" supprime !`);
      await addToHistory(
        "Suppression utilisateur",
        `Suppression de l'utilisateur ${userToDelete.username} (${userToDelete.role})`
      );

      if (currentUser && userToDelete.id === currentUser.id) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        setCurrentUser(null);
        navigate("/");
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      sonnerToast.error("Erreur lors de la suppression de l'utilisateur.");
    }
  };



  // Toggle alerts visibility
  const handleShowAlerts = async () => {
    setShowAlerts(!showAlerts);
    if (!showAlerts) {
      try {
        const updatedUsers = users.map((user) => ({ ...user, isNew: false }));
        const updatedRdv = rendezVous.map((rdv) => ({ ...rdv, isNew: false }));
        setUsers(updatedUsers);
        setRendezVous(updatedRdv);
        setAlerts([]);
        await addToHistory("Consultation alertes", "Consultation et marquage des alertes comme lues");
      } catch (err) {
        console.error("Error clearing alerts:", err);
        sonnerToast.error("Erreur lors de la gestion des alertes." );
      }
    }
  };

  // Dismiss a single alert
  const dismissAlert = (id) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  // Clear all alerts
  const clearAllAlerts = async () => {
    try {
      setAlerts([]);
      const updatedUsers = users.map((user) => ({ ...user, isNew: false }));
      const updatedRdv = rendezVous.map((rdv) => ({ ...rdv, isNew: false }));
      setUsers(updatedUsers);
      setRendezVous(updatedRdv);
      await addToHistory("Suppression alertes", "Toutes les alertes ont été supprimées");
    } catch (err) {
      console.error("Error clearing all alerts:", err);
      sonnerToast.error("Erreur lors de la suppression des alertes." );
    }
  };



  // Show appointments view
  const handleShowRendezVous = () => {
    setActiveView("appointments");
    addToHistory("Consultation rendez-vous", "Ouverture de la page des rendez-vous");
    setIsSidebarOpen(false);
  };

  // Show archive (past appointments) view
  const handleShowArchive = async () => {
    setActiveView("archive");
    addToHistory("Consultation archive", "Ouverture de la page d'archive");
    setIsSidebarOpen(false);
    try {
      const response = await api.get("/appointments", { params: { past: true, limit: 200 } });
      setRendezVous(response.data);
    } catch (err) {
      console.error("Error fetching archive appointments:", err);
      sonnerToast.error("Erreur lors de la récupération de l'archive des rendez-vous." );
    }
  };

  // Show users view
  const handleShowUsers = () => {
    setActiveView("users");
    addToHistory("Consultation utilisateurs", "Ouverture de la page des utilisateurs");
    setIsSidebarOpen(false);
  };

  // Sort users table
  const _handleSort = (key) => {
    const direction = userSortConfig.key === key && userSortConfig.direction === "asc" ? "desc" : "asc";
    setUserSortConfig({ key, direction });
  };

  const transformServerStats = (data) => {
    const userRoleData = [
      { name: "Patients", value: data.totalPatients || 0, fill: "#3b82f6" },
      { name: "Medecins", value: data.totalMedecins || 0, fill: "#10b981" },
    ];

    const appointmentCounts = {};
    (data.recentActivity || []).forEach((a) => {
      const date = new Date(a.date).toLocaleDateString("fr-FR");
      appointmentCounts[date] = (appointmentCounts[date] || 0) + 1;
    });

    const appointmentData = Object.entries(appointmentCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return { ...data, userRoleData, appointmentData };
  };

  const fetchServerStats = async (silent = false) => {
    try {
      const resp = await api.get("/stats");
      const data = resp.data || {};
      setServerStats(transformServerStats(data));
      setLastStatsRefresh(new Date().toISOString());
    } catch (err) {
      console.error("Error fetching server stats:", err);
      if (!silent) {
        sonnerToast.error("Erreur lors de la recuperation des statistiques.");
      }
      setServerStats(null);
    }
  };

  // Show stats view
  const handleShowStats = () => {
    setActiveView("stats");
    addToHistory("Consultation statistiques", "Ouverture de la page des statistiques");
    setIsSidebarOpen(false);
    fetchServerStats();
  };

  useEffect(() => {
    if (!["admin", "staff"].includes(role) || activeView !== "stats") return;

    fetchServerStats(true);
    const intervalId = setInterval(() => {
      fetchServerStats(true);
    }, 15000);

    return () => clearInterval(intervalId);
  }, [role, activeView]);


  // Memoized chart components to prevent unnecessary re-renders
  const MemoizedPieChart = React.memo(() => (
    <PieChart width={Math.min(window.innerWidth * 0.8, 300)} height={Math.min(window.innerWidth * 0.8, 300)}>
      <Pie
        data={stats?.userRoleData}
        dataKey="value"
        nameKey="name"
        cx="50%"
        cy="50%"
        outerRadius={Math.min(window.innerWidth * 0.3, 100)}
        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
      >
        {stats?.userRoleData.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.fill} />
        ))}
      </Pie>
      <ChartTooltip content={<ChartTooltipContent />} />
    </PieChart>
  ));

  const MemoizedLineChart = React.memo(() => (
    <LineChart width={Math.min(window.innerWidth * 0.8, 300)} height={Math.min(window.innerWidth * 0.8, 300)} data={stats?.appointmentData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" fontSize={12} />
      <YAxis fontSize={12} />
      <ChartTooltip content={<ChartTooltipContent />} />
      <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} />
    </LineChart>
  ));

  // Admin/Staff Dashboard component
  const AdminStaffDashboard = ({ label, currentUser }) => {
    const renderHeader = () => (
      <div className="flex justify-between items-center border-b border-white/30 pb-5">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-700 tracking-tight">
          Bienvenue, {currentUser?.username || label}
        </h1>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            className="p-2 rounded-full text-gray-700 hover:bg-gradient-to-r hover:from-cyan-500 hover:to-blue-600 hover:text-white transition-all duration-200 relative"
            title="Alertes"
            onClick={handleShowAlerts}
          >
            <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs px-1.5 sm:px-2 py-0.5">
                {alerts.length}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            className="p-2 rounded-full text-gray-700 hover:bg-gradient-to-r hover:from-cyan-500 hover:to-blue-600 hover:text-white transition-all duration-200"
            onClick={() => setActiveView("profil")}
            title="Mon Profil"
          >
            <User className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>
          <Button
            variant="ghost"
            className="p-2 rounded-full text-gray-700 hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-600 hover:text-white transition-all duration-200"
            onClick={logout}
            title="Déconnexion"
          >
            <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet</label>
                <input
                  type="text"
                  value={profilData.username}
                  onChange={(e) => handleProfilChange("username", e.target.value)}
                  className="w-full rounded-xl px-4 py-3 border border-gray-200 focus:ring-4 focus:ring-blue-500/50 focus:outline-none transition-all text-sm touch-manipulation"
                />
              </div>
            </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
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
          <div className="mt-6 pt-4 border-t border-white/30 flex justify-end gap-4 flex-wrap">
            <Button
              variant="outline"
              className="px-6 py-3 rounded-xl border-gray-200 text-gray-700 hover:bg-gradient-to-r hover:from-gray-500 hover:to-gray-600 hover:text-white transition-all duration-200 shadow-md hover:shadow-lg text-sm touch-manipulation"
              onClick={() => setActiveView("users")}
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

    return (
      <>
        <button
          className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <div
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-white/80 backdrop-blur-lg shadow-xl transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col border-r border-white/30`}
        >
          <div className="p-4 border-b border-white/30">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-700">Tableau de bord</h2>
            <p className="text-sm text-gray-500">{label} {currentUser?.username}</p>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {[
              { view: "archive", icon: Archive, label: "Archives" },
              { view: "ai-assistants", icon: Bot, label: "Assistants IA" },
              { view: "configuration", icon: Settings2, label: "Configuration" },
              { view: "timeslots", icon: CalendarCheck, label: "Creneaux admin" },
              { view: "medical-records", icon: FileText, label: "Dossiers medicaux" },
              { view: "inventory-stock", icon: Package, label: "Inventaire et stock" },
              { view: "audit-log", icon: History, label: "Journal d'audit" },
              { view: "appointments", icon: CalendarCheck, label: "Rendez-vous" },
              { view: "stats", icon: BarChart3, label: "Statistiques" },
              { view: "emergency", icon: AlertTriangle, label: "Urgences" },
              { view: "users", icon: Users2, label: "Utilisateurs" },
            ]
              .sort((a, b) => a.label.localeCompare(b.label, "fr", { sensitivity: "base" }))
              .map(({ view, icon, label }) => (
                <Button
                  key={view}
                  variant={activeView === view ? "default" : "ghost"}
                  className={`w-full justify-start gap-2 rounded-xl text-sm ${activeView === view ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white" : "text-gray-700"} hover:bg-gradient-to-r hover:from-cyan-600 hover:to-blue-700 hover:text-white transition-all duration-300`}
                  onClick={() => {
                    if (view === "stats") {
                      handleShowStats();
                    } else if (view === "appointments") {
                      handleShowRendezVous();
                    } else if (view === "users") {
                      handleShowUsers();
                    } else {
                      setActiveView(view);
                      addToHistory("Navigation", `Ouverture de la vue ${view}`);
                      setIsSidebarOpen(false);
                    }
                  }}
                >
                  {React.createElement(icon, { className: "w-5 h-5" })}
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
        <div className="md:ml-64 relative z-10 flex flex-col min-h-screen p-2">
          <div className="container mx-auto px-2 py-8 space-y-8 w-full">
            {renderHeader()}
            {showAlerts && (
              <div className="p-4 sm:p-6 bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-700">Alertes</h3>
                  {alerts.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllAlerts}
                      className="rounded-xl border-gray-200 text-gray-700 hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-600 hover:text-white"
                    >
                      Tout supprimer
                    </Button>
                  )}
                </div>
                {alerts.length === 0 ? (
                  <p className="text-gray-500 text-xs sm:text-sm">Aucune alerte pour le moment.</p>
                ) : (
                  <ul className="space-y-3">
                    {alerts.map((alert) => (
                      <li
                        key={alert.id}
                        className="p-3 bg-gray-50/80 rounded-xl flex justify-between items-center transition-colors duration-200 hover:bg-gray-100/50"
                      >
                        <span className="text-gray-700 text-xs sm:text-sm">{alert.message}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => dismissAlert(alert.id)}
                          className="text-red-600 hover:text-red-700 p-1 rounded-full"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {showAddModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 transition-all duration-300 animate-fade-in overflow-y-auto">
                <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-lg w-full mx-4 p-6">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-full p-2"
                    aria-label="Fermer"
                  >
                    <X className="w-6 h-6" />
                  </button>

                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Ajouter un utilisateur</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Nom d'utilisateur"
                      value={newUserForm.username}
                      onChange={(e) => setNewUserForm((prev) => ({ ...prev, username: e.target.value }))}
                      className="w-full rounded-xl px-4 py-3 border border-gray-200 focus:ring-4 focus:ring-blue-500/50 focus:outline-none"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={newUserForm.email}
                      onChange={(e) => setNewUserForm((prev) => ({ ...prev, email: e.target.value }))}
                      className="w-full rounded-xl px-4 py-3 border border-gray-200 focus:ring-4 focus:ring-blue-500/50 focus:outline-none"
                    />
                    <input
                      type="password"
                      placeholder="Mot de passe"
                      value={newUserForm.password}
                      onChange={(e) => setNewUserForm((prev) => ({ ...prev, password: e.target.value }))}
                      className="w-full rounded-xl px-4 py-3 border border-gray-200 focus:ring-4 focus:ring-blue-500/50 focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Age (optionnel)"
                      value={newUserForm.age}
                      onChange={(e) => setNewUserForm((prev) => ({ ...prev, age: e.target.value }))}
                      className="w-full rounded-xl px-4 py-3 border border-gray-200 focus:ring-4 focus:ring-blue-500/50 focus:outline-none"
                    />
                    <select
                      value={newUserForm.role}
                      onChange={(e) => setNewUserForm((prev) => ({ ...prev, role: e.target.value }))}
                      className="w-full rounded-xl px-4 py-3 border border-gray-200 focus:ring-4 focus:ring-blue-500/50 focus:outline-none"
                    >
                      <option value="patient">Patient</option>
                      <option value="medecin">Medecin</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                    {newUserForm.role === "medecin" && (
                      <input
                        type="text"
                        placeholder="Specialite"
                        value={newUserForm.specialite}
                        onChange={(e) => setNewUserForm((prev) => ({ ...prev, specialite: e.target.value }))}
                        className="w-full rounded-xl px-4 py-3 border border-gray-200 focus:ring-4 focus:ring-blue-500/50 focus:outline-none"
                      />
                    )}
                  </div>

                  <div className="flex justify-end gap-2 mt-5">
                    <Button variant="outline" onClick={() => setShowAddModal(false)}>
                      Annuler
                    </Button>
                    <Button
                      onClick={handleCreateUser}
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                    >
                      Creer
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {showPatientModal && selectedPatient && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300 animate-fade-in">
                <div className="relative bg-white/95 rounded-2xl shadow-2xl border border-gray-100/50 max-w-2xl w-full mx-4 p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
                  <button
                    onClick={() => setShowPatientModal(false)}
                    className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-full p-2 transition-colors duration-200"
                    aria-label="Fermer les détails du patient"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <div className="text-center mb-6">
                    <User className="w-14 h-14 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                      Détails du Patient
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Informations complètes du patient sélectionné
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet</label>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-xl">{selectedPatient.username || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-xl">{selectedPatient.email || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-xl">{selectedPatient.telephone || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Âge</label>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-xl">{selectedPatient.age ? `${selectedPatient.age} ans` : 'Inconnu'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Rôle</label>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-xl capitalize">{selectedPatient.role || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Spécialité</label>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-xl">{selectedPatient.specialite || 'N/A'}</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-xl min-h-[80px]">{selectedPatient.adresse || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                    <Button
                      onClick={() => setShowPatientModal(false)}
                      className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-6 py-3 rounded-xl transition-all duration-200"
                    >
                      Fermer
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <div className="transition-opacity duration-300 animate-fade-in">
              {activeView === "profil" && renderProfilPage()}

              {activeView === "timeslots" && (
                <div>
                  <TimeSlotsAdmin currentUser={currentUser} />
                </div>
              )}

              {activeView === "users" && (
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 p-4 sm:p-6">
                  <div className="flex justify-between items-center mb-4 sm:mb-6">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-semibold text-gray-700">Gestion des utilisateurs</h3>
                    </div>
                    <Button
                      onClick={() => setShowAddModal(true)}
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl text-xs sm:text-sm"
                    >
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Ajouter
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-3 py-1 rounded-full bg-cyan-100 text-cyan-700 text-xs font-medium">Total: {users.length}</span>
                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">Patients: {patientCount}</span>
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">Medecins: {medecinCount}</span>
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">Affiches: {displayUsers.length}</span>
                  </div>
                  
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 sm:left-5 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                      <input
                        type="text"
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="w-full rounded-xl px-10 sm:px-12 py-2 sm:py-4 border border-gray-200 focus:ring-4 focus:ring-blue-500/50 focus:outline-none transition-all text-xs sm:text-sm"
                        placeholder="Rechercher par nom, email ou spécialité..."
                      />
                    </div>
                  </div>
                  {displayUsers.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <Users2 className="w-12 h-12 sm:w-16 sm:h-16 text-gray-500 mx-auto mb-4" />
                      <h4 className="text-base sm:text-lg font-medium text-gray-500 mb-2">Aucun utilisateur</h4>
                      <p className="text-xs sm:text-sm text-gray-500 mb-4">Commencez par ajouter des patients ou des médecins.</p>
                      <Button
                        onClick={() => setShowAddModal(true)}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl text-xs sm:text-sm"
                      >
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                        Ajouter le premier utilisateur
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-white/30">
                        <thead className="bg-gray-50/80">
                          <tr>
                            <th className="border border-white/30 p-2 text-left text-sm font-medium text-gray-700">Nom utilisateur</th>
                            <th className="border border-white/30 p-2 text-left text-sm font-medium text-gray-700 hidden md:table-cell">Âge</th>
                            <th className="border border-white/30 p-2 text-left text-sm font-medium text-gray-700 hidden lg:table-cell">Email</th>
                            <th className="border border-white/30 p-2 text-left text-sm font-medium text-gray-700 hidden xl:table-cell">Téléphone</th>
                            <th className="border border-white/30 p-2 text-left text-sm font-medium text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50/50">
                              <td className="border border-white/30 p-2 text-sm font-medium text-gray-700">{user.username || 'N/A'}</td>
                              <td className="border border-white/30 p-2 text-sm text-gray-500 hidden md:table-cell">{user.age || 'Inconnu'} ans</td>
                              <td className="border border-white/30 p-2 text-sm text-gray-500 hidden lg:table-cell">{user.email || 'N/A'}</td>
                              <td className="border border-white/30 p-2 text-sm text-gray-500 hidden xl:table-cell">{user.telephone || 'N/A'}</td>
                                                            <td className="border border-white/30 p-2 text-sm text-gray-500">
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-xl border-gray-200 text-gray-700 hover:bg-gradient-to-r hover:from-cyan-500 hover:to-blue-600 hover:text-white text-sm touch-manipulation"
                                    onClick={() => {
                                      setSelectedPatient(user);
                                      setShowPatientModal(true);
                                      addToHistory?.(
                                        "Consultation patient",
                                        `Consultation des détails du patient: ${user.username || 'N/A'}`,
                                        currentUser
                                      );
                                    }}
                                  >
                                    Détails
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-xl border-red-200 text-red-600 hover:bg-red-600 hover:text-white text-sm touch-manipulation"
                                    onClick={() => _deleteUser(displayUsers.findIndex((u) => u.id === user.id))}
                                  >
                                    Supprimer
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
              )}
              {activeView === "appointments" && (
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 p-4 sm:p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-semibold text-gray-700">Tous les rendez-vous</h3>
                      {/* <p className="text-xs sm:text-sm text-gray-500 mt-1">Interface amelioree pour la gestion centralisee des RDV.</p> */}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setActiveView("archive")}
                      className="rounded-xl border-gray-200 text-gray-700 hover:bg-gray-100"
                    >
                      Voir archives
                    </Button>
                  </div>
                  
                  <RdvPage rendezVous={rendezVous} setRendezVous={setRendezVous} addToHistory={addToHistory} />
                </div>
              )}
              {activeView === "archive" && (
                <AdminArchive api={api} />
              )}
              {activeView === "inventory-stock" && (
                <AdminInventoryStock addToHistory={addToHistory} currentUser={currentUser} />
              )}
              {activeView === "audit-log" && (
                <AdminAuditLog api={api} />
              )}
              {activeView === "configuration" && (
                <AdminConfiguration addToHistory={addToHistory} currentUser={currentUser} />
              )}
              {activeView === "ai-assistants" && (
                <AdminAIAssistant addToHistory={addToHistory} currentUser={currentUser} />
              )}
              {activeView === "emergency" && (
                <AdminEmergency
                  addToHistory={addToHistory}
                  currentUser={currentUser}
                  patients={patientList}
                />
              )}
              {activeView === "medical-records" && (
                <AdminMedicalRecords
                  addToHistory={addToHistory}
                  currentUser={currentUser}
                  patients={patientList}
                  medecins={medecinList}
                />
              )}
              {activeView === "stats" && (
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 p-4 sm:p-6">
                  <h3 className="text-xl sm:text-2xl font-semibold text-gray-700 text-center mb-2">Statistiques du Systeme (temps reel)</h3>
                  <p className="text-center text-xs text-gray-500 mb-6">
                    Derniere synchronisation: {lastStatsRefresh ? new Date(lastStatsRefresh).toLocaleTimeString("fr-FR") : "--:--:--"}
                  </p>
                  {stats ? (
                    <div className="space-y-6 sm:space-y-8">
                      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 p-4 sm:p-6">
                        <h4 className="text-base sm:text-lg font-semibold text-gray-700 mb-4 text-center">Indicateurs globaux d'utilisation</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                          <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/80">
                            <p className="text-gray-500">Utilisateurs</p>
                            <p className="font-semibold text-gray-700">{stats.totalUsers ?? users.length}</p>
                          </div>
                          <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/80">
                            <p className="text-gray-500">Patients</p>
                            <p className="font-semibold text-gray-700">{stats.totalPatients ?? patientCount}</p>
                          </div>
                          <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/80">
                            <p className="text-gray-500">Medecins</p>
                            <p className="font-semibold text-gray-700">{stats.totalMedecins ?? medecinCount}</p>
                          </div>
                          <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/80">
                            <p className="text-gray-500">Rendez-vous</p>
                            <p className="font-semibold text-gray-700">{stats.totalAppointments ?? rendezVous.length}</p>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 p-4 sm:p-6">
                          <h4 className="text-base sm:text-lg font-semibold text-gray-700 mb-4 text-center">Répartition des rôles</h4>
                          <ChartContainer
                            config={{
                              Patients: { label: "Patients", color: "#3b82f6" },
                              Medecins: { label: "Medecins", color: "#10b981" },
                            }}
                            className="h-[200px] sm:h-[300px] w-full"
                          >
                            <MemoizedPieChart />
                          </ChartContainer>
                        </div>
                        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 p-4 sm:p-6">
                          <h4 className="text-base sm:text-lg font-semibold text-gray-700 mb-4 text-center">Rendez-vous quotidiens (7 derniers jours)</h4>
                          <ChartContainer
                            config={{
                              count: { label: "Rendez-vous", color: "#8b5cf6" },
                            }}
                            className="h-[200px] sm:h-[300px] w-full"
                          >
                            <MemoizedLineChart />
                          </ChartContainer>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 text-xs sm:text-sm">Aucune donnée disponible pour les statistiques.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-100 to-emerald-50 relative overflow-hidden w-full">
      <div className="absolute top-20 left-4 w-24 h-24 bg-gradient-to-br from-cyan-200 to-blue-300 rounded-full opacity-30 animate-pulse"></div>
      <div className="absolute bottom-20 right-4 w-32 h-32 bg-gradient-to-br from-emerald-200 to-cyan-300 rounded-full opacity-20 animate-bounce"></div>
      <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-gradient-to-br from-blue-200 to-emerald-200 rounded-full opacity-25 animate-ping hidden sm:block"></div>
      {role === "patient" && <PatientDashboard currentUser={currentUser} addToHistory={addToHistory} logout={logout} />}
      {role === "medecin" && <MedecinDashboard currentUser={currentUser} addToHistory={addToHistory} logout={logout} />}
      {(role === "admin" || role === "staff") && <AdminStaffDashboard label={role === "admin" ? "Administrateur" : "Personnel"} currentUser={currentUser} />}
    </main>
  );
};

export default Dashboard;









