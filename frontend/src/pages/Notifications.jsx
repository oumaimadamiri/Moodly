// Notifications.jsx
import React, { useState } from 'react';
import { Heart, MessageCircle, UserPlus, Settings, Mail, Bell } from 'lucide-react';
import useNotifications from '../hooks/useNotifications';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();
  
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead,
    isConnected,
    loading 
  } = useNotifications();

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart size={20} fill="#ec4899" className="text-pink-500" />;
      case 'comment':
        return <MessageCircle size={20} className="text-blue-500" />;
      case 'follow':
      case 'follow_request':
      case 'follow_accept':  
      case 'follow_reject':
        return <UserPlus size={20} className="text-green-500" />;
      case 'message':
        return <Mail size={20} className="text-purple-500" />;
      case 'new_post':
        return <Bell size={20} className="text-yellow-500" />;
      case 'story_reaction':
        return <Heart size={20} fill="#ec4899" className="text-pink-500" />;
      case 'story_reply':
        return <MessageCircle size={20} className="text-blue-500" />;
      default:
        return <Bell size={20} className="text-gray-500" />;
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'À l\'instant';
    if (diffInSeconds < 3600) return `il y a ${Math.floor(diffInSeconds / 60)}min`;
    if (diffInSeconds < 86400) return `il y a ${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `il y a ${Math.floor(diffInSeconds / 86400)}j`;
    return date.toLocaleDateString('fr-FR');
  };

  const handleNotificationClick = (notification) => {
    console.log('🎯 Notification clicked:', notification);
    
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    switch (notification.notification_type) {
      case 'like':
      case 'comment':
      case 'new_post':
        if (notification.post) {
          navigate(`/post/${notification.post}`);
        } else {
          navigate('/');
        }
        break;
      
      case 'follow':
        if (notification.actor?.username) {
          navigate(`/profile/${notification.actor.username}`);
        } else {
          navigate('/');
        }
        break;
      
      case 'follow_request':
        navigate(`/follow-requests`);
        break;
      
      case 'follow_accept':
          navigate(`/profile/${notification.actor.username}`);
          break;
      case 'follow_reject':
          navigate(`/follow-requests`);
          break;

      case 'message':
        if (notification.conversation) {
          navigate(`/messages/${notification.conversation}`);
        } else {
          navigate('/messages');
        }
        break;
      
      case 'story_reaction':
      case 'story_reply':
        if (notification.story) {
          navigate('/');
        } else {
          navigate('/');
        }
        break;
      
      default:
        navigate('/notifications');
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  console.log('🔔 Notifications to display:', filteredNotifications);

  return (
    <div className="space-y-6 p-6">
      {/* Header avec statut WebSocket */}
      <div className="sticky top-0 z-10 p-6 mb-6 bg-white border-b border-gray-200 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">
              Notifications
            </h2>
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} 
                 title={isConnected ? 'Connecté en temps réel' : 'Déconnecté'} />
          </div>
          
        </div>
        
        {unreadCount > 0 && (
          <div className="mt-3">
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-pink-500 to-purple-600 text-white">
              {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
            filter === 'all' 
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Toutes
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
            filter === 'unread' 
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Non lues
        </button>
        {notifications.some(n => !n.read) && (
          <button
            onClick={markAllAsRead}
            className="ml-auto px-4 py-2 rounded-xl font-medium transition-all duration-200 text-pink-600 hover:bg-pink-50"
          >
            Tout marquer comme lu
          </button>
        )}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
          <p className="mt-3 text-gray-600">Chargement des notifications...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-12 rounded-2xl bg-gray-50">
          <p className="text-lg text-gray-600">
            {filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Revenez plus tard !
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map(notification => (
            <div
              key={notification.id}
              onClick={() => {
                if (!notification.read) {
                  markAsRead(notification.id);
                }
                handleNotificationClick(notification);
              }}
              className="p-4 rounded-2xl cursor-pointer transition-all duration-200 hover:opacity-80 bg-white border border-gray-200 hover:border-pink-200 hover:shadow-sm"
              style={{ 
                backgroundColor: notification.read ? 'white' : '#fdf2f8',
                borderColor: notification.read ? '#e5e7eb' : '#fbcfe8'
              }}
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.notification_type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0 bg-gradient-to-r from-pink-500 to-purple-600">
                      {notification.actor?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900">
                        <span className="font-bold">
                          {notification.actor?.full_name || notification.actor?.username}
                        </span>
                        {' '}
                        <span className="text-gray-600">
                          {notification.text}
                        </span>
                      </p>

                      {(notification.post_preview || notification.comment_preview || notification.reply_preview) && (
                        <p className="mt-1 text-sm text-gray-500 truncate">
                          {notification.post_preview || notification.comment_preview || notification.reply_preview}
                        </p>
                      )}

                      <p className="mt-1 text-sm text-gray-500">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </div>

                {!notification.read && (
                  <div className="w-2 h-2 rounded-full flex-shrink-0 mt-2 bg-pink-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;