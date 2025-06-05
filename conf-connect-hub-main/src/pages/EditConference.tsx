import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Conference } from '@/types/conference';
import { conferenceService } from '@/services/conferenceService';
import { toast } from '@/hooks/use-toast';
import ConferenceForm from '@/components/ConferenceForm';

const EditConference: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [conference, setConference] = useState<Conference | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConference = async () => {
      try {
        if (!id) return;
        const data = await conferenceService.getConference(parseInt(id));
        setConference(data);
      } catch (error) {
        console.error('Error fetching conference:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les détails de la conférence",
          variant: "destructive",
        });
        navigate('/profile');
      } finally {
        setLoading(false);
      }
    };

    fetchConference();
  }, [id, navigate]);

  const handleSubmit = async (formData: FormData) => {
    try {
      if (!id) return;
      await conferenceService.updateConference(parseInt(id), formData);
      toast({
        title: "Succès",
        description: "La conférence a été mise à jour avec succès",
      });
      navigate('/profile');
    } catch (error: any) {
      console.error('Error updating conference:', error);
      toast({
        title: "Erreur",
        description: error.response?.data?.detail || "Impossible de mettre à jour la conférence",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-[400px] bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!conference) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            Conférence introuvable
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au profil
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Modifier la conférence</CardTitle>
          </CardHeader>
          <CardContent>
            <ConferenceForm
              onSubmit={handleSubmit}
              initialData={conference}
              isEditing={true}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditConference; 