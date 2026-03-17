import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Activity, RefreshCw, Search, CalendarClock } from "lucide-react";

const MedecinActivityHistory = ({ currentUser }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [range, setRange] = useState("all");
  const [refreshTick, setRefreshTick] = useState(0);

  const activities = useMemo(() => {
    refreshTick;
    try {
      const raw = localStorage.getItem("appHistory") || "[]";
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      const currentUsername = (currentUser?.username || "").toLowerCase().trim();

      return parsed
        .filter((entry) => {
          const entryUserRaw = typeof entry.user === "object" ? entry.user?.username : entry.user;
          const entryUser = String(entryUserRaw || "").toLowerCase();
          const entryRole = String(entry.role || entry.user?.role || "").toLowerCase();

          if (currentUsername) {
            return entryUser === currentUsername;
          }

          return entryRole === "medecin";
        })
        .sort((a, b) => {
          const aTime = new Date(a.timestamp || a.createdAt || 0).getTime();
          const bTime = new Date(b.timestamp || b.createdAt || 0).getTime();
          return bTime - aTime;
        });
    } catch (error) {
      console.error("Erreur lecture historique médecin:", error);
      return [];
    }
  }, [currentUser?.username, refreshTick]);

  const filteredActivities = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    const now = new Date();

    return activities.filter((entry) => {
      const bag = [entry.action, entry.details, entry.date, entry.time].join(" ").toLowerCase();
      if (query && !bag.includes(query)) {
        return false;
      }

      if (range === "all") {
        return true;
      }

      const entryDate = new Date(entry.timestamp || entry.createdAt || 0);
      if (Number.isNaN(entryDate.getTime())) {
        return false;
      }

      if (range === "today") {
        return entryDate.toDateString() === now.toDateString();
      }

      if (range === "week") {
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0, 0, 0, 0);
        return entryDate >= start;
      }

      if (range === "month") {
        return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
      }

      return true;
    });
  }, [activities, searchTerm, range]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">Historique d'activités</h2>
          <p className="text-muted-foreground">Actions récentes du médecin</p>
        </div>
        <Button
          variant="outline"
          className="rounded-xl"
          onClick={() => setRefreshTick((prev) => prev + 1)}
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Actualiser
        </Button>
      </div>

      <div className="bg-white border border-border rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher une action"
              className="pl-10 rounded-xl"
            />
          </div>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="rounded-xl border border-border px-3 py-2 text-sm"
          >
            <option value="all">Toutes les périodes</option>
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-border rounded-2xl p-6">
        {filteredActivities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Aucune activité trouvée.</p>
        ) : (
          <div className="space-y-3">
            {filteredActivities.map((entry, index) => {
              const displayDate = entry.timestamp || entry.createdAt;
              return (
                <div key={`${entry.id || entry.timestamp || index}-${index}`} className="border border-border rounded-xl p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <Activity className="w-4 h-4 text-cyan-700" />
                        {entry.action || "Action"}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">{entry.details || "-"}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="rounded-full">
                        <CalendarClock className="w-3 h-3 mr-1" />
                        {displayDate ? new Date(displayDate).toLocaleString("fr-FR") : `${entry.date || ""} ${entry.time || ""}`}
                      </Badge>
                      <Badge className="rounded-full bg-slate-100 text-slate-700">{entry.role || "medecin"}</Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MedecinActivityHistory;
