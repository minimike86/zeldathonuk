import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 5173,
    // Allow any hostname in dev — docker compose service names, host.docker.internal,
    // LAN IPs, etc. Vite 7 blocks unknown hosts by default.
    allowedHosts: ['.zeldathon.co.uk'],
    watch: {
      usePolling: true,
    },
    hmr: {
      overlay: false
    }
  },
});
