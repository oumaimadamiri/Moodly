import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Messages from './pages/Messages';
import Explore from './pages/Explore';
import VerifyEmail from './pages/VerifyEmail';
import FollowRequestsPage from './pages/FollowRequestsPage';
import AccountManager from './components/AccountManager';
import CreatePost from './components/CreatePost'; // Importez CreatePost

// Composant de route protégée
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#1a1a1a',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #333',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px auto'
          }} />
          Chargement...
        </div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Composant de route publique (redirige si déjà connecté)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#1a1a1a',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #333',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px auto'
          }} />
          Chargement...
        </div>
      </div>
    );
  }
  
  return !isAuthenticated ? children : <Navigate to="/" />;
};

// Composant pour les routes non trouvées
const NotFound = () => {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '20px',
      textAlign: 'center',
      color: 'white'
    }}>
      <h2 style={{ color: '#ef4444', marginBottom: '16px' }}>
        404 - Page non trouvée
      </h2>
      <p style={{ marginBottom: '20px', color: '#6b7280' }}>
        La page que vous recherchez n'existe pas.
      </p>
      <button 
        onClick={() => window.history.back()}
        style={{
          padding: '10px 20px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        Retour
      </button>
    </div>
  );
};

// Page dédiée pour la gestion des comptes
const AccountsPage = () => {
  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '0 auto', 
      padding: '20px' 
    }}>
      <h1 style={{ 
        fontSize: '28px', 
        fontWeight: 'bold', 
        marginBottom: '20px',
        color: '#1f2937'
      }}>
        Gestion des comptes
      </h1>
      <p style={{ 
        color: '#6b7280', 
        marginBottom: '30px',
        lineHeight: '1.5'
      }}>
        Gérez vos différents comptes et basculez facilement entre eux.
      </p>
      <AccountManager />
    </div>
  );
};

// Composant Modal pour la création de post
const CreatePostModal = ({ isOpen, onClose, onPostCreated }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: 0
          }}>
            Créer une publication
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#6b7280',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: '20px' }}>
          <CreatePost 
            onPostCreated={(newPost) => {
              onPostCreated(newPost);
              onClose();
            }} 
          />
        </div>
      </div>
    </div>
  );
};

// Composant principal App avec état pour le modal
function App() {
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [refreshPosts, setRefreshPosts] = useState(false);

  const handleCreatePost = () => {
    setShowCreatePostModal(true);
  };

  const handlePostCreated = (newPost) => {
    console.log('Nouveau post créé:', newPost);
    setRefreshPosts(prev => !prev); // Déclencher le rafraîchissement des posts
  };

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          {/* Modal de création de post */}
          <CreatePostModal
            isOpen={showCreatePostModal}
            onClose={() => setShowCreatePostModal(false)}
            onPostCreated={handlePostCreated}
          />

          <Routes>
            {/* Routes publiques */}
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } />
            
            {/* Route Explore accessible à tous */}
            <Route path="/explore" element={
              <Layout onCreatePost={handleCreatePost}>
                <Explore />
              </Layout>
            } />

            <Route path="/verify-email" element={
              <PublicRoute>
                <VerifyEmail />
              </PublicRoute>
            } />

            {/* Routes protégées avec Layout */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout onCreatePost={handleCreatePost}>
                  <Home refreshPosts={refreshPosts} />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Route pour le profil avec username en paramètre */}
            <Route path="/profile/:username" element={
              <ProtectedRoute>
                <Layout onCreatePost={handleCreatePost}>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Route pour le profil de l'utilisateur connecté (sans paramètre) */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout onCreatePost={handleCreatePost}>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/notifications" element={
              <ProtectedRoute>
                <Layout onCreatePost={handleCreatePost}>
                  <Notifications />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/messages" element={
              <ProtectedRoute>
                <Layout onCreatePost={handleCreatePost}>
                  <Messages />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Nouvelle route pour la gestion des comptes */}
            <Route path="/accounts" element={
              <ProtectedRoute>
                <Layout onCreatePost={handleCreatePost}>
                  <AccountsPage />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Route pour les demandes de suivi */}
            <Route path="/follow-requests" element={
              <ProtectedRoute>
                <Layout onCreatePost={handleCreatePost}>
                  <FollowRequestsPage />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Redirections par défaut */}
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="/manage-accounts" element={<Navigate to="/accounts" replace />} />
            
            {/* Route pour les pages non trouvées */}
            <Route path="*" element={
              <Layout onCreatePost={handleCreatePost}>
                <NotFound />
              </Layout>
            } />
          </Routes>

          {/* Style pour l'animation de spin */}
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;