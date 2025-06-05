import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, MapPin, Euro, Users, Clock, FileText } from 'lucide-react';
import { Conference, VenueEnum } from '@/types/conference';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import AbstractSubmissionModal from '@/components/AbstractSubmissionModal';
import { conferenceService } from '@/services/conferenceService';
import { toast } from '@/hooks/use-toast';

const ConferenceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
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
        navigate('/conferences');
      } finally {
        setLoading(false);
      }
    };

    fetchConference();
  }, [id, navigate]);

  const handleBack = () => {
    navigate('/conferences');
  };

  const handleSubmitAbstract = () => {
    setIsSubmissionModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-32 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="space-y-3">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
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
        {/* Header avec bouton retour */}
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={handleBack}
            className="mb-4"
          >
            <ArrowLeft size={16} className="mr-2" />
            Retour aux conférences
          </Button>
        </div>

        {/* Image et titre principal */}
        <Card className="mb-6">
          <CardContent className="p-0">
            {conference.image_url && (
              <img 
                src={conference.image_url}
                alt={conference.title}
                className="w-full h-64 object-cover rounded-t-lg"
              />
            )}
            <div className="p-6">
              <h1 className="text-3xl font-bold mb-4">{conference.title}</h1>
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <Users size={20} />
                <span>Organisé par {conference.organizer_name}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Informations principales */}
          <div className="md:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {conference.description}
                </p>
              </CardContent>
            </Card>

            {/* Thématiques */}
            <Card>
              <CardHeader>
                <CardTitle>Thématiques</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {conference.thematic.map((theme, index) => (
                    <Badge key={index} variant="secondary">
                      {theme}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Bouton de soumission */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText size={20} />
                  Soumission d'Abstract
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Soumettez votre abstract pour cette conférence. Assurez-vous de respecter la date limite.
                </p>
                <Button 
                  onClick={handleSubmitAbstract}
                  size="lg"
                  className="w-full md:w-auto"
                >
                  Soumettre un Abstract
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar avec informations complémentaires */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dates Importantes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-red-600" />
                  <span className="text-sm">
                    Date limite: {format(new Date(conference.deadline), 'dd MMMM yyyy', { locale: fr })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-blue-600" />
                  <span className="text-sm">
                    Date importante: {format(new Date(conference.important_date), 'dd MMMM yyyy', { locale: fr })}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informations Pratiques</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-green-600" />
                  <span className="text-sm">
                    {conference.venue === VenueEnum.ONLINE ? 'Conférence en ligne' : 'Conférence en présentiel'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Euro size={16} className="text-orange-600" />
                  <span className="text-sm">Frais de participation: {conference.fees}DH</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-blue-600" />
                  <span className="text-sm">
                    Créée le {format(new Date(conference.created_at), 'dd MMMM yyyy', { locale: fr })}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de soumission d'abstract */}
      <AbstractSubmissionModal
        isOpen={isSubmissionModalOpen}
        onClose={() => setIsSubmissionModalOpen(false)}
        conference={conference}
      />
    </div>
  );
};

export default ConferenceDetails;
