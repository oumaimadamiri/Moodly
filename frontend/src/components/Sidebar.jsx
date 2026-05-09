import React, { useState, useEffect } from 'react';
import { 
  Home, Search, Bell, MessageCircle, User, Plus, LogOut,
  UserPlus, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MoodlyLogo from '../assets/moodly-logo.svg';

const Sidebar = ({ activeTab, setActiveTab, notifications = 0, messages = 0, followRequests = 0, onCollapseChange, onCreatePost }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  useEffect(() => {
    console.log('🎨 Sidebar - Props received:', {
      notifications,
      messages,
      followRequests
    });
  }, [notifications, messages, followRequests]);

  const menuItems = [
    { icon: Home, label: 'Accueil', id: 'home', path: '/' },
    { icon: Search, label: 'Explorer', id: 'explore', path: '/explore' },
    { 
      icon: UserPlus, 
      label: 'Demandes de suivi', 
      id: 'follow-requests', 
      path: '/follow-requests', 
      badge: followRequests
    },
    { icon: Bell, label: 'Notifications', id: 'notifications', path: '/notifications', badge: notifications },
    { icon: MessageCircle, label: 'Messages', id: 'messages', path: '/messages', badge: messages },
    { icon: User, label: 'Profil', id: 'profile', path: '/profile' }
  ];

  const handleNavigation = (item) => {
    setActiveTab(item.id);
    navigate(item.path);
    // Fermer la sidebar après navigation sur mobile
    if (window.innerWidth < 1024) {
      setIsExpanded(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleCreatePost = () => {
    if (onCreatePost) {
      onCreatePost();
    }
    // Fermer la sidebar après création de post
    if (window.innerWidth < 1024) {
      setIsExpanded(false);
    }
  };

  const toggleMobileSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleDesktopSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (onCollapseChange) {
      onCollapseChange(newState);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Overlay pour mobile */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Sidebar Desktop */}
      <div className={`hidden lg:flex h-screen flex-col transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-72'
      } bg-white border-r border-gray-200 shadow-lg sticky top-0`}>
        
        {/* Header compact */}
        <div className="p-4 flex items-center justify-between border-b border-gray-200">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <img 
                src={MoodlyLogo} 
                alt="Moodly Logo" 
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                Moodly
              </h1>
            </div>
          )}
          <button
            onClick={toggleDesktopSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title={isCollapsed ? "Développer" : "Réduire"}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation compacte */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {menuItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                  active 
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg' 
                    : 'text-gray-700 hover:bg-gray-50 hover:shadow-md'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? item.label : ''}
              >
                <div className="relative">
                  <Icon size={isCollapsed ? 20 : 22} />
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 text-xs rounded-full bg-red-500 text-white flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                {!isCollapsed && (
                  <span className="font-medium text-sm">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bouton Publier compact */}
        <div className="p-3">
          <button 
            onClick={handleCreatePost}
            className={`w-full py-2 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 ${
              isCollapsed ? 'p-2' : 'p-3'
            }`}
            title={isCollapsed ? "Nouveau post" : ""}
          >
            <Plus size={18} />
            {!isCollapsed && <span className="text-sm">Nouveau post</span>}
          </button>
        </div>

        {/* Profil utilisateur compact */}
        {user && (
          <div className="p-3 border-t border-gray-200">
            <div 
              className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer hover:bg-gray-50 ${
                isCollapsed ? 'justify-center' : ''
              }`}
              onClick={() => handleNavigation({ path: '/profile' })}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                {user.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.full_name || user.username}</p>
                  <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                </div>
              )}
              {!isCollapsed && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLogout();
                  }}
                  className="p-1 rounded-lg transition-all duration-200 hover:bg-red-50 text-red-500"
                  title="Se déconnecter"
                >
                  <LogOut size={16} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Mobile */}
      <div 
        className={`lg:hidden fixed left-0 top-0 h-screen flex flex-col transition-all duration-300 z-50 ${
          isExpanded ? 'w-80' : 'w-20'
        } bg-white border-r border-gray-200 shadow-lg`}
      >
        {/* Header avec logo cliquable */}
        <div className="p-4 flex items-center justify-center">
          <button 
            onClick={toggleMobileSidebar}
            className="flex items-center gap-3 transition-all duration-200 hover:scale-105 active:scale-95"
            title={isExpanded ? "Réduire la sidebar" : "Développer la sidebar"}
          >
            <img 
              src={MoodlyLogo} 
              alt="Moodly Logo" 
              className={`object-contain transition-all duration-300 ${
                isExpanded ? 'w-8 h-8' : 'w-6 h-6'
              }`}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            {isExpanded && (
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                Moodly
              </h1>
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {menuItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item)}
                className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 relative group ${
                  active ? 'scale-105 shadow-lg' : 'hover:scale-105'
                } ${
                  active 
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isExpanded ? '' : item.label}
              >
                <div className="relative">
                  <Icon size={24} />
                  {item.badge > 0 && (
                    <span className="absolute -top-2 -right-2 px-2 py-1 text-xs rounded-full font-bold min-w-[20px] text-center bg-red-500 text-white shadow-md">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                
                {isExpanded && (
                  <span className="font-semibold transition-all duration-200">
                    {item.label}
                  </span>
                )}

                {/* Indicateur actif */}
                {active && isExpanded && (
                  <div className="absolute right-4 w-2 h-2 rounded-full animate-pulse bg-white" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bouton Publier */}
        <div className="p-4">
          <button 
            className="w-full py-3 rounded-xl font-bold text-white transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            onClick={handleCreatePost}
            title={isExpanded ? '' : "Nouvelle Publication"}
          >
            <Plus size={20} />
            {isExpanded && <span>Nouvelle Publication</span>}
          </button>
        </div>

        {/* Profil Utilisateur */}
        {user && (
          <div className="p-4 border-t border-gray-200">
            <div 
              className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:shadow-lg group"
              onClick={() => handleNavigation({ path: '/profile' })}
              title={isExpanded ? '' : 'Profil'}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-lg relative group-hover:scale-110 transition-transform duration-200 shadow-lg bg-gradient-to-r from-pink-500 to-purple-600">
                {user.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              
              {isExpanded && (
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate transition-colors duration-200 group-hover:text-pink-600 text-gray-900">
                    {user.full_name || user.username}
                  </p>
                  <p className="text-xs truncate text-gray-500">
                    @{user.username}
                  </p>
                </div>
              )}

              {isExpanded && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLogout();
                  }}
                  className="p-2 rounded-lg transition-all duration-200 hover:bg-red-50 hover:scale-110 text-red-500"
                  title="Se déconnecter"
                >
                  <LogOut size={18} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bouton logo pour ouvrir la sidebar sur mobile */}
      <button
        onClick={() => setIsExpanded(true)}
        className="lg:hidden fixed top-4 left-4 z-30 p-2 rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95 bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md hover:shadow-lg"
      >
        <img 
          src={MoodlyLogo} 
          alt="Moodly Logo" 
          className="w-6 h-6 object-contain"
        />
      </button>
    </>
  );
};

export default Sidebar;