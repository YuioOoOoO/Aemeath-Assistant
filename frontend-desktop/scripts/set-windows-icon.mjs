import { readFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(scriptDirectory, '..');
const packageJson = JSON.parse(readFileSync(join(frontendRoot, 'package.json'), 'utf8'));
const executable = join(frontendRoot, 'release', packageJson.version, 'win-unpacked', 'AimisiDesktopAssistant.exe');
const editor = join(frontendRoot, 'build-tools', 'rcedit-x64.exe');
const icon = join(frontendRoot, 'resources', 'aimisi.ico');

const result = spawnSync(editor, [
  executable,
  '--set-icon', icon,
  '--set-file-version', packageJson.version,
  '--set-product-version', packageJson.version,
  '--set-version-string', 'ProductName', '爱弥斯桌面助手',
  '--set-version-string', 'FileDescription', '爱弥斯桌面助手',
  '--set-version-string', 'CompanyName', 'Aimisi',
], { stdio: 'inherit' });

if (result.status !== 0) {
  throw new Error(`Failed to apply Windows icon and metadata (exit ${result.status}).`);
}

console.log(`Applied Aimisi icon and metadata to ${executable}`);
