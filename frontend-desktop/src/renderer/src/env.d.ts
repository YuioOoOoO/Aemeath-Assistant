interface Window {
  api?: {
    setIgnoreMouseEvents: (ignore: boolean) => void
    setForceIgnoreMouse?: (forceIgnore: boolean) => void
    getCurrentMode?: () => 'window' | 'pet'
    showContextMenu?: (status?: Record<string, boolean>) => void
    onModeChanged: (callback: (mode: string) => void) => void
  }
}
