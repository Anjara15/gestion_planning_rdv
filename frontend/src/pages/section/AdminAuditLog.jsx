import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Activity, RefreshCw } from "lucide-react";

const AdminAuditLog = ({ api }) => {
  const [entries, setEntries] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const response = await api.get("/history", { params: { limit: 200, offset: 0 } });
      setEntries(response.data?.history || []);
    } catch (error) {
      console.error("Erreur journal audit:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return entries;
    return entries.filter((entry) => {
      const bag = [entry.action, entry.description, entry.user?.username, entry.user?.email, entry.user?.role]
        .join(" ")
        .toLowerCase();
      return bag.includes(q);
    });
  }, [entries, search]);

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-4">
        <h3 className="text-xl sm:text-2xl font-semibold text-gray-700">Journal d'audit</h3>
        <Button variant="outline" onClick={loadEntries} disabled={loading}>
          <RefreshCw className="w-4 h-4 mr-2" /> Actualiser
        </Button>
      </div>

      <Input
        placeholder="Rechercher une action"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4"
      />

      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
        {filtered.map((entry) => (
          <div key={entry.id} className="p-3 rounded-xl border border-gray-200 bg-gray-50/80">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-gray-700 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-600" /> {entry.action}
                </p>
                <p className="text-sm text-gray-600">{entry.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {entry.user?.username || "Systeme"} ({entry.user?.role || "-"})
                </p>
              </div>
              <p className="text-xs text-gray-500 whitespace-nowrap">
                {entry.createdAt ? new Date(entry.createdAt).toLocaleString("fr-FR") : "-"}
              </p>
            </div>
          </div>
        ))}
        {filtered.length === 0 && !loading && <p className="text-sm text-gray-500 text-center py-8">Aucune entree.</p>}
      </div>
    </div>
  );
};

export default AdminAuditLog;
