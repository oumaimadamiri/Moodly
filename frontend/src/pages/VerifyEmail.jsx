import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const VerifyEmail = () => {
  const [formData, setFormData] = useState({
    token: '',
    temporary_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();
  const { setUser, setTokens } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await authAPI.verifyEmail(formData);

      if (response.data) {
        const { user: userData, tokens: authTokens } = response.data;
        
        console.log('✅ Verification successful - User:', userData);
        console.log('✅ Verification successful - Tokens:', authTokens);
        
        localStorage.setItem('access_token', authTokens.access);
        localStorage.setItem('refresh_token', authTokens.refresh);
        
        if (setTokens) {
          setTokens(authTokens);
        }
        
        if (setUser && userData) {
          setUser(userData);
        }
        
        setSuccess('Compte vérifié avec succès ! Redirection...');
        
        setTimeout(() => {
          navigate('/');
        }, 1500);
      }
    } catch (error) {
      console.error('Verification error:', error);
      const errorMessage = error.response?.data?.error || 
                        error.response?.data?.details || 
                        'Erreur lors de la vérification';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="w-full max-w-md">
        {/* Carte principale */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-transparent bg-clip-padding"
          style={{
            backgroundImage: `linear-gradient(white, white), linear-gradient(135deg, #a855f7, #ec4899)`,
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
              />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                Moodly
              </h1>
            </div>
            <p className="text-base font-medium text-gray-500">
              Vérification de votre compte
            </p>
            <p className="mt-1 text-sm text-gray-400">
              Entrez le token et le mot de passe temporaire reçus par email
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                <div className="flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
                <div className="flex items-center gap-2">
                  <span>✅</span>
                  <span>{success}</span>
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2 text-gray-800">
                Token de vérification
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400">
                  🔑
                </div>
                <input
                  type="text"
                  name="token"
                  value={formData.token}
                  onChange={(e) => setFormData({...formData, token: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 bg-gray-50 focus:border-purple-500 focus:ring-4 focus:ring-purple-200 outline-none transition-all"
                  placeholder="Collez le token reçu par email"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-gray-800">
                Mot de passe temporaire
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400">
                  🔒
                </div>
                <input
                  type="text"
                  name="temporary_password"
                  value={formData.temporary_password}
                  onChange={(e) => setFormData({...formData, temporary_password: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 bg-gray-50 focus:border-pink-500 focus:ring-4 focus:ring-pink-200 outline-none transition-all"
                  placeholder="Entrez le mot de passe temporaire"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Vérification...</span>
                </>
              ) : (
                <>
                  <span>Vérifier mon compte</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Vous n'avez pas reçu l'email ?{' '}
              <button 
                className="font-bold text-transparent bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text hover:from-purple-600 hover:to-pink-600 transition-all"
                onClick={() => navigate('/login')}
              >
                Contactez le support
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;