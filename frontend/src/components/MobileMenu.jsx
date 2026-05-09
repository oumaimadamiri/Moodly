import React from 'react';
import { Home, Search, Bell, MessageCircle, User, X, UserPlus, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const MobileMenu = ({ 
  isOpen, 
  onClose, 
  activeTab, 
  setActiveTab, 
  notifications = 0, 
  messages = 0,
  followRequests = 0,
  onCreatePost 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

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
    onClose();
  };

  const handleCreatePost = () => {
    if (onCreatePost) {
      onCreatePost();
    }
    onClose();
  };

  const handleLogout = async () => {
    await logout();
    onClose();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Menu */}
      <div className="fixed top-0 left-0 h-screen w-80 p-6 z-50 lg:hidden flex flex-col bg-white border-r border-gray-200 shadow-xl animate-in slide-in-from-left duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              Moodly
            </h1>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 text-gray-600 hover:scale-110 active:scale-95"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          {menuItems.map(item => {
            const active = isActive(item.path);
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 relative group ${
                  active 
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg scale-105' 
                    : 'text-gray-700 hover:bg-gray-50 hover:shadow-md hover:scale-105'
                }`}
              >
                <div className="relative">
                  <Icon size={24} />
                  {item.badge > 0 && (
                    <span className="absolute -top-2 -right-2 px-2 py-0.5 text-xs rounded-full font-bold min-w-[20px] text-center bg-red-500 text-white shadow-md">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                <span className="font-medium">{item.label}</span>
                
                {/* Indicateur actif */}
                {active && (
                  <div className="absolute right-4 w-2 h-2 rounded-full bg-white animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bouton Publier */}
        <div className="mb-6">
          <button 
            onClick={handleCreatePost}
            className="w-full py-3 rounded-xl font-bold text-white transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 hover:scale-105 active:scale-95"
          >
            <span>Nouvelle Publication</span>
          </button>
        </div>

        {/* User info et logout */}
        {user && (
          <div className="mt-auto pt-6 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 cursor-pointer group">
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg bg-gradient-to-r from-pink-500 to-purple-600 shadow-lg group-hover:scale-110 transition-transform">
                {user.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">
                  {user.full_name || user.username}
                </p>
                <p className="text-xs text-gray-600 truncate">
                  @{user.username}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 transition-all duration-200 text-red-600 hover:scale-105 active:scale-95"
            >
              <LogOut size={20} />
              <span className="font-medium">Se déconnecter</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default MobileMenu;