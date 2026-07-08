// Firebase Cloud Messaging background service worker.
//
// Must live at the site root (not bundled by Next.js) so its scope covers
// the whole origin. The config values below are the same public,
// client-exposed NEXT_PUBLIC_FIREBASE_* values already in .env.local — they
// can't be read from process.env here since this file isn't processed by
// the bundler, so they're copied in literally. If the Firebase project's
// client config ever changes, update this file to match.
importScripts("https://www.gstatic.com/firebasejs/12.15.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.15.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCcdyguzW1j9mzTfFFj0FxX0naDhECzBRA",
  authDomain: "team-pulse-c243d.firebaseapp.com",
  projectId: "team-pulse-c243d",
  storageBucket: "team-pulse-c243d.firebasestorage.app",
  messagingSenderId: "190464072132",
  appId: "1:190464072132:web:37132e585868d3520dec91",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? "TeamPulse";
  self.registration.showNotification(title, {
    body: payload.notification?.body,
    icon: "/next.svg",
    data: { url: payload.data?.url ?? "/" },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(clients.openWindow(url));
});
