import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Play, Square, Plus, Clock, Users, Trash } from 'lucide-react';
import { liveSessionService, LiveSession, CreateSessionData } from '@/services/liveSessionService';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

interface LiveSessionManagerProps {
  conferenceId: number;
}

const LiveSessionManager: React.FC<LiveSessionManagerProps> = ({ conferenceId }) => {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSession, setNewSession] = useState<CreateSessionData>({
    session_title: '',
    session_time: ''
  });
  const [sessionToDelete, setSessionToDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchSessions();
  }, [conferenceId]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await liveSessionService.getConferenceSessions(conferenceId);
      setSessions(response.sessions);
    } catch (error) {
      console.error('Erreur lors du chargement des sessions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les sessions live",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    try {
      if (!newSession.session_title || !newSession.session_time) {
        toast({
          title: "Erreur",
          description: "Veuillez remplir tous les champs",
          variant: "destructive",
        });
        return;
      }

      await liveSessionService.createSession(conferenceId, newSession);
      toast({
        title: "Succès",
        description: "Session créée avec succès",
      });
      setIsCreateDialogOpen(false);
      setNewSession({ session_title: '', session_time: '' });
      fetchSessions();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.detail || "Erreur lors de la création de la session",
        variant: "destructive",
      });
    }
  };

  const handleStartSession = async (sessionId: number) => {
    try {
      await liveSessionService.startSession(conferenceId, sessionId);
      toast({
        title: "Succès",
        description: "Session lancée avec succès",
      });
      fetchSessions();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.detail || "Erreur lors du lancement de la session",
        variant: "destructive",
      });
    }
  };

  const handleStopSession = async (sessionId: number) => {
    try {
      await liveSessionService.stopSession(conferenceId, sessionId);
      toast({
        title: "Succès",
        description: "Session arrêtée avec succès",
      });
      fetchSessions();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.detail || "Erreur lors de l'arrêt de la session",
        variant: "destructive",
      });
    }
  };

  const confirmDeleteSession = async () => {
    if (sessionToDelete === null) return;
    try {
      await liveSessionService.deleteSession(conferenceId, sessionToDelete);
      toast({
        title: 'Session supprimée',
        description: 'La session a été supprimée avec succès.',
      });
      setSessionToDelete(null);
      fetchSessions();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.detail || "Erreur lors de la suppression de la session",
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary">En attente</Badge>;
      case 'ACTIVE':
        return <Badge variant="default" className="bg-green-600">Active</Badge>;
      case 'ENDED':
        return <Badge variant="destructive">Terminée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Chargement des sessions...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des Sessions Live</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Créer une session
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une nouvelle session live</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="session_title">Titre de la session</Label>
                <Input
                  id="session_title"
                  value={newSession.session_title}
                  onChange={(e) => setNewSession({ ...newSession, session_title: e.target.value })}
                  placeholder="Ex: Session d'ouverture"
                />
              </div>
              <div>
                <Label htmlFor="session_time">Date et heure prévue</Label>
                <Input
                  id="session_time"
                  type="datetime-local"
                  value={newSession.session_time}
                  onChange={(e) => setNewSession({ ...newSession, session_time: e.target.value })}
                />
              </div>
              <Button onClick={handleCreateSession} className="w-full">
                Créer la session
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">Aucune session créée pour cette conférence</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <Card key={session.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {session.session_title}
                      {getStatusBadge(session.status)}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      <Clock className="w-4 h-4 inline mr-1" />
                      {format(new Date(session.session_time), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {session.status === 'PENDING' && (
                      <Button
                        size="sm"
                        onClick={() => handleStartSession(session.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Lancer
                      </Button>
                    )}
                    {session.status === 'ACTIVE' && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleStopSession(session.id)}
                      >
                        <Square className="w-4 h-4 mr-1" />
                        Arrêter
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSessionToDelete(session.id)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      title="Supprimer la session"
                    >
                      <Trash className="w-4 h-4 mr-1" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {session.started_at && (
                  <p className="text-sm text-gray-600">
                    Lancée le: {format(new Date(session.started_at), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                  </p>
                )}
                {session.ended_at && (
                  <p className="text-sm text-gray-600">
                    Terminée le: {format(new Date(session.ended_at), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={sessionToDelete !== null} onOpenChange={open => { if (!open) setSessionToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la session ?</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment supprimer cette session ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteSession}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LiveSessionManager; 