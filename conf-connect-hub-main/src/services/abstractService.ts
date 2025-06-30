import api from '@/lib/api';
import { Abstract } from '@/types/conference';

export const abstractService = {
  // Get abstract details
  getAbstract: async (abstractId: number): Promise<Abstract> => {
    const response = await api.get(`/abstracts/${abstractId}`);
    return response.data;
  },

  // Submit a new abstract
  submitAbstract: async (formData: FormData): Promise<{ message: string; abstract_id: number }> => {
    const response = await api.post('/abstracts/submit-abstract', formData);
    return response.data;
  },

  // Edit an existing abstract
  editAbstract: async (abstractId: number, formData: FormData): Promise<{ message: string }> => {
    const response = await api.put(`/abstracts/edit-abstract/${abstractId}`, formData);
    return response.data;
  },

  // Delete an abstract
  deleteAbstract: async (abstractId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/abstracts/delete-abstract/${abstractId}`);
    return response.data;
  },

  // Get user's abstracts
  getMyAbstracts: async (): Promise<Abstract[]> => {
    const response = await api.get('/abstracts/my-abstracts');
    return response.data;
  }
}; 