import api from '@/lib/api';
import type { User, Conference, Abstract } from '@/types/conference';

export interface ProfileData {
  id: number;
  fullname: string;
  email: string;
  role: string;
  abstracts: Abstract[];
  reviews: any[];
  conferences: Conference[];
  reviewer_conferences?: Conference[];
  conference_count: number;
  affiliation: string | null;
}

export const profileService = {
  // Get user profile
  getProfile: async (): Promise<ProfileData> => {
    try {
      // Check if we have a token
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found in localStorage');
        throw new Error('Vous devez être connecté pour accéder à votre profil');
      }

      // Ensure token has Bearer prefix
      const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      
      // Fetch profile data
      const profileResponse = await api.get<ProfileData>('/profile');
      
      // Return the profile data
      return profileResponse.data;
    } catch (error: any) {
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // If the error is due to authentication
      if (error.response?.status === 401) {
        console.log('Authentication error, clearing credentials...'); // Debug log
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        throw new Error('Session expirée, veuillez vous reconnecter');
      }
      
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (profileData: FormData): Promise<ProfileData> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Vous devez être connecté pour mettre à jour votre profil');
      }

      const response = await api.put<ProfileData>('/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  getRegistrations: async () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Vous devez être connecté');
    const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    const res = await api.get('/registrations/me');
    return res.data;
  }
}; 