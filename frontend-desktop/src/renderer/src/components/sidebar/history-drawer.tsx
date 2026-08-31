import { Box, Button, IconButton } from '@chakra-ui/react';
import { FiTrash2, FiX } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DrawerRoot,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
  DrawerBackdrop,
  DrawerCloseTrigger,
} from '@/components/ui/drawer';
import { sidebarStyles } from './sidebar-styles';
import { useHistoryDrawer } from '@/hooks/sidebar/use-history-drawer';
import { HistoryInfo } from '@/context/websocket-context';

// Type definitions
interface HistoryDrawerProps {
  children: React.ReactNode;
}

interface HistoryItemProps {
  isSelected: boolean;
  latestMessage: { content: string; timestamp: string | null };
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
  isDeleteDisabled: boolean;
}

// Reusable components
const HistoryItem = memo(({
  isSelected,
  latestMessage,
  onSelect,
  onDelete,
  isDeleteDisabled,
}: HistoryItemProps): JSX.Element => {
  const { t } = useTranslation();
  return (
    <Box
      {...sidebarStyles.historyDrawer.historyItem}
      {...(isSelected ? sidebarStyles.historyDrawer.historyItemSelected : {})}
      onClick={onSelect}
    >
      <Box {...sidebarStyles.historyDrawer.historyHeader}>
        <Box {...sidebarStyles.historyDrawer.timestamp}>
          {latestMessage.timestamp
            ? formatDistanceToNow(new Date(latestMessage.timestamp), { addSuffix: true })
            : t('history.noMessages')}
        </Box>
        <Button
          onClick={onDelete}
          disabled={isDeleteDisabled}
          {...sidebarStyles.historyDrawer.deleteButton}
        >
          <FiTrash2 />
        </Button>
      </Box>
      {latestMessage.content && (
        <Box {...sidebarStyles.historyDrawer.messagePreview}>
          {latestMessage.content}
        </Box>
      )}
    </Box>
  );
});

HistoryItem.displayName = 'HistoryItem';

// Main component
function HistoryDrawer({ children }: HistoryDrawerProps): JSX.Element {
  const { t } = useTranslation();
  const {
    open,
    setOpen,
    historyList,
    currentHistoryUid,
    fetchAndSetHistory,
    deleteHistory,
    getLatestMessageContent,
  } = useHistoryDrawer();

  return (
    <DrawerRoot
      open={open}
      onOpenChange={(e) => setOpen(e.open)}
      placement="start"
    >
      <DrawerBackdrop {...sidebarStyles.historyDrawer.drawer.backdrop} />
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent {...sidebarStyles.historyDrawer.drawer.content}>
        <DrawerHeader {...sidebarStyles.historyDrawer.drawer.header}>
          <DrawerTitle {...sidebarStyles.historyDrawer.drawer.title}>
            {t('history.chatHistoryList')}
          </DrawerTitle>
          <DrawerCloseTrigger asChild>
            <IconButton
              aria-label="关闭历史记录"
              title="关闭"
              {...sidebarStyles.historyDrawer.drawer.closeButton}
            >
              <FiX />
            </IconButton>
          </DrawerCloseTrigger>
        </DrawerHeader>

        <DrawerBody {...sidebarStyles.historyDrawer.drawer.body}>
          <Box {...sidebarStyles.historyDrawer.listContainer}>
            {historyList.map((history: HistoryInfo) => (
              <HistoryItem
                key={history.uid}
                isSelected={currentHistoryUid === history.uid}
                latestMessage={getLatestMessageContent(history)}
                onSelect={() => fetchAndSetHistory(history.uid)}
                onDelete={(e) => {
                  e.stopPropagation();
                  deleteHistory(history.uid);
                }}
                isDeleteDisabled={currentHistoryUid === history.uid}
              />
            ))}
          </Box>
        </DrawerBody>

      </DrawerContent>
    </DrawerRoot>
  );
}

export default HistoryDrawer;
