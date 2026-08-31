import { SystemStyleObject } from '@chakra-ui/react';

export const inputSubtitleStyles = {
  container: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    maxW: 'fit-content',
    position: 'absolute' as const,
    bottom: '120px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
    userSelect: 'none',
    willChange: 'transform',
    padding: 0,
  },

  box: {
    position: 'relative' as const,
    w: '388px',
    rounded: '18px',
    overflow: 'hidden',
    bg: 'linear-gradient(145deg, rgba(49, 35, 53, 0.93), rgba(25, 22, 33, 0.94))',
    border: '1px solid rgba(249, 205, 222, 0.30)',
    boxShadow: '0 18px 60px rgba(25, 12, 24, 0.34), inset 0 1px 0 rgba(255, 244, 248, 0.12)',
    backdropFilter: 'blur(20px) saturate(125%)',
    css: { WebkitUserSelect: 'none' },
    _before: {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '20px',
      right: '20px',
      height: '1px',
      bg: 'linear-gradient(90deg, transparent, rgba(243, 194, 211, 0.72), rgba(230, 201, 139, 0.56), transparent)',
      pointerEvents: 'none',
    },
  },

  compactContainer: {
    bottom: '260px',
  },

  speechBubble: {
    position: 'relative' as const,
    w: '250px',
    minH: '48px',
    px: '3',
    py: '2.5',
    pr: '8',
    rounded: '16px',
    bg: 'linear-gradient(145deg, rgba(52, 37, 55, 0.94), rgba(29, 24, 36, 0.95))',
    color: '#fff7fa',
    boxShadow: '0 12px 34px rgba(34, 17, 31, 0.30), inset 0 1px 0 rgba(255, 241, 247, 0.13)',
    backdropFilter: 'blur(18px) saturate(125%)',
    border: '1px solid rgba(247, 203, 220, 0.34)',
  },

  bubbleTail: (side: 'left' | 'right' | 'top' | 'bottom', offset: number): SystemStyleObject => ({
    position: 'absolute',
    w: '11px',
    h: '11px',
    bg: 'rgba(40, 30, 44, 0.96)',
    transform: 'rotate(45deg)',
    zIndex: -1,
    ...(side === 'left' && { left: '-6px', top: `${offset - 5}px`, borderLeft: '1px solid', borderBottom: '1px solid', borderColor: 'rgba(247, 203, 220, 0.34)' }),
    ...(side === 'right' && { right: '-6px', top: `${offset - 5}px`, borderRight: '1px solid', borderTop: '1px solid', borderColor: 'rgba(247, 203, 220, 0.34)' }),
    ...(side === 'top' && { top: '-6px', left: `${offset - 5}px`, borderLeft: '1px solid', borderTop: '1px solid', borderColor: 'rgba(247, 203, 220, 0.34)' }),
    ...(side === 'bottom' && { bottom: '-6px', left: `${offset - 5}px`, borderRight: '1px solid', borderBottom: '1px solid', borderColor: 'rgba(247, 203, 220, 0.34)' }),
  }),

  bubbleText: {
    fontSize: 'xs',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap' as const,
    overflowWrap: 'anywhere' as const,
    userSelect: 'text' as const,
    color: '#fff7fa',
    letterSpacing: '0.01em',
  },

  messageStack: {
    pl: '4',
    pr: '12',
    pt: '5',
    pb: '3',
    gap: 1,
    alignItems: 'stretch',
    justify: 'flex-end',
  },

  messageText: {
    color: '#fff7fa',
    fontSize: 'sm',
    lineHeight: '1.5',
    transition: 'all 0.3s',
  },

  commandBar: {
    alignItems: 'center',
    gap: '2',
    p: '2',
    pl: '2',
    minH: '54px',
    bg: 'linear-gradient(180deg, rgba(255, 240, 246, 0.045), rgba(12, 10, 17, 0.18))',
    borderTop: '1px',
    borderColor: 'rgba(244, 205, 220, 0.15)',
    roundedBottom: '18px',
  },

  emptyMessageSpace: {
    minH: '64px',
  },

  statusGroup: {
    alignItems: 'center',
    gap: '1.5',
    pl: '1.5',
    color: 'rgba(250, 218, 230, 0.68)',
    flexShrink: 0,
  },

  commandDivider: {
    w: '1px',
    h: '22px',
    bg: 'rgba(244, 205, 220, 0.13)',
    flexShrink: 0,
  },

  actionGroup: {
    alignItems: 'center',
    gap: '1',
    flexShrink: 0,
  },

  statusText: {
    fontSize: 'xs',
    color: 'rgba(255, 236, 244, 0.72)',
    transition: 'all 0.3s',
  },

  iconButton: {
    size: 'xs',
    variant: 'ghost',
    color: 'rgba(250, 214, 227, 0.82)',
    _hover: { bg: 'rgba(244, 190, 212, 0.13)', color: '#fff8fb' },
  },

  input: {
    size: 'sm',
    h: '38px',
    minW: 0,
    bg: 'rgba(255, 246, 250, 0.045)',
    color: '#fff8fb',
    _placeholder: { color: 'rgba(248, 220, 231, 0.42)' },
    borderColor: 'rgba(246, 205, 220, 0.16)',
    rounded: '10px',
    _focus: {
      borderColor: 'rgba(232, 201, 139, 0.66)',
      boxShadow: '0 0 0 1px rgba(232, 201, 139, 0.16)',
      outline: 'none',
    },
    flex: '1',
  },

  sendButton: {
    minW: '38px',
    w: '38px',
    h: '38px',
    p: 0,
    bg: 'linear-gradient(145deg, rgba(235, 174, 200, 0.88), rgba(205, 139, 173, 0.88))',
    rounded: '10px',
    _hover: { filter: 'brightness(1.08)', transform: 'translateY(-1px)' },
    transition: 'colors',
    color: '#fffafc',
    size: 'sm',
  },

  draggableContainer: (isDragging: boolean): SystemStyleObject => ({
    cursor: isDragging ? 'grabbing' : 'grab',
    transition: isDragging ? 'none' : 'transform 0.1s ease',
    _active: { cursor: 'grabbing' },
  }),

  windowControls: {
    position: 'absolute' as const,
    top: '7px',
    right: '7px',
    flexDirection: 'column',
    alignItems: 'center',
    px: '0.5',
    py: '0.5',
    rounded: 'full',
    bg: 'rgba(18, 14, 23, 0.34)',
    border: '1px solid rgba(245, 207, 221, 0.12)',
    boxShadow: 'inset 0 1px 0 rgba(255, 246, 250, 0.06)',
    zIndex: 10,
  },

  activeIconButton: {
    bg: 'rgba(235, 174, 200, 0.18)',
    color: '#f5bfd5',
    boxShadow: 'inset 0 0 0 1px rgba(240, 188, 211, 0.20)',
  },

  windowControlButton: {
    size: '2xs',
    minW: '20px',
    width: '20px',
    height: '20px',
    padding: 0,
    variant: 'ghost',
    rounded: 'full',
    color: 'rgba(248, 221, 231, 0.58)',
    bg: 'transparent',
    _hover: {
      bg: 'rgba(243, 185, 208, 0.14)',
      color: '#fff7fa',
    },
  },

  windowControlDivider: {
    w: '10px',
    h: '1px',
    my: '1px',
    bg: 'rgba(245, 207, 221, 0.12)',
  },

  closeGlyph: {
    position: 'relative' as const,
    w: '11px',
    h: '11px',
  },

  closeGlyphStroke: (rotation: number): SystemStyleObject => ({
    position: 'absolute',
    left: '1px',
    top: '5px',
    w: '9px',
    h: '1px',
    rounded: 'full',
    bg: 'currentColor',
    transform: `rotate(${rotation}deg)`,
  }),

  resizeHandle: {
    position: 'absolute' as const,
    top: '34px',
    right: '-4px',
    bottom: '12px',
    w: '9px',
    cursor: 'ew-resize',
    zIndex: 12,
    _after: {
      content: '""',
      position: 'absolute',
      top: '50%',
      right: '2px',
      transform: 'translateY(-50%)',
      w: '2px',
      h: '30px',
      rounded: 'full',
      bg: 'rgba(244, 197, 216, 0.22)',
      transition: 'all 0.2s ease',
    },
    _hover: {
      _after: {
        bg: 'rgba(238, 186, 208, 0.70)',
        h: '42px',
      },
    },
  },

  expandButton: {
    position: 'absolute' as const,
    top: '6px',
    right: '6px',
    size: '2xs',
    minW: '6',
    height: '6',
    padding: 0,
    variant: 'ghost',
    color: 'rgba(248, 215, 228, 0.62)',
    _hover: {
      bg: 'rgba(243, 185, 208, 0.14)',
      color: '#fff7fa',
    },
    zIndex: 2,
  },
} as const;
