import React from 'react';
import { Award } from 'lucide-react';

const Certificates = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Award className="w-8 h-8 text-primary" />
        <h1 className="text-4xl font-bold">Mes Certificats</h1>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <p className="text-center text-gray-600 dark:text-gray-400">
            Aucun certificat disponible pour le moment.
            Participez à des conférences pour obtenir vos certificats !
          </p>
        </div>
      </div>
    </div>
  );
};

export default Certificates; 