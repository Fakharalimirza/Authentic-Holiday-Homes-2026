import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.authentic.holidayhomes',
  appName: 'Authentic Holiday Homes',
  webDir: 'dist',
  plugins: {
    CapacitorHttp: {
      enabled: false,
    },
    CapacitorCookies: {
      enabled: false,
    }
  }
};

export default config;
