import { app } from 'electron';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { createWriteStream, mkdirSync } from 'fs';
import { request } from 'http';
import { join } from 'path';

const BACKEND_HOST = '127.0.0.1';
const BACKEND_PORT = 12393;

export class BackendManager {
  private process: ChildProcessWithoutNullStreams | null = null;

  private isReachable(timeout = 700): Promise<boolean> {
    return new Promise((resolve) => {
      const req = request({
        host: BACKEND_HOST,
        port: BACKEND_PORT,
        path: '/',
        method: 'GET',
        timeout,
      }, (response) => {
        response.resume();
        resolve(true);
      });
      req.once('timeout', () => {
        req.destroy();
        resolve(false);
      });
      req.once('error', () => resolve(false));
      req.end();
    });
  }

  private resolveRuntime(): { python: string; cwd: string; pythonPath?: string } {
    if (app.isPackaged) {
      const backendRoot = join(process.resourcesPath, 'backend');
      return {
        python: join(backendRoot, 'python', 'python.exe'),
        cwd: join(backendRoot, 'app'),
        pythonPath: join(backendRoot, 'site-packages'),
      };
    }

    const projectRoot = join(__dirname, '../../..');
    return {
      python: join(projectRoot, '.venv', 'Scripts', 'python.exe'),
      cwd: projectRoot,
    };
  }

  async ensureStarted(): Promise<void> {
    if (await this.isReachable()) return;

    const runtime = this.resolveRuntime();
    const logDirectory = join(app.getPath('userData'), 'logs');
    mkdirSync(logDirectory, { recursive: true });
    const output = createWriteStream(join(logDirectory, 'backend.log'), { flags: 'a' });

    this.process = spawn(runtime.python, ['run_server.py'], {
      cwd: runtime.cwd,
      windowsHide: true,
      env: {
        ...process.env,
        PYTHONUTF8: '1',
        PYTHONIOENCODING: 'utf-8',
        PYTHONNOUSERSITE: '1',
        ...(runtime.pythonPath ? { PYTHONPATH: runtime.pythonPath } : {}),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    this.process.stdout.pipe(output, { end: false });
    this.process.stderr.pipe(output, { end: false });
    this.process.once('exit', () => {
      this.process = null;
      output.end();
    });

    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline) {
      if (!this.process) throw new Error('Backend exited before becoming ready.');
      if (await this.isReachable(1000)) return;
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
    throw new Error('Backend did not become ready within 60 seconds.');
  }

  stop(): void {
    if (!this.process || this.process.killed) return;
    this.process.kill();
    this.process = null;
  }
}
