import { useEffect, useState } from 'react';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
          start_param?: string;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isProgressVisible: boolean;
          isActive: boolean;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showProgress: () => void;
          hideProgress: () => void;
          setText: (text: string) => void;
          onClick: (fn: () => void) => void;
          offClick: (fn: () => void) => void;
        };
        BackButton: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (fn: () => void) => void;
          offClick: (fn: () => void) => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
        };
        colorScheme: 'light' | 'dark';
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
      };
    };
  }
}

export interface TelegramUser {
  id: string;
  firstName: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
}

export const useTelegram = () => {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const app = window.Telegram?.WebApp;
    
    if (app) {
      app.ready();
      app.expand();
      setIsReady(true);

      const tgUser = app.initDataUnsafe.user;
      if (tgUser) {
        setUser({
          id: tgUser.id.toString(),
          firstName: tgUser.first_name,
          lastName: tgUser.last_name,
          username: tgUser.username,
          languageCode: tgUser.language_code,
        });
      }
    } else {
      // For development/testing outside Telegram
      console.log('Telegram WebApp not available, using mock user');
      setUser({
        id: 'test_user_' + Math.random().toString(36).substr(2, 9),
        firstName: 'Test User',
        lastName: 'Dev',
        username: 'testuser',
      });
      setIsReady(true);
    }
  }, []);

  const showMainButton = (text: string, onClick: () => void) => {
    const app = window.Telegram?.WebApp;
    if (app && app.MainButton) {
      app.MainButton.setText(text);
      app.MainButton.show();
      app.MainButton.onClick(onClick);
    }
  };

  const hideMainButton = () => {
    const app = window.Telegram?.WebApp;
    if (app && app.MainButton) {
      app.MainButton.hide();
    }
  };

  const showBackButton = (onClick: () => void) => {
    const app = window.Telegram?.WebApp;
    if (app && app.BackButton) {
      app.BackButton.show();
      app.BackButton.onClick(onClick);
    }
  };

  const hideBackButton = () => {
    const app = window.Telegram?.WebApp;
    if (app && app.BackButton) {
      app.BackButton.hide();
    }
  };

  const hapticFeedback = {
    success: () => window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success'),
    error: () => window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('error'),
    warning: () => window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('warning'),
    light: () => window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light'),
    medium: () => window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium'),
    heavy: () => window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('heavy'),
  };

  const close = () => {
    window.Telegram?.WebApp?.close();
  };

  return {
    user,
    isReady,
    showMainButton,
    hideMainButton,
    showBackButton,
    hideBackButton,
    hapticFeedback,
    close,
    colorScheme: window.Telegram?.WebApp?.colorScheme || 'light',
    themeParams: window.Telegram?.WebApp?.themeParams || {},
  };
};