import api from '@/lib/api';

export interface LiveSession {
  id: number;
  session_title: string;
  session_time: string;
  status: 'PENDING' | 'ACTIVE' | 'ENDED';
  is_active: boolean;
  started_at?: string;
  ended_at?: string;
  organizer_id: number;
}

export interface CreateSessionData {
  session_title: string;
  session_time: string;
}

export interface SessionResponse {
  active_session?: LiveSession;
  message?: string;
}

export interface CanJoinResponse {
  can_join: boolean;
  reason?: string;
  session?: {
    id: number;
    session_title: string;
    started_at?: string;
  };
}

class LiveSessionService {
  // Créer une nouvelle session live
  async createSession(conferenceId: number, data: CreateSessionData): Promise<LiveSession> {
    const formData = new FormData();
    formData.append('session_title', data.session_title);
    formData.append('session_time', data.session_time);
    
    const response = await api.post(`/conferences/${conferenceId}/live-sessions`, formData);
    return response.data;
  }

  // Lancer une session
  async startSession(conferenceId: number, sessionId: number): Promise<LiveSession> {
    const response = await api.post(`/conferences/${conferenceId}/live-sessions/${sessionId}/start`);
    return response.data;
  }

  // Arrêter une session
  async stopSession(conferenceId: number, sessionId: number): Promise<LiveSession> {
    const response = await api.post(`/conferences/${conferenceId}/live-sessions/${sessionId}/stop`);
    return response.data;
  }

  // Obtenir la session active d'une conférence
  async getActiveSession(conferenceId: number): Promise<SessionResponse> {
    const response = await api.get(`/conferences/${conferenceId}/live-sessions/active`);
    return response.data;
  }

  // Obtenir toutes les sessions d'une conférence (pour l'organisateur)
  async getConferenceSessions(conferenceId: number): Promise<{ sessions: LiveSession[] }> {
    const response = await api.get(`/conferences/${conferenceId}/live-sessions`);
    return response.data;
  }

  // Vérifier si l'utilisateur peut rejoindre la session
  async canJoinSession(conferenceId: number): Promise<CanJoinResponse> {
    const response = await api.get(`/conferences/${conferenceId}/live-sessions/can-join`);
    return response.data;
  }

  // Obtenir toutes les sessions publiques d'une conférence (pour tous)
  async getPublicSessions(conferenceId: number): Promise<{ sessions: LiveSession[] }> {
    const response = await api.get(`/conferences/${conferenceId}/live-sessions/public`);
    return response.data;
  }

  // Supprimer une session live
  async deleteSession(conferenceId: number, sessionId: number): Promise<void> {
    await api.delete(`/conferences/${conferenceId}/live-sessions/${sessionId}`);
  }
}

export const liveSessionService = new LiveSessionService(); 