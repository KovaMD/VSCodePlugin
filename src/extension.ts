import * as vscode from 'vscode';
import { execFile, spawn } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const INSTALL_URL = 'https://github.com/KovaMD/Kova/releases';
const VERSION_CHECK_TIMEOUT_MS = 5000;

interface Launcher {
  command: string;
  presentArgs: (filePath: string) => string[];
}

async function resolveLauncher(): Promise<Launcher | undefined> {
  try {
    await execFileAsync('kova', ['--version'], { timeout: VERSION_CHECK_TIMEOUT_MS });
    return { command: 'kova', presentArgs: (filePath) => ['--present', filePath] };
  } catch {
    // Not on PATH, or not installed. Fall through to the Flatpak check below.
  }

  if (process.platform === 'linux') {
    try {
      await execFileAsync('flatpak', ['run', 'md.kova.app', '--version'], {
        timeout: VERSION_CHECK_TIMEOUT_MS,
      });
      return {
        command: 'flatpak',
        presentArgs: (filePath) => ['run', 'md.kova.app', '--present', filePath],
      };
    } catch {
      // Flatpak itself missing, or Kova not installed as a Flatpak either.
    }
  }

  return undefined;
}

async function promptToInstall(): Promise<void> {
  const action = await vscode.window.showErrorMessage(
    'Kova was not found on your PATH. Install it to use Present with Kova...',
    'Install Kova',
  );
  if (action === 'Install Kova') {
    await vscode.env.openExternal(vscode.Uri.parse(INSTALL_URL));
  }
}

async function presentWithKova(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('Open a Kova Markdown file to present it.');
    return;
  }

  const document = editor.document;
  if (document.languageId !== 'markdown') {
    vscode.window.showErrorMessage('Present with Kova only works on Markdown files.');
    return;
  }

  if (document.isUntitled) {
    vscode.window.showErrorMessage('Save this file before presenting it with Kova.');
    return;
  }

  if (document.isDirty) {
    const saved = await document.save();
    if (!saved) {
      vscode.window.showErrorMessage('Could not save the file before presenting.');
      return;
    }
  }

  const launcher = await resolveLauncher();
  if (!launcher) {
    await promptToInstall();
    return;
  }

  const filePath = document.uri.fsPath;
  const child = spawn(launcher.command, launcher.presentArgs(filePath), {
    detached: true,
    stdio: 'ignore',
  });
  child.once('error', (err) => {
    vscode.window.showErrorMessage(`Failed to launch Kova: ${err.message}`);
  });
  child.unref();
}

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(vscode.commands.registerCommand('kova.present', presentWithKova));
}

export function deactivate(): void {
  // Nothing to clean up: the launched Kova process is detached and outlives the extension host.
}
