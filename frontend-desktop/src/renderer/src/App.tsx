/* eslint-disable no-shadow */
// import { StrictMode } from 'react';
import { Box, Flex, ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { useEffect, useRef } from "react";
// import Canvas from './components/canvas/canvas'; // Likely unused now
import Sidebar from "./components/sidebar/sidebar";
import Footer from "./components/footer/footer";
import { AiStateProvider } from "./context/ai-state-context";
import { Live2DConfigProvider } from "./context/live2d-config-context";
import { SubtitleProvider } from "./context/subtitle-context";
import { BgUrlProvider } from "./context/bgurl-context";
import { layoutStyles } from "./layout";
import WebSocketHandler from "./services/websocket-handler";
import { CameraProvider } from "./context/camera-context";
import { ChatHistoryProvider } from "./context/chat-history-context";
import { CharacterConfigProvider } from "./context/character-config-context";
import { Toaster } from "./components/ui/toaster";
import { VADProvider } from "./context/vad-context";
import { Live2D } from "./components/canvas/live2d";
import TitleBar from "./components/electron/title-bar";
import { InputSubtitle } from "./components/electron/input-subtitle";
import { ProactiveSpeakProvider } from "./context/proactive-speak-context";
import { ScreenCaptureProvider } from "./context/screen-capture-context";
import { GroupProvider } from "./context/group-context";
import { BrowserProvider } from "./context/browser-context";
// eslint-disable-next-line import/no-extraneous-dependencies, import/newline-after-import
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import Background from "./components/canvas/background";
import Subtitle from "./components/canvas/subtitle";
import { ModeProvider, useMode } from "./context/mode-context";
import { useLocalStorage } from "./hooks/utils/use-local-storage";

function AppContent(): JSX.Element {
  const [showSidebar, setShowSidebar] = useLocalStorage('showSidebar', true);
  const [isFooterCollapsed, setIsFooterCollapsed] = useLocalStorage('footerCollapsed', false);
  const { mode } = useMode();
  const isElectron = window.api !== undefined;
  const live2dContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const appMode = isElectron ? mode : "browser";
    document.documentElement.dataset.appMode = appMode;

    return () => {
      delete document.documentElement.dataset.appMode;
    };
  }, [isElectron, mode]);

    
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
  document.documentElement.style.height = '100%';
  document.body.style.height = '100%';
  document.documentElement.style.position = 'fixed';
  document.body.style.position = 'fixed';
  document.documentElement.style.width = '100%';
  document.body.style.width = '100%';

  // Define base style properties shared across modes/breakpoints
  const live2dBaseStyle = {
    position: "absolute" as const,
    overflow: "hidden",
    transition: "all 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
    pointerEvents: "auto" as const,
  };

  // Define styles specifically for the "window" mode, using responsive syntax
  const getResponsiveLive2DWindowStyle = (sidebarVisible: boolean) => ({
    ...live2dBaseStyle,
    top: isElectron ? "46px" : "16px",
    bottom: isFooterCollapsed ? "48px" : "144px",
    height: "auto",
    zIndex: 5,
    left: {
      base: "16px",
      md: sidebarVisible ? "360px" : "16px",
    },
    right: "16px",
    width: {
      base: "auto",
      md: "auto",
    },
    borderRadius: "28px",
    border: "1px solid rgba(249, 205, 222, 0.16)",
    background: "linear-gradient(145deg, rgba(46, 35, 50, 0.18), rgba(20, 17, 26, 0.12))",
    boxShadow: "0 24px 70px rgba(10, 6, 14, 0.24), inset 0 1px 0 rgba(255, 244, 248, 0.08)",
  });

  // Define styles specifically for the "pet" mode
  const live2dPetStyle = {
    ...live2dBaseStyle,
    top: 0, // Override position for pet mode
    left: 0,
    width: "100vw", // Full viewport
    height: "100vh",
    zIndex: 15, // Higher zIndex for pet mode overlay
  };

  return (
    <>
      <Box
        ref={live2dContainerRef}
        // Apply styles conditionally based on mode
        // Use the function to get dynamic responsive styles for window mode
        {...(mode === "window"
          ? getResponsiveLive2DWindowStyle(showSidebar)
          : live2dPetStyle)}
      >
        <Live2D />
      </Box>

      {/* Conditional Rendering of Window UI */}
      {mode === "window" && (
        <>
          {isElectron && <TitleBar />}
          {/* Apply styles by spreading */}
          <Flex {...layoutStyles.appContainer}>
            <Box
              {...layoutStyles.sidebar}
              {...(!showSidebar && { width: "0px", minWidth: "0px" })}
            >
              <Sidebar
                isCollapsed={!showSidebar}
                onToggle={() => setShowSidebar(!showSidebar)}
              />
            </Box>
            <Box {...layoutStyles.mainContent}>
              <Background />
              <Box
                position="absolute"
                bottom={isFooterCollapsed ? "48px" : "146px"}
                left="50%"
                transform="translateX(-50%)"
                zIndex={10}
                width={{ base: "88%", md: "min(680px, 72%)" }}
              >
                <Subtitle />
              </Box>
              <Box
                {...layoutStyles.footer}
                zIndex={10}
                {...(isFooterCollapsed && layoutStyles.collapsedFooter)}
              >
                <Footer
                  isCollapsed={isFooterCollapsed}
                  onToggle={() => setIsFooterCollapsed(!isFooterCollapsed)}
                />
              </Box>
            </Box>
          </Flex>
        </>
      )}

      {/* Conditional Rendering of Pet Mode UI */}
      {mode === "pet" && <InputSubtitle />}
    </>
  );
}

function App(): JSX.Element {
  return (
    <ChakraProvider value={defaultSystem}>
      {/* ModeProvider needs to wrap AppContent to provide mode to getGlobalStyles */}
      <ModeProvider>
        <AppWithGlobalStyles />
      </ModeProvider>
    </ChakraProvider>
  );
}

// New component to access mode for global styles
function AppWithGlobalStyles(): JSX.Element {
  return (
    <>
      <CameraProvider>
        <ScreenCaptureProvider>
          <CharacterConfigProvider>
            <ChatHistoryProvider>
              <AiStateProvider>
                <ProactiveSpeakProvider>
                  <Live2DConfigProvider>
                    <SubtitleProvider>
                      <VADProvider>
                        <BgUrlProvider>
                          <GroupProvider>
                            <BrowserProvider>
                              <WebSocketHandler>
                                <Toaster />
                                <AppContent />
                              </WebSocketHandler>
                            </BrowserProvider>
                          </GroupProvider>
                        </BgUrlProvider>
                      </VADProvider>
                    </SubtitleProvider>
                  </Live2DConfigProvider>
                </ProactiveSpeakProvider>
              </AiStateProvider>
            </ChatHistoryProvider>
          </CharacterConfigProvider>
        </ScreenCaptureProvider>
      </CameraProvider>
    </>
  );
}

export default App;
