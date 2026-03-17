import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
const _apiBaseRaw = import.meta.env.VITE_API_URL || "http://localhost:3000";
const _apiBase = String(_apiBaseRaw).replace(/\/+$/, "");
const API_BASE_URL = _apiBase.endsWith("/api") ? _apiBase : `${_apiBase}/api`;

const getTokenHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function fetchPayments() {
  const resp = await axios.get(`${API_BASE_URL}/payments`, { headers: getTokenHeader() });
  return resp.data;
}

async function createPayment(body) {
  const resp = await axios.post(`${API_BASE_URL}/payments`, body, {
    headers: { "Content-Type": "application/json", ...getTokenHeader() },
  });
  return resp.data;
}

async function updatePayment(id, body) {
  const resp = await axios.put(`${API_BASE_URL}/payments/${id}`, body, {
    headers: { "Content-Type": "application/json", ...getTokenHeader() },
  });
  return resp.data;
}

async function deletePayment(id) {
  const resp = await axios.delete(`${API_BASE_URL}/payments/${id}`, { headers: getTokenHeader() });
  return resp.data;
}

const AdminBillingPayments = ({ addToHistory, currentUser }) => {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ patient: "", amount: "", status: "en_attente", description: "" });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchPayments()
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("Erreur chargement paiements:", err);
        setRows([]);
        toast.error("Erreur de chargement des paiements");
      });
  }, []);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => {
          const amount = Number(row.amount || 0);
          acc.total += amount;
          if (row.status === "paye") acc.paid += amount;
          if (row.status === "en_attente") acc.pending += amount;
          return acc;
        },
        { total: 0, paid: 0, pending: 0 }
      ),
    [rows]
  );

  const addBill = async () => {
    if (!form.patient.trim() || Number(form.amount) <= 0) return;
    const body = {
      patient_id: form.patient.trim(),
      amount: Number(form.amount),
      status: form.status,
      description: form.description.trim(),
    };
    try {
      if (editingId) {
        const updated = await updatePayment(editingId, body);
        setRows((prev) => prev.map((r) => (r.id === editingId ? updated : r)));
        addToHistory?.("Facturation", `Facture mise a jour pour ${updated.patient_id}`, currentUser);
      } else {
        const saved = await createPayment(body);
        setRows((prev) => [saved, ...prev]);
        addToHistory?.("Facturation", `Facture creee pour ${saved.patient_id}`, currentUser);
      }
      setForm({ patient: "", amount: "", status: "en_attente", description: "" });
      setEditingId(null);
    } catch (err) {
      console.error(err);
      toast.error(editingId ? 'Erreur mise a jour paiement' : 'Erreur creation paiement');
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 p-4 sm:p-6">
      <h3 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-6">Facturation et paiement</h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
          <p className="text-sm text-emerald-700">Encaisse</p>
          <p className="font-bold text-emerald-800">{totals.paid.toLocaleString("fr-FR")} Ar</p>
        </div>
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
          <p className="text-sm text-amber-700">En attente</p>
          <p className="font-bold text-amber-800">{totals.pending.toLocaleString("fr-FR")} Ar</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <p className="text-sm text-slate-700">Total</p>
          <p className="font-bold text-slate-800">{totals.total.toLocaleString("fr-FR")} Ar</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
        <Input placeholder="Patient" value={form.patient} onChange={(e) => setForm((p) => ({ ...p, patient: e.target.value }))} />
        <Input type="number" placeholder="Montant" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} />
        <select className="rounded-xl border border-gray-200 px-3" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
          <option value="en_attente">En attente</option>
          <option value="paye">Paye</option>
          <option value="annule">Annule</option>
        </select>
        <Input placeholder="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
        <Button onClick={addBill} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Ajouter
        </Button>
      </div>

      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.id} className="p-3 rounded-xl border border-gray-200 bg-gray-50/80 flex items-center justify-between">
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" className="text-indigo-600" onClick={() => {
                // load into form for editing
                setForm({ patient: row.patient || row.patient_id || '', amount: row.amount || '', status: row.status, description: row.description || '' });
                setEditingId(row.id);
              }}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" className="text-red-600" onClick={async () => {
                if (!window.confirm('Supprimer cette facture ?')) return;
                try {
                  await deletePayment(row.id);
                  setRows((prev) => prev.filter((r) => r.id !== row.id));
                } catch (e) {
                  console.error(e);
                }
              }}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <div>
              <p className="font-medium text-gray-700 flex items-center gap-2"><CreditCard className="w-4 h-4 text-indigo-600" /> {row.patient || row.patient_id}</p>
              <p className="text-sm text-gray-600">{Number(row.amount).toLocaleString("fr-FR")} Ar - {row.description || "-"}</p>
            </div>
            <Badge className={row.status === "paye" ? "bg-emerald-100 text-emerald-700" : row.status === "en_attente" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}>
              {row.status}
            </Badge>
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-gray-500 text-center py-6">Aucune facture.</p>}
      </div>
    </div>
  );
};

export default AdminBillingPayments;
