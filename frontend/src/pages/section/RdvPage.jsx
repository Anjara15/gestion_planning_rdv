import React, { useState, useMemo } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, CalendarCheck, Search, Filter, RefreshCw, UserCheck, Users } from "lucide-react";

const FiltresRdv = ({ filters, onFiltersChange, resultsCount, activeFilterCount }) => {
  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const resetFilters = () => {
    onFiltersChange({
      patient: "",
      email: "",
      medecin: "",
      specialite: "",
      dateRange: "all",
    });
  };

  return (
    <Card className="bg-card border border-border shadow-md rounded-2xl">
      {/* <CardContent className="p-6">
        <div className="flex flex-col gap-2 mb-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Filtres rendez-vous</h3>
          </div>
          <p className="text-sm text-muted-foreground">Recherche rapide par patient, médecin, spécialité ou période.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
          <div className="xl:col-span-2">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Recherche par nom
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nom du patient..."
                value={filters.patient}
                onChange={(e) => handleFilterChange("patient", e.target.value)}
                className="pl-10 border-border focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

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

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Médecin
            </label>
            <Input
              placeholder="Nom du médecin..."
              value={filters.medecin || ""}
              onChange={(e) => handleFilterChange("medecin", e.target.value)}
              className="border-border focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Spécialité
            </label>
            <Input
              placeholder="Spécialité médicale..."
              value={filters.specialite || ""}
              onChange={(e) => handleFilterChange("specialite", e.target.value)}
              className="border-border focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Période
            </label>
            <Select
              value={filters.dateRange}
              onValueChange={(value) => handleFilterChange("dateRange", value)}
            >
              <SelectTrigger className="border-border focus:ring-2 focus:ring-primary/20">
                <SelectValue placeholder="Toutes les dates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rendez-vous</SelectItem>
                <SelectItem value="upcoming">À venir</SelectItem>
                <SelectItem value="past">Passés</SelectItem>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
            {resultsCount} rendez-vous affiché{resultsCount > 1 ? "s" : ""} {activeFilterCount > 0 ? `• ${activeFilterCount} filtre${activeFilterCount > 1 ? "s" : ""} actif${activeFilterCount > 1 ? "s" : ""}` : "• aucun filtre actif"}
          </div>
          <Button
            variant="outline"
            onClick={resetFilters}
            className="w-full md:w-auto border-border hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
        </div>
      </CardContent> */}
    </Card>
  );
};

const RdvPage = ({ rendezVous = [], setRendezVous, addToHistory }) => {
  const _apiBaseRaw = import.meta.env.VITE_API_URL || "http://localhost:3000";
const _apiBase = _apiBaseRaw.replace(/\/+$/, "");
const API_BASE_URL = _apiBase.endsWith("/api") ? _apiBase : `${_apiBase}/api`;
  const getToken = () => localStorage.getItem("token");
  const [filters, setFilters] = useState({
    patient: "",
    email: "",
    medecin: "",
    specialite: "",
    dateRange: "all",
  });

  // États pour la gestion de l'assignation
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRdv, setSelectedRdv] = useState(null);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const isDateInRange = (dateStr, range) => {
    if (!dateStr || !range || range === "all") return true;

    try {
      const rdvDate = new Date(dateStr);
      const today = new Date();

      const normalizeDate = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
      };

      const normalizedRdvDate = normalizeDate(rdvDate);
      const normalizedToday = normalizeDate(today);

      let startOfWeek, dayOfWeek, normalizedStartOfWeek, endOfWeek;
      let startOfMonth, endOfMonth, normalizedStartOfMonth, normalizedEndOfMonth;

      switch (range) {
        case "today":
          return normalizedRdvDate.getTime() === normalizedToday.getTime();
        case "upcoming":
          return normalizedRdvDate >= normalizedToday;
        case "past":
          return normalizedRdvDate < normalizedToday;
        case "week":
          startOfWeek = new Date(today);
          dayOfWeek = today.getDay();
          startOfWeek.setDate(today.getDate() - dayOfWeek);
          normalizedStartOfWeek = normalizeDate(startOfWeek);

          endOfWeek = new Date(normalizedStartOfWeek);
          endOfWeek.setDate(normalizedStartOfWeek.getDate() + 6);

          return normalizedRdvDate >= normalizedStartOfWeek && normalizedRdvDate <= endOfWeek;
        case "month":
          startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          normalizedStartOfMonth = normalizeDate(startOfMonth);
          normalizedEndOfMonth = normalizeDate(endOfMonth);

          return normalizedRdvDate >= normalizedStartOfMonth && normalizedRdvDate <= normalizedEndOfMonth;
        default:
          return true;
      }
    } catch (error) {
      console.error("Erreur lors de l'analyse de la date:", dateStr, error);
      return false;
    }
  };

  const filteredRdv = useMemo(() => {
    return rendezVous.filter((rdv) => {
      if (filters.patient && filters.patient.trim()) {
        const searchTerm = filters.patient.toLowerCase().trim();
        const fullName = `${rdv.nom || ""} ${rdv.prenom || ""}`.toLowerCase();
        const nomMatch = (rdv.nom || "").toLowerCase().includes(searchTerm);
        const prenomMatch = (rdv.prenom || "").toLowerCase().includes(searchTerm);
        const fullNameMatch = fullName.includes(searchTerm);

        if (!nomMatch && !prenomMatch && !fullNameMatch) {
          return false;
        }
      }

      if (filters.email && filters.email.trim()) {
        const emailTerm = filters.email.toLowerCase().trim();
        const rdvEmail = (rdv.email || "").toLowerCase();
        if (!rdvEmail.includes(emailTerm)) {
          return false;
        }
      }

      if (filters.medecin && filters.medecin.trim()) {
        const medecinTerm = filters.medecin.toLowerCase().trim();
        const rdvMedecin = typeof rdv.medecin === 'string'
          ? rdv.medecin.toLowerCase()
          : (rdv.medecin?.username || "").toLowerCase();
        if (!rdvMedecin.includes(medecinTerm)) {
          return false;
        }
      }

      if (filters.specialite && filters.specialite.trim()) {
        const specialiteTerm = filters.specialite.toLowerCase().trim();
        const rdvSpecialite = (rdv.specialite || "").toLowerCase();
        if (!rdvSpecialite.includes(specialiteTerm)) {
          return false;
        }
      }

      if (filters.dateRange && filters.dateRange !== "all") {
        if (!isDateInRange(rdv.date, filters.dateRange)) {
          return false;
        }
      }

      return true;
    });
  }, [rendezVous, filters]);

  const appointmentStats = useMemo(() => {
    const today = new Date().toLocaleDateString("en-CA");

    return {
      total: filteredRdv.length,
      assigned: filteredRdv.filter((rdv) => Boolean(rdv.medecin)).length,
      unassigned: filteredRdv.filter((rdv) => !rdv.medecin).length,
      today: filteredRdv.filter((rdv) => String(rdv.date || "").slice(0, 10) === today).length,
    };
  }, [filteredRdv]);

  const activeFilterCount = useMemo(
    () =>
      [filters.patient, filters.email, filters.medecin, filters.specialite].filter((value) => String(value || "").trim() !== "").length +
      (filters.dateRange && filters.dateRange !== "all" ? 1 : 0),
    [filters]
  );

  // Fonction pour ouvrir le modal d'assignation
  const handleAssignDoctor = (rdv) => {
    setSelectedRdv(rdv);
    setSelectedDoctor("");
    setShowAssignModal(true);
    loadAvailableDoctors(rdv.specialite, rdv.date);
  };

  // Fonction pour charger les médecins disponibles selon la spécialité
  const loadAvailableDoctors = async (specialite, date) => {
    try {
      const params = new URLSearchParams();
      if (date) params.append('date', String(date).slice(0, 10));
      if (specialite) params.append('specialite', specialite);
      const response = await fetch(`${API_BASE_URL}/appointments/available-doctors?${params.toString()}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Erreur lors du chargement des médecins');
      }
      const doctors = await response.json();
      setAvailableDoctors(doctors);
    } catch (error) {
      console.error("Erreur lors du chargement des médecins:", error);
    }
  };

  // Fonction pour assigner un médecin à un rendez-vous
  const handleAssignAppointment = async () => {
    if (!selectedRdv || !selectedDoctor) return;

    setIsAssigning(true);
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/${selectedRdv.id}/assign-doctor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ medecin_id: parseInt(selectedDoctor, 10) }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Échec de l'assignation");
      }
      const { appointment } = await response.json();

      const doctor = availableDoctors.find(doc => doc.id === parseInt(selectedDoctor));
      const updatedRdv = {
        ...selectedRdv,
        medecin: doctor?.username || appointment?.medecin?.username || 'Médecin',
        medecinId: doctor?.id || appointment?.medecin_id,
      };
      if (setRendezVous) {
        setRendezVous(prevRdv => prevRdv.map(rdv => (rdv.id === selectedRdv.id ? updatedRdv : rdv)));
      }

      if (addToHistory) {
        await addToHistory(
          'Assignation médecin',
          `Assignation du Dr. ${doctor?.username || ''} au rendez-vous du ${String(selectedRdv.date).slice(0,10)} à ${selectedRdv.heure || selectedRdv.time}`
        );
      }

      setShowAssignModal(false);
      setSelectedRdv(null);
      setSelectedDoctor('');
    } catch (error) {
      console.error("Erreur lors de l'assignation:", error);
      alert(error.message || "Erreur lors de l'assignation du médecin. Veuillez réessayer.");
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <main className="min-h-screen container mx-auto px-6 py-10 space-y-10 bg-background text-foreground">
      {/* Filtres */}
      <section>
        <FiltresRdv
          filters={filters}
          onFiltersChange={setFilters}
          resultsCount={filteredRdv.length}
          activeFilterCount={activeFilterCount}
        />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Total affiché", value: appointmentStats.total, tone: "text-slate-700 bg-slate-100" },
          { label: "Assignés", value: appointmentStats.assigned, tone: "text-emerald-700 bg-emerald-100" },
          { label: "Non assignés", value: appointmentStats.unassigned, tone: "text-amber-700 bg-amber-100" },
          { label: "Aujourd'hui", value: appointmentStats.today, tone: "text-cyan-700 bg-cyan-100" },
        ].map((item) => (
          <Card key={item.label} className="border border-border shadow-sm rounded-2xl">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className={`mt-3 inline-flex rounded-full px-3 py-1 text-2xl font-bold ${item.tone}`}>{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Tableau des rendez-vous */}
      <section>
        <div className="bg-card rounded-2xl shadow-md border border-border p-6 overflow-auto max-h-[70vh]">
          <table className="w-full border-collapse min-w-[1000px]">
            <thead className="sticky top-0 bg-muted">
              <tr>
                <th className="p-3 text-left font-semibold border-b">ID</th>
                <th className="p-3 text-left font-semibold border-b">Nom</th>
                <th className="p-3 text-left font-semibold border-b">Prénom</th>
                <th className="p-3 text-left font-semibold border-b">Email</th>
                <th className="p-3 text-left font-semibold border-b">Téléphone</th>
                <th className="p-3 text-left font-semibold border-b">Spécialité</th>
                <th className="p-3 text-left font-semibold border-b">Médecin</th>
                <th className="p-3 text-left font-semibold border-b">Date</th>
                <th className="p-3 text-left font-semibold border-b">Heure</th>
                <th className="p-3 text-left font-semibold border-b">Statut</th>
                <th className="p-3 text-left font-semibold border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRdv.length > 0 ? (
                filteredRdv.map((rdv, index) => (
                  <tr
                    key={rdv.id ? `rdv-${rdv.id}` : `rdv-index-${index}`}
                    className={`hover:bg-muted/50 transition-colors border-b ${
                      index % 2 === 0 ? "bg-background" : "bg-muted/20"
                    }`}
                  >
                    <td className="p-3">{index + 1}</td>
                    <td className="p-3 font-medium">
                      {rdv.nom || (rdv.username ? rdv.username.split(' ')[0] : "-")}
                    </td>
                    <td className="p-3 font-medium">
                      {rdv.prenom || (rdv.username ? rdv.username.split(' ')[1] || "" : "-")}
                    </td>
                    <td className="p-3 text-blue-600">{rdv.email || "-"}</td>
                    <td className="p-3">{rdv.telephone || "-"}</td>
                    <td className="p-3">{rdv.specialite || "-"}</td>
                    <td className="p-3">
                      <span className={rdv.medecin ? "text-green-600 font-medium" : "text-gray-500"}>
                        {rdv.medecin
                          ? (typeof rdv.medecin === 'object' && rdv.medecin !== null
                            ? rdv.medecin.username || `${rdv.medecin.prenom || ''} ${rdv.medecin.nom || ''}`.trim() || "Médecin inconnu"
                            : rdv.medecin)
                          : "Non assigné"}
                      </span>
                    </td>
                    <td className="p-3">
                      {rdv.date
                        ? (() => {
                            try {
                              const date = new Date(rdv.date);
                              return date.toLocaleDateString("fr-FR");
                            } catch {
                              return rdv.date;
                            }
                          })()
                        : "-"}
                    </td>
                    <td className="p-3">{rdv.time || rdv.heure || "-"}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isDateInRange(rdv.date, "month")
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {isDateInRange(rdv.date, "month") ? "Nouveau" : "Existant"}
                      </span>
                    </td>
                    <td className="p-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAssignDoctor(rdv)}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-none"
                        disabled={!!rdv.medecin}
                      >
                        <UserCheck className="w-4 h-4 mr-1" />
                        {rdv.medecin ? "Assigné" : "Assigner"}
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr key="no-rdv-found">
                  <td colSpan={11} className="text-center py-8 text-muted-foreground">
                    {rendezVous.length === 0
                      ? "Aucun rendez-vous enregistré"
                      : "Aucun rendez-vous ne correspond aux critères de filtrage"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal d'assignation de médecin */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              Assigner un médecin
            </DialogTitle>
            <DialogDescription>
              {selectedRdv && (
                <>
                  Assigner un médecin au rendez-vous de{" "}
                  <strong>
                    {selectedRdv.username
                      ? String(selectedRdv.username)
                      : `${String(selectedRdv.nom || "")} ${String(selectedRdv.prenom || "")}`.trim() ||
                        "Patient inconnu"}
                  </strong>
                  pour le{" "}
                  <strong>
                    {selectedRdv.date
                      ? new Date(String(selectedRdv.date)).toLocaleDateString("fr-FR")
                      : "Date inconnue"
                    }
                  </strong>{" "}
                  à <strong>{String(selectedRdv.heure || selectedRdv.time || "Heure inconnue")}</strong>
                  {selectedRdv.specialite && (
                    <> pour la spécialité <strong>{String(selectedRdv.specialite)}</strong></>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Sélectionner un médecin
              </label>
              <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                <SelectTrigger className="border-border focus:ring-2 focus:ring-primary/20">
                  <SelectValue placeholder="Choisir un médecin..." />
                </SelectTrigger>
                <SelectContent>
                  {availableDoctors.length > 0 ? (
                    availableDoctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id.toString()}>
                        Dr. {doctor.username} - {doctor.specialite}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      Aucun médecin disponible pour cette spécialité
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {availableDoctors.length > 0 && selectedDoctor && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Médecin sélectionné :</strong>{" "}
                  Dr. {availableDoctors.find(doc => doc.id === parseInt(selectedDoctor))?.username}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAssignModal(false)}
              disabled={isAssigning}
            >
              Annuler
            </Button>
            <Button
              onClick={handleAssignAppointment}
              disabled={!selectedDoctor || isAssigning}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
            >
              {isAssigning ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Assignation...
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4 mr-2" />
                  Confirmer l'assignation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default RdvPage;
