import React, { useState, useEffect, useMemo } from "react";
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
import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  UserCheck,
  Calendar,
  Mail,
  Phone,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

const AdminApprovalPage = ({ addToHistory }) => {
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    patient: "",
    email: "",
    specialite: "",
    dateRange: "all",
  });
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState(""); // "approve" or "reject"
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // API base URL
  const _apiBaseRaw = import.meta.env.VITE_API_URL || "http://localhost:3000";
const _apiBase = _apiBaseRaw.replace(/\/+$/, "");
const API_BASE_URL = _apiBase.endsWith("/api") ? _apiBase : `${_apiBase}/api`;

  // Helper function to get JWT token from localStorage
  const getToken = () => localStorage.getItem("token");

  // Fetch pending appointments
  const fetchPendingAppointments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/appointments/pending`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          toast.error("Session expirÃ©e. Veuillez vous reconnecter.");
          return;
        }
        throw new Error("Failed to fetch pending appointments");
      }

      const appointments = await response.json();
      setPendingAppointments(appointments);
    } catch (error) {
      console.error("Error fetching pending appointments:", error);
      toast.error("Erreur lors de la rÃ©cupÃ©ration des rendez-vous en attente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingAppointments();
  }, []);

  // Filter appointments based on search criteria
  const filteredAppointments = useMemo(() => {
    return pendingAppointments.filter((appointment) => {
      if (filters.patient && filters.patient.trim()) {
        const searchTerm = filters.patient.toLowerCase().trim();
        const fullName = `${appointment.nom || ""} ${appointment.prenom || ""}`.toLowerCase();
        const nomMatch = (appointment.nom || "").toLowerCase().includes(searchTerm);
        const prenomMatch = (appointment.prenom || "").toLowerCase().includes(searchTerm);
        const fullNameMatch = fullName.includes(searchTerm);

        if (!nomMatch && !prenomMatch && !fullNameMatch) {
          return false;
        }
      }

      if (filters.email && filters.email.trim()) {
        const emailTerm = filters.email.toLowerCase().trim();
        const appointmentEmail = (appointment.email || "").toLowerCase();
        if (!appointmentEmail.includes(emailTerm)) {
          return false;
        }
      }

      if (filters.specialite && filters.specialite.trim()) {
        const specialiteTerm = filters.specialite.toLowerCase().trim();
        const appointmentSpecialite = (appointment.specialite || "").toLowerCase();
        if (!appointmentSpecialite.includes(specialiteTerm)) {
          return false;
        }
      }

      if (filters.dateRange && filters.dateRange !== "all") {
        const today = new Date();
        const appointmentDate = new Date(appointment.date);

        switch (filters.dateRange) {
          case "today":
            return appointmentDate.toDateString() === today.toDateString();
          case "week": {
            const weekAgo = new Date(today);
            weekAgo.setDate(today.getDate() - 7);
            return appointmentDate >= weekAgo;
          }
          case "month": {
            const monthAgo = new Date(today);
            monthAgo.setMonth(today.getMonth() - 1);
            return appointmentDate >= monthAgo;
          }
          default:
            return true;
        }
      }

      return true;
    });
  }, [pendingAppointments, filters]);

  // Handle approval/rejection
  const handleApprovalAction = async () => {
    if (!selectedAppointment || !approvalAction) return;

    setIsProcessing(true);
    try {
      const endpoint = approvalAction === "approve"
        ? `${API_BASE_URL}/appointments/${selectedAppointment.id}/approve`
        : `${API_BASE_URL}/appointments/${selectedAppointment.id}/reject`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          reason: approvalAction === "reject" ? rejectionReason : undefined,
        }),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          toast.error("Session expirÃ©e. Veuillez vous reconnecter.");
          return;
        }
        throw new Error(`Failed to ${approvalAction} appointment`);
      }

      await response.json();

      // Update local state
      setPendingAppointments(prev =>
        prev.filter(apt => apt.id !== selectedAppointment.id)
      );

      // Add to history
      await addToHistory(
        `Rendez-vous ${approvalAction === "approve" ? "approuvÃ©" : "rejetÃ©"}`,
        `${approvalAction === "approve" ? "Approbation" : "Rejet"} du rendez-vous de ${selectedAppointment.nom} ${selectedAppointment.prenom} pour le ${selectedAppointment.date} Ã  ${selectedAppointment.time}`
      );

      toast.success(
        `Rendez-vous ${approvalAction === "approve" ? "approuvÃ©" : "rejetÃ©"} avec succÃ¨s`,
        {
          description: `${selectedAppointment.nom} ${selectedAppointment.prenom} - ${selectedAppointment.specialite}`,
        }
      );

      // Reset modal state
      setShowApprovalModal(false);
      setSelectedAppointment(null);
      setApprovalAction("");
      setRejectionReason("");

    } catch (error) {
      console.error(`Error ${approvalAction === "approve" ? "approving" : "rejecting"} appointment:`, error);
      toast.error(`Erreur lors de ${approvalAction === "approve" ? "l'approbation" : "le rejet"} du rendez-vous.`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Open approval modal
  const openApprovalModal = (appointment, action) => {
    setSelectedAppointment(appointment);
    setApprovalAction(action);
    setShowApprovalModal(true);
  };

  const resetFilters = () => {
    setFilters({
      patient: "",
      email: "",
      specialite: "",
      dateRange: "all",
    });
  };

  return (
    <main className="min-h-screen container mx-auto px-6 py-10 space-y-10 bg-background text-foreground">
      {/* Header */}
      <section className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-3">
          <UserCheck className="w-8 h-8 text-blue-600" />
          Approbation des rendez-vous
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          GÃ©rez les demandes de rendez-vous en attente d'approbation. Approuvez ou rejetez les demandes selon les disponibilitÃ©s et les critÃ¨res mÃ©dicaux.
        </p>
      </section>

      {/* Stats Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6 text-center">
            <Clock className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-blue-800">{pendingAppointments.length}</h3>
            <p className="text-blue-600">En attente</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-green-800">
              {pendingAppointments.filter(apt => apt.status === "approved").length}
            </h3>
            <p className="text-green-600">ApprouvÃ©s aujourd'hui</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
          <CardContent className="p-6 text-center">
            <XCircle className="w-8 h-8 text-red-600 mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-red-800">
              {pendingAppointments.filter(apt => apt.status === "rejected").length}
            </h3>
            <p className="text-red-600">RejetÃ©s aujourd'hui</p>
          </CardContent>
        </Card>
      </section>

      {/* Filters */}
      <section>
        <Card className="bg-card border border-border shadow-md rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Filtres</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Recherche par patient
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nom du patient..."
                    value={filters.patient}
                    onChange={(e) => setFilters(prev => ({ ...prev, patient: e.target.value }))}
                    className="pl-10 border-border focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Email
                </label>
                <Input
                  placeholder="ex: patient@mail.com"
                  value={filters.email}
                  onChange={(e) => setFilters(prev => ({ ...prev, email: e.target.value }))}
                  className="border-border focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  SpÃ©cialitÃ©
                </label>
                <Input
                  placeholder="SpÃ©cialitÃ© mÃ©dicale..."
                  value={filters.specialite}
                  onChange={(e) => setFilters(prev => ({ ...prev, specialite: e.target.value }))}
                  className="border-border focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  PÃ©riode
                </label>
                <Select
                  value={filters.dateRange}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
                >
                  <SelectTrigger className="border-border focus:ring-2 focus:ring-primary/20">
                    <SelectValue placeholder="Toutes les dates" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les rendez-vous</SelectItem>
                    <SelectItem value="today">Aujourd'hui</SelectItem>
                    <SelectItem value="week">Cette semaine</SelectItem>
                    <SelectItem value="month">Ce mois</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                onClick={resetFilters}
                className="border-border hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                RÃ©initialiser
              </Button>
              <Button
                onClick={fetchPendingAppointments}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Appointments Table */}
      <section>
        <Card className="bg-card border border-border shadow-md rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Rendez-vous en attente ({filteredAppointments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-3" />
                <span>Chargement des rendez-vous...</span>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h4 className="text-lg font-medium mb-2">Aucun rendez-vous en attente</h4>
                <p>Tous les rendez-vous ont Ã©tÃ© traitÃ©s ou aucun ne correspond aux critÃ¨res de filtrage.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-4 text-left font-semibold border-b">Patient</th>
                      <th className="p-4 text-left font-semibold border-b">Contact</th>
                      <th className="p-4 text-left font-semibold border-b">SpÃ©cialitÃ©</th>
                      <th className="p-4 text-left font-semibold border-b">Date & Heure</th>
                      <th className="p-4 text-left font-semibold border-b">Motif</th>
                      <th className="p-4 text-left font-semibold border-b">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.map((appointment, index) => (
                      <tr
                        key={appointment.id}
                        className={`hover:bg-muted/50 transition-colors border-b ${
                          index % 2 === 0 ? "bg-background" : "bg-muted/20"
                        }`}
                      >
                        <td className="p-4">
                          <div>
                            <p className="font-medium">
                              {appointment.nom} {appointment.prenom}
                            </p>
                            <p className="text-sm text-muted-foreground">ID: {appointment.id}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-4 h-4 text-gray-500" />
                              <span>{appointment.email}</span>
                            </div>
                            {appointment.telephone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="w-4 h-4 text-gray-500" />
                                <span>{appointment.telephone}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            {appointment.specialite}
                          </span>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-medium">
                              {new Date(appointment.date).toLocaleDateString("fr-FR", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                            <p className="text-sm text-muted-foreground">{appointment.time}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="text-sm text-gray-600 max-w-xs truncate">
                            {appointment.demande || "Aucun motif spÃ©cifiÃ©"}
                          </p>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => openApprovalModal(appointment, "approve")}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approuver
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openApprovalModal(appointment, "reject")}
                              className="border-red-300 text-red-700 hover:bg-red-50"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Rejeter
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Approval/Rejection Modal */}
      <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {approvalAction === "approve" ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              {approvalAction === "approve" ? "Approuver le rendez-vous" : "Rejeter le rendez-vous"}
            </DialogTitle>
            <DialogDescription>
              {selectedAppointment && (
                <>
                  {approvalAction === "approve" ? "Confirmer l'approbation" : "Confirmer le rejet"} du rendez-vous de{" "}
                  <strong>
                    {selectedAppointment.nom} {selectedAppointment.prenom}
                  </strong>{" "}
                  pour le{" "}
                  <strong>
                    {new Date(selectedAppointment.date).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </strong>{" "}
                  Ã  <strong>{selectedAppointment.time}</strong>
                  {selectedAppointment.specialite && (
                    <> pour <strong>{selectedAppointment.specialite}</strong></>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {approvalAction === "reject" && (
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Raison du rejet <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Expliquez la raison du rejet (ex: crÃ©neau indisponible, spÃ©cialitÃ© non disponible...)"
                  className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  rows={4}
                  required
                />
                {rejectionReason.trim().length === 0 && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    La raison du rejet est obligatoire
                  </p>
                )}
              </div>
            )}

            {approvalAction === "approve" && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  <strong>Action :</strong> Le rendez-vous sera confirmÃ© et le patient sera notifiÃ© par email.
                </p>
              </div>
            )}

            {approvalAction === "reject" && (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-800">
                  <strong>Action :</strong> Le rendez-vous sera annulÃ© et le patient sera notifiÃ© par email avec la raison du rejet.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowApprovalModal(false)}
              disabled={isProcessing}
            >
              Annuler
            </Button>
            <Button
              onClick={handleApprovalAction}
              disabled={
                isProcessing ||
                (approvalAction === "reject" && rejectionReason.trim().length === 0)
              }
              className={
                approvalAction === "approve"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {approvalAction === "approve" ? "Approbation..." : "Rejet..."}
                </>
              ) : (
                <>
                  {approvalAction === "approve" ? (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  {approvalAction === "approve" ? "Approuver" : "Rejeter"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default AdminApprovalPage;
