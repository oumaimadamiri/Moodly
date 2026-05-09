import React, { useState, useEffect, useRef } from 'react';
import { Send, Heart, MessageCircle, MoreHorizontal, Smile } from 'lucide-react';
import { commentsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import theme from '../styles/theme';

const CommentsSection = ({ postId, isOpen }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const { user } = useAuth();
  const commentsEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && postId) {
      fetchComments();
    }
  }, [isOpen, postId]);

  useEffect(() => {
    scrollToBottom();
  }, [comments, showComments]);

  const fetchComments = async () => {
    try {
      const response = await commentsAPI.getByPost(postId);
      setComments(response.data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setLoading(true);
    try {
      const commentData = {
        content: newComment.trim(),
        post: postId,
        parent_comment: replyingTo?.id || null
      };

      const response = await commentsAPI.create(postId, commentData);
      
      setComments(prev => [response.data, ...prev]);
      setNewComment('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error creating comment:', error);
      
      if (error.response?.status === 400) {
        alert('Données invalides pour le commentaire');
      } else if (error.response?.status === 401) {
        alert('Veuillez vous connecter pour commenter');
      } else {
        alert('Erreur lors de l\'envoi du commentaire');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      await commentsAPI.like(commentId);
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, likes_count: (comment.likes_count || 0) + 1, has_liked: true }
          : comment
      ));
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const toggleComments = () => {
    setShowComments(!showComments);
    if (!showComments && isOpen && postId) {
      fetchComments();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      {/* Bouton pour afficher/masquer les commentaires */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={toggleComments}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500/10 to-purple-600/10 hover:from-pink-500/20 hover:to-purple-600/20 transition-all duration-300 group"
        >
          <MessageCircle size={18} className="text-pink-500 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {comments.length} commentaire{comments.length !== 1 ? 's' : ''}
          </span>
          <div className={`transform transition-transform duration-300 ${showComments ? 'rotate-180' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </div>
        </button>
      </div>

      {/* Section commentaires avec animation */}
      <div className={`overflow-hidden transition-all duration-500 ${
        showComments ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        {/* Formulaire de commentaire stylisé */}
        <form onSubmit={handleSubmitComment} className="flex gap-3 mb-6 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
          <div className="flex-1 space-y-3">
            {replyingTo && (
              <div className="flex items-center gap-2 text-xs text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/30 px-3 py-1 rounded-full">
                <span>Réponse à @{replyingTo.author?.username}</span>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="hover:text-pink-700 dark:hover:text-pink-300"
                >
                  ×
                </button>
              </div>
            )}
            <div className="relative">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={replyingTo ? `Répondre à @${replyingTo.author?.username}...` : "Laissez un commentaire..."}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
                disabled={loading}
              />
              <button
                type="button"
                className="absolute right-12 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-pink-500 transition-colors"
              >
                <Smile size={18} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!newComment.trim() || loading}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-pink-600 hover:to-purple-700 transform hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg shadow-pink-500/25 flex items-center gap-2"
                >
                  <Send size={16} />
                  {loading ? 'Envoi...' : 'Envoyer'}
                </button>
                {replyingTo && (
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Liste des commentaires avec design amélioré */}
        <div className="space-y-4 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-pink-500 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
          {comments.map(comment => (
            <div key={comment.id} className="group relative">
              <div className="flex gap-3 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg cursor-pointer hover:scale-110 transition-transform duration-200">
                    {comment.author?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </div>

                {/* Contenu du commentaire */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-pink-500 transition-colors">
                        {comment.author?.full_name || comment.author?.username}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(comment.created_at).toLocaleDateString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200">
                      <MoreHorizontal size={16} className="text-gray-400" />
                    </button>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                    {comment.content}
                  </p>

                  {/* Actions du commentaire */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleLikeComment(comment.id)}
                      className={`flex items-center gap-1 text-sm transition-all duration-200 ${
                        comment.has_liked 
                          ? 'text-pink-500' 
                          : 'text-gray-500 hover:text-pink-500'
                      }`}
                    >
                      <Heart 
                        size={16} 
                        className={comment.has_liked ? 'fill-current' : ''}
                      />
                      <span>{comment.likes_count || 0}</span>
                    </button>

                    <button
                      onClick={() => setReplyingTo(comment)}
                      className="flex items-center gap-1 text-sm text-gray-500 hover:text-purple-500 transition-colors duration-200"
                    >
                      <MessageCircle size={16} />
                      <span>Répondre</span>
                    </button>
                  </div>

                  {/* Réponses */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 ml-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-3">
                      {comment.replies.map(reply => (
                        <div key={reply.id} className="flex gap-2 py-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {reply.author?.username?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm text-gray-900 dark:text-white">
                                {reply.author?.username}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(reply.created_at).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {reply.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {comments.length === 0 && (
            <div className="text-center py-8 rounded-2xl bg-gradient-to-br from-gray-50 to-pink-50 dark:from-gray-800 dark:to-purple-900/20 border border-gray-200 dark:border-gray-700">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-600/20 flex items-center justify-center mx-auto mb-3">
                <MessageCircle size={24} className="text-pink-500" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                Aucun commentaire pour le moment
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Soyez le premier à commenter !
              </p>
            </div>
          )}
          
          <div ref={commentsEndRef} />
        </div>
      </div>
    </div>
  );
};

export default CommentsSection;