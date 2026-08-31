import { useState, useEffect, useRef } from 'react';
import { ModelInfo, useLive2DConfig } from '@/context/live2d-config-context';

export const useLive2dSettings = () => {
  const Live2DConfigContext = useLive2DConfig();

  const initialModelInfo: ModelInfo = {
    url: '',
    kScale: 0.5,
    initialXshift: 0,
    initialYshift: 0,
    emotionMap: {},
    scrollToResize: true,
  };

  const [modelInfo, setModelInfoState] = useState<ModelInfo>(
    Live2DConfigContext?.modelInfo || initialModelInfo,
  );
  const [originalModelInfo, setOriginalModelInfo] = useState<ModelInfo>(
    Live2DConfigContext?.modelInfo || initialModelInfo,
  );
  const loadedModelUrlRef = useRef(Live2DConfigContext?.modelInfo?.url || '');

  useEffect(() => {
    if (Live2DConfigContext?.modelInfo) {
      // A new character/model is external state and becomes the new baseline.
      // Same-model switch updates originate from this settings page and must
      // not overwrite the Cancel baseline before the user presses Save.
      const nextUrl = Live2DConfigContext.modelInfo.url || '';
      if (!loadedModelUrlRef.current || loadedModelUrlRef.current !== nextUrl) {
        loadedModelUrlRef.current = nextUrl;
        setOriginalModelInfo(Live2DConfigContext.modelInfo);
        setModelInfoState(Live2DConfigContext.modelInfo);
      }
    }
  }, [Live2DConfigContext?.modelInfo]);

  useEffect(() => {
    if (Live2DConfigContext && modelInfo) {
      Live2DConfigContext.setModelInfo(modelInfo);
    }
  }, [modelInfo.pointerInteractive, modelInfo.scrollToResize]);

  const handleInputChange = (key: keyof ModelInfo, value: ModelInfo[keyof ModelInfo]): void => {
    setModelInfoState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = (): void => {
    if (Live2DConfigContext && modelInfo) {
      setOriginalModelInfo(modelInfo);
    }
  };

  const handleCancel = (): void => {
    setModelInfoState(originalModelInfo);
    if (Live2DConfigContext && originalModelInfo) {
      Live2DConfigContext.setModelInfo(originalModelInfo);
    }
  };

  return {
    modelInfo,
    handleInputChange,
    handleSave,
    handleCancel,
  };
};
