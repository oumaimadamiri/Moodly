import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, UserPlus, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PostCard from '../components/PostCard';
import { postsAPI, usersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('trending');
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [followingStates, setFollowingStates] = useState({});
  const [followingUsers, setFollowingUsers] = useState([]);
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (activeTab === 'trending' || activeTab === 'latest') {
      loadAllData();
    }
  }, [activeTab]);

  // Charger les utilisateurs suivis et les posts
  const loadAllData = async () => {
    setLoading(true);
    try {
      // 1. Charger les utilisateurs suivis
      await fetchFollowingUsers();
      // 2. Charger les posts filtrés
      await fetchFilteredPosts();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les utilisateurs suivis
  const fetchFollowingUsers = async () => {
    try {
      if (currentUser?.username) {
        const response = await usersAPI.getFollowing(currentUser.username);
        const followingData = response.data || [];
        setFollowingUsers(followingData);
        console.log('👥 Utilisateurs suivis dans Explore:', followingData.map(u => u.username));
      }
    } catch (error) {
      console.error('Error fetching following users:', error);
      setFollowingUsers([]);
    }
  };

  // Récupérer et filtrer les posts
  const fetchFilteredPosts = async () => {
    try {
      const response = await postsAPI.getAll();
      if (response.data && (response.data.results || Array.isArray(response.data))) {
        const postsData = response.data.results || response.data;
        
        // FILTRE 1: Ne garder que les posts avec des auteurs valides
        const validPosts = postsData.filter(post => 
          post.author && 
          post.author.username && 
          post.author.id
        );
        
        console.log('📝 Posts valides (auteurs existants):', validPosts.length);
        
        // FILTRE 2: Ne garder que les posts des utilisateurs suivis + VOS PROPRES POSTS
        const followingUsernames = followingUsers.map(user => user.username);
        // Ajouter votre propre nom d'utilisateur à la liste
        if (currentUser?.username) {
          followingUsernames.push(currentUser.username);
        }
        
        console.log('🔍 Filtrage avec utilisateurs suivis + vous-même:', followingUsernames);
        
        const filteredPosts = validPosts.filter(post => {
          const isFromFollowedUser = post.author && followingUsernames.includes(post.author.username);
          return isFromFollowedUser;
        });

        console.log('✅ Posts des utilisateurs suivis + vous-même:', filteredPosts.length);
        
        // Trier par date (plus récents en premier)
        const sortedPosts = filteredPosts.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
        
        setPosts(sortedPosts);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      // Si la recherche est vide, recharger les posts normaux
      if (activeTab === 'trending' || activeTab === 'latest') {
        await fetchFilteredPosts();
      }
      return;
    }

    setLoading(true);
    try {
      if (activeTab === 'users') {
        const response = await usersAPI.search(searchQuery);
        const usersData = response.data.results || response.data;
        
        // Filtrer les utilisateurs valides (non supprimés)
        const validUsers = usersData.filter(user => 
          user.username && user.id
        );
        
        setUsers(validUsers);
        
        const followStates = {};
        validUsers.forEach(user => {
          followStates[user.id] = user.is_followed || false;
        });
        setFollowingStates(followStates);
      } else {
        const response = await postsAPI.getAll();
        const allPosts = response.data.results || response.data;
        
        // Filtrer d'abord les posts avec auteurs valides
        const validPosts = allPosts.filter(post => 
          post.author && 
          post.author.username && 
          post.author.id
        );
        
        // Ensuite appliquer le filtre de recherche uniquement sur les posts des utilisateurs suivis + vous-même
        const followingUsernames = followingUsers.map(user => user.username);
        if (currentUser?.username) {
          followingUsernames.push(currentUser.username);
        }
        
        const searchFilteredPosts = validPosts.filter(post => {
          const isFromFollowedUser = post.author && followingUsernames.includes(post.author.username);
          const matchesSearch = post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (post.author.username && post.author.username.toLowerCase().includes(searchQuery.toLowerCase()));
          
          return isFromFollowedUser && matchesSearch;
        });
        
        setPosts(searchFilteredPosts);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId, username, e) => {
    e.stopPropagation();
    if (!currentUser) {
      alert('Veuillez vous connecter pour suivre des utilisateurs');
      return;
    }

    const isCurrentlyFollowing = followingStates[userId];
    
    try {
      if (isCurrentlyFollowing) {
        await usersAPI.unfollow(username);
        setFollowingStates(prev => ({
          ...prev,
          [userId]: false
        }));
        // Recharger les données après unfollow
        await loadAllData();
      } else {
        await usersAPI.follow(username);
        setFollowingStates(prev => ({
          ...prev,
          [userId]: true
        }));
        // Recharger les données après follow
        await loadAllData();
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
      alert('Erreur lors de l\'opération');
    }
  };

  const handleUserClick = (username) => {
    navigate(`/profile/${username}`);
  };

  const tabs = [
    { id: 'trending', label: 'Tendances', icon: TrendingUp },
    { id: 'latest', label: 'Récent' },
    { id: 'users', label: 'Utilisateurs' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
      <div className="w-full max-w-6xl mx-auto px-4">
        {/* Carte principale - élargie */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-transparent bg-clip-padding w-full" 
          style={{
            backgroundImage: `linear-gradient(white, white), linear-gradient(135deg, #a855f7, #ec4899)`,
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box'
          }}
        >
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Explorer</h2>
            
            {/* Barre de recherche */}
            <form onSubmit={handleSearch} className="relative">
              <Search 
                size={20} 
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder={
                  activeTab === 'users' 
                    ? "Rechercher des utilisateurs..." 
                    : "Rechercher dans vos posts et abonnements..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 focus:border-purple-500 focus:ring-4 focus:ring-purple-200 outline-none transition-all"
              />
            </form>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {tabs.map(tab => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                    activeTab === tab.id 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {IconComponent && <IconComponent size={18} />}
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <p className="mt-3 text-gray-600">Chargement...</p>
            </div>
          ) : (
            <>
              {activeTab === 'trending' || activeTab === 'latest' ? (
                posts.length > 0 ? (
                  <div className="space-y-4">
                    {posts.map(post => (
                      <PostCard 
                        key={post.id} 
                        post={post}
                        onUsernameClick={(username) => handleUserClick(username)}
                        showOwnership={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 rounded-2xl bg-gray-50">
                    <div className="text-6xl mb-4">
                      {currentUser ? '📝' : '🔒'}
                    </div>
                    <p className="text-gray-600 mb-2">
                      {!currentUser 
                        ? 'Connectez-vous pour voir vos posts et ceux des utilisateurs que vous suivez'
                        : searchQuery
                        ? 'Aucune publication correspondante dans vos abonnements'
                        : 'Aucune publication pour le moment'
                      }
                    </p>
                  </div>
                )
              ) : activeTab === 'users' ? (
                users.length > 0 ? (
                  <div className="space-y-3">
                    {users.map(user => {
                      const isFollowing = followingStates[user.id] || false;
                      const isOwnProfile = currentUser && user.username === currentUser.username;
                      
                      return (
                        <div 
                          key={user.id}
                          className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-purple-300 transition-all cursor-pointer hover:shadow-md"
                          onClick={() => handleUserClick(user.username)}
                        >
                          {/* Avatar */}
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white text-lg">
                            {user.username?.charAt(0).toUpperCase()}
                          </div>
                          
                          {/* Informations utilisateur */}
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800">
                              {user.full_name || user.username}
                            </p>
                            <p className="text-gray-600 text-sm">
                              @{user.username}
                            </p>
                          </div>
                          
                          {/* Bouton follow */}
                          {!isOwnProfile && currentUser && (
                            <button
                              onClick={(e) => handleFollow(user.id, user.username, e)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                                isFollowing 
                                  ? 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200' 
                                  : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg'
                              }`}
                            >
                              {isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
                              {isFollowing ? 'Suivi' : 'Suivre'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 rounded-2xl bg-gray-50">
                    <div className="text-6xl mb-4">👥</div>
                    <p className="text-gray-600">
                      {searchQuery ? 'Aucun utilisateur trouvé' : 'Recherchez des utilisateurs à suivre'}
                    </p>
                  </div>
                )
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Explore;