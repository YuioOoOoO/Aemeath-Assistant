import { Box, Stack, Text } from '@chakra-ui/react';
import Live2D from './live2d';
import Agent from './agent';

interface CharacterProps {
  onSave?: (callback: () => void) => () => void;
  onCancel?: (callback: () => void) => () => void;
}

function SectionTitle({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <Box px={4} py={3} borderRadius="16px" bg="rgba(218, 145, 179, 0.10)" border="1px solid rgba(249, 205, 222, 0.13)">
      <Text color="#FFF7FA" fontWeight="semibold">{children}</Text>
    </Box>
  );
}

function Character({ onSave, onCancel }: CharacterProps): JSX.Element {
  return (
    <Stack gap={6} pb={4}>
      <SectionTitle>Live2D 交互</SectionTitle>
      <Box px={4}>
        <Live2D onSave={onSave} onCancel={onCancel} />
      </Box>
      <SectionTitle>助手行为</SectionTitle>
      <Box px={4}>
        <Agent onSave={onSave} onCancel={onCancel} />
      </Box>
    </Stack>
  );
}

export default Character;
