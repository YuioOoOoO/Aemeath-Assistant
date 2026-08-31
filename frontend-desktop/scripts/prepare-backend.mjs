import {
  cpSync, existsSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync,
} from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(scriptDirectory, '..');
const projectRoot = resolve(frontendRoot, '..');
const runtimeRoot = resolve(frontendRoot, 'backend-runtime');

if (!runtimeRoot.startsWith(`${frontendRoot}\\`)) {
  throw new Error(`Unsafe runtime output path: ${runtimeRoot}`);
}

const venvConfig = readFileSync(join(projectRoot, '.venv', 'pyvenv.cfg'), 'utf8');
const configuredPythonHome = venvConfig.match(/^home\s*=\s*(.+)$/m)?.[1]?.trim();
const pythonHome = configuredPythonHome ? realpathSync(configuredPythonHome) : undefined;
if (!pythonHome || !existsSync(join(pythonHome, 'python.exe'))) {
  throw new Error('Unable to locate the Python runtime from .venv/pyvenv.cfg');
}

rmSync(runtimeRoot, { recursive: true, force: true });
mkdirSync(runtimeRoot, { recursive: true });

const ignoreNoise = (source) => {
  const normalized = source.replaceAll('\\', '/').toLowerCase();
  return !normalized.includes('/__pycache__/')
    && !normalized.endsWith('/__pycache__')
    && !normalized.includes('/.pytest_cache/')
    && !normalized.endsWith('.pyc');
};

cpSync(pythonHome, join(runtimeRoot, 'python'), {
  recursive: true,
  filter: (source) => ignoreNoise(source)
    && !source.replaceAll('\\', '/').includes('/Lib/site-packages'),
});
cpSync(join(projectRoot, '.venv', 'Lib', 'site-packages'), join(runtimeRoot, 'site-packages'), {
  recursive: true,
  filter: ignoreNoise,
});
writeFileSync(
  join(runtimeRoot, 'site-packages', 'sitecustomize.py'),
  [
    'import os',
    'import site',
    '_runtime_site_packages = os.path.dirname(__file__)',
    'site.addsitedir(_runtime_site_packages)',
    '',
  ].join('\n'),
  'utf8',
);

const appRoot = join(runtimeRoot, 'app');
mkdirSync(appRoot, { recursive: true });

for (const filename of [
  'run_server.py', 'conf.yaml', 'model_dict.json', 'mcp_servers.json',
  'pyproject.toml', 'LICENSE', 'LICENSE-Live2D.md',
]) {
  cpSync(join(projectRoot, filename), join(appRoot, filename));
}

for (const directory of [
  'src', 'upgrade_codes', 'characters', 'config_templates', 'live2d-models',
  'backgrounds', 'avatars', 'assets', 'prompts', 'web_tool', 'frontend',
]) {
  cpSync(join(projectRoot, directory), join(appRoot, directory), {
    recursive: true,
    filter: ignoreNoise,
  });
}

const asrSource = join(projectRoot, 'models', 'sherpa-onnx-sense-voice-zh-en-ja-ko-yue-2024-07-17');
const asrTarget = join(appRoot, 'models', 'sherpa-onnx-sense-voice-zh-en-ja-ko-yue-2024-07-17');
mkdirSync(asrTarget, { recursive: true });
for (const filename of ['model.int8.onnx', 'tokens.txt', 'LICENSE']) {
  cpSync(join(asrSource, filename), join(asrTarget, filename));
}

for (const directory of ['cache', 'logs', 'chat_history']) {
  mkdirSync(join(appRoot, directory), { recursive: true });
}

console.log(`Prepared self-contained backend runtime at ${runtimeRoot}`);
