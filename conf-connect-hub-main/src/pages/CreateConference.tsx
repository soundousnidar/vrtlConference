import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ConferenceForm from '@/components/ConferenceForm';
import { conferenceService } from '@/services/conferenceService';
import { toast } from '@/hooks/use-toast';

const CreateConference = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Vérifie si l'utilisateur est connecté
    const token = localStorage.getItem('token');
    if (!token) {
      toast({
        title: "Accès refusé",
        description: "Vous devez être connecté pour créer une conférence.",
        variant: "destructive",
      });
      navigate('/login');
    }
  }, [navigate]);

  const handleSubmit = async (formData: FormData) => {
    try {
      const conference = await conferenceService.createConference(formData);
      toast({
        title: "Succès",
        description: "La conférence a été créée avec succès.",
      });
      navigate(`/conference/${conference.id}`);
    } catch (error: any) {
      console.error('Error creating conference:', error);
      if (error.response?.status === 401) {
        toast({
          title: "Session expirée",
          description: "Votre session a expiré. Veuillez vous reconnecter.",
          variant: "destructive",
        });
        navigate('/login');
      } else {
        // Improved error handling for validation errors
        let errorMessage = "Une erreur est survenue lors de la création de la conférence.";
        
        if (error.response?.status === 422) {
          // Handle validation error
          const detail = error.response.data?.detail;
          if (detail) {
            errorMessage = typeof detail === 'string' 
              ? detail 
              : "Veuillez vérifier les données saisies.";
          }
        } else if (error.response?.data?.detail) {
          errorMessage = typeof error.response.data.detail === 'string'
            ? error.response.data.detail
            : "Une erreur est survenue lors de la création de la conférence.";
        }
        
        toast({
          title: "Erreur",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Créer une nouvelle conférence</h1>
      <div className="max-w-2xl mx-auto">
        <ConferenceForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
};

export default CreateConference; 