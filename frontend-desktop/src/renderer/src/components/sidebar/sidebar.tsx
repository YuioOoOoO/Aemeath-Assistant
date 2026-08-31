/* eslint-disable react/require-default-props */
import { Box, Button, Menu, Text } from '@chakra-ui/react';
import {
  FiSettings, FiClock, FiChevronLeft, FiChevronRight, FiUsers, FiLayers
} from 'react-icons/fi';
import { memo } from 'react';
import { sidebarStyles } from './sidebar-styles';
import SettingUI from './setting/setting-ui';
import ChatHistoryPanel from './chat-history-panel';
import BottomTab from './bottom-tab';
import HistoryDrawer from './history-drawer';
import { useSidebar } from '@/hooks/sidebar/use-sidebar';
import GroupDrawer from './group-drawer';
import { ModeType } from '@/context/mode-context';

// Type definitions
interface SidebarProps {
  isCollapsed?: boolean
  onToggle: () => void
}

interface HeaderButtonsProps {
  onSettingsOpen: () => void
  onNewHistory: () => void
  setMode: (mode: ModeType) => void
  currentMode: 'window' | 'pet'
  isElectron: boolean
}

// Reusable components
const ToggleButton = memo(({ isCollapsed, onToggle }: {
  isCollapsed: boolean
  onToggle: () => void
}) => (
  <Box
    {...sidebarStyles.sidebar.toggleButton}
    style={{
      left: isCollapsed ? '4px' : '332px',
      transform: 'translateY(-50%)',
    }}
    onClick={onToggle}
    aria-label={isCollapsed ? '展开侧栏' : '收起侧栏'}
    title={isCollapsed ? '展开侧栏' : '收起侧栏'}
  >
    {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
  </Box>
));

ToggleButton.displayName = 'ToggleButton';

const ModeMenu = memo(({ setMode, currentMode, isElectron }: {
  setMode: (mode: ModeType) => void
  currentMode: ModeType
  isElectron: boolean
}) => (
  <Menu.Root>
    <Menu.Trigger as={Button} aria-label="切换模式" title="切换模式">
      <FiLayers />
      <Text as="span">模式</Text>
    </Menu.Trigger>
    <Menu.Positioner>
      <Menu.Content>
        <Menu.RadioItemGroup value={currentMode}>
          <Menu.RadioItem value="window" onClick={() => setMode('window')}>
            <Menu.ItemIndicator />
            窗口模式
          </Menu.RadioItem>
          <Menu.RadioItem 
            value="pet" 
            onClick={() => {
              if (isElectron) {
                setMode('pet');
              }
            }}
            disabled={!isElectron}
            title={!isElectron ? "Pet mode is only available in desktop app" : undefined}
          >
            <Menu.ItemIndicator />
            桌宠模式
          </Menu.RadioItem>
        </Menu.RadioItemGroup>
      </Menu.Content>
    </Menu.Positioner>
  </Menu.Root>
));

ModeMenu.displayName = 'ModeMenu';

const HeaderButtons = memo(({ onSettingsOpen, setMode, currentMode, isElectron }: HeaderButtonsProps) => (
  <>
    <Box {...sidebarStyles.sidebar.actionGrid}>
    <Button onClick={onSettingsOpen} aria-label="设置" title="设置">
      <FiSettings />
      <Text as="span">设置</Text>
    </Button>

    <GroupDrawer>
      <Button aria-label="群组" title="群组">
        <FiUsers />
        <Text as="span">群组</Text>
      </Button>
    </GroupDrawer>

    <HistoryDrawer>
      <Button aria-label="历史记录" title="历史记录">
        <FiClock />
        <Text as="span">历史</Text>
      </Button>
    </HistoryDrawer>

    <ModeMenu setMode={setMode} currentMode={currentMode} isElectron={isElectron} />
    </Box>
  </>
));

HeaderButtons.displayName = 'HeaderButtons';

const SidebarContent = memo(({ 
  onSettingsOpen, 
  onNewHistory, 
  setMode, 
  currentMode,
  isElectron
}: HeaderButtonsProps) => (
  <Box {...sidebarStyles.sidebar.content}>
    <Box {...sidebarStyles.sidebar.header}>
      <Box {...sidebarStyles.sidebar.brandBlock}>
        <Text {...sidebarStyles.sidebar.eyebrow}>AIMISI</Text>
        <Text {...sidebarStyles.sidebar.brand}>爱弥斯</Text>
      </Box>
      <HeaderButtons
        onSettingsOpen={onSettingsOpen}
        onNewHistory={onNewHistory}
        setMode={setMode}
        currentMode={currentMode}
        isElectron={isElectron}
      />
    </Box>
    <ChatHistoryPanel />
    <BottomTab />
  </Box>
));

SidebarContent.displayName = 'SidebarContent';

// Main component
function Sidebar({ isCollapsed = false, onToggle }: SidebarProps): JSX.Element {
  const {
    settingsOpen,
    onSettingsOpen,
    onSettingsClose,
    createNewHistory,
    setMode,
    currentMode,
    isElectron,
  } = useSidebar();

  return (
    <>
      <Box {...sidebarStyles.sidebar.container(isCollapsed)}>
        {!isCollapsed && !settingsOpen && (
        <SidebarContent
          onSettingsOpen={onSettingsOpen}
          onNewHistory={createNewHistory}
          setMode={setMode}
          currentMode={currentMode}
          isElectron={isElectron}
        />
      )}

        {!isCollapsed && settingsOpen && (
        <SettingUI
          open={settingsOpen}
          onClose={onSettingsClose}
          onToggle={onToggle}
        />
        )}
      </Box>
      <ToggleButton isCollapsed={isCollapsed} onToggle={onToggle} />
    </>
  );
}

export default Sidebar;
