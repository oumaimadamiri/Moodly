import React, { useState, useEffect } from 'react';
import { Users, RefreshCw, Plus, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI, authAPI } from '../services/api';

const AccountManager = () => {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();
  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [accountLoading, setAccountLoading] = useState(null);

  useEffect(() => {
    fetchLinkedAccounts();
  }, [user]);

  const fetchLinkedAccounts = async () => {
    try {
      const response = await usersAPI.getLinkedAccounts();
      setLinkedAccounts(response.data);
    } catch (error) {
      console.error('Error fetching linked accounts:', error);
    }
  };

  const switchAccount = async (targetUser) => {
    setLoading(true);
    setAccountLoading(targetUser.username);
    try {
      const response = await usersAPI.switchAccount(targetUser.username);
      
      if (response.data) {
        const { user: newUserData, tokens: newTokens } = response.data;
        
        setUser(newUserData);
        localStorage.setItem('access_token', newTokens.access);
        localStorage.setItem('refresh_token', newTokens.refresh);
        localStorage.setItem('user', JSON.stringify(newUserData));
        
        window.location.reload();
      }
    } catch (error) {
      console.error('Error switching account:', error);
      alert('Erreur lors du changement de compte');
    } finally {
      setLoading(false);
      setAccountLoading(null);
    }
  };

  const handleAddAccount = async () => {
    try {
      // Option 1: Déconnexion simple
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      setUser(null);
      
      // Redirection vers register
      navigate('/register');
      
    } catch (error) {
      console.error('Error during logout:', error);
      // Fallback: redirection simple
      navigate('/register');
    }
  };

  const handleAddAccountWithoutLogout = () => {
    // Option 2: Redirection directe avec paramètre
    navigate('/register?action=add_account');
  };

  if (linkedAccounts.length === 0) {
    return null;
  }

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.9)',
      padding: '20px',
      borderRadius: '12px',
      marginBottom: '20px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <h3 style={{ 
          fontSize: '18px',
          fontWeight: '600',
          color: '#1f2937',
          margin: 0
        }}>
          Vos comptes
        </h3>
        <Users size={20} color="#8b5cf6" />
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Compte actuel */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px',
          borderRadius: '8px',
          background: 'rgba(139, 92, 246, 0.1)',
          border: '1px solid #c4b5fd'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#ffffff',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)'
          }}>
            {user.username?.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#1f2937',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {user.username}
            </p>
            <p style={{
              fontSize: '12px',
              color: '#6b7280',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              Actuel
            </p>
          </div>
        </div>

        {/* Autres comptes */}
        {linkedAccounts.map((account) => (
          <div
            key={account.id}
            onClick={() => !loading && switchAccount(account)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              border: '1px solid #e5e7eb',
              opacity: loading ? 0.5 : 1,
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#ffffff',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
              transition: 'transform 0.2s ease'
            }}>
              {account.username?.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#1f2937',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {account.username}
              </p>
              <p style={{
                fontSize: '12px',
                color: '#6b7280',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {account.account_name || 'Compte personnel'}
              </p>
            </div>
            <RefreshCw 
              size={16} 
              color="#8b5cf6"
            />
          </div>
        ))}
      </div>

      {/* Bouton Ajouter un compte */}
      <button
        onClick={handleAddAccount}
        style={{
          width: '100%',
          marginTop: '16px',
          padding: '12px',
          borderRadius: '8px',
          fontWeight: '500',
          fontSize: '14px',
          transition: 'all 0.2s ease',
          background: 'transparent',
          color: '#8b5cf6',
          border: '1px solid #c4b5fd',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <Plus size={16} />
        Ajouter un compte
      </button>
    </div>
  );
};

export default AccountManager;