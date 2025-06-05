import api from '../lib/api';
import type { Conference } from '@/types/conference';

export const conferenceService = {
  // Get all conferences
  getAllConferences: async () => {
    try {
      const response = await api.get<{ conferences: Conference[] }>('/conferences/');
      console.log('API Response:', response.data); // Debug log
      return response.data.conferences || [];
    } catch (error) {
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },

  // Get a single conference
  getConference: async (id: number) => {
    try {
      const response = await api.get<Conference>(`/conferences/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching conference ${id}:`, error);
      throw error;
    }
  },

  // Create a new conference
  createConference: async (conferenceData: FormData) => {
    try {
      const response = await api.post<Conference>('/conferences/', conferenceData);
      return response.data;
    } catch (error) {
      console.error('Error creating conference:', error);
      throw error;
    }
  },

  // Update a conference
  updateConference: async (id: number, conferenceData: FormData) => {
    try {
      const response = await api.put<Conference>(`/conferences/${id}`, conferenceData);
      return response.data;
    } catch (error) {
      console.error(`Error updating conference ${id}:`, error);
      throw error;
    }
  },

  // Delete a conference
  deleteConference: async (id: number) => {
    try {
      const response = await api.delete(`/conferences/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting conference ${id}:`, error);
      throw error;
    }
  },

  // Invite a reviewer
  inviteReviewer: async (conferenceId: number, email: string) => {
    try {
      const formData = new FormData();
      formData.append('email', email);
      
      const response = await api.post(`/conferences/${conferenceId}/invite-reviewer`, formData);
      return response.data;
    } catch (error) {
      console.error(`Error inviting reviewer for conference ${conferenceId}:`, error);
      throw error;
    }
  },

  // Accept reviewer invitation
  acceptInvitation: async (invitationId: string) => {
    try {
      const response = await api.post(`/reviewer-invitations/${invitationId}/accept`);
      return response.data;
    } catch (error) {
      console.error(`Error accepting invitation ${invitationId}:`, error);
      throw error;
    }
  },

  // Reject reviewer invitation
  rejectInvitation: async (invitationId: string) => {
    try {
      const response = await api.post(`/reviewer-invitations/${invitationId}/reject`);
      return response.data;
    } catch (error) {
      console.error(`Error rejecting invitation ${invitationId}:`, error);
      throw error;
    }
  }
}; 