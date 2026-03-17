import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";

const STORAGE_KEY = "adminAppConfig";

const DEFAULT_CONFIG = {
  maintenanceMode: false,
  autoBackup: true,
  emailNotifications: true,
  aiAutoAssist: false,
};

const AdminConfiguration = ({ addToHistory, currentUser }) => {
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved && typeof saved === "object") {
        setConfig({ ...DEFAULT_CONFIG, ...saved });
      }
    } catch {
      setConfig(DEFAULT_CONFIG);
    }
  }, []);

  const saveConfig = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    addToHistory?.("Configuration", "Mise a jour de la configuration applicative", currentUser);
  };

  const toggle = (key) => {
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const options = [
    { key: "maintenanceMode", label: "Mode maintenance" },
    { key: "autoBackup", label: "Sauvegarde automatique" },
    { key: "emailNotifications", label: "Notifications email" },
    { key: "aiAutoAssist", label: "Autoriser IA en absence admin" },
  ];

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 p-4 sm:p-6">
      <h3 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-6 flex items-center gap-2">
        <Settings2 className="w-5 h-5" /> Configuration
      </h3>

      <div className="space-y-3">
        {options.map((opt) => (
          <div key={opt.key} className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gray-50/80">
            <span className="text-sm font-medium text-gray-700">{opt.label}</span>
            <Button variant={config[opt.key] ? "default" : "outline"} onClick={() => toggle(opt.key)}>
              {config[opt.key] ? "Active" : "Inactive"}
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={saveConfig} className="bg-cyan-600 hover:bg-cyan-700 text-white">Enregistrer</Button>
      </div>
    </div>
  );
};

export default AdminConfiguration;
