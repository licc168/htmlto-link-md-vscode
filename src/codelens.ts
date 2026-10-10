import * as vscode from 'vscode';
import { onLocaleChanged, t } from './i18n';

const MARKDOWN_SELECTOR: vscode.DocumentSelector = { language: 'markdown' };

function plainShareLabel(): string {
  return t('codelens.share').replace(/\$\([^)]+\)\s*/, '');
}

function currentMarkdownEditor(): vscode.TextEditor | undefined {
  const active = vscode.window.activeTextEditor;
  if (active?.document.languageId === 'markdown') {
    return active;
  }
  return vscode.window.visibleTextEditors.find((editor) => editor.document.languageId === 'markdown');
}

function shareCodeLens(document: vscode.TextDocument): vscode.CodeLens {
  const line = document.lineAt(0);
  return new vscode.CodeLens(line.range, {
    title: t('codelens.share'),
    tooltip: t('codelens.shareTooltip'),
    command: 'htmlToLinkMd.share',
    arguments: [document.uri],
  });
}

function shareInlay(document: vscode.TextDocument): vscode.InlayHint {
  const part = new vscode.InlayHintLabelPart(plainShareLabel());
  part.tooltip = t('codelens.shareTooltip');
  part.command = {
    title: plainShareLabel(),
    command: 'htmlToLinkMd.share',
    arguments: [document.uri],
  };
  const hint = new vscode.InlayHint(new vscode.Position(0, 0), [part]);
  hint.paddingRight = true;
  hint.tooltip = t('codelens.shareTooltip');
  return hint;
}

/** Share entry for Markdown source: status bar, first-line inlay, and CodeLens. */
export function registerShareCodeLens(context: vscode.ExtensionContext): void {
  const emitter = new vscode.EventEmitter<void>();
  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);

  const refreshStatus = (): void => {
    const editor = currentMarkdownEditor();
    status.text = t('codelens.share');
    status.tooltip = t('codelens.shareTooltip');
    if (!editor) {
      status.hide();
      return;
    }
    status.command = {
      title: plainShareLabel(),
      command: 'htmlToLinkMd.share',
      arguments: [editor.document.uri],
    };
    status.show();
  };

  const codeLens: vscode.CodeLensProvider = {
    onDidChangeCodeLenses: emitter.event,
    provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
      if (document.languageId !== 'markdown' || document.lineCount < 1) {
        return [];
      }
      return [shareCodeLens(document)];
    },
  };

  const inlays: vscode.InlayHintsProvider = {
    onDidChangeInlayHints: emitter.event,
    provideInlayHints(document: vscode.TextDocument, range: vscode.Range): vscode.InlayHint[] {
      if (document.languageId !== 'markdown' || document.lineCount < 1 || range.start.line > 0) {
        return [];
      }
      return [shareInlay(document)];
    },
  };

  const refresh = (): void => {
    refreshStatus();
    emitter.fire();
  };

  context.subscriptions.push(
    emitter,
    status,
    onLocaleChanged(refresh),
    vscode.window.onDidChangeActiveTextEditor(refresh),
    vscode.window.onDidChangeVisibleTextEditors(refresh),
    vscode.languages.registerCodeLensProvider(MARKDOWN_SELECTOR, codeLens),
    vscode.languages.registerInlayHintsProvider(MARKDOWN_SELECTOR, inlays)
  );
  refresh();
}
