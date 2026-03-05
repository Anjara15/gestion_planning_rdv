import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faEye, faEyeSlash, faUser, faLock, faEnvelope, faArrowLeft, faStethoscope, faUserMd } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    console.log("Login Payload:", { username, password });
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.message || 'Identifiants invalides !');
        setIsLoading(false);
        return;
      }
      const data = await response.json();
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.user.role);
      navigate('/dashboard');
    } catch (_) {
      setError("Erreur de connexion au serveur !");
    }
    setIsLoading(false);
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-100 to-emerald-50 relative overflow-hidden">
      {/* Éléments décoratifs de fond */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-cyan-200 to-blue-300 rounded-full opacity-30 animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-emerald-200 to-cyan-300 rounded-full opacity-20 animate-bounce"></div>
      <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-gradient-to-br from-blue-200 to-emerald-200 rounded-full opacity-25 animate-ping"></div>
      
      <div className="flex items-center justify-center min-h-screen p-4 relative z-10">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 max-w-md w-full relative border border-white/30">
          {/* Bouton retour élégant */}
          <button
            onClick={handleBackToHome}
            className="absolute -top-3 -left-3 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-blue-600 hover:shadow-xl transition-all duration-300 transform hover:scale-110"
            aria-label="Retour à l'accueil"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>

          {/* En-tête avec animation */}
          <div className="text-center mb-8 space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full mb-4 animate-pulse">
              <FontAwesomeIcon icon={faStethoscope} className="text-white text-2xl" />
            </div>
            <div className="h-1 w-20 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mx-auto"></div>
            <p className="text-gray-600 font-medium">
              {showRegister ? ' Créer votre compte' : ' Connexion sécurisée'}
            </p>
          </div>

          {showRegister ? (
            <Register setShowRegister={setShowRegister} />
          ) : (
            <>
              {error && (
                <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 relative shadow-sm animate-shake">
                  <div className="flex items-center">
                    <span className="text-red-500 mr-2">⚠️</span>
                    {error}
                  </div>
                  <button 
                    onClick={() => setError('')} 
                    className="absolute right-3 top-3 text-red-400 hover:text-red-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-6">
                {/* Username avec animation */}
                <div className="group">
                  <label className="block mb-2 font-semibold text-gray-700 transition-colors group-focus-within:text-blue-600">
                    Nom d'utilisateur
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FontAwesomeIcon icon={faUser} className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      type="text"
                      className="w-full pl-12 pr-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white transition-all duration-300 placeholder-gray-400"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Entrez votre identifiant"
                      required
                    />
                  </div>
                </div>

                {/* Password avec animation */}
                <div className="group">
                  <label className="block mb-2 font-semibold text-gray-700 transition-colors group-focus-within:text-blue-600">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FontAwesomeIcon icon={faLock} className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="w-full pl-12 pr-12 py-3 bg-gray-50/80 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white transition-all duration-300 placeholder-gray-400"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Entrez votre mot de passe"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-blue-600 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                    </button>
                  </div>
                </div>
                
                {/* Bouton de connexion avec animation */}
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  disabled={isLoading}
                >
                  <div className="flex items-center justify-center space-x-2">
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Connexion en cours...</span>
                      </>
                    ) : (
                      <>
                        <span>Se connecter</span>
                      </>
                    )}
                  </div>
                </button>

                {/* Lien vers inscription */}
                <div className="text-center pt-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500">ou</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="mt-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 font-medium transition-all duration-300 transform hover:scale-105"
                    onClick={() => setShowRegister(true)}
                  >
                    <FontAwesomeIcon icon={faUserPlus} className="mr-2 text-emerald-500" />
                    Pas de compte ? Rejoignez-nous ! 
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const Register = ({ setShowRegister }) => {
  const [form, setForm] = useState({ username: '', email: '', password: '', specialite: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // 🔍 DEBUG: Afficher les données du formulaire avant traitement
    console.log('🔍 Frontend - Form data before processing:', form);
    console.log('🔍 Frontend - Specialty value:', form.specialite);
    console.log('🔍 Frontend - Specialty type:', typeof form.specialite);

    // Préparer les données d'inscription
    const registrationData = {
      username: form.username,
      email: form.email,
      password: form.password,
      specialite: form.specialite // Envoyer directement la spécialité telle quelle
    };

    // 🔍 DEBUG: Afficher les données qui vont être envoyées
    console.log('🔍 Frontend - Registration data to be sent:', registrationData);
    console.log('🔍 Frontend - Specialty being sent:', registrationData.specialite);

    try {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      });

      // 🔍 DEBUG: Afficher la réponse du serveur
      console.log('🔍 Frontend - Server response status:', response.status);
      console.log('🔍 Frontend - Server response headers:', response.headers);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('🔍 Frontend - Error response:', errorData);
        setError(errorData.message || "Erreur lors de l'inscription !");
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      console.log('🔍 Frontend - Success response:', data);

      // 🔍 DEBUG: Afficher les données utilisateur reçues
      console.log('🔍 Frontend - User data received:', data.user);
      console.log('🔍 Frontend - Specialty stored in DB:', data.user.specialite);

      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.user.role);
      navigate('/dashboard');
    } catch (error) {
      console.error('🔍 Frontend - Network error:', error);
      setError("Erreur de connexion au serveur !");
    }
    setIsLoading(false);
  };

  return (
    <>
      {error && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 relative shadow-sm animate-shake">
          <div className="flex items-center">
            <span className="text-red-500 mr-2">⚠️</span>
            {error}
          </div>
          <button 
            onClick={() => setError('')} 
            className="absolute right-3 top-3 text-red-400 hover:text-red-600 transition-colors"
          >
            ×
          </button>
        </div>
      )}
      
      <form onSubmit={handleRegister} className="space-y-6">
        {/* Username */}
        <div className="group">
          <label className="block mb-2 font-semibold text-gray-700 transition-colors group-focus-within:text-emerald-600">
            Nom d'utilisateur
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faUser} className="text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
            </div>
            <input
              type="text"
              className="w-full pl-12 pr-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:bg-white transition-all duration-300 placeholder-gray-400"
              name="username"
              placeholder="Choisissez un nom d'utilisateur"
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Email */}
        <div className="group">
          <label className="block mb-2 font-semibold text-gray-700 transition-colors group-focus-within:text-emerald-600">
            Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faEnvelope} className="text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
            </div>
            <input
              type="email"
              className="w-full pl-12 pr-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:bg-white transition-all duration-300 placeholder-gray-400"
              name="email"
              placeholder="Entrez votre email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className="group">
          <label className="block mb-2 font-semibold text-gray-700 transition-colors group-focus-within:text-emerald-600">
            Mot de passe
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faLock} className="text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              className="w-full pl-12 pr-12 py-3 bg-gray-50/80 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:bg-white transition-all duration-300 placeholder-gray-400"
              name="password"
              placeholder="Minimum 6 caractères"
              value={form.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-emerald-600 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
            </button>
          </div>
        </div>

        {/* Spécialité */}
        <div className="group">
          <label className="block mb-2 font-semibold text-gray-700 transition-colors group-focus-within:text-emerald-600">
            Spécialité (optionnel)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faUserMd} className="text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
            </div>
            <input
              type="text"
              className="w-full pl-12 pr-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:bg-white transition-all duration-300 placeholder-gray-400"
              name="specialite"
              placeholder="Ex: Cardiologie, Pédiatrie, etc. (laissez vide si patient)"
              value={form.specialite}
              onChange={handleChange}
            />
          </div>
          {/* <p className="text-xs text-gray-500 mt-1">
            💡 Si vous spécifiez une spécialité, vous serez enregistré comme médecin. Sinon, comme patient.
          </p> */}
        </div>

        {/* Bouton d'inscription */}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          disabled={isLoading}
        >
          <div className="flex items-center justify-center space-x-2">
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Création du compte...</span>
              </>
            ) : (
              <>
                <span> Créer mon compte</span>
              </>
            )}
          </div>
        </button>

        {/* Lien vers connexion */}
        <div className="text-center pt-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">ou</span>
            </div>
          </div>
          <button
            type="button"
            className="mt-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 font-medium transition-all duration-300 transform hover:scale-105"
            onClick={() => setShowRegister(false)}
          >
            <FontAwesomeIcon icon={faUser} className="mr-2 text-blue-500" />
            Déjà inscrit ? Connectez-vous ! 
          </button>
        </div>
      </form>
    </>
  );
};

export default Auth;