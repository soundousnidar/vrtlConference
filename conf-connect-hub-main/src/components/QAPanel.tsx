import React, { useState, useEffect } from 'react';

interface QAPanelProps {
  conferenceId: number;
  user: { fullname: string };
}

const QAPanel: React.FC<QAPanelProps> = ({ conferenceId, user }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const openJitsiChat = () => {
    // Cette fonction sera appelée pour ouvrir le chat Jitsi
    // Le chat Jitsi s'ouvre automatiquement dans l'interface Jitsi
    setIsChatOpen(true);
  };

  const openJitsiQAPanel = () => {
    // Ouvrir le panneau de questions/réponses de Jitsi
    setIsChatOpen(true);
  };

  return (
    <div className="border rounded-lg p-4 bg-white shadow-md max-w-xl mx-auto mt-6">
      <h3 className="text-lg font-bold mb-4">Questions & Réponses</h3>
      
      <div className="space-y-3">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">💬 Chat intégré Jitsi</h4>
          <p className="text-blue-700 text-sm mb-3">
            Utilisez le chat intégré de Jitsi Meet pour poser vos questions en direct.
            Le chat est accessible via le bouton "Chat" dans la barre d'outils de la vidéo.
          </p>
          <button
            onClick={openJitsiChat}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
          >
            Ouvrir le chat Jitsi
          </button>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 mb-2">🎯 Conseils pour les questions</h4>
          <ul className="text-green-700 text-sm space-y-1">
            <li>• Posez des questions claires et concises</li>
            <li>• Attendez la fin d'une intervention avant de poser votre question</li>
            <li>• Utilisez le chat pour les questions courtes</li>
            <li>• Levez la main virtuellement pour les questions importantes</li>
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-2">📋 Fonctionnalités disponibles</h4>
          <ul className="text-yellow-700 text-sm space-y-1">
            <li>• Chat textuel en temps réel</li>
            <li>• Partage d'écran pour les présentations</li>
            <li>• Enregistrement de la session</li>
            <li>• Contrôle des participants (pour les modérateurs)</li>
          </ul>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t">
        <p className="text-gray-600 text-sm">
          <strong>Note :</strong> Toutes les interactions (chat, questions, réponses) se font directement 
          dans l'interface Jitsi Meet. Cette section vous guide sur l'utilisation des fonctionnalités.
        </p>
      </div>
    </div>
  );
};

export default QAPanel; 