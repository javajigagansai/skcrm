import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Execute logo extraction immediately during build/config loading
try {
  const logoPaths = [
    'C:/Users/V Saimanogna/.gemini/antigravity-ide/brain/a3239eba-10d2-4de9-9847-b3b3bfebd6cb/media__1786612553561.png',
    'C:/Users/V Saimanogna/.gemini/antigravity-ide/brain/65341e9e-ff98-4ec2-b84d-ca4387253f37/media__1786180039710.png',
    'C:/Users/V Saimanogna/.gemini/antigravity-ide/brain/65341e9e-ff98-4ec2-b84d-ca4387253f37/media__1786175075340.png'
  ];

  const srcLogo = logoPaths.find(p => fs.existsSync(p));
  
  if (srcLogo) {
    const publicDir = path.resolve(__dirname, './public');
    const assetsDir = path.resolve(__dirname, './src/assets');

    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
    if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

    // Copy to public/logo.png and src/assets/logo.png
    fs.copyFileSync(srcLogo, path.join(publicDir, 'logo.png'));
    fs.copyFileSync(srcLogo, path.join(assetsDir, 'logo.png'));
  }
} catch (err) {
  console.error('Logo extraction error:', err);
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-recharts': ['recharts'],
          'vendor-lucide': ['lucide-react'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore']
        }
      }
    }
  }
});
