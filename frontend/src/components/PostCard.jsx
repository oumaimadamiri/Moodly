import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  MessageCircle, 
  MoreHorizontal,
  Trash2,
  Edit3,
  X,
  Reply,
  CornerDownLeft
} from 'lucide-react';
import theme from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { postsAPI, commentsAPI } from '../services/api';
import { useLocation } from 'react-router-dom';

const PostCard = ({ post, onUpdate, onDelete, onUsernameClick }) => {
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(post.content || '');
  const [editing, setEditing] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [likesList, setLikesList] = useState([]);
  const [loadingLikes, setLoadingLikes] = useState(false);
  const [hasCorrectedLikes, setHasCorrectedLikes] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [postingReply, setPostingReply] = useState(false);
  
  const { user } = useAuth();
  const location = useLocation();
  
  const isOwnPost = user && post.author && user.id === post.author.id;

  // Gestion des états de navigation depuis les notifications
  useEffect(() => {
    if (location.state?.scrollToComments && location.state?.postId === post.id) {
      setShowComments(true);
      if (!showComments) {
        fetchComments();
      }
    }
  }, [location.state, post.id, showComments]);

  // Synchronisation avec les props du parent
  useEffect(() => {
    if (!hasCorrectedLikes) {
      if (post.likes_count !== undefined) {
        setLikesCount(post.likes_count);
      }
      if (post.is_liked !== undefined) {
        setIsLiked(post.is_liked);
      }
    }
  }, [post.likes_count, post.is_liked, hasCorrectedLikes]);

  // Fonction pour récupérer la liste des likes
  const fetchLikes = async () => {
    setLoadingLikes(true);
    try {
      const response = await postsAPI.getLikes(post.id);
      let likesData = response.data || [];
      
      if (likesData.results) {
        likesData = likesData.results;
      } else if (likesData.likes) {
        likesData = likesData.likes;
      }
      
      if (likesData.length !== likesCount) {
        setLikesCount(likesData.length);
        setHasCorrectedLikes(true);
        if (onUpdate && likesData.length !== post.likes_count) {
          const updatedPost = { ...post, likes_count: likesData.length };
          onUpdate(updatedPost);
        }
      }
      
      const formattedLikes = likesData.map((like) => {
        if (like.user) {
          return {
            user_id: like.user.id,
            user: like.user
          };
        }
        if (like.id && like.username) {
          return {
            user_id: like.id,
            user: like
          };
        }
        return like;
      });
      
      setLikesList(formattedLikes);
      
    } catch (error) {
      console.error('❌ Error fetching likes:', error);
      setLikesList([]);
    } finally {
      setLoadingLikes(false);
    }
  };

  // Fonction pour ouvrir la modal des likes
  const handleShowLikes = async () => {
    if (likesCount === 0) return;
    setShowLikesModal(true);
    await fetchLikes();
  };

  // Fonction de like/unlike
  const handleLike = async () => {
    if (!user) {
      alert('Veuillez vous connecter pour aimer un post');
      return;
    }
    
    const previousIsLiked = isLiked;
    const previousLikesCount = likesCount;
    
    try {
      if (isLiked) {
        await postsAPI.unlike(post.id);
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
        setLikesList(prev => prev.filter(like => like.user_id !== user.id));
      } else {
        await postsAPI.like(post.id);
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
        const newLike = {
          user_id: user.id,
          user: {
            id: user.id,
            username: user.username,
            full_name: user.full_name,
            profile_picture: user.profile_picture
          }
        };
        setLikesList(prev => [newLike, ...prev]);
      }
      
      setTimeout(async () => {
        try {
          const updatedPostResponse = await postsAPI.getById(post.id);
          const updatedPost = updatedPostResponse.data;
          setLikesCount(updatedPost.likes_count || 0);
          setIsLiked(updatedPost.is_liked || false);
          setHasCorrectedLikes(true);
          if (onUpdate) {
            onUpdate(updatedPost);
          }
        } catch (syncError) {
          console.error('❌ Error syncing after like:', syncError);
        }
      }, 500);
      
    } catch (error) {
      console.error('Error liking post:', error);
      setIsLiked(previousIsLiked);
      setLikesCount(previousLikesCount);
      alert('Erreur lors de la mise à jour du like');
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;
    
    setPostingComment(true);
    try {
      const response = await commentsAPI.create(post.id, {
        content: commentText.trim()
      });
      
      const newComment = response.data;
      setComments(prev => [newComment, ...prev]);
      setCommentText('');
      
      const updatedPostResponse = await postsAPI.getById(post.id);
      const updatedPost = updatedPostResponse.data;
      
      if (onUpdate) {
        onUpdate(updatedPost);
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Erreur lors de la publication du commentaire');
    } finally {
      setPostingComment(false);
    }
  };

  const handleReplySubmit = async (e, parentComment) => {
    e.preventDefault();
    if (!replyText.trim() || !user) return;
    
    setPostingReply(true);
    try {
      const response = await commentsAPI.create(post.id, {
        content: replyText.trim(),
        parent: parentComment.id
      });
      
      const newReply = response.data;
      // Ajouter la réponse au commentaire parent
      setComments(prev => prev.map(comment => 
        comment.id === parentComment.id 
          ? { ...comment, replies: [...(comment.replies || []), newReply] }
          : comment
      ));
      
      setReplyText('');
      setReplyingTo(null);
      
      // Mettre à jour le compteur de commentaires du post
      const updatedPostResponse = await postsAPI.getById(post.id);
      const updatedPost = updatedPostResponse.data;
      
      if (onUpdate) {
        onUpdate(updatedPost);
      }
    } catch (error) {
      console.error('Error posting reply:', error);
      alert('Erreur lors de la publication de la réponse');
    } finally {
      setPostingReply(false);
    }
  };

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const response = await postsAPI.getComments(post.id);
      const commentsData = response.data || [];
      
      // Organiser les commentaires et réponses
      const mainComments = commentsData.filter(comment => !comment.parent);
      const replies = commentsData.filter(comment => comment.parent);
      
      // Associer les réponses à leurs commentaires parents
      const commentsWithReplies = mainComments.map(comment => ({
        ...comment,
        replies: replies.filter(reply => reply.parent === comment.id)
      }));
      
      setComments(commentsWithReplies);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleToggleComments = async () => {
    if (!showComments) {
      await fetchComments();
    }
    setShowComments(!showComments);
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce post ?')) return;
    
    try {
      await postsAPI.delete(post.id);
      if (onDelete) {
        onDelete(post.id);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Erreur lors de la suppression du post');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) return;
    
    try {
      await commentsAPI.delete(commentId);
      // Retirer le commentaire de la liste
      setComments(prev => prev.filter(comment => comment.id !== commentId));
      
      // Mettre à jour le compteur de commentaires du post
      const updatedPostResponse = await postsAPI.getById(post.id);
      const updatedPost = updatedPostResponse.data;
      
      if (onUpdate) {
        onUpdate(updatedPost);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Erreur lors de la suppression du commentaire');
    }
  };

  const handleDeleteReply = async (replyId, parentCommentId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette réponse ?')) return;
    
    try {
      await commentsAPI.delete(replyId);
      // Retirer la réponse du commentaire parent
      setComments(prev => prev.map(comment => 
        comment.id === parentCommentId 
          ? { ...comment, replies: comment.replies.filter(reply => reply.id !== replyId) }
          : comment
      ));
      
      // Mettre à jour le compteur de commentaires du post
      const updatedPostResponse = await postsAPI.getById(post.id);
      const updatedPost = updatedPostResponse.data;
      
      if (onUpdate) {
        onUpdate(updatedPost);
      }
    } catch (error) {
      console.error('Error deleting reply:', error);
      alert('Erreur lors de la suppression de la réponse');
    }
  };

  const handleEditPost = async () => {
    if (!editText.trim()) return;
    
    setEditing(true);
    try {
      const response = await postsAPI.update(post.id, {
        content: editText.trim()
      });
      
      const updatedPost = response.data;
      setIsEditing(false);
      
      if (onUpdate) {
        onUpdate(updatedPost);
      }
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Erreur lors de la modification du post');
    } finally {
      setEditing(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays < 7) return `Il y a ${diffDays} j`;
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleUsernameClick = (username) => {
    if (onUsernameClick && username) {
      onUsernameClick(username);
    }
  };

  const isOwnComment = (commentAuthor) => {
    return user && commentAuthor && user.id === commentAuthor.id;
  };

  // Composant pour la modal des likes
  const LikesModal = () => {
    if (!showLikesModal) return null;

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
          backgroundColor: theme.card,
          borderRadius: '16px',
          width: '100%',
          maxWidth: '400px',
          maxHeight: '80vh',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{
            padding: '20px',
            borderBottom: `1px solid ${theme.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h3 style={{
              margin: 0,
              color: theme.text,
              fontSize: '18px',
              fontWeight: '600'
            }}>
              Personnes qui aiment ({likesCount})
            </h3>
            <button
              onClick={() => setShowLikesModal(false)}
              style={{
                padding: '8px',
                borderRadius: '8px',
                backgroundColor: 'transparent',
                border: 'none',
                color: theme.textSecondary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = theme.background;
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{
            maxHeight: '400px',
            overflowY: 'auto',
            padding: '8px 0'
          }}>
            {loadingLikes ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: theme.textSecondary
              }}>
                Chargement des likes...
              </div>
            ) : likesList.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: theme.textSecondary
              }}>
                Aucun like pour le moment
              </div>
            ) : (
              <div>
                {likesList.map((like, index) => {
                  const userData = like.user || like;
                  const userId = like.user_id || userData.id;
                  const username = userData.username;
                  const fullName = userData.full_name || 
                                 (userData.first_name && userData.last_name ? 
                                  `${userData.first_name} ${userData.last_name}` : 
                                  username);
                  const profilePicture = userData.profile_picture || userData.avatar;

                  return (
                    <div
                      key={userId || index}
                      style={{
                        padding: '12px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: username ? 'pointer' : 'default',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.background;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      onClick={() => {
                        if (username) {
                          handleUsernameClick(username);
                          setShowLikesModal(false);
                        }
                      }}
                    >
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        backgroundColor: profilePicture ? 'transparent' : theme.primary,
                        backgroundImage: profilePicture ? `url(${profilePicture})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: theme.textInverse,
                        fontWeight: 'bold',
                        fontSize: '16px',
                        flexShrink: 0
                      }}>
                        {!profilePicture && (
                          username ? username.charAt(0).toUpperCase() : 'U'
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          color: theme.text,
                          fontWeight: '600',
                          fontSize: '15px',
                          marginBottom: '2px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {fullName || 'Utilisateur'}
                        </div>
                        <div style={{
                          color: theme.textSecondary,
                          fontSize: '14px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {username ? `@${username}` : 'Utilisateur'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
     <div style={{
      backgroundColor: theme.card,
      borderRadius: '16px',
      border: `1px solid ${theme.border}`,
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      width: '100%',
      maxWidth: '100%'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.12)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
    }}
    >
      
        {/* Header du post */}
        <div style={{
          padding: '20px 20px 16px 20px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          {/* Avatar */}
          <div 
            onClick={() => handleUsernameClick(post.author?.username)}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: post.author?.profile_picture ? 'transparent' : theme.primary,
              backgroundImage: post.author?.profile_picture ? `url(${post.author.profile_picture})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.textInverse,
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'transform 0.2s ease',
              border: `2px solid ${theme.border}`
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
            }}
          >
            {!post.author?.profile_picture && (
              post.author?.username?.charAt(0).toUpperCase() || 'U'
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Nom et username */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 
                onClick={() => handleUsernameClick(post.author?.username)}
                style={{
                  cursor: 'pointer',
                  color: theme.text,
                  fontWeight: '600',
                  fontSize: '16px',
                  margin: 0,
                  transition: 'color 0.2s ease',
                  display: 'inline-block'
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = theme.primary;
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = theme.text;
                }}
              >
                {post.author?.full_name || post.author?.username}
              </h3>
              
              <div 
                onClick={() => handleUsernameClick(post.author?.username)}
                style={{
                  cursor: 'pointer',
                  color: theme.textSecondary,
                  fontSize: '14px',
                  transition: 'color 0.2s ease',
                  display: 'inline-block'
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = theme.primary;
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = theme.textSecondary;
                }}
              >
                @{post.author?.username}
              </div>
              
              <span style={{ 
                color: theme.textTertiary,
                fontSize: '14px'
              }}>
                • {formatDate(post.created_at)}
              </span>
            </div>

            {/* Contenu du post */}
            {isEditing ? (
              <div style={{ marginTop: '12px' }}>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '12px',
                    borderRadius: '8px',
                    border: `1px solid ${theme.border}`,
                    backgroundColor: theme.background,
                    color: theme.text,
                    fontSize: '15px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    lineHeight: '1.5'
                  }}
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button
                    onClick={handleEditPost}
                    disabled={editing}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      backgroundColor: theme.primary,
                      color: theme.textInverse,
                      border: 'none',
                      cursor: editing ? 'not-allowed' : 'pointer',
                      opacity: editing ? 0.6 : 1,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {editing ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    disabled={editing}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      backgroundColor: 'transparent',
                      color: theme.textSecondary,
                      border: `1px solid ${theme.border}`,
                      cursor: editing ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ 
                color: theme.text,
                fontSize: '15px',
                lineHeight: '1.6',
                margin: '12px 0 0 0',
                wordBreak: 'break-word'
              }}>
                {post.content}
              </p>
            )}

            {/* Image du post */}
            {post.image && !isEditing && (
              <div style={{ 
                marginTop: '16px',
                borderRadius: '12px',
                overflow: 'hidden',
                border: `1px solid ${theme.border}`
              }}>
                <img 
                  src={post.image} 
                  alt="Post content" 
                  style={{
                    width: '100%',
                    maxHeight: '400px',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
              </div>
            )}
          </div>

          {/* Menu options */}
          {isOwnPost && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowOptions(!showOptions)}
                style={{
                  padding: '6px',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: theme.textSecondary,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = theme.background;
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                <MoreHorizontal size={18} />
              </button>

              {showOptions && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: '4px',
                  padding: '6px 0',
                  borderRadius: '12px',
                  backgroundColor: theme.card,
                  border: `1px solid ${theme.border}`,
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)',
                  zIndex: 10,
                  minWidth: '140px'
                }}>
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setEditText(post.content);
                      setShowOptions(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '10px 16px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: theme.text,
                      cursor: 'pointer',
                      fontSize: '14px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = theme.background;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Edit3 size={16} />
                    Modifier
                  </button>
                  <button
                    onClick={handleDeletePost}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '10px 16px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: theme.error,
                      cursor: 'pointer',
                      fontSize: '14px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = theme.background;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Trash2 size={16} />
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Statistiques et actions */}
        <div style={{
          padding: '0 20px 16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          fontSize: '14px',
          color: theme.textSecondary
        }}>
          <span 
            onClick={handleShowLikes}
            style={{
              cursor: likesCount > 0 ? 'pointer' : 'default',
              transition: likesCount > 0 ? 'color 0.2s ease' : 'none',
              textDecoration: likesCount > 0 ? 'underline' : 'none',
              fontWeight: '500'
            }}
            onMouseEnter={(e) => {
              if (likesCount > 0) {
                e.target.style.color = theme.primary;
              }
            }}
            onMouseLeave={(e) => {
              if (likesCount > 0) {
                e.target.style.color = theme.textSecondary;
              }
            }}
          >
            {likesCount} j'aime
          </span>
          <span style={{ fontWeight: '500' }}>{post.comments_count || 0} commentaires</span>
        </div>

        {/* Actions */}
        <div style={{
          padding: '12px 20px',
          borderTop: `1px solid ${theme.border}`,
          display: 'flex',
          gap: '4px'
        }}>
          <button
            onClick={handleLike}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              color: isLiked ? theme.error : theme.textSecondary,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = theme.background;
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
            {isLiked ? 'Aimé' : "J'aime"}
          </button>

          <button
            onClick={handleToggleComments}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              color: theme.textSecondary,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = theme.background;
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <MessageCircle size={18} />
            Commenter
          </button>
        </div>

        {/* Section commentaires */}
        {showComments && (
          <div style={{
            padding: '20px',
            borderTop: `1px solid ${theme.border}`,
            backgroundColor: theme.background
          }}>
            {/* Formulaire de commentaire principal */}
            {user && !replyingTo && (
              <form onSubmit={handleCommentSubmit} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: user.profile_picture ? 'transparent' : theme.primary,
                    backgroundImage: user.profile_picture ? `url(${user.profile_picture})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: theme.textInverse,
                    fontWeight: 'bold',
                    fontSize: '14px',
                    flexShrink: 0,
                    border: `2px solid ${theme.border}`
                  }}>
                    {!user.profile_picture && user.username?.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Écrivez un commentaire..."
                      style={{
                        width: '100%',
                        minHeight: '80px',
                        padding: '12px',
                        borderRadius: '12px',
                        border: `1px solid ${theme.border}`,
                        backgroundColor: theme.card,
                        color: theme.text,
                        fontSize: '14px',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        lineHeight: '1.5'
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                      <button
                        type="submit"
                        disabled={!commentText.trim() || postingComment}
                        style={{
                          padding: '10px 20px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '500',
                          backgroundColor: theme.primary,
                          color: theme.textInverse,
                          border: 'none',
                          cursor: (!commentText.trim() || postingComment) ? 'not-allowed' : 'pointer',
                          opacity: (!commentText.trim() || postingComment) ? 0.6 : 1,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {postingComment ? 'Publication...' : 'Commenter'}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* Liste des commentaires */}
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {loadingComments ? (
                <div style={{ textAlign: 'center', padding: '20px', color: theme.textSecondary }}>
                  Chargement des commentaires...
                </div>
              ) : comments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: theme.textSecondary }}>
                  Aucun commentaire pour le moment
                </div>
              ) : (
                comments.map(comment => (
                  <div key={comment.id}>
                    {/* Commentaire principal */}
                    <div style={{ 
                      padding: '16px 0',
                      borderBottom: `1px solid ${theme.border}20`,
                      display: 'flex',
                      gap: '12px'
                    }}>
                      <div 
                        onClick={() => handleUsernameClick(comment.author?.username)}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: comment.author?.profile_picture ? 'transparent' : theme.primary,
                          backgroundImage: comment.author?.profile_picture ? `url(${comment.author.profile_picture})` : 'none',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: theme.textInverse,
                          fontWeight: 'bold',
                          fontSize: '13px',
                          flexShrink: 0,
                          cursor: 'pointer',
                          transition: 'transform 0.2s ease',
                          border: `2px solid ${theme.border}`
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'scale(1)';
                        }}
                      >
                        {!comment.author?.profile_picture && (
                          comment.author?.username?.charAt(0).toUpperCase() || 'U'
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <strong 
                            onClick={() => handleUsernameClick(comment.author?.username)}
                            style={{
                              cursor: 'pointer',
                              color: theme.text,
                              fontSize: '14px',
                              transition: 'color 0.2s ease',
                              fontWeight: '600'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.color = theme.primary;
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.color = theme.text;
                            }}
                          >
                            {comment.author?.full_name || comment.author?.username}
                          </strong>
                          <span style={{ color: theme.textTertiary, fontSize: '12px' }}>
                            {formatDate(comment.created_at)}
                          </span>
                          
                          {/* Boutons d'action pour le commentaire */}
                          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                            <button
                              onClick={() => setReplyingTo(replyingTo?.id === comment.id ? null : comment)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: theme.textSecondary,
                                cursor: 'pointer',
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = theme.background;
                                e.target.style.color = theme.primary;
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                                e.target.style.color = theme.textSecondary;
                              }}
                            >
                              <Reply size={12} />
                              Répondre
                            </button>
                            
                            {isOwnComment(comment.author) && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  backgroundColor: 'transparent',
                                  border: 'none',
                                  color: theme.error,
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = theme.background;
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = 'transparent';
                                }}
                              >
                                <Trash2 size={12} />
                                Supprimer
                              </button>
                            )}
                          </div>
                        </div>
                        <p style={{ 
                          color: theme.text,
                          fontSize: '14px',
                          margin: '6px 0 0 0',
                          lineHeight: '1.5'
                        }}>
                          {comment.content}
                        </p>
                      </div>
                    </div>

                    {/* Formulaire de réponse */}
                    {replyingTo?.id === comment.id && user && (
                      <form onSubmit={(e) => handleReplySubmit(e, comment)} style={{ margin: '12px 0 16px 48px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: user.profile_picture ? 'transparent' : theme.primary,
                            backgroundImage: user.profile_picture ? `url(${user.profile_picture})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: theme.textInverse,
                            fontWeight: 'bold',
                            fontSize: '12px',
                            flexShrink: 0,
                            border: `2px solid ${theme.border}`
                          }}>
                            {!user.profile_picture && user.username?.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1 }}>
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder={`Répondre à ${comment.author?.username}...`}
                              style={{
                                width: '100%',
                                minHeight: '60px',
                                padding: '10px',
                                borderRadius: '8px',
                                border: `1px solid ${theme.border}`,
                                backgroundColor: theme.card,
                                color: theme.text,
                                fontSize: '13px',
                                resize: 'vertical',
                                fontFamily: 'inherit',
                                lineHeight: '1.4'
                              }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setReplyingTo(null);
                                  setReplyText('');
                                }}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: '500',
                                  backgroundColor: 'transparent',
                                  color: theme.textSecondary,
                                  border: `1px solid ${theme.border}`,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                Annuler
                              </button>
                              <button
                                type="submit"
                                disabled={!replyText.trim() || postingReply}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: '500',
                                  backgroundColor: theme.primary,
                                  color: theme.textInverse,
                                  border: 'none',
                                  cursor: (!replyText.trim() || postingReply) ? 'not-allowed' : 'pointer',
                                  opacity: (!replyText.trim() || postingReply) ? 0.6 : 1,
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                {postingReply ? 'Publication...' : 'Répondre'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </form>
                    )}

                    {/* Réponses au commentaire */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div style={{ marginLeft: '48px', borderLeft: `2px solid ${theme.border}30`, paddingLeft: '12px' }}>
                        {comment.replies.map(reply => (
                          <div key={reply.id} style={{ 
                            padding: '12px 0',
                            borderBottom: `1px solid ${theme.border}15`,
                            display: 'flex',
                            gap: '10px'
                          }}>
                            <div 
                              onClick={() => handleUsernameClick(reply.author?.username)}
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                backgroundColor: reply.author?.profile_picture ? 'transparent' : theme.primary,
                                backgroundImage: reply.author?.profile_picture ? `url(${reply.author.profile_picture})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: theme.textInverse,
                                fontWeight: 'bold',
                                fontSize: '11px',
                                flexShrink: 0,
                                cursor: 'pointer',
                                transition: 'transform 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.transform = 'scale(1.05)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = 'scale(1)';
                              }}
                            >
                              {!reply.author?.profile_picture && (
                                reply.author?.username?.charAt(0).toUpperCase() || 'U'
                              )}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <strong 
                                  onClick={() => handleUsernameClick(reply.author?.username)}
                                  style={{
                                    cursor: 'pointer',
                                    color: theme.text,
                                    fontSize: '13px',
                                    transition: 'color 0.2s ease',
                                    fontWeight: '600'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.color = theme.primary;
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.color = theme.text;
                                  }}
                                >
                                  {reply.author?.full_name || reply.author?.username}
                                </strong>
                                <span style={{ color: theme.textTertiary, fontSize: '11px' }}>
                                  {formatDate(reply.created_at)}
                                </span>
                                
                                {/* Bouton supprimer pour la réponse */}
                                {isOwnComment(reply.author) && (
                                  <button
                                    onClick={() => handleDeleteReply(reply.id, comment.id)}
                                    style={{
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      backgroundColor: 'transparent',
                                      border: 'none',
                                      color: theme.error,
                                      cursor: 'pointer',
                                      fontSize: '11px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '2px',
                                      transition: 'all 0.2s ease',
                                      marginLeft: 'auto'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.target.style.backgroundColor = theme.background;
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.backgroundColor = 'transparent';
                                    }}
                                  >
                                    <Trash2 size={10} />
                                    Supprimer
                                  </button>
                                )}
                              </div>
                              <p style={{ 
                                color: theme.text,
                                fontSize: '13px',
                                margin: '4px 0 0 0',
                                lineHeight: '1.4'
                              }}>
                                {reply.content}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal des likes */}
      <LikesModal />
    </>
  );
};

export default PostCard;