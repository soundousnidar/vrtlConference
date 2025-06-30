import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const InvitationAccepted: React.FC = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const status = query.get('status');
  const conferenceId = query.get('conference_id');

  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<'success' | 'rejected' | 'error' | null>(null);
  const [apiMessage, setApiMessage] = useState('');

  useEffect(() => {
    // Récupère le token depuis l'URL (ex: /accept-invitation?token=...)
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      api.get(`/reviewer-invitations/accept/${token}`)
        .then(res => {
          setApiStatus('success');
          setApiMessage(res.data.message || 'Vous êtes maintenant reviewer pour cette conférence.');
        })
        .catch(err => {
          const detail = err.response?.data?.detail;
          if (
            detail === "Invitation already accepted." ||
            detail === "You are now a reviewer for this conference." ||
            detail === "Invitation not found or token invalid" // Optionnel : à adapter selon ton backend
          ) {
            setApiStatus('success');
            setApiMessage("Vous êtes déjà reviewer pour cette conférence.");
          } else {
            setApiStatus('error');
            setApiMessage(detail || "Lien d'invitation invalide.");
          }
        })
        .finally(() => setLoading(false));
    } else {
      setApiStatus('success');
      setApiMessage("Vous êtes maintenant reviewer pour cette conférence.");
      setLoading(false);
    }
  }, []);

  let title = '';
  let message = '';
  let color = '';

  if (loading) {
    title = 'Traitement...';
    message = 'Validation de votre invitation en cours...';
    color = 'text-blue-600';
  } else if (apiStatus === 'success') {
    title = 'Invitation acceptée !';
    message = apiMessage;
    color = 'text-green-600';
  } else if (apiStatus === 'rejected') {
    title = 'Invitation refusée';
    message = apiMessage;
    color = 'text-yellow-600';
  } else {
    title = 'Erreur';
    message = apiMessage;
    color = 'text-red-600';
  }

  const handleGoToAbstracts = () => {
    if (conferenceId) {
      navigate(`/reviewer/conference/${conferenceId}/abstracts`);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader>
          <CardTitle className={color}>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">{message}</p>
          <Button asChild variant="outline">
            <a href="/login">Se connecter</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvitationAccepted; 