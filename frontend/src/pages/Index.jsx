import { Link } from "react-router-dom";
import { Stethoscope, LogIn, Info } from "lucide-react";
import HeroImage from "../assets/images/HeroImage.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-100 to-emerald-50">
      {/* Hero Section */}
      <main className="container mx-auto px-6 lg:px-12 py-20">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          {/* Texte */}
          <div className="space-y-10">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight text-gray-900">
                Simplifiez la gestion de votre{" "}
                <span className="bg-gradient-to-r from-cyan-600 via-blue-500 to-emerald-500 bg-clip-text text-transparent animate-gradient">
                  cabinet médical
                </span>
              </h1>
              <p className="text-xl text-gray-700 leading-relaxed max-w-xl">
                <span className="font-semibold text-cyan-600">MediPlan</span> révolutionne la prise de rendez-vous et la
                gestion des plannings pour les professionnels de santé.  
                Une solution <span className="font-medium">moderne, intuitive et sécurisée</span>.
              </p>
            </div>

            {/* Boutons */}
            <div className="flex flex-col sm:flex-row justify-center sm:justify-start gap-6 pt-8">
              <Link to="/login" className="w-full sm:w-48">
                <button className="group flex items-center justify-center w-full px-6 py-4 rounded-xl text-lg font-semibold text-white shadow-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 transform hover:scale-105 transition-all duration-300">
                  Connexion
                </button>
              </Link>

              <Link to="/about" className="w-full sm:w-48">
                <button className="group flex items-center justify-center w-full px-6 py-4 rounded-xl text-lg font-semibold text-gray-900 bg-white/80 backdrop-blur-md border border-gray-200 shadow-lg hover:bg-gray-50 transform hover:scale-105 transition-all duration-300">
                  En savoir plus
                </button>
              </Link>
            </div>
          </div>

          {/* Image illustrée (hero) */}
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 opacity-20 blur-3xl animate-pulse"></div>
            <div className="relative rounded-3xl shadow-xl overflow-hidden">
              <img
                src={HeroImage}
                alt="Médecin et patient"
                className="w-full h-[420px] object-cover"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
