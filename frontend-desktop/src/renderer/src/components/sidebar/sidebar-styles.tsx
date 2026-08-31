import { css } from '@emotion/react';

const isElectron = window.api !== undefined;

const commonStyles = {
  scrollbar: {
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(205, 132, 166, 0.64) transparent',
    '&::-webkit-scrollbar': {
      width: '6px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'rgba(255, 246, 250, 0.035)',
      borderRadius: '999px',
      marginBlock: '8px',
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'rgba(205, 132, 166, 0.62)',
      borderRadius: '999px',
      border: '1px solid rgba(255, 232, 241, 0.10)',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      background: 'rgba(223, 151, 184, 0.78)',
    },
    '&::-webkit-scrollbar-button': {
      display: 'none',
    },
  },
  panel: {
    border: '1px solid',
    borderColor: 'whiteAlpha.200',
    borderRadius: 'lg',
    bg: 'blackAlpha.400',
  },
  title: {
    fontSize: 'lg',
    fontWeight: 'semibold',
    color: 'white',
    mb: 4,
  },
};

export const sidebarStyles = {
  sidebar: {
    container: (isCollapsed: boolean) => ({
      position: 'absolute' as const,
      left: 0,
      top: 0,
      height: 'calc(100% - 24px)',
      width: '336px',
      margin: '12px',
      bg: 'linear-gradient(155deg, rgba(49, 35, 53, 0.97), rgba(25, 22, 33, 0.98))',
      transform: isCollapsed
        ? 'translateX(calc(-100% - 16px))'
        : 'translateX(0)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 3,
      overflow: isCollapsed ? 'visible' : 'hidden',
      pb: '3',
      border: '1px solid rgba(249, 205, 222, 0.16)',
      borderRadius: '28px',
      boxShadow: '0 22px 64px rgba(12, 7, 16, 0.32), inset 0 1px 0 rgba(255, 244, 248, 0.08)',
    }),
    toggleButton: {
      position: 'absolute',
      left: '332px',
      top: '50%',
      width: '32px',
      height: '52px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      color: 'rgba(250, 218, 230, 0.80)',
      _hover: {
        color: '#FFF7FA',
        bg: 'rgba(98, 66, 91, 0.96)',
        borderColor: 'rgba(241, 190, 213, 0.32)',
        boxShadow: '0 12px 30px rgba(14, 8, 17, 0.34)',
      },
      bg: 'linear-gradient(155deg, rgba(69, 49, 71, 0.96), rgba(35, 29, 42, 0.97))',
      border: '1px solid rgba(249, 205, 222, 0.20)',
      borderRadius: '13px',
      backdropFilter: 'blur(16px)',
      boxShadow: '0 10px 26px rgba(14, 8, 17, 0.28), inset 0 1px 0 rgba(255,244,248,0.08)',
      zIndex: 30,
      transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.2s',
    },
    content: {
      flex: 1,
      width: '100%',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 3,
      overflow: 'hidden',
    },
    header: {
      width: '100%',
      display: 'flex',
      alignItems: 'stretch',
      flexDirection: 'column' as const,
      gap: 2,
      px: 4,
      pt: 5,
      pb: 3,
      css: {
        '& button': {
          minWidth: '0',
          height: '38px',
          borderRadius: '13px',
          color: 'rgba(250, 218, 230, 0.76)',
          background: 'rgba(255, 240, 246, 0.055)',
          fontSize: '12px',
          fontWeight: '550',
          gap: '6px',
        },
        '& button:hover': {
          color: '#FFF7FA',
          background: 'rgba(235, 181, 205, 0.15)',
        },
      },
    },
    brandBlock: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 2,
      px: 1,
    },
    actionGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
      gap: 2,
    },
    primaryButton: {
      position: 'absolute',
      top: '16px',
      right: '16px',
      px: 3,
      color: '#FFF9FC !important',
      background: 'linear-gradient(135deg, rgba(218, 145, 179, 0.92), rgba(174, 105, 140, 0.92)) !important',
      boxShadow: '0 8px 22px rgba(145, 75, 110, 0.22)',
      _hover: { filter: 'brightness(1.08)', transform: 'translateY(-1px)' },
    },
    eyebrow: {
      fontSize: '9px',
      letterSpacing: '0.22em',
      color: '#E8B5CA',
      fontWeight: '700',
    },
    brand: {
      fontSize: '20px',
      lineHeight: '1.1',
      color: '#FFF7FA',
      fontWeight: '650',
      letterSpacing: '0.06em',
    },
  },

  chatHistoryPanel: {
    container: {
      flex: 1,
      overflow: 'hidden',
      px: 4,
      display: 'flex',
      flexDirection: 'column',
    },
    title: commonStyles.title,
    messageList: {
      ...commonStyles.panel,
      p: 4,
      width: '97%',
      flex: 1,
      overflowY: 'auto',
      css: {
        ...commonStyles.scrollbar,
        scrollPaddingBottom: '1rem',
      },
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
    },
  },

  systemLogPanel: {
    container: {
      width: '100%',
      overflow: 'hidden',
      px: 4,
      minH: '200px',
      marginTop: 'auto',
    },
    title: commonStyles.title,
    logList: {
      ...commonStyles.panel,
      p: 4,
      height: '200px',
      overflowY: 'auto',
      fontFamily: 'mono',
      css: commonStyles.scrollbar,
    },
    entry: {
      p: 2,
      borderRadius: 'md',
      _hover: {
        bg: 'whiteAlpha.50',
      },
    },
  },

  chatBubble: {
    container: {
      display: 'flex',
      position: 'relative',
      _hover: {
        bg: 'whiteAlpha.50',
      },
      py: 1,
      px: 2,
      borderRadius: 'md',
    },
    message: {
      maxW: '90%',
      bg: 'transparent',
      p: 2,
    },
    text: {
      fontSize: 'xs',
      color: 'whiteAlpha.900',
    },
    dot: {
      position: 'absolute',
      w: '2',
      h: '2',
      borderRadius: 'full',
      bg: 'white',
      top: '2',
    },
  },

  historyDrawer: {
    listContainer: {
      flex: 1,
      overflowY: 'visible',
      px: 5,
      py: 3,
      css: commonStyles.scrollbar,
    },
    historyItem: {
      mb: 3,
      p: 4,
      borderRadius: '16px',
      bg: 'rgba(255, 246, 250, 0.055)',
      border: '1px solid rgba(249, 205, 222, 0.11)',
      cursor: 'pointer',
      transition: 'all 0.2s',
      _hover: {
        bg: 'rgba(255, 246, 250, 0.09)',
        transform: 'translateY(-1px)',
      },
    },
    historyItemSelected: {
      bg: 'rgba(218, 145, 179, 0.16)',
      borderColor: 'rgba(228, 166, 194, 0.42)',
      boxShadow: 'inset 3px 0 0 #D991B3',
    },
    historyHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      mb: 2,
    },
    timestamp: {
      fontSize: 'sm',
      color: 'whiteAlpha.700',
      fontFamily: 'mono',
    },
    deleteButton: {
      variant: 'ghost' as const,
      colorScheme: 'red' as const,
      size: 'sm' as const,
      color: 'red.300',
      opacity: 0.8,
      _hover: {
        opacity: 1,
        bg: 'whiteAlpha.200',
      },
    },
    messagePreview: {
      fontSize: 'sm',
      color: 'whiteAlpha.900',
      noOfLines: 2,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    drawer: {
      content: {
        background: 'linear-gradient(155deg, rgba(49, 35, 53, 0.985), rgba(25, 22, 33, 0.99))',
        maxWidth: '440px',
        position: 'fixed',
        top: isElectron ? '42px' : '12px',
        bottom: '12px',
        height: 'auto',
        marginLeft: '12px',
        border: '1px solid rgba(249, 205, 222, 0.16)',
        borderRadius: '28px',
        overflow: 'hidden',
        boxShadow: '20px 18px 60px rgba(12, 7, 16, 0.34)',
      },
      header: {
        px: 6,
        py: 5,
        borderBottom: '1px solid rgba(249, 205, 222, 0.11)',
      },
      body: {
        minHeight: 0,
        overflowY: 'auto',
        px: 0,
        css: commonStyles.scrollbar,
      },
      footer: {
        mx: 4,
        mb: 4,
        px: 4,
        py: 3,
        border: '1px solid rgba(249, 205, 222, 0.13)',
        borderRadius: '18px',
        bg: 'rgba(255, 246, 250, 0.045)',
      },
      backdrop: {
        bg: 'rgba(10, 7, 14, 0.34)',
        backdropFilter: 'blur(3px)',
      },
      title: {
        color: 'white',
      },
      closeButton: {
        position: 'absolute',
        right: '18px',
        top: '16px',
        minW: '34px',
        width: '34px',
        height: '34px',
        p: 0,
        color: 'rgba(250, 218, 230, 0.78)',
        bg: 'rgba(255, 246, 250, 0.055)',
        border: '1px solid rgba(249, 205, 222, 0.13)',
        borderRadius: '12px',
        _hover: {
          color: '#FFF7FA',
          bg: 'rgba(218, 145, 179, 0.18)',
          borderColor: 'rgba(236, 181, 206, 0.30)',
        },
      },
      actionButton: {
        color: '#FFF9FC',
        bg: 'linear-gradient(135deg, #D991B3, #AD6A8A)',
        borderRadius: '14px',
        px: 6,
        _hover: { filter: 'brightness(1.08)' },
      },
    },
  },

  cameraPanel: {
    container: {
      width: '100%',
      overflow: 'hidden',
      px: 4,
      minH: '240px',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      mb: 4,
    },
    title: commonStyles.title,
    videoContainer: {
      ...commonStyles.panel,
      width: '100%',
      height: '240px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      transition: 'all 0.2s',
    },
    video: {
      width: '100%',
      height: '100%',
      objectFit: 'cover' as const,
      transform: 'scaleX(-1)',
      borderRadius: '8px',
      display: 'block',
    } as const,
  },

  screenPanel: {
    container: {
      width: '97%',
      overflow: 'hidden',
      px: 4,
      minH: '240px',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      mb: 4,
    },
    title: commonStyles.title,
    screenContainer: {
      ...commonStyles.panel,
      width: '100%',
      height: '240px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      transition: 'all 0.2s',
    },
    video: {
      width: '100%',
      height: '100%',
      objectFit: 'cover' as const,
      borderRadius: '8px',
      display: 'block',
    } as const,
  },

  // Add Browser Panel Styles
  browserPanel: {
    container: {
      width: '97%',
      overflow: 'hidden',
      px: 4,
      minH: '240px',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      mb: 4,
    },
    title: commonStyles.title,
    browserContainer: {
      ...commonStyles.panel,
      width: '100%',
      height: '240px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      transition: 'all 0.2s',
      cursor: 'pointer',
      _hover: {
        bg: 'whiteAlpha.100',
      },
    },
    iframe: {
      width: '100%',
      height: '100%',
      border: 'none',
      borderRadius: '8px',
    } as const,
  },

  bottomTab: {
    container: {
      width: '97%',
      px: 4,
      position: 'relative' as const,
      zIndex: 0,
    },
    tabs: {
      width: '100%',
      bg: 'whiteAlpha.50',
      borderRadius: 'lg',
      p: '1',
    },
    list: {
      borderBottom: 'none',
      gap: '1',
      bg: 'rgba(255, 246, 250, 0.045)',
      border: '1px solid rgba(249, 205, 222, 0.12)',
      borderRadius: '16px',
      p: '4px',
      display: 'grid',
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    },
    trigger: {
      color: 'whiteAlpha.700',
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      justifyContent: 'center',
      px: 2,
      py: 2,
      borderRadius: '12px',
      fontSize: '12px',
      _hover: {
        color: 'white',
        bg: 'whiteAlpha.50',
      },
      _selected: {
        color: 'white',
        bg: 'rgba(218, 145, 179, 0.20)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
      },
    },
  },

  groupDrawer: {
    section: {
      mb: 6,
    },
    sectionTitle: {
      fontSize: 'lg',
      fontWeight: 'semibold',
      color: 'white',
      mb: 3,
    },
    inviteBox: {
      display: 'flex',
      gap: 2,
    },
    input: {
      bg: 'whiteAlpha.100',
      border: 'none',
      color: 'white',
      _placeholder: {
        color: 'whiteAlpha.400',
      },
    },
    memberList: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
    },
    memberItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      p: 2,
      borderRadius: '14px',
      bg: 'rgba(255, 246, 250, 0.055)',
      border: '1px solid rgba(249, 205, 222, 0.11)',
    },
    memberText: {
      color: 'white',
      fontSize: 'sm',
    },
    removeButton: {
      size: 'sm',
      color: 'red.300',
      bg: 'transparent',
      _hover: {
        bg: 'whiteAlpha.200',
      },
    },
    button: {
      color: 'white',
      bg: 'rgba(218, 145, 179, 0.72)',
      borderRadius: '12px',
      _hover: {
        bg: 'rgba(218, 145, 179, 0.88)',
      },
    },
    clipboardButton: {
      color: 'white',
      bg: 'transparent',
      _hover: {
        bg: 'whiteAlpha.200',
      },
      size: 'sm',
    },
  },

  // Add styles for the Tool Call Indicator
  toolCallIndicator: {
    container: {
      pl: '44px', // Indent to align with message content (avatar width + gap)
      my: '1', // Reduced vertical margin (e.g., 4px if theme space 1 = 4px)
      gap: 2,
      width: '100%',
      minHeight: '24px', // Ensure minimum height
      display: 'flex', // Ensure display is flex
      alignItems: 'center', // Keep vertical alignment
      justifyContent: 'center', // Center items horizontally
    },
    icon: {
      color: 'blue.300',
      boxSize: '14px',
    },
    text: {
      fontSize: 'xs',
      color: 'whiteAlpha.700',
      fontStyle: 'italic',
    },
    spinner: {
      size: 'xs',
      color: 'blue.300',
      ml: 0,
    },
    completedIcon: {
      color: 'green.300',
      boxSize: '14px',
      ml: 0,
    },
    errorIcon: {
      color: 'red.300',
      boxSize: '14px',
      ml: 0,
    },
  },
};

export const chatPanelStyles = css`
  .cs-message-list {
    background: transparent !important;
    padding: var(--chakra-space-4);
  }
  
  .cs-message {
    margin: 12px 0;
    // padding-top: 20px !important;
  }

  .cs-message__content {
    background-color: rgba(255, 246, 250, 0.07) !important;
    border: 1px solid rgba(249, 205, 222, 0.12) !important;
    border-radius: 16px !important;
    padding: 8px !important;
    color: #fff7fa !important;
    font-size: 0.95rem !important;
    line-height: 1.5 !important;
    margin-top: 4px !important;
  }

  .cs-message__text {
    padding: 8px 0 !important;
  }

  .cs-message--outgoing .cs-message__content {
    background-color: rgba(218, 145, 179, 0.22) !important;
  }

  .cs-chat-container {
    background: transparent !important;
    border: none;
    padding: var(--chakra-space-2);
  }

  .cs-main-container {
    border: none !important;
    background: transparent !important;
    width: calc(100% - 24px) !important;
    margin-left: 0 !important;
  }

  .cs-message__sender {
    position: absolute !important;
    top: 0 !important;
    left: 36px !important;
    font-size: 0.875rem !important;
    font-weight: 600 !important;
    color: rgba(255, 236, 244, 0.74) !important;
  }

  .cs-message__content-wrapper {
    max-width: 80%;
    margin: 0 8px;
  }

  .cs-avatar {
    background-color: #d99bb7 !important;
    color: white !important;
    width: 28px !important;
    height: 28px !important;
    font-size: 14px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    border-radius: 50% !important;
  }

  .cs-message--outgoing .cs-avatar {
    background-color: #8b7481 !important;
  }

  .cs-message__header {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
  }
`;
