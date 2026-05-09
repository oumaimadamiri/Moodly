import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const theme = {
  primary: '#a855f7',
  secondary: '#ec4899',
  dark: '#0f172a',
  darkLight: '#1e293b',
  white: '#ffffff',
  gray: '#94a3b8',
  danger: '#ef4444',
};

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Tentative de connexion avec:', formData.username);
      
      const result = await login({
        username: formData.username,
        password: formData.password
      });

      if (result.success) {
        console.log('✅ Connexion réussie ! 🎉');
        setFormData({ username: '', password: '' });
        navigate('/', { replace: true });
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Erreur inattendue:', error);
      setError('Une erreur inattendue est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterRedirect = () => {
    navigate('/register');
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
          
          {/* Logo Section avec logo à côté du nom */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              {/* Logo de l'application */}
              <img 
                src="/src/assets/moodly-logo.svg"
                alt="Moodly" 
                className="w-12 h-12"
                onError={(e) => {
                  // Fallback si le logo n'est pas trouvé
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
              Bienvenue ! Connectez-vous pour continuer
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                <div className="flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Username Input */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-800">
                Nom d'utilisateur
              </label>
              <div className="relative">
                
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 bg-gray-50 focus:border-purple-500 focus:ring-4 focus:ring-purple-200 outline-none transition-all"
                  placeholder="Entrez votre nom d'utilisateur"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-800">
                Mot de passe
              </label>
              <div className="relative">
              
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 bg-gray-50 focus:border-pink-500 focus:ring-4 focus:ring-pink-200 outline-none transition-all"
                  placeholder="Entrez votre mot de passe"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !formData.username || !formData.password}
              className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <>
                  <span>Se connecter</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </>
              )}
            </button>
          </form>

          {/* Section d'inscription */}
          <div className="mt-8 space-y-4">
            <div className="text-center">
              <p className="text-gray-600 mb-2">
                Vous n'avez pas de compte ? 
              </p>
              <button 
                onClick={handleRegisterRedirect}
                className="font-bold text-transparent bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text hover:from-purple-600 hover:to-pink-600 transition-all inline-flex items-center gap-1 text-lg"
              >
                Créer un compte
                
              </button>
            </div>

          
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;