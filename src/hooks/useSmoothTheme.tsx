import { useTheme as useNextTheme } from 'next-themes';

// View Transitions API type (avoid duplicate global declaration)
interface ViewTransition {
  finished: Promise<void>;
  ready: Promise<void>;
  updateCallbackDone: Promise<void>;
}

type StartViewTransition = (callback: () => void) => ViewTransition;

export function useSmoothTheme() {
  const { theme, setTheme: originalSetTheme, ...rest } = useNextTheme();

  const setTheme = (newTheme: string) => {
    // Check if browser supports View Transitions API
    const doc = document as Document & { startViewTransition?: StartViewTransition };
    if (doc.startViewTransition) {
      doc.startViewTransition(() => {
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

