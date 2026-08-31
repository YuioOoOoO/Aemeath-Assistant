/* eslint-disable react/require-default-props */
import {
  Box, Textarea, IconButton, HStack, Button, Text,
} from '@chakra-ui/react';
import { BsMicFill, BsMicMuteFill, BsPaperclip } from 'react-icons/bs';
import { IoHandRightSharp } from 'react-icons/io5';
import { FiChevronDown } from 'react-icons/fi';
import { FiPlus } from 'react-icons/fi';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { InputGroup } from '@/components/ui/input-group';
import { footerStyles } from './footer-styles';
import AIStateIndicator from './ai-state-indicator';
import { useFooter } from '@/hooks/footer/use-footer';
import { useSidebar } from '@/hooks/sidebar/use-sidebar';
import WebSocketStatus from '@/components/canvas/ws-status';

// Type definitions
interface FooterProps {
  isCollapsed?: boolean
  onToggle?: () => void
}

interface ToggleButtonProps {
  isCollapsed: boolean
  onToggle?: () => void
}

interface ActionButtonsProps {
  micOn: boolean
  onMicToggle: () => void
  onInterrupt: () => void
}

interface MessageInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onCompositionStart: () => void
  onCompositionEnd: () => void
}

// Reusable components
const ToggleButton = memo(({ isCollapsed, onToggle }: ToggleButtonProps) => (
  <Box
    {...footerStyles.footer.toggleButton}
    onClick={onToggle}
    color="whiteAlpha.500"
    style={{
      transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
    }}
  >
    <FiChevronDown />
  </Box>
));

ToggleButton.displayName = 'ToggleButton';

const ActionButtons = memo(({ micOn, onMicToggle, onInterrupt }: ActionButtonsProps) => (
  <HStack gap={2}>
    <Button
      bg={micOn ? 'rgba(213, 142, 175, 0.90)' : 'rgba(139, 122, 131, 0.62)'}
      {...footerStyles.footer.actionButton}
      onClick={onMicToggle}
    >
      {micOn ? <BsMicFill /> : <BsMicMuteFill />}
      <Text as="span">{micOn ? '聆听中' : '麦克风'}</Text>
    </Button>
    <Button
      aria-label="Raise hand"
      bg="rgba(255, 246, 250, 0.06)"
      {...footerStyles.footer.actionButton}
      onClick={onInterrupt}
    >
      <IoHandRightSharp size="18" />
      <Text as="span">打断</Text>
    </Button>
  </HStack>
));

ActionButtons.displayName = 'ActionButtons';

const MessageInput = memo(({
  value,
  onChange,
  onKeyDown,
  onCompositionStart,
  onCompositionEnd,
}: MessageInputProps) => {
  const { t } = useTranslation();

  return (
    <InputGroup flex={1}>
      <Box position="relative" width="100%">
        <IconButton
          aria-label="Attach file"
          variant="ghost"
          {...footerStyles.footer.attachButton}
        >
          <BsPaperclip size="24" />
        </IconButton>
        <Textarea
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onCompositionStart={onCompositionStart}
          onCompositionEnd={onCompositionEnd}
          placeholder={t('footer.typeYourMessage')}
          {...footerStyles.footer.input}
        />
      </Box>
    </InputGroup>
  );
});

MessageInput.displayName = 'MessageInput';

// Main component
function Footer({ isCollapsed = false, onToggle }: FooterProps): JSX.Element {
  const {
    inputValue,
    handleInputChange,
    handleKeyPress,
    handleCompositionStart,
    handleCompositionEnd,
    handleInterrupt,
    handleMicToggle,
    micOn,
  } = useFooter();
  const { createNewHistory } = useSidebar();

  return (
    <Box {...footerStyles.footer.container(isCollapsed)}>
      <ToggleButton isCollapsed={isCollapsed} onToggle={onToggle} />

      <Box pt="0" px="4">
        <HStack width="100%" gap={4}>
          <Box>
            <Box mb="1.5">
              <AIStateIndicator />
            </Box>
            <ActionButtons
              micOn={micOn}
              onMicToggle={handleMicToggle}
              onInterrupt={handleInterrupt}
            />
          </Box>

          <MessageInput
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
          />
          <HStack {...footerStyles.footer.trailingActions}>
            <WebSocketStatus />
            <Button
              aria-label="新对话"
              title="新对话"
              onClick={createNewHistory}
              {...footerStyles.footer.newChatButton}
            >
              <FiPlus />
              新对话
            </Button>
          </HStack>
        </HStack>
      </Box>
    </Box>
  );
}

export default Footer;
