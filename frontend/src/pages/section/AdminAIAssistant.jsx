import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Power } from "lucide-react";

const STORAGE_KEY = "adminAiAssistantState";

const DEFAULT_STATE = {
  enabled: false,
  mode: "supervision",
  autoAssignRdv: true,
  autoNotify: true,
  lastActivation: null,
};

const AdminAIAssistant = ({ addToHistory, currentUser }) => {
  const [state, setState] = useState(DEFAULT_STATE);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved && typeof saved === "object") {
        setState({ ...DEFAULT_STATE, ...saved });
      }
    } catch {
      setState(DEFAULT_STATE);
    }
  }, []);

  const persist = (next) => {
    setState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const toggleEnabled = () => {
    const next = {
      ...state,
      enabled: !state.enabled,
      lastActivation: !state.enabled ? new Date().toISOString() : state.lastActivation,
    };
    persist(next);
    addToHistory?.(
      "Assistants IA",
      next.enabled ? "Activation assistants IA en absence admin" : "Desactivation assistants IA",
      currentUser
    );
  };

  const toggleOption = (key) => persist({ ...state, [key]: !state[key] });

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-xl sm:text-2xl font-semibold text-gray-700 flex items-center gap-2">
          <Bot className="w-5 h-5" /> Assistants IA
        </h3>
        <Badge className={state.enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}>
          {state.enabled ? "Actif" : "Inactif"}
        </Badge>
      </div>

      <p className="text-sm text-gray-600">
        Activez cette fonctionnalite quand l'administrateur doit laisser l'application. Les assistants IA prennent les actions de support selon la configuration.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/80 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Attribution automatique des rendez-vous</span>
          <Button variant={state.autoAssignRdv ? "default" : "outline"} onClick={() => toggleOption("autoAssignRdv")}>{state.autoAssignRdv ? "ON" : "OFF"}</Button>
        </div>
        <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/80 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Notifications automatiques</span>
          <Button variant={state.autoNotify ? "default" : "outline"} onClick={() => toggleOption("autoNotify")}>{state.autoNotify ? "ON" : "OFF"}</Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={toggleEnabled} className={state.enabled ? "bg-red-600 hover:bg-red-700 text-white" : "bg-cyan-600 hover:bg-cyan-700 text-white"}>
          <Power className="w-4 h-4 mr-2" />
          {state.enabled ? "Desactiver l'assistant IA" : "Activer l'assistant IA"}
        </Button>
        <p className="text-xs text-gray-500">
          Derniere activation: {state.lastActivation ? new Date(state.lastActivation).toLocaleString("fr-FR") : "jamais"}
        </p>
      </div>
    </div>
  );
};

export default AdminAIAssistant;
