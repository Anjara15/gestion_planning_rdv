import { useMemo, useState } from "react";
import { MessageSquare, Send, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STORAGE_KEY = "cabinet_messages_v1";

const readStoredMessages = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Erreur lecture messagerie locale:", error);
    return [];
  }
};

const writeStoredMessages = (messages) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error("Erreur sauvegarde messagerie locale:", error);
  }
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
  const [messages, setMessages] = useState(() => readStoredMessages());

  const thread = useMemo(() => {
    return messages
      .filter(
        (m) =>
          (m.fromRole === me.role && m.toRole === peerRole) ||
          (m.fromRole === peerRole && m.toRole === me.role)
      )
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [messages, me.role, peerRole]);

  const sendMessage = async () => {
    const content = draft.trim();
    if (!content) return;

    const nextMessage = {
      id: `msg_${Date.now()}`,
      fromId: me.id,
      fromName: me.username,
      fromRole: me.role,
      toRole: peerRole,
      content,
      createdAt: new Date().toISOString(),
    };

    const next = [...messages, nextMessage];
    setMessages(next);
    writeStoredMessages(next);
    setDraft("");

    if (addToHistory) {
      await addToHistory(
        "Message envoyé",
        `Message envoyé vers ${peerRole}: ${content.slice(0, 80)}`
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
        Canal actif: <strong>{me.role}</strong> ↔ <strong>{peerRole}</strong>
      </div>

      <div className="h-[360px] overflow-y-auto rounded-xl border border-white/30 bg-white/70 p-4">
        {thread.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <MessageSquare className="w-10 h-10 mb-2" />
            <p>Aucun message pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {thread.map((message) => {
              const isMine = message.fromRole === me.role;
              return (
                <div
                  key={message.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 shadow-sm ${
                      isMine
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <div className="text-xs opacity-80 mb-1 flex items-center gap-1">
                      <UserRound className="w-3 h-3" />
                      {message.fromName}
                    </div>
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    <p className="text-[10px] mt-1 opacity-70">
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
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl"
        >
          <Send className="w-4 h-4 mr-1" />
          Envoyer
        </Button>
      </div>
    </div>
  );
};

export default MessagingPanel;
