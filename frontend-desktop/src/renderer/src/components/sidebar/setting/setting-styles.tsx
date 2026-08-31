const isElectron = window.api !== undefined;
export const settingStyles = {
  settingUI: {
    container: {
      width: '100%',
      height: '100%',
      p: 4,
      gap: 4,
      position: 'relative',
      overflowY: 'auto',
      css: {
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-track': {
          bg: 'whiteAlpha.100',
          borderRadius: 'full',
        },
        '&::-webkit-scrollbar-thumb': {
          bg: 'whiteAlpha.300',
          borderRadius: 'full',
        },
      },
    },
    header: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 1,
    },
    title: {
      ml: 4,
      fontSize: 'lg',
      fontWeight: 'bold',
    },
    tabs: {
      root: {
        width: '100%',
        variant: 'plain' as const,
        colorPalette: 'pink',
      },
      content: {},
      trigger: {
        color: 'rgba(255, 228, 238, 0.58)',
        flex: 1,
        justifyContent: 'center',
        borderRadius: '12px',
        px: 3,
        py: 2,
        _selected: {
          color: '#FFF7FA',
          bg: 'rgba(218, 145, 179, 0.18)',
        },
        _hover: {
          color: '#F1BDD2',
        },
      },
      list: {
        display: 'flex',
        justifyContent: 'space-between',
        width: '100%',
        border: '1px solid rgba(249, 205, 222, 0.13)',
        bg: 'rgba(255, 246, 250, 0.04)',
        borderRadius: '16px',
        p: '6px',
        gap: '2px',
        mb: 4,
      },
    },
    footer: {
      width: '100%',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 2,
      mt: 'auto',
      pt: 4,
      borderTop: '1px solid',
      borderColor: 'whiteAlpha.200',
    },
    drawerContent: {
      bg: 'linear-gradient(155deg, rgba(49, 35, 53, 0.985), rgba(25, 22, 33, 0.99))',
      width: 'min(480px, calc(100vw - 24px))',
      maxWidth: '480px',
      position: 'fixed',
      top: isElectron ? '42px' : '12px',
      bottom: '12px',
      height: 'auto',
      maxHeight: isElectron ? 'calc(100vh - 54px)' : 'calc(100vh - 24px)',
      ml: '12px',
      border: '1px solid rgba(249, 205, 222, 0.16)',
      borderRadius: '28px',
      overflow: 'hidden',
      boxShadow: '20px 18px 60px rgba(12, 7, 16, 0.34)',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
    },
    drawerBackdrop: {
      bg: 'rgba(10, 7, 14, 0.34)',
      backdropFilter: 'blur(3px)',
    },
    drawerBody: {
      minHeight: 0,
      flex: 1,
      overflowY: 'auto',
      px: 6,
      css: {
        '&::-webkit-scrollbar': { width: '5px' },
        '&::-webkit-scrollbar-track': { background: 'transparent' },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(236, 190, 210, 0.24)',
          borderRadius: '999px',
        },
      },
    },
    drawerHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      position: 'relative',
      px: 6,
      py: 4,
    },
    drawerTitle: {
      color: '#FFF7FA',
      fontSize: 'lg',
      fontWeight: 'semibold',
    },
    closeButton: {
      position: 'absolute',
      right: 1,
      top: 1,
      color: 'rgba(255, 236, 244, 0.76)',

    },
    drawerFooter: {
      gap: 3,
      mx: 4,
      mb: 4,
      px: 4,
      py: 3,
      border: '1px solid rgba(249, 205, 222, 0.13)',
      borderRadius: '18px',
      bg: 'rgba(255, 246, 250, 0.045)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
      flexShrink: 0,
    },
    secondaryButton: {
      borderRadius: '14px',
      bg: 'rgba(255, 246, 250, 0.06)',
      color: 'rgba(255, 236, 244, 0.82)',
      border: '1px solid rgba(249, 205, 222, 0.14)',
      _hover: { bg: 'rgba(255, 246, 250, 0.10)' },
    },
    primaryButton: {
      borderRadius: '14px',
      bg: 'linear-gradient(135deg, #D991B3, #AD6A8A)',
      color: '#FFF9FC',
      px: 6,
      boxShadow: '0 8px 22px rgba(145, 75, 110, 0.22)',
      _hover: { filter: 'brightness(1.08)', transform: 'translateY(-1px)' },
    },
  },
  general: {
    container: {
      align: 'stretch',
      gap: 6,
      p: 4,
    },
    field: {
      label: {
        color: 'rgba(255, 236, 244, 0.82)',
      },
    },
    select: {
      root: {
        colorPalette: 'gray',
        bg: 'rgba(255, 246, 250, 0.06)',
        color: '#FFF7FA',
      },
      trigger: {
        bg: 'rgba(255, 246, 250, 0.06)',
        color: '#FFF7FA',
        borderColor: 'rgba(249, 205, 222, 0.28)',
        _hover: { bg: 'rgba(255, 246, 250, 0.09)' },
      },
    },
    input: {
      bg: 'rgba(255, 246, 250, 0.06)',
      color: '#FFF7FA',
      borderColor: 'rgba(249, 205, 222, 0.28)',
      _placeholder: { color: 'rgba(248, 220, 231, 0.36)' },
      _hover: { bg: 'rgba(255, 246, 250, 0.09)' },
    },
    buttonGroup: {
      gap: 4,
      width: '100%',
    },
    button: {
      width: '50%',
      variant: 'outline' as const,
      bg: 'blue',
      color: 'white',
      _hover: {
        bg: 'whiteAlpha.300',
      },
    },
    fieldLabel: {
      fontSize: '14px',
      color: 'gray.600',
    },
  },
  common: {
    field: {
      orientation: 'horizontal' as const,
    },
    fieldLabel: {
      fontSize: 'sm',
      color: 'whiteAlpha.800',
      whiteSpace: 'nowrap' as const,
    },
    switch: {
      size: 'md' as const,
      colorPalette: 'pink' as const,
      variant: 'solid' as const,
    },
    numberInput: {
      root: {
        pattern: '[0-9]*\\.?[0-9]*',
        inputMode: 'decimal' as const,
      },
      input: {
        bg: 'whiteAlpha.100',
        borderColor: 'whiteAlpha.200',
        color: '#FFF7FA',
        _hover: {
          bg: 'whiteAlpha.200',
        },
      },
    },
    container: {
      gap: 8,
      maxW: 'sm',
      css: { '--field-label-width': '120px' },
    },
    input: {
      bg: 'whiteAlpha.100',
      borderColor: 'whiteAlpha.200',
      color: '#FFF7FA',
      _placeholder: { color: 'rgba(248, 220, 231, 0.36)' },
      _hover: {
        bg: 'whiteAlpha.200',
      },
    },
  },
  live2d: {
    container: {
      gap: 8,
      maxW: 'sm',
      css: { '--field-label-width': '120px' },
    },
    emotionMap: {
      title: {
        fontWeight: 'bold',
        mb: 4,
      },
      entry: {
        mb: 2,
      },
      button: {
        colorPalette: 'blue',
        mt: 2,
      },
      deleteButton: {
        colorPalette: 'red',
      },
    },
  },
};
