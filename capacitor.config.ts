import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mizanbill.app',
  appName: 'Mizan Bill',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
