import { Box, Stack, Text, createListCollection } from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { wsService, MessageEvent } from '@/services/websocket-service';
import { InputField, NumberField, SelectField } from './common';
import { settingStyles } from './setting-styles';

interface Props {
  onSave?: (callback: () => void) => () => void;
  onCancel?: (callback: () => void) => () => void;
}

type ModelSettings = {
  llm_provider: string;
  llm: Record<string, any>;
  tts_provider: string;
  tts: Record<string, any>;
  llm_providers: string[];
  tts_providers: string[];
  llm_configs: Record<string, Record<string, any>>;
  tts_configs: Record<string, Record<string, any>>;
};

const labels: Record<string, string> = {
  openai_compatible_llm: 'OpenAI 兼容接口', openai_llm: 'OpenAI',
  gemini_llm: 'Google Gemini', zhipu_llm: '智谱 AI', deepseek_llm: 'DeepSeek',
  groq_llm: 'Groq', mistral_llm: 'Mistral', volcengine_tts: '火山引擎 Seed-TTS',
  openai_tts: 'OpenAI 兼容语音', siliconflow_tts: '硅基流动', fish_api_tts: 'Fish Audio',
};

const llmFields = ['base_url', 'model', 'temperature'];
const ttsFields: Record<string, string[]> = {
  volcengine_tts: ['resource_id', 'speaker', 'endpoint', 'sample_rate', 'speech_rate', 'loudness_rate', 'emotion_scale', 'timeout_seconds'],
  openai_tts: ['base_url', 'model', 'voice', 'file_extension'],
  siliconflow_tts: ['api_url', 'default_model', 'default_voice', 'sample_rate', 'speed', 'gain'],
  fish_api_tts: ['base_url', 'reference_id', 'latency'],
};
const fieldLabels: Record<string, string> = {
  base_url: 'API 地址', api_url: 'API 地址', model: '模型名称', default_model: '模型名称',
  temperature: '温度', api_key: 'API 密钥', resource_id: '资源 ID', speaker: '音色 ID',
  voice: '音色', default_voice: '音色', endpoint: '服务地址', sample_rate: '采样率',
  speech_rate: '语速', loudness_rate: '音量', emotion_scale: '情绪强度',
  timeout_seconds: '超时时间（秒）', file_extension: '音频格式', speed: '语速', gain: '增益',
  reference_id: '参考音色 ID', latency: '延迟模式',
};

function Models({ onSave, onCancel }: Props): JSX.Element {
  const [settings, setSettings] = useState<ModelSettings | null>(null);
  const original = useRef<ModelSettings | null>(null);
  const [llmKey, setLlmKey] = useState('');
  const [ttsKey, setTtsKey] = useState('');

  useEffect(() => {
    const sub = wsService.onMessage((message: MessageEvent) => {
      if ((message.type === 'model-config' || message.type === 'model-config-updated') && message.config) {
        const next = message.config as unknown as ModelSettings;
        setSettings(next); original.current = next; setLlmKey(''); setTtsKey('');
      }
    });
    wsService.sendMessage({ type: 'fetch-model-config' });
    return () => sub.unsubscribe();
  }, []);

  const llmOptions = useMemo(() => createListCollection({
    items: (settings?.llm_providers || []).map((value) => ({ label: labels[value] || value, value })),
  }), [settings?.llm_providers]);
  const ttsOptions = useMemo(() => createListCollection({
    items: (settings?.tts_providers || []).map((value) => ({ label: labels[value] || value, value })),
  }), [settings?.tts_providers]);
  const updateSection = (section: 'llm' | 'tts', key: string, value: any) => {
    setSettings((current) => current ? { ...current, [section]: { ...current[section], [key]: value } } : current);
  };
  const refetchForProvider = (section: 'llm' | 'tts', provider: string) => {
    if (section === 'llm') setSettings((current) => current ? { ...current, llm_provider: provider, llm: { ...(current.llm_configs[provider] || {}) } } : current);
    else setSettings((current) => current ? { ...current, tts_provider: provider, tts: { ...(current.tts_configs[provider] || {}) } } : current);
  };
  const save = useCallback(() => {
    if (!settings) return;
    wsService.sendMessage({ type: 'update-model-config', config: {
      llm_provider: settings.llm_provider, llm: { ...settings.llm, llm_api_key: llmKey },
      tts_provider: settings.tts_provider, tts: { ...settings.tts, api_key: ttsKey },
    } });
  }, [settings, llmKey, ttsKey]);
  const cancel = useCallback(() => { if (original.current) setSettings(original.current); setLlmKey(''); setTtsKey(''); }, []);
  useEffect(() => {
    const a = onSave?.(save); const b = onCancel?.(cancel);
    return () => { a?.(); b?.(); };
  }, [onSave, onCancel, save, cancel]);

  if (!settings) return <Text color="rgba(255,236,244,.7)">正在读取模型配置…</Text>;
  const renderField = (section: 'llm' | 'tts', key: string) => {
    const value = settings[section][key] ?? '';
    if (typeof value === 'number') return <NumberField key={key} label={fieldLabels[key] || key} value={value} onChange={(v) => updateSection(section, key, Number(v))} />;
    return <InputField key={key} label={fieldLabels[key] || key} value={String(value)} onChange={(v) => updateSection(section, key, v)} />;
  };
  return (
    <Stack {...settingStyles.common.container} gap={6} pb={4}>
      <Box px={4} py={3} borderRadius="16px" bg="rgba(218,145,179,.10)" border="1px solid rgba(249,205,222,.13)">
        <Text color="#FFF7FA" fontWeight="semibold">语言模型</Text>
        <Text color="rgba(255,236,244,.58)" fontSize="xs" mt={1}>密钥不会回传到界面；留空表示保留当前密钥。</Text>
      </Box>
      <SelectField label="运营商" value={[settings.llm_provider]} onChange={(v) => refetchForProvider('llm', v[0])} collection={llmOptions} placeholder="选择语言模型运营商" />
      {llmFields.map((key) => renderField('llm', key))}
      <InputField label="API 密钥" value={llmKey} onChange={setLlmKey} placeholder={settings.llm.llm_api_key?.configured ? '已配置；留空不修改' : '请输入 API 密钥'} />
      <Box px={4} py={3} borderRadius="16px" bg="rgba(218,145,179,.10)" border="1px solid rgba(249,205,222,.13)"><Text color="#FFF7FA" fontWeight="semibold">语音模型</Text></Box>
      <SelectField label="运营商" value={[settings.tts_provider]} onChange={(v) => refetchForProvider('tts', v[0])} collection={ttsOptions} placeholder="选择语音模型运营商" />
      {(ttsFields[settings.tts_provider] || []).map((key) => renderField('tts', key))}
      <InputField label="API 密钥" value={ttsKey} onChange={setTtsKey} placeholder={settings.tts.api_key?.configured ? '已配置；留空不修改' : '请输入 API 密钥'} />
    </Stack>
  );
}

export default Models;
