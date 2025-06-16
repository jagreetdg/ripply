import { Platform, Linking } from 'react-native';

interface ExternalLinks {
  website: string;
  termsOfService: string;
  privacyPolicy: string;
  twitter: string;
  instagram: string;
  appStore: string;
}

interface ExternalLinksHandlers {
  handleWebsite: () => void;
  handleTermsOfService: () => void;
  handlePrivacyPolicy: () => void;
  handleTwitter: () => void;
  handleInstagram: () => void;
  handleRateApp: () => void;
  handleLicenses: () => void;
}

interface ExternalLinksState {
  links: ExternalLinks;
  handlers: ExternalLinksHandlers;
}

export const useExternalLinks = (): ExternalLinksState => {
  const links: ExternalLinks = {
    website: 'https://ripply.app',
    termsOfService: 'https://ripply.app/terms',
    privacyPolicy: 'https://ripply.app/privacy',
    twitter: 'https://twitter.com/ripplyapp',
    instagram: 'https://instagram.com/ripplyapp',
    appStore: Platform.OS === 'ios'
      ? 'https://apps.apple.com/app/ripply/id123456789'
      : 'https://play.google.com/store/apps/details?id=com.ripply.app',
  };

  const openURL = (url: string, fallbackMessage: string) => {
    Linking.openURL(url).catch((err) => {
      console.error(fallbackMessage, err);
    });
  };

  const handleWebsite = () => {
    openURL(links.website, 'Failed to open website:');
  };

  const handleTermsOfService = () => {
    openURL(links.termsOfService, 'Failed to open terms:');
  };

  const handlePrivacyPolicy = () => {
    openURL(links.privacyPolicy, 'Failed to open privacy policy:');
  };

  const handleTwitter = () => {
    openURL(links.twitter, 'Failed to open Twitter:');
  };

  const handleInstagram = () => {
    openURL(links.instagram, 'Failed to open Instagram:');
  };

  const handleRateApp = () => {
    openURL(links.appStore, 'Failed to open app store:');
  };

  const handleLicenses = () => {
    console.log('Show open source licenses');
  };

  const handlers: ExternalLinksHandlers = {
    handleWebsite,
    handleTermsOfService,
    handlePrivacyPolicy,
    handleTwitter,
    handleInstagram,
    handleRateApp,
    handleLicenses,
  };

  return {
    links,
    handlers,
  };
}; 