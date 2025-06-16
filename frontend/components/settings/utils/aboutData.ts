import { Feather } from '@expo/vector-icons';

export interface AboutSectionItem {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  handler?: string;
  isExternal?: boolean;
}

export interface AboutSection {
  title: string;
  items: AboutSectionItem[];
}

export const getAboutSections = (): AboutSection[] => [
  {
    title: 'App Information',
    items: [
      {
        icon: 'globe',
        title: 'Website',
        description: 'Visit our official website',
        handler: 'handleWebsite',
        isExternal: true,
      },
      {
        icon: 'star',
        title: 'Rate Ripply',
        description: 'Rate us on the App Store',
        handler: 'handleRateApp',
        isExternal: true,
      },
      {
        icon: 'file-text',
        title: 'Terms of Service',
        description: 'Read our terms and conditions',
        handler: 'handleTermsOfService',
        isExternal: true,
      },
      {
        icon: 'shield',
        title: 'Privacy Policy',
        description: 'Learn how we protect your data',
        handler: 'handlePrivacyPolicy',
        isExternal: true,
      },
      {
        icon: 'code',
        title: 'Open Source Licenses',
        description: 'View third-party licenses',
        handler: 'handleLicenses',
      },
    ],
  },
  {
    title: 'Connect With Us',
    items: [
      {
        icon: 'twitter',
        title: 'Twitter',
        description: '@ripplyapp - Latest updates and news',
        handler: 'handleTwitter',
        isExternal: true,
      },
      {
        icon: 'instagram',
        title: 'Instagram',
        description: '@ripplyapp - Behind the scenes content',
        handler: 'handleInstagram',
        isExternal: true,
      },
    ],
  },
];

export const getTechnicalInfoItems = (platform: string, platformVersion: string | number, appSize: string, lastUpdated: string): AboutSectionItem[] => [
  {
    icon: 'smartphone',
    title: 'Platform',
    description: `${platform} ${platformVersion}`,
  },
  {
    icon: 'database',
    title: 'App Size',
    description: appSize,
  },
  {
    icon: 'calendar',
    title: 'Last Updated',
    description: lastUpdated,
  },
];

export const getCreditsItems = (): AboutSectionItem[] => [
  {
    icon: 'users',
    title: 'Development Team',
    description: 'Built with ❤️ by the Ripply team',
  },
  {
    icon: 'heart',
    title: 'Special Thanks',
    description: 'To our beta testers and early adopters',
  },
]; 