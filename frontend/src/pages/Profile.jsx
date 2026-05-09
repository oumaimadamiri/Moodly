import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, 
  MapPin, 
  Edit, 
  UserPlus, 
  UserCheck,
  MessageCircle,
  Image,
  Heart,
  Camera,
  X,
  Save,
  Settings,
  Users,
  Lock
} from 'lucide-react';
import PostCard from '../components/PostCard';
import AccountManager from '../components/AccountManager';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI, postsAPI, authAPI } from '../services/api';
import { useParams, useNavigate } from 'react-router-dom';
import DeleteAccount from '../components/DeleteAccount';

// Composant Modal amélioré
const UserListModal = ({ 
  isOpen, 
  onClose, 
  title, 
  users, 
  loading,
  onFollow,
  onUnfollow,
  currentUser,
  handleUsernameClick
}) => {
  if (!isOpen) return null;

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
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '480px',
        maxHeight: '80vh',
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#fafafa'
        }}>
          <h3 style={{
            color: '#1f2937',
            fontSize: '18px',
            fontWeight: '600',
            margin: 0
          }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#6b7280',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
              e.currentTarget.style.color = '#374151';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{
          maxHeight: 'calc(80vh - 80px)',
          overflowY: 'auto'
        }}>
          {loading ? (
            <div style={{
              padding: '60px 20px',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                border: '3px solid #e5e7eb',
                borderTop: '3px solid #ec4899',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px'
              }} />
              <p>Chargement...</p>
            </div>
          ) : users.length === 0 ? (
            <div style={{
              padding: '60px 20px',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              <Users size={40} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <p style={{ fontSize: '14px' }}>Aucun utilisateur</p>
            </div>
          ) : (
            users.map((user, index) => (
              <div
                key={user.id}
                style={{
                  padding: '16px 24px',
                  borderBottom: index < users.length - 1 ? '1px solid #e5e7eb' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <div 
                    onClick={() => handleUsernameClick(user.username)}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      backgroundColor: user.profile_picture ? 'transparent' : '#ec4899',
                      backgroundImage: user.profile_picture ? `url(${user.profile_picture})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      cursor: 'pointer',
                      border: '2px solid #f3f4f6'
                    }}
                  >
                    {!user.profile_picture && (user.username?.charAt(0).toUpperCase() || 'U')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div 
                      onClick={() => handleUsernameClick(user.username)}
                      style={{
                        color: '#1f2937',
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'color 0.2s ease',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.color = '#ec4899';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.color = '#1f2937';
                      }}
                    >
                      {user.full_name || user.username}
                    </div>
                    <div style={{
                      color: '#6b7280',
                      fontSize: '12px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      @{user.username}
                    </div>
                  </div>
                </div>

                {currentUser && user.username !== currentUser.username && (
                  <button
                    onClick={() => 
                      user.is_following 
                        ? onUnfollow(user)
                        : onFollow(user)
                    }
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '500',
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: user.is_following ? '#f3f4f6' : '#ec4899',
                      color: user.is_following ? '#374151' : '#ffffff',
                      border: user.is_following ? '1px solid #d1d5db' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (user.is_following) {
                        e.currentTarget.style.backgroundColor = '#fee2e2';
                        e.currentTarget.style.color = '#dc2626';
                        e.currentTarget.style.borderColor = '#fecaca';
                      } else {
                        e.currentTarget.style.backgroundColor = '#db2777';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (user.is_following) {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                        e.currentTarget.style.color = '#374151';
                        e.currentTarget.style.borderColor = '#d1d5db';
                      } else {
                        e.currentTarget.style.backgroundColor = '#ec4899';
                      }
                    }}
                  >
                    {user.is_following ? 'Suivi' : 'Suivre'}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Composant principal
const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [canViewPosts, setCanViewPosts] = useState(true);
  const [followStatus, setFollowStatus] = useState({
    isFollowing: false,
    requestPending: false
  });
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0
  });

  const [likedPosts, setLikedPosts] = useState([]);
  const [likedPostsLoading, setLikedPostsLoading] = useState(false);
  
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    location: ''
  });

  const [tabs, setTabs] = useState([
    { id: 'posts', label: 'Publications', icon: Edit, count: 0 },
    { id: 'media', label: 'Médias', icon: Image, count: 0 },
    { id: 'likes', label: 'J\'aime', icon: Heart, count: 0 }
  ]);

  const moroccanCities = [
    'Maroc',
    'Casablanca, Maroc',
    'Rabat, Maroc',
    'Marrakech, Maroc',
    'Fès, Maroc',
    'Tanger, Maroc',
    'Agadir, Maroc',
    'Meknès, Maroc',
    'Oujda, Maroc',
    'Tétouan, Maroc'
  ];

  const isOwnProfile = !username || username === currentUser?.username;
  const profileUsername = username || currentUser?.username;

  // Fonction pour récupérer les posts likés
  const fetchLikedPosts = async () => {
    setLikedPostsLoading(true);
    try {
      const response = await postsAPI.getAll();
      let allPosts = [];
      
      if (Array.isArray(response.data)) {
        allPosts = response.data;
      } else if (response.data.results) {
        allPosts = response.data.results;
      } else if (response.data.posts) {
        allPosts = response.data.posts;
      }
      
      // Filtrer les posts likés par l'utilisateur actuel
      const userLikedPosts = allPosts.filter(post => post.is_liked);
      console.log('❤️ Posts likés trouvés:', userLikedPosts);
      setLikedPosts(userLikedPosts);
    } catch (error) {
      console.error('Error fetching liked posts:', error);
    } finally {
      setLikedPostsLoading(false);
    }
  };

  // Effet pour charger les posts likés
  useEffect(() => {
    if (activeTab === 'likes' && canViewPosts) {
      fetchLikedPosts();
    }
  }, [activeTab, canViewPosts]);

  useEffect(() => {
    if (profileUsername) {
      fetchUserData();
    }
  }, [profileUsername]);

  useEffect(() => {
    if (profile && isEditing) {
      setEditForm({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        bio: profile.bio || '',
        location: profile.location || ''
      });
    }
  }, [profile, isEditing]);

  useEffect(() => {
    if (posts.length > 0) {
      const mediaCount = posts.filter(post => post.image).length;
      const likedCount = posts.filter(post => post.is_liked).length;
      
      setTabs(prev => prev.map(tab => {
        if (tab.id === 'media') return { ...tab, count: mediaCount };
        if (tab.id === 'likes') return { ...tab, count: likedCount };
        return tab;
      }));
    }
  }, [posts]);

  const getLocationSuggestions = (input) => {
    if (!input || input.length < 2) return [];
    
    const lowerInput = input.toLowerCase();
    return moroccanCities
      .filter(city => city.toLowerCase().includes(lowerInput))
      .slice(0, 5);
  };

  const handleLocationChange = (value) => {
    setEditForm(prev => ({ ...prev, location: value }));
    const suggestions = getLocationSuggestions(value);
    setLocationSuggestions(suggestions);
    setShowSuggestions(suggestions.length > 0 && value.length > 0);
  };

  const handleLocationSelect = (selectedLocation) => {
    setEditForm(prev => ({ ...prev, location: selectedLocation }));
    setShowSuggestions(false);
  };

  const fetchUserData = async () => {
    setLoading(true);
    setError(null);
    try {
      const profileResponse = await usersAPI.getProfile(profileUsername);
      const profileData = profileResponse.data;
      setProfile(profileData);
      setIsPrivate(profileData.is_private || false);
      setCanViewPosts(profileData.can_view_posts);
      
      if (!isOwnProfile && currentUser) {
        setFollowStatus({
          isFollowing: profileData.is_following || false,
          requestPending: profileData.request_pending || false
        });
        setIsFollowing(profileData.is_following || false);
      }

      // Récupérer les posts de l'utilisateur spécifique
      const postsResponse = await postsAPI.getAll();
      let userPosts = [];
      
      if (Array.isArray(postsResponse.data)) {
        userPosts = postsResponse.data.filter(post => 
          post.author && post.author.username === profileUsername
        );
      } else if (postsResponse.data.results) {
        userPosts = postsResponse.data.results.filter(post => 
          post.author && post.author.username === profileUsername
        );
      } else if (postsResponse.data.posts) {
        userPosts = postsResponse.data.posts.filter(post => 
          post.author && post.author.username === profileUsername
        );
      }
      
      console.log('📝 Posts filtrés pour', profileUsername, ':', userPosts);
      
      setPosts(userPosts);
      
      // Récupérer TOUS les posts likés par l'utilisateur
      let allPosts = [];
      if (Array.isArray(postsResponse.data)) {
        allPosts = postsResponse.data;
      } else if (postsResponse.data.results) {
        allPosts = postsResponse.data.results;
      } else if (postsResponse.data.posts) {
        allPosts = postsResponse.data.posts;
      }
      
      // Filtrer les posts likés par l'utilisateur actuel
      const likedPosts = allPosts.filter(post => post.is_liked);
      console.log('❤️ Posts likés par', profileUsername, ':', likedPosts);

      const mediaPosts = userPosts.filter(post => post.image).length;
      
      setStats({
        posts: userPosts.length,
        followers: profileData.followers_count || 0,
        following: profileData.following_count || 0
      });

      // Mettre à jour les onglets avec les bonnes données
      setTabs(prev => prev.map(tab => {
        if (tab.id === 'media') return { ...tab, count: mediaPosts };
        if (tab.id === 'likes') return { ...tab, count: likedPosts.length };
        return tab;
      }));

    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowers = async () => {
    setModalLoading(true);
    try {
      const response = await usersAPI.getFollowers(profileUsername);
      setFollowers(response.data);
      setShowFollowersModal(true);
    } catch (error) {
      console.error('Error fetching followers:', error);
      alert('Erreur lors du chargement des abonnés');
    } finally {
      setModalLoading(false);
    }
  };

  const fetchFollowing = async () => {
    setModalLoading(true);
    try {
      const response = await usersAPI.getFollowing(profileUsername);
      setFollowing(response.data);
      setShowFollowingModal(true);
    } catch (error) {
      console.error('Error fetching following:', error);
      alert('Erreur lors du chargement des abonnements');
    } finally {
      setModalLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser || isOwnProfile) return;
    
    setFollowLoading(true);
    try {
      if (followStatus.isFollowing) {
        await usersAPI.unfollow(profileUsername);
        setFollowStatus({ isFollowing: false, requestPending: false });
        setIsFollowing(false);
        setStats(prev => ({
          ...prev,
          followers: Math.max(0, prev.followers - 1)
        }));
      } else if (followStatus.requestPending) {
        await usersAPI.cancelFollowRequest(profileUsername);
        setFollowStatus({ isFollowing: false, requestPending: false });
        setIsFollowing(false);
      } else {
        const response = await usersAPI.follow(profileUsername);
        const responseData = response.data || response;
      
        const isFollowingNow = responseData.is_following === true;
        const isPending = responseData.request_pending === true;
        
        if (isFollowingNow) {
          setFollowStatus({ isFollowing: true, requestPending: false });
          setIsFollowing(true);
          setStats(prev => ({
            ...prev,
            followers: prev.followers + 1
          }));
        } else if (isPending) {
          setFollowStatus({ isFollowing: false, requestPending: true });
          setIsFollowing(false);
        } else {
          await fetchUserData();
        }
      }
    } catch (error) {
      console.error('Error following user:', error);
      alert('Erreur lors de l\'opération de follow');
      await fetchUserData();
    } finally {
      setFollowLoading(false);
    }
  };

  const handleEditProfile = () => setIsEditing(true);
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    setProfileImage(null);
    setCoverImage(null);
    setShowSuggestions(false);
  };

  const handleSaveProfile = async () => {
    setEditLoading(true);
    try {
      const formData = new FormData();
      
      if (editForm.first_name !== profile?.first_name) {
        formData.append('first_name', editForm.first_name);
      }
      if (editForm.last_name !== profile?.last_name) {
        formData.append('last_name', editForm.last_name);
      }
      if (editForm.bio !== profile?.bio) {
        formData.append('bio', editForm.bio);
      }
      if (editForm.location !== profile?.location) {
        formData.append('location', editForm.location);
      }
      
      if (profileImage) {
        formData.append('profile_picture', profileImage);
      }
      if (coverImage) {
        formData.append('cover_picture', coverImage);
      }

      const response = await authAPI.updateProfile(formData);
      const updatedProfile = response.data;
      
      setProfile(updatedProfile);
      if (updateUser) {
        updateUser(updatedProfile);
      }
      setIsEditing(false);
      setProfileImage(null);
      setCoverImage(null);
      setShowSuggestions(false);
      
      await fetchUserData();
      
      alert('Profil mis à jour avec succès!');
      
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Erreur lors de la mise à jour du profil');
    } finally {
      setEditLoading(false);
    }
  };

  const handleImageChange = (event, type) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('La taille de l\'image ne doit pas dépasser 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner une image valide');
        return;
      }

      if (type === 'profile') {
        setProfileImage(file);
      } else if (type === 'cover') {
        setCoverImage(file);
      }
    }
  };

  const handleRemoveImage = (type) => {
    if (type === 'profile') {
      setProfileImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else if (type === 'cover') {
      setCoverImage(null);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts(posts.map(post => 
      post.id === updatedPost.id ? updatedPost : post
    ));
  };

  const handlePostDelete = (postId) => {
    setPosts(posts.filter(post => post.id !== postId));
  };

  const handleUsernameClick = (clickedUsername) => {
    if (clickedUsername && clickedUsername !== profileUsername) {
      navigate(`/profile/${clickedUsername}`);
    }
  };

  const formatJoinDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long' };
    return `Rejoint en ${date.toLocaleDateString('fr-FR', options)}`;
  };

  // FONCTION CORRIGÉE POUR LA REDIRECTION VERS LES MESSAGES
  const handleMessageRedirect = () => {
    console.log('🎯 Redirection vers messages avec:', profile);
    
    if (!profile) {
      console.error('❌ Profil non chargé');
      return;
    }

    // Préparer les données de l'utilisateur cible
    const targetUser = {
      id: profile.id,
      username: profile.username,
      full_name: profile.full_name || profile.username,
      profile_picture: profile.profile_picture
    };

    console.log('📤 Envoi vers messages avec:', targetUser);
    
    // Redirection vers la page des messages avec l'utilisateur cible
    navigate('/messages', { 
      state: { 
        targetUser: targetUser
      }
    });
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #f3f4f6',
          borderTop: '3px solid #ec4899',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px',
        padding: '20px'
      }}>
        <div style={{ color: '#ec4899', fontSize: '16px', textAlign: 'center' }}>
          {error}
        </div>
        <button
          onClick={fetchUserData}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ec4899',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: '#374151', fontSize: '16px' }}>
          Utilisateur non trouvé
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff'
    }}>
      {/* Header avec image de couverture */}
      <div style={{ position: 'relative' }}>
        <div 
          style={{
            height: '250px',
            width: '100%',
            background: coverImage 
              ? `url(${URL.createObjectURL(coverImage)}) center/cover no-repeat`
              : (profile?.cover_picture 
                  ? `url(${profile.cover_picture}) center/cover no-repeat`
                  : 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)'),
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative'
          }}
        >
          {isEditing && (
            <div style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              display: 'flex',
              gap: '8px'
            }}>
              <input
                type="file"
                ref={coverInputRef}
                accept="image/*"
                onChange={(e) => handleImageChange(e, 'cover')}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => coverInputRef.current?.click()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                <Camera size={14} />
                {coverImage || profile?.cover_picture ? 'Changer' : 'Ajouter'}
              </button>
            </div>
          )}
        </div>

        {/* Informations du profil */}
        <div style={{ 
          position: 'relative',
          maxWidth: '800px',
          margin: '0 auto',
          padding: '0 20px'
        }}>
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            marginTop: '-80px',
            paddingBottom: '30px'
          }}>
            {/* Avatar et informations */}
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              marginBottom: '20px'
            }}>
              {/* Avatar */}
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <div style={{ 
                  width: '120px',
                  height: '120px',
                  borderRadius: '16px',
                  border: '4px solid #ffffff',
                  backgroundColor: profileImage || profile?.profile_picture ? 'transparent' : '#ec4899',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '36px',
                  fontWeight: 'bold',
                  backgroundImage: profileImage 
                    ? `url(${URL.createObjectURL(profileImage)})`
                    : (profile?.profile_picture ? `url(${profile.profile_picture})` : 'none'),
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}>
                  {!profileImage && !profile?.profile_picture && (profile?.username?.charAt(0).toUpperCase() || 'U')}
                </div>
                
                {isEditing && (
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    display: 'flex',
                    gap: '4px'
                  }}>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, 'profile')}
                      style={{ display: 'none' }}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        backgroundColor: '#ec4899',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(236, 72, 153, 0.3)'
                      }}
                    >
                      <Camera size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Informations utilisateur */}
              <div style={{ flex: 1 }}>
                {isEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <input
                        type="text"
                        value={editForm.first_name}
                        onChange={(e) => handleInputChange('first_name', e.target.value)}
                        placeholder="Prénom"
                        style={{
                          flex: 1,
                          padding: '12px',
                          backgroundColor: '#f9fafb',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          color: '#374151',
                          fontSize: '16px'
                        }}
                      />
                      <input
                        type="text"
                        value={editForm.last_name}
                        onChange={(e) => handleInputChange('last_name', e.target.value)}
                        placeholder="Nom"
                        style={{
                          flex: 1,
                          padding: '12px',
                          backgroundColor: '#f9fafb',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          color: '#374151',
                          fontSize: '16px'
                        }}
                      />
                    </div>
                    
                    <p style={{ 
                      color: '#6b7280',
                      fontSize: '16px',
                      margin: '0'
                    }}>
                      @{profile?.username}
                    </p>
                    
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      placeholder="Ajoutez une bio..."
                      rows={3}
                      style={{
                        padding: '12px',
                        backgroundColor: '#f9fafb',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        color: '#374151',
                        fontSize: '14px',
                        resize: 'vertical',
                        minHeight: '80px'
                      }}
                    />

                    <div style={{ position: 'relative' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={16} color="#6b7280" />
                        <input
                          type="text"
                          value={editForm.location}
                          onChange={(e) => handleLocationChange(e.target.value)}
                          placeholder="Commencez à taper une ville du Maroc..."
                          style={{
                            flex: 1,
                            padding: '12px',
                            backgroundColor: '#f9fafb',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            color: '#374151',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                      
                      {showSuggestions && locationSuggestions.length > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: '24px',
                          right: 0,
                          backgroundColor: '#ffffff',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          zIndex: 100,
                          marginTop: '4px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                        }}>
                          {locationSuggestions.map((suggestion, index) => (
                            <div
                              key={suggestion}
                              onClick={() => handleLocationSelect(suggestion)}
                              style={{
                                padding: '12px',
                                cursor: 'pointer',
                                borderBottom: index < locationSuggestions.length - 1 
                                  ? '1px solid #e5e7eb' 
                                  : 'none',
                                color: '#374151',
                                fontSize: '14px'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#f3f4f6';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                              }}
                            >
                              {suggestion}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 style={{ 
                      fontSize: '28px',
                      fontWeight: 'bold',
                      color: '#1f2937',
                      margin: '0 0 4px 0'
                    }}>
                      {profile?.full_name || profile?.username}
                    </h1>
                    <p style={{ 
                      color: '#6b7280',
                      fontSize: '18px',
                      margin: '0 0 12px 0'
                    }}>
                      @{profile?.username}
                    </p>
                    
                    {profile?.bio && (
                      <p style={{ 
                        color: '#4b5563',
                        marginBottom: '12px',
                        lineHeight: '1.5'
                      }}>
                        {profile.bio}
                      </p>
                    )}

                    <div style={{ 
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '16px',
                      fontSize: '14px',
                      color: '#6b7280'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={16} />
                        <span>{formatJoinDate(profile?.created_at)}</span>
                      </div>
                      {profile?.location && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={16} />
                          <span>{profile.location}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Boutons d'action */}
            <div style={{ 
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              alignItems: 'center'
            }}>
              {isOwnProfile ? (
                isEditing ? (
                  <>
                    <button
                      onClick={handleSaveProfile}
                      disabled={editLoading}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        backgroundColor: '#ec4899',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        opacity: editLoading ? 0.6 : 1
                      }}
                    >
                      {editLoading ? (
                        <div style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid currentColor',
                          borderTopColor: 'transparent',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }} />
                      ) : (
                        <Save size={18} />
                      )}
                      Enregistrer
                    </button>
                    
                    <button
                      onClick={handleCancelEdit}
                      disabled={editLoading}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      <X size={18} />
                      Annuler
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={handleEditProfile}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      <Edit size={18} />
                      Modifier le profil
                    </button>
                    
                    <button 
                      onClick={() => setShowSettings(!showSettings)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      <Settings size={18} />
                      Paramètres
                    </button>
                  </>
                )
              ) : (
                <>
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      fontWeight: '500',
                      cursor: followLoading ? 'default' : 'pointer',
                      backgroundColor: followStatus.isFollowing 
                        ? '#f3f4f6' 
                        : followStatus.requestPending
                          ? '#f3f4f6'
                          : '#ec4899',
                      color: followStatus.isFollowing || followStatus.requestPending ? '#374151' : '#ffffff',
                      border: (followStatus.isFollowing || followStatus.requestPending) ? '1px solid #d1d5db' : 'none',
                      opacity: followLoading ? 0.6 : 1
                    }}
                  >
                    {followLoading ? (
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid currentColor',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                    ) : followStatus.isFollowing ? (
                      <>
                        <UserCheck size={18} />
                        Suivi
                      </>
                    ) : followStatus.requestPending ? (
                      <>
                        <UserCheck size={18} />
                        Demande envoyée
                      </>
                    ) : (
                      <>
                        <UserPlus size={18} />
                        Suivre
                      </>
                    )}
                  </button>
                  
                  {/* BOUTON MESSAGE CORRIGÉ */}
                  <button 
                    onClick={handleMessageRedirect}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    <MessageCircle size={18} />
                    Message
                  </button>
                </>
              )}
            </div>

            {/* Section Paramètres */}
            {showSettings && isOwnProfile && (
              <div style={{ 
                marginTop: '20px',
                padding: '20px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <h3 style={{ 
                  color: '#1f2937', 
                  margin: '0 0 15px 0',
                  fontSize: '18px'
                }}>
                  Paramètres
                </h3>
                
                {/* Gestion des comptes */}
                <div style={{ marginBottom: '15px' }}>
                  <AccountManager />
                </div>
                
                {/* Paramètres de confidentialité */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '15px',
                  padding: '15px',
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div>
                    <div style={{ color: '#1f2937', fontWeight: '500' }}>
                      Compte privé
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '14px' }}>
                      {isPrivate 
                        ? 'Seuls vos abonnés approuvés peuvent voir vos posts' 
                        : 'Tout le monde peut voir vos posts'
                      }
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        await usersAPI.updatePrivacySettings({ 
                          is_private: !isPrivate 
                        });
                        setIsPrivate(!isPrivate);
                        alert('Paramètres mis à jour');
                      } catch (error) {
                        console.error('Error updating privacy:', error);
                        alert('Erreur lors de la mise à jour');
                      }
                    }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: isPrivate ? '#ec4899' : '#f3f4f6',
                      color: isPrivate ? '#ffffff' : '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    {isPrivate ? 'Privé' : 'Public'}
                  </button>
                </div>
                
                {/* Suppression de compte */}
                <DeleteAccount />
              </div>
            )}
          </div>

          {/* Statistiques */}
          <div style={{ 
            display: 'flex',
            gap: '40px',
            padding: '20px 0',
            borderTop: '1px solid #e5e7eb'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#1f2937'
              }}>
                {stats.posts}
              </div>
              <div style={{ 
                fontSize: '14px',
                color: '#6b7280'
              }}>
                Publications
              </div>
            </div>
            <div 
              style={{ 
                textAlign: 'center', 
                cursor: 'pointer'
              }}
              onClick={fetchFollowers}
            >
              <div style={{ 
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#1f2937'
              }}>
                {stats.followers}
              </div>
              <div style={{ 
                fontSize: '14px',
                color: '#6b7280'
              }}>
                Abonnés
              </div>
            </div>
            <div 
              style={{ 
                textAlign: 'center', 
                cursor: 'pointer'
              }}
              onClick={fetchFollowing}
            >
              <div style={{ 
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#1f2937'
              }}>
                {stats.following}
              </div>
              <div style={{ 
                fontSize: '14px',
                color: '#6b7280'
              }}>
                Abonnements
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div style={{ 
        maxWidth: '800px',
        margin: '0 auto',
        padding: '0 20px 30px 20px'
      }}>
        {/* Navigation par onglets */}
        <div style={{ 
          borderBottom: '1px solid #e5e7eb',
          marginBottom: '30px'
        }}>
          <div style={{ display: 'flex', gap: '30px' }}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '16px 4px',
                    borderBottom: `2px solid ${activeTab === tab.id ? '#ec4899' : 'transparent'}`,
                    fontWeight: '500',
                    fontSize: '14px',
                    color: activeTab === tab.id ? '#ec4899' : '#6b7280',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Contenu des onglets */}
        <div>
          {activeTab === 'posts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {!canViewPosts && isPrivate && !isOwnProfile ? (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ 
                    width: '80px',
                    height: '80px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px auto'
                  }}>
                    <Lock size={32} color="#9ca3af" />
                  </div>
                  <h3 style={{ 
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: '8px'
                  }}>
                    Compte privé
                  </h3>
                  <p style={{ color: '#6b7280', marginBottom: '16px' }}>
                    Suivez cet utilisateur pour voir ses posts
                  </p>
                  {!isFollowing && (
                    <button
                      onClick={handleFollow}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#ec4899',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      Envoyer une demande de suivi
                    </button>
                  )}
                  {isFollowing && (
                    <p style={{ color: '#6b7280', fontSize: '14px' }}>
                      Demande en attente d'approbation
                    </p>
                  )}
                </div>
              ) : posts.length > 0 ? (
                posts.map(post => (
                  <PostCard 
                    key={post.id} 
                    post={post}
                    onUpdate={handlePostUpdate}
                    onDelete={handlePostDelete}
                    onUsernameClick={handleUsernameClick}
                  />
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ 
                    width: '80px',
                    height: '80px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px auto'
                  }}>
                    <Edit size={32} color="#9ca3af" />
                  </div>
                  <h3 style={{ 
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: '8px'
                  }}>
                    {isOwnProfile ? 'Aucune publication' : `Aucune publication de ${profile?.username}`}
                  </h3>
                  <p style={{ color: '#6b7280' }}>
                    {isOwnProfile 
                      ? 'Commencez à partager vos pensées avec le monde !' 
                      : 'Cet utilisateur n\'a pas encore publié de contenu.'
                    }
                  </p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'media' && (
            <div>
              {posts.filter(post => post.image).length > 0 ? (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                  gap: '8px' 
                }}>
                  {posts
                    .filter(post => post.image)
                    .map(post => (
                      <div 
                        key={post.id}
                        style={{
                          position: 'relative',
                          aspectRatio: '1',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          // Optionnel: ouvrir une modal avec l'image
                          console.log('Ouvrir image:', post.image);
                        }}
                      >
                        <img 
                          src={post.image} 
                          alt="Post media"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      </div>
                    ))
                  }
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ 
                    width: '80px',
                    height: '80px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px auto'
                  }}>
                    <Image size={32} color="#9ca3af" />
                  </div>
                  <h3 style={{ 
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: '8px'
                  }}>
                    Aucun média
                  </h3>
                  <p style={{ color: '#6b7280' }}>
                    {isOwnProfile 
                      ? 'Les photos et vidéos que vous partagez apparaîtront ici.' 
                      : `${profile?.username} n'a pas encore partagé de média.`
                    }
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'likes' && (
            <div>
              {!canViewPosts && isPrivate && !isOwnProfile ? (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ 
                    width: '80px',
                    height: '80px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px auto'
                  }}>
                    <Lock size={32} color="#9ca3af" />
                  </div>
                  <h3 style={{ 
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: '8px'
                  }}>
                    Compte privé
                  </h3>
                  <p style={{ color: '#6b7280', marginBottom: '16px' }}>
                    Suivez cet utilisateur pour voir ses likes
                  </p>
                </div>
              ) : likedPostsLoading ? (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    border: '3px solid #f3f4f6',
                    borderTop: '3px solid #ec4899',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 16px'
                  }} />
                  <p style={{ color: '#6b7280' }}>Chargement des likes...</p>
                </div>
              ) : likedPosts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {likedPosts.map(post => (
                    <PostCard 
                      key={post.id} 
                      post={post}
                      onUpdate={handlePostUpdate}
                      onDelete={handlePostDelete}
                      onUsernameClick={handleUsernameClick}
                    />
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ 
                    width: '80px',
                    height: '80px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px auto'
                  }}>
                    <Heart size={32} color="#9ca3af" />
                  </div>
                  <h3 style={{ 
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: '8px'
                  }}>
                    Aucun like
                  </h3>
                  <p style={{ color: '#6b7280' }}>
                    {isOwnProfile 
                      ? 'Les publications que vous aimez apparaîtront ici.' 
                      : `${profile?.username} n'a encore liké aucune publication.`
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <UserListModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        title="Abonnés"
        users={followers}
        loading={modalLoading}
        onFollow={async (user) => {
          try {
            await usersAPI.follow(user.username);
            setFollowers(prev => prev.map(u => 
              u.username === user.username 
                ? { ...u, is_following: true }
                : u
            ));
          } catch (error) {
            console.error('Error following user:', error);
          }
        }}
        onUnfollow={async (user) => {
          try {
            await usersAPI.unfollow(user.username);
            setFollowers(prev => prev.map(u => 
              u.username === user.username 
                ? { ...u, is_following: false }
                : u
            ));
          } catch (error) {
            console.error('Error unfollowing user:', error);
          }
        }}
        currentUser={currentUser}
        handleUsernameClick={handleUsernameClick}
      />

      <UserListModal
        isOpen={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
        title="Abonnements"
        users={following}
        loading={modalLoading}
        onFollow={async (user) => {
          try {
            await usersAPI.follow(user.username);
            setFollowing(prev => prev.map(u => 
              u.username === user.username 
                ? { ...u, is_following: true }
                : u
            ));
          } catch (error) {
            console.error('Error following user:', error);
          }
        }}
        onUnfollow={async (user) => {
          try {
            await usersAPI.unfollow(user.username);
            setFollowing(prev => prev.map(u => 
              u.username === user.username 
                ? { ...u, is_following: false }
                : u
            ));
          } catch (error) {
            console.error('Error unfollowing user:', error);
          }
        }}
        currentUser={currentUser}
        handleUsernameClick={handleUsernameClick}
      />

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Profile;