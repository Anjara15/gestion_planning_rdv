import React, { useEffect, useMemo, useState } from "react";
import { Calendar, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TimeSlotsAdmin = () => {
  const _apiBaseRaw = import.meta.env.VITE_API_URL || "http://localhost:3000";
  const _apiBase = String(_apiBaseRaw).replace(/\/+$/, "");
  const API_BASE_URL = _apiBase.endsWith("/api") ? _apiBase : `${_apiBase}/api`;
  const getToken = () => localStorage.getItem("token");

  const [filters, setFilters] = useState({
    date_from: "",
    date_to: "",
    type: "",
    salle: "",
    created_by: "",
    status: "all",
    limit: 400,
    offset: 0,
  });
  const [data, setData] = useState({ items: [], total: 0, limit: 50, offset: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const emptySlot = {
    date: "",
    heure_debut: "09:00",
    heure_fin: "17:00",
    duree_consultation: 30,
    type_consultation: "consultation",
    salle_consultation: "Salle 1",
    max_patients: 8,
    medecin_id: "",
  };
  const [createForm, setCreateForm] = useState({ ...emptySlot });
  const [editingId, setEditingId] = useState("");
  const [editForm, setEditForm] = useState({ ...emptySlot });
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filters.date_from) params.append("date_from", filters.date_from);
      if (filters.date_to) params.append("date_to", filters.date_to);
      if (filters.type) params.append("type", filters.type);
      if (filters.salle) params.append("salle", filters.salle);
      if (filters.created_by) params.append("created_by", filters.created_by);
      if (filters.status && filters.status !== 'all') params.append("status", filters.status);
      params.append("limit", String(filters.limit));
      params.append("offset", String(filters.offset));

      const response = await fetch(`${API_BASE_URL}/time-slots/admin?${params.toString()}` , {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Erreur lors du chargement des créneaux");
      }
      const json = await response.json();
      setData(json);
    } catch (e) {
      setError(e.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const canPrev = useMemo(() => data.offset > 0, [data.offset]);
  const canNext = useMemo(() => data.offset + data.limit < data.total, [data.offset, data.limit, data.total]);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Sidebar for details */}
      <aside className={`${showSidebar && selectedSlot ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-gray-50 border-r border-gray-200 fixed inset-y-0 right-0 z-40`}>
        {showSidebar && selectedSlot && (
          <div className="h-full bg-white p-4 sm:p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Détails du créneau</h2>
                <p className="text-xs text-gray-500">ID: {selectedSlot.id}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowSidebar(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Details Section */}
            <div className="flex-1 space-y-4 overflow-y-auto">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-500 mb-1">📅 DATE</p>
                <p className="text-sm font-bold text-gray-800">{selectedSlot.date}</p>
              </div>

              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-500 mb-1">⏰ HORAIRE</p>
                <p className="text-sm font-bold text-gray-800">{selectedSlot.heure_debut} - {selectedSlot.heure_fin}</p>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-500 mb-1">📋 TYPE</p>
                <p className="text-sm font-bold text-gray-800">{selectedSlot.type_consultation}</p>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-500 mb-1">🏥 SALLE</p>
                <p className="text-sm font-bold text-gray-800">{selectedSlot.salle_consultation}</p>
              </div>

              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-500 mb-1">⏱️ DURÉE</p>
                <p className="text-sm font-bold text-gray-800">{selectedSlot.duree_consultation} min</p>
              </div>

              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-500 mb-1">👥 MAX PATIENTS</p>
                <p className="text-sm font-bold text-gray-800">{selectedSlot.max_patients}</p>
              </div>

              <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-500 mb-1">👨‍⚕️ MÉDECIN</p>
                <p className="text-sm font-bold text-gray-800">{selectedSlot.medecin_id || 'Non assigné'}</p>
              </div>

              <div className={`rounded-lg p-4 ${selectedSlot.status === 'approved' ? 'bg-green-50' : selectedSlot.status === 'rejected' ? 'bg-red-50' : 'bg-yellow-50'}`}>
                <p className="text-xs font-semibold text-gray-500 mb-1">✓ STATUT</p>
                <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${selectedSlot.status === 'approved' ? 'text-green-700 bg-green-100' : selectedSlot.status === 'rejected' ? 'text-red-700 bg-red-100' : 'text-yellow-700 bg-yellow-100'}`}>{selectedSlot.status || 'N/A'}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 mt-6 border-t border-gray-200 pt-4">
              <Button className="w-full bg-cyan-500 hover:bg-cyan-600 text-white" onClick={(e) => { e.stopPropagation(); setEditingId(selectedSlot.id); setEditForm({
                date: selectedSlot.date,
                heure_debut: selectedSlot.heure_debut,
                heure_fin: selectedSlot.heure_fin,
                duree_consultation: selectedSlot.duree_consultation,
                type_consultation: selectedSlot.type_consultation,
                salle_consultation: selectedSlot.salle_consultation,
                max_patients: selectedSlot.max_patients,
                medecin_id: selectedSlot.medecin_id || '',
              }); setShowSidebar(false); }} disabled={loading}>✏️ Éditer</Button>
              <Button className="w-full" variant="destructive" onClick={async (e) => {
                e.stopPropagation();
                if (!window.confirm('Supprimer ce créneau ?')) return;
                try {
                  setLoading(true);
                  const response = await fetch(`${API_BASE_URL}/time-slots/${selectedSlot.id}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${getToken()}` },
                  });
                  if (!response.ok) {
                    const err = await response.json().catch(() => ({}));
                    throw new Error(err.error || 'Erreur suppression');
                  }
                  setShowSidebar(false);
                  await fetchData();
                } catch (e) {
                  setError(e.message || 'Erreur');
                } finally {
                  setLoading(false);
                }
              }} disabled={loading}>🗑️ Supprimer</Button>
              {selectedSlot.status !== 'approved' && (
                <Button className="w-full bg-green-500 hover:bg-green-600 text-white" onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    setLoading(true);
                    const response = await fetch(`${API_BASE_URL}/time-slots/${selectedSlot.id}/approve`, { method: 'POST', headers: { Authorization: `Bearer ${getToken()}` } });
                    if (!response.ok) { const err = await response.json().catch(() => ({})); throw new Error(err.error || 'Erreur approbation'); }
                    setShowSidebar(false);
                    await fetchData();
                  } catch (e) { setError(e.message || 'Erreur'); } finally { setLoading(false); }
                }} disabled={loading}>✅ Approuver</Button>
              )}
              {selectedSlot.status !== 'rejected' && (
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    setLoading(true);
                    const response = await fetch(`${API_BASE_URL}/time-slots/${selectedSlot.id}/reject`, { method: 'POST', headers: { Authorization: `Bearer ${getToken()}` } });
                    if (!response.ok) { const err = await response.json().catch(() => ({})); throw new Error(err.error || 'Erreur rejet'); }
                    setShowSidebar(false);
                    await fetchData();
                  } catch (e) { setError(e.message || 'Erreur'); } finally { setLoading(false); }
                }} disabled={loading}>❌ Rejeter</Button>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Modal création */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Créer un nouveau créneau</h2>
              <Button variant="ghost" size="sm" onClick={() => { setShowCreateModal(false); setCreateForm({ ...emptySlot }); }}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block text-sm font-medium">Date *</Label>
                  <Input type="date" value={createForm.date} onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })} />
                </div>
                <div>
                  <Label className="mb-2 block text-sm font-medium">Type consultation</Label>
                  <Input placeholder="ex: consultation" value={createForm.type_consultation} onChange={(e) => setCreateForm({ ...createForm, type_consultation: e.target.value })} />
                </div>
                <div>
                  <Label className="mb-2 block text-sm font-medium">Heure début</Label>
                  <Input type="time" value={createForm.heure_debut} onChange={(e) => setCreateForm({ ...createForm, heure_debut: e.target.value })} />
                </div>
                <div>
                  <Label className="mb-2 block text-sm font-medium">Salle</Label>
                  <Input placeholder="ex: Salle 1" value={createForm.salle_consultation} onChange={(e) => setCreateForm({ ...createForm, salle_consultation: e.target.value })} />
                </div>
                <div>
                  <Label className="mb-2 block text-sm font-medium">Heure fin</Label>
                  <Input type="time" value={createForm.heure_fin} onChange={(e) => setCreateForm({ ...createForm, heure_fin: e.target.value })} />
                </div>
                <div>
                  <Label className="mb-2 block text-sm font-medium">Max patients</Label>
                  <Input type="number" value={createForm.max_patients} onChange={(e) => setCreateForm({ ...createForm, max_patients: Number(e.target.value || 0) })} />
                </div>
                <div>
                  <Label className="mb-2 block text-sm font-medium">Durée consultation (min)</Label>
                  <Input type="number" value={createForm.duree_consultation} onChange={(e) => setCreateForm({ ...createForm, duree_consultation: Number(e.target.value || 0) })} />
                </div>
                <div>
                  <Label className="mb-2 block text-sm font-medium">Médecin (userId) - optionnel</Label>
                  <Input placeholder="ex: 12" value={createForm.medecin_id} onChange={(e) => setCreateForm({ ...createForm, medecin_id: e.target.value })} />
                </div>
              </div>

              {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button 
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                  disabled={loading || !createForm.date}
                  onClick={async () => {
                    try {
                      setLoading(true);
                      const response = await fetch(`${API_BASE_URL}/time-slots`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                        body: JSON.stringify(createForm),
                      });
                      if (!response.ok) {
                        const err = await response.json().catch(() => ({}));
                        throw new Error(err.error || 'Erreur création');
                      }
                      setCreateForm({ ...emptySlot });
                      setShowCreateModal(false);
                      await fetchData();
                      setError("");
                    } catch (e) {
                      setError(e.message || 'Erreur');
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  ✅ Créer créneau
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1"
                  disabled={loading}
                  onClick={() => {
                    setCreateForm({ ...emptySlot });
                    setError("");
                  }}
                >
                  Réinitialiser
                </Button>
                <Button 
                  variant="ghost"
                  className="flex-1"
                  disabled={loading}
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateForm({ ...emptySlot });
                  }}
                >
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8 space-y-6 mr-0 lg:mr-80">
        {/* Header with title and create button */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-8 h-8 text-blue-600" />
            Gestion des créneaux
          </h1>
          <Button 
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white flex items-center gap-2"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-5 h-5" />
            Nouveau
          </Button>
        </div>

        {/* Filters Section */}
        <Card className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/30">
          <CardHeader>
            <CardTitle className="text-xl">Filtres créneaux (admin)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label className="mb-2 block text-sm font-medium">Date début</Label>
                <Input type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} />
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">Date fin</Label>
                <Input type="date" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} />
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">Statut</Label>
                <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="approved">Approuvé</SelectItem>
                    <SelectItem value="rejected">Rejeté</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">Type consultation</Label>
                <Input placeholder="ex: consultation" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} />
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">Salle</Label>
                <Input placeholder="ex: Salle 1" value={filters.salle} onChange={(e) => setFilters({ ...filters, salle: e.target.value })} />
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">Créé par (userId)</Label>
                <Input placeholder="ex: 12" value={filters.created_by} onChange={(e) => setFilters({ ...filters, created_by: e.target.value })} />
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">Taille page</Label>
                <Select value={String(filters.limit)} onValueChange={(v) => setFilters({ ...filters, limit: parseInt(v, 10), offset: 0 })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Limite" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                    <SelectItem value="400">400 (Tous)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={() => { setFilters({ ...filters, offset: 0 }); fetchData(); }} disabled={loading} className="bg-blue-500 hover:bg-blue-600 text-white">
                🔍 Rechercher
              </Button>
              <Button variant="outline" onClick={() => { setFilters({ date_from: "", date_to: "", type: "", salle: "", created_by: "", status: "all", limit: 400, offset: 0 }); }} disabled={loading}>
                ↻ Réinitialiser
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table Section */}
        <Card className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Créneaux ({data.total})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && <p className="text-red-600 mb-3 bg-red-50 p-3 rounded-lg">{error}</p>}
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-200 p-2 text-left text-sm font-medium text-gray-700">Date</th>
                    <th className="border border-gray-200 p-2 text-left text-sm font-medium text-gray-700">Début</th>
                    <th className="border border-gray-200 p-2 text-left text-sm font-medium text-gray-700">Fin</th>
                    <th className="border border-gray-200 p-2 text-left text-sm font-medium text-gray-700">Durée</th>
                    <th className="border border-gray-200 p-2 text-left text-sm font-medium text-gray-700">Type</th>
                    <th className="border border-gray-200 p-2 text-left text-sm font-medium text-gray-700">Salle</th>
                    <th className="border border-gray-200 p-2 text-left text-sm font-medium text-gray-700">Max</th>
                    <th className="border border-gray-200 p-2 text-left text-sm font-medium text-gray-700">Médecin</th>
                    <th className="border border-gray-200 p-2 text-left text-sm font-medium text-gray-700">Statut</th>
                    <th className="border border-gray-200 p-2 text-left text-sm font-medium text-gray-700 sticky right-0 bg-gray-100">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td className="p-4 text-sm text-center" colSpan={10}>⏳ Chargement...</td></tr>
                  ) : data.items.length === 0 ? (
                    <tr><td className="p-4 text-sm text-gray-500 text-center" colSpan={10}>❌ Aucun créneau trouvé</td></tr>
                  ) : (
                    data.items.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-200" onClick={() => { setSelectedSlot(s); setShowSidebar(true); }}>
                        <td className="border border-gray-200 p-2 text-sm font-medium text-gray-700">{s.date}</td>
                        <td className="border border-gray-200 p-2 text-sm text-gray-600">{s.heure_debut}</td>
                        <td className="border border-gray-200 p-2 text-sm text-gray-600">{s.heure_fin}</td>
                        <td className="border border-gray-200 p-2 text-sm text-gray-600">{s.duree_consultation} min</td>
                        <td className="border border-gray-200 p-2 text-sm text-gray-600">{s.type_consultation}</td>
                        <td className="border border-gray-200 p-2 text-sm text-gray-600">{s.salle_consultation}</td>
                        <td className="border border-gray-200 p-2 text-sm text-center font-medium text-gray-700">{s.max_patients}</td>
                        <td className="border border-gray-200 p-2 text-sm text-gray-600">{s.medecin_id || '—'}</td>
                        <td className="border border-gray-200 p-2 text-sm">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${s.status === 'approved' ? 'text-green-700 bg-green-100' : s.status === 'rejected' ? 'text-red-700 bg-red-100' : 'text-yellow-800 bg-yellow-100'}`}>
                            {s.status === 'approved' ? '✅ Approuvé' : s.status === 'rejected' ? '❌ Rejeté' : '⏳ En attente'}
                          </span>
                        </td>
                        <td className="border border-gray-200 p-2 text-sm sticky right-0 bg-white">
                          <div className="flex gap-1 flex-wrap justify-end">
                            {editingId === s.id ? (
                              <>
                                <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white text-xs" onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    setLoading(true);
                                    const response = await fetch(`${API_BASE_URL}/time-slots/${s.id}`, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                                      body: JSON.stringify(editForm),
                                    });
                                    if (!response.ok) {
                                      const err = await response.json().catch(() => ({}));
                                      throw new Error(err.error || 'Erreur mise à jour');
                                    }
                                    setEditingId("");
                                    await fetchData();
                                  } catch (e) {
                                    setError(e.message || 'Erreur');
                                  } finally {
                                    setLoading(false);
                                  }
                                }}>Enregistrer</Button>
                                <Button size="sm" variant="outline" className="text-xs" onClick={(e) => { e.stopPropagation(); setEditingId(""); }}>Annuler</Button>
                              </>
                            ) : (
                              <>
                                <Button size="sm" variant="outline" className="text-xs" onClick={(e) => { e.stopPropagation(); setEditingId(s.id); setEditForm({
                                  date: s.date,
                                  heure_debut: s.heure_debut,
                                  heure_fin: s.heure_fin,
                                  duree_consultation: s.duree_consultation,
                                  type_consultation: s.type_consultation,
                                  salle_consultation: s.salle_consultation,
                                  max_patients: s.max_patients,
                                  medecin_id: s.medecin_id || '',
                                }); }}>✏️</Button>
                                <Button size="sm" variant="destructive" className="text-xs" onClick={async (e) => {
                                  e.stopPropagation();
                                  if (!window.confirm('Supprimer ce créneau ?')) return;
                                  try {
                                    setLoading(true);
                                    const response = await fetch(`${API_BASE_URL}/time-slots/${s.id}`, {
                                      method: 'DELETE',
                                      headers: { Authorization: `Bearer ${getToken()}` },
                                    });
                                    if (!response.ok) {
                                      const err = await response.json().catch(() => ({}));
                                      throw new Error(err.error || 'Erreur suppression');
                                    }
                                    await fetchData();
                                  } catch (e) {
                                    setError(e.message || 'Erreur');
                                  } finally {
                                    setLoading(false);
                                  }
                                }}>🗑️</Button>
                                {s.status !== 'approved' && (
                                  <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white text-xs" onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      setLoading(true);
                                      const response = await fetch(`${API_BASE_URL}/time-slots/${s.id}/approve`, {
                                        method: 'POST',
                                        headers: { Authorization: `Bearer ${getToken()}` },
                                      });
                                      if (!response.ok) {
                                        const err = await response.json().catch(() => ({}));
                                        throw new Error(err.error || 'Erreur approbation');
                                      }
                                      await fetchData();
                                    } catch (e) {
                                      setError(e.message || 'Erreur');
                                    } finally {
                                      setLoading(false);
                                    }
                                  }}>✅</Button>
                                )}
                                {s.status !== 'rejected' && (
                                  <Button size="sm" variant="outline" className="text-xs" onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      setLoading(true);
                                      const response = await fetch(`${API_BASE_URL}/time-slots/${s.id}/reject`, {
                                        method: 'POST',
                                        headers: { Authorization: `Bearer ${getToken()}` },
                                      });
                                      if (!response.ok) {
                                        const err = await response.json().catch(() => ({}));
                                        throw new Error(err.error || 'Erreur rejet');
                                      }
                                      await fetchData();
                                    } catch (e) {
                                      setError(e.message || 'Erreur');
                                    } finally {
                                      setLoading(false);
                                    }
                                  }}>❌</Button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-600 font-medium">Total: <span className="text-lg font-bold text-blue-600">{data.total}</span></span>
              <div className="flex gap-2">
                <Button variant="outline" disabled={!canPrev || loading} onClick={() => { const nextOffset = Math.max(data.offset - data.limit, 0); setFilters({ ...filters, offset: nextOffset }); setData({ ...data, offset: nextOffset }); fetchData(); }}>
                  ← Précédent
                </Button>
                <span className="text-sm text-gray-600 flex items-center px-2">
                  Page {Math.floor(data.offset / data.limit) + 1}
                </span>
                <Button variant="outline" disabled={!canNext || loading} onClick={() => { const nextOffset = data.offset + data.limit; setFilters({ ...filters, offset: nextOffset }); setData({ ...data, offset: nextOffset }); fetchData(); }}>
                  Suivant →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default TimeSlotsAdmin;

