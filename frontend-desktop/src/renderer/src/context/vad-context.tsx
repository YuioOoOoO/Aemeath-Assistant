/* eslint-disable no-use-before-define */
import {
  createContext, useContext, useRef, useCallback, useEffect, useReducer, useMemo, useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { MicVAD } from '@ricky0123/vad-web';
import { useInterrupt } from '@/components/canvas/live2d';
import { audioTaskQueue } from '@/utils/task-queue';
import { useSendAudio } from '@/hooks/utils/use-send-audio';
import { SubtitleContext } from './subtitle-context';
import { AiStateContext, AiState } from './ai-state-context';
import { useLocalStorage } from '@/hooks/utils/use-local-storage';
import { toaster } from '@/components/ui/toaster';

/**
 * VAD settings configuration interface
 * @interface VADSettings
 */
export interface VADSettings {
  /** Threshold for positive speech detection (0-100) */
  positiveSpeechThreshold: number;

  /** Threshold for negative speech detection (0-100) */
  negativeSpeechThreshold: number;

  /** Number of frames for speech redemption */
  redemptionFrames: number;
}

/**
 * VAD context state interface
 * @interface VADState
 */
interface VADState {
  /** Auto stop mic feature state */
  autoStopMic: boolean;

  /** Microphone active state */
  micOn: boolean;

  /** Whether the VAD audio pipeline is actually running */
  isVadRunning: boolean;

  /** Set microphone state */
  setMicOn: (value: boolean) => void;

  /** Set Auto stop mic state */
  setAutoStopMic: (value: boolean) => void;

  /** Start microphone and VAD */
  startMic: () => Promise<void>;

  /** Stop microphone and VAD */
  stopMic: () => void;

  /** Previous speech probability value */
  previousTriggeredProbability: number;

  /** Set previous speech probability */
  setPreviousTriggeredProbability: (value: number) => void;

  /** VAD settings configuration */
  settings: VADSettings;

  /** Update VAD settings */
  updateSettings: (newSettings: VADSettings) => void;

  /** Auto start microphone when AI starts speaking */
  autoStartMicOn: boolean;

  /** Set auto start microphone state */
  setAutoStartMicOn: (value: boolean) => void;

  /** Auto start microphone when conversation ends */
  autoStartMicOnConvEnd: boolean;

  /** Set auto start microphone when conversation ends state */
  setAutoStartMicOnConvEnd: (value: boolean) => void;
}

/**
 * Default values and constants
 */
const DEFAULT_VAD_SETTINGS: VADSettings = {
  positiveSpeechThreshold: 50,
  negativeSpeechThreshold: 35,
  redemptionFrames: 35,
};

const DEFAULT_VAD_STATE = {
  micOn: false,
  autoStopMic: false,
  autoStartMicOn: false,
  autoStartMicOnConvEnd: false,
};

/**
 * Create the VAD context
 */
export const VADContext = createContext<VADState | null>(null);

/**
 * VAD Provider Component
 * Manages voice activity detection and microphone state
 *
 * @param {Object} props - Provider props
 * @param {React.ReactNode} props.children - Child components
 */
export function VADProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  // Refs for VAD instance and state
  const vadRef = useRef<MicVAD | null>(null);
  const vadRunningRef = useRef(false);
  const [isVadRunning, setIsVadRunning] = useState(false);
  const vadOperationRef = useRef<Promise<void>>(Promise.resolve());
  const desiredMicOnRef = useRef(false);
  const restoredMicRef = useRef(false);
  const previousTriggeredProbabilityRef = useRef(0);
  const previousAiStateRef = useRef<AiState>('idle');

  // Persistent state management
  const [micOn, setMicOn] = useLocalStorage('micOn', DEFAULT_VAD_STATE.micOn);
  const autoStopMicRef = useRef(true);
  const [autoStopMic, setAutoStopMicState] = useLocalStorage(
    'autoStopMic',
    DEFAULT_VAD_STATE.autoStopMic,
  );
  const [settings, setSettings] = useLocalStorage<VADSettings>(
    'vadSettings',
    DEFAULT_VAD_SETTINGS,
  );
  const settingsRef = useRef(settings);
  const [autoStartMicOn, setAutoStartMicOnState] = useLocalStorage(
    'autoStartMicOn',
    DEFAULT_VAD_STATE.autoStartMicOn,
  );
  const autoStartMicRef = useRef(false);
  const [autoStartMicOnConvEnd, setAutoStartMicOnConvEndState] = useLocalStorage(
    'autoStartMicOnConvEnd',
    DEFAULT_VAD_STATE.autoStartMicOnConvEnd,
  );
  const autoStartMicOnConvEndRef = useRef(false);

  // Force update mechanism for ref updates
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  // External hooks and contexts
  const { interrupt } = useInterrupt();
  const { sendAudioPartition } = useSendAudio();
  const { setSubtitleText } = useContext(SubtitleContext)!;
  const { aiState, setAiState } = useContext(AiStateContext)!;

  // Refs for callback stability
  const interruptRef = useRef(interrupt);
  const sendAudioPartitionRef = useRef(sendAudioPartition);
  const aiStateRef = useRef<AiState>(aiState);
  const setSubtitleTextRef = useRef(setSubtitleText);
  const setAiStateRef = useRef(setAiState);

  const isProcessingRef = useRef(false);

  // Update refs when dependencies change
  useEffect(() => {
    aiStateRef.current = aiState;
  }, [aiState]);

  useEffect(() => {
    interruptRef.current = interrupt;
  }, [interrupt]);

  useEffect(() => {
    sendAudioPartitionRef.current = sendAudioPartition;
  }, [sendAudioPartition]);

  useEffect(() => {
    setSubtitleTextRef.current = setSubtitleText;
  }, [setSubtitleText]);

  useEffect(() => {
    setAiStateRef.current = setAiState;
  }, [setAiState]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    autoStopMicRef.current = autoStopMic;
  }, []);

  useEffect(() => {
    autoStartMicRef.current = autoStartMicOn;
  }, []);

  useEffect(() => {
    autoStartMicOnConvEndRef.current = autoStartMicOnConvEnd;
  }, []);

  /**
   * Update previous triggered probability and force re-render
   */
  const setPreviousTriggeredProbability = useCallback((value: number) => {
    previousTriggeredProbabilityRef.current = value;
    forceUpdate();
  }, []);

  /**
   * Handle speech start event (initial detection)
   */
  const handleSpeechStart = useCallback(() => {
    console.log('Speech started - saving current state');
    // Save current AI state but DON'T change to listening yet
    previousAiStateRef.current = aiStateRef.current;
    isProcessingRef.current = true;
    // Don't change state here - wait for onSpeechRealStart
  }, []);

  /**
   * Handle real speech start event (confirmed speech)
   */
  const handleSpeechRealStart = useCallback(() => {
    console.log('Real speech confirmed - checking if need to interrupt');
    // Check if we need to interrupt based on the PREVIOUS state (before speech started)
    if (previousAiStateRef.current === 'thinking-speaking') {
      console.log('Interrupting AI speech due to user speaking');
      interruptRef.current();
    }
    // Now change to listening state
    setAiStateRef.current('listening');
  }, []);

  /**
   * Handle frame processing event
   */
  const handleFrameProcessed = useCallback((probs: { isSpeech: number }) => {
    if (probs.isSpeech > previousTriggeredProbabilityRef.current) {
      setPreviousTriggeredProbability(probs.isSpeech);
    }
  }, []);

  /**
   * Handle speech end event
   */
  const handleSpeechEnd = useCallback((audio: Float32Array) => {
    if (!isProcessingRef.current) return;
    console.log('Speech ended');
    audioTaskQueue.clearQueue();

    if (autoStopMicRef.current) {
      stopMic();
    } else {
      console.log('Auto stop mic is OFF, keeping mic active');
    }

    setPreviousTriggeredProbability(0);
    sendAudioPartitionRef.current(audio);
    isProcessingRef.current = false;
    setAiStateRef.current("thinking-speaking");
  }, []);

  /**
   * Handle VAD misfire event
   */
  const handleVADMisfire = useCallback(() => {
    if (!isProcessingRef.current) return;
    console.log('VAD misfire detected');
    setPreviousTriggeredProbability(0);
    isProcessingRef.current = false;

    // Restore previous AI state and show helpful misfire message
    setAiStateRef.current(previousAiStateRef.current);
    setSubtitleTextRef.current(t('error.vadMisfire'));
  }, [t]);

  /**
   * Update VAD settings and restart if active
   */
  const createVAD = async () => {
    const currentSettings = settingsRef.current;
    const newVAD = await MicVAD.new({
      model: "v5",
      preSpeechPadFrames: 20,
      positiveSpeechThreshold: currentSettings.positiveSpeechThreshold / 100,
      negativeSpeechThreshold: currentSettings.negativeSpeechThreshold / 100,
      redemptionFrames: currentSettings.redemptionFrames,
      baseAssetPath: './libs/',
      onnxWASMBasePath: './libs/',
      onSpeechStart: handleSpeechStart,
      onSpeechRealStart: handleSpeechRealStart,
      onFrameProcessed: handleFrameProcessed,
      onSpeechEnd: handleSpeechEnd,
      onVADMisfire: handleVADMisfire,
    });
    return newVAD;
  };

  const ensureVADAudioContextRunning = async (vad: MicVAD) => {
    // vad-web does not expose this publicly, but its start() only resumes the
    // frame processor. The underlying AudioContext can still be suspended when
    // Electron restores the microphone before the first user interaction.
    const audioContext = (vad as MicVAD & { audioContext: AudioContext }).audioContext;
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    if (audioContext.state !== 'running') {
      throw new Error(`Microphone audio context is ${audioContext.state}`);
    }
  };

  /**
   * Start microphone and VAD processing
   */
  const startMic = useCallback(async () => {
    desiredMicOnRef.current = true;

    const operation = vadOperationRef.current.then(async () => {
      if (!desiredMicOnRef.current) return;

      try {
        if (!vadRef.current) {
          console.log('Initializing VAD');
          const newVAD = await createVAD();

          // A stop request may have arrived while MicVAD.new() was pending.
          // Never leave that newly-created stream running without a reference.
          if (!desiredMicOnRef.current) {
            await newVAD.destroy();
            return;
          }

          vadRef.current = newVAD;
          await ensureVADAudioContextRunning(newVAD);
          await newVAD.start();
          vadRunningRef.current = true;
          setIsVadRunning(true);
        } else if (!vadRunningRef.current) {
          console.log('Starting VAD');
          await ensureVADAudioContextRunning(vadRef.current);
          await vadRef.current.start();
          vadRunningRef.current = true;
          setIsVadRunning(true);
        }

        if (desiredMicOnRef.current) setMicOn(true);
      } catch (error) {
        desiredMicOnRef.current = false;
        const failedVAD = vadRef.current;
        vadRef.current = null;
        vadRunningRef.current = false;
        setIsVadRunning(false);
        if (failedVAD) await failedVAD.destroy().catch(() => undefined);
        setMicOn(false);
        console.error('Failed to start VAD:', error);
        toaster.create({
          title: `${t('error.failedStartVAD')}: ${error}`,
          type: 'error',
          duration: 2000,
        });
      }
    });

    vadOperationRef.current = operation.catch(() => undefined);
    await operation;
  }, [t]);

  /**
   * Stop microphone and VAD processing
   */
  const stopMic = useCallback(() => {
    desiredMicOnRef.current = false;
    isProcessingRef.current = false;

    vadOperationRef.current = vadOperationRef.current.then(async () => {
      console.log('Stopping VAD');
      const currentVAD = vadRef.current;
      vadRef.current = null;
      vadRunningRef.current = false;
      setIsVadRunning(false);

      if (currentVAD) {
        await currentVAD.pause();
        await currentVAD.destroy();
        console.log('VAD stopped and destroyed successfully');
        setPreviousTriggeredProbability(0);
      } else {
        console.log('VAD instance not found');
      }

      setMicOn(false);
    }).catch((error) => {
      setMicOn(false);
      console.error('Failed to stop VAD:', error);
    });
  }, []);

  /**
   * Update VAD settings and restart the single active instance.
   */
  const updateSettings = useCallback((newSettings: VADSettings) => {
    settingsRef.current = newSettings;
    setSettings(newSettings);
    if (desiredMicOnRef.current || vadRef.current) {
      stopMic();
      startMic();
    }
  }, [startMic, stopMic]);

  useEffect(() => {
    if (restoredMicRef.current) return;
    restoredMicRef.current = true;
    if (micOn) startMic();
  }, [micOn, startMic]);

  /**
   * Set Auto stop mic state
   */
  const setAutoStopMic = useCallback((value: boolean) => {
    autoStopMicRef.current = value;
    setAutoStopMicState(value);
    forceUpdate();
  }, []);

  const setAutoStartMicOn = useCallback((value: boolean) => {
    autoStartMicRef.current = value;
    setAutoStartMicOnState(value);
    forceUpdate();
  }, []);

  const setAutoStartMicOnConvEnd = useCallback((value: boolean) => {
    autoStartMicOnConvEndRef.current = value;
    setAutoStartMicOnConvEndState(value);
    forceUpdate();
  }, []);

  // Memoized context value
  const contextValue = useMemo(
    () => ({
      autoStopMic: autoStopMicRef.current,
      micOn,
      isVadRunning,
      setMicOn,
      setAutoStopMic,
      startMic,
      stopMic,
      previousTriggeredProbability: previousTriggeredProbabilityRef.current,
      setPreviousTriggeredProbability,
      settings,
      updateSettings,
      autoStartMicOn: autoStartMicRef.current,
      setAutoStartMicOn,
      autoStartMicOnConvEnd: autoStartMicOnConvEndRef.current,
      setAutoStartMicOnConvEnd,
    }),
    [
      micOn,
      isVadRunning,
      startMic,
      stopMic,
      settings,
      updateSettings,
    ],
  );

  return (
    <VADContext.Provider value={contextValue}>
      {children}
    </VADContext.Provider>
  );
}

/**
 * Custom hook to use the VAD context
 * @throws {Error} If used outside of VADProvider
 */
export function useVAD() {
  const context = useContext(VADContext);

  if (!context) {
    throw new Error('useVAD must be used within a VADProvider');
  }

  return context;
}
