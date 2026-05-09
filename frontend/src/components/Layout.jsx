import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileMenu from './MobileMenu';
import StoriesSidebar from './StoriesSidebar';
import { useAuth } from '../contexts/AuthContext';
import { notificationsAPI, messagesAPI } from '../services/api';

const Layout = ({ children, onCreatePost }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [messagesCount, setMessagesCount] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Pages où on veut CACHER la sidebar droite (stories)
  const hideRightSidebarPages = [
    '/profile',
    '/messages',
    '/notifications',
    '/explore',
    '/follow-request'
  ];

  // Vérifier si on doit cacher la sidebar droite
  const shouldHideRightSidebar = hideRightSidebarPages.some(path => 
    location.pathname.startsWith(path)
  );

  useEffect(() => {
    const path = location.pathname;
    if (path === '/') setActiveTab('home');
    else if (path === '/explore') setActiveTab('explore');
    else if (path === '/notifications') setActiveTab('notifications');
    else if (path === '/messages') setActiveTab('messages');
    else if (path.startsWith('/profile')) setActiveTab('profile');
  }, [location]);

  const fetchUnreadCounts = async () => {
    try {
      console.log('🔄 Récupération des compteurs non lus...');
      
      // Récupérer les notifications
      const notificationsResponse = await notificationsAPI.getAll();
      console.log('📋 Réponse notifications:', notificationsResponse.data);
      
      let unreadNotificationsCount = 0;
      
      // Gérer différentes structures de réponse
      if (Array.isArray(notificationsResponse.data)) {
        // Si c'est un tableau directement
        unreadNotificationsCount = notificationsResponse.data.filter(notif => !notif.read).length;
      } else if (notificationsResponse.data.results && Array.isArray(notificationsResponse.data.results)) {
        // Si c'est un objet avec pagination (results)
        unreadNotificationsCount = notificationsResponse.data.results.filter(notif => !notif.read).length;
      } else if (notificationsResponse.data.notifications && Array.isArray(notificationsResponse.data.notifications)) {
        // Si c'est un objet avec clé 'notifications'
        unreadNotificationsCount = notificationsResponse.data.notifications.filter(notif => !notif.read).length;
      } else if (notificationsResponse.data.unread_count !== undefined) {
        // Si l'API retourne directement le compteur
        unreadNotificationsCount = notificationsResponse.data.unread_count;
      } else {
        console.warn('⚠️ Structure de données notifications non reconnue:', notificationsResponse.data);
        unreadNotificationsCount = 0;
      }
      
      setNotificationsCount(unreadNotificationsCount);
      console.log(`🔔 Notifications non lues: ${unreadNotificationsCount}`);

      // Récupérer les conversations avec messages non lus
      const messagesResponse = await messagesAPI.getConversations();
      console.log('📋 Réponse messages:', messagesResponse.data);
      
      let unreadMessagesCount = 0;
      
      if (Array.isArray(messagesResponse.data)) {
        // Si c'est un tableau de conversations
        unreadMessagesCount = messagesResponse.data.reduce((count, conv) => {
          return count + (conv.unread_count || 0);
        }, 0);
      } else if (messagesResponse.data.results && Array.isArray(messagesResponse.data.results)) {
        // Si c'est un objet avec pagination (results)
        unreadMessagesCount = messagesResponse.data.results.reduce((count, conv) => {
          return count + (conv.unread_count || 0);
        }, 0);
      } else if (messagesResponse.data.conversations && Array.isArray(messagesResponse.data.conversations)) {
        // Si c'est un objet avec clé 'conversations'
        unreadMessagesCount = messagesResponse.data.conversations.reduce((count, conv) => {
          return count + (conv.unread_count || 0);
        }, 0);
      } else if (messagesResponse.data.unread_count !== undefined) {
        // Si l'API retourne directement le compteur
        unreadMessagesCount = messagesResponse.data.unread_count;
      } else {
        console.warn('⚠️ Structure de données messages non reconnue:', messagesResponse.data);
        unreadMessagesCount = 0;
      }
      
      setMessagesCount(unreadMessagesCount);
      console.log(`✉️ Messages non lus: ${unreadMessagesCount}`);

    } catch (error) {
      console.error('❌ Erreur lors de la récupération des compteurs:', error);
      // En cas d'erreur, on met à zéro pour éviter d'afficher de fausses informations
      setNotificationsCount(0);
      setMessagesCount(0);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      // Chargement initial
      fetchUnreadCounts();
      
      // Actualiser périodiquement (toutes les 30 secondes)
      const interval = setInterval(fetchUnreadCounts, 30000);
      
      // Nettoyer l'intervalle quand le composant est démonté ou quand l'utilisateur se déconnecte
      return () => clearInterval(interval);
    } else {
      // Reset des compteurs quand l'utilisateur n'est pas authentifié
      setNotificationsCount(0);
      setMessagesCount(0);
    }
  }, [isAuthenticated]);

  // Recharger les compteurs quand on change de page (surtout après avoir visité les notifications/messages)
  useEffect(() => {
    if (isAuthenticated && (location.pathname === '/notifications' || location.pathname === '/messages')) {
      // Petit délai pour laisser le temps à la page de traiter les marquages comme lus
      setTimeout(() => {
        fetchUnreadCounts();
      }, 1000);
    }
  }, [location.pathname, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Sidebar Desktop */}
      <div className={`hidden lg:block transition-all duration-300 ${
        isSidebarCollapsed ? 'w-20' : 'w-72'
      } flex-shrink-0`}>
        <Sidebar 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          notifications={notificationsCount}
          messages={messagesCount}
          onCollapseChange={setIsSidebarCollapsed}
          onCreatePost={onCreatePost}
        />
      </div>

      {/* Contenu Principal */}
<div className="flex-1 flex flex-col min-h-screen transition-all duration-300">        {/* Header Mobile */}
<header className="lg:hidden sticky top-0 z-40 p-4 bg-white border-b border-gray-200 shadow-sm">          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-3 rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95 bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md hover:shadow-lg"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-r from-pink-500 to-purple-600 shadow-lg">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                Moodly
              </h1>
            </div>
            
            <div className="w-12"></div>
          </div>
        </header>

        {/* Container du contenu */}
        <div className="flex-1 flex">
          {/* Contenu principal */}
          <div className={`flex-1 transition-all duration-300 ${
      shouldHideRightSidebar ? 'w-full' : 'xl:mr-80'
    }`}>
      <main className={`w-full p-4 lg:p-6 transition-all duration-300`}>
        <div className={`w-full mx-auto space-y-6 ${
          shouldHideRightSidebar ? 'max-w-4xl' : 'max-w-2xl'
        }`}>
          {children}
        </div>
      </main>
    </div>

           {!shouldHideRightSidebar && (
      <div className="hidden xl:block w-80 flex-shrink-0 fixed right-0 top-0 h-screen overflow-y-auto">
        <StoriesSidebar />
      </div>
    )}
  </div>
</div>

      {/* Menu Mobile */}
      <MobileMenu 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        notifications={notificationsCount}
        messages={messagesCount}
        onCreatePost={onCreatePost}
      />
    </div>
  );
};

export default Layout;