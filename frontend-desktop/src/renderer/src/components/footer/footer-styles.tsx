import { SystemStyleObject } from '@chakra-ui/react';

interface FooterStyles {
  container: (isCollapsed: boolean) => SystemStyleObject
  toggleButton: SystemStyleObject
  actionButton: SystemStyleObject
  input: SystemStyleObject
  attachButton: SystemStyleObject
  statusDock: SystemStyleObject
  leadingActions: SystemStyleObject
  trailingActions: SystemStyleObject
  newChatButton: SystemStyleObject
}

interface AIIndicatorStyles {
  container: SystemStyleObject
  text: SystemStyleObject
}

export const footerStyles: {
  footer: FooterStyles
  aiIndicator: AIIndicatorStyles
} = {
  footer: {
    container: (isCollapsed) => ({
      bg: isCollapsed ? 'transparent' : 'linear-gradient(145deg, rgba(49, 35, 53, 0.92), rgba(25, 22, 33, 0.94))',
      backdropFilter: 'blur(20px)',
      border: isCollapsed ? 'none' : '1px solid rgba(249, 205, 222, 0.18)',
      borderRadius: '24px',
      transform: isCollapsed ? 'translateY(calc(100% - 24px))' : 'translateY(0)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      height: '100%',
      position: 'relative',
      overflow: isCollapsed ? 'visible' : 'hidden',
      pb: '2',
      boxShadow: isCollapsed ? 'none' : '0 18px 52px rgba(17, 8, 18, 0.28), inset 0 1px 0 rgba(255,244,248,0.08)',
    }),
    toggleButton: {
      height: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      color: '#A1768A',
      _hover: { color: '#8E536F' },
      bg: 'transparent',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    actionButton: {
      borderRadius: '14px',
      height: '42px',
      minW: '88px',
      px: '3',
      color: '#FFF8FB',
      gap: '7px',
      fontSize: '12px',
      fontWeight: '600',
      border: '1px solid rgba(249, 205, 222, 0.14)',
      _hover: { filter: 'brightness(1.08)', transform: 'translateY(-1px)' },
    },
    input: {
      bg: 'rgba(255, 246, 250, 0.05)',
      border: '1px solid rgba(246, 205, 220, 0.16)',
      height: '62px',
      borderRadius: '17px',
      fontSize: '15px',
      pl: '12',
      pr: '4',
      color: '#FFF8FB',
      _placeholder: {
        color: 'rgba(248, 220, 231, 0.42)',
      },
      _focus: {
        borderColor: 'rgba(198, 127, 159, 0.42)',
        bg: 'rgba(255, 246, 250, 0.08)',
      },
      resize: 'none',
      minHeight: '62px',
      maxHeight: '62px',
      py: '0',
      display: 'flex',
      alignItems: 'center',
      paddingTop: '19px',
      lineHeight: '1.4',
    },
    attachButton: {
      position: 'absolute',
      left: '1',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#9B7286',
      zIndex: 2,
      _hover: {
        bg: 'transparent',
        color: '#824E67',
      },
    },
    statusDock: {
      position: 'absolute',
      top: '5px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '110px',
      zIndex: 2,
    },
    leadingActions: {
      height: '62px',
      gap: 2,
      flexShrink: 0,
    },
    trailingActions: {
      height: '72px',
      width: '112px',
      gap: 1.5,
      flexShrink: 0,
      flexDirection: 'column',
      alignItems: 'stretch',
      justifyContent: 'center',
    },
    newChatButton: {
      height: '42px',
      minW: '112px',
      width: '112px',
      px: 3,
      borderRadius: '14px',
      color: 'rgba(255, 236, 244, 0.86)',
      background: 'rgba(218, 145, 179, 0.16)',
      border: '1px solid rgba(230, 169, 197, 0.22)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
      gap: 1.5,
      fontSize: '12px',
      _hover: { background: 'rgba(218, 145, 179, 0.24)', color: '#FFF9FC' },
    },
  },
  aiIndicator: {
    container: {
      bg: 'rgba(213, 142, 175, 0.14)',
      color: '#F2C8DA',
      width: '100%',
      height: '24px',
      borderRadius: '999px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid rgba(233, 176, 202, 0.14)',
      overflow: 'hidden',
    },
    text: {
      fontSize: '12px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
  },
};
