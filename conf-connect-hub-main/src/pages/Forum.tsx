import React from 'react';
import { MessageSquare } from 'lucide-react';

const Forum = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <MessageSquare className="w-8 h-8 text-primary" />
        <h1 className="text-4xl font-bold">Forum</h1>
      </div>
      
      <div className="grid gap-6">
        <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <p className="text-center text-gray-600 dark:text-gray-400">
            Le forum sera bientôt disponible.
            Revenez plus tard pour participer aux discussions !
          </p>
        </div>
      </div>
    </div>
  );
};

export default Forum; 