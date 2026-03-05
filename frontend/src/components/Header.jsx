import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="py-4 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-primary">
          MediPlan
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-foreground hover:text-primary transition-colors">
            Accueil
          </Link>
          <Link to="/features" className="text-foreground hover:text-primary transition-colors">
            Fonctionnalités
          </Link>
          <Link to="/pricing" className="text-foreground hover:text-primary transition-colors">
            Tarifs
          </Link>
          <Link to="/contact" className="text-foreground hover:text-primary transition-colors">
            Contact
          </Link>
        </nav>
        
        <div className="flex items-center space-x-4">
          <Link to="/login">
            <Button variant="outline" size="sm">
              Connexion
            </Button>
          </Link>
          <Link to="/register" className="hidden sm:block">
            <Button size="sm">
              S'inscrire
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;