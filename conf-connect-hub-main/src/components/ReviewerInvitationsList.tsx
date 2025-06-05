import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import reviewerService from '@/services/reviewerService';
import { InvitationStatus } from '@/types/conference';

interface ReviewerInvitation {
  id: number;
  conference_title: string;
  invitee_email: string;
  status: InvitationStatus;
  created_at: string;
}

interface ReviewerInvitationsListProps {
  type: 'sent' | 'received';
}

const getStatusBadge = (status: InvitationStatus) => {
  const statusConfig = {
    pending: { label: "En attente", className: "bg-yellow-100 text-yellow-800" },
    accepted: { label: "Accepté", className: "bg-green-100 text-green-800" },
    rejected: { label: "Rejeté", className: "bg-red-100 text-red-800" }
  };

  const config = statusConfig[status];
  return (
    <Badge className={config.className}>
      {config.label}
    </Badge>
  );
};

const ReviewerInvitationsList: React.FC<ReviewerInvitationsListProps> = ({ type }) => {
  const [invitations, setInvitations] = useState<ReviewerInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvitations = async () => {
      try {
        setLoading(true);
        const data = await (type === 'sent' 
          ? reviewerService.getSentInvitations()
          : reviewerService.getReceivedInvitations());
        setInvitations(data);
      } catch (err) {
        setError('Erreur lors du chargement des invitations');
        console.error('Error fetching invitations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvitations();
  }, [type]);

  if (loading) return <div>Chargement...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">
        {type === 'sent' ? 'Invitations Envoyées' : 'Invitations Reçues'}
      </h2>
      {invitations.length === 0 ? (
        <p className="text-gray-500">Aucune invitation {type === 'sent' ? 'envoyée' : 'reçue'}</p>
      ) : (
        <div className="grid gap-4">
          {invitations.map((invitation) => (
            <Card key={invitation.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{invitation.conference_title}</h3>
                    <p className="text-sm text-gray-500">{invitation.invitee_email}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(invitation.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    {getStatusBadge(invitation.status)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewerInvitationsList; 