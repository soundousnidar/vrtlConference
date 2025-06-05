import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { InvitationStatus } from '@/types/conference';

interface ReviewerInvitation {
  id: number;
  conference_title: string;
  invitee_email: string;
  status: InvitationStatus;
  created_at: string;
}

interface ReviewerInvitationsTableProps {
  invitations: ReviewerInvitation[];
}

const getStatusBadge = (status: InvitationStatus) => {
  const statusConfig = {
    [InvitationStatus.pending]: { label: "En attente", variant: "outline" as const },
    [InvitationStatus.accepted]: { label: "Accepté", variant: "default" as const },
    [InvitationStatus.rejected]: { label: "Rejeté", variant: "destructive" as const }
  };
  
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const ReviewerInvitationsTable: React.FC<ReviewerInvitationsTableProps> = ({ invitations }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Invitations des Reviewers</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Conférence</TableHead>
            <TableHead>Email du Reviewer</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Date d'invitation</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                Aucune invitation envoyée
              </TableCell>
            </TableRow>
          ) : (
            invitations.map((invitation) => (
              <TableRow key={invitation.id}>
                <TableCell>{invitation.conference_title}</TableCell>
                <TableCell>{invitation.invitee_email}</TableCell>
                <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                <TableCell>
                  {new Date(invitation.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ReviewerInvitationsTable; 