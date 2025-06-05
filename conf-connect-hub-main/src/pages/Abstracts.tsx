import React from 'react';
import { FileText } from 'lucide-react';

const Abstracts = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <FileText className="w-8 h-8 text-primary" />
        <h1 className="text-4xl font-bold">Abstracts</h1>
      </div>
      
      <div className="grid gap-6">
        <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <p className="text-center text-gray-600 dark:text-gray-400">
            Aucun abstract disponible pour le moment.
            Les abstracts des conférences à venir seront affichés ici.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Abstracts; 