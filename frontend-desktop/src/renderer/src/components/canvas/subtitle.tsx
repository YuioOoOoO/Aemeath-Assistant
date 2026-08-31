import { Box, IconButton, Text } from '@chakra-ui/react';
import { memo } from 'react';
import { FiX } from 'react-icons/fi';
import { canvasStyles } from './canvas-styles';
import { useSubtitleDisplay } from '@/hooks/canvas/use-subtitle-display';
import { useSubtitle } from '@/context/subtitle-context';

// Type definitions
interface SubtitleTextProps {
  text: string
}

// Reusable components
const SubtitleText = memo(({ text }: SubtitleTextProps) => (
  <Text {...canvasStyles.subtitle.text}>
    {text}
  </Text>
));

SubtitleText.displayName = 'SubtitleText';

// Main component
const Subtitle = memo((): JSX.Element | null => {
  const { subtitleText, isLoaded } = useSubtitleDisplay();
  const { showSubtitle, setShowSubtitle } = useSubtitle();

  if (!isLoaded || !subtitleText || !showSubtitle) return null;

  return (
    <Box {...canvasStyles.subtitle.container}>
      <IconButton
        aria-label="关闭字幕"
        title="关闭字幕"
        onClick={() => setShowSubtitle(false)}
        {...canvasStyles.subtitle.closeButton}
      >
        <FiX />
      </IconButton>
      <SubtitleText text={subtitleText} />
    </Box>
  );
});

Subtitle.displayName = 'Subtitle';

export default Subtitle;
