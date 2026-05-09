import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const theme = {
  primary: '#a855f7',
  secondary: '#ec4899',
  dark: '#0f172a',
  darkLight: '#1e293b',
  white: '#ffffff',
  gray: '#94a3b8',
  danger: '#ef4444',
  success: '#10b981',
};

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // Validation des données avant envoi
  const validateForm = () => {
    if (!formData.username || !formData.email || !formData.password || !formData.first_name || !formData.last_name) {
      return 'Tous les champs obligatoires doivent être remplis';
    }

    if (formData.password.length < 8) {
      return 'Le mot de passe doit contenir au moins 8 caractères';
    }

    if (formData.password !== formData.password2) {
      return 'Les mots de passe ne correspondent pas';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return 'Format d\'email invalide';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSuccess(false);

    // Validation côté client d'abord
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      console.log('Tentative d\'inscription avec:', {
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name
      });

      // Préparer les données pour l'API
      const apiData = {
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        password2: formData.password2,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim()
      };

      const response = await authAPI.register(apiData);
      
      console.log('✅ Inscription réussie:', response);
      
      // SUCCÈS : Afficher message et rediriger vers verify-email
      setSuccess(true);
      
      // Rediriger vers la page de vérification après 2 secondes
      setTimeout(() => {
        navigate('/verify-email');
      }, 2000);
      
    } catch (error) {
      console.error('❌ Échec de l\'inscription:', error);
      
      // Gestion détaillée des erreurs
      let errorMessage = 'Erreur lors de l\'inscription';
      
      if (error.response) {
        // Erreur avec réponse du serveur
        const { data, status } = error.response;
        
        console.log('📡 Réponse du serveur:', { status, data });
        
        if (status === 400) {
          // Bad Request - erreurs de validation
          if (typeof data === 'object') {
            // Gérer les erreurs Django REST framework typiques
            if (data.username) {
              errorMessage = `Nom d'utilisateur: ${Array.isArray(data.username) ? data.username[0] : data.username}`;
            } else if (data.email) {
              errorMessage = `Email: ${Array.isArray(data.email) ? data.email[0] : data.email}`;
            } else if (data.password) {
              errorMessage = `Mot de passe: ${Array.isArray(data.password) ? data.password[0] : data.password}`;
            } else if (data.non_field_errors) {
              errorMessage = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
            } else if (data.error) {
              errorMessage = data.error;
            } else {
              // Afficher la première erreur trouvée
              const firstError = Object.values(data)[0];
              errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
            }
          } else {
            errorMessage = 'Données invalides envoyées au serveur';
          }
        } else if (status === 500) {
          errorMessage = 'Erreur interne du serveur. Veuillez réessayer plus tard.';
        } else if (status === 409) {
          errorMessage = 'Un compte avec cet email ou nom d\'utilisateur existe déjà';
        }
      } else if (error.request) {
        // Pas de réponse du serveur
        errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion internet.';
      } else {
        // Erreur de configuration
        errorMessage = 'Erreur de configuration de la requête';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  // Fonction pour réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      password2: '',
      first_name: '',
      last_name: ''
    });
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="w-full max-w-md">
        {/* Carte principale */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-transparent bg-clip-padding"
          style={{
            backgroundImage: `linear-gradient(white, white), linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box'
          }}
        >
          
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img 
                src="/src/assets/moodly-logo.svg"
                alt="Moodly" 
                className="w-12 h-12"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallback = document.createElement('div');
                  fallback.className = 'w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg';
                  fallback.textContent = 'M';
                  e.target.parentNode.insertBefore(fallback, e.target);
                }}
              />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                Moodly
              </h1>
            </div>
            <p className="text-base font-medium text-gray-500">
              Créez votre compte pour commencer
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                <div className="flex items-center gap-2">
                  <span>⚠️</span>
                  <div>
                    <p className="font-medium">Erreur d'inscription</p>
                    <p className="mt-1">{error}</p>
                    <button 
                      type="button"
                      onClick={resetForm}
                      className="mt-2 text-sm underline hover:text-red-800"
                    >
                      Réinitialiser le formulaire
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
                <div className="flex items-center gap-2">
                  <span>✅</span>
                  <div>
                    <p className="font-medium">Inscription réussie !</p>
                    <p className="mt-1">
                      Un email de vérification a été envoyé. Redirection vers la page de vérification...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Name Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-800">
                  Prénom *
                </label>
                <div className="relative">
                  
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 bg-gray-50 focus:border-purple-500 focus:ring-4 focus:ring-purple-200 outline-none transition-all"
                    placeholder="Prénom"
                    required
                    disabled={loading || success}
                    minLength={2}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-800">
                  Nom *
                </label>
                <div className="relative">
                  
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 bg-gray-50 focus:border-purple-500 focus:ring-4 focus:ring-purple-200 outline-none transition-all"
                    placeholder="Nom"
                    required
                    disabled={loading || success}
                    minLength={2}
                  />
                </div>
              </div>
            </div>

            {/* Username Input */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-800">
                Nom d'utilisateur *
              </label>
              <div className="relative">
              
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 bg-gray-50 focus:border-purple-500 focus:ring-4 focus:ring-purple-200 outline-none transition-all"
                  placeholder="Choisissez un nom d'utilisateur"
                  required
                  disabled={loading || success}
                  minLength={3}
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-800">
                Email *
              </label>
              <div className="relative">
                
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 bg-gray-50 focus:border-purple-500 focus:ring-4 focus:ring-purple-200 outline-none transition-all"
                  placeholder="entrez@votre.email"
                  required
                  disabled={loading || success}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-800">
                Mot de passe *
              </label>
              <div className="relative">
               
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 bg-gray-50 focus:border-pink-500 focus:ring-4 focus:ring-pink-200 outline-none transition-all"
                  placeholder="Minimum 8 caractères"
                  required
                  disabled={loading || success}
                  minLength={8}
                />
              </div>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-800">
                Confirmer le mot de passe *
              </label>
              <div className="relative">
                
                <input
                  type="password"
                  value={formData.password2}
                  onChange={(e) => setFormData({...formData, password2: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 bg-gray-50 focus:border-pink-500 focus:ring-4 focus:ring-pink-200 outline-none transition-all"
                  placeholder="Retapez votre mot de passe"
                  required
                  disabled={loading || success}
                  minLength={8}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Inscription en cours...</span>
                </>
              ) : (
                <>
                  <span>Créer un compte</span>
                  
                </>
              )}
            </button>
          </form>

          {/* Section de connexion */}
          <div className="mt-8 space-y-4">
            <div className="text-center">
              <p className="text-gray-600 mb-2">
                Vous avez déjà un compte ? 
              </p>
              <button 
                onClick={handleLoginRedirect}
                disabled={loading}
                className="font-bold text-transparent bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text hover:from-purple-600 hover:to-pink-600 transition-all inline-flex items-center gap-1 text-lg disabled:opacity-50"
              >
                Se connecter
                
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;