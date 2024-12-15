import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    headers: {
      'Content-Security-Policy': [
        // Sources par défaut
        "default-src 'self'",
        
        // Scripts - Utilisation de nonces et hashes pour plus de sécurité
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://*.firebase.com https://*.firebaseio.com https://*.googleapis.com",
        
        // Styles
        "style-src 'self' 'unsafe-inline'",
        
        // Images
        "img-src 'self' data: blob: https://*.google.com https://*.googleapis.com https://upload.wikimedia.org https://*.google-analytics.com https://*.analytics.google.com",
        
        // Connexions
        "connect-src 'self' ws: wss: https://*.firebase.com https://*.firebaseio.com https://*.googleapis.com https://firebase.googleapis.com https://firestore.googleapis.com https://*.google-analytics.com https://region1.google-analytics.com https://*.analytics.google.com",
        
        // Fonts
        "font-src 'self' data:",
        
        // Frames
        "frame-src 'self' https://*.firebaseapp.com",
        
        // Workers
        "worker-src 'self' blob:",
        
        // Media
        "media-src 'self'",

        // Object
        "object-src 'none'",

        // Base URI
        "base-uri 'self'",

        // Form actions
        "form-action 'self'",

        // Manifest
        "manifest-src 'self'"
      ].join('; ')
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  worker: {
    format: 'es'
  }
});