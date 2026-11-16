import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { contentTokens, contentEditor } from './scripts/content-editor-plugin.mjs';

export default defineConfig({
  plugins: [react(), contentTokens(), contentEditor()],
  server: {
    port: 5173,
  },
});
