import api from '@/services/api';

const reviewerService = {
  // Get all reviewer invitations for a conference
  getConferenceInvitations: async (conferenceId: number) => {
    try {
      const response = await api.get(`/conferences/${conferenceId}/reviewer-invitations`);
      return response.data;
    } catch (error) {
      console.error('Error fetching reviewer invitations:', error);
      throw error;
    }
  },

  // Get all invitations sent by the current user
  getSentInvitations: async () => {
    try {
      const response = await api.get('/reviewer-invitations/sent');
      return response.data;
    } catch (error) {
      console.error('Error fetching sent invitations:', error);
      throw error;
    }
  },

  // Get all invitations received by the current user
  getReceivedInvitations: async () => {
    try {
      const response = await api.get('/reviewer-invitations/received');
      return response.data;
    } catch (error) {
      console.error('Error fetching received invitations:', error);
      throw error;
    }
  },

  // Accept a reviewer invitation
  acceptInvitation: async (invitationId: number) => {
    try {
      const response = await api.post(`/reviewer-invitations/${invitationId}/accept`);
      return response.data;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  },

  // Reject a reviewer invitation
  rejectInvitation: async (invitationId: number) => {
    try {
      const response = await api.post(`/reviewer-invitations/${invitationId}/reject`);
      return response.data;
    } catch (error) {
      console.error('Error rejecting invitation:', error);
      throw error;
    }
  }
};

export default reviewerService; 