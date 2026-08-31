import { create } from "zustand";

const FORCE_IGNORE_MOUSE_KEY = 'forceIgnoreMouse';

const loadForceIgnoreMouse = () => {
  try {
    return window.localStorage.getItem(FORCE_IGNORE_MOUSE_KEY) === 'true';
  } catch {
    return false;
  }
};

// Define the state store interface
interface ForceIgnoreMouseState {
  // Whether mouse events are forcibly ignored
  forceIgnoreMouse: boolean;
  // Set the force ignore mouse state
  setForceIgnoreMouse: (forceIgnore: boolean) => void;
}

// Create a global store for force ignore mouse state
const useForceIgnoreMouseStore = create<ForceIgnoreMouseState>((set) => ({
  forceIgnoreMouse: loadForceIgnoreMouse(),
  setForceIgnoreMouse: (forceIgnore) => {
    window.localStorage.setItem(FORCE_IGNORE_MOUSE_KEY, String(forceIgnore));
    set({ forceIgnoreMouse: forceIgnore });
  },
}));

/**
 * Hook to access and manage force ignore mouse state
 * This is used to enable/disable mouse interaction with the model in pet mode
 */
export function useForceIgnoreMouse() {
  const { forceIgnoreMouse, setForceIgnoreMouse } = useForceIgnoreMouseStore();

  return {
    forceIgnoreMouse,
    setForceIgnoreMouse,
  };
}
