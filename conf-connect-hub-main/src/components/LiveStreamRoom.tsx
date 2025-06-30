import React, { useEffect, useRef, useState } from "react";
import QAPanel from "./QAPanel";
import { liveSessionService } from "@/services/liveSessionService";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Play, Clock } from "lucide-react";

// Déclaration globale pour Jitsi Meet
declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

type LiveStreamRoomProps = { 
  user: { fullname: string }, 
  conferenceId: number 
};

const LiveStreamRoom = ({ user, conferenceId }: LiveStreamRoomProps) => {
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);
  const [hasLeft, setHasLeft] = useState(false);
  const [canJoin, setCanJoin] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOrganizer, setIsOrganizer] = useState(false);

  useEffect(() => {
    checkSessionAccess();
  }, [conferenceId]);

  const checkSessionAccess = async () => {
    try {
      setLoading(true);
      const response = await liveSessionService.canJoinSession(conferenceId);
      setCanJoin(response.can_join);
      setSessionInfo(response.session);
      
      // Vérifier si l'utilisateur est l'organisateur
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        // TODO: Récupérer l'organizer_id de la conférence pour vérifier
        // Pour l'instant, on suppose que l'organisateur peut toujours accéder
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'accès:', error);
      toast({
        title: "Erreur",
        description: "Impossible de vérifier l'accès à la session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canJoin || hasLeft) return; // Ne pas initialiser Jitsi si on ne peut pas rejoindre ou si on a quitté
    
    // Charger le script Jitsi Meet
    const script = document.createElement('script');
    script.src = 'https://localhost:8443/external_api.js';
    script.async = true;
    script.onload = initializeJitsi;
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      if (jitsiApiRef.current) {
        jitsiApiRef.current.executeCommand('hangup');
      }
    };
  }, [conferenceId, canJoin, hasLeft]);

  const initializeJitsi = () => {
    if (!jitsiContainerRef.current || !window.JitsiMeetExternalAPI) return;
    const roomName = `vrtlconf-conference-${conferenceId}`;
    const domain = 'localhost:8443';
    const options = {
      roomName: roomName,
      width: '100%',
      height: 600,
      parentNode: jitsiContainerRef.current,
      userInfo: {
        displayName: user.fullname,
      },
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        prejoinPageEnabled: false,
        disableDeepLinking: true,
        toolbarButtons: [
          'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
          'fodeviceselection', 'hangup', 'chat', 'recording',
          'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
          'videoquality', 'filmstrip', 'feedback', 'stats', 'shortcuts',
          'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone', 'security'
        ],
        settings: {
          language: 'fr'
        }
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        SHOW_POWERED_BY: false,
        SHOW_BRAND_WATERMARK: false,
        SHOW_PROMOTIONAL_SPONSOR: false,
        SHOW_WELCOME_PAGE: false,
        SHOW_WELCOME_PAGE_CONTENT: false,
        SHOW_WELCOME_PAGE_TOOLBAR_ADDITIONAL_CONTENT: false,
        SHOW_MEETING_NAME: true,
        SHOW_MEETING_NAME_AS_HEADER: true,
        MEETING_NAME: `Conférence ${conferenceId}`,
        TOOLBAR_ALWAYS_VISIBLE: true,
        SETTINGS_SECTIONS: ['devices', 'language', 'moderator', 'profile', 'calendar'],
        LANG_DETECTION: true,
        AUTHENTICATION_ENABLE: false
      }
    };
    try {
      jitsiApiRef.current = new window.JitsiMeetExternalAPI(domain, options);
      jitsiApiRef.current.addEventListeners({
        readyToClose: handleClose,
        participantLeft: handleParticipantLeft,
        participantJoined: handleParticipantJoined,
        videoConferenceJoined: handleVideoConferenceJoined,
        videoConferenceLeft: handleVideoConferenceLeft,
      });
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de Jitsi Meet:', error);
    }
  };

  const handleClose = () => {
    setHasLeft(true);
  };

  const handleParticipantLeft = (participant: any) => {
    console.log('Participant parti:', participant);
  };

  const handleParticipantJoined = (participant: any) => {
    console.log('Nouveau participant:', participant);
  };

  const handleVideoConferenceJoined = (participant: any) => {
    console.log('Vous avez rejoint la conférence:', participant);
  };

  const handleVideoConferenceLeft = (participant: any) => {
    setHasLeft(true);
  };

  const handleLeaveRoom = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('hangup');
    }
    setHasLeft(true);
  };

  const handleRefresh = () => {
    checkSessionAccess();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Vérification de l'accès à la session...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!canJoin) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <Card className="max-w-md mx-auto mt-20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-6 h-6" />
                Session non disponible
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Aucune session active pour cette conférence. L'organisateur doit lancer la session en premier.
              </p>
              <div className="flex gap-2">
                <Button onClick={handleRefresh} variant="outline">
                  Actualiser
                </Button>
                <Button onClick={() => window.history.back()}>
                  Retour
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4">Live Streaming - Conférence {conferenceId}</h1>
          <p className="text-gray-600 mb-4">
            Connecté en tant que : <strong>{user.fullname}</strong>
          </p>
          {sessionInfo && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 flex items-center gap-2">
                <Play className="w-4 h-4" />
                Session active : {sessionInfo.session_title}
              </p>
              {sessionInfo.started_at && (
                <p className="text-sm text-green-600 flex items-center gap-2 mt-1">
                  <Clock className="w-4 h-4" />
                  Lancée le {new Date(sessionInfo.started_at).toLocaleString('fr-FR')}
                </p>
              )}
            </div>
          )}
          {!hasLeft && (
            <button
              onClick={handleLeaveRoom}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded mb-4"
            >
              Quitter la session
            </button>
          )}
        </div>
        {/* Affichage conditionnel */}
        {!hasLeft ? (
          <div className="mb-6">
            <div
              ref={jitsiContainerRef}
              className="w-full bg-white rounded-lg shadow-lg overflow-hidden"
              style={{ minHeight: '600px' }}
            />
          </div>
        ) : (
          <div className="mb-6 flex flex-col items-center justify-center bg-white rounded-lg shadow-lg p-12">
            <h2 className="text-2xl font-bold text-green-700 mb-4">Vous avez quitté la session live</h2>
            <p className="text-gray-600 mb-4">Merci pour votre participation !</p>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              onClick={() => window.location.reload()}
            >
              Rejoindre à nouveau
            </button>
          </div>
        )}
        {/* Q&A Panel toujours visible */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <QAPanel conferenceId={conferenceId} user={user} />
        </div>
      </div>
    </div>
  );
};

export default LiveStreamRoom; 