import { Platform } from 'react-native';

interface AppInfo {
  name: string;
  tagline: string;
  version: string;
  buildNumber: string;
  platform: string;
  platformVersion: string | number;
  appSize: string;
  lastUpdated: string;
  copyright: string;
  madeWith: string;
}

interface AppInfoState {
  appInfo: AppInfo;
}

export const useAppInfo = (): AppInfoState => {
  const appInfo: AppInfo = {
    name: 'Ripply',
    tagline: 'Share your voice with the world',
    version: '1.0.0',
    buildNumber: '100',
    platform: Platform.OS === 'ios' ? 'iOS' : 'Android',
    platformVersion: Platform.Version,
    appSize: '~45 MB',
    lastUpdated: 'December 2024',
    copyright: '© 2024 Ripply Inc. All rights reserved.',
    madeWith: 'Made with React Native & Expo',
  };

  return {
    appInfo,
  };
}; 