import React, { useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import { certificateService } from '@/services/certificateService';
import { profileService } from '@/services/profileService';
import { Conference, Abstract } from '@/types/conference';
import { Button } from '@/components/ui/button';

const Certificates = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    profileService.getProfile().then(data => {
      setProfile(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Chargement...</div>;
  }

  // Trouver les conférences où l'utilisateur est participant, présentateur, reviewer
  const participationConfs = (profile?.registrations || [])
    .filter((reg: any) => reg.status === 'paid' || reg.status === 'confirmed')
    .map((reg: any) => reg.conference);

  const presentationConfs = (profile?.abstracts || [])
    .filter((abs: Abstract) => abs.status === 'accepted')
    .map((abs: Abstract) => abs.conference);

  // Pour reviewer, on regarde les reviews faites et on récupère la conférence de l'abstract
  const reviewerConfs = (profile?.reviews || [])
    .map((rev: any) => rev.abstract?.conference)
    .filter((conf: Conference | undefined) => !!conf);

  // Uniques
  const unique = (arr: any[]) => Array.from(new Map(arr.filter(Boolean).map(item => [item?.id, item])).values());

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Award className="w-8 h-8 text-primary" />
        <h1 className="text-4xl font-bold">Mes Certificats</h1>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Participation */}
        {unique(participationConfs).map((conf: Conference) => (
          <div key={conf.id} className="p-6 rounded-lg border bg-white">
            <div className="font-bold mb-2">{conf.title}</div>
            <div className="mb-4 text-sm text-gray-500">Certificat de participation</div>
            <Button onClick={() => certificateService.downloadCertificate(conf.id, 'participation')}>
              Télécharger
            </Button>
          </div>
        ))}
        {/* Présentation */}
        {unique(presentationConfs).map((conf: Conference) => (
          <div key={conf.id} className="p-6 rounded-lg border bg-white">
            <div className="font-bold mb-2">{conf.title}</div>
            <div className="mb-4 text-sm text-gray-500">Certificat de présentation</div>
            <Button onClick={() => certificateService.downloadCertificate(conf.id, 'presentation')}>
              Télécharger
            </Button>
          </div>
        ))}
        {/* Reviewer */}
        {unique(reviewerConfs).map((conf: Conference) => (
          <div key={conf.id} className="p-6 rounded-lg border bg-white">
            <div className="font-bold mb-2">{conf.title}</div>
            <div className="mb-4 text-sm text-gray-500">Certificat de reviewer</div>
            <Button onClick={() => certificateService.downloadCertificate(conf.id, 'reviewer')}>
              Télécharger
            </Button>
          </div>
        ))}
        {/* Si aucun certificat */}
        {unique(participationConfs).length === 0 && unique(presentationConfs).length === 0 && unique(reviewerConfs).length === 0 && (
          <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <p className="text-center text-gray-600 dark:text-gray-400">
              Aucun certificat disponible pour le moment.<br />
              Participez à des conférences pour obtenir vos certificats !
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Certificates;
