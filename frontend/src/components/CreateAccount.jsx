import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import theme from '../styles/theme';

const CreateAccount = () => {
  const [formData, setFormData] = useState({
    username: '',
    account_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await usersAPI.createLinkedAccount(formData);
      
      setSuccess(`Compte ${formData.username} créé avec succès !`);
      setFormData({ username: '', account_name: '' });
      
      // Rediriger après un délai
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (error) {
      setError(error.response?.data?.error || 'Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: theme.background }}>
      <div className="w-full max-w-md p-8 rounded-2xl glass-card">
        <h2 className="text-2xl font-bold text-center mb-6" style={{ color: theme.text.primary }}>
          Créer un nouveau compte
        </h2>
        
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm text-red-600 bg-red-50 border border-red-200">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 rounded-lg text-sm text-green-600 bg-green-50 border border-green-200">
              {success}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: theme.text.primary }}>
              Nom d'utilisateur
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border outline-none transition-all duration-200"
              style={{ 
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.text.primary
              }}
              placeholder="Choisissez un nom d'utilisateur"
              required
              disabled={loading}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2" style={{ color: theme.text.primary }}>
              Nom du compte (optionnel)
            </label>
            <input
              type="text"
              value={formData.account_name}
              onChange={(e) => setFormData({...formData, account_name: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border outline-none transition-all duration-200"
              style={{ 
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.text.primary
              }}
              placeholder="Ex: Compte professionnel, Personnel..."
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-white transition-all duration-200 disabled:opacity-50"
            style={{ backgroundColor: theme.primary }}
          >
            {loading ? 'Création...' : 'Créer le compte'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateAccount;