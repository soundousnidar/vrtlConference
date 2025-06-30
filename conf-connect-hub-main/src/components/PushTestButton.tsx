import { subscribeUserToPush } from '../lib/push';
import React, { useState, useEffect } from 'react';

function getUserId() {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.id ? String(user.id) : null;
    }
  } catch {}
  return null;
}

const PushTestButton: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [storageKey, setStorageKey] = useState('');

  useEffect(() => {
    const userId = getUserId();
    if (!userId) return;
    const key = `pushPromptClosed_${userId}`;
    setStorageKey(key);
    if (!localStorage.getItem(key)) {
      setVisible(true);
    }
  }, []);

  const handleSubscribe = async () => {
    try {
      await subscribeUserToPush();
      setVisible(false);
      if (storageKey) localStorage.setItem(storageKey, 'accepted');
    } catch (e) {
      alert('Erreur lors de l’abonnement : ' + e);
    }
  };

  const handleClose = () => {
    setVisible(false);
    if (storageKey) localStorage.setItem(storageKey, 'closed');
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9999,
        background: 'white',
        border: '1px solid #007bff',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        padding: 16,
        minWidth: 260,
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Recevoir des notifications ?</div>
        <div style={{ fontSize: 14, marginBottom: 10, color: '#333' }}>
          Activez les notifications push pour être alerté des nouveautés et rappels de conférence.
        </div>
        <button
          onClick={handleSubscribe}
          style={{
            padding: '6px 14px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Oui, je veux être notifié !
        </button>
      </div>
      <button
        onClick={handleClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#888',
          fontSize: 20,
          cursor: 'pointer',
          marginLeft: 4
        }}
        aria-label="Fermer"
        title="Ne plus afficher"
      >
        ×
      </button>
    </div>
  );
};

export default PushTestButton; 