import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Heart } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    const errorDetails = {
      timestamp: new Date().toISOString(),
      pathname: location.pathname,
      userAgent: navigator.userAgent,
    };
    console.error("404 Error: User attempted to access non-existent route:", errorDetails);
  }, [location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    const query = e.target.elements.search.value;
    if (query) {
      // Implement search logic or redirect to a search page
      console.log("Search query:", query);
      // Example: window.location.href = `/search?q=${encodeURIComponent(query)}`;
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-50 flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-green-500/10 opacity-80"></div>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-40 h-40 rounded-full bg-white/20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 rounded-full bg-white/15 animate-pulse delay-300"></div>
        <div className="absolute bottom-32 left-1/4 w-20 h-20 rounded-full bg-white/25 animate-pulse delay-600"></div>
        <div className="absolute bottom-20 right-1/3 w-28 h-28 rounded-full bg-white/20 animate-pulse delay-900"></div>
      </div>

      <div className="relative bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 sm:p-8 max-w-lg w-full text-center animate-fade-in">
        <div className="flex justify-center mb-6">
          <Heart className="w-16 h-16 text-blue-600" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">404</h1>
        <p className="text-lg sm:text-xl text-gray-600 mb-6">
          Oups ! La page que vous cherchez n'existe pas.
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Il semble que vous vous soyez perdu. Retournez à l'accueil ou essayez une recherche.
        </p>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex items-center gap-2">
            <Input
              name="search"
              placeholder="Rechercher une page..."
              className="rounded-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              aria-label="Rechercher une page"
            />
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full"
              aria-label="Lancer la recherche"
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </form>

        {/* Navigation Options */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            asChild
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-transform transform hover:scale-105"
          >
            <Link to="/" aria-label="Retourner à l'accueil">
              Retourner à l'accueil
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-blue-300 text-blue-600 hover:bg-blue-50 rounded-full"
          >
            <Link to="/#services" aria-label="Voir nos services">
              Nos Services
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-blue-300 text-blue-600 hover:bg-blue-50 rounded-full"
          >
            <Link to="/#contact" aria-label="Nous contacter">
              Nous Contacter
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;