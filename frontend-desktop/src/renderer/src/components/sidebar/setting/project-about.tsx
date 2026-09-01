import { Box, Heading, HStack, Icon, Stack, Text } from '@chakra-ui/react';
import { FaBook, FaGithub } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { settingStyles } from './setting-styles';

const card = {
  px: 4,
  py: 3,
  borderRadius: '16px',
  bg: 'rgba(255, 255, 255, 0.035)',
  border: '1px solid rgba(249, 205, 222, 0.12)',
};

function ProjectAbout(): JSX.Element {
  const open = (url: string): void => window.open(url, '_blank');
  return (
    <Stack {...settingStyles.common.container} gap={4} pb={4} color="rgba(255, 236, 244, 0.78)">
      <Heading size="md" mb={1} color="#FFF7FA">关于</Heading>
      <Box {...card} bg="rgba(218, 145, 179, 0.12)" borderColor="rgba(249, 205, 222, 0.18)">
        <Text fontWeight="bold" color="#FFF7FA">爱弥斯桌面助手</Text>
        <Text mt={1} fontSize="sm" color="rgba(255, 226, 238, 0.72)">具有语音对话、Live2D 互动与桌面辅助能力的智能桌面助手。</Text>
        <Text mt={1} fontSize="xs" color="rgba(255, 226, 238, 0.55)">版本 1.0.0</Text>
        <HStack mt={3}><Button size="sm" onClick={() => open('https://github.com/RosettaYui/Aemeath-Assistant')}><Icon as={FaGithub} mr={2} />GitHub</Button></HStack>
      </Box>
      <Box {...card}>
        <Text fontWeight="bold" color="#FFF7FA">Open-LLM-VTuber</Text>
        <Text mt={1} fontSize="sm" color="rgba(255, 226, 238, 0.72)">本项目基于 Open-LLM-VTuber 进行二次开发。</Text>
        <HStack mt={3} gap={2}>
          <Button size="sm" onClick={() => open('https://github.com/Open-LLM-VTuber/Open-LLM-VTuber')}><Icon as={FaGithub} mr={2} />GitHub</Button>
          <Button size="sm" onClick={() => open('https://docs.llmvtuber.com')}><Icon as={FaBook} mr={2} />文档</Button>
        </HStack>
      </Box>
      <Box {...card}>
        <Text fontWeight="bold" color="#FFF7FA">木果阿木果（木果制作）</Text>
        <Text mt={1} fontSize="sm" color="rgba(255, 226, 238, 0.72)">爱弥斯 Live2D 模型素材来源于 B 站创作者木果阿木果，角色设计版权归属于库洛。</Text>
      </Box>
    </Stack>
  );
}

export default ProjectAbout;
