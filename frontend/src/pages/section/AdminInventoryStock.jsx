import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, AlertTriangle, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const _apiBaseRaw = import.meta.env.VITE_API_URL || "http://localhost:3000";
const _apiBase = String(_apiBaseRaw).replace(/\/+$/, "");
const API_BASE_URL = _apiBase.endsWith("/api") ? _apiBase : `${_apiBase}/api`;

const getTokenHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function fetchInventoryItems() {
  const resp = await axios.get(`${API_BASE_URL}/inventory-items`, { headers: getTokenHeader() });
  return resp.data;
}

async function createInventoryItem(body) {
  const resp = await axios.post(`${API_BASE_URL}/inventory-items`, body, {
    headers: { "Content-Type": "application/json", ...getTokenHeader() },
  });
  return resp.data;
}

async function updateInventoryItem(id, body) {
  const resp = await axios.put(`${API_BASE_URL}/inventory-items/${id}`, body, {
    headers: { "Content-Type": "application/json", ...getTokenHeader() },
  });
  return resp.data;
}

async function deleteInventoryItem(id) {
  await axios.delete(`${API_BASE_URL}/inventory-items/${id}`, { headers: getTokenHeader() });
}

const AdminInventoryStock = ({ addToHistory, currentUser }) => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: "", category: "", quantity: "", threshold: "" });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventoryItems()
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("Erreur chargement inventaire:", err);
        toast.error("Erreur de chargement de l'inventaire");
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => (a.name || "").localeCompare(b.name || "", "fr", { sensitivity: "base" })),
    [items]
  );

  const resetForm = () => {
    setForm({ name: "", category: "", quantity: "", threshold: "" });
    setEditingId(null);
  };

  const saveItem = async () => {
    const name = form.name.trim();
    if (!name) return;
    const payload = {
      name,
      category: form.category.trim() || null,
      quantity: Number(form.quantity || 0),
      threshold: Number(form.threshold || 0),
    };

    try {
      if (editingId) {
        const updated = await updateInventoryItem(editingId, payload);
        setItems((prev) => prev.map((item) => (item.id === editingId ? updated : item)));
        addToHistory?.("Inventaire", `Mise à jour stock: ${updated.name}`, currentUser);
      } else {
        const saved = await createInventoryItem(payload);
        setItems((prev) => [saved, ...prev]);
        addToHistory?.("Inventaire", `Ajout stock: ${saved.name}`, currentUser);
      }
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error(editingId ? "Erreur mise à jour stock" : "Erreur création stock");
    }
  };

  const startEdit = (item) => {
    setForm({
      name: item.name || "",
      category: item.category || "",
      quantity: String(item.quantity ?? ""),
      threshold: String(item.threshold ?? ""),
    });
    setEditingId(item.id);
  };

  const removeItem = async (id) => {
    if (!window.confirm("Supprimer cet article ?")) return;
    try {
      await deleteInventoryItem(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error(err);
      toast.error("Erreur suppression stock");
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 p-4 sm:p-6">
      <h3 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-6">Inventaire et stock</h3>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
        <Input placeholder="Produit" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
        <Input placeholder="Catégorie" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} />
        <Input type="number" placeholder="Quantité" value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))} />
        <Input type="number" placeholder="Seuil" value={form.threshold} onChange={(e) => setForm((p) => ({ ...p, threshold: e.target.value }))} />
        <div className="flex gap-2">
          <Button onClick={saveItem} className="bg-cyan-600 hover:bg-cyan-700 text-white w-full">
            <Plus className="w-4 h-4 mr-2" /> {editingId ? "Mettre à jour" : "Ajouter"}
          </Button>
          {editingId && (
            <Button variant="outline" onClick={resetForm} className="border-gray-200 text-gray-700">
              Annuler
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-white/30">
          <thead className="bg-gray-50/80">
            <tr>
              <th className="border border-white/30 p-2 text-left text-sm">Produit</th>
              <th className="border border-white/30 p-2 text-left text-sm">Catégorie</th>
              <th className="border border-white/30 p-2 text-left text-sm">Quantité</th>
              <th className="border border-white/30 p-2 text-left text-sm">État</th>
              <th className="border border-white/30 p-2 text-left text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map((item) => {
              const isLow = Number(item.quantity) <= Number(item.threshold || 0);
              return (
                <tr key={item.id} className="hover:bg-gray-50/50">
                  <td className="border border-white/30 p-2 text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-cyan-600" />
                      {item.name}
                    </div>
                  </td>
                  <td className="border border-white/30 p-2 text-sm text-gray-600">{item.category || "-"}</td>
                  <td className="border border-white/30 p-2 text-sm text-gray-600">{item.quantity}</td>
                  <td className="border border-white/30 p-2 text-sm">
                    {isLow ? (
                      <Badge className="bg-red-100 text-red-700"><AlertTriangle className="w-3 h-3 mr-1" />Stock bas</Badge>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-700">OK</Badge>
                    )}
                  </td>
                  <td className="border border-white/30 p-2 text-sm">
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="text-indigo-600" onClick={() => startEdit(item)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-600" onClick={() => removeItem(item.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && sortedItems.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-6">Aucun article en inventaire.</p>
        )}
      </div>
    </div>
  );
};

export default AdminInventoryStock;
