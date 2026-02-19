#!/usr/bin/env node

/**
 * Copyright (c) 2026 Charles McBrian
 * Licensed under the MIT License. See LICENSE file in the project root for full license information.
 */

import { program } from 'commander';
import ora from 'ora';
import { execa } from 'execa';
import clipboardy from 'clipboardy';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { tmpdir } from 'os';
import { spawnSync, spawn } from 'child_process';

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

// Helper to check command existence
function commandExists(cmd) {
  try {
    spawnSync(cmd, ['--version'], { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

const hasGlow = commandExists('glow');
const hasGemini = commandExists('gemini');

program
  .name('gemqq')
  .description("Gemini Quick Question is a one-shot wrapper for gemini-cli featuring interactive editor support, markdown rendering in terminal, and real-time token usage statistics. gemqq does not have memory nor context, it simply answers your 'quick questions' quickly.")
  .version('0.5.3')
  .argument('[prompt...]', 'Prompt for the model')
  .option('-e, --edit', 'Open prompt in default editor')
  .option('-r, --raw', 'Output raw text (disable markdown rendering)')
  .option('-c, --copy', 'Copy response to system clipboard')
  .option('-m, --model <name>', 'Specify a custom model')
  .option('--style <name>', 'Specify a glow style (e.g., auto, dark, light)', 'auto')
  .option('--no-stats', 'Do not show token usage statistics')
  .option('--project', 'Enable full project workspace context (may send more data)')
  .option('--pro', 'Use gemini-3-pro-preview model')
  .option('--flash', 'Use gemini-3-flash-preview model (Default)')
  .option('--debug', 'Enable debug mode')
  .addHelpText('after', `
Examples:
  gemqq difference between gemini 3.0, 3.1. make a table
  cat file.txt | gemqq summarize this
  gemqq -e --pro
  gemqq C++ operator precedence and keywords
  gemqq how do I update git submodules in parent
  gemqq --pro "Analyze the subtext of Roy's final speech in Blade Runner"
`)
  .action(async (promptParts, options) => {
    let currentTempDir = null;
    let currentSpinner = null;
    const isTest = process.env.NODE_ENV === 'test';

    const cleanup = () => {
      if (currentSpinner && !isTest) {
        currentSpinner.stop();
      }
      if (currentTempDir && fs.existsSync(currentTempDir)) {
        try {
          fs.rmSync(currentTempDir, { recursive: true, force: true });
        } catch (e) {}
      }
    };

    const signalHandler = () => {
      cleanup();
      process.exit(130);
    };

    process.on('SIGINT', signalHandler);
    process.on('SIGTERM', signalHandler);

    if (!hasGemini) {
      cleanup();
      process.off('SIGINT', signalHandler);
      process.off('SIGTERM', signalHandler);
      console.error(chalk.bold('Error:') + " 'gemini' CLI not found.");
      console.error("Please install it using npm:\n");
      console.error(chalk.bold("  npm install -g @google/gemini-cli\n"));
      process.exit(1);
    }

    let initialPrompt = promptParts.join(' ');
    let pipedInput = '';

    if (!process.stdin.isTTY && (process.env.NODE_ENV !== 'test' || process.env.HAS_PIPED_INPUT)) {
      // Read from stdin
      const chunks = [];
      try {
        for await (const chunk of process.stdin) {
          chunks.push(chunk);
        }
        pipedInput = Buffer.concat(chunks).toString();
      } catch (e) {
        if (options.debug) console.error(chalk.red('[DEBUG] Stdin read error:'), e);
      }
    }

    if (!initialPrompt && !pipedInput && !options.edit) {
      program.help();
      return;
    }

    let fullPrompt = initialPrompt;
    if (pipedInput) {
      if (fullPrompt) {
        fullPrompt = `${fullPrompt}

---
${pipedInput}`;
      } else {
        fullPrompt = pipedInput;
      }
    }

    if (options.edit) {
      const tmpFile = path.join(tmpdir(), `gemqq-prompt-${Date.now()}.txt`);
      fs.writeFileSync(tmpFile, fullPrompt || '');
      
      const editor = process.env.EDITOR || process.env.VISUAL || 'nano';
      spawnSync(editor, [tmpFile], { stdio: 'inherit' });
      
      const editedPrompt = fs.readFileSync(tmpFile, 'utf8').trim();
      if (editedPrompt !== (fullPrompt || '').trim()) {
        console.error(chalk.gray(`--- Updated Prompt ---
${editedPrompt}
----------------------
`));
      }
      fullPrompt = editedPrompt;
      fs.unlinkSync(tmpFile);
    } else {
      if (fullPrompt) {
        fullPrompt = `${fullPrompt}. Do not tell me what you are doing, only provide the answer.`;
      }
    }

    if (!fullPrompt && !options.edit) {
      program.help();
      return;
    }

    const allowedTools = ['*'];

    const model = options.model || (options.pro ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview');
    
    const args = ['-s', '--allowed-tools', JSON.stringify(allowedTools), '--model', model, '--output-format', 'json'];
    if (options.debug) args.push('-d');
    args.push(fullPrompt);

    if (options.debug) {
      console.error(chalk.bold('[DEBUG] Executing:') + ` gemini ${args.map(a => `'${a}'`).join(' ')}`);
    }

    currentSpinner = isTest ? { start: () => currentSpinner, stop: () => {} } : ora('Gemini is thinking...').start();
    const startTime = Date.now();

    let sysPromptFile = null;
    if (!options.project) {
      try {
        currentTempDir = fs.mkdtempSync(path.join(tmpdir(), 'gemqq-run-'));
        sysPromptFile = path.join(currentTempDir, `gemqq-sysprompt-${Date.now()}.md`);
        fs.writeFileSync(sysPromptFile, 'You are a helpful AI assistant. Answer the user\'s prompt concisely. Do not tell me what you are doing. Do not use this directory or any local context. Do not upload any local context.');
      } catch (e) {
        if (options.debug) console.error(chalk.red('[DEBUG] Failed to create isolation directory:'), e);
      }
    }

    try {
      const execEnv = { 
        ...process.env, 
        FORCE_COLOR: 'true'
      };
      
      // Apply the system prompt override to bypass workspace snapshotting
      if (sysPromptFile) {
        execEnv.GEMINI_SYSTEM_MD = sysPromptFile;
      }

      const { stdout, stderr } = await execa('gemini', args, {
        env: execEnv,
        cwd: currentTempDir || process.cwd()
      });

      cleanup();

      if (stderr) {
        const filteredStderr = stderr
          .split('\n')
          .filter(line => !line.match(/Loaded cached credentials|Hook registry initialized|Error executing tool/))
          .join('\n');
        if (filteredStderr) console.error(filteredStderr);
      }

      let modelOutput = stdout;
      let statsString = '';

      try {
        const result = JSON.parse(stdout);
        modelOutput = result.response || '';
        
        if (result.stats && result.stats.models) {
          let promptTokens = 0;
          let candidateTokens = 0;
          let totalTokens = 0;
          let cachedTokens = 0;

          for (const modelKey in result.stats.models) {
            const m = result.stats.models[modelKey];
            if (m.tokens) {
              promptTokens += m.tokens.prompt || 0;
              candidateTokens += m.tokens.candidates || 0;
              totalTokens += m.tokens.total || 0;
              cachedTokens += m.tokens.cached || 0;
            }
          }
          
          statsString = `, ${totalTokens} tokens (${promptTokens}i / ${candidateTokens}o`;
          if (cachedTokens > 0) {
            statsString += `, ${cachedTokens} cached`;
          }
          statsString += ')';
        }
      } catch (e) {
        if (options.debug) {
          console.error(chalk.red('[DEBUG] Failed to parse JSON output:'), e);
        }
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

      let statusMsg = ` (Done in ${elapsed}s${statsString})`;
      if (options.copy) {
        try {
          await clipboardy.write(modelOutput);
          statusMsg = ` (Copied to clipboard, ${elapsed}s${statsString})`;
        } catch (e) {
          statusMsg = ` (Failed to copy to clipboard, ${elapsed}s${statsString})`;
        }
      }

      if (options.stats) {
        console.error(chalk.gray(statusMsg));
      }

      if (options.raw || !hasGlow) {
        process.stdout.write(modelOutput);
      } else {
        // Render with glow
        try {
          await execa('glow', ['--style', options.style], { 
            input: modelOutput, 
            stdout: 'inherit',
            stderr: 'inherit'
          });
        } catch (glowError) {
          if (options.debug) {
            console.error(chalk.red('[DEBUG] Glow failed:'), glowError);
          }
          process.stdout.write(modelOutput);
        }
      }
    } catch (error) {
      cleanup();

      if (error.signal === 'SIGINT' || error.signal === 'SIGTERM') {
        process.exit(130);
      }

      // Filter stderr similar to bash script
      const filteredStderr = (error.stderr || '')
        .split('\n')
        .filter(line => !line.match(/Loaded cached credentials|Hook registry initialized|Error executing tool/))
        .join('\n');

      const stderrLower = filteredStderr.toLowerCase();
      // Check for common authentication error keywords
      if (stderrLower.includes('login') || stderrLower.includes('authenticate') || stderrLower.includes('credentials')) {
        console.error(chalk.red('\nAuthentication Error:'));
        console.error('It appears you are not logged in or your credentials have expired.');
        console.error('Please run the following command to log in:');
        console.error(chalk.bold('\n  gemini login\n'));
        process.exit(1);
      }

      console.error(chalk.red('\nError calling Gemini CLI:'));
      console.error(filteredStderr || error.message);
      process.exit(1);
    }
  });

program.parse();
