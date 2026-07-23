import * as vscode from 'vscode';
import * as path from 'path';
import { TEMPLATES } from '../constants';
import { t, getLocale, setLocale, isLocale, templateName, themeName, LOCALE_PREF_KEY, type Locale } from '../i18n';
import { getShareRecords, publishMarkdown, readMarkdownContentForPath } from '../publish';
import { hasToken, promptSetToken, clearToken, TOKEN_SETTINGS_URL } from '../token';
import { getWebviewStyles } from './styles';
import { getWebviewScript } from './webviewScript';

export class SharePanel {
  public static currentPanel: SharePanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];
  private filePath = '';
  private content = '';
  private fileName = '';
  private wordCount = 0;
  private context!: vscode.ExtensionContext;
  private hasTokenFlag = false;
  private showWelcome = false;

  private constructor(panel: vscode.WebviewPanel) {
    this.panel = panel;
    this.panel.webview.html = this.getHtml();
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.webview.onDidReceiveMessage(
      (msg) => this.handleMessage(msg),
      null,
      this.disposables
    );
  }

  public static show(
    context: vscode.ExtensionContext,
    filePath: string,
    content: string
  ): void {
    if (SharePanel.currentPanel) {
      SharePanel.currentPanel.panel.reveal(vscode.ViewColumn.Beside);
    } else {
      const panel = vscode.window.createWebviewPanel(
        'htmlToLinkMdShare',
        t('panel.title'),
        vscode.ViewColumn.Beside,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
        }
      );
      SharePanel.currentPanel = new SharePanel(panel);
    }

    void SharePanel.currentPanel.init(context, filePath, content);
  }

  private async init(
    context: vscode.ExtensionContext,
    filePath: string,
    content: string
  ): Promise<void> {
    this.context = context;
    this.filePath = filePath;
    this.content = content;
    this.fileName = path.basename(filePath) || 'untitled.md';
    // Re-read buffer so unsaved editor content is never missed
    const latest = await readMarkdownContentForPath(filePath);
    if (latest !== undefined) {
      this.content = latest;
    }
    this.wordCount = this.content.replace(/\s+/g, '').length;
    this.hasTokenFlag = await hasToken(context);
    this.showWelcome = !context.globalState.get<boolean>(
      'htmlToLinkMd.hasSeenPanelWelcome',
      false
    );
    this.sendInit();
  }

  private sendInit(): void {
    // id 始终用英文（API 需要）；name 按 VS Code 语言本地化
    const templates = TEMPLATES.map((tpl) => ({
      id: tpl.id,
      name: templateName(tpl.id, tpl.name),
    }));

    const themesMap: Record<string, { id: string; name: string }[]> = {};
    for (const tpl of TEMPLATES) {
      themesMap[tpl.id] = (tpl.themes || []).map((id) => ({
        id,
        name: themeName(id),
      }));
    }

    let existingShare: { url: string; templateId?: string } | undefined;
    const records = getShareRecords(this.context);
    const record = records[this.filePath];
    if (record) {
      existingShare = { url: record.url };
    }

    this.panel.webview.postMessage({
      type: 'init',
      templates,
      themesMap,
      fileName: this.fileName,
      wordCount: this.wordCount,
      existingShare,
      hasToken: this.hasTokenFlag,
      showWelcome: this.showWelcome,
      locale: getLocale(),
      i18n: {
        title: t('panel.title'),
        template: t('panel.template'),
        theme: t('panel.theme'),
        publish: t('panel.publish'),
        publishing: t('panel.publishing'),
        resultUrl: t('panel.result.url'),
        resultCopy: t('panel.result.copy'),
        resultOpen: t('panel.result.open'),
        resultTemporary: t('panel.result.temporary'),
        guest: t('panel.guest'),
        token: t('panel.token'),
        templateHint: t('panel.templateHint'),
        themeLabel: t('panel.themeLabel'),
        words: t('panel.words'),
        alreadyShared: t('panel.alreadyShared'),
        updateShare: t('panel.updateShare'),
        resultUpdated: t('panel.result.updated'),
        resultCopied: t('panel.result.copied'),
        resultPermanent: t('panel.result.permanent'),
        resultTip: t('panel.result.tip'),
        back: t('panel.back'),
        retry: t('panel.retry'),
        errorTitle: t('panel.error.title'),
        modeGuest: t('panel.mode.guest'),
        modeToken: t('panel.mode.token'),
        tip: t('panel.tip'),
        tokenBarGuest: t('panel.tokenBar.guest'),
        tokenBarToken: t('panel.tokenBar.token'),
        tokenSet: t('token.set'),
        tokenClear: t('token.clear'),
        tokenGet: t('token.get'),
        welcomeTitle: t('panel.welcome.title'),
        welcomeStep1: t('panel.welcome.step1'),
        welcomeStep2: t('panel.welcome.step2'),
        welcomeStep3: t('panel.welcome.step3'),
        welcomeToken: t('panel.welcome.token'),
        welcomeDismiss: t('panel.welcome.dismiss'),
        langZh: t('panel.lang.zh'),
        langEn: t('panel.lang.en'),
        langAria: t('panel.lang.aria'),
      },
    });
  }

  private async setUiLocale(locale: Locale): Promise<void> {
    setLocale(locale);
    await this.context.globalState.update(LOCALE_PREF_KEY, locale);
    this.panel.title = t('panel.title');
    this.sendInit();
  }

  private async refreshTokenState(): Promise<void> {
    this.hasTokenFlag = await hasToken(this.context);
    this.panel.webview.postMessage({
      type: 'tokenState',
      hasToken: this.hasTokenFlag,
    });
  }

  private async refreshContentFromEditor(): Promise<void> {
    const latest = await readMarkdownContentForPath(this.filePath);
    if (latest !== undefined) {
      this.content = latest;
      this.wordCount = this.content.replace(/\s+/g, '').length;
      this.panel.webview.postMessage({
        type: 'fileMeta',
        wordCount: this.wordCount,
      });
    }
  }

  private async doShare(templateId: string, theme?: string): Promise<void> {
    await this.refreshContentFromEditor();
    this.panel.webview.postMessage({ type: 'publishing' });
    try {
      const { response, isUpdate } = await publishMarkdown(
        this.context,
        this.filePath,
        this.content,
        templateId,
        theme
      );

      const config = vscode.workspace.getConfiguration('htmlToLinkMd');
      if (config.get<boolean>('autoCopyUrl', true)) {
        await vscode.env.clipboard.writeText(response.url);
      }
      if (config.get<boolean>('openInBrowser', false)) {
        await vscode.env.openExternal(vscode.Uri.parse(response.url));
      }

      const isTemporary =
        typeof response.temporary === 'boolean'
          ? response.temporary
          : !this.hasTokenFlag;

      this.panel.webview.postMessage({
        type: 'result',
        url: response.url,
        isTemporary,
        isUpdate,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.panel.webview.postMessage({
        type: 'error',
        message,
      });
    }
  }

  private async handleMessage(msg: {
    type: string;
    templateId?: string;
    theme?: string;
    text?: string;
    url?: string;
    locale?: string;
  }): Promise<void> {
    switch (msg.type) {
      case 'share':
        if (msg.templateId) {
          await this.doShare(msg.templateId, msg.theme);
        }
        break;
      case 'cancel':
        this.panel.dispose();
        break;
      case 'copy':
        if (msg.text) {
          await vscode.env.clipboard.writeText(msg.text);
          vscode.window.showInformationMessage(t('share.linkCopied'));
        }
        break;
      case 'open':
        if (msg.url) {
          vscode.env.openExternal(vscode.Uri.parse(msg.url));
        }
        break;
      case 'setToken':
        await promptSetToken(this.context);
        await this.refreshTokenState();
        break;
      case 'clearToken':
        await clearToken(this.context);
        await this.refreshTokenState();
        break;
      case 'openTokenSettings':
        vscode.env.openExternal(vscode.Uri.parse(TOKEN_SETTINGS_URL));
        break;
      case 'dismissWelcome':
        this.showWelcome = false;
        await this.context.globalState.update('htmlToLinkMd.hasSeenPanelWelcome', true);
        break;
      case 'setLocale':
        if (isLocale(msg.locale) && msg.locale !== getLocale()) {
          await this.setUiLocale(msg.locale);
        }
        break;
    }
  }

  private getHtml(): string {
    const styles = getWebviewStyles();
    const script = getWebviewScript();
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
  <title>Share Markdown</title>
  <style>${styles}</style>
</head>
<body>
  <div id="app">
    <div id="welcomeOverlay" class="overlay hidden">
      <div class="welcome-card">
        <div class="welcome-icon">📄</div>
        <h2 id="welcomeTitle"></h2>
        <ol id="welcomeSteps" class="welcome-steps"></ol>
        <p id="welcomeToken" class="welcome-token"></p>
        <button id="welcomeDismiss" class="btn-primary" type="button"></button>
      </div>
    </div>

    <div id="view-select" class="view">
      <div class="header">
        <div class="header-left">
          <span class="file-icon">📄</span>
          <div>
            <div id="fileName" class="file-name"></div>
            <div id="fileMeta" class="file-meta"></div>
          </div>
        </div>
        <div class="header-right">
          <div id="langSwitch" class="lang-switch" role="group" aria-label="Language">
            <button id="langZh" type="button" class="lang-btn" data-locale="zh">中文</button>
            <button id="langEn" type="button" class="lang-btn" data-locale="en">EN</button>
          </div>
          <div id="modeBadge" class="mode-badge"></div>
        </div>
      </div>

      <div id="tipBar" class="tip-bar"></div>

      <div id="tokenBar" class="token-bar">
        <div class="token-bar-text">
          <span id="tokenStatusIcon" class="token-status-icon"></span>
          <span id="tokenStatusText"></span>
        </div>
        <div class="token-bar-actions">
          <button id="tokenGetBtn" class="btn-ghost btn-sm" type="button"></button>
          <button id="tokenSetBtn" class="btn-ghost btn-sm" type="button"></button>
          <button id="tokenClearBtn" class="btn-ghost btn-sm hidden" type="button"></button>
        </div>
      </div>

      <div id="existingBanner" class="existing-banner hidden">
        <span class="existing-icon">🔗</span>
        <span id="existingText"></span>
        <a id="existingLink" href="#" class="existing-link"></a>
      </div>

      <div class="section">
        <div class="section-label" id="labelTemplate"></div>
        <div class="section-hint" id="hintTemplate"></div>
        <div id="templateGrid" class="template-grid"></div>
      </div>

      <div id="themeSection" class="section hidden">
        <div class="section-label" id="labelTheme"></div>
        <div id="themeList" class="theme-list"></div>
      </div>

      <div class="footer">
        <button id="shareBtn" class="btn-primary" disabled></button>
      </div>
    </div>

    <div id="view-publishing" class="view hidden">
      <div class="center-content">
        <div class="spinner"></div>
        <div id="publishingText" class="publishing-text"></div>
      </div>
    </div>

    <div id="view-result" class="view hidden">
      <div class="center-content">
        <div class="result-icon">✅</div>
        <div id="resultTitle" class="result-title"></div>
        <div id="resultBadge" class="result-badge"></div>
        <div class="url-box">
          <input id="resultUrl" type="text" readonly />
          <button id="copyBtn" class="btn-secondary"></button>
        </div>
        <div class="result-actions">
          <button id="openBtn" class="btn-primary"></button>
        </div>
        <p id="resultTip" class="result-tip"></p>
      </div>
    </div>

    <div id="view-error" class="view hidden">
      <div class="center-content">
        <div class="error-icon">❌</div>
        <div id="errorTitle" class="error-title"></div>
        <div id="errorMessage" class="error-message"></div>
        <button id="retryBtn" class="btn-primary"></button>
      </div>
    </div>
  </div>
  <script>${script}</script>
</body>
</html>`;
  }

  private dispose(): void {
    SharePanel.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      const d = this.disposables.pop();
      d?.dispose();
    }
  }
}
