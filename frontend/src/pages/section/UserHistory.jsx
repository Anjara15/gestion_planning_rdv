import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
import { ArrowLeft, Users2, Search, Filter, RefreshCw, Calendar, History, User, Clock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const FiltresHistory = ({ filters, onFiltersChange }) => {
  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const _resetFilters = () => {
    onFiltersChange({
      nom: "",
      email: "",
      dateRange: "all",
      dateSpecific: "",
    });
  };

  return (
    <Card className="bg-card border border-border shadow-md rounded-2xl">
      <CardContent className="p-6">
        {/* Header des filtres */}
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Filtres</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Recherche par nom */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Recherche par nom
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nom d'utilisateur..."
                value={filters.nom}
                onChange={(e) => handleFilterChange("nom", e.target.value)}
                className="pl-10 border-border focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Email
            </label>
            <Input
              placeholder="ex: user@mail.com"
              value={filters.email || ""}
              onChange={(e) => handleFilterChange("email", e.target.value)}
              className="border-border focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Action */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Action
            </label>
            <Input
              placeholder="ex: login, create..."
              value={filters.action || ""}
              onChange={(e) => handleFilterChange("action", e.target.value)}
              className="border-border focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* PÃƒÂ©riode */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              PÃƒÂ©riode
            </label>
            <Select
              value={filters.dateRange}
              onValueChange={(value) => handleFilterChange("dateRange", value)}
            >
              <SelectTrigger className="border-border focus:ring-2 focus:ring-primary/20">
                <SelectValue placeholder="Toutes les dates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les pÃƒÂ©riodes</SelectItem>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
                <SelectItem value="quarter">Ce trimestre</SelectItem>
                <SelectItem value="year">Cette annÃƒÂ©e</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date spÃƒÂ©cifique */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Date spÃƒÂ©cifique
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={filters.dateSpecific || ""}
                onChange={(e) => handleFilterChange("dateSpecific", e.target.value)}
                className="pl-10 border-border focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          </div>
      </CardContent>
    </Card>
  );
};

const UserHistory = () => {
  const { toast } = useToast();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    nom: "",
    email: "",
    action: "",
    dateRange: "all",
    dateSpecific: ""
  });

  // API base URL (use import.meta.env for Vite)
  const _apiBaseRaw = import.meta.env.VITE_API_URL || "http://localhost:3000";
const _apiBase = _apiBaseRaw.replace(/\/+$/, "");
const API_BASE_URL = _apiBase.endsWith("/api") ? _apiBase : `${_apiBase}/api`;

  // Helper function to get JWT token from localStorage
  const getToken = () => localStorage.getItem("token");

  // Fetch user history
  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (filters.dateRange && filters.dateRange !== "all") {
        queryParams.append("dateRange", filters.dateRange);
      }
      if (filters.action && filters.action.trim()) {
        queryParams.append("action", filters.action.trim());
      }

      const response = await fetch(`${API_BASE_URL}/history?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          toast.error("Session expirÃƒÂ©e. Veuillez vous reconnecter.");
          return;
        }
        throw new Error("Failed to fetch history");
      }

      const data = await response.json();
      setHistory(data.history || []);
    } catch (error) {
      console.error("Error fetching history:", error);
      setError("Erreur lors de la rÃƒÂ©cupÃƒÂ©ration de l'historique.");
      toast.error("Erreur lors de la rÃƒÂ©cupÃƒÂ©ration de l'historique.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [filters.dateRange, filters.action, filters.nom, filters.email]);

  const isDateInRange = (dateStr, range) => {
    if (!dateStr || !range || range === "all") return true;
    
    try {
      const userDate = new Date(dateStr);
      const today = new Date();
      const normalizeDate = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
      };
      
      const normalizedUserDate = normalizeDate(userDate);
      const normalizedToday = normalizeDate(today);
      
      switch (range) {
        case "today":
          return normalizedUserDate.getTime() === normalizedToday.getTime();
        case "week": {
          const startOfWeek = new Date(today);
          const dayOfWeek = today.getDay();
          startOfWeek.setDate(today.getDate() - dayOfWeek);
          const normalizedStartOfWeek = normalizeDate(startOfWeek);
          
          const endOfWeek = new Date(normalizedStartOfWeek);
          endOfWeek.setDate(normalizedStartOfWeek.getDate() + 6);
          
          return normalizedUserDate >= normalizedStartOfWeek && normalizedUserDate <= endOfWeek;
        }
        case "month":
          return userDate.getMonth() === today.getMonth() && userDate.getFullYear() === today.getFullYear();
        case "quarter": {
          const currentQuarter = Math.floor(today.getMonth() / 3);
          const userQuarter = Math.floor(userDate.getMonth() / 3);
          return userQuarter === currentQuarter && userDate.getFullYear() === today.getFullYear();
        }
        case "year":
          return userDate.getFullYear() === today.getFullYear();
        default:
          return true;
      }
    } catch (error) {
      console.error("Erreur lors de l'analyse de la date:", dateStr, error);
      return false;
    }
  };

  const filteredHistory = useMemo(() => {
    return history.filter((entry) => {
      // Filtre par nom
      if (filters.nom && filters.nom.trim()) {
        const searchTerm = filters.nom.toLowerCase().trim();
        const userName = (entry.user?.username || '').toLowerCase();
        if (!userName.includes(searchTerm)) {
          return false;
        }
      }

      // Filtre par email
      if (filters.email && filters.email.trim()) {
        const emailTerm = filters.email.toLowerCase().trim();
        const userEmail = (entry.user?.email || '').toLowerCase();
        if (!userEmail.includes(emailTerm)) {
          return false;
        }
      }

      // Filtre par action
      if (filters.action && filters.action.trim()) {
        const actionTerm = filters.action.toLowerCase().trim();
        const entryAction = (entry.action || '').toLowerCase();
        if (!entryAction.includes(actionTerm)) {
          return false;
        }
      }

      // Filtre par date spÃƒÂ©cifique
      if (filters.dateSpecific && filters.dateSpecific.trim()) {
        const entryDate = new Date(entry.createdAt).toISOString().split('T')[0];
        if (entryDate !== filters.dateSpecific) {
          return false;
        }
      }

      // Filtre par pÃƒÂ©riode (dÃƒÂ©jÃƒÂ  appliquÃƒÂ© cÃƒÂ´tÃƒÂ© serveur, mais on peut filtrer cÃƒÂ´tÃƒÂ© client pour dateSpecific)
      if (filters.dateRange && filters.dateRange !== "all") {
        if (!isDateInRange(entry.createdAt, filters.dateRange)) {
          return false;
        }
      }

      return true;
    });
  }, [history, filters]);

  // Statistiques
  const totalHistory = history.length;
  const newThisMonth = history.filter((entry) => {
    const d = new Date(entry.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const newThisWeek = history.filter((entry) => isDateInRange(entry.createdAt, "week")).length;

  return (
    <main className="min-h-screen container mx-auto px-6 py-10 space-y-10 bg-background text-foreground">
      {/* Filtres */}
      <section>
        <FiltresHistory filters={filters} onFiltersChange={setFilters} />
      </section>

      {/* Debug - Statistiques des filtres */}
      <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>Affichage: <span className="font-semibold">{filteredHistory.length}</span> / {totalHistory}</div>
          <div>Filtres actifs:
            <span className="font-semibold">
              {Object.values(filters).filter(v => v && v !== "all").length}
            </span>
          </div>
          <div>Ce mois: <span className="font-semibold">{newThisMonth}</span></div>
          <div>Cette semaine: <span className="font-semibold">{newThisWeek}</span></div>
        </div>
      </div>

      {/* Tableau stylÃƒÂ© */}
      <section>
        <div className="bg-card rounded-2xl shadow-md border border-border p-6 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Chargement de l'historique...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <p>{error}</p>
            </div>
          ) : (
            <table className="w-full border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-muted text-left">
                  <th className="p-3 font-semibold border-b">ID</th>
                  <th className="p-3 font-semibold border-b">Utilisateur</th>
                  <th className="p-3 font-semibold border-b">Email</th>
                  <th className="p-3 font-semibold border-b">Action</th>
                  <th className="p-3 font-semibold border-b">Description</th>
                  <th className="p-3 font-semibold border-b">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((entry, i) => (
                    <tr
                      key={entry.id ? `history-${entry.id}` : `history-index-${i}`}
                      className={`hover:bg-muted/50 transition-colors border-b ${
                        i % 2 === 0 ? "bg-background" : "bg-muted/20"
                      }`}
                    >
                      <td className="p-3">{entry.id || i + 1}</td>
                      <td className="p-3 font-medium">{entry.user?.username || 'N/A'}</td>
                      <td className="p-3 text-blue-600">{entry.user?.email || 'N/A'}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {entry.action || 'N/A'}
                        </span>
                      </td>
                      <td className="p-3 max-w-xs truncate" title={entry.description}>
                        {entry.description || 'N/A'}
                      </td>
                      <td className="p-3">
                        {entry.createdAt ? new Date(entry.createdAt).toLocaleString('fr-FR') : 'N/A'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr key="no-history-found">
                    <td
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {history.length === 0
                        ? "Aucune entrÃƒÂ©e d'historique trouvÃƒÂ©e"
                        : "Aucune entrÃƒÂ©e ne correspond aux critÃƒÂ¨res de filtrage"
                      }
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </main>
  );
};

export default UserHistory;
