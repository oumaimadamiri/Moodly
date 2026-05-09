import React, { useState } from 'react';
import { Image, Smile, X, AlertCircle, Send } from 'lucide-react';
import { postsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const EMOTIONS = [
  { id: 'happy', label: '😊 Heureux', color: '#FBBF24', description: 'Partagez votre bonheur' },
  { id: 'sad', label: '😢 Triste', color: '#60A5FA', description: 'Exprimez vos émotions' },
  { id: 'inspired', label: '💡 Inspiré', color: '#A78BFA', description: 'Partagez votre inspiration' },
  { id: 'motivated', label: '🚀 Motivé', color: '#34D399', description: 'Motivez les autres' },
  { id: 'excited', label: '🎉 Excité', color: '#F87171', description: 'Montrez votre enthousiasme' },
  { id: 'thoughtful', label: '🤔 Réfléchi', color: '#9CA3AF', description: 'Partagez vos réflexions' },
];

const CreatePost = ({ onPostCreated }) => {
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [showEmotionPicker, setShowEmotionPicker] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Le contenu ne peut pas être vide');
      return;
    }
    
    if (!selectedEmotion) {
      setError('Veuillez sélectionner une émotion');
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log('🔄 Création du post...');
      
      const formData = new FormData();
      formData.append('content', content.trim());
      formData.append('emotion', selectedEmotion.id);
      
      if (image) {
        formData.append('image', image);
      }

      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Utilisateur non authentifié');
      }

      const response = await postsAPI.create(formData);
      console.log('✅ Post créé:', response.data);
      
      onPostCreated(response.data);
      
      // Reset du formulaire
      setContent('');
      setImage(null);
      setSelectedEmotion(null);
      setShowEmotionPicker(false);
      
    } catch (error) {
      console.error('❌ Erreur:', error);
      
      let errorMessage = 'Erreur lors de la création du post';
      
      if (error.response?.status === 400) {
        const errors = error.response.data;
        if (typeof errors === 'object') {
          errorMessage = Object.values(errors).flat().join(', ');
        } else {
          errorMessage = errors.toString();
        }
      } else if (error.response?.status === 401) {
        errorMessage = 'Session expirée. Veuillez vous reconnecter.';
      } else if (error.response?.status === 413) {
        errorMessage = 'Fichier trop volumineux (max 5MB)';
      } else if (error.request) {
        errorMessage = 'Impossible de contacter le serveur';
      } else {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('L\'image est trop volumineuse (max 5MB)');
        return;
      }
      setImage(file);
      setError(null);
    }
  };

  const removeImage = () => {
    setImage(null);
  };

  const selectEmotion = (emotion) => {
    setSelectedEmotion(emotion);
    setShowEmotionPicker(false);
    setError(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex space-x-4">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg shadow-lg flex-shrink-0"
              style={{ 
                background: 'linear-gradient(135deg, #ec4899, #a855f7)',
              }}
            >
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            
            <div className="flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Quoi de neuf ? Partagez vos pensées..."
                className="w-full bg-transparent resize-none outline-none text-lg placeholder-gray-500 border-0 focus:ring-0 text-gray-900"
                rows="3"
              />
              
              {/* Sélection d'émotion */}
              <div className="mt-4">
                {!selectedEmotion ? (
                  <button
                    type="button"
                    onClick={() => setShowEmotionPicker(!showEmotionPicker)}
                    className="flex items-center space-x-2 px-4 py-3 rounded-xl border-2 border-dashed transition-all duration-200 hover:border-solid hover:scale-105 border-pink-300 text-pink-600 hover:bg-pink-50 w-full justify-center"
                  >
                    <Smile size={20} />
                    <span className="font-medium">Choisir une émotion (obligatoire)</span>
                  </button>
                ) : (
                  <div className="flex items-center justify-between bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-3 border border-pink-200">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{selectedEmotion.label.split(' ')[0]}</span>
                      <div>
                        <div className="font-medium text-gray-900">
                          {selectedEmotion.label}
                        </div>
                        <div className="text-sm text-gray-600">
                          {selectedEmotion.description}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedEmotion(null)}
                      className="p-2 rounded-full hover:bg-white transition-all duration-200 text-gray-500 hover:text-gray-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                {showEmotionPicker && (
                  <div className="mt-2 p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 grid grid-cols-2 gap-3 shadow-lg">
                    {EMOTIONS.map((emotion) => (
                      <button
                        key={emotion.id}
                        type="button"
                        onClick={() => selectEmotion(emotion)}
                        className="flex items-center space-x-3 p-3 rounded-xl text-left transition-all duration-200 hover:scale-105 hover:shadow-lg bg-white border border-gray-200 hover:border-purple-300"
                      >
                        <span className="text-2xl">{emotion.label.split(' ')[0]}</span>
                        <div>
                          <div className="font-medium text-sm text-gray-900">
                            {emotion.label.split(' ').slice(1).join(' ')}
                          </div>
                          <div className="text-xs text-gray-600">
                            {emotion.description}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Aperçu de l'image */}
              {image && (
                <div className="relative mt-4 group">
                  <img 
                    src={URL.createObjectURL(image)} 
                    alt="Preview" 
                    className="rounded-2xl max-h-80 object-cover w-full shadow-md"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-3 right-3 p-2 rounded-full bg-black bg-opacity-50 text-white opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-opacity-70"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}
              
              {/* Message d'erreur */}
              {error && (
                <div className="mt-4 p-4 rounded-xl flex items-center space-x-3 bg-red-50 border border-red-200">
                  <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">
                    {error}
                  </p>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <label className="cursor-pointer p-3 rounded-xl hover:bg-gray-100 transition-all duration-200 group">
                    <Image size={20} className="text-pink-500 group-hover:text-pink-600" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
                
                <div className="flex items-center space-x-3">
                  {!selectedEmotion && (
                    <span className="text-sm text-red-500 font-medium">
                      Émotion requise
                    </span>
                  )}
                  
                  <button
                    type="submit"
                    disabled={!content.trim() || !selectedEmotion || isSubmitting}
                    className="px-6 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                    style={{ 
                      background: selectedEmotion 
                        ? `linear-gradient(135deg, ${selectedEmotion.color}, ${selectedEmotion.color}dd)`
                        : 'linear-gradient(135deg, #ec4899, #a855f7)',
                      color: 'white'
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Publication...</span>
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        <span>Publier</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;