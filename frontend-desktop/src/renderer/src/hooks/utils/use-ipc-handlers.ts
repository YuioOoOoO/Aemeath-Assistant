import { useEffect, useCallback } from "react";
import { useInterrupt } from "@/components/canvas/live2d";
import { useMicToggle } from "./use-mic-toggle";
import { useLive2DConfig } from "@/context/live2d-config-context";
import { useSwitchCharacter } from "@/hooks/utils/use-switch-character";
import { useForceIgnoreMouse } from "@/hooks/utils/use-force-ignore-mouse";
import { useMode } from "@/context/mode-context";
import { useScreenCaptureContext } from "@/context/screen-capture-context";

export function useIpcHandlers() {
  const { handleMicToggle } = useMicToggle();
  const { interrupt } = useInterrupt();
  const { modelInfo, setModelInfo } = useLive2DConfig();
  const { switchCharacter } = useSwitchCharacter();
  const { forceIgnoreMouse, setForceIgnoreMouse } = useForceIgnoreMouse();
  const { mode } = useMode();
  const isPet = mode === 'pet';
  const { isStreaming, startCapture, stopCapture } = useScreenCaptureContext();

  useEffect(() => {
    if (isPet) {
      (window.api as any)?.setForceIgnoreMouse?.(forceIgnoreMouse);
    }
  }, [forceIgnoreMouse, isPet]);

  const micToggleHandler = useCallback(() => {
    handleMicToggle();
  }, [handleMicToggle]);

  const interruptHandler = useCallback(() => {
    interrupt();
  }, [interrupt]);

  const scrollToResizeHandler = useCallback(() => {
    if (modelInfo) {
      setModelInfo({
        ...modelInfo,
        scrollToResize: !modelInfo.scrollToResize,
      });
    }
  }, [modelInfo, setModelInfo]);

  const switchCharacterHandler = useCallback(
    (_event: Electron.IpcRendererEvent, filename: string) => {
      switchCharacter(filename);
    },
    [switchCharacter],
  );

  // Handler for force ignore mouse state changes from main process
  const forceIgnoreMouseChangedHandler = useCallback(
    (_event: Electron.IpcRendererEvent, isForced: boolean) => {
      console.log("Force ignore mouse changed:", isForced);
      setForceIgnoreMouse(isForced);
    },
    [setForceIgnoreMouse],
  );

  // Handle toggle force ignore mouse from menu
  const toggleForceIgnoreMouseHandler = useCallback(() => {
    (window.api as any).toggleForceIgnoreMouse();
  }, []);

  const toggleScreenCaptureHandler = useCallback(() => {
    if (isStreaming) stopCapture();
    else startCapture();
  }, [isStreaming, startCapture, stopCapture]);

  useEffect(() => {
    if (!window.electron?.ipcRenderer) return;
    if (!isPet) return;

    window.electron.ipcRenderer.removeAllListeners("mic-toggle");
    window.electron.ipcRenderer.removeAllListeners("interrupt");
    window.electron.ipcRenderer.removeAllListeners("toggle-scroll-to-resize");
    window.electron.ipcRenderer.removeAllListeners("switch-character");
    window.electron.ipcRenderer.removeAllListeners("toggle-force-ignore-mouse");
    window.electron.ipcRenderer.removeAllListeners("force-ignore-mouse-changed");
    window.electron.ipcRenderer.removeAllListeners("toggle-screen-capture");

    window.electron.ipcRenderer.on("mic-toggle", micToggleHandler);
    window.electron.ipcRenderer.on("interrupt", interruptHandler);
    window.electron.ipcRenderer.on(
      "toggle-scroll-to-resize",
      scrollToResizeHandler,
    );
    window.electron.ipcRenderer.on("switch-character", switchCharacterHandler);
    window.electron.ipcRenderer.on(
      "toggle-force-ignore-mouse",
      toggleForceIgnoreMouseHandler,
    );
    window.electron.ipcRenderer.on(
      "force-ignore-mouse-changed",
      forceIgnoreMouseChangedHandler,
    );
    window.electron.ipcRenderer.on("toggle-screen-capture", toggleScreenCaptureHandler);

    return () => {
      window.electron?.ipcRenderer.removeAllListeners("mic-toggle");
      window.electron?.ipcRenderer.removeAllListeners("interrupt");
      window.electron?.ipcRenderer.removeAllListeners(
        "toggle-scroll-to-resize",
      );
      window.electron?.ipcRenderer.removeAllListeners("switch-character");
      window.electron?.ipcRenderer.removeAllListeners("toggle-force-ignore-mouse");
      window.electron?.ipcRenderer.removeAllListeners("force-ignore-mouse-changed");
      window.electron?.ipcRenderer.removeAllListeners("toggle-screen-capture");
    };
  }, [
    micToggleHandler,
    interruptHandler,
    scrollToResizeHandler,
    switchCharacterHandler,
    toggleForceIgnoreMouseHandler,
    forceIgnoreMouseChangedHandler,
    toggleScreenCaptureHandler,
    isPet,
  ]);
}
