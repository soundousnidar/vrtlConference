import React, { useEffect, useState } from 'react';
import { liveSessionService, LiveSession } from '@/services/liveSessionService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, Square } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface LiveSessionScheduleProps {
  conferenceId: number;
}

const LiveSessionSchedule: React.FC<LiveSessionScheduleProps> = ({ conferenceId }) => {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line
  }, [conferenceId]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await liveSessionService.getPublicSessions(conferenceId);
      setSessions(response.sessions);
    } catch (error) {
      setSessions([]);
    } finally {
      setLoading(false);
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
    return <div>Chargement de l'emploi du temps des sessions...</div>;
  }

  if (sessions.length === 0) {
    return <div>Aucune session live programmée pour cette conférence.</div>;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Emploi du temps des sessions live</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sessions.map((session) => (
            <div key={session.id} className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-2 last:border-b-0 last:pb-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{session.session_title}</span>
                {getStatusBadge(session.status)}
              </div>
              <div className="flex items-center gap-2 text-gray-600 text-sm mt-1 md:mt-0">
                <Clock className="w-4 h-4" />
                {format(new Date(session.session_time), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                {session.status === 'ACTIVE' && (
                  <span className="flex items-center gap-1 text-green-700 ml-2"><Play className="w-4 h-4" />En cours</span>
                )}
                {session.status === 'ENDED' && (
                  <span className="flex items-center gap-1 text-red-700 ml-2"><Square className="w-4 h-4" />Terminée</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveSessionSchedule; 