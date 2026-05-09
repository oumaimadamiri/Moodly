import React, { useState, useEffect, useRef } from 'react';
import { Plus, Eye, MessageCircle, Heart, X, Play, Pause, ChevronLeft, ChevronRight, Sparkles, Trash2, Users } from 'lucide-react';
import { storiesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const REACTIONS = [
  { emoji: '❤️', type: 'love', label: 'Love', color: '#ef4444' },
  { emoji: '😂', type: 'laugh', label: 'Laugh', color: '#f59e0b' },
  { emoji: '😮', type: 'wow', label: 'Wow', color: '#8b5cf6' },
  { emoji: '😢', type: 'sad', label: 'Sad', color: '#3b82f6' },
  { emoji: '😠', type: 'angry', label: 'Angry', color: '#dc2626' },
];

const StoriesSidebar = () => {
  const [stories, setStories] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showReactions, setShowReactions] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [isCreatingStory, setIsCreatingStory] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showViewers, setShowViewers] = useState(false);
  const [viewersList, setViewersList] = useState([]);
  const [isLoadingViewers, setIsLoadingViewers] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const progressInterval = useRef(null);

  useEffect(() => {
    fetchStories();
  }, []);

  useEffect(() => {
    if (selectedUser && isPlaying) {
      startProgress();
    } else {
      clearProgress();
    }

    return () => clearProgress();
  }, [selectedUser, currentStoryIndex, isPlaying]);

  const fetchStories = async () => {
    setIsLoading(true);
    try {
      const response = await storiesAPI.getFeed();
      setStories(response.data || []);
    } catch (error) {
      console.error('Error fetching stories:', error);
      setStories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const startProgress = () => {
    clearProgress();
    const startTime = Date.now();
    const duration = 7000;

    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = (elapsed / duration) * 100;

      if (newProgress >= 100) {
        nextStory();
      } else {
        setProgress(newProgress);
      }
    }, 50);
  };

  const clearProgress = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  };

  const nextStory = () => {
    if (!selectedUser || !selectedUser.stories) return;
    
    const currentStories = selectedUser.stories;
    if (currentStoryIndex < currentStories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
    } else {
      const currentUserIndex = stories.findIndex(u => u.user?.id === selectedUser.user?.id);
      if (currentUserIndex < stories.length - 1) {
        setSelectedUser(stories[currentUserIndex + 1]);
        setCurrentStoryIndex(0);
        setProgress(0);
      } else {
        closeStoryViewer();
      }
    }
  };

  const prevStory = () => {
    if (!selectedUser || !selectedUser.stories) return;
    
    const currentStories = selectedUser.stories;
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
    } else {
      const currentUserIndex = stories.findIndex(u => u.user?.id === selectedUser.user?.id);
      if (currentUserIndex > 0) {
        const prevUserStories = stories[currentUserIndex - 1];
        setSelectedUser(prevUserStories);
        setCurrentStoryIndex(prevUserStories.stories?.length - 1 || 0);
        setProgress(0);
      }
    }
  };

  const closeStoryViewer = () => {
    setSelectedUser(null);
    setIsPlaying(false);
    setProgress(0);
    setCurrentStoryIndex(0);
    setShowViewers(false);
    setViewersList([]);
  };

  const handleUserClick = (userStories) => {
    if (!userStories?.stories?.length) return;
    
    setSelectedUser(userStories);
    setCurrentStoryIndex(0);
    setProgress(0);
    setIsPlaying(true);
    
    // Ne pas marquer comme vue si c'est notre propre story
    const firstStory = userStories.stories[0];
    if (firstStory && !firstStory.has_viewed && userStories.user?.id !== user?.id) {
      storiesAPI.view(firstStory.id);
    }
  };

  const handleReaction = async (reactionType) => {
    if (!selectedUser?.stories?.[currentStoryIndex]) return;

    const currentStory = selectedUser.stories[currentStoryIndex];
    try {
      await storiesAPI.react(currentStory.id, { reaction: reactionType });
      setShowReactions(false);
      
      const reactionBtn = document.querySelector(`[data-reaction="${reactionType}"]`);
      if (reactionBtn) {
        reactionBtn.style.transform = 'scale(1.5)';
        setTimeout(() => {
          reactionBtn.style.transform = 'scale(1)';
        }, 300);
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleReply = async () => {
    if (!selectedUser?.stories?.[currentStoryIndex] || !replyMessage.trim()) return;

    const currentStory = selectedUser.stories[currentStoryIndex];
    try {
      await storiesAPI.react(currentStory.id, { reply: replyMessage });
      setReplyMessage('');
      setShowReply(false);
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  const handleCreateStory = async (storyData) => {
    try {
      await storiesAPI.create(storyData);
      setIsCreatingStory(false);
      fetchStories();
    } catch (error) {
      console.error('Error creating story:', error);
    }
  };

  const handleDeleteStory = async (storyId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette story ?')) {
      return;
    }

    try {
      await storiesAPI.delete(storyId);
      
      if (selectedUser?.stories) {
        const updatedStories = selectedUser.stories.filter(story => story.id !== storyId);
        
        if (updatedStories.length === 0) {
          closeStoryViewer();
          fetchStories();
        } else {
          setSelectedUser({
            ...selectedUser,
            stories: updatedStories
          });
          
          if (currentStoryIndex >= updatedStories.length) {
            setCurrentStoryIndex(updatedStories.length - 1);
          }
        }
      }
      
      fetchStories();
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('Erreur lors de la suppression de la story');
    }
  };

  const fetchViewers = async (storyId) => {
    setIsLoadingViewers(true);
    try {
      const response = await storiesAPI.getViews(storyId);
      console.log('📊 Données des viewers reçues:', response.data);
      
      const normalizedViewers = (response.data || [])
        .map(viewer => {
          if (viewer.user) {
            return {
              id: viewer.user.id,
              username: viewer.user.username,
              full_name: viewer.user.full_name,
              profile_picture: viewer.user.profile_picture,
              viewed_at: viewer.viewed_at || viewer.created_at
            };
          }
          
          return {
            id: viewer.id,
            username: viewer.username,
            full_name: viewer.full_name,
            profile_picture: viewer.profile_picture,
            viewed_at: viewer.viewed_at || viewer.created_at
          };
        })
        .filter(viewer => viewer.id !== user?.id);

      console.log('👥 Viewers après filtrage:', normalizedViewers);
      
      setViewersList(normalizedViewers);
      setShowViewers(true);
    } catch (error) {
      console.error('Error fetching viewers:', error);
      alert('Erreur lors du chargement des vues');
    } finally {
      setIsLoadingViewers(false);
    }
  };

  const handleViewersClick = () => {
    const currentStory = selectedUser?.stories?.[currentStoryIndex];
    if (currentStory) {
      fetchViewers(currentStory.id);
    }
  };

  const handleViewerProfileRedirect = (viewer) => {
    if (!viewer || !viewer.username) {
      console.warn('❌ Impossible de rediriger: username manquant', viewer);
      return;
    }

    console.log('🔗 Redirection vers le profil:', viewer.username);
    
    setShowViewers(false);
    closeStoryViewer();
    
    navigate(`/profile/${viewer.username}`);
  };

  const getDisplayName = (viewer) => {
    if (!viewer) return 'Utilisateur';
    return viewer.full_name || viewer.username || 'Utilisateur';
  };

  const getUsername = (viewer) => {
    if (!viewer) return 'utilisateur';
    return viewer.username || 'utilisateur';
  };

  const currentStory = selectedUser?.stories?.[currentStoryIndex];
  const isMyStory = currentStory && user && selectedUser.user?.id === user.id;

  return (
    <>
      {/* MODAL PLEIN ÉCRAN - Seulement quand une story est sélectionnée */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black">
          {/* Barre de progression */}
          <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
            {selectedUser.stories?.map((_, index) => (
              <div
                key={index}
                className="h-1 flex-1 rounded-full bg-gray-600 bg-opacity-50 overflow-hidden backdrop-blur-sm"
              >
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-100 ease-out"
                  style={{
                    width: index === currentStoryIndex ? `${progress}%` : 
                           index < currentStoryIndex ? '100%' : '0%'
                  }}
                />
              </div>
            ))}
          </div>

          {/* En-tête */}
          <div className="absolute top-4 left-4 right-4 z-10 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white cursor-pointer bg-gradient-to-r from-pink-500 to-purple-600 shadow-lg hover:scale-110 transition-transform duration-200"
              onClick={() => {
                closeStoryViewer();
                navigate(`/profile/${selectedUser.user?.username}`);
              }}
            >
              {selectedUser.user?.profile_picture ? (
                <img
                  src={selectedUser.user.profile_picture}
                  alt={selectedUser.user?.username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                selectedUser.user?.username?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            <div className="flex-1 cursor-pointer backdrop-blur-sm bg-black bg-opacity-30 rounded-xl p-2">
              <p className="font-semibold text-white">
                {selectedUser.user?.full_name || selectedUser.user?.username || 'Utilisateur'}
              </p>
              <p className="text-xs text-gray-300">
                Il y a {Math.round((Date.now() - new Date(currentStory.created_at).getTime()) / 3600000)}h
              </p>
            </div>
            <button
              onClick={closeStoryViewer}
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-xl transition-all duration-200 backdrop-blur-sm bg-black bg-opacity-30"
            >
              <X size={24} />
            </button>
          </div>

          {/* Contenu de la story */}
          <div className="h-full flex items-center justify-center relative">
            {currentStory.story_type === 'text' ? (
              <div
                className="w-full h-full flex items-center justify-center p-8"
                style={{
                  background: currentStory.background_color,
                  color: currentStory.text_color,
                }}
              >
                <p className="text-3xl font-bold text-center leading-relaxed">
                  {currentStory.content}
                </p>
              </div>
            ) : (
              <img
                src={currentStory.media_file}
                alt="Story"
                className="w-full h-full object-cover"
              />
            )}

            {/* Contrôles de navigation */}
            <div className="absolute inset-0 flex">
              <div 
                className="flex-1 flex items-center justify-start p-4 cursor-pointer"
                onClick={prevStory}
              >
                <div className="p-3 rounded-full bg-black bg-opacity-50 text-white backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity duration-200">
                  <ChevronLeft size={24} />
                </div>
              </div>
              <div 
                className="flex-1 flex items-center justify-end p-4 cursor-pointer"
                onClick={nextStory}
              >
                <div className="p-3 rounded-full bg-black bg-opacity-50 text-white backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity duration-200">
                  <ChevronRight size={24} />
                </div>
              </div>
            </div>

            {/* Contrôles de lecture */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="absolute bottom-4 left-4 p-3 rounded-xl bg-black bg-opacity-50 text-white hover:bg-opacity-70 backdrop-blur-sm transition-all duration-200"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
          </div>

          {/* Actions */}
          <div className="absolute bottom-4 right-4 flex gap-2 z-10">
            {/* Bouton pour voir les viewers (seulement pour mes stories) */}
            {isMyStory && (
              <button
                onClick={handleViewersClick}
                className="p-3 rounded-xl bg-black bg-opacity-50 text-white hover:bg-opacity-70 backdrop-blur-sm transition-all duration-200"
                title="Voir qui a vu votre story"
              >
                <Eye size={20} />
              </button>
            )}

            {/* Bouton suppression (seulement pour mes stories) */}
            {isMyStory && (
              <button
                onClick={() => handleDeleteStory(currentStory.id)}
                className="p-3 rounded-xl bg-black bg-opacity-50 text-white hover:bg-opacity-70 backdrop-blur-sm transition-all duration-200"
                title="Supprimer la story"
              >
                <Trash2 size={20} />
              </button>
            )}

            <button
              onClick={() => setShowReactions(!showReactions)}
              className="p-3 rounded-xl bg-black bg-opacity-50 text-white hover:bg-opacity-70 backdrop-blur-sm transition-all duration-200"
            >
              <Heart size={20} />
            </button>

            <button
              onClick={() => setShowReply(!showReply)}
              className="p-3 rounded-xl bg-black bg-opacity-50 text-white hover:bg-opacity-70 backdrop-blur-sm transition-all duration-200"
            >
              <MessageCircle size={20} />
            </button>
          </div>

          {/* Popup réactions */}
          {showReactions && (
            <div className="absolute bottom-14 right-0 bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-2xl backdrop-blur-sm border border-gray-200 dark:border-gray-700">
              <div className="flex gap-1">
                {REACTIONS.map((reaction) => (
                  <button
                    key={reaction.type}
                    onClick={() => handleReaction(reaction.type)}
                    className="p-2 text-2xl hover:scale-125 transition-transform duration-200"
                    title={reaction.label}
                  >
                    {reaction.emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Popup réponse */}
          {showReply && (
            <div className="absolute bottom-20 right-4 left-4 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-2xl backdrop-blur-sm border border-gray-200 dark:border-gray-700">
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Répondre à la story..."
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-pink-500 bg-transparent text-gray-900 dark:text-white"
                rows="3"
              />
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => setShowReply(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleReply}
                  disabled={!replyMessage.trim()}
                  className="px-4 py-2 rounded-lg text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 transition-all"
                >
                  Envoyer
                </button>
              </div>
            </div>
          )}

          {/* Modal des viewers */}
          {showViewers && (
            <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-20 p-4">
              <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md max-h-[80vh] overflow-hidden border border-gray-200 dark:border-gray-800">
                <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-pink-500 to-purple-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users size={24} className="text-white" />
                      <h3 className="text-xl font-bold text-white">Personnes qui ont vu</h3>
                    </div>
                    <button
                      onClick={() => setShowViewers(false)}
                      className="p-2 rounded-xl hover:bg-white hover:bg-opacity-20 transition-colors text-white"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <p className="text-sm text-pink-100 mt-1">
                    {viewersList.length} personne{viewersList.length > 1 ? 's' : ''} {viewersList.length > 1 ? 'ont' : 'a'} vu cette story
                    {isMyStory && viewersList.length === 0 && (
                      <span className="block text-pink-200 text-xs mt-1">
                        Votre story n'a pas encore été vue par d'autres utilisateurs
                      </span>
                    )}
                  </p>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {isLoadingViewers ? (
                    <div className="p-8 text-center">
                      <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                      <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
                    </div>
                  ) : viewersList.length > 0 ? (
                    <div className="divide-y divide-gray-200 dark:divide-gray-800">
                      {viewersList.map((viewer, index) => (
                        <div
                          key={viewer.id || index}
                          className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                          onClick={() => handleViewerProfileRedirect(viewer)}
                        >
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center font-bold text-white text-lg">
                            {viewer.profile_picture ? (
                              <img
                                src={viewer.profile_picture}
                                alt={getDisplayName(viewer)}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              getUsername(viewer).charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {getDisplayName(viewer)}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              @{getUsername(viewer)}
                            </p>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {viewer.viewed_at ? new Date(viewer.viewed_at).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Récemment'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-600/20 flex items-center justify-center mx-auto mb-3">
                        <Eye size={24} className="text-pink-500" />
                      </div>
                      <p className="text-gray-900 dark:text-white font-medium">
                        Aucune vue pour le moment
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Votre story n'a pas encore été vue par d'autres utilisateurs
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SIDEBAR DES STORIES - Toujours visible dans la sidebar droite */}
<div className="w-72 h-screen overflow-y-auto sticky top-0 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800">        <div className="p-6 space-y-6">
          {/* En-tête stylisé */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Stories
                </h2>
              </div>
            </div>
            <button
              onClick={() => setIsCreatingStory(true)}
              className="p-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg hover:from-pink-600 hover:to-purple-700 transform hover:scale-105 active:scale-95 transition-all duration-200 group"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>

          {/* Liste des stories */}
          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-2xl animate-pulse">
                  <div className="w-16 h-16 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))
            ) : stories.length > 0 ? (
              stories.map((userStories) => (
                <div
                  key={userStories.user?.id || Math.random()}
                  onClick={() => handleUserClick(userStories)}
                  className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105 group bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 hover:from-pink-50 hover:to-purple-50 dark:hover:from-pink-900/20 dark:hover:to-purple-900/20 border-2 border-transparent hover:border-pink-200 dark:hover:border-pink-800 shadow-sm hover:shadow-xl"
                >
                  <div className="relative">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-white text-lg relative group-hover:scale-110 transition-transform duration-300 bg-gradient-to-r from-pink-500 to-purple-600 shadow-lg"
                    >
                      {userStories.user?.profile_picture ? (
                        <img
                          src={userStories.user.profile_picture}
                          alt={userStories.user?.username}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        userStories.user?.username?.charAt(0).toUpperCase() || 'U'
                      )}
                    </div>
                    
                    {userStories.stories?.some(story => !story.has_viewed) && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 shadow-lg animate-pulse" />
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                      {userStories.user?.full_name || userStories.user?.username || 'Utilisateur'}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {userStories.stories?.length || 0} story{userStories.stories?.length > 1 ? 's' : ''} • Il y a {Math.round((Date.now() - new Date(userStories.stories?.[0]?.created_at || Date.now()).getTime()) / 3600000)}h
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 rounded-2xl bg-gradient-to-br from-gray-50 to-pink-50 dark:from-gray-800 dark:to-purple-900/20 border-2 border-dashed border-gray-300 dark:border-gray-700">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-600/20 flex items-center justify-center mx-auto mb-3">
                  <Sparkles size={24} className="text-pink-500" />
                </div>
                <p className="text-gray-900 dark:text-white font-medium">
                  Aucune story pour le moment
                </p>
                <button
                  onClick={() => setIsCreatingStory(true)}
                  className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-medium hover:from-pink-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200"
                >
                  Créer une story
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal création de story */}
        {isCreatingStory && (
          <CreateStoryModal
            onClose={() => setIsCreatingStory(false)}
            onSubmit={handleCreateStory}
          />
        )}
      </div>
    </>
  );
};

// Composant CreateStoryModal (identique à votre version précédente)
const CreateStoryModal = ({ onClose, onSubmit }) => {
  const [storyType, setStoryType] = useState('text');
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [backgroundColor, setBackgroundColor] = useState('#ec4899');
  const [textColor, setTextColor] = useState('#ffffff');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const backgroundOptions = [
    { value: '#ec4899', name: 'Rose' },
    { value: '#8b5cf6', name: 'Violet' },
    { value: '#3b82f6', name: 'Bleu' },
    { value: '#10b981', name: 'Vert' },
    { value: '#f59e0b', name: 'Orange' },
    { value: '#ef4444', name: 'Rouge' },
  ];

  const handleSubmit = async () => {
    if (storyType === 'text' && !content.trim()) {
      alert('Veuillez entrer un texte pour votre story');
      return;
    }
    
    if (storyType !== 'text' && !mediaFile) {
      alert(`Veuillez sélectionner un fichier ${storyType === 'image' ? 'image' : 'vidéo'}`);
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('story_type', storyType);
    
    if (storyType === 'text') {
      formData.append('content', content.trim());
      formData.append('background_color', backgroundColor);
      formData.append('text_color', textColor);
    } else {
      formData.append('media_file', mediaFile);
    }

    await onSubmit(formData);
    setIsSubmitting(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setMediaPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-800">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-pink-500 to-purple-600">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Créer une Story</h3>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 rounded-xl hover:bg-white hover:bg-opacity-20 transition-colors text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-3">Type de story</label>
            <div className="grid grid-cols-3 gap-2">
              {['text', 'image', 'video'].map((type) => (
                <button
                  key={type}
                  onClick={() => setStoryType(type)}
                  className={`p-3 rounded-xl border-2 ${
                    storyType === type
                      ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {type === 'text' ? '📝 Texte' : type === 'image' ? '🖼️ Image' : '🎥 Vidéo'}
                </button>
              ))}
            </div>
          </div>

          {storyType === 'text' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-3">Votre message</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-4 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 resize-vertical min-h-[100px]"
                  placeholder="Partagez votre humeur du moment..."
                  maxLength={500}
                />
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-3">Couleur de fond</label>
                  <div className="grid grid-cols-6 gap-2">
                    {backgroundOptions.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setBackgroundColor(color.value)}
                        className={`w-8 h-8 rounded-full border-2 ${
                          backgroundColor === color.value ? 'border-white dark:border-gray-900 shadow-lg scale-110' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        style={{ backgroundColor: color.value }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {storyType !== 'text' && (
            <div>
              <label className="block text-sm font-medium mb-3">
                {storyType === 'image' ? 'Sélectionner une image' : 'Sélectionner une vidéo'}
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 text-center">
                <input
                  type="file"
                  accept={storyType === 'image' ? 'image/*' : 'video/*'}
                  onChange={handleFileChange}
                  className="hidden"
                  id="media-upload"
                />
                <label htmlFor="media-upload" className="cursor-pointer block">
                  {mediaPreview ? (
                    <div>
                      {storyType === 'image' ? (
                        <img src={mediaPreview} alt="Preview" className="w-full h-48 object-cover rounded-lg mx-auto" />
                      ) : (
                        <video src={mediaPreview} className="w-full h-48 object-cover rounded-lg mx-auto" controls />
                      )}
                      <p className="text-sm text-green-600 font-medium mt-2">✓ Fichier sélectionné</p>
                    </div>
                  ) : (
                    <div>
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center mx-auto mb-3">
                        <Plus size={24} className="text-white" />
                      </div>
                      <p className="font-medium">Cliquez pour uploader</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {storyType === 'image' ? 'PNG, JPG, WEBP' : 'MP4, MOV'}
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || (storyType === 'text' ? !content.trim() : !mediaFile)}
              className="flex-1 px-4 py-3 rounded-xl text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? 'Publication...' : 'Publier la Story'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoriesSidebar;