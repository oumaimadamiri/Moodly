import React, { useState } from 'react';
import { usersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const DeleteAccount = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { logout, currentUser } = useAuth();

  const handleOpen = () => {
    setIsOpen(true);
    setError('');
  };

  const handleClose = () => {
    setIsOpen(false);
    setPassword('');
    setConfirmation('');
    setError('');
  };

  const handleDelete = async () => {
    // Validation plus stricte
    if (confirmation.toLowerCase().trim() !== "supprimer mon compte") {
      setError("Veuillez taper exactement 'supprimer mon compte' pour confirmer");
      return;
    }

    if (!password) {
      setError("Veuillez entrer votre mot de passe");
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Appel API pour suppression définitive
      const result = await usersAPI.deleteAccount({
        password,
        confirmation: confirmation.toLowerCase().trim(),
        userId: currentUser?.id // Inclure l'ID utilisateur si nécessaire
      });
      
      if (result.data.success || result.data.message) {
        // Déconnexion et redirection
        await logout();
        // Optionnel: Afficher un message de confirmation
        alert('Votre compte a été supprimé définitivement avec tous vos posts.');
        window.location.href = '/';
      }
    } catch (err) {
      console.error('Erreur suppression compte:', err);
      
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.response?.status === 401) {
        setError('Mot de passe incorrect');
      } else if (err.response?.status === 500) {
        setError('Erreur serveur. Veuillez réessayer plus tard.');
      } else {
        setError('Erreur lors de la suppression du compte. Vérifiez votre mot de passe.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Styles intégrés améliorés
  const styles = {
    deleteAccountSection: {
      background: '#fff',
      borderRadius: '8px',
      padding: '20px',
      margin: '20px 0',
      border: '1px solid #e1e8ed',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    deleteAccountModal: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    modalContent: {
      background: 'white',
      borderRadius: '12px',
      width: '90%',
      maxWidth: '500px',
      maxHeight: '90vh',
      overflowY: 'auto',
      boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px',
      borderBottom: '1px solid #e1e8ed',
      background: '#fff5f5',
      borderTopLeftRadius: '12px',
      borderTopRightRadius: '12px',
    },
    closeBtn: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: '#657786',
      padding: '5px',
      borderRadius: '4px',
    },
    modalBody: {
      padding: '20px',
    },
    warningMessage: {
      background: '#fff5f5',
      border: '1px solid #fed7d7',
      borderRadius: '8px',
      padding: '15px',
      marginBottom: '20px',
    },
    formGroup: {
      marginBottom: '20px',
    },
    formLabel: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: '600',
      color: '#2c3e50',
    },
    formInput: {
      width: '100%',
      padding: '12px',
      border: '1px solid #ddd',
      borderRadius: '6px',
      fontSize: '14px',
      boxSizing: 'border-box',
      transition: 'border-color 0.2s',
    },
    formInputFocus: {
      outline: 'none',
      borderColor: '#e74c3c',
    },
    actionButtons: {
      display: 'flex',
      gap: '10px',
      justifyContent: 'flex-end',
      marginTop: '25px',
      paddingTop: '15px',
      borderTop: '1px solid #e1e8ed',
    },
    btn: {
      padding: '12px 24px',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'all 0.2s',
      minWidth: '120px',
    },
    btnSecondary: {
      background: '#6c757d',
      color: 'white',
    },
    btnDanger: {
      background: '#e74c3c',
      color: 'white',
    },
    alertError: {
      background: '#fed7d7',
      color: '#c53030',
      border: '1px solid #feb2b2',
      padding: '12px',
      borderRadius: '6px',
      marginBottom: '15px',
      fontSize: '14px',
    },
    deleteButton: {
      background: '#e74c3c',
      color: 'white',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'background-color 0.2s',
    },
  };

  // Rendu initial (bouton de suppression)
  if (!isOpen) {
    return (
      <div style={styles.deleteAccountSection}>
        <h3 style={{ margin: '0 0 10px 0', color: '#e74c3c' }}>Supprimer le compte définitivement</h3>
        <p style={{ margin: '0 0 15px 0', color: '#657786', lineHeight: '1.5' }}>
          Cette action supprimera définitivement votre compte, tous vos posts, commentaires et données.
          Cette opération est irréversible.
        </p>
        <button 
          style={styles.deleteButton}
          onClick={handleOpen}
          onMouseOver={(e) => e.target.style.background = '#c0392b'}
          onMouseOut={(e) => e.target.style.background = '#e74c3c'}
        >
          Supprimer mon compte définitivement
        </button>
      </div>
    );
  }

  // Rendu de la modal de confirmation
  return (
    <div style={styles.deleteAccountModal}>
      <div style={styles.modalContent}>
        <div style={styles.modalHeader}>
          <h3 style={{ margin: 0, color: '#e74c3c' }}>Confirmer la suppression définitive</h3>
          <button 
            style={styles.closeBtn} 
            onClick={handleClose}
            onMouseOver={(e) => e.target.style.color = '#e74c3c'}
            onMouseOut={(e) => e.target.style.color = '#657786'}
          >
            ×
          </button>
        </div>

        <div style={styles.modalBody}>
          {error && <div style={styles.alertError}>{error}</div>}

          <div style={styles.warningMessage}>
            <strong style={{ color: '#c53030', display: 'block', marginBottom: '10px' }}>
              ⚠️ Attention: Cette action est irréversible!
            </strong>
            <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px', lineHeight: '1.6' }}>
              <li style={{ color: '#742a2a', marginBottom: '8px' }}>🗑️ Tous vos posts seront définitivement supprimés</li>
              <li style={{ color: '#742a2a', marginBottom: '8px' }}>💬 Tous vos commentaires seront définitivement supprimés</li>
              <li style={{ color: '#742a2a', marginBottom: '8px' }}>🤝 Toutes vos interactions seront supprimées</li>
              <li style={{ color: '#742a2a', marginBottom: '8px' }}>👤 Votre profil sera définitivement effacé</li>
              <li style={{ color: '#742a2a', marginBottom: '8px' }}>🚫 Cette action ne peut pas être annulée</li>
            </ul>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>
              Mot de passe actuel
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Entrez votre mot de passe pour confirmer"
              style={styles.formInput}
              onFocus={(e) => e.target.style.borderColor = '#e74c3c'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
              disabled={isLoading}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>
              Confirmation de suppression
            </label>
            <input
              type="text"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder='Tapez "supprimer mon compte"'
              style={styles.formInput}
              onFocus={(e) => e.target.style.borderColor = '#e74c3c'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
              disabled={isLoading}
            />
            <small style={{ color: '#657786', fontSize: '12px', marginTop: '5px', display: 'block' }}>
              Tapez exactement <strong>"supprimer mon compte"</strong> pour confirmer
            </small>
          </div>

          <div style={styles.actionButtons}>
            <button 
              style={{ 
                ...styles.btn, 
                ...styles.btnSecondary,
                opacity: isLoading ? 0.6 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
              onClick={handleClose}
              disabled={isLoading}
            >
              Annuler
            </button>
            <button 
              style={{ 
                ...styles.btn, 
                ...styles.btnDanger,
                opacity: (isLoading || !password || confirmation.toLowerCase().trim() !== "supprimer mon compte") ? 0.6 : 1,
                cursor: (isLoading || !password || confirmation.toLowerCase().trim() !== "supprimer mon compte") ? 'not-allowed' : 'pointer'
              }}
              onClick={handleDelete}
              disabled={isLoading || !password || confirmation.toLowerCase().trim() !== "supprimer mon compte"}
            >
              {isLoading ? 'Suppression en cours...' : 'Supprimer définitivement'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccount;