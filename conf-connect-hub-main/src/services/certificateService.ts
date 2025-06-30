import api from '@/lib/api';

export const certificateService = {
  downloadCertificate: async (conferenceId: number, certType: string) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Vous devez être connecté');
    const response = await api.get(
      `/certificates/${conferenceId}/${certType}`,
      { responseType: 'blob' }
    );
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `certificat_${certType}_${conferenceId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  }
}; 