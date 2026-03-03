import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nextweb.os',
  appName: 'NextWeb OS',
  webDir: 'dist',
  server: {
    url: 'https://acf5812e-0b4d-4ba0-a2ea-b88f9594ede8.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
};

export default config;
