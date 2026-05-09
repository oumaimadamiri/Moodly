// FollowRequests.jsx
import React, { useState, useEffect } from 'react';
import { UserCheck, UserX, User } from 'lucide-react';

const FollowRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const response = await usersAPI.getFollowRequests();
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching follow requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (userId) => {
    try {
      await usersAPI.acceptFollowRequest(userId);
      setRequests(requests.filter(req => req.id !== userId));
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleReject = async (userId) => {
    try {
      await usersAPI.rejectFollowRequest(userId);
      setRequests(requests.filter(req => req.id !== userId));
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  if (loading) {
    return <div className="text-center py-8 text-gray-600">Chargement...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold text-gray-900">Demandes de suivi</h2>
      
      {requests.length === 0 ? (
        <div className="text-center py-12">
          <User size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Aucune demande de suivi</p>
        </div>
      ) : (
        requests.map(request => (
          <div
            key={request.id}
            className="p-4 bg-white rounded-xl border border-gray-200 flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-base">
                {request.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <div className="text-gray-900 font-medium">
                  {request.full_name || request.username}
                </div>
                <div className="text-gray-600 text-sm">
                  @{request.username}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => handleAccept(request.id)}
                className="px-3 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg flex items-center gap-1 text-sm font-medium hover:from-pink-600 hover:to-purple-700 transition-all"
              >
                <UserCheck size={16} />
                Accepter
              </button>
              
              <button
                onClick={() => handleReject(request.id)}
                className="px-3 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg flex items-center gap-1 text-sm font-medium hover:bg-gray-50 transition-all"
              >
                <UserX size={16} />
                Refuser
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default FollowRequests;