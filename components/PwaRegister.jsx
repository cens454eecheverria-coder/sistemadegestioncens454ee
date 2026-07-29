"use client";

import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('PWA ServiceWorker registrado con éxito:', registration.scope);
          })
          .catch((err) => {
            console.error('PWA ServiceWorker error al registrar:', err);
          });
      });
    }
  }, []);

  return null;
}
