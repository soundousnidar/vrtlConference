import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { User, FileText, Eye, Calendar, Award, Mail, Building, Plus, Edit, UserPlus, Trash, ClipboardList } from 'lucide-react';
import { Abstract, AbstractStatus, Conference, Review, ConferenceStatus, VenueEnum, ReviewerInvitation } from '@/types/conference';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { profileService, type ProfileData } from '@/services/profileService';
import { abstractService } from '@/services/abstractService';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { conferenceService } from '@/services/conferenceService';
import ReviewerInvitationsTable from '@/components/ReviewerInvitationsTable';
import reviewerService from '@/services/reviewerService';
import AbstractSubmissionModal from '@/components/AbstractSubmissionModal';
import { BarChart } from "lucide-react";



const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedConference, setSelectedConference] = useState<Conference | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [sentInvitations, setSentInvitations] = useState<ReviewerInvitation[]>([]);
  const [receivedInvitations, setReceivedInvitations] = useState<ReviewerInvitation[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAbstract, setSelectedAbstract] = useState<Abstract | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [abstractsReviews, setAbstractsReviews] = useState<any[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Check if we're logged in
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token found, redirecting to login...'); // Debug log
          navigate('/login', { state: { from: '/profile' } });
          return;
        }

        console.log('Fetching profile data...'); // Debug log
        const data = await profileService.getProfile();
        console.log('Profile data received:', data); // Debug log
        setProfileData(data);
        // Ajoute la conférence à chaque abstract pour l'affichage du lien
        const absWithConf = (data.abstracts_reviews || []).map((abs: any) => {
          // Cherche la conférence dans profileData.abstracts
          const found = (data.abstracts || []).find((a: any) => a.id === abs.abstract_id);
          return { ...abs, conference: found?.conference };
        });
        setAbstractsReviews(absWithConf);
      } catch (error: any) {
        console.error('Error in fetchProfile:', error);
        
        // Handle authentication errors
        if (error.message === 'Session expirée, veuillez vous reconnecter') {
          toast({
            title: "Session expirée",
            description: "Veuillez vous reconnecter pour accéder à votre profil. (Token manquant, expiré ou invalide)",
            variant: "destructive",
          });
          console.error('[DEBUG] Session expired or invalid token.');
          navigate('/login', { state: { from: '/profile' } });
          return;
        }

        toast({
          title: "Erreur",
          description: error.message || "Impossible de charger les informations du profil",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  useEffect(() => {
    const fetchInvitations = async () => {
      try {
        const [sent, received] = await Promise.all([
          reviewerService.getSentInvitations(),
          reviewerService.getReceivedInvitations()
        ]);
        setSentInvitations(sent as ReviewerInvitation[]);
        setReceivedInvitations(received as ReviewerInvitation[]);
      } catch (error) {
        console.error('Error fetching invitations:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les invitations",
          variant: "destructive",
        });
      }
    };

    fetchInvitations();
  }, []);

  useEffect(() => {
    profileService.getRegistrations().then(setRegistrations).catch(() => setRegistrations([]));
  }, []);

  // Add refresh function for registrations
  const refreshRegistrations = async () => {
    try {
      const data = await profileService.getRegistrations();
      setRegistrations(data);
    } catch (error) {
      console.error('Error refreshing registrations:', error);
      setRegistrations([]);
    }
  };

  const getStatusBadge = (status: AbstractStatus | string | undefined) => {
    const statusConfig = {
      PENDING: { label: "En attente", variant: "outline" as const },
      ACCEPTED: { label: "Accepté", variant: "default" as const },
      REJECTED: { label: "Rejeté", variant: "destructive" as const }
    };
    const normalizedStatus = (status || '').toUpperCase();
    const config = statusConfig[normalizedStatus as AbstractStatus];
    if (!config) {
      return null;
    }
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleEditConference = (conference: Conference) => {
    navigate(`/conferences/edit/${conference.id}`);
  };

  const handleInviteReviewer = (conference: Conference) => {
    setSelectedConference(conference);
    setIsInviteModalOpen(true);
  };

  const handleSendInvitation = async () => {
    if (!selectedConference || !inviteEmail) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir une adresse email",
        variant: "destructive",
      });
      return;
    }

    try {
      await conferenceService.inviteReviewer(selectedConference.id, inviteEmail);
      toast({
        title: "Succès",
        description: "Le reviewer a été invité avec succès",
      });
      setIsInviteModalOpen(false);
      setInviteEmail('');
    } catch (error: any) {
      console.log('Error details:', error.response?.data);
      const errorMessage = error.response?.data?.detail || 
                         (error.response?.data?.message) || 
                         "Impossible d'envoyer l'invitation";
      
      toast({
        title: "Erreur",
        description: typeof errorMessage === 'string' ? errorMessage : "Une erreur est survenue",
        variant: "destructive",
      });
    }
  };

  const handleAcceptInvitation = async (invitationId: number) => {
    try {
      await reviewerService.acceptInvitation(invitationId);
      // Mettre à jour la liste des invitations
      const updatedInvitations = await reviewerService.getReceivedInvitations();
      setReceivedInvitations(updatedInvitations as ReviewerInvitation[]);
      toast({
        title: "Succès",
        description: "Invitation acceptée avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'accepter l'invitation",
        variant: "destructive",
      });
    }
  };

  const handleRejectInvitation = async (invitationId: number) => {
    try {
      await reviewerService.rejectInvitation(invitationId);
      // Mettre à jour la liste des invitations
      const updatedInvitations = await reviewerService.getReceivedInvitations();
      setReceivedInvitations(updatedInvitations as ReviewerInvitation[]);
      toast({
        title: "Succès",
        description: "Invitation refusée avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de refuser l'invitation",
        variant: "destructive",
      });
    }
  };

  const handleEditAbstract = (abstract: Abstract) => {
    setSelectedAbstract(abstract);
    setIsEditModalOpen(true);
  };

  const handleDeleteAbstract = (abstract: Abstract) => {
    setSelectedAbstract(abstract);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteAbstract = async () => {
    if (!selectedAbstract) return;
    
    try {
      await abstractService.deleteAbstract(selectedAbstract.id);
      toast({
        title: "Succès",
        description: "L'abstract a été supprimé avec succès"
      });
      
      // Refresh profile data to update the abstracts list
      const data = await profileService.getProfile();
      setProfileData(data);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer l'abstract",
        variant: "destructive"
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedAbstract(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-40 bg-gray-200 rounded-lg"></div>
            <div className="grid md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            Impossible de charger les informations du profil
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header du profil */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {profileData.fullname.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2">
                    {profileData.fullname}
                  </h1>
                  <div className="space-y-2 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Mail size={16} />
                      <span>{profileData.email}</span>
                    </div>
                  </div>
                </div>
              </div>
              <Button 
                onClick={() => navigate('/conferences/create')}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              >
                <Plus size={16} />
                Créer une conférence
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Statistiques rapides */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <FileText className="mx-auto h-8 w-8 text-blue-600 mb-2" />
              <div className="text-2xl font-bold">{profileData.abstracts?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Abstracts soumis</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Eye className="mx-auto h-8 w-8 text-green-600 mb-2" />
              <div className="text-2xl font-bold">{profileData.reviews?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Reviews effectuées</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="mx-auto h-8 w-8 text-orange-600 mb-2" />
              <div className="text-2xl font-bold">{profileData.conferences?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Conférences organisées</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Award className="mx-auto h-8 w-8 text-purple-600 mb-2" />
              <div className="text-2xl font-bold">
                {profileData.abstracts?.filter(a => a.status === AbstractStatus.ACCEPTED).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Abstracts acceptés</div>
            </CardContent>
          </Card>
        </div>

        {/* Contenu détaillé */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="abstracts">Mes Abstracts</TabsTrigger>
            <TabsTrigger value="reviews">Mes Reviews</TabsTrigger>
            <TabsTrigger value="conferences">Mes Conférences</TabsTrigger>
            <TabsTrigger value="registrations">Inscriptions</TabsTrigger>
            <TabsTrigger value="received_reviews">Reviews reçues</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Abstracts récents */}
              <Card>
                <CardHeader>
                  <CardTitle>Abstracts Récents</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profileData.abstracts?.slice(0, 3).map((abstract) => (
                    <div key={abstract.id} className="border-l-4 border-blue-500 pl-4">
                      <div className="font-medium">{abstract.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {abstract.conference ? abstract.conference.title : 'Conférence inconnue'}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(abstract.status)}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(abstract.submitted_at), 'dd MMM yyyy', { locale: fr })}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Reviews récentes */}
              <Card>
                <CardHeader>
                  <CardTitle>Reviews Récentes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profileData.reviews?.slice(0, 3).map((review) => (
                    <div key={review.id} className="border-l-4 border-green-500 pl-4">
                      <div className="font-medium">{review.abstract?.title || 'Abstract inconnu'}</div>
                      <div className="text-sm text-muted-foreground">
                        {review.abstract?.conference ? review.abstract.conference.title : 'Conférence inconnue'}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="abstracts" className="space-y-4">
            {profileData.abstracts?.filter(Boolean).map(abs => (
              abs && (
                <Card key={abs.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{abs.title}</CardTitle>
                        {abs.conference && abs.conference.id ? (
                          <a
                            href={`/conferences/${abs.conference.id}`}
                            className="text-blue-600 hover:underline text-sm mt-1 block"
                          >
                            {abs.conference.title}
                          </a>
                        ) : (
                          <p className="text-muted-foreground">Conférence inconnue</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(abs.status)}
                        {abs.status === AbstractStatus.PENDING && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditAbstract(abs)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Modifier
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteAbstract(abs)}
                            >
                              <Trash className="h-4 w-4 mr-1" />
                              Supprimer
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {abs.summary}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Mots-clés: {abs.keywords}</span>
                      <span>Soumis le {format(new Date(abs.submitted_at), 'dd MMM yyyy', { locale: fr })}</span>
                    </div>
                  </CardContent>
                </Card>
              )
            ))}
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            {profileData.reviews?.map((review) => (
              <Card key={review.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{review.abstract?.title || 'Abstract inconnu'}</CardTitle>
                      {review.abstract?.conference && review.abstract.conference.id && (
                        <a
                          href={`/conferences/${review.abstract.conference.id}`}
                          className="text-blue-600 hover:underline text-sm mt-1 block"
                        >
                          {review.abstract.conference.title}
                        </a>
                      )}
                    </div>
                    {/* Show edit button if user is the author of the abstract */}
                    {review.abstract && review.abstract.user_id === profileData.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAbstract(review.abstract);
                          setIsEditModalOpen(true);
                        }}
                      >
                        Modifier mon abstract
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{review.comment}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="conferences" className="space-y-4">
            {profileData.conferences && profileData.conferences.length > 0 ? (
              profileData.conferences.map((conference) => (
                <Card key={conference.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{conference.title}</CardTitle>
                        <p className="text-muted-foreground">
                          Date limite: {conference.deadline ? format(new Date(conference.deadline), 'dd MMM yyyy', { locale: fr }) : 'Non définie'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={conference.status === ConferenceStatus.ACTIVE ? 'default' : 'secondary'}>
                          {conference.status === ConferenceStatus.ACTIVE ? 'Active' : 'Terminée'}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditConference(conference)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Modifier
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInviteReviewer(conference)}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Inviter un reviewer
                        </Button>
                         <Button
        variant="outline"
        size="sm"
        onClick={() => window.location.href = `/dashboard/${conference.id}`}
      >
        <BarChart className="h-4 w-4 mr-1" />
        Statistiques
      </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar size={16} />
                        <span>Date importante: {conference.important_date ? format(new Date(conference.important_date), 'dd MMM yyyy', { locale: fr }) : 'Non définie'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Building size={16} />
                        <span>Lieu: {conference.venue === VenueEnum.ONLINE ? 'En ligne' : 'Présentiel'}</span>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {conference.thematic.map((theme, index) => (
                        <Badge key={index} variant="outline">{theme}</Badge>
                      ))}
                    </div>

                    {/* Section des invitations pour cette conférence */}
                    <div className="mt-6 border-t pt-4">
                      <h4 className="text-sm font-semibold mb-3">Invitations de Reviewers</h4>
                      {sentInvitations.filter(inv => inv.conference_id === conference.id).length === 0 ? (
                        <p className="text-sm text-muted-foreground">Aucune invitation envoyée pour cette conférence</p>
                      ) : (
                        <div className="space-y-3">
                          {sentInvitations
                            .filter(inv => inv.conference_id === conference.id)
                            .map((invitation) => (
                              <div key={invitation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <p className="text-sm font-medium">{invitation.invitee_email}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Envoyée le {new Date(invitation.created_at).toLocaleDateString('fr-FR', {
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric'
                                    })}
                                  </p>
                                </div>
                                <Badge
                                  variant={
                                    invitation.status === 'pending' ? 'outline' :
                                    invitation.status === 'accepted' ? 'default' :
                                    'destructive'
                                  }
                                >
                                  {invitation.status === 'pending' ? 'En attente' :
                                   invitation.status === 'accepted' ? 'Acceptée' :
                                   'Refusée'}
                                </Badge>
                              </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Vous n'avez pas encore organisé de conférences
              </div>
            )}
          </TabsContent>

          <TabsContent value="registrations" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Mes Inscriptions & Paiements</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={refreshRegistrations}
                    className="flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Actualiser
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border rounded-lg overflow-hidden">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold">Conférence</th>
                        <th className="px-4 py-2 text-left font-semibold">Frais</th>
                        <th className="px-4 py-2 text-left font-semibold w-40">Statut</th>
                        <th className="px-4 py-2 text-left font-semibold">Date inscription</th>
                        <th className="px-4 py-2 text-left font-semibold">Paiements</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrations.map(reg => (
                        <tr key={reg.registration_id} className="border-b last:border-b-0">
                          <td className="px-4 py-2">{reg.conference.title}</td>
                          <td className="px-4 py-2">{reg.conference.fees} DH</td>
                          <td className="px-4 py-2 w-40 text-center align-middle">
                            {reg.status === 'paid' || reg.status === 'completed' ? (
                              <span className="inline-flex items-center gap-1 px-3 py-2 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                ✓ Payé
                              </span>
                            ) : reg.status === 'cancelled' ? (
                              <span className="inline-flex items-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                                ✗ Annulé
                              </span>
                            ) : reg.status === 'pending' ? (
                              <span className="inline-flex items-center gap-1 px-3 py-2 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                                ⏳ En attente
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                                {reg.status}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2">{new Date(reg.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-2">
                            {reg.payments.length === 0 ? (
                              <span className="text-gray-400">Aucun</span>
                            ) : (
                              reg.payments.map((p: any, i: number) => (
                                <div key={i} className="mb-1">
                                  <span>{p.amount} DH</span> - <span>{p.status}</span> <span className="text-xs text-muted-foreground">({p.paid_at ? new Date(p.paid_at).toLocaleDateString() : ''})</span>
                                </div>
                              ))
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="received_reviews" className="space-y-4">
            {abstractsReviews.length === 0 ? (
              <Card><CardContent className="py-8 text-center">Aucune review reçue sur vos abstracts pour le moment.</CardContent></Card>
            ) : (
              abstractsReviews.map(abs => (
                <Card key={abs.abstract_id}>
                  <CardHeader>
                    <CardTitle>{abs.title}</CardTitle>
                    {abs.conference && abs.conference.id && (
                      <a
                        href={`/conferences/${abs.conference.id}`}
                        className="text-blue-600 hover:underline text-sm mt-1 block"
                      >
                        Voir la conférence : {abs.conference.title}
                      </a>
                    )}
                  </CardHeader>
                  <CardContent>
                    {abs.reviews.length === 0 ? (
                      <div className="text-muted-foreground">Aucune review reçue pour cet abstract.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm border rounded-lg overflow-hidden">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-4 py-2 text-left font-semibold">Reviewer</th>
                              <th className="px-4 py-2 text-left font-semibold w-40">Décision</th>
                              <th className="px-4 py-2 text-left font-semibold">Commentaire</th>
                            </tr>
                          </thead>
                          <tbody>
                            {abs.reviews.map((rev: any) => (
                              <tr key={rev.id} className="border-b last:border-b-0">
                                <td className="px-4 py-2">
                                  {rev.reviewer?.fullname || rev.reviewer?.email || <span className="italic text-gray-400">Inconnu</span>}
                                </td>
                                <td className="px-4 py-2 w-40 text-center align-middle">
                                  {rev.decision === "ACCEPTED" ? (
                                    <span className="inline-flex items-center gap-1 px-3 py-2 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                      ✓ Accepté
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                                      ✗ Refusé
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-2 whitespace-pre-line">{rev.comment}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Show sent invitations for conference organizers */}
        {profileData?.role === "ORGANIZER" && (
          <div className="mt-8">
            <ReviewerInvitationsTable invitations={sentInvitations} />
          </div>
        )}

        {/* Show received invitations for reviewers */}
        {profileData?.role === "REVIEWER" && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Invitations Reçues</h3>
            <ReviewerInvitationsTable invitations={receivedInvitations} />
          </div>
        )}
      </div>

      {/* Modal d'invitation de reviewer */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inviter un reviewer</DialogTitle>
            <DialogDescription>
              Envoyez une invitation à un expert pour qu'il devienne reviewer de votre conférence.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email du reviewer</Label>
              <Input
                id="email"
                type="email"
                placeholder="exemple@domaine.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <Button onClick={handleSendInvitation} className="w-full">
              Envoyer l'invitation
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Abstract Modal */}
      {selectedAbstract && (
        <AbstractSubmissionModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedAbstract(null);
          }}
          onSubmit={async (formData) => {
            try {
              await abstractService.editAbstract(selectedAbstract.id, formData);
              toast({
                title: "Succès",
                description: "L'abstract a été modifié avec succès"
              });
              const data = await profileService.getProfile();
              setProfileData(data);
            } catch (error: any) {
              toast({
                title: "Erreur",
                description: error.message || "Impossible de modifier l'abstract",
                variant: "destructive"
              });
            } finally {
              setIsEditModalOpen(false);
              setSelectedAbstract(null);
            }
          }}
          abstract={selectedAbstract}
          mode="edit"
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cet abstract ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteAbstract}
            >
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserProfile;
