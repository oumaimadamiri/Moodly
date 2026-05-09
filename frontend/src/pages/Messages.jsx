import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, Send, MoreHorizontal, Image, Smile, UserPlus, Users, RefreshCcw,
  Trash2, Mic, X, Check, CheckCircle, Volume2, Play, Pause, Download,
  MoreVertical, Image as ImageIcon, FileText, Video, Copy, Edit3, Globe,
  Eye, EyeOff, ExternalLink, MessageCircle
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { messagesAPI, usersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Messages = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Nouvel état pour l'utilisateur cible depuis le profil
  const [targetUserFromProfile, setTargetUserFromProfile] = useState(null);
  
  // États pour les menus contextuels
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    type: null,
    targetId: null,
    targetData: null
  });
  
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [playingAudio, setPlayingAudio] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const contextMenuRef = useRef(null);

  const emojis = ['😀', '😂', '🥰', '😍', '🤔', '😎', '👍', '❤️', '🔥', '🎉', '🙏', '💯'];

  // Débogage du state de navigation
  useEffect(() => {
    console.log('🔍 State de navigation actuel:', location.state);
    console.log('🔍 Utilisateur cible stocké:', targetUserFromProfile);
    console.log('🔍 Conversations chargées:', conversations.length);
  }, [location.state, targetUserFromProfile, conversations]);

  // Fonction pour naviguer vers le profil d'un utilisateur
  const navigateToProfile = (userProfile) => {
    if (userProfile && userProfile.id) {
      navigate(`/profile/${userProfile.username || userProfile.id}`, {
        state: { user: userProfile }
      });
    }
  };

  // Fonction pour gérer le clic sur le nom d'utilisateur dans la liste des conversations
  const handleUserClick = (e, userProfile) => {
    e.stopPropagation(); // Empêche la sélection de la conversation
    navigateToProfile(userProfile);
  };

  // Fonction pour gérer le clic sur le nom dans l'en-tête du chat
  const handleChatHeaderUserClick = (userProfile) => {
    navigateToProfile(userProfile);
  };

  // Gérer l'utilisateur cible venant du profil - CORRIGÉ
  useEffect(() => {
    console.log('📍 State de navigation reçu:', location.state);
    
    if (location.state?.targetUser) {
      const targetUser = location.state.targetUser;
      console.log('🎯 Utilisateur cible depuis profil:', targetUser);
      
      setTargetUserFromProfile(targetUser);
      
      // Vérifier si une conversation existe déjà avec cet utilisateur
      const existingConversation = conversations.find(conv => {
        const participant = getParticipant(conv);
        return participant && participant.id === targetUser.id;
      });

      if (existingConversation) {
        // Si une conversation existe, la sélectionner directement
        console.log('✅ Conversation existante trouvée, sélection...');
        setSelectedConversation(existingConversation);
        setShowUserSearch(false);
      } else {
        // Sinon, démarrer directement une nouvelle conversation
        console.log('🆕 Aucune conversation existante, création...');
        startNewConversation(targetUser);
      }
      
      // Nettoyer le state de navigation
      window.history.replaceState({}, '');
    }
  }, [location.state, conversations]);

  // Gestion des menus contextuels
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        setContextMenu({ visible: false, x: 0, y: 0, type: null, targetId: null, targetData: null });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleContextMenu = (event, type, targetId, targetData = null) => {
    event.preventDefault();
    event.stopPropagation();
    
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      type,
      targetId,
      targetData
    });
  };

  const handleCopyMessage = (message) => {
    if (message.content) {
      navigator.clipboard.writeText(message.content)
        .then(() => {
          console.log('Message copié:', message.content);
          setContextMenu({ visible: false, x: 0, y: 0, type: null, targetId: null });
        })
        .catch(err => {
          console.error('Erreur lors de la copie:', err);
        });
    }
  };

  const handleDeleteForMe = async (messageId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce message ? Il sera toujours visible pour les autres participants.')) {
      return;
    }

    try {
      console.log('🔄 Suppression pour moi seulement...');
      await messagesAPI.deleteMessage(messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      console.log('✅ Message supprimé pour moi seulement');
    } catch (error) {
      console.error('❌ Error deleting message for me:', error);
      if (error.response?.status === 403) {
        alert('Vous ne pouvez supprimer que vos propres messages.');
      } else {
        alert('Erreur lors de la suppression du message');
      }
    } finally {
      setContextMenu({ visible: false, x: 0, y: 0, type: null, targetId: null });
    }
  };

  const handleDeleteForEveryone = async (messageId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce message pour tous les participants ? Cette action est irréversible.')) {
      return;
    }

    try {
      console.log('🔄 Suppression pour tout le monde...');
      await messagesAPI.deleteMessageForEveryone(messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      fetchConversations();
      console.log('✅ Message supprimé pour tout le monde');
    } catch (error) {
      console.error('❌ Error deleting message for everyone:', error);
      if (error.response?.status === 403) {
        alert('Vous n\'avez pas la permission de supprimer ce message pour tout le monde.');
      } else if (error.response?.status === 404) {
        console.log('🔄 Endpoint non disponible, utilisation de la suppression normale');
        await handleDeleteForMe(messageId);
        alert('Message supprimé pour vous seulement (fonctionnalité limitée)');
      } else {
        alert('Erreur lors de la suppression du message pour tout le monde');
      }
    } finally {
      setContextMenu({ visible: false, x: 0, y: 0, type: null, targetId: null });
    }
  };

  const handleDeleteConversation = async (conversationId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette conversation ? Tous les messages seront perdus.')) {
      return;
    }

    try {
      await messagesAPI.deleteConversation(conversationId);
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      if (selectedConversation && selectedConversation.id === conversationId) {
        const remainingConversations = conversations.filter(conv => conv.id !== conversationId);
        setSelectedConversation(remainingConversations[0] || null);
        setMessages([]);
      }
    } catch (error) {
      console.error('❌ Error deleting conversation:', error);
      alert('Erreur lors de la suppression de la conversation');
    } finally {
      setContextMenu({ visible: false, x: 0, y: 0, type: null, targetId: null });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchConversations();
    
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      
      if (selectedConversation.unread_count > 0) {
        markConversationAsRead(selectedConversation.id);
      }
      
      pollingIntervalRef.current = setInterval(() => {
        if (document.visibilityState === 'visible') {
          fetchMessages(selectedConversation.id);
          fetchConversations();
        }
      }, 10000);
      
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [selectedConversation]);

  const markConversationAsRead = async (conversationId) => {
    try {
      await messagesAPI.markAsRead(conversationId);
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, unread_count: 0 }
          : conv
      ));
    } catch (error) {
      console.error('❌ Error marking conversation as read:', error);
      if (error.response?.status !== 405) {
        console.warn('Conversation déjà marquée comme lue ou endpoint non disponible');
      }
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await messagesAPI.getConversations();
      
      let conversationsData = [];
      
      if (response.data && response.data.results && Array.isArray(response.data.results)) {
        conversationsData = response.data.results;
      } else if (Array.isArray(response.data)) {
        conversationsData = response.data;
      } else {
        conversationsData = [];
      }
      
      setConversations(conversationsData);
      
      if (conversationsData.length > 0 && !selectedConversation) {
        setSelectedConversation(conversationsData[0]);
      }
    } catch (error) {
      console.error('❌ Error fetching conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const response = await messagesAPI.getMessages(conversationId);
      
      let messagesData = [];
      
      if (response.data && response.data.results && Array.isArray(response.data.results)) {
        messagesData = response.data.results;
      } else if (Array.isArray(response.data)) {
        messagesData = response.data;
      } else {
        messagesData = [];
      }
      
      setMessages(messagesData);
      
      if (messagesData.length > 0 && selectedConversation?.id === conversationId) {
        const unreadMessages = messagesData.filter(msg => 
          !msg.read && msg.sender?.id !== user.id
        );
        
        if (unreadMessages.length > 0) {
          try {
            await messagesAPI.markAsRead(conversationId);
            setConversations(prev => prev.map(conv => 
              conv.id === conversationId 
                ? { ...conv, unread_count: 0 }
                : conv
            ));
          } catch (error) {
            if (error.response?.status !== 405) {
              console.error('Error marking conversation as read:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      setMessages([]);
    }
  };

  const refreshConversation = async () => {
    if (selectedConversation) {
      setRefreshing(true);
      await fetchMessages(selectedConversation.id);
      await fetchConversations();
      setRefreshing(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !audioBlob) || !selectedConversation || sending) return;

    setSending(true);

    try {
      let response;

      if (audioBlob) {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'voice-message.webm');
        formData.append('content', '🎤 Message vocal');
        
        response = await messagesAPI.sendMessage(selectedConversation.id, formData);
        
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        setAudioBlob(null);
        setAudioUrl('');
      } else {
        response = await messagesAPI.sendMessage(selectedConversation.id, {
          content: newMessage
        });
        setNewMessage('');
      }

      setMessages(prev => [...prev, response.data]);

      setTimeout(() => {
        fetchConversations();
      }, 100);

    } catch (error) {
      console.error('❌ Error sending message:', error);
      alert('Erreur lors de l\'envoi du message: ' + (error.response?.data?.error || 'Erreur serveur'));
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !selectedConversation) return;

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image valide');
      return;
    }

    const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!supportedFormats.includes(file.type)) {
      alert('Format d\'image non supporté. Utilisez JPEG, PNG, GIF ou WebP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('L\'image est trop volumineuse (max 5MB)');
      return;
    }

    setSending(true);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('content', '🖼️ Image');

      console.log('📤 Envoi de l\'image...', {
        size: file.size,
        type: file.type,
        name: file.name
      });

      const response = await messagesAPI.sendMessage(selectedConversation.id, formData);
      
      setMessages(prev => [...prev, response.data]);
      
      setTimeout(() => {
        fetchConversations();
      }, 100);

    } catch (error) {
      console.error('❌ Error sending image:', error);
      if (error.response?.status === 500) {
        alert('Erreur serveur lors du traitement de l\'image. Le format peut ne pas être supporté.');
      } else if (error.response?.status === 413) {
        alert('L\'image est trop volumineuse pour le serveur.');
      } else {
        alert('Erreur lors de l\'envoi de l\'image: ' + (error.response?.data?.error || 'Erreur serveur'));
      }
    } finally {
      setSending(false);
      event.target.value = '';
    }
  };

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Votre navigateur ne supporte pas l\'enregistrement audio');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
          channelCount: 1,
        } 
      });
      
      let options = {};
      if (MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' };
      }
      
      options.audioBitsPerSecond = 64000;
      
      const mediaRecorder = new MediaRecorder(stream, options);
      
      audioRecorderRef.current = mediaRecorder;
      
      const audioChunks = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { 
          type: options.mimeType || 'audio/webm' 
        });
        
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start(1000);
      setRecording(true);
      
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      if (error.name === 'NotAllowedError') {
        alert('Permission microphone refusée. Veuillez autoriser l\'accès au microphone.');
      } else {
        alert('Erreur lors du démarrage de l\'enregistrement: ' + error.message);
      }
    }
  };

  const stopRecording = () => {
    if (audioRecorderRef.current && recording) {
      audioRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const cancelRecording = () => {
    if (audioRecorderRef.current && recording) {
      audioRecorderRef.current.stop();
      setRecording(false);
      setAudioBlob(null);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl('');
      }
    }
  };

  const playAudio = async (audioPath, messageId) => {
    if (!audioPath) {
      console.error('❌ Chemin audio manquant');
      return;
    }

    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        setPlayingAudio(null);
      }

      const response = await messagesAPI.getAudioFile(audioPath);
      
      if (response.status !== 200) {
        throw new Error(`Erreur serveur: ${response.status}`);
      }

      const audioBlob = new Blob([response.data], { 
        type: response.headers['content-type'] || 'audio/webm' 
      });
      
      const blobUrl = URL.createObjectURL(audioBlob);

      const audioElement = new Audio(blobUrl);
      
      audioElement.onerror = (e) => {
        console.error('❌ Erreur audio:', audioElement.error);
        URL.revokeObjectURL(blobUrl);
        setPlayingAudio(null);
        alert('Impossible de lire le message audio. Format non supporté.');
      };
      
      audioElement.onended = () => {
        URL.revokeObjectURL(blobUrl);
        setPlayingAudio(null);
      };
      
      audioElement.onplay = () => {
        setPlayingAudio(messageId);
      };

      audioRef.current = audioElement;

      await audioElement.play();

    } catch (error) {
      console.error('❌ Erreur lors de la lecture audio:', error);
      setPlayingAudio(null);
      
      try {
        const fallbackResponse = await fetch(audioPath);
        if (!fallbackResponse.ok) throw new Error('Fetch failed');
        
        const audioBlob = await fallbackResponse.blob();
        const blobUrl = URL.createObjectURL(audioBlob);
        
        const audioElement = new Audio(blobUrl);
        audioElement.onplay = () => setPlayingAudio(messageId);
        audioElement.onended = () => {
          URL.revokeObjectURL(blobUrl);
          setPlayingAudio(null);
        };
        audioElement.onerror = () => {
          URL.revokeObjectURL(blobUrl);
          setPlayingAudio(null);
          alert('Échec de la lecture audio');
        };
        
        await audioElement.play();
      } catch (fallbackError) {
        console.error('❌ Échec de la méthode alternative:', fallbackError);
        alert('Impossible de lire le message audio. Le fichier peut être corrompu ou inaccessible.');
      }
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
      setPlayingAudio(null);
    }
  };

  const addEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        searchUsers();
      } else {
        setSearchResults([]);
        setShowUserSearch(false);
      }
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const searchUsers = async () => {
    setSearchLoading(true);
    try {
      const response = await usersAPI.search(searchQuery);
      
      let usersData = [];
      
      if (response.data && response.data.results && Array.isArray(response.data.results)) {
        usersData = response.data.results;
      } else if (Array.isArray(response.data)) {
        usersData = response.data;
      }
      
      const filteredResults = usersData.filter(userResult => 
        userResult.id !== user.id
      );
      
      // Si on a un utilisateur cible et que la recherche correspond, l'ajouter
      if (targetUserFromProfile && 
          targetUserFromProfile.username.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !filteredResults.some(u => u.id === targetUserFromProfile.id)) {
        filteredResults.unshift(targetUserFromProfile);
      }
      
      setSearchResults(filteredResults);
      setShowUserSearch(true);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // FONCTION CORRIGÉE POUR DÉMARRER UNE CONVERSATION
  const startNewConversation = async (userToMessage) => {
    try {
      console.log('🔄 Démarrage nouvelle conversation avec:', userToMessage);
      
      // Vérifier d'abord si une conversation existe déjà
      const existingConversation = conversations.find(conv => {
        const participant = getParticipant(conv);
        return participant && participant.id === userToMessage.id;
      });

      if (existingConversation) {
        // Si une conversation existe déjà, la sélectionner
        console.log('✅ Conversation existante trouvée:', existingConversation);
        setSelectedConversation(existingConversation);
        setShowUserSearch(false);
        setSearchQuery('');
        setSearchResults([]);
        setTargetUserFromProfile(null);
        return;
      }

      // Sinon, créer une nouvelle conversation
      console.log('🆕 Création nouvelle conversation...');
      const response = await messagesAPI.createConversation(userToMessage.id);
      
      const newConversation = response.data;
      console.log('✅ Nouvelle conversation créée:', newConversation);
      
      // Ajouter la nouvelle conversation à la liste
      setConversations(prev => [newConversation, ...prev]);
      setSelectedConversation(newConversation);
      setShowUserSearch(false);
      setSearchQuery('');
      setSearchResults([]);
      setTargetUserFromProfile(null);
      
      // Charger les messages de la nouvelle conversation
      fetchMessages(newConversation.id);
      
    } catch (error) {
      console.error('❌ Error starting conversation:', error);
      
      // Gestion d'erreur plus spécifique
      if (error.response?.status === 400) {
        alert('Impossible de démarrer une conversation avec cet utilisateur.');
      } else if (error.response?.status === 404) {
        alert('Utilisateur non trouvé.');
      } else if (error.response?.status === 500) {
        alert('Erreur serveur. Veuillez réessayer.');
      } else {
        alert('Erreur lors du démarrage de la conversation: ' + (error.response?.data?.error || 'Erreur serveur'));
      }
    }
  };

  const getParticipant = (conversation) => {
    if (!conversation || !conversation.participants) return null;
    return conversation.participants.find(p => p.id !== user.id);
  };

  const getLastMessage = (conversation) => {
    return conversation.last_message;
  };

  const getUnreadCount = (conversation) => {
    return conversation.unread_count || 0;
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'À l\'instant';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}min`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  // Fonction pour vérifier si un message a été lu
  const isMessageRead = (message) => {
    if (message.sender?.id === user.id) {
      return message.read;
    }
    return true; // Pour les messages reçus, on considère qu'ils sont lus
  };

  // Fonction pour obtenir l'icône de statut de lecture
  const getReadStatusIcon = (message) => {
    if (message.sender?.id !== user.id) return null;
    
    if (isMessageRead(message)) {
      return <Eye size={12} className="inline ml-1" />;
    } else {
      return <EyeOff size={12} className="inline ml-1" />;
    }
  };

  const filteredConversations = Array.isArray(conversations) 
    ? conversations.filter(conv => {
        const participant = getParticipant(conv);
        if (!participant) return false;
        if (!searchQuery.trim()) return true;
        
        const searchLower = searchQuery.toLowerCase();
        return (
          (participant.full_name?.toLowerCase() || '').includes(searchLower) ||
          (participant.username?.toLowerCase() || '').includes(searchLower)
        );
      })
    : [];

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    
    console.log('🖼️ Chemin image original:', imagePath);
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    if (imagePath.startsWith('/media/')) {
      return `http://localhost:8000${imagePath}`;
    }
    
    if (imagePath.includes('messages/images')) {
      return `http://localhost:8000/media/${imagePath}`;
    }
    
    return `http://localhost:8000/media/messages/images/${imagePath}`;
  };

  const handleImageClick = (imagePath) => {
    const imageUrl = getImageUrl(imagePath);
    console.log('🖼️ Ouverture image:', imageUrl);
    
    fetch(imageUrl)
      .then(response => {
        if (response.ok) {
          window.open(imageUrl, '_blank');
        } else {
          console.error('❌ Image non accessible:', response.status);
          alert('L\'image n\'est pas accessible. Vérifiez la configuration du serveur.');
        }
      })
      .catch(error => {
        console.error('❌ Erreur accès image:', error);
        alert('Erreur lors de l\'accès à l\'image.');
      });
  };

  return (
    <div className="w-full h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Conteneur principal - PREND TOUTE LA LARGEUR */}
      <div className="flex h-full w-full bg-white rounded-none shadow-lg">
        
        {/* Menu contextuel */}
        {contextMenu.visible && (
          <div
            ref={contextMenuRef}
            className="fixed z-50 w-64 bg-white rounded-lg shadow-xl border border-pink-200 py-2"
            style={{
              left: Math.min(contextMenu.x, window.innerWidth - 280),
              top: Math.min(contextMenu.y, window.innerHeight - 200),
            }}
          >
            {contextMenu.type === 'message' && (
              <>
                <button
                  onClick={() => handleCopyMessage(contextMenu.targetData)}
                  className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:bg-pink-50 transition-all duration-200 text-gray-700"
                >
                  <Copy size={16} className="text-purple-600" />
                  <span>Copier</span>
                </button>
                
                <div className="border-t border-gray-100 my-1"></div>
                
                <button
                  onClick={() => handleDeleteForMe(contextMenu.targetId)}
                  className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:bg-pink-50 transition-all duration-200 text-amber-600"
                >
                  <Trash2 size={16} />
                  <span>Supprimer pour moi</span>
                </button>
                
                {contextMenu.targetData?.sender?.id === user.id && (
                  <>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={() => handleDeleteForEveryone(contextMenu.targetId)}
                      className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:bg-pink-50 transition-all duration-200 text-red-600"
                    >
                      <Globe size={16} />
                      <span>Supprimer pour tout le monde</span>
                    </button>
                  </>
                )}

                {/* Statut de lecture */}
                <div className="border-t border-gray-100 my-1"></div>
                <div className="px-4 py-2 text-xs text-gray-500 flex items-center gap-2">
                  {contextMenu.targetData?.sender?.id === user.id ? (
                    <>
                      {isMessageRead(contextMenu.targetData) ? (
                        <>
                          <Eye size={12} className="text-green-500" />
                          <span>Message lu</span>
                        </>
                      ) : (
                        <>
                          <EyeOff size={12} className="text-gray-400" />
                          <span>Message non lu</span>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <Eye size={12} className="text-blue-500" />
                      <span>Message reçu</span>
                    </>
                  )}
                </div>
              </>
            )}
            
            {contextMenu.type === 'conversation' && (
              <button
                onClick={() => handleDeleteConversation(contextMenu.targetId)}
                className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:bg-pink-50 transition-all duration-200 text-red-600"
              >
                <Trash2 size={16} />
                <span>Supprimer la conversation</span>
              </button>
            )}
          </div>
        )}

        {/* Sidebar des conversations */}
        <div className="w-96 flex flex-col bg-gradient-to-b from-pink-50 to-purple-50 border-r border-pink-100">
          {/* Header */}
          <div className="p-6 bg-white border-b border-pink-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                Messages {conversations.length > 0 && <span className="text-gray-500">({conversations.length})</span>}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={refreshConversation}
                  disabled={refreshing}
                  className="p-2 rounded-xl bg-white border border-pink-200 hover:bg-pink-50 transition-all duration-200 disabled:opacity-50 shadow-sm"
                  title="Actualiser"
                >
                  <RefreshCcw size={18} className={refreshing ? 'animate-spin text-purple-600' : 'text-purple-600'} />
                </button>
                <button
                  onClick={() => {
                    setShowUserSearch(!showUserSearch);
                    setSearchQuery('');
                    setTargetUserFromProfile(null);
                  }}
                  className="p-2 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition-all duration-200 shadow-sm"
                  title="Nouvelle conversation"
                >
                  <UserPlus size={18} className="text-white" />
                </button>
              </div>
            </div>
            
            {/* Barre de recherche */}
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
              <input
                type="text"
                placeholder="Rechercher une conversation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-3 rounded-xl border border-pink-200 bg-white outline-none text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all duration-200 text-gray-800"
              />
              
              {/* Résultats de recherche */}
              {showUserSearch && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-pink-200 rounded-xl shadow-lg z-20 max-h-80 overflow-y-auto">
                  {searchResults.map((userResult) => (
                    <div
                      key={userResult.id}
                      onClick={() => startNewConversation(userResult)}
                      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-pink-50 transition-all duration-200 border-b border-pink-100 last:border-b-0"
                    >
                      {userResult.profile_picture ? (
                        <img 
                          src={userResult.profile_picture} 
                          alt={userResult.username} 
                          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" 
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white bg-gradient-to-br from-pink-500 to-purple-600 shadow-sm">
                          {userResult.username?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-800 truncate">
                          {userResult.full_name || userResult.username}
                        </div>
                        <div className="text-sm text-gray-600 truncate">
                          @{userResult.username}
                        </div>
                      </div>
                      <div className="text-xs text-purple-600 font-medium bg-purple-100 px-2 py-1 rounded-full">
                        Nouveau message
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Liste des conversations */}
          <div className="flex-1 overflow-y-auto bg-transparent">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block w-6 h-6 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-8 px-4">
                <MessageCircle size={48} className="mx-auto mb-3 text-purple-400" />
                <p className="text-gray-500 mb-2">{searchQuery ? 'Aucune conversation trouvée' : 'Aucune conversation'}</p>
                <p className="text-sm text-gray-400">{searchQuery ? 'Essayez une autre recherche' : 'Cliquez sur + pour démarrer une conversation'}</p>
              </div>
            ) : (
              filteredConversations.map(conv => {
                const participant = getParticipant(conv);
                const lastMessage = getLastMessage(conv);
                const unreadCount = getUnreadCount(conv);

                if (!participant) return null;

                return (
                  <div
                    key={conv.id}
                    onClick={() => {
                      setSelectedConversation(conv);
                      if (unreadCount > 0) {
                        markConversationAsRead(conv.id);
                      }
                    }}
                    onContextMenu={(e) => handleContextMenu(e, 'conversation', conv.id, conv)}
                    className={`flex items-center gap-3 p-4 cursor-pointer transition-all duration-200 border-b border-pink-100 group ${
                      selectedConversation?.id === conv.id 
                        ? 'bg-gradient-to-r from-pink-50 to-purple-50 border-purple-200' 
                        : 'bg-white hover:bg-pink-50'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {participant.profile_picture ? (
                        <img 
                          src={participant.profile_picture} 
                          alt={participant.username} 
                          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" 
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white bg-gradient-to-br from-pink-500 to-purple-600 shadow-sm">
                          {participant.username?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full text-xs flex items-center justify-center text-white font-bold shadow-sm">
                          {unreadCount}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <button
                          onClick={(e) => handleUserClick(e, participant)}
                          className={`font-semibold truncate text-left hover:text-purple-700 transition-colors duration-200 ${
                            selectedConversation?.id === conv.id ? 'text-purple-900' : 'text-gray-800'
                          }`}
                          title={`Voir le profil de ${participant.full_name || participant.username}`}
                        >
                          {participant.full_name || participant.username}
                        </button>
                        <span className="text-xs text-gray-500">{lastMessage ? formatTime(lastMessage.created_at) : ''}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={`text-sm truncate ${
                          unreadCount > 0 
                            ? 'text-gray-800 font-medium' 
                            : 'text-gray-600'
                        }`}>
                          {lastMessage?.content || 'Aucun message'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Zone de chat principale - PREND TOUTE LA LARGEUR RESTANTE */}
        {selectedConversation ? (
          <div className="flex-1 flex flex-col bg-white">
            {/* En-tête du chat */}
            <div className="p-6 border-b border-pink-100 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                {(() => {
                  const participant = getParticipant(selectedConversation);
                  return participant ? (
                    <>
                      {participant.profile_picture ? (
                        <img 
                          src={participant.profile_picture} 
                          alt={participant.username} 
                          className="w-12 h-12 rounded-full object-cover border-2 border-pink-200 shadow-sm cursor-pointer hover:opacity-80 transition-opacity duration-200"
                          onClick={() => handleChatHeaderUserClick(participant)}
                        />
                      ) : (
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white bg-gradient-to-br from-pink-500 to-purple-600 shadow-sm cursor-pointer hover:opacity-80 transition-opacity duration-200"
                          onClick={() => handleChatHeaderUserClick(participant)}
                        >
                          {participant.username?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <button
                          onClick={() => handleChatHeaderUserClick(participant)}
                          className="font-semibold text-gray-800 hover:text-purple-700 transition-colors duration-200 text-left flex items-center gap-2 group"
                          title={`Voir le profil de ${participant.full_name || participant.username}`}
                        >
                          {participant.full_name || participant.username}
                          <ExternalLink size={16} className="text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        </button>
                        <p className="text-sm text-green-600 flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          En ligne
                        </p>
                      </div>
                    </>
                  ) : null;
                })()}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={refreshConversation}
                  disabled={refreshing}
                  className="p-2 rounded-xl bg-pink-100 hover:bg-pink-200 transition-all duration-200 disabled:opacity-50"
                  title="Actualiser"
                >
                  <RefreshCcw size={18} className={refreshing ? 'animate-spin text-purple-600' : 'text-purple-600'} />
                </button>
              </div>
            </div>

            {/* Messages - PREND TOUTE LA HAUTEUR DISPONIBLE */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-pink-50 to-purple-50">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Aucun message. Envoyez le premier message !</p>
                </div>
              ) : (
                messages.map(message => {
                  const isOwn = message.sender?.id === user.id;

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} relative group`}
                      onContextMenu={(e) => handleContextMenu(e, 'message', message.id, message)}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl relative shadow-sm ${
                          isOwn 
                            ? 'bg-gradient-to-br from-pink-500 to-purple-600 text-white rounded-br-md' 
                            : 'bg-white text-gray-800 rounded-bl-md border border-pink-200'
                        }`}
                      >
                        {/* Message image */}
                        {message.image && (
                          <div className="mb-2">
                            <img 
                              src={getImageUrl(message.image)} 
                              alt="Message image" 
                              className="max-w-full h-auto rounded-lg cursor-pointer max-h-48 object-cover shadow-sm hover:shadow-md transition-shadow duration-200"
                              onClick={() => handleImageClick(message.image)}
                              onError={(e) => {
                                console.error('❌ Erreur de chargement image:', message.image, getImageUrl(message.image));
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = `
                                  <div class="p-4 text-center bg-pink-100 rounded-lg border border-pink-200">
                                    <p class="text-gray-500">Image non chargée</p>
                                    <p class="text-xs text-gray-400 mt-1">${message.image}</p>
                                  </div>
                                `;
                              }}
                            />
                          </div>
                        )}

                        {/* Message vocal - STYLE CORRIGÉ */}
                        {message.audio && (
                          <div className={`flex items-center gap-3 p-4 rounded-xl mb-2 ${
                            isOwn 
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                              : 'bg-white border border-pink-200 shadow-sm'
                          }`}>
                            {/* Bouton de lecture */}
                            <button
                              onClick={() => playingAudio === message.id ? stopAudio() : playAudio(message.audio, message.id)}
                              className={`p-3 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-lg ${
                                isOwn 
                                  ? 'bg-white text-purple-600 hover:bg-purple-50' 
                                  : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                              }`}
                            >
                              {playingAudio === message.id ? (
                                <Pause size={18} />
                              ) : (
                                <Play size={18} className="ml-0.5" />
                              )}
                            </button>
                            
                            {/* Barre de progression et informations */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Volume2 size={16} className={isOwn ? 'text-purple-100' : 'text-purple-500'} />
                                  <span className={`text-sm font-medium truncate ${
                                    isOwn ? 'text-white' : 'text-gray-700'
                                  }`}>
                                    Message vocal
                                  </span>
                                </div>
                                <span className={`text-xs ${
                                  isOwn ? 'text-purple-100' : 'text-gray-500'
                                }`}>
                                  {playingAudio === message.id ? 'En cours...' : 'Cliquez pour écouter'}
                                </span>
                              </div>
                              
                              {/* Barre de progression stylisée */}
                              <div className={`w-full rounded-full h-1.5 ${
                                isOwn ? 'bg-purple-400/50' : 'bg-pink-100'
                              }`}>
                                <div 
                                  className={`h-1.5 rounded-full transition-all duration-300 ${
                                    isOwn ? 'bg-white' : 'bg-gradient-to-r from-purple-500 to-pink-500'
                                  }`}
                                  style={{ 
                                    width: playingAudio === message.id ? '100%' : '0%',
                                    transition: playingAudio === message.id ? 'width 0.1s linear' : 'none'
                                  }}
                                />
                              </div>
                              
                              {/* Contrôles supplémentaires pour l'audio en cours */}
                              {playingAudio === message.id && (
                                <div className="flex items-center justify-between mt-2">
                                  <span className={`text-xs ${
                                    isOwn ? 'text-purple-100' : 'text-gray-500'
                                  }`}>
                                    Lecture en cours
                                  </span>
                                  <button
                                    onClick={stopAudio}
                                    className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                                      isOwn 
                                        ? 'text-purple-100 hover:bg-purple-400/30' 
                                        : 'text-gray-500 hover:bg-pink-100'
                                    }`}
                                  >
                                    Arrêter
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Message texte */}
                        {message.content && message.content !== '🎤 Message vocal' && message.content !== '🖼️ Image' && (
                          <p className="break-words">{message.content}</p>
                        )}
                        
                        {/* Timestamp avec statut de lecture */}
                        <div className="flex items-center justify-between mt-1">
                          <p className={`text-xs ${isOwn ? 'text-purple-100' : 'text-gray-500'}`}>
                            {formatTime(message.created_at)}
                          </p>
                          {isOwn && (
                            <div className="flex items-center gap-1 ml-2">
                              {getReadStatusIcon(message)}
                              {isMessageRead(message) ? (
                                <span className="text-xs text-purple-100">Lu</span>
                              ) : (
                                <span className="text-xs text-purple-200">Envoyé</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Zone de saisie */}
            <form onSubmit={handleSendMessage} className="p-6 border-t border-pink-100 bg-white">
              {/* Enregistrement vocal en cours */}
              {recording && (
                <div className="mb-4 p-4 rounded-xl bg-pink-50 border border-pink-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-pink-500 animate-pulse" />
                    <span className="text-pink-700 font-medium">Enregistrement en cours...</span>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={stopRecording} className="p-2 rounded-lg bg-pink-500 hover:bg-pink-600 text-white transition-colors">
                      <Check size={16} />
                    </button>
                    <button type="button" onClick={cancelRecording} className="p-2 rounded-lg bg-gray-500 hover:bg-gray-600 text-white transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Aperçu audio - STYLE CORRIGÉ */}
              {audioUrl && !recording && (
                <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-purple-100">
                        <Volume2 size={20} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-purple-700">Message vocal prêt</p>
                        <p className="text-sm text-purple-500">Cliquez pour écouter avant envoi</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <button 
                      type="button" 
                      onClick={() => playingAudio === 'preview' ? stopAudio() : playAudio(audioUrl, 'preview')} 
                      className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      {playingAudio === 'preview' ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                    </button>
                    
                    <div className="flex-1">
                      <div className="w-full bg-purple-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-100"
                          style={{ width: playingAudio === 'preview' ? '100%' : '0%' }}
                        />
                      </div>
                    </div>
                    
                    <button 
                      type="button" 
                      onClick={cancelRecording}
                      className="p-2 rounded-lg bg-gray-500 hover:bg-gray-600 text-white transition-colors"
                      title="Supprimer l'enregistrement"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Picker d'emojis */}
              {showEmojiPicker && (
                <div className="mb-4 p-4 rounded-xl border border-pink-200 bg-white grid grid-cols-6 gap-2 shadow-lg">
                  {emojis.map((emoji, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => addEmoji(emoji)}
                      className="p-2 text-lg hover:bg-pink-100 rounded-lg transition-all duration-200 hover:scale-110"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3">
                {/* Input file caché pour les images */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  style={{ display: 'none' }}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 rounded-xl bg-pink-100 hover:bg-pink-200 transition-all duration-200 text-purple-600 hover:text-purple-800"
                  title="Envoyer une image"
                >
                  <Image size={20} />
                </button>

                <button
                  type="button"
                  onClick={recording ? stopRecording : startRecording}
                  className={`p-3 rounded-xl transition-all duration-200 ${
                    recording 
                      ? 'bg-pink-100 hover:bg-pink-200 text-pink-600 animate-pulse' 
                      : 'bg-pink-100 hover:bg-pink-200 text-purple-600 hover:text-purple-800'
                  }`}
                  title={recording ? "Arrêter l'enregistrement" : "Message vocal"}
                >
                  <Mic size={20} />
                </button>

                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-3 rounded-xl bg-pink-100 hover:bg-pink-200 transition-all duration-200 text-purple-600 hover:text-purple-800"
                  title="Emojis"
                >
                  <Smile size={20} />
                </button>

                <input
                  type="text"
                  placeholder="Écrivez un message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border border-pink-200 bg-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                  style={{ color: '#1f2937' }}
                  disabled={sending}
                />

                <button
                  type="submit"
                  disabled={(!newMessage.trim() && !audioBlob) || sending}
                  className="p-3 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 text-white transition-all duration-200 shadow-sm hover:shadow-md disabled:hover:shadow-sm"
                >
                  {sending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
            <div className="text-center">
              <MessageCircle size={64} className="mx-auto mb-4 text-purple-400" />
              <p className="text-xl font-bold mb-2 text-gray-800">Vos messages</p>
              <p className="text-gray-500 mb-4">
                {conversations.length === 0 ? "Vous n'avez aucune conversation" : "Sélectionnez une conversation pour commencer"}
              </p>
              {conversations.length === 0 && (
                <button
                  onClick={() => setShowUserSearch(true)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Démarrer une conversation
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;