import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { MessageSquare, Send, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const _apiBaseRaw = import.meta.env.VITE_API_URL || "http://localhost:3000";
const _apiBase = String(_apiBaseRaw).replace(/\/+$/, "");
const API_BASE_URL = _apiBase.endsWith("/api") ? _apiBase : `${_apiBase}/api`;

const fetchThread = async (fromRole, toRole) => {
  const token = localStorage.getItem("token");
  const resp = await axios.get(`${API_BASE_URL}/messages`, {
    params: { fromRole, toRole },
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return Array.isArray(resp.data) ? resp.data : [];
};

const postMessage = async (message) => {
  const token = localStorage.getItem("token");
  const resp = await axios.post(`${API_BASE_URL}/messages`, message, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return resp.data;
};

const resolveCurrentUser = (currentUser, userRole) => {
  let storedUser = {};
  try {
    storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  } catch (error) {
    console.error("Erreur lecture user localStorage:", error);
  }

  const role =
    currentUser?.role ||
    userRole ||
    localStorage.getItem("role") ||
    storedUser.role ||
    "patient";

  return {
    id: currentUser?.id || storedUser.id || `${role}-local`,
    username:
      currentUser?.username ||
      storedUser.username ||
      (role === "medecin" ? "Médecin" : "Patient"),
    role,
  };
};

const MessagingPanel = ({ currentUser, userRole, addToHistory }) => {
  const me = resolveCurrentUser(currentUser, userRole);
  const peerRole = me.role === "medecin" ? "patient" : "medecin";
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState([]);

  const thread = useMemo(
    () => [...messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [messages]
  );

  const sendMessage = async () => {
    const content = draft.trim();
    if (!content) return;

    try {
      const saved = await postMessage({
        toRole: peerRole,
        content,
      });
      setMessages((prev) => [...prev, saved]);
      setDraft("");
      await addToHistory?.("Message envoyé", `Message envoyé vers ${peerRole}: ${content.slice(0, 80)}`);
    } catch (err) {
      console.error("Erreur envoi message:", err);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const msgs = await fetchThread(me.role, peerRole);
        if (!cancelled) {
          setMessages(msgs);
        }
      } catch (err) {
        console.error("Erreur chargement messagerie:", err);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [me.role, peerRole]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
        Canal actif: <strong>{me.role}</strong> ↔ <strong>{peerRole}</strong>
      </div>

      <div className="h-[360px] overflow-y-auto rounded-xl border border-white/30 bg-white/70 p-4">
        {thread.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-gray-500">
            <MessageSquare className="mb-2 h-10 w-10" />
            <p>Aucun message pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {thread.map((message) => {
              const isMine = message.fromRole === me.role;
              return (
                <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 shadow-sm ${
                      isMine
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-1 text-xs opacity-80">
                      <UserRound className="h-3 w-3" />
                      {message.fromName}
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                    <p className="mt-1 text-[10px] opacity-70">
                      {new Date(message.createdAt).toLocaleString("fr-FR")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
          placeholder={`Écrire un message pour ${peerRole}...`}
          className="rounded-xl"
        />
        <Button
          onClick={sendMessage}
          className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700"
        >
          <Send className="mr-1 h-4 w-4" />
          Envoyer
        </Button>
      </div>
    </div>
  );
};

export default MessagingPanel;
