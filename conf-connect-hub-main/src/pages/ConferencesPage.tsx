import { useEffect, useState } from 'react';
import ConferenceCard from '@/components/ConferenceCard';
import { conferenceService } from '@/services/conferenceService';
import type { Conference } from '@/types/conference';

export function ConferencesPage() {
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConferences = async () => {
      try {
        const data = await conferenceService.getAllConferences();
        setConferences(data);
        setError(null);
      } catch (err) {
        setError('Erreur lors du chargement des conférences');
        console.error('Error fetching conferences:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConferences();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-40 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col gap-4 max-w-5xl mx-auto">
        {conferences.map((conference) => (
          <ConferenceCard 
            key={conference.id} 
            conference={conference}
            showReviewButton={false}
          />
        ))}
      </div>
    </div>
  );
} 