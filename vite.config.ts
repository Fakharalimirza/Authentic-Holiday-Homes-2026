import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(env.GOOGLE_MAPS_PLATFORM_KEY),
      'process.env.STRIPE_PUBLISHABLE_KEY': JSON.stringify(env.STRIPE_PUBLISHABLE_KEY),
      'process.env.VPS_FTP_HOST': JSON.stringify(env.VPS_FTP_HOST),
      'process.env.VPS_FTP_USER': JSON.stringify(env.VPS_FTP_USER),
      'process.env.VPS_FTP_REMOTE_DIR': JSON.stringify(env.VPS_FTP_REMOTE_DIR),
      'process.env.VPS_FTP_SECURE': JSON.stringify(env.VPS_FTP_SECURE),
      'process.env.VPS_MEDIA_BASE_URL': JSON.stringify(env.VPS_MEDIA_BASE_URL),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        'firebase/app': path.resolve(__dirname, './src/lib/firebase.ts'),
        'firebase/auth': path.resolve(__dirname, './src/lib/firebase.ts'),
        'firebase/storage': path.resolve(__dirname, './src/lib/firebase.ts'),
        'firebase/firestore': path.resolve(__dirname, './src/lib/firebase.ts'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
