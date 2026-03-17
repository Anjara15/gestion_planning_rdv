import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pill, Search } from "lucide-react";

const PRESCRIPTION_KEY = "medecinPrescriptions";
const DEFAULT_MEDICATIONS = [
  "Amoxicilline",
  "Aspirine",
  "Azithromycine",
  "Beclometasone",
  "Ceftriaxone",
  "Ciprofloxacine",
  "Diclofenac",
  "Ibuprofene",
  "Metformine",
  "Omeprazole",
  "Paracetamol",
  "Salbutamol",
  "Vitamine C",
];

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const getInitialLetter = (value = "") => {
  const clean = String(value).trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const first = clean.charAt(0).toUpperCase();
  return /[A-Z]/.test(first) ? first : "#";
};

const MedecinMedicamentsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeLetter, setActiveLetter] = useState("ALL");
  const [medications, setMedications] = useState([]);

  useEffect(() => {
    const extracted = [];

    try {
      const raw = localStorage.getItem(PRESCRIPTION_KEY);
      const prescriptions = JSON.parse(raw || "[]");

      if (Array.isArray(prescriptions)) {
        prescriptions.forEach((prescription) => {
          const meds = Array.isArray(prescription?.medications) ? prescription.medications : [];
          meds.forEach((med) => {
            const name = typeof med?.name === "string" ? med.name.trim() : "";
            if (name) {
              extracted.push(name);
            }
          });
        });
      }
    } catch (error) {
      console.error("Erreur chargement médicaments:", error);
    }

    const merged = [...DEFAULT_MEDICATIONS, ...extracted];
    const deduped = [...new Set(merged.map((item) => item.trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));

    setMedications(deduped);
  }, []);

  const grouped = useMemo(() => {
    const groupedMap = medications.reduce((acc, name) => {
      const letter = getInitialLetter(name);
      if (!acc[letter]) acc[letter] = [];
      acc[letter].push(name);
      return acc;
    }, {});

    return Object.entries(groupedMap)
      .sort(([a], [b]) => a.localeCompare(b, "fr"))
      .map(([letter, items]) => ({ letter, items }));
  }, [medications]);

  const filteredGroups = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return grouped
      .map((group) => {
        const filteredItems = group.items.filter((name) => {
          const matchesSearch = !query || name.toLowerCase().includes(query);
          const matchesLetter = activeLetter === "ALL" || group.letter === activeLetter;
          return matchesSearch && matchesLetter;
        });

        return { ...group, items: filteredItems };
      })
      .filter((group) => group.items.length > 0);
  }, [grouped, searchTerm, activeLetter]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary">Médicaments (A-Z)</h2>
        <p className="text-muted-foreground">Catalogue alphabétique des médicaments prescrits</p>
      </div>

      <div className="bg-white border border-border rounded-2xl p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un médicament"
            className="pl-10 rounded-xl"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={activeLetter === "ALL" ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setActiveLetter("ALL")}
          >
            Tous
          </Button>
          {LETTERS.map((letter) => (
            <Button
              key={letter}
              size="sm"
              variant={activeLetter === letter ? "default" : "outline"}
              className="rounded-full min-w-9"
              onClick={() => setActiveLetter(letter)}
            >
              {letter}
            </Button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-border rounded-2xl p-6">
        {filteredGroups.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Aucun médicament trouvé.</p>
        ) : (
          <div className="space-y-5">
            {filteredGroups.map((group) => (
              <div key={group.letter} className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">{group.letter}</h3>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <Badge key={`${group.letter}-${item}`} variant="secondary" className="rounded-full px-3 py-1">
                      <Pill className="w-3 h-3 mr-1" />
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MedecinMedicamentsPage;
