import { useState, useMemo } from "react";
import { CalendarCheck, ArrowLeft, Filter, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const HistoryFilters = ({ filters, onFiltersChange, appointments = [] }) => {
  const handleFilterChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      dateRange: "",
      patient: "",
      doctor: "",
      status: "",
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== "");

  const uniqueSpecialties = [...new Set(appointments.map(apt => 
    apt.specialty || 'Généraliste'
  ).filter(Boolean))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Filtres de recherche</h3>
        </div>
        {hasActiveFilters && (
          <Button
            onClick={clearFilters}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Tout effacer
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Filtre par période */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Période
          </label>
          <select
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          >
            <option value="">Toute période</option>
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="quarter">Ce trimestre</option>
            <option value="year">Cette année</option>
          </select>
        </div>

        {/* Filtre par patient */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Patient
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={filters.patient}
              onChange={(e) => handleFilterChange('patient', e.target.value)}
              placeholder="Rechercher un patient..."
              className="w-full pl-9 pr-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
        </div>

        {/* Filtre par spécialité */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Spécialité
          </label>
          <select
            value={filters.doctor}
            onChange={(e) => handleFilterChange('doctor', e.target.value)}
            className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          >
            <option value="">Toutes les spécialités</option>
            {uniqueSpecialties.map(specialty => (
              <option key={specialty} value={specialty}>{specialty}</option>
            ))}
          </select>
        </div>

        {/* Filtre par statut */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Statut
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          >
            <option value="">Tous les statuts</option>
            <option value="scheduled">Programmé</option>
            <option value="completed">Terminé</option>
            <option value="cancelled">Annulé</option>
            <option value="no-show">Absent</option>
          </select>
        </div>
      </div>
    </div>
  );
};

const StatsCards = ({ appointments = [] }) => {
  const stats = useMemo(() => {
    const total = appointments.length;
    const completed = appointments.filter(apt => apt.status === 'completed').length;
    const cancelled = appointments.filter(apt => apt.status === 'cancelled').length;
    const upcoming = appointments.filter(apt => apt.status === 'scheduled').length;
    const noShow = appointments.filter(apt => apt.status === 'no-show').length;

    return { total, completed, cancelled, upcoming, noShow };
  }, [appointments]);

  const cards = [
    {
      title: "Total",
      value: stats.total,
      icon: CalendarCheck,
      bgColor: "bg-blue-500",
      textColor: "text-blue-600",
      bgLight: "bg-blue-50",
    },
    {
      title: "Terminés",
      value: stats.completed,
      icon: CalendarCheck,
      bgColor: "bg-green-500",
      textColor: "text-green-600",
      bgLight: "bg-green-50",
    },
    {
      title: "Programmés",
      value: stats.upcoming,
      icon: CalendarCheck,
      bgColor: "bg-orange-500",
      textColor: "text-orange-600",
      bgLight: "bg-orange-50",
    },
    {
      title: "Annulés",
      value: stats.cancelled + stats.noShow,
      icon: CalendarCheck,
      bgColor: "bg-red-500",
      textColor: "text-red-600",
      bgLight: "bg-red-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const IconComponent = card.icon;
        return (
          <div key={index} className="bg-card rounded-2xl shadow-md border border-border p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {card.value}
                </p>
              </div>
              <div className={`p-3 rounded-full ${card.bgColor}`}>
                <IconComponent className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const AppointmentHistory = ({ appointments = [] }) => {
  const getStatusBadge = (status) => {
    const statusConfig = {
      scheduled: { 
        color: "bg-blue-100 text-blue-800 border-blue-200", 
        label: "Programmé" 
      },
      completed: { 
        color: "bg-green-100 text-green-800 border-green-200", 
        label: "Terminé" 
      },
      cancelled: { 
        color: "bg-red-100 text-red-800 border-red-200", 
        label: "Annulé" 
      },
      "no-show": { 
        color: "bg-orange-100 text-orange-800 border-orange-200", 
        label: "Absent" 
      },
    };
    
    const config = statusConfig[status] || statusConfig.scheduled;
    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-full border ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (appointments.length === 0) {
    return (
      <div className="bg-card rounded-2xl shadow-md border border-border p-12 text-center">
        <CalendarCheck className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Aucun rendez-vous trouvé
        </h3>
        <p className="text-muted-foreground">
          Aucun rendez-vous ne correspond aux critères de recherche sélectionnés.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl shadow-md border border-border overflow-hidden">
      <div className="px-6 py-4 border-b border-border bg-muted/50">
        <h3 className="text-lg font-semibold text-foreground">
          Liste des rendez-vous ({appointments.length} résultat{appointments.length > 1 ? 's' : ''})
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <div className="max-h-[500px] overflow-y-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/30 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date & Heure
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Spécialité
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {appointments.map((appointment) => (
                <tr key={appointment.id || appointment.appointmentId} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">
                      {new Date(appointment.date).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {appointment.time}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">
                      {appointment.patientName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {appointment.patientEmail}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {appointment.patientPhone}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">
                      {appointment.specialty}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {appointment.doctorName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {appointment.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(appointment.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                      Voir détails
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const normalizeAppointments = (appointments) => {
  return appointments.map(appointment => {
    // Parser le username s'il est en JSON string ou objet
    let userInfo = {};
    if (typeof appointment.username === 'object' && appointment.username !== null) {
      userInfo = appointment.username;
    } else if (typeof appointment.username === 'string' && appointment.username.startsWith('{')) {
      try {
        userInfo = JSON.parse(appointment.username);
      } catch {
        userInfo = { username: appointment.username };
      }
    } else {
      userInfo = { username: appointment.username || 'N/A' };
    }

    // Déterminer le statut basé sur la date
    const appointmentDate = new Date(`${appointment.date}T${appointment.time || appointment.heure || '00:00'}`);
    const now = new Date();
    let status = 'scheduled';

    if (appointmentDate < now) {
      status = 'completed';
    }

    return {
      id: appointment.id,
      date: appointment.date,
      time: appointment.time || appointment.heure,
      patientName: appointment.nom && appointment.prenom && typeof appointment.prenom === 'string' && typeof appointment.nom === 'string'
        ? `${appointment.prenom} ${appointment.nom}`
        : (typeof userInfo.username === 'string' ? userInfo.username : 'N/A') || 'N/A',
      patientPhone: typeof appointment.telephone === 'string' ? appointment.telephone : 'N/A',
      patientEmail: typeof appointment.email === 'string' ? appointment.email : (userInfo.email || 'N/A'),
      doctorName: typeof appointment.medecin === 'string' ? appointment.medecin : 'Médecin généraliste',
      specialty: typeof appointment.specialite === 'string' ? appointment.specialite : (userInfo.specialite || 'Généraliste'),
      type: typeof appointment.demande === 'string' ? appointment.demande : 'Consultation',
      status: status,
      username: userInfo.username,
      isNew: appointment.isNew
    };
  });
};

const loadAppointmentsFromStorage = () => {
  try {
    const data = localStorage.getItem('rendezVous');
    if (!data) return [];

    const appointments = JSON.parse(data);
    return normalizeAppointments(appointments);
  } catch (error) {
    console.error('Erreur lors du chargement des rendez-vous:', error);
    return [];
  }
}

const RdvHistory = ({ rendezVous = [] }) => {
  const [filters, setFilters] = useState({
    dateRange: "",
    patient: "",
    doctor: "",
    status: "",
  });

  const appointmentsData = useMemo(() => {
    if (rendezVous.length > 0) {
      return normalizeAppointments(rendezVous);
    } else {
      return loadAppointmentsFromStorage();
    }
  }, [rendezVous]);

  const filteredAppointments = useMemo(() => {
    let filtered = [...appointmentsData];

    if (filters.dateRange) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(appointment => {
        const appointmentDate = new Date(appointment.date || appointment.dateTime);
        
        switch (filters.dateRange) {
          case 'today':
            return appointmentDate.toDateString() === today.toDateString();
          case 'week': {
            let weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            let weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            return appointmentDate >= weekStart && appointmentDate <= weekEnd;
          }
          case 'month':
            return appointmentDate.getMonth() === today.getMonth() && 
                   appointmentDate.getFullYear() === today.getFullYear();
          case 'quarter': {
            let quarter = Math.floor(today.getMonth() / 3);
            let appointmentQuarter = Math.floor(appointmentDate.getMonth() / 3);
            return appointmentQuarter === quarter &&
                   appointmentDate.getFullYear() === today.getFullYear();
          }
          case 'year':
            return appointmentDate.getFullYear() === today.getFullYear();
          default:
            return true;
        }
      });
    }

    // Filtre par patient
    if (filters.patient) {
      filtered = filtered.filter(appointment => {
        const patientName = appointment.patientName || appointment.patient?.name || appointment.patient || '';
        return patientName.toLowerCase().includes(filters.patient.toLowerCase());
      });
    }

    // Filtre par médecin/spécialité
    if (filters.doctor) {
      filtered = filtered.filter(appointment => {
        const specialty = appointment.specialty || '';
        return specialty === filters.doctor;
      });
    }

    if (filters.status) {
      filtered = filtered.filter(appointment => appointment.status === filters.status);
    }

    return filtered;
  }, [filters, appointmentsData]);

  return (
    <main className="min-h-screen container mx-auto px-6 py-10 space-y-10 bg-background text-foreground">
      {/* Contenu principal */}
      <section className="space-y-8">
        {/* Filtres */}
        <div className="bg-card rounded-2xl shadow-md border border-border p-6">
          <HistoryFilters 
            filters={filters} 
            onFiltersChange={setFilters}
            appointments={appointmentsData}
          />
        </div>

        {/* Liste des RDV */}
        <AppointmentHistory 
          appointments={filteredAppointments}
          filters={filters}
        />
      </section>
    </main>
  );
};

export default RdvHistory;
