// hooks/useNotifications.js
import { useEffect, useState } from 'react';
import { notificationsAPI, storyNotificationsAPI } from '../services/api';

const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fonction pour formater les notifications de stories
const formatStoryNotification = (storyNotif) => {
  let text = '';
  
  switch (storyNotif.notification_type) {
    case 'story_reaction':
      text = `a réagi à votre story`;
      break;
    case 'story_reply':
      text = `a répondu à votre story`;
      break;
    default:
      text = `a interagi avec votre story`;
  }
  
  return {
    ...storyNotif,
    id: `story_${storyNotif.id}`,
    text: text,
    actor: storyNotif.from_user,
    read: storyNotif.is_read,
    notification_type: storyNotif.notification_type,
    created_at: storyNotif.created_at,
    source: 'story',
    story_id: storyNotif.story?.id || storyNotif.story,
    // Ajouter un preview pour les réponses
    reply_preview: storyNotif.reply_message ? 
      storyNotif.reply_message.substring(0, 100) + 
      (storyNotif.reply_message.length > 100 ? '...' : '') : null
  };
};

  // Charger les notifications initiales
  useEffect(() => {
    const fetchInitialNotifications = async () => {
      try {
        setLoading(true);
        
        // Charger les notifications normales ET les notifications de stories
        const [normalResponse, storyResponse] = await Promise.all([
          notificationsAPI.getAll(),
          storyNotificationsAPI.getAll()
        ]);

        console.log('📋 Normal notifications:', normalResponse.data);
        console.log('📖 Story notifications:', storyResponse.data);

        const normalNotifications = normalResponse.data.results || normalResponse.data;
        const storyNotifications = storyResponse.data.results || storyResponse.data;

        // Formater les notifications de stories
        const formattedStoryNotifications = storyNotifications.map(formatStoryNotification);
        
        // Combiner et trier toutes les notifications
        const allNotifications = [
          ...normalNotifications.map(n => ({ ...n, source: 'normal' })),
          ...formattedStoryNotifications
        ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        console.log('📋 All notifications loaded:', allNotifications);
        setNotifications(allNotifications);

        const unread = allNotifications.filter(n => !n.read).length;
        setUnreadCount(unread);

      } catch (error) {
        console.error('Error fetching notifications:', error);
        // En cas d'erreur, charger seulement les notifications normales
        try {
          const response = await notificationsAPI.getAll();
          const data = response.data.results || response.data;
          setNotifications(data);
          const unread = data.filter(n => !n.read).length;
          setUnreadCount(unread);
        } catch (fallbackError) {
          console.error('Error fetching fallback notifications:', fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialNotifications();
  }, []);

  useEffect(() => {
    const connectWebSocket = () => {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        console.error('❌ No access token found');
        return null;
      }

      const websocket = new WebSocket(
        `ws://localhost:8000/ws/notifications/?token=${token}`
      );

      websocket.onopen = () => {
        console.log('✅ Connected to notifications WebSocket');
        setIsConnected(true);
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', data);
          
          switch (data.type) {
            case 'notification':
              console.log('🎯 New notification:', data.notification);
              setNotifications(prev => [data.notification, ...prev]);
              setUnreadCount(prev => prev + 1);
              break;
            case 'story_notification':
              console.log('📖 New story notification:', data.notification);
              const formattedStoryNotif = formatStoryNotification(data.notification);
              setNotifications(prev => [formattedStoryNotif, ...prev]);
              setUnreadCount(prev => prev + 1);
              break;
            case 'unread_count':
              console.log('📢 Unread count:', data.count);
              setUnreadCount(data.count);
              break;
            default:
              console.log('Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      websocket.onclose = (event) => {
        console.log('🔌 Disconnected from notifications WebSocket:', event.code, event.reason);
        setIsConnected(false);
        
        if (event.code !== 1000) {
          console.log('🔄 Attempting to reconnect in 3 seconds...');
          setTimeout(connectWebSocket, 3000);
        }
      };

      websocket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setIsConnected(false);
      };

      return websocket;
    };

    const websocket = connectWebSocket();
    if (websocket) {
      setWs(websocket);
    }

    return () => {
      if (websocket) {
        console.log('🧹 Cleaning up WebSocket connection');
        websocket.close(1000, 'Component unmounted');
      }
    };
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      // Mise à jour optimiste
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Déterminer le type de notification
      const notification = notifications.find(n => n.id === notificationId);
      
      if (notification && notification.source === 'story') {
        // C'est une notification de story
        const storyNotifId = notificationId.replace('story_', '');
        await storyNotificationsAPI.markAsRead(storyNotifId);
        
        // Envoyer via WebSocket si connecté
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'mark_story_read',
            notification_id: storyNotifId
          }));
        }
      } else {
        // C'est une notification normale
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'mark_read',
            notification_id: notificationId
          }));
        }
        await notificationsAPI.markAsRead(notificationId);
      }
      
    } catch (error) {
      console.error('Error marking as read:', error);
      // Revert optimistic update en cas d'erreur
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: false } : notif
        )
      );
      setUnreadCount(prev => prev + 1);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Mise à jour optimiste
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
      
      // Marquer toutes les notifications normales comme lues
      await notificationsAPI.markAllAsRead();
      
      // Marquer toutes les notifications de stories comme lues
      const storyNotificationsToMark = notifications
        .filter(n => n.source === 'story' && !n.read)
        .map(n => n.id.replace('story_', ''));
      
      for (const storyNotifId of storyNotificationsToMark) {
        await storyNotificationsAPI.markAsRead(storyNotifId);
      }
      
      // Envoyer via WebSocket
      if (ws && ws.readyState === WebSocket.OPEN) {
        notifications.forEach(notif => {
          if (!notif.read) {
            if (notif.source === 'story') {
              ws.send(JSON.stringify({
                type: 'mark_story_read',
                notification_id: notif.id.replace('story_', '')
              }));
            } else {
              ws.send(JSON.stringify({
                type: 'mark_read',
                notification_id: notif.id
              }));
            }
          }
        });
      }
      
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return { 
    notifications: Array.isArray(notifications) ? notifications : [],
    unreadCount, 
    markAsRead,
    markAllAsRead,
    isConnected,
    loading
  };
};

export default useNotifications;