import api from '@/lib/api';

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
  },

  // Submit a review for an abstract
  submitReview: async (abstractId: number, comment: string, decision: 'ACCEPTED' | 'REJECTED') => {
    try {
      const response = await api.post('/reviews/', {
        abstract_id: abstractId,
        comment,
        decision
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  },

  // Check if current user is reviewer for a conference
  isReviewerForConference: async (conferenceId: number) => {
    try {
      const response = await api.get(`/conferences/${conferenceId}/reviewers`);
      const userStr = localStorage.getItem('user');
      if (!userStr) return false;
      const user = JSON.parse(userStr);
      return response.data.some((r: any) => r.id === user.id);
    } catch (error) {
      console.error('Error checking reviewer status:', error);
      return false;
    }
  },

  // Get my review for an abstract
  getMyReviewForAbstract: async (abstractId: number) => {
    try {
      const response = await api.get(`/reviewer/my-reviews?abstract_id=${abstractId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching my review for abstract:', error);
      throw error;
    }
  },

  // Update a review
  updateReview: async (reviewId: number, comment: string, decision: 'ACCEPTED' | 'REJECTED') => {
    try {
      const response = await api.put(`/reviews/${reviewId}`, {
        comment,
        decision
      });
      return response.data;
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  }
};

export default reviewerService; 