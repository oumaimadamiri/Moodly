import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersAPI } from '../services/api';
import theme from '../styles/theme';

const FollowRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFollowRequests();
  }, []);

  const fetchFollowRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // ✅ Plusieurs essais d'endpoints possibles
      console.log('🔄 Fetching follow requests...');
      
      let response;
        //   try {
        // Essai 1: endpoint complet
      response = await usersAPI.getFollowRequests();
      console.log('✅ Success with /api/follow-requests/pending_requests/');
           
      console.log('✅ Follow requests received:', response.data);
      setRequests(response.data);
      
    } catch (err) {
      console.error('❌ Error fetching follow requests:', err);
      console.error('Error details:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        url: err.config?.url
      });
      
      setError(err.response?.data?.error || 'Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (userId) => {
    try {
      console.log('✅ Accepting request from user:', userId);
        await usersAPI.acceptFollowRequest(userId);
      
      // Retirer la demande de la liste
      setRequests(requests.filter(req => req.id !== userId));
      
      // Message de succès avec votre theme
      showSuccessMessage('Demande acceptée !');
      
    } catch (err) {
      console.error('❌ Error accepting request:', err);
      showErrorMessage('Erreur lors de l\'acceptation de la demande');
    }
  };

  const handleReject = async (userId) => {
    try {
      console.log('❌ Rejecting request from user:', userId);
      await usersAPI.rejectFollowRequest(userId);
      // Retirer la demande de la liste
      setRequests(requests.filter(req => req.id !== userId));
      
      showSuccessMessage('Demande refusée');
      
    } catch (err) {
      console.error('❌ Error rejecting request:', err);
      showErrorMessage('Erreur lors du refus de la demande');
    }
  };

  // Fonctions pour afficher des messages (remplacez alert)
  const showSuccessMessage = (message) => {
    // Option 1: Alert simple
    alert(message);
  };

  const showErrorMessage = (message) => {
    alert(message);
    // toast.error(message);
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: theme.dark }}
      >
        <div className="text-center">
          <div 
            className="inline-block w-12 h-12 border-4 rounded-full animate-spin mx-auto"
            style={{ 
              borderColor: theme.primary,
              borderTopColor: 'transparent'
            }}
          />
          <p className="mt-4" style={{ color: theme.gray }}>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.dark }}>
      {/* Header */}
      <div 
        className="shadow"
        style={{ backgroundColor: theme.darkLight }}
      >
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="mr-4 hover:opacity-70 transition"
              style={{ color: theme.gray }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold" style={{ color: theme.white }}>
              Demandes de suivi
            </h1>
            <button
              onClick={fetchFollowRequests}
              className="ml-auto hover:opacity-70 transition"
              style={{ color: theme.primary }}
              title="Rafraîchir"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div 
            className="border px-4 py-3 rounded mb-4 flex items-center justify-between"
            style={{ 
              backgroundColor: '#FEE2E2',
              borderColor: '#FCA5A5',
              color: '#991B1B'
            }}
          >
            <span>{error}</span>
            <button
              onClick={fetchFollowRequests}
              className="ml-4 px-3 py-1 rounded"
              style={{ 
                backgroundColor: '#991B1B',
                color: 'white'
              }}
            >
              Réessayer
            </button>
          </div>
        )}

        {requests.length === 0 && !error ? (
          <div 
            className="rounded-lg shadow p-8 text-center"
            style={{ backgroundColor: theme.darkLight }}
          >
            <svg
              className="w-16 h-16 mx-auto mb-4"
              style={{ color: theme.gray }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="text-lg font-medium mb-2" style={{ color: theme.white }}>
              Aucune demande en attente
            </h3>
            <p style={{ color: theme.gray }}>
              Vous n'avez pas de demandes de suivi pour le moment.
            </p>
          </div>
        ) : (
          <div 
            className="rounded-lg shadow divide-y"
            style={{ 
              backgroundColor: theme.darkLight,
              borderColor: theme.dark
            }}
          >
            {requests.map((request) => (
              <div 
                key={request.id} 
                className="p-4 hover:opacity-90 transition"
              >
                <div className="flex items-center justify-between">
                  {/* User Info */}
                  <div className="flex items-center flex-1">
                    <img
                      src={request.profile_picture || '/default-avatar.png'}
                      alt={request.username}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        e.target.src = '/default-avatar.png';
                      }}
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center">
                        <button
                          onClick={() => navigate(`/profile/${request.username}`)}
                          className="font-semibold hover:underline"
                          style={{ color: theme.white }}
                        >
                          {request.username}
                        </button>
                        {request.is_verified && (
                          <svg
                            className="w-4 h-4 ml-1"
                            style={{ color: theme.primary }}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <p className="text-sm" style={{ color: theme.gray }}>
                        {request.full_name || request.username}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleAccept(request.id)}
                      className="px-4 py-2 rounded-lg transition font-medium"
                      style={{ 
                        backgroundColor: theme.primary,
                        color: theme.white
                      }}
                    >
                      Accepter
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      className="px-4 py-2 rounded-lg transition font-medium"
                      style={{ 
                        backgroundColor: theme.dark,
                        color: theme.gray,
                        border: `1px solid ${theme.gray}`
                      }}
                    >
                      Refuser
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowRequestsPage;