import * as vscode from 'vscode';
import * as path from 'path';
import { TEMPLATES } from '../constants';
import { publishMarkdown, getShareRecords } from '../publish';
import { t } from '../i18n';
import { ApiError } from '../api';
import { getStyles } from './styles';
import { getWebviewScript } from './webviewScript';

interface PanelInitData {
  fileName: string;
  wordCount: number;
  hasToken: boolean;
  existingUrl: string | null;
  defaultTemplate: string;
  templates: typeof TEMPLATES;
  labels: Record<string, string>;
}

export class SharePanel {
  public static current: SharePanel | undefined;
  private static readonly viewType = 'htmlToLinkMd.sharePanel';

  private readonly panel: vscode.WebviewPanel;
  private readonly context: vscode.ExtensionContext;
  private filePath: string;
  private content: string;
  private disposables: vscode.Disposable[] = [];

  public static show(context: vscode.ExtensionContext, filePath: string, content: string): void {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (SharePanel.current) {
      SharePanel.current.panel.reveal(column);
      SharePanel.current.updateFile(filePath, content);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      SharePanel.viewType,
      t('panel.title'),
      column || vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [context.extensionUri],
      }
    );

    SharePanel.current = new SharePanel(panel, context, filePath, content);
  }

  private constructor(
    panel: vscode.WebviewPanel,
    context: vscode.ExtensionContext,
    filePath: string,
    content: string
  ) {
    this.panel = panel;
    this.context = context;
    this.filePath = filePath;
    this.content = content;

    this.panel.webview.html = this.getHtml();

    this.panel.webview.onDidReceiveMessage(
      msg => this.handleMessage(msg),
      undefined,
      this.disposables
    );

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
  }

  private updateFile(filePath: string, content: string): void {
    this.filePath = filePath;
    this.content = content;
    this.postInit();
  }

  private dispose(): void {
    SharePanel.current = undefined;
    this.panel.dispose();
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
  }

  private countWords(content: string): number {
    const plain = content.replace(/```[\s\S]*?```/g, '').replace(/[#>*_`~\[\]()!]/g, '');
    const cjk = (plain.match(/[\u4e00-\u9fa5]/g) || []).length;
    const latin = plain.replace(/[\u4e00-\u9fa5]/g, ' ').trim().split(/\s+/).filter(Boolean).length;
    return cjk + latin;
  }

  private async buildInitData(): Promise<PanelInitData> {
    const records = getShareRecords(this.context);
    const record = records[this.filePath];
    const config = vscode.workspace.getConfiguration('htmlToLinkMd');
    const hasToken = !!(await this.context.secrets.get('htmlToLinkMd.token'));

    return {
      fileName: path.basename(this.filePath),
      wordCount: this.countWords(this.content),
      hasToken,
      existingUrl: record ? record.url : null,
      defaultTemplate: config.get<string>('defaultTemplate', 'plain'),
      templates: TEMPLATES,
      labels: {
        title: t('panel.title'),
        templateLabel: t('panel.template'),
        templateHint: t('panel.templateHint'),
        themeLabel: t('panel.themeLabel'),
        publish: t('panel.publish'),
        updateShare: t('panel.updateShare'),
        publishing: t('panel.publishing'),
        resultTitle: t('share.success'),
        resultUpdated: t('panel.result.updated'),
        resultUrl: t('panel.result.url'),
        copy: t('panel.result.copy'),
        copied: t('panel.result.copied'),
        open: t('panel.result.open'),
        temporary: t('panel.result.temporary'),
        permanent: t('panel.result.permanent'),
        back: t('panel.back'),
        retry: t('panel.retry'),
        errorTitle: t('panel.error.title'),
        alreadyShared: t('panel.alreadyShared'),
        words: t('panel.words'),
        modeGuest: t('panel.mode.guest'),
        modeToken: t('panel.mode.token'),
      },
    };
  }

  private async postInit(): Promise<void> {
    this.panel.webview.postMessage({ command: 'init', data: await this.buildInitData() });
  }

  private async handleMessage(msg: { command: string; [key: string]: unknown }): Promise<void> {
    switch (msg.command) {
      case 'ready': {
        await this.postInit();
        break;
      }

      case 'publish': {
        const templateId = msg.templateId as string;
        const theme = msg.theme as string | undefined;
        this.panel.webview.postMessage({ command: 'publishing' });
        try {
          const result = await publishMarkdown(
            this.context,
            this.filePath,
            this.content,
            templateId,
            theme
          );
          const config = vscode.workspace.getConfiguration('htmlToLinkMd');
          const autoCopy = config.get<boolean>('autoCopyUrl', true);
          if (autoCopy) {
            await vscode.env.clipboard.writeText(result.response.url);
          }
          if (config.get<boolean>('openInBrowser', false)) {
            await vscode.env.openExternal(vscode.Uri.parse(result.response.url));
          }
          this.panel.webview.postMessage({
            command: 'result',
            data: {
              url: result.response.url,
              temporary: !!result.response.temporary,
              isUpdate: result.isUpdate,
              autoCopied: autoCopy,
            },
          });
        } catch (err) {
          const message = err instanceof ApiError && err.isNetwork
            ? t('panel.error.network')
            : (err instanceof Error ? err.message : String(err));
          this.panel.webview.postMessage({ command: 'error', data: { message } });
        }
        break;
      }

      case 'copy': {
        await vscode.env.clipboard.writeText(msg.url as string);
        this.panel.webview.postMessage({ command: 'copied' });
        break;
      }

      case 'open': {
        await vscode.env.openExternal(vscode.Uri.parse(msg.url as string));
        break;
      }
    }
  }

  private getHtml(): string {
    const nonce = getNonce();
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
<title>${t('panel.title')}</title>
<style>${getStyles()}</style>
</head>
<body>
  <div class="glow glow-a"></div>
  <div class="glow glow-b"></div>
  <main class="wrap">
    <header class="header">
      <div class="file-chip"><span class="file-ext">MD</span></div>
      <div class="file-meta">
        <h1 class="file-name" id="file-name">—</h1>
        <div class="file-sub">
          <span id="word-count">—</span>
          <span class="dot-sep">·</span>
          <span class="mode-badge" id="mode-badge">—</span>
          <span class="shared-badge hidden" id="shared-badge"></span>
        </div>
      </div>
    </header>

    <section class="view" id="view-select">
      <div class="section-head">
        <span class="section-index">01</span>
        <div>
          <h2 class="section-title" id="label-template">Template</h2>
          <p class="section-hint" id="label-template-hint"></p>
        </div>
      </div>
      <div class="tpl-grid" id="tpl-grid"></div>

      <div class="theme-block hidden" id="theme-block">
        <div class="section-head compact">
          <span class="section-index">02</span>
          <h2 class="section-title" id="label-theme">Theme</h2>
        </div>
        <div class="theme-row" id="theme-row"></div>
      </div>

      <div class="action-bar">
        <button class="btn-primary" id="publish-btn" disabled>
          <span class="btn-label" id="publish-label">Share</span>
          <span class="btn-arrow">→</span>
        </button>
      </div>
    </section>

    <section class="view hidden" id="view-publishing">
      <div class="center-stage">
        <div class="loader">
          <span class="loader-ring"></span>
          <span class="loader-core"></span>
        </div>
        <p class="stage-text" id="label-publishing">Sharing…</p>
        <p class="stage-sub" id="publishing-file"></p>
      </div>
    </section>

    <section class="view hidden" id="view-result">
      <div class="center-stage">
        <div class="success-mark">
          <svg viewBox="0 0 52 52" class="check-svg">
            <circle class="check-circle" cx="26" cy="26" r="24" fill="none"/>
            <path class="check-path" fill="none" d="M14 27l8 8 16-16"/>
          </svg>
        </div>
        <h2 class="stage-title" id="result-title">Shared!</h2>
        <p class="stage-sub" id="result-note"></p>
        <div class="link-card">
          <span class="link-label" id="label-link">Link</span>
          <a class="link-url" id="result-url" href="#" title="">—</a>
        </div>
        <div class="result-actions">
          <button class="btn-primary" id="copy-btn"><span id="copy-label">Copy</span></button>
          <button class="btn-ghost" id="open-btn">Open</button>
        </div>
        <button class="btn-text" id="back-btn">← Back</button>
      </div>
    </section>

    <section class="view hidden" id="view-error">
      <div class="center-stage">
        <div class="error-mark">!</div>
        <h2 class="stage-title" id="error-title">Failed</h2>
        <p class="stage-sub error-msg" id="error-msg"></p>
        <div class="result-actions">
          <button class="btn-primary" id="retry-btn">Retry</button>
        </div>
        <button class="btn-text" id="error-back-btn">← Back</button>
      </div>
    </section>
  </main>
<script nonce="${nonce}">${getWebviewScript()}</script>
</body>
</html>`;
  }
}

function getNonce(): string {
  let text = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
