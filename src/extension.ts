import * as vscode from 'vscode';
import { execFile, spawn } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execFileAsync = promisify(execFile);

const INSTALL_URL = 'https://github.com/KovaMD/Kova/releases';
const VERSION_CHECK_TIMEOUT_MS = 5000;

// Right-click Insert menu commands, each reusing the body already defined for
// its type-ahead snippet in kova.code-snippets — one source of truth for the
// actual inserted text, shared by both entry points instead of duplicated here.
const INSERT_COMMANDS: Record<string, string> = {
  'kova.insert.slideSeparator': 'Kova: Slide separator',
  'kova.insert.speakerNotes': 'Kova: Speaker notes',
  'kova.insert.columnBreak': 'Kova: Column break',
  'kova.insert.frontmatter': 'Kova: Frontmatter',
  'kova.insert.layout': 'Kova: Layout',
  'kova.insert.hiddenSlide': 'Kova: Hidden slide',
  'kova.insert.textColor': 'Kova: Text color',
  'kova.insert.marpClass': 'Kova: Marp class',
  'kova.insert.stepMarker': 'Kova: Step marker',
  'kova.insert.numberedStepMarker': 'Kova: Numbered step marker',
  'kova.insert.youtube': 'Kova: YouTube embed',
  'kova.insert.video': 'Kova: Video embed',
  'kova.insert.poll': 'Kova: Poll',
  'kova.insert.progressBar': 'Kova: Progress bar',
  'kova.insert.reference': 'Kova: Reference',
  'kova.insert.tableOfContents': 'Kova: Table of contents',
  'kova.insert.caption': 'Kova: Caption',
  'kova.insert.constant': 'Kova: Constant',
  'kova.insert.sheet': 'Kova: Sheet',
  'kova.insert.backgroundImage': 'Kova: Background image',
  'kova.insert.noteCallout': 'Kova: Note callout',
  'kova.insert.tipCallout': 'Kova: Tip callout',
  'kova.insert.warningCallout': 'Kova: Warning callout',
  'kova.insert.dangerCallout': 'Kova: Danger callout',
  'kova.insert.infoCallout': 'Kova: Info callout',
};

interface SnippetDef {
  body: string[];
}

function loadSnippets(context: vscode.ExtensionContext): Record<string, SnippetDef> {
  const file = path.join(context.extensionPath, 'snippets', 'kova.code-snippets');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

async function insertKovaSnippet(context: vscode.ExtensionContext, snippetKey: string): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('Open a Kova Markdown file to insert into.');
    return;
  }
  const snippet = loadSnippets(context)[snippetKey];
  if (!snippet) {
    vscode.window.showErrorMessage(`Unknown Kova snippet: ${snippetKey}`);
    return;
  }
  await editor.insertSnippet(new vscode.SnippetString(snippet.body.join('\n')));
}

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
  for (const [commandId, snippetKey] of Object.entries(INSERT_COMMANDS)) {
    context.subscriptions.push(
      vscode.commands.registerCommand(commandId, () => insertKovaSnippet(context, snippetKey)),
    );
  }
}

export function deactivate(): void {
  // Nothing to clean up: the launched Kova process is detached and outlives the extension host.
}
