import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, MapPin, Users, Clock, FileText, Video } from 'lucide-react';
import { Conference, VenueEnum } from '@/types/conference';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import AbstractSubmissionModal from '@/components/AbstractSubmissionModal';
import LiveSessionManager from '@/components/LiveSessionManager';
import { conferenceService } from '@/services/conferenceService';
import { toast } from '@/hooks/use-toast';
import reviewerService from '@/services/reviewerService';
import { abstractService } from '@/services/abstractService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import LiveSessionSchedule from '@/components/LiveSessionSchedule';

const ConferenceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [conference, setConference] = useState<Conference | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReviewer, setIsReviewer] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<string | null>(null);
  const [showLiveSessionManager, setShowLiveSessionManager] = useState(false);

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

  useEffect(() => {
    // Vérifie si l'utilisateur courant est reviewer ou organisateur de cette conférence
    const checkRoles = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (!userStr || !id) return;
        const user = JSON.parse(userStr);
        // Organisateur
        if (conference && user.id === conference.organizer_id) {
          setIsOrganizer(true);
        } else {
          setIsOrganizer(false);
        }
        // Reviewer (assigné à la conf)
        const isReviewerAssigned = await reviewerService.isReviewerForConference(parseInt(id));
        setIsReviewer(isReviewerAssigned);
      } catch (e) {
        setIsReviewer(false);
        setIsOrganizer(false);
      }
    };
    checkRoles();
  }, [conference, id]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('payment') === 'success') {
      setShowPaymentSuccess(true);
      // Refresh registration status after successful payment
      if (conference) {
        fetch(`/api/conferences/${conference.id}/is-registered`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
          .then(res => res.json())
          .then(data => {
            setIsRegistered(data.registered);
            setRegistrationStatus(data.status || null);
          });
      }
    }
  }, [location.search, conference]);

  const handleBack = () => {
    navigate('/conferences');
  };

  const handleSubmitAbstract = () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour soumettre un abstract",
        variant: "destructive",
      });
      navigate('/login', { state: { from: `/conferences/${id}` } });
      return;
    }
    setIsSubmissionModalOpen(true);
  };

  const handleViewAbstracts = () => {
    navigate(`/reviewer/conference/${id}/abstracts`);
  };

  const handleRegister = async () => {
    if (!conference) return;
    setIsRegistering(true);
    try {
      // 1. Inscription
      const regRes = await fetch(`/api/conferences/${conference.id}/register`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      const regData = await regRes.json();
      if (!regRes.ok) throw new Error(regData.detail || regData.message || 'Erreur lors de l\'inscription');
      // Rafraîchir l'état d'inscription
      setIsRegistered(true);
      setRegistrationStatus(regData.status || null);
      // 2. Paiement (si payant)
      if (conference.fees > 0) {
        const payRes = await fetch(`http://localhost:8001/payments/create-session?registration_id=${regData.registration_id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const payData = await payRes.json();
        if (!payRes.ok) throw new Error(payData.detail || payData.message || 'Erreur lors de la création du paiement');
        window.location.href = payData.checkout_url;
      } else {
        toast({ title: 'Inscription réussie', description: 'Vous êtes inscrit à la conférence.' });
      }
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message || 'Erreur lors de l\'inscription', variant: 'destructive' });
    } finally {
      setIsRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement de la conférence...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!conference) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <p className="text-gray-600">Conférence introuvable</p>
            <Button onClick={handleBack} className="mt-4">
              Retour aux conférences
            </Button>
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
              
              {/* Boutons d'action */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => navigate(`/conferences/${conference.id}/live`)}
                >
                  <Video className="w-4 h-4 mr-2" />
                  Rejoindre la session live
                </Button>
                
                {isOrganizer && (
                  <Button
                    variant="outline"
                    onClick={() => setShowLiveSessionManager(true)}
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Gérer les sessions live
                  </Button>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <Users size={20} />
                <span>Organisé par {conference.organizer_name}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ajout du bouton conditionnel ou espace vide */}
        {(isReviewer || isOrganizer) ? (
          <div className="mb-6">
            <Button variant="default" onClick={handleViewAbstracts}>
              Voir les abstracts de cette conférence
            </Button>
          </div>
        ) : (
          <div className="mb-6"></div>
        )}

        {/* Ajout du bouton d'inscription */}
        {!isRegistered && !isOrganizer && (
          <div className="mb-6">
            <Button 
              onClick={handleRegister} 
              disabled={isRegistering}
              className="w-full md:w-auto"
            >
              {isRegistering ? 'Inscription en cours...' : `S'inscrire (${conference.fees} DH)`}
            </Button>
          </div>
        )}

        {isRegistered && (
          <div className="mb-6">
            <Badge variant="default" className="bg-green-600">
              ✓ Inscrit à cette conférence
            </Badge>
            {registrationStatus && (
              <p className="text-sm text-gray-600 mt-2">
                Statut: {
                  registrationStatus === 'paid' ? 'Payé' :
                  registrationStatus === 'pending' ? 'En attente de paiement' :
                  registrationStatus === 'cancelled' ? 'Annulé' :
                  registrationStatus
                }
              </p>
            )}
          </div>
        )}

        {/* Submit Abstract Button - visible to everyone */}
        <div className="mb-6">
          <Button 
            onClick={handleSubmitAbstract}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <FileText className="w-4 h-4 mr-2" />
            Soumettre un Abstract
          </Button>
        </div>

        {/* Informations de la conférence */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Dates importantes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-gray-500">Date limite de soumission</p>
                <p className="font-medium">
                  {format(new Date(conference.deadline), "dd MMMM yyyy", { locale: fr })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date de la conférence</p>
                <p className="font-medium">
                  {format(new Date(conference.important_date), "dd MMMM yyyy", { locale: fr })}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Informations pratiques
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-gray-500">Lieu</p>
                <p className="font-medium">
                  {conference.venue === VenueEnum.ONLINE ? 'En ligne' : 'Présentiel'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Frais d'inscription</p>
                <p className="font-medium flex items-center gap-1">
                  <span className="font-bold">DH</span>
                  {conference.fees}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Thématiques */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Thématiques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {conference.thematic.map((theme, index) => (
                <Badge key={index} variant="outline">
                  {theme}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        {conference.description && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                {conference.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Modal de soumission d'abstract */}
        <AbstractSubmissionModal
          isOpen={isSubmissionModalOpen}
          onClose={() => setIsSubmissionModalOpen(false)}
          conferenceId={conference.id}
        />

        {/* Modal de gestion des sessions live */}
        <Dialog open={showLiveSessionManager} onOpenChange={setShowLiveSessionManager}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gestion des Sessions Live</DialogTitle>
              <DialogDescription>
                Gérez les sessions live pour la conférence "{conference.title}"
              </DialogDescription>
            </DialogHeader>
            <LiveSessionManager conferenceId={conference.id} />
          </DialogContent>
        </Dialog>

        {/* Modal de succès de paiement */}
        <Dialog open={showPaymentSuccess} onOpenChange={setShowPaymentSuccess}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Paiement réussi !</DialogTitle>
              <DialogDescription>
                Votre inscription a été confirmée. Vous recevrez un email de confirmation.
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        {conference && (
          <LiveSessionSchedule conferenceId={conference.id} />
        )}
      </div>
    </div>
  );
};

export default ConferenceDetails;
