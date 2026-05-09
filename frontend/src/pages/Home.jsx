import React, { useState, useEffect, useRef } from 'react';
import PostCard from '../components/PostCard';
import theme from '../styles/theme';
import { postsAPI, usersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Filter, RefreshCw, Server, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EMOTIONS = [
  { id: 'all', label: 'Toutes les émotions', icon: '🌎', color: '#374151' },
  { id: 'happy', label: 'Heureux', icon: '😊', color: '#FBBF24' },
  { id: 'sad', label: 'Triste', icon: '😢', color: '#60A5FA' },
  { id: 'inspired', label: 'Inspiré', icon: '💡', color: theme.secondary },
  { id: 'motivated', label: 'Motivé', icon: '🚀', color: '#34D399' },
];

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmotion, setSelectedEmotion] = useState('all');
  const [showEmotionFilter, setShowEmotionFilter] = useState(false);
  const [followingUsers, setFollowingUsers] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const filterRef = useRef(null);

  // Charger toutes les données au montage
  useEffect(() => {
    loadAllData();
  }, []);

  // Appliquer le filtre quand l'émotion ou les posts changent
  useEffect(() => {
    applyEmotionFilter();
  }, [selectedEmotion, posts]);

  // Fermer le filtre quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowEmotionFilter(false);
      }
    };

    if (showEmotionFilter) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmotionFilter]);

  // Fonction principale pour charger toutes les données
  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. D'abord récupérer les utilisateurs suivis
      const followingData = await fetchFollowingUsers();
      console.log('👥 Utilisateurs suivis récupérés:', followingData);
      
      // 2. Ensuite récupérer et filtrer les posts
      await fetchAndFilterPosts(followingData);
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données:', error);
      setError('Erreur de chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Récupérer la liste des utilisateurs suivis
  const fetchFollowingUsers = async () => {
    try {
      if (user?.username) {
        const response = await usersAPI.getFollowing(user.username);
        const followingData = response.data || [];
        setFollowingUsers(followingData);
        console.log('👥 Utilisateurs suivis définis:', followingData.map(u => u.username));
        return followingData;
      } else {
        console.log('❌ Aucun utilisateur connecté');
        setFollowingUsers([]);
        return [];
      }
    } catch (error) {
      console.error('❌ Erreur fetchFollowingUsers:', error);
      setFollowingUsers([]);
      return [];
    }
  };

  // Récupérer et filtrer les posts avec la liste des utilisateurs suivis
  const fetchAndFilterPosts = async (followingData = followingUsers) => {
    try {
      const response = await postsAPI.getAll();
      console.log('📝 Tous les posts reçus:', response.data);
      
      let postsData = [];
      if (response.data && response.data.results) {
        postsData = response.data.results;
      } else if (Array.isArray(response.data)) {
        postsData = response.data;
      }
      
      // FILTRE 1: Ne garder que les posts avec des auteurs valides
      const validPosts = postsData.filter(post => 
        post.author && 
        post.author.username && 
        post.author.id
      );
      
      console.log('✅ Posts avec auteurs valides:', validPosts.length);
      
      // FILTRE 2: Ne garder que les posts des utilisateurs suivis + VOS PROPRES POSTS
      const followingUsernames = followingData.map(user => user.username);
      // Ajouter votre propre nom d'utilisateur à la liste
      if (user?.username) {
        followingUsernames.push(user.username);
      }
      
      console.log('🔍 Filtrage avec utilisateurs suivis + vous-même:', followingUsernames);
      
      const followingPosts = validPosts.filter(post => {
        const isFromFollowedUser = post.author && followingUsernames.includes(post.author.username);
        return isFromFollowedUser;
      });

      console.log('✅ Posts des utilisateurs suivis + vous-même:', followingPosts.length);
      console.log('📋 Détail des posts:', followingPosts.map(p => ({
        id: p.id,
        author: p.author.username,
        isMyPost: p.author.username === user?.username,
        content: p.content.substring(0, 50) + '...'
      })));
      
      // Trier les posts par date (les plus récents en premier)
      const sortedPosts = followingPosts.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      
      setPosts(sortedPosts);
      
    } catch (error) {
      console.error('❌ Erreur fetchAndFilterPosts:', error);
      setError('Erreur de chargement des posts');
      setPosts([]);
    }
  };

  // Appliquer le filtre d'émotion
  const applyEmotionFilter = () => {
    if (selectedEmotion === 'all') {
      setFilteredPosts(posts);
    } else {
      const emotionPosts = posts.filter(post => post.emotion === selectedEmotion);
      setFilteredPosts(emotionPosts);
    }
    console.log('🎭 Filtre émotion appliqué:', selectedEmotion, '->', filteredPosts.length, 'posts');
  };

  const handlePostUpdate = (updatedPost) => {
    console.log('✏️ Post mis à jour:', updatedPost);
    setPosts(posts.map(post => 
      post.id === updatedPost.id ? updatedPost : post
    ));
  };

  const handlePostDelete = (deletedPostId) => {
    console.log('🗑️ Post supprimé:', deletedPostId);
    setPosts(posts.filter(post => post.id !== deletedPostId));
  };

  const handleUsernameClick = (username) => {
    if (username) {
      navigate(`/profile/${username}`);
    }
  };

  const getCurrentEmotion = () => {
    return EMOTIONS.find(e => e.id === selectedEmotion) || EMOTIONS[0];
  };

  // Fonction pour recharger toutes les données
  const refreshAllData = async () => {
    await loadAllData();
  };

  return (
    <div style={{ 
      width: '100%', 
      minHeight: '100vh', 
      backgroundColor: theme.background,
    }}>
      {/* Conteneur principal avec largeur fixe */}
      <div style={{
        margin: '0 auto',
        width: '100%',
        maxWidth: '600px',
        minHeight: '100vh',
        backgroundColor: theme.background,
      }}>
        {/* En-tête FIXE - sans sticky */}
        <div style={{ 
          padding: '16px',
          borderBottom: `1px solid ${theme.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: theme.background,
          width: '100%',
        }}>
          <h2 style={{ 
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#000000',
            margin: 0
          }}>
            Fil d'actualité
          </h2>
          
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            {/* Filtre par émotion */}
            <div ref={filterRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowEmotionFilter(!showEmotionFilter)}
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  backgroundColor: theme.surface,
                  border: `1px solid ${theme.border}`,
                  color: '#000000',
                  fontWeight: '500',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                <Filter size={18} />
                <span style={{ fontSize: '1.125rem' }}>{getCurrentEmotion().icon}</span>
                <span>{getCurrentEmotion().label}</span>
              </button>

              {/* Menu déroulant */}
              {showEmotionFilter && (
                <div style={{ 
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: '8px',
                  padding: '8px',
                  borderRadius: '12px',
                  zIndex: 1000,
                  minWidth: '220px',
                  backgroundColor: '#ffffff',
                  border: `2px solid ${theme.primary}`,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                }}>
                  {EMOTIONS.map((emotion) => (
                    <button
                      key={emotion.id}
                      onClick={() => {
                        setSelectedEmotion(emotion.id);
                        setShowEmotionFilter(false);
                      }}
                      style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        width: '100%',
                        padding: '12px 16px',
                        textAlign: 'left',
                        color: selectedEmotion === emotion.id ? theme.primary : '#000000',
                        backgroundColor: selectedEmotion === emotion.id ? `${theme.primary}15` : 'transparent',
                        fontWeight: selectedEmotion === emotion.id ? '600' : 'normal',
                        border: 'none',
                        fontSize: '14px',
                        cursor: 'pointer',
                        borderRadius: '8px'
                      }}
                    >
                      <span style={{ fontSize: '1.25rem' }}>{emotion.icon}</span>
                      <span>{emotion.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bouton actualiser */}
            <button
              onClick={refreshAllData}
              disabled={loading}
              style={{ 
                padding: '10px',
                borderRadius: '12px',
                backgroundColor: theme.surface,
                border: `1px solid ${theme.border}`,
                color: theme.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
              title="Actualiser"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div style={{
          padding: '16px',
          paddingTop: '0',
        }}>
          {/* Indicateur de filtre actif */}
          {selectedEmotion !== 'all' && (
            <div style={{ 
              margin: '16px 0',
              padding: '12px 16px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: `${getCurrentEmotion().color}15`,
              border: `1px solid ${getCurrentEmotion().color}30`
            }}>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '1.25rem' }}>{getCurrentEmotion().icon}</span>
                <span style={{ 
                  fontWeight: '500',
                  color: '#000000',
                  fontSize: '14px'
                }}>
                  Filtre actif : {getCurrentEmotion().label}
                </span>
              </div>
              <button
                onClick={() => setSelectedEmotion('all')}
                style={{ 
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  backgroundColor: getCurrentEmotion().color,
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Tout voir
              </button>
            </div>
          )}

          {/* Message d'erreur */}
          {error && (
            <div style={{ 
              margin: '16px 0',
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: '#FEE2E2',
              border: '1px solid #FECACA'
            }}>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <Server size={20} style={{ color: '#DC2626' }} />
                <div style={{ flex: 1 }}>
                  <p style={{ 
                    fontWeight: '500',
                    color: '#DC2626',
                    margin: 0,
                    fontSize: '14px'
                  }}>
                    Erreur de chargement
                  </p>
                </div>
                <button
                  onClick={refreshAllData}
                  style={{ 
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    backgroundColor: '#DC2626',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Réessayer
                </button>
              </div>
            </div>
          )}

          {/* Contenu principal */}
          <div>
            {loading ? (
              <div style={{ 
                textAlign: 'center',
                padding: '48px 0'
              }}>
                <div style={{ 
                  display: 'inline-block',
                  width: '32px',
                  height: '32px',
                  border: `3px solid ${theme.primary}20`,
                  borderTop: `3px solid ${theme.primary}`,
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <p style={{ 
                  marginTop: '16px',
                  color: '#374151',
                  fontSize: '14px'
                }}>
                  Chargement des publications...
                </p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div style={{ 
                textAlign: 'center',
                padding: '48px 20px',
                borderRadius: '12px',
                backgroundColor: theme.card,
                border: `1px solid ${theme.border}`,
                marginTop: '20px'
              }}>
                <div style={{ 
                  fontSize: '3rem',
                  marginBottom: '16px',
                  opacity: 0.5
                }}>📝</div>
                <p style={{ 
                  fontSize: '1.125rem',
                  color: '#000000',
                  fontWeight: '500',
                  margin: '0 0 8px 0'
                }}>
                  {selectedEmotion !== 'all' 
                    ? 'Aucune publication avec cette émotion' 
                    : 'Aucune publication pour le moment'
                  }
                </p>
                <p style={{ 
                  color: '#6b7280',
                  margin: 0,
                  fontSize: '14px'
                }}>
                  {selectedEmotion !== 'all' 
                    ? 'Aucune publication avec cette émotion parmi vos posts et ceux des utilisateurs que vous suivez'
                    : 'Vous et les utilisateurs que vous suivez n\'avez pas encore publié'
                  }
                </p>
              </div>
            ) : (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '16px'
              }}>
                {filteredPosts.map(post => (
                  <PostCard 
                    key={post.id} 
                    post={post}
                    onUpdate={handlePostUpdate}
                    onDelete={handlePostDelete}
                    onUsernameClick={handleUsernameClick}
                    showOwnership={true}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Animation CSS */}
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default Home;