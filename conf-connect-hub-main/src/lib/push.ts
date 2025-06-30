// push.ts : gestion de l'abonnement push côté frontend

// Clé publique VAPID générée avec web-push
const VAPID_PUBLIC_KEY = "BD-3sYib-nb1LbZtOBDj7fwoAIRXwGgIcG_gNDfmCdA5pWrAN0rQmjTdUG3MJjPKN-1P2dBslItR-67AbCeq0sI";

export async function subscribeUserToPush() {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    const registration = await navigator.serviceWorker.register('/sw.js');
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
    // Envoie la subscription au backend
    await fetch('/api/save-subscription', {
      method: 'POST',
      body: JSON.stringify(subscription),
      headers: { 'Content-Type': 'application/json' }
    });
    return subscription;
  }
  throw new Error('Push API non supportée');
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
} 