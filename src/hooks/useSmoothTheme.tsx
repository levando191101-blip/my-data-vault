import { useTheme as useNextTheme } from 'next-themes';

// Declare View Transitions API types
declare global {
  interface Document {
    startViewTransition?: (callback: () => void) => {
      finished: Promise<void>;
      ready: Promise<void>;
      updateCallbackDone: Promise<void>;
    };
  }
}

export function useSmoothTheme() {
  const { theme, setTheme: originalSetTheme, ...rest } = useNextTheme();

  const setTheme = (newTheme: string) => {
    // Check if browser supports View Transitions API
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        originalSetTheme(newTheme);
      });
    } else {
      // Fallback for browsers without View Transitions
      originalSetTheme(newTheme);
    }
  };

  return {
    theme,
    setTheme,
    ...rest,
  };
}

