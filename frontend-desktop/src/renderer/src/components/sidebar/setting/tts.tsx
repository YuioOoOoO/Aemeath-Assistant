import {
  Box, Stack, Text, createListCollection,
} from '@chakra-ui/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { wsService, MessageEvent } from '@/services/websocket-service';
import { InputField, NumberField, SelectField, SwitchField } from './common';
import { settingStyles } from './setting-styles';

interface TTSProps {
  onSave?: (callback: () => void) => () => void;
  onCancel?: (callback: () => void) => () => void;
}

interface VolcengineSettings {
  speaker: string;
  sample_rate: number;
  speech_rate: number;
  loudness_rate: number;
  emotion_enabled: boolean;
  emotion_scale: number;
  timeout_seconds: number;
}

const sampleRates = createListCollection({
  items: [8000, 16000, 22050, 24000, 32000, 44100, 48000].map((value) => ({
    label: `${value / 1000} kHz`,
    value: value.toString(),
  })),
});

function TTS({ onSave, onCancel }: TTSProps): JSX.Element {
  const { t } = useTranslation();
  const [engine, setEngine] = useState('');
  const [settings, setSettings] = useState<VolcengineSettings | null>(null);
  const originalRef = useRef<VolcengineSettings | null>(null);

  useEffect(() => {
    const subscription = wsService.onMessage((message: MessageEvent) => {
      if ((message.type === 'tts-config' || message.type === 'tts-config-updated')
          && message.config) {
        setEngine(message.config.tts_model);
        if (message.config.volcengine_tts) {
          const next = { ...message.config.volcengine_tts };
          setSettings(next);
          originalRef.current = next;
        }
      }
    });
    wsService.sendMessage({ type: 'fetch-tts-config' });
    return () => subscription.unsubscribe();
  }, [t]);

  const update = useCallback(<K extends keyof VolcengineSettings>(
    key: K,
    value: VolcengineSettings[K],
  ) => {
    setSettings((current) => (current ? { ...current, [key]: value } : current));
  }, []);

  const handleSave = useCallback(() => {
    if (!settings) return;
    wsService.sendMessage({ type: 'update-tts-config', config: settings });
  }, [settings]);

  const handleCancel = useCallback(() => {
    if (originalRef.current) setSettings({ ...originalRef.current });
  }, []);

  useEffect(() => {
    if (!onSave || !onCancel) return undefined;
    const cleanupSave = onSave(handleSave);
    const cleanupCancel = onCancel(handleCancel);
    return () => {
      cleanupSave?.();
      cleanupCancel?.();
    };
  }, [onSave, onCancel, handleSave, handleCancel]);

  if (!settings) {
    return <Text color="rgba(255, 236, 244, 0.62)">{t('settings.tts.loading')}</Text>;
  }

  if (engine !== 'volcengine_tts') {
    return (
      <Box color="rgba(255, 236, 244, 0.72)">
        {t('settings.tts.unsupported', { engine })}
      </Box>
    );
  }

  return (
    <Stack {...settingStyles.common.container} gap={6} pb={4}>
      <Box
        px={4}
        py={3}
        borderRadius="16px"
        bg="rgba(218, 145, 179, 0.10)"
        border="1px solid rgba(249, 205, 222, 0.13)"
      >
        <Text color="#FFF7FA" fontWeight="semibold">{t('settings.tts.volcengine')}</Text>
        <Text color="rgba(255, 236, 244, 0.55)" fontSize="xs" mt={1}>
          {t('settings.tts.realtimeHint')}
        </Text>
      </Box>

      <InputField
        label={t('settings.tts.speaker')}
        help={t('settings.tts.speakerHelp')}
        value={settings.speaker}
        onChange={(value) => update('speaker', value)}
      />
      <SelectField
        label={t('settings.tts.sampleRate')}
        value={[settings.sample_rate.toString()]}
        onChange={(value) => update('sample_rate', Number(value[0]))}
        collection={sampleRates}
        placeholder={t('settings.tts.sampleRate')}
      />
      <NumberField
        label={t('settings.tts.speechRate')}
        help={t('settings.tts.speechRateHelp')}
        value={settings.speech_rate}
        onChange={(value) => update('speech_rate', Number(value))}
        min={-50}
        max={100}
      />
      <NumberField
        label={t('settings.tts.loudness')}
        help={t('settings.tts.loudnessHelp')}
        value={settings.loudness_rate}
        onChange={(value) => update('loudness_rate', Number(value))}
        min={-50}
        max={100}
      />
      <SwitchField
        label={t('settings.tts.emotionEnabled')}
        help={t('settings.tts.emotionEnabledHelp')}
        checked={settings.emotion_enabled}
        onChange={(value) => update('emotion_enabled', value)}
      />
      {settings.emotion_enabled && (
        <NumberField
          label={t('settings.tts.emotionScale')}
          help={t('settings.tts.emotionScaleHelp')}
          value={settings.emotion_scale}
          onChange={(value) => update('emotion_scale', Number(value))}
          min={1}
          max={5}
          step={0.1}
        />
      )}
      <NumberField
        label={t('settings.tts.timeout')}
        help={t('settings.tts.timeoutHelp')}
        value={settings.timeout_seconds}
        onChange={(value) => update('timeout_seconds', Number(value))}
        min={1}
        max={120}
      />
    </Stack>
  );
}

export default TTS;
