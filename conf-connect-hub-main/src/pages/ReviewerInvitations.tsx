import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReviewerInvitationsList from '@/components/ReviewerInvitationsList';

const ReviewerInvitations: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Gestion des Invitations</h1>
      
      <Tabs defaultValue="received" className="w-full">
        <TabsList>
          <TabsTrigger value="received">Invitations Reçues</TabsTrigger>
          <TabsTrigger value="sent">Invitations Envoyées</TabsTrigger>
        </TabsList>
        
        <TabsContent value="received">
          <ReviewerInvitationsList type="received" />
        </TabsContent>
        
        <TabsContent value="sent">
          <ReviewerInvitationsList type="sent" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReviewerInvitations; 