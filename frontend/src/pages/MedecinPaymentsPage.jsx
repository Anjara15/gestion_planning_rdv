import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CreditCard, Plus, CheckCircle2, Clock3, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const STORAGE_KEY = "medecinPayments";

const PAYMENT_LABELS = {
  paye: "Payé",
  en_attente: "En attente",
  annule: "Annulé",
};

const PAYMENT_COLORS = {
  paye: "bg-emerald-100 text-emerald-700",
  en_attente: "bg-amber-100 text-amber-700",
  annule: "bg-red-100 text-red-700",
};

const MedecinPaymentsPage = ({ currentUser, addToHistory, patients = [] }) => {
  const [payments, setPayments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    patientId: "",
    patientName: "",
    amount: "",
    method: "especes",
    status: "en_attente",
    date: new Date().toISOString().split("T")[0],
    description: "",
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      setPayments(Array.isArray(saved) ? saved : []);
    } catch (error) {
      console.error("Erreur chargement paiements:", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payments));
  }, [payments]);

  const stats = useMemo(() => {
    return payments.reduce(
      (acc, item) => {
        const amount = Number(item.amount || 0);
        if (item.status === "paye") acc.paid += amount;
        if (item.status === "en_attente") acc.pending += amount;
        acc.total += amount;
        return acc;
      },
      { paid: 0, pending: 0, total: 0 }
    );
  }, [payments]);

  const filteredPayments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return payments;
    return payments.filter((payment) => {
      const bag = [payment.patientName, payment.reference, payment.description].join(" ").toLowerCase();
      return bag.includes(query);
    });
  }, [payments, searchTerm]);

  const handlePatientSelect = (patientId) => {
    const patient = patients.find((item) => String(item.id) === String(patientId));
    setFormData((prev) => ({ ...prev, patientId, patientName: patient?.username || "" }));
  };

  const resetForm = () => {
    setFormData({
      patientId: "",
      patientName: "",
      amount: "",
      method: "especes",
      status: "en_attente",
      date: new Date().toISOString().split("T")[0],
      description: "",
    });
    setShowForm(false);
  };

  const createPayment = () => {
    const amount = Number(formData.amount);
    if (!formData.patientId) {
      toast.error("Sélectionnez un patient.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Montant invalide.");
      return;
    }

    const payment = {
      id: Date.now().toString(),
      reference: `PAY-${Date.now()}`,
      patientId: formData.patientId,
      patientName: formData.patientName,
      amount,
      method: formData.method,
      status: formData.status,
      date: formData.date,
      description: formData.description,
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.username || "Dr. Martin",
    };

    setPayments((prev) => [payment, ...prev]);
    addToHistory?.("Paiement", `Paiement créé (${amount} Ar) pour ${payment.patientName}`, currentUser);
    toast.success("Paiement enregistré", { description: payment.reference });
    resetForm();
  };

  const markAsPaid = (id) => {
    setPayments((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "paye",
              paidAt: new Date().toISOString(),
            }
          : item
      )
    );

    const target = payments.find((item) => item.id === id);
    if (target) {
      addToHistory?.("Paiement", `Paiement validé ${target.reference} pour ${target.patientName}`, currentUser);
    }
    toast.success("Paiement validé");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">Paiements</h2>
          <p className="text-muted-foreground">Suivi des règlements des patients</p>
        </div>
        <Button onClick={() => setShowForm((prev) => !prev)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">
          <Plus className="w-4 h-4 mr-2" /> Nouveau paiement
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm text-emerald-700">Montant encaissé</p>
          <p className="text-xl font-bold text-emerald-800">{stats.paid.toLocaleString("fr-FR")} Ar</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-700">En attente</p>
          <p className="text-xl font-bold text-amber-800">{stats.pending.toLocaleString("fr-FR")} Ar</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-700">Total enregistré</p>
          <p className="text-xl font-bold text-slate-800">{stats.total.toLocaleString("fr-FR")} Ar</p>
        </div>
      </div>

      {showForm && (
        <div className="bg-white border border-border rounded-2xl p-6 space-y-4">
          <h3 className="text-xl font-semibold text-primary">Ajouter un paiement</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Patient *</Label>
              <select
                value={formData.patientId}
                onChange={(e) => handlePatientSelect(e.target.value)}
                className="w-full rounded-xl px-4 py-3 border border-border focus:ring-4 focus:ring-primary/20 focus:outline-none"
              >
                <option value="">Sélectionner un patient</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.username}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Montant (Ar) *</Label>
              <Input
                type="number"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div>
              <Label>Méthode</Label>
              <select
                value={formData.method}
                onChange={(e) => setFormData((prev) => ({ ...prev, method: e.target.value }))}
                className="w-full rounded-xl px-4 py-3 border border-border"
              >
                <option value="especes">Espèces</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="carte">Carte bancaire</option>
                <option value="virement">Virement</option>
              </select>
            </div>
            <div>
              <Label>Statut</Label>
              <select
                value={formData.status}
                onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full rounded-xl px-4 py-3 border border-border"
              >
                <option value="en_attente">En attente</option>
                <option value="paye">Payé</option>
                <option value="annule">Annulé</option>
              </select>
            </div>
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="rounded-xl"
                placeholder="Ex: Consultation générale + médicaments"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" className="rounded-xl" onClick={resetForm}>
              Annuler
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl" onClick={createPayment}>
              Enregistrer
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white border border-border rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <h3 className="text-xl font-semibold text-primary">Historique des paiements</h3>
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10 rounded-xl"
              placeholder="Référence, patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Aucun paiement enregistré.</p>
        ) : (
          <div className="space-y-3">
            {filteredPayments.map((item) => (
              <div key={item.id} className="border border-border rounded-xl p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-indigo-600" />
                      {item.reference}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {item.patientName} • {new Date(item.date).toLocaleDateString("fr-FR")} • {Number(item.amount).toLocaleString("fr-FR")} Ar
                    </p>
                    {item.description && <p className="text-sm text-muted-foreground mt-1">{item.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`rounded-full ${PAYMENT_COLORS[item.status] || "bg-slate-100 text-slate-700"}`}>
                      {PAYMENT_LABELS[item.status] || item.status}
                    </Badge>
                    {item.status === "en_attente" && (
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl" onClick={() => markAsPaid(item.id)}>
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Valider
                      </Button>
                    )}
                    {item.status === "paye" && (
                      <span className="text-xs text-emerald-700 flex items-center gap-1">
                        <Clock3 className="w-3 h-3" />
                        {item.paidAt ? new Date(item.paidAt).toLocaleString("fr-FR") : "Validé"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MedecinPaymentsPage;
