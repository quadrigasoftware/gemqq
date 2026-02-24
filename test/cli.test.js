import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execa } from 'execa';
import fs from 'fs';
import path from 'path';
import { tmpdir } from 'os';

const CLI_PATH = path.resolve('./index.js');
const pkg = JSON.parse(fs.readFileSync(path.resolve('./package.json'), 'utf8'));
let tempBinDir;
let oldPath;

describe('gemqq CLI Integration Tests (Mocked)', () => {
  beforeAll(() => {
    // Create a mock 'gemini' executable
    tempBinDir = fs.mkdtempSync(path.join(tmpdir(), 'gemqq-test-'));
    const mockGeminiPath = path.join(tempBinDir, 'gemini');
    
    // Ensure the mock uses a shebang compatible with the environment
    const mockContent = `#!/usr/bin/env node
const args = process.argv.slice(2);
if (args.includes('--output-format') && args.includes('json')) {
  const allowedToolsIndex = args.indexOf('--allowed-tools');
  const allowedTools = allowedToolsIndex !== -1 ? args[allowedToolsIndex + 1] : '[]';
  process.stdout.write(JSON.stringify({
    response: "Mocked response. CWD: " + process.cwd() + ". Tools: " + allowedTools,
    stats: {
      models: {
        "mock-model": {
          tokens: { prompt: 10, candidates: 5, total: 15, cached: 0 }
        }
      }
    }
  }));
} else if (args.includes('--version')) {
  process.stdout.write('0.0.0-mock\\n');
} else {
  process.stdout.write("Mocked non-json response\\n");
}
`;
    
    fs.writeFileSync(mockGeminiPath, mockContent);
    fs.chmodSync(mockGeminiPath, '755');
    
    oldPath = process.env.PATH;
    process.env.PATH = `${tempBinDir}${path.delimiter}${oldPath}`;
  });

  afterAll(() => {
    process.env.PATH = oldPath;
    fs.rmSync(tempBinDir, { recursive: true, force: true });
  });

  const runCLI = (args) => execa('node', [CLI_PATH, ...args], {
    env: { ...process.env, NODE_ENV: 'test' }
  });

  it('should display token statistics by default', async () => {
    const { stderr, stdout } = await runCLI(['hello', '--raw']);
    expect(stderr).toMatch(/\(Done in \d+\.\ds, 15 tokens \(10i \/ 5o\)\)/);
    expect(stdout).toContain('Tools: ["*"]');
  }, 30000);

  it('should suppress statistics with --no-stats', async () => {
    const { stderr, stdout } = await runCLI(['hello', '--raw', '--no-stats']);
    expect(stderr).not.toMatch(/\d+ tokens/);
    expect(stdout).toContain('Tools: ["*"]');
  }, 30000);

  it('should provide raw output with --raw', async () => {
    const { stdout } = await runCLI(['test', '--raw', '--no-stats']);
    expect(stdout.trim()).toContain('Tools: ["*"]');
  }, 30000);

  it('should provide json output with --json', async () => {
    const { stdout, stderr } = await runCLI(['test', '--json']);
    const result = JSON.parse(stdout);
    expect(result).toHaveProperty('response');
    expect(result.response).toContain('Mocked response');
    expect(stderr).toBe('');
  }, 30000);

  it('should show help message', async () => {
    const { stdout } = await runCLI(['--help']);
    expect(stdout).toContain('Usage: gemqq');
    expect(stdout).toContain('--style');
    expect(stdout).toContain('--no-stats');
    expect(stdout).toContain('--browser');
  }, 30000);

  it('should suppress terminal output when --browser is used', async () => {
    // Note: We can't easily test the browser opening itself, but we can check that stdout is empty
    const { stdout } = await runCLI(['test', '--browser', '--no-stats']);
    expect(stdout.trim()).toBe('');
  }, 30000);

  it('should report version correctly', async () => {
    const { stdout } = await runCLI(['--version']);
    expect(stdout.trim()).toBe(pkg.version);
  }, 30000);

  it('should run in a temporary directory for isolation by default', async () => {
    const { stdout } = await runCLI(['test', '--raw', '--no-stats']);
    expect(stdout).toContain('Mocked response. CWD:');
    expect(stdout).toContain('gemqq-run-');
    expect(stdout).not.toContain(process.cwd());
  }, 30000);

  it('should run in the current directory when --project is used', async () => {
    const { stdout } = await runCLI(['test', '--raw', '--no-stats', '--project']);
    expect(stdout).toContain('Mocked response. CWD:');
    // In some environments, the path might be slightly different due to symlinks (e.g. /var vs /private/var on macOS)
    // but it should definitely contain a significant part of the current path and not gemqq-run-
    expect(stdout).not.toContain('gemqq-run-');
  }, 30000);

  it('should report error when gemini is not found in PATH', async () => {
    const emptyDir = fs.mkdtempSync(path.join(tmpdir(), 'gemqq-empty-'));
    try {
      const { exitCode, stderr } = await execa(process.execPath, [CLI_PATH, 'hello'], {
        env: { ...process.env, NODE_ENV: 'test', PATH: emptyDir },
        reject: false
      });
      expect(exitCode).toBe(1);
      expect(stderr).toContain("'gemini' CLI not found");
    } finally {
      fs.rmSync(emptyDir, { recursive: true, force: true });
    }
  }, 30000);
});
