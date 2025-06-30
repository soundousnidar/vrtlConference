import React, { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '@/lib/api';

const AcceptInvitation: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const conferenceId = params.get('conference_id');
    if (token) {
      api.get(`/reviewer-invitations/accept/${token}`)
        .then(() => {
          navigate(`/invitation-accepted?status=success${conferenceId ? `&conference_id=${conferenceId}` : ''}`);
        })
        .catch(() => {
          navigate(`/invitation-accepted?status=error${conferenceId ? `&conference_id=${conferenceId}` : ''}`);
        });
    }
  }, [token, navigate, location.search]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Traitement de l'invitation...</p>
    </div>
  );
};

export default AcceptInvitation; 