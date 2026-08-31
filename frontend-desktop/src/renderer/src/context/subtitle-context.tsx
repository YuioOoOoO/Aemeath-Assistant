import {
  createContext, useState, useMemo, useContext, memo,
} from 'react';
import { useLocalStorage } from '@/hooks/utils/use-local-storage';

/**
 * Subtitle context state interface
 * @interface SubtitleState
 */
interface SubtitleState {
  /** Current subtitle text */
  subtitleText: string

  /** Set subtitle text */
  setSubtitleText: (text: string) => void

  /** Text belonging to the audio segment currently being played */
  speechBubbleText: string

  /** Update the current spoken sentence without replacing full subtitles */
  setSpeechBubbleText: (text: string) => void

  /** Whether to show subtitle */
  showSubtitle: boolean

  /** Toggle subtitle visibility */
  setShowSubtitle: (show: boolean) => void
}

/**
 * Default values and constants
 */
const DEFAULT_SUBTITLE = {
  text: "Hi, I'm some random AI VTuber. Who the hell are ya? "
        + 'Ahh, you must be amazed by my awesomeness, right? right?',
};

/**
 * Create the subtitle context
 */
export const SubtitleContext = createContext<SubtitleState | null>(null);

/**
 * Subtitle Provider Component
 * Manages the subtitle display text state
 *
 * @param {Object} props - Provider props
 * @param {React.ReactNode} props.children - Child components
 */
export const SubtitleProvider = memo(({ children }: { children: React.ReactNode }) => {
  // State management
  const [subtitleText, setSubtitleText] = useState<string>(DEFAULT_SUBTITLE.text);
  const [speechBubbleText, setSpeechBubbleText] = useState<string>('');
  const [showSubtitle, setShowSubtitle] = useLocalStorage<boolean>('showSubtitle', true);

  // Memoized context value
  const contextValue = useMemo(
    () => ({
      subtitleText,
      setSubtitleText,
      speechBubbleText,
      setSpeechBubbleText,
      showSubtitle,
      setShowSubtitle,
    }),
    [subtitleText, speechBubbleText, showSubtitle],
  );

  return (
    <SubtitleContext.Provider value={contextValue}>
      {children}
    </SubtitleContext.Provider>
  );
});

/**
 * Custom hook to use the subtitle context
 * @throws {Error} If used outside of SubtitleProvider
 */
export function useSubtitle() {
  const context = useContext(SubtitleContext);

  if (!context) {
    throw new Error('useSubtitle must be used within a SubtitleProvider');
  }

  return context;
}
