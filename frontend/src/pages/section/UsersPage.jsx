import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, ArrowLeft, Users2, Search, Filter, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";

const FiltresHistory = ({ filters, onFiltersChange }) => {
  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const resetFilters = () => {
    onFiltersChange({
      dateRange: "",
      patient: "",
      email: "",
      status: "all",
      ageMin: "",
    });
  };

  return (
    <Card className="bg-card border border-border shadow-md rounded-2xl">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Filtres</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Recherche par nom
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nom d'utilisateur..."
                value={filters.patient}
                onChange={(e) => handleFilterChange("patient", e.target.value)}
                className="pl-10 border-border focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Email
            </label>
            <Input
              placeholder="ex: user@mail.com"
              value={filters.email || ""}
              onChange={(e) => handleFilterChange("email", e.target.value)}
              className="border-border focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              RÃ´le
            </label>
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange("status", value)}
            >
              <SelectTrigger className="border-border focus:ring-2 focus:ring-primary/20">
                <SelectValue placeholder="Tous les rÃ´les" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rÃ´les</SelectItem>
                <SelectItem value="patient">Patient</SelectItem>
                <SelectItem value="medecin">MÃ©decin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Ã‚ge minimum
            </label>
            <Input
              type="number"
              placeholder="ex: 18"
              value={filters.ageMin || ""}
              onChange={(e) => handleFilterChange("ageMin", e.target.value)}
              className="border-border focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Actions
            </label>
            <Button
              variant="outline"
              onClick={resetFilters}
              className="w-full border-border hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              RÃ©initialiser
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const UsersPage = ({ addToHistory }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingUser, setEditingUser] = useState({});
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    age: "",
    role: "patient",
    specialite: "",
  });
  const [filters, setFilters] = useState({
    dateRange: "",
    patient: "",
    email: "",
    status: "all",
    ageMin: "",
  });

  const navigate = useNavigate();

  // API base URL
  const _apiBaseRaw = import.meta.env.VITE_API_URL || "http://localhost:3000";
const _apiBase = _apiBaseRaw.replace(/\/+$/, "");
const API_BASE_URL = _apiBase.endsWith("/api") ? _apiBase : `${_apiBase}/api`;

  // Helper function to get JWT token from localStorage
  const getToken = () => localStorage.getItem("token");

  // Fetch users from backend
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/auth/users`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          toast.error("Session expirÃ©e ou accÃ¨s refusÃ©.");
          return;
        }
        throw new Error("Failed to fetch users");
      }

      const users = await response.json();
      setUsers(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Erreur lors du chargement des utilisateurs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (filters.patient && !user.username.toLowerCase().includes(filters.patient.toLowerCase())) {
        return false;
      }
      if (filters.email && !user.email?.toLowerCase().includes(filters.email.toLowerCase())) {
        return false;
      }
      if (filters.status !== "all" && user.role !== filters.status) {
        return false;
      }
      if (filters.ageMin && (!user.age || parseInt(user.age) < parseInt(filters.ageMin))) {
        return false;
      }
      return true;
    });
  }, [users, filters]);

  // Edit user
  const startEditUser = (user) => {
    setEditingUserId(user.id);
    setEditingUser({ ...user });
  };

  // Cancel edit
  const cancelEditUser = () => {
    setEditingUserId(null);
    setEditingUser({});
  };

  // Save user changes
  const saveEditedUser = async () => {
    if (!editingUser.username?.trim()) {
      toast.error("Le nom d'utilisateur est requis !");
      return;
    }
    if (!editingUser.email?.trim()) {
      toast.error("L'email est requis !");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/users/${editingUserId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          username: editingUser.username,
          email: editingUser.email,
          age: editingUser.age,
          role: editingUser.role,
          specialite: editingUser.specialite || undefined,
          telephone: editingUser.telephone,
          adresse: editingUser.adresse,
        }),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          toast.error("Session expirÃ©e. Veuillez vous reconnecter.");
          return;
        }
        const error = await response.json();
        throw new Error(error.message || "Failed to update user");
      }

      const updatedUser = await response.json();

      // Update local state
      setUsers(prev =>
        prev.map(u => (u.id === editingUserId ? updatedUser : u))
      );

      // Add to history
      await addToHistory(
        `Utilisateur modifiÃ©: ${editingUser.username}`,
        `Mise Ã  jour du profil de ${editingUser.username}`
      );

      toast.success(`Utilisateur "${editingUser.username}" sauvegardÃ© !`);
      setEditingUserId(null);
      setEditingUser({});
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error(`Erreur: ${error.message}`);
    }
  };

  // Delete user
  const deleteUser = async (userId, username) => {
    if (!window.confirm(`ÃŠtes-vous sÃ»r de vouloir supprimer l'utilisateur "${username}" ?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          toast.error("Session expirÃ©e. Veuillez vous reconnecter.");
          return;
        }
        throw new Error("Failed to delete user");
      }

      // Update local state
      setUsers(prev => prev.filter(u => u.id !== userId));

      // Add to history
      await addToHistory(
        `Utilisateur supprimÃ©: ${username}`,
        `Suppression du compte utilisateur ${username}`
      );

      toast.success(`Utilisateur "${username}" supprimÃ© !`);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Erreur lors de la suppression de l'utilisateur.");
    }
  };

  // Add new user
  const handleAddUser = async () => {
    if (!newUser.username.trim()) {
      toast.error("Le nom d'utilisateur est requis !");
      return;
    }
    if (!newUser.email?.trim()) {
      toast.error("L'email est requis !");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
      toast.error("Veuillez entrer un email valide !");
      return;
    }
    if (!newUser.password?.trim()) {
      toast.error("Le mot de passe est requis !");
      return;
    }
    if (newUser.age && (isNaN(newUser.age) || newUser.age < 0)) {
      toast.error("L'Ã¢ge doit Ãªtre un nombre positif !");
      return;
    }
    if (newUser.role === "medecin" && !newUser.specialite.trim()) {
      toast.error("La spÃ©cialitÃ© est requise pour un mÃ©decin !");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          username: newUser.username,
          email: newUser.email,
          password: newUser.password,
          age: newUser.age || undefined,
          role: newUser.role,
          specialite: newUser.specialite || undefined,
        }),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          toast.error("Session expirÃ©e. Veuillez vous reconnecter.");
          return;
        }
        const error = await response.json();
        throw new Error(error.message || "Failed to create user");
      }

      const createdUser = await response.json();

      // Update local state
      setUsers(prev => [...prev, createdUser]);

      // Add to history
      await addToHistory(
        `Nouvel utilisateur: ${newUser.username}`,
        `CrÃ©ation du compte ${newUser.username} (${newUser.role})`
      );

      toast.success(`Utilisateur "${newUser.username}" ajoutÃ© !`);
      setShowAddModal(false);
      setNewUser({ username: "", email: "", password: "", age: "", role: "patient", specialite: "" });
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error(`Erreur: ${error.message}`);
    }
  };

  return (
    <main className="min-h-screen container mx-auto px-6 py-10 space-y-10 bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border pb-5">
        <h1 className="text-4xl font-extrabold text-primary flex items-center gap-3">
          <Users2 className="w-8 h-8" />
          Gestion des Utilisateurs
        </h1>
        <Button
          variant="outline"
          onClick={() => navigate("/dashboard")}
          className="border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors flex items-center gap-2"
          aria-label="Retour au tableau de bord"
        >
          <ArrowLeft className="h-5 w-5" />
          Retour
        </Button>
      </header>

      {/* Filtres */}
      <section>
        <FiltresHistory filters={filters} onFiltersChange={setFilters} />
      </section>

      {/* Tableau des utilisateurs */}
      <section>
        <div className="bg-card rounded-2xl shadow-md border border-border p-6 overflow-auto max-h-[500px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-3" />
              <span>Chargement des utilisateurs...</span>
            </div>
          ) : (
            <table className="w-full border-collapse min-w-[700px]">
              <thead className="sticky top-0 bg-muted">
                <tr>
                  <th className="p-3 text-left font-semibold border-b">ID</th>
                  <th className="p-3 text-left font-semibold border-b">Nom</th>
                  <th className="p-3 text-left font-semibold border-b">Email</th>
                  <th className="p-3 text-left font-semibold border-b">Ã‚ge</th>
                  <th className="p-3 text-left font-semibold border-b">RÃ´le</th>
                  <th className="p-3 text-left font-semibold border-b">SpÃ©cialitÃ©s</th>
                  <th className="p-3 text-center font-semibold border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      {users.length === 0
                        ? "Aucun utilisateur enregistrÃ©"
                        : "Aucun utilisateur ne correspond aux critÃ¨res de filtrage"}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, index) => (
                    <tr
                      key={user.id}
                      className={`hover:bg-muted/50 transition-colors border-b ${
                        index % 2 === 0 ? "bg-background" : "bg-muted/20"
                      } ${editingUserId === user.id ? "bg-yellow-50" : ""}`}
                    >
                      <td className="p-3">{user.id}</td>
                      <td className="p-3">
                        {editingUserId === user.id ? (
                          <Input
                            type="text"
                            value={editingUser.username}
                            onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                            className="w-full border-border focus:ring-2 focus:ring-primary/20"
                            aria-label="Nom d'utilisateur"
                          />
                        ) : (
                          user.username
                        )}
                      </td>
                      <td className="p-3">
                        {editingUserId === user.id ? (
                          <Input
                            type="email"
                            value={editingUser.email}
                            onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                            className="w-full border-border focus:ring-2 focus:ring-primary/20"
                            aria-label="Email"
                          />
                        ) : (
                          user.email
                        )}
                      </td>
                      <td className="p-3">
                        {editingUserId === user.id ? (
                          <Input
                            type="number"
                            value={editingUser.age || ""}
                            onChange={(e) => setEditingUser({ ...editingUser, age: e.target.value })}
                            className="w-full border-border focus:ring-2 focus:ring-primary/20"
                            aria-label="Ã‚ge"
                          />
                        ) : (
                          user.age || "-"
                        )}
                      </td>
                      <td className="p-3">
                        {editingUserId === user.id ? (
                          <Select
                            value={editingUser.role}
                            onValueChange={(value) => setEditingUser({ ...editingUser, role: value })}
                          >
                            <SelectTrigger className="w-full border-border focus:ring-2 focus:ring-primary/20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="patient">Patient</SelectItem>
                              <SelectItem value="medecin">MÃ©decin</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="staff">Staff</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          user.role
                        )}
                      </td>
                      <td className="p-3">
                        {editingUserId === user.id ? (
                          editingUser.role === "medecin" ? (
                            <Input
                              type="text"
                              value={editingUser.specialite || ""}
                              onChange={(e) => setEditingUser({ ...editingUser, specialite: e.target.value })}
                              placeholder="SpÃ©cialitÃ©..."
                              className="w-full border-border focus:ring-2 focus:ring-primary/20"
                              aria-label="SpÃ©cialitÃ©"
                            />
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )
                        ) : (
                          user.role === "medecin" ? (user.specialite || "-") : "-"
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2 justify-center">
                          {editingUserId === user.id ? (
                            <>
                              <Button
                                size="sm"
                                onClick={saveEditedUser}
                                className="bg-green-600 hover:bg-green-700 text-white text-xs"
                              >
                                Confirmer
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEditUser}
                                className="text-xs"
                              >
                                Annuler
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                onClick={() => startEditUser(user)}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
                              >
                                Modifier
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => deleteUser(user.id, user.username)}
                                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs"
                              >
                                Supprimer
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={fetchUsers}
          className="border-border"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          Ajouter un utilisateur
        </Button>
      </section>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-2xl p-6 max-w-lg w-full relative shadow-2xl">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-destructive transition-colors"
              aria-label="Fermer la fenÃªtre d'ajout"
            >
              <X className="h-6 w-6" />
            </button>

            <h2 className="text-2xl font-bold mb-6 text-foreground">Ajouter un utilisateur</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Nom *
                </label>
                <Input
                  type="text"
                  placeholder="Nom d'utilisateur"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full border-border focus:ring-2 focus:ring-primary/20"
                  required
                  aria-label="Nom d'utilisateur"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Email *
                </label>
                <Input
                  type="email"
                  placeholder="Email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full border-border focus:ring-2 focus:ring-primary/20"
                  aria-label="Email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Mot de passe *
                </label>
                <Input
                  type="password"
                  placeholder="Mot de passe"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full border-border focus:ring-2 focus:ring-primary/20"
                  aria-label="Mot de passe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Ã‚ge
                </label>
                <Input
                  type="number"
                  placeholder="Ã‚ge"
                  value={newUser.age}
                  onChange={(e) => setNewUser({ ...newUser, age: e.target.value })}
                  className="w-full border-border focus:ring-2 focus:ring-primary/20"
                  aria-label="Ã‚ge"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  RÃ´le
                </label>
                <Select
                  value={newUser.role}
                  onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                >
                  <SelectTrigger className="w-full border-border focus:ring-2 focus:ring-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="patient">Patient</SelectItem>
                    <SelectItem value="medecin">MÃ©decin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newUser.role === "medecin" && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    SpÃ©cialitÃ©
                  </label>
                  <Input
                    type="text"
                    placeholder="SpÃ©cialitÃ© mÃ©dicale"
                    value={newUser.specialite}
                    onChange={(e) => setNewUser({ ...newUser, specialite: e.target.value })}
                    className="w-full border-border focus:ring-2 focus:ring-primary/20"
                    aria-label="SpÃ©cialitÃ©"
                  />
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => setShowAddModal(false)}
                className="border-border hover:bg-muted/50 text-foreground"
                aria-label="Annuler l'ajout"
              >
                Annuler
              </Button>
              <Button
                onClick={handleAddUser}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={!newUser.username.trim() || !newUser.email.trim() || !newUser.password.trim()}
                aria-label="Ajouter l'utilisateur"
              >
                Ajouter
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default UsersPage;