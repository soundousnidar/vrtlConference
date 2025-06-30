self.addEventListener('push', function(event) {
  const data = event.data ? event.data.text() : 'Notification';
  event.waitUntil(
    self.registration.showNotification('Notification', {
      body: data,
      icon: '/logo.png'
    })
  );
}); 