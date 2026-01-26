import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.e1e8056881fe4b5986c5d69ba59bc4a9',
  appName: 'VisionAI Assistant',
  webDir: 'dist',
  server: {
    url: 'https://e1e80568-81fe-4b59-86c5-d69ba59bc4a9.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Camera: {
      permissions: ['camera']
    },
    Haptics: {}
  }
};

export default config;
