import * as path from 'path';
import * as vscode from 'vscode';
import { DEFAULT_TEMPLATE, TEMPLATES } from '../constants';
import { getLocale, t, templateName, themeName } from '../i18n';
import { getShareRecords, publishMarkdown, readMarkdownContentForPath } from '../publish';
import { hasToken, promptSetToken, TOKEN_SETTINGS_URL } from '../token';
import { renderMarkdownPreview } from './preview';
export class MarkdownPreviewPanel {
  public static currentPanel: MarkdownPreviewPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private readonly context: vscode.ExtensionContext;
  private disposables: vscode.Disposable[] = [];
  private filePath = "";
  private content = "";
  private fileName = "";
  private selectedTemplate: string = DEFAULT_TEMPLATE;
  private selectedTheme = "";
  private hasTokenFlag = false;
  private initialized = false;
  private webviewReady = false;
  private renderToken = 0;
  private documentChangeDisposable?: vscode.Disposable;
  private renameDisposable?: vscode.Disposable;

  private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
        this.panel = panel;
        this.context = context;
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
        this.panel.webview.onDidReceiveMessage((message) => void this.handleMessage(message), null, this.disposables);
        this.panel.webview.html = this.getHtml();
    }
    public static show(context: vscode.ExtensionContext, filePath: string, content: string): void {
        if (MarkdownPreviewPanel.currentPanel) {
            MarkdownPreviewPanel.currentPanel.panel.reveal(vscode.ViewColumn.Beside);
            void MarkdownPreviewPanel.currentPanel.init(context, filePath, content);
            return;
        }
        const panel = vscode.window.createWebviewPanel('htmlToLinkMdPreview', `Preview ${path.basename(filePath) || 'Markdown'}`, vscode.ViewColumn.Beside, {
            enableScripts: true,
            retainContextWhenHidden: true,
        });
        MarkdownPreviewPanel.currentPanel = new MarkdownPreviewPanel(panel, context);
        void MarkdownPreviewPanel.currentPanel.init(context, filePath, content);
    }
    private async init(context: vscode.ExtensionContext, filePath: string, content: string): Promise<void> {
        this.filePath = filePath;
        this.content = content;
        this.fileName = path.basename(filePath) || 'untitled.md';
        this.panel.title = `Preview ${this.fileName}`;
        const latest = await readMarkdownContentForPath(filePath);
        if (latest !== undefined)
            this.content = latest;
        this.hasTokenFlag = await hasToken(context);
        this.attachWatchers();
        this.selectInitialState();
        this.initialized = true;
        this.sendInit();
    }
    private attachWatchers(): void {
        if (!this.documentChangeDisposable) {
            this.documentChangeDisposable = vscode.workspace.onDidChangeTextDocument((event) => {
                if (!this.samePath(event.document.fileName, this.filePath))
                    return;
                this.content = event.document.getText();
                void this.renderPreview();
            });
            this.disposables.push(this.documentChangeDisposable);
        }
        if (!this.renameDisposable) {
            this.renameDisposable = vscode.workspace.onDidRenameFiles((event) => {
                const moved = event.files.find((file) => this.samePath(file.oldUri.fsPath, this.filePath));
                if (!moved)
                    return;
                void this.init(this.context, moved.newUri.fsPath, this.content);
            });
            this.disposables.push(this.renameDisposable);
        }
    }
    private samePath(left: string, right: string): boolean {
        const a = path.normalize(left);
        const b = path.normalize(right);
        return process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b;
    }
    private selectInitialState(): void {
        const config = vscode.workspace.getConfiguration('htmlToLinkMd');
        const records = getShareRecords(this.context);
        const record = records[this.filePath];
        const savedThemes = this.context.globalState.get<Record<string, string>>('htmlToLinkMd.lastThemes', {});
        const candidate = record?.templateId ||
            this.context.globalState.get('htmlToLinkMd.lastTemplate') ||
            config.get('defaultTemplate', DEFAULT_TEMPLATE);
        this.selectedTemplate = this.isTemplate(candidate) ? candidate : DEFAULT_TEMPLATE;
        this.selectedTheme = record?.theme || savedThemes[this.selectedTemplate] || '';
    }
    private isTemplate(value: unknown): value is string {
        return Boolean(value && TEMPLATES.some((template) => template.id === value));
    }
    private sendInit(): void {
        if (!this.initialized || !this.webviewReady)
            return;
        const themesMap: Record<string, { id: string; name: string }[]> = {};
        for (const template of TEMPLATES) {
            themesMap[template.id] = (template.themes || []).map((id) => ({
                id,
                name: themeName(id),
            }));
        }
        const record = getShareRecords(this.context)[this.filePath];
        this.panel.webview.postMessage({
            type: 'init',
            fileName: this.fileName,
            templates: TEMPLATES.map((template) => ({
                id: template.id,
                name: templateName(template.id, template.name),
            })),
            themesMap,
            selectedTemplate: this.selectedTemplate,
            selectedTheme: this.selectedTheme,
            hasToken: this.hasTokenFlag,
            existingUrl: record?.url || '',
            locale: getLocale(),
            i18n: {
                template: t('preview.template'),
                theme: t('preview.theme'),
                noTheme: t('preview.noTheme'),
                share: t('preview.share'),
                update: t('preview.update'),
                rendering: t('preview.rendering'),
                ready: t('preview.ready'),
                copy: t('preview.copy'),
                open: t('preview.open'),
                copied: t('panel.result.copied'),
                failed: t('preview.failed'),
                token: t('preview.token'),
                tokenUnset: t('preview.tokenUnset'),
                tokenSet: t('preview.tokenSet'),
                tokenTitle: t('preview.tokenTitle'),
                tokenHint: t('preview.tokenHint'),
                tokenHintSet: t('preview.tokenHintSet'),
                tokenStep1: t('preview.tokenStep1'),
                tokenStep2: t('preview.tokenStep2'),
                tokenStep3: t('preview.tokenStep3'),
                openSettings: t('preview.openSettings'),
                enterToken: t('preview.enterToken'),
                changeToken: t('preview.changeToken'),
                later: t('preview.later'),
                tokenSaved: t('preview.tokenSaved'),
                tokenCleared: t('preview.tokenCleared'),
            },
        });
    }
    private async renderPreview(): Promise<void> {
        if (!this.initialized || !this.selectedTemplate)
            return;
        const token = ++this.renderToken;
        this.panel.webview.postMessage({ type: 'previewLoading' });
        try {
            const html = await renderMarkdownPreview(this.content, this.filePath, this.selectedTemplate, this.selectedTheme, { tocTitle: t('preview.tocTitle'), tocAria: t('preview.tocAria') });
            if (token !== this.renderToken)
                return;
            this.panel.webview.postMessage({ type: 'preview', html });
        }
        catch (error) {
            if (token !== this.renderToken)
                return;
            this.panel.webview.postMessage({
                type: 'previewError',
                message: error instanceof Error ? error.message : String(error),
            });
        }
    }
    private async handleMessage(message: any): Promise<void> {
        switch (message.type) {
            case 'ready':
                this.webviewReady = true;
                this.sendInit();
                break;
            case 'selectionChanged':
                {
                    if (!this.isTemplate(message.templateId))
                        return;
                    this.selectedTemplate = message.templateId;
                    this.selectedTheme = message.theme || '';
                    await this.context.globalState.update('htmlToLinkMd.lastTemplate', this.selectedTemplate);
                    const themes = this.context.globalState.get<Record<string, string>>('htmlToLinkMd.lastThemes', {});
                    themes[this.selectedTemplate] = this.selectedTheme;
                    await this.context.globalState.update('htmlToLinkMd.lastThemes', themes);
                    await this.renderPreview();
                    break;
                }
            case 'preview':
                if (this.isTemplate(message.templateId)) {
                    this.selectedTemplate = message.templateId;
                    this.selectedTheme = message.theme || '';
                    await this.renderPreview();
                }
                break;
            case 'openTokenSettings':
                await vscode.env.openExternal(vscode.Uri.parse(TOKEN_SETTINGS_URL));
                break;
            case 'setToken':
                {
                    const result = await promptSetToken(this.context);
                    this.hasTokenFlag = await hasToken(this.context);
                    this.panel.webview.postMessage({
                        type: 'tokenState',
                        hasToken: this.hasTokenFlag,
                        result,
                    });
                    break;
                }
            case 'dismissToken':
                break;
            case 'share':
                if (this.isTemplate(message.templateId)) {
                    await this.doShare(message.templateId, message.theme);
                }
                break;
            case 'copy':
                if (message.text) {
                    await vscode.env.clipboard.writeText(message.text);
                    vscode.window.showInformationMessage(t('share.linkCopied'));
                }
                break;
            case 'open':
                if (message.url)
                    await vscode.env.openExternal(vscode.Uri.parse(message.url));
                break;
        }
    }
    private async doShare(templateId: string, theme?: string): Promise<void> {
        const latest = await readMarkdownContentForPath(this.filePath);
        if (latest !== undefined)
            this.content = latest;
        this.panel.webview.postMessage({ type: 'sharing' });
        try {
            const result = await publishMarkdown(this.context, this.filePath, this.content, templateId, theme);
            const config = vscode.workspace.getConfiguration('htmlToLinkMd');
            if (config.get('autoCopyUrl', true)) {
                await vscode.env.clipboard.writeText(result.response.url);
            }
            if (config.get('openInBrowser', false)) {
                await vscode.env.openExternal(vscode.Uri.parse(result.response.url));
            }
            this.panel.webview.postMessage({
                type: 'shared',
                url: result.response.url,
                isUpdate: result.isUpdate,
            });
        }
        catch (error) {
            this.panel.webview.postMessage({
                type: 'shareError',
                message: error instanceof Error ? error.message : String(error),
            });
        }
    }
    private getHtml(): string {
        const mermaidScriptUri = this.panel.webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'out', 'panel', 'mermaid-webview.js'));
        return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src ${this.panel.webview.cspSource} 'unsafe-inline'; frame-src 'self' data:;">
  <style>${PREVIEW_PANEL_STYLES}</style>
</head>
<body>
  <header class="toolbar">
    <div class="file-title"><span class="file-icon">▤</span><span id="fileName"></span></div>
    <div class="toolbar-controls">
      <label><span id="templateLabel"></span><select id="templateSelect"></select></label>
      <label id="themeControl"><span id="themeLabel"></span><select id="themeSelect"></select></label>
      <button id="tokenBtn" class="token-button secondary" type="button" aria-expanded="false" aria-controls="tokenPopover"></button>
      <button id="shareBtn" type="button"></button>
      <span id="status" role="status"></span>
    </div>
    <div id="tokenPopover" class="token-popover hidden" role="dialog" aria-labelledby="tokenTitle">
      <div id="tokenTitle" class="token-popover-title"></div>
      <p id="tokenHint" class="token-popover-hint"></p>
      <ol class="token-steps">
        <li id="tokenStep1"></li>
        <li id="tokenStep2"></li>
        <li id="tokenStep3"></li>
      </ol>
      <div class="token-popover-actions">
        <button id="openTokenSettings" class="secondary" type="button"></button>
        <button id="setTokenBtn" type="button"></button>
        <button id="dismissTokenBtn" class="ghost" type="button"></button>
      </div>
    </div>
  </header>
  <main class="preview-container">
    <iframe id="previewFrame" title="Markdown preview" sandbox="allow-same-origin"></iframe>
  </main>
  <aside id="result" class="result hidden">
    <span id="resultText"></span>
    <a id="resultUrl" href="#"></a>
    <button id="copyBtn" type="button"></button>
    <button id="openBtn" type="button"></button>
  </aside>
  <script src="${mermaidScriptUri}"></script>
  <script>${PREVIEW_PANEL_SCRIPT}</script>
</body>
</html>`;
    }
    public dispose(): void {
        MarkdownPreviewPanel.currentPanel = undefined;
        while (this.disposables.length)
            this.disposables.pop()?.dispose();
    }
}

const PREVIEW_PANEL_STYLES = /* css */ `
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; }
  body { display: flex; flex-direction: column; color: var(--vscode-foreground); background: var(--vscode-editor-background); font-family: var(--vscode-font-family); font-size: var(--vscode-font-size); }
  .toolbar { position: relative; z-index: 2; display: flex; align-items: center; justify-content: space-between; gap: 12px; min-width: 0; min-height: 46px; padding: 7px 12px; border-bottom: 1px solid var(--vscode-panel-border); background: var(--vscode-editor-background); box-shadow: 0 1px 6px rgba(0,0,0,.12); }
  .file-title { display: flex; flex: 1 1 160px; align-items: center; gap: 7px; min-width: 0; color: var(--vscode-descriptionForeground); font-size: 12px; }
  .file-icon { color: var(--vscode-textLink-foreground); font-size: 17px; }
  #fileName { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .toolbar-controls { display: flex; flex: 0 1 auto; align-items: center; justify-content: flex-end; gap: 7px; min-width: 0; }
  label { display: inline-flex; align-items: center; gap: 5px; color: var(--vscode-descriptionForeground); font-size: 11px; white-space: nowrap; }
  select, button { height: 28px; flex: 0 0 auto; border: 1px solid var(--vscode-dropdown-border, var(--vscode-widget-border)); border-radius: 5px; font: inherit; white-space: nowrap; }
  select { max-width: 160px; padding: 0 7px; color: var(--vscode-dropdown-foreground, var(--vscode-input-foreground)); background: var(--vscode-dropdown-background, var(--vscode-input-background)); }
  #templateSelect { width: 140px; }
  #themeSelect { width: 84px; }
  #themeControl.hidden { display: none; }
  button { padding: 0 11px; color: var(--vscode-button-foreground); background: var(--vscode-button-background); cursor: pointer; font-size: 12px; font-weight: 600; }
  button:hover { background: var(--vscode-button-hoverBackground); }
  button.secondary { color: var(--vscode-button-secondaryForeground); background: var(--vscode-button-secondaryBackground); }
  button.ghost { color: var(--vscode-descriptionForeground); background: transparent; border-color: transparent; }
  button.ghost:hover { background: var(--vscode-toolbar-hoverBackground, var(--vscode-button-secondaryBackground)); }
  .token-button.is-set { color: var(--vscode-testing-iconPassed, var(--vscode-button-secondaryForeground)); }
  .token-popover { position: absolute; top: calc(100% + 8px); right: 12px; z-index: 5; width: min(370px, calc(100vw - 24px)); padding: 15px; border: 1px solid var(--vscode-widget-border); border-radius: 8px; background: var(--vscode-editorWidget-background); box-shadow: 0 10px 30px rgba(0,0,0,.25); }
  .token-popover.hidden { display: none; }
  .token-popover-title { color: var(--vscode-foreground); font-size: 13px; font-weight: 700; }
  .token-popover-hint { margin: 7px 0 11px; color: var(--vscode-descriptionForeground); font-size: 11px; line-height: 1.5; }
  .token-steps { margin: 0 0 14px; padding-left: 21px; color: var(--vscode-foreground); font-size: 11px; line-height: 1.65; }
  .token-popover-actions { display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: 6px; }
  .token-popover-actions button { height: 27px; padding: 0 9px; font-size: 11px; }
  #status { min-width: 52px; color: var(--vscode-descriptionForeground); font-size: 11px; text-align: right; }
  #status.error { color: var(--vscode-errorForeground); }
  .preview-container { flex: 1; min-height: 0; background: #f1f5f9; }
  #previewFrame { display: block; width: 100%; height: 100%; border: 0; background: #f1f5f9; }
  .result { position: fixed; right: 14px; bottom: 14px; z-index: 4; display: flex; align-items: center; gap: 8px; max-width: min(680px, calc(100vw - 28px)); padding: 9px 10px; border: 1px solid var(--vscode-panel-border); border-radius: 7px; background: var(--vscode-editorWidget-background); box-shadow: 0 8px 24px rgba(0,0,0,.2); font-size: 12px; }
  .result.hidden { display: none; }
  #resultUrl { max-width: 280px; overflow: hidden; color: var(--vscode-textLink-foreground); text-overflow: ellipsis; white-space: nowrap; }
  .result button { height: 25px; padding: 0 8px; font-size: 11px; }
  @media (max-width: 760px) { .toolbar { align-items: flex-start; flex-direction: column; justify-content: flex-start; gap: 6px; } .file-title { width: 100%; flex: 0 1 auto; } .toolbar-controls { width: 100%; justify-content: flex-start; flex-wrap: wrap; } #templateSelect { width: min(140px, 42vw); } #themeSelect { width: min(84px, 25vw); } select { max-width: 130px; } }
`;
const PREVIEW_PANEL_SCRIPT = /* js */ `
  const vscode = acquireVsCodeApi();
  const $ = (id) => document.getElementById(id);
  let i18n = {};
  let themesMap = {};
  let selectedTemplate = '';
  let selectedTheme = '';
  let currentUrl = '';
  let hasToken = false;

  function setStatus(text, error) {
    const status = $('status');
    status.textContent = text || '';
    status.classList.toggle('error', !!error);
  }

  function renderTokenPopover() {
    const tokenButton = $('tokenBtn');
    tokenButton.textContent = hasToken ? (i18n.tokenSet || 'Token set') : (i18n.tokenUnset || 'Token not set');
    tokenButton.title = hasToken ? (i18n.tokenSet || 'Token set') : (i18n.tokenUnset || 'Token not set');
    tokenButton.classList.toggle('is-set', hasToken);
    $('tokenTitle').textContent = i18n.tokenTitle || 'Set Token';
    $('tokenHint').textContent = hasToken ? (i18n.tokenHintSet || i18n.tokenHint || '') : (i18n.tokenHint || '');
    $('tokenStep1').textContent = i18n.tokenStep1 || '';
    $('tokenStep2').textContent = i18n.tokenStep2 || '';
    $('tokenStep3').textContent = i18n.tokenStep3 || '';
    $('openTokenSettings').textContent = i18n.openSettings || 'Open Settings';
    $('setTokenBtn').textContent = hasToken ? (i18n.changeToken || 'Change Token') : (i18n.enterToken || 'Enter Token');
    $('dismissTokenBtn').textContent = i18n.later || 'Later';
  }

  function setTokenPopoverVisible(visible) {
    $('tokenPopover').classList.toggle('hidden', !visible);
    $('tokenBtn').setAttribute('aria-expanded', String(visible));
  }

  function bindPreviewToc() {
    const frame = $('previewFrame');
    let previewDocument;
    try {
      previewDocument = frame.contentDocument;
    } catch (_) {
      return;
    }
    if (!previewDocument) return;
    previewDocument.querySelectorAll('[data-htmlto-link-toc-link]').forEach((link) => {
      if (link.dataset.htmltoLinkTocBound) return;
      link.dataset.htmltoLinkTocBound = 'true';
      link.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        previewDocument.querySelectorAll('[data-htmlto-link-toc-link]').forEach((item) => item.removeAttribute('aria-current'));
        link.setAttribute('aria-current', 'true');
        const rawTargetId = link.getAttribute('href') || '';
        const targetId = rawTargetId.startsWith('#') ? rawTargetId.slice(1) : rawTargetId;
        const target = targetId ? previewDocument.getElementById(targetId) : null;
        if (target) target.scrollIntoView({ behavior: 'auto', block: 'start', inline: 'nearest' });
      });
    });
  }

  async function enhancePreviewFrame() {
    const frame = $('previewFrame');
    let previewDocument;
    try {
      previewDocument = frame.contentDocument;
    } catch (_) {
      return;
    }
    if (!previewDocument) return;

    bindPreviewToc();
    for (const orderedList of Array.from(previewDocument.querySelectorAll("ol"))) {
      const startAttribute = Number.parseInt(orderedList.getAttribute("start") ?? "1", 10);
      const startIndex = Number.isFinite(startAttribute) ? startAttribute : 1;
      let itemIndex = startIndex;
      for (const child of Array.from(orderedList.children)) {
        if (child.tagName !== "LI") continue;
        if (!child.hasAttribute("data-index")) {
          child.setAttribute("data-index", String(itemIndex));
        }
        itemIndex += 1;
      }
    }

    const mermaidApi = window.htmltoLinkMermaid;
    if (!mermaidApi) return;

    try {
      await mermaidApi.renderMermaidInFrame(previewDocument);
      if (frame.contentDocument !== previewDocument) return;
      bindPreviewToc();
    } catch (error) {
      if (frame.contentDocument !== previewDocument) return;
      setStatus(error instanceof Error ? error.message : String(error), true);
    }
  }

  function postSelection() {
    vscode.postMessage({ type: 'selectionChanged', templateId: selectedTemplate, theme: selectedTheme || undefined });
  }

  function renderThemes() {
    const control = $('themeControl');
    const select = $('themeSelect');
    const themes = themesMap[selectedTemplate] || [];
    select.innerHTML = '';
    if (!themes.length) {
      selectedTheme = '';
      control.classList.add('hidden');
      return;
    }
    control.classList.remove('hidden');
    themes.forEach((theme) => {
      const option = document.createElement('option');
      option.value = theme.id;
      option.textContent = theme.name;
      option.selected = theme.id === selectedTheme;
      select.appendChild(option);
    });
    if (!themes.some((theme) => theme.id === selectedTheme)) selectedTheme = themes[0].id;
    select.value = selectedTheme;
  }

  function renderTemplates(items) {
    const select = $('templateSelect');
    select.innerHTML = '';
    items.forEach((template) => {
      const option = document.createElement('option');
      option.value = template.id;
      option.textContent = template.name;
      select.appendChild(option);
    });
    select.value = selectedTemplate;
    renderThemes();
  }

  $('templateSelect').addEventListener('change', () => {
    selectedTemplate = $('templateSelect').value;
    selectedTheme = '';
    renderThemes();
    postSelection();
  });
  $('themeSelect').addEventListener('change', () => {
    selectedTheme = $('themeSelect').value;
    postSelection();
  });
  $('tokenBtn').addEventListener('click', () => {
    setTokenPopoverVisible($('tokenPopover').classList.contains('hidden'));
  });
  $('previewFrame').addEventListener('load', () => { void enhancePreviewFrame(); });
  $('openTokenSettings').addEventListener('click', () => {
    vscode.postMessage({ type: 'openTokenSettings' });
  });
  $('setTokenBtn').addEventListener('click', () => {
    setTokenPopoverVisible(false);
    vscode.postMessage({ type: 'setToken' });
  });
  $('dismissTokenBtn').addEventListener('click', () => setTokenPopoverVisible(false));
  $('shareBtn').addEventListener('click', () => {
    vscode.postMessage({ type: 'share', templateId: selectedTemplate, theme: selectedTheme || undefined });
  });
  $('copyBtn').addEventListener('click', () => {
    vscode.postMessage({ type: 'copy', text: currentUrl });
    setStatus(i18n.copied || 'Copied', false);
  });
  $('openBtn').addEventListener('click', () => vscode.postMessage({ type: 'open', url: currentUrl }));
  $('resultUrl').addEventListener('click', (event) => { event.preventDefault(); vscode.postMessage({ type: 'open', url: currentUrl }); });

  window.addEventListener('message', (event) => {
    const msg = event.data;
    if (msg.type === 'init') {
      i18n = msg.i18n || {};
      themesMap = msg.themesMap || {};
      selectedTemplate = msg.selectedTemplate || '';
      selectedTheme = msg.selectedTheme || '';
      hasToken = !!msg.hasToken;
      $('fileName').textContent = msg.fileName || '';
      $('templateLabel').textContent = i18n.template || 'Template';
      $('themeLabel').textContent = i18n.theme || 'Theme';
      $('shareBtn').textContent = msg.existingUrl ? (i18n.update || i18n.share || 'Share') : (i18n.share || 'Share');
      renderTokenPopover();
      renderTemplates(msg.templates || []);
      postSelection();
    } else if (msg.type === 'previewLoading') {
      setStatus(i18n.rendering || 'Rendering...', false);
    } else if (msg.type === 'preview') {
      $('previewFrame').srcdoc = msg.html || '';
      setStatus(i18n.ready || 'Live preview', false);
    } else if (msg.type === 'previewError') {
      $('previewFrame').srcdoc = '';
      setStatus(msg.message || i18n.failed || 'Preview failed', true);
    } else if (msg.type === 'sharing') {
      $('shareBtn').disabled = true;
      setStatus(i18n.rendering || 'Publishing...', false);
    } else if (msg.type === 'shared') {
      $('shareBtn').disabled = false;
      currentUrl = msg.url || '';
      $('resultText').textContent = msg.isUpdate ? (i18n.update || 'Updated') : (i18n.share || 'Published');
      $('resultUrl').textContent = currentUrl;
      $('resultUrl').href = currentUrl;
      $('copyBtn').textContent = i18n.copy || 'Copy';
      $('openBtn').textContent = i18n.open || 'Open';
      $('result').classList.remove('hidden');
      setStatus(i18n.ready || 'Live preview', false);
    } else if (msg.type === 'shareError') {
      $('shareBtn').disabled = false;
      setStatus(msg.message || i18n.failed || 'Share failed', true);
    } else if (msg.type === 'tokenState') {
      hasToken = !!msg.hasToken;
      renderTokenPopover();
      if (msg.result === 'saved') setStatus(i18n.tokenSaved || 'Token saved', false);
      if (msg.result === 'cleared') setStatus(i18n.tokenCleared || 'Token cleared', false);
    }
  });

  vscode.postMessage({ type: 'ready' });
`;
