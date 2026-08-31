import {
  LuBell, LuSend, LuMic, LuMicOff, LuHand, LuMaximize2, LuShrink,
  LuScreenShare, LuScreenShareOff,
} from 'react-icons/lu';
import {
  Box,
  Button,
  Flex,
  Input,
  Text,
  VStack,
  IconButton,
} from '@chakra-ui/react';
import {
  useState, useEffect, useCallback, useRef,
} from 'react';
import { useInputSubtitle } from '@/hooks/electron/use-input-subtitle';
import { useDraggable } from '@/hooks/electron/use-draggable';
import { inputSubtitleStyles } from './electron-style';
import { useMode } from '@/context/mode-context';
import { useSubtitle } from '@/context/subtitle-context';
import { LAppDelegate } from '../../../WebSDK/src/lappdelegate';
import { useScreenCaptureContext } from '@/context/screen-capture-context';

type BubbleTail = {
  side: 'left' | 'right' | 'top' | 'bottom'
  offset: number
};

function CloseDialogueGlyph() {
  return (
    <Box {...inputSubtitleStyles.closeGlyph}>
      <Box {...inputSubtitleStyles.closeGlyphStroke(45)} />
      <Box {...inputSubtitleStyles.closeGlyphStroke(-45)} />
    </Box>
  );
}

export function InputSubtitle() {
  const {
    inputValue,
    handleInputChange,
    handleKeyPress,
    handleCompositionStart,
    handleCompositionEnd,
    handleInterrupt,
    handleMicToggle,
    handleSend,
    lastAIMessage,
    hasAIMessages,
    aiState,
    micOn,
  } = useInputSubtitle();

  const { mode } = useMode();
  const isPet = mode === 'pet';
  const { speechBubbleText } = useSubtitle();
  const {
    isStreaming: isScreenSharing,
    startCapture: startScreenSharing,
    stopCapture: stopScreenSharing,
  } = useScreenCaptureContext();
  const hasVisibleMessage = Boolean(hasAIMessages && lastAIMessage);
  const [dialogueWidth, setDialogueWidth] = useState(() => {
    const storedWidth = window.localStorage.getItem('petDialogueWidth');
    if (storedWidth === null) return 388;
    const saved = Number(storedWidth);
    return Number.isFinite(saved) && saved > 0
      ? Math.max(340, Math.min(760, saved))
      : 388;
  });
  const resizeStartRef = useRef({ mouseX: 0, width: dialogueWidth });

  const {
    elementRef,
    isDragging,
    position,
    handleMouseDown,
  } = useDraggable({
    componentId: 'input-subtitle',
  });

  const [isVisible, setIsVisible] = useState(
    () => window.localStorage.getItem('petSubtitleVisible') !== 'false',
  );
  const [isCompact, setIsCompact] = useState(
    () => window.localStorage.getItem('petSubtitleCompact') === 'true',
  );
  const [bubbleTail, setBubbleTail] = useState<BubbleTail>({ side: 'right', offset: 50 });
  const componentHoverRef = useRef(false);
  const isDraggingRef = useRef(isDragging);
  isDraggingRef.current = isDragging;

  const setCompactMode = (compact: boolean) => {
    setIsCompact(compact);
    window.localStorage.setItem('petSubtitleCompact', String(compact));
  };

  const handleResizeStart = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    resizeStartRef.current = { mouseX: event.clientX, width: dialogueWidth };

    const handleResizeMove = (moveEvent: MouseEvent) => {
      const nextWidth = Math.max(
        340,
        Math.min(Math.min(760, window.innerWidth - 32), resizeStartRef.current.width + moveEvent.clientX - resizeStartRef.current.mouseX),
      );
      setDialogueWidth(nextWidth);
    };
    const handleResizeEnd = () => {
      setDialogueWidth((currentWidth) => {
        window.localStorage.setItem('petDialogueWidth', String(currentWidth));
        return currentWidth;
      });
      document.removeEventListener('mousemove', handleResizeMove, true);
      document.removeEventListener('mouseup', handleResizeEnd, true);
    };
    document.addEventListener('mousemove', handleResizeMove, true);
    document.addEventListener('mouseup', handleResizeEnd, true);
  };

  const handleScreenShareToggle = () => {
    if (isScreenSharing) stopScreenSharing();
    else startScreenSharing();
  };

  const handleClose = useCallback(() => {
    if (isPet) {
      (window.api as any)?.updateComponentHover('input-subtitle', false);
    }
    setIsVisible(false);
    window.localStorage.setItem('petSubtitleVisible', 'false');
  }, [isPet]);

  const handleOpen = () => {
    setCompactMode(false);
    setIsVisible(true);
    window.localStorage.setItem('petSubtitleVisible', 'true');
  };

  useEffect(() => {
    if (isPet) {
      const cleanupToggle = (window.api as any)?.onToggleInputSubtitle(() => {
        if (isVisible) {
          handleClose();
        } else {
          handleOpen();
        }
      });
      const cleanupShow = (window.api as any)?.onShowInputSubtitle(() => handleOpen());
      const cleanupHide = (window.api as any)?.onHideInputSubtitle(() => handleClose());
      return () => {
        cleanupToggle?.();
        cleanupShow?.();
        cleanupHide?.();
      };
    }
    return () => {};
  }, [handleClose, isPet, isVisible]);

  useEffect(() => {
    (window as any).inputSubtitle = {
      open: handleOpen,
      close: handleClose,
      visible: isVisible,
      rendered: isVisible && (!isCompact || Boolean(speechBubbleText)),
    };

    return () => {
      delete (window as any).inputSubtitle;
    };
  }, [isPet, handleClose, isVisible, isCompact, speechBubbleText]);

  useEffect(() => {
    if (isPet && isCompact && !speechBubbleText) {
      (window.api as any)?.updateComponentHover('input-subtitle', false);
      componentHoverRef.current = false;
    }
  }, [isPet, isCompact, speechBubbleText]);

  useEffect(() => {
    const ipcRenderer = (window as any).electron?.ipcRenderer;
    if (!isPet || !isVisible || (isCompact && !speechBubbleText) || !ipcRenderer) {
      return undefined;
    }

    const updateHover = (_event: unknown, point: { clientX: number; clientY: number }) => {
      const rect = elementRef.current?.getBoundingClientRect();
      if (!rect) return;

      const isInside = point.clientX >= rect.left
        && point.clientX <= rect.right
        && point.clientY >= rect.top
        && point.clientY <= rect.bottom;
      const shouldCaptureMouse = isDraggingRef.current || isInside;

      if (shouldCaptureMouse !== componentHoverRef.current) {
        componentHoverRef.current = shouldCaptureMouse;
        (window.api as any)?.updateComponentHover('input-subtitle', shouldCaptureMouse);
      }
    };

    ipcRenderer.on('pet-cursor-move', updateHover);
    return () => {
      ipcRenderer.removeListener('pet-cursor-move', updateHover);
      if (componentHoverRef.current) {
        componentHoverRef.current = false;
        (window.api as any)?.updateComponentHover('input-subtitle', false);
      }
    };
  }, [isPet, isVisible, isCompact, speechBubbleText, elementRef]);

  useEffect(() => {
    if (!isPet || !isCompact || !speechBubbleText) return undefined;

    const updateBubbleTail = () => {
      const bubbleElement = elementRef.current;
      const canvas = document.getElementById('canvas') as HTMLCanvasElement | null;
      const adapter = (window as any).getLAppAdapter?.();
      const view = LAppDelegate.getInstance().getView();
      const modelPosition = adapter?.getModelPosition?.();
      if (!bubbleElement || !canvas || !view || !modelPosition) return;

      const canvasRect = canvas.getBoundingClientRect();
      const canvasScale = canvas.width / canvas.clientWidth;
      const logicalX = view._viewMatrix.transformX(modelPosition.x);
      const logicalY = view._viewMatrix.transformY(modelPosition.y);
      const characterX = canvasRect.left + view._deviceToScreen.invertTransformX(logicalX) / canvasScale;
      const characterY = canvasRect.top + view._deviceToScreen.invertTransformY(logicalY) / canvasScale;
      const bubbleRect = bubbleElement.getBoundingClientRect();
      const deltaX = characterX - (bubbleRect.left + bubbleRect.width / 2);
      const deltaY = characterY - (bubbleRect.top + bubbleRect.height / 2);

      if (Math.abs(deltaX) >= Math.abs(deltaY)) {
        const offset = Math.max(18, Math.min(bubbleRect.height - 18, characterY - bubbleRect.top));
        setBubbleTail({ side: deltaX >= 0 ? 'right' : 'left', offset });
      } else {
        const offset = Math.max(18, Math.min(bubbleRect.width - 18, characterX - bubbleRect.left));
        setBubbleTail({ side: deltaY >= 0 ? 'bottom' : 'top', offset });
      }
    };

    updateBubbleTail();
    const timer = window.setInterval(updateBubbleTail, 100);
    return () => window.clearInterval(timer);
  }, [isPet, isCompact, speechBubbleText, elementRef]);

  if (!isVisible) return null;

  if (isCompact && !speechBubbleText) return null;

  if (isCompact) {
    return (
      <Box
        ref={elementRef}
        {...inputSubtitleStyles.container}
        {...inputSubtitleStyles.compactContainer}
        {...inputSubtitleStyles.draggableContainer(isDragging)}
        style={{ transform: `translateX(-50%) translate(${position.x}px, ${position.y}px)` }}
        onMouseDown={handleMouseDown}
      >
        <Box {...inputSubtitleStyles.speechBubble}>
          <Box {...inputSubtitleStyles.bubbleTail(bubbleTail.side, bubbleTail.offset)} />
          <IconButton
            aria-label="Expand dialogue"
            title="展开对话框"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={() => setCompactMode(false)}
            {...inputSubtitleStyles.expandButton}
          >
            <LuMaximize2 size={13} />
          </IconButton>
          <Text {...inputSubtitleStyles.bubbleText}>
            {speechBubbleText || '…'}
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      ref={elementRef}
      {...inputSubtitleStyles.container}
      {...inputSubtitleStyles.draggableContainer(isDragging)}
      style={{ transform: `translateX(-50%) translate(${position.x}px, ${position.y}px)` }}
      onMouseDown={handleMouseDown}
    >
      <Box {...inputSubtitleStyles.box} style={{ width: `${dialogueWidth}px` }}>
        <Flex {...inputSubtitleStyles.windowControls}>
          <IconButton
            aria-label="Minimize dialogue"
            title="收起为对话气泡"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={() => setCompactMode(true)}
            {...inputSubtitleStyles.windowControlButton}
          >
            <LuShrink size={12} strokeWidth={1.8} />
          </IconButton>
          <Box {...inputSubtitleStyles.windowControlDivider} />
          <IconButton
            aria-label="Close subtitle"
            title="关闭对话框"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={handleClose}
            {...inputSubtitleStyles.windowControlButton}
          >
            <CloseDialogueGlyph />
          </IconButton>
        </Flex>

        {hasAIMessages && (
          <VStack
            minH={lastAIMessage ? '64px' : '0px'}
            {...inputSubtitleStyles.messageStack}
          >
            {lastAIMessage && (
              <Text {...inputSubtitleStyles.messageText}>
                {lastAIMessage}
              </Text>
            )}
          </VStack>
        )}

        {!hasVisibleMessage && <Box {...inputSubtitleStyles.emptyMessageSpace} />}

        <Flex {...inputSubtitleStyles.commandBar}>
          <Flex {...inputSubtitleStyles.statusGroup}>
              <LuBell size={16} />
              <Text {...inputSubtitleStyles.statusText}>
                {aiState}
              </Text>
          </Flex>
          <Box {...inputSubtitleStyles.commandDivider} />
          <Input
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            placeholder="Type your message..."
            {...inputSubtitleStyles.input}
          />
          <Flex {...inputSubtitleStyles.actionGroup}>
            <IconButton
              aria-label="Toggle microphone"
              onClick={handleMicToggle}
              {...inputSubtitleStyles.iconButton}
            >
              {micOn ? <LuMic size={16} /> : <LuMicOff size={16} />}
            </IconButton>
            <IconButton
              aria-label="Interrupt"
              onClick={handleInterrupt}
              {...inputSubtitleStyles.iconButton}
            >
              <LuHand size={16} />
            </IconButton>
            <IconButton
              aria-label={isScreenSharing ? '停止屏幕共享' : '开始屏幕共享'}
              title={isScreenSharing ? '停止屏幕共享' : '开始屏幕共享'}
              onClick={handleScreenShareToggle}
              {...inputSubtitleStyles.iconButton}
              {...(isScreenSharing ? inputSubtitleStyles.activeIconButton : {})}
            >
              {isScreenSharing ? <LuScreenShareOff size={16} /> : <LuScreenShare size={16} />}
            </IconButton>
            <Button onClick={handleSend} {...inputSubtitleStyles.sendButton}>
              <LuSend size={16} />
            </Button>
          </Flex>
        </Flex>
        <Box
          data-no-drag
          aria-label="调整对话框宽度"
          title="拖动以调整对话框宽度"
          onMouseDown={handleResizeStart}
          {...inputSubtitleStyles.resizeHandle}
        />
      </Box>
    </Box>
  );
}
