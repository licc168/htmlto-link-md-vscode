export function getWebviewStyles(): string {
  return /* css */ `
    :root {
      --radius: 8px;
      --radius-sm: 6px;
      --gap: 12px;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      line-height: 1.5;
    }

    .hidden { display: none !important; }

    #app {
      max-width: 720px;
      margin: 0 auto;
      padding: 20px 16px 40px;
    }

    /* Overlay / welcome */
    .overlay {
      position: fixed;
      inset: 0;
      z-index: 100;
      background: color-mix(in srgb, var(--vscode-editor-background) 75%, transparent);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .welcome-card {
      width: min(420px, 100%);
      background: var(--vscode-editorWidget-background, var(--vscode-sideBar-background));
      border: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
      border-radius: 12px;
      padding: 24px 22px 20px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
    }

    .welcome-icon {
      font-size: 32px;
      margin-bottom: 8px;
    }

    .welcome-card h2 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 14px;
    }

    .welcome-steps {
      padding-left: 20px;
      margin-bottom: 14px;
      color: var(--vscode-descriptionForeground);
      font-size: 13px;
    }

    .welcome-steps li {
      margin-bottom: 8px;
    }

    .welcome-token {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 16px;
      line-height: 1.45;
    }

    /* Header */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--gap);
      margin-bottom: 12px;
      padding-bottom: 14px;
      border-bottom: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .lang-switch {
      display: inline-flex;
      border: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
      border-radius: 20px;
      overflow: hidden;
      background: var(--vscode-input-background, transparent);
    }

    .lang-btn {
      border: none;
      background: transparent;
      color: var(--vscode-descriptionForeground);
      font-size: 11px;
      font-weight: 600;
      padding: 3px 10px;
      cursor: pointer;
      font-family: inherit;
      line-height: 1.4;
    }

    .lang-btn:hover {
      color: var(--vscode-foreground);
      background: color-mix(in srgb, var(--vscode-list-hoverBackground) 80%, transparent);
    }

    .lang-btn.active {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }

    .file-icon { font-size: 22px; flex-shrink: 0; }

    .file-name {
      font-weight: 600;
      font-size: 14px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .file-meta {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
    }

    .mode-badge {
      flex-shrink: 0;
      font-size: 11px;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 20px;
      letter-spacing: 0.02em;
    }

    .mode-badge.guest {
      background: color-mix(in srgb, var(--vscode-badge-background) 40%, transparent);
      color: var(--vscode-badge-foreground, var(--vscode-foreground));
    }

    .mode-badge.token {
      background: color-mix(in srgb, var(--vscode-button-background) 25%, transparent);
      color: var(--vscode-button-background);
      border: 1px solid color-mix(in srgb, var(--vscode-button-background) 40%, transparent);
    }

    /* Tip bar */
    .tip-bar {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      background: color-mix(in srgb, var(--vscode-textBlockQuote-background, var(--vscode-editor-inactiveSelectionBackground)) 80%, transparent);
      border-left: 3px solid var(--vscode-textLink-foreground, var(--vscode-button-background));
      padding: 8px 12px;
      margin-bottom: 12px;
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
      line-height: 1.45;
    }

    /* Token bar */
    .token-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
      padding: 10px 12px;
      margin-bottom: 14px;
      border-radius: var(--radius);
      border: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
      background: var(--vscode-input-background, transparent);
    }

    .token-bar-text {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      min-width: 0;
    }

    .token-status-icon { flex-shrink: 0; }

    .token-bar-actions {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    /* Existing banner */
    .existing-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      padding: 8px 12px;
      margin-bottom: 14px;
      border-radius: var(--radius-sm);
      background: color-mix(in srgb, var(--vscode-testing-iconPassed, #3ba55c) 12%, transparent);
      border: 1px solid color-mix(in srgb, var(--vscode-testing-iconPassed, #3ba55c) 30%, transparent);
      font-size: 12px;
    }

    .existing-link {
      color: var(--vscode-textLink-foreground);
      text-decoration: none;
      word-break: break-all;
    }

    .existing-link:hover { text-decoration: underline; }

    /* Sections */
    .section { margin-bottom: 18px; }

    .section-label {
      font-weight: 600;
      font-size: 13px;
      margin-bottom: 4px;
    }

    .section-hint {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 10px;
    }

    /* Template grid — name-only chips */
    .template-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .template-card {
      font-family: inherit;
      font-size: 12px;
      font-weight: 500;
      padding: 7px 14px;
      border-radius: 20px;
      border: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
      background: transparent;
      color: var(--vscode-foreground);
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s, color 0.15s;
      white-space: nowrap;
    }

    .template-card:hover {
      border-color: var(--vscode-focusBorder, var(--vscode-button-background));
    }

    .template-card.selected {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border-color: var(--vscode-button-background);
    }

    /* Theme chips */
    .theme-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .theme-chip {
      font-family: inherit;
      font-size: 12px;
      padding: 5px 12px;
      border-radius: 20px;
      border: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
      background: transparent;
      color: var(--vscode-foreground);
      cursor: pointer;
    }

    .theme-chip:hover {
      border-color: var(--vscode-focusBorder, var(--vscode-button-background));
    }

    .theme-chip.selected {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border-color: var(--vscode-button-background);
    }

    /* Footer */
    .footer {
      position: sticky;
      bottom: 0;
      padding-top: 12px;
      background: linear-gradient(transparent, var(--vscode-editor-background) 30%);
    }

    /* Buttons */
    .btn-primary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 10px 16px;
      font-family: inherit;
      font-size: 13px;
      font-weight: 600;
      border: none;
      border-radius: var(--radius);
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      cursor: pointer;
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--vscode-button-hoverBackground);
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-secondary {
      font-family: inherit;
      font-size: 12px;
      font-weight: 600;
      padding: 6px 12px;
      border: none;
      border-radius: var(--radius-sm);
      background: var(--vscode-button-secondaryBackground, var(--vscode-button-background));
      color: var(--vscode-button-secondaryForeground, var(--vscode-button-foreground));
      cursor: pointer;
      white-space: nowrap;
    }

    .btn-secondary:hover {
      background: var(--vscode-button-secondaryHoverBackground, var(--vscode-button-hoverBackground));
    }

    .btn-ghost {
      font-family: inherit;
      font-size: 11px;
      padding: 4px 10px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
      background: transparent;
      color: var(--vscode-foreground);
      cursor: pointer;
    }

    .btn-ghost:hover {
      background: var(--vscode-toolbar-hoverBackground, rgba(128,128,128,0.15));
    }

    .btn-sm { font-size: 11px; }

    /* Center views */
    .center-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 48px 16px;
      gap: 12px;
    }

    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid var(--vscode-widget-border, #444);
      border-top-color: var(--vscode-button-background);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .publishing-text {
      color: var(--vscode-descriptionForeground);
      font-size: 13px;
    }

    .result-icon, .error-icon { font-size: 40px; }

    .result-title, .error-title {
      font-size: 16px;
      font-weight: 600;
    }

    .result-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 20px;
    }

    .result-badge.temporary {
      background: color-mix(in srgb, var(--vscode-editorWarning-foreground, #cca700) 18%, transparent);
      color: var(--vscode-editorWarning-foreground, #cca700);
    }

    .result-badge.permanent {
      background: color-mix(in srgb, var(--vscode-testing-iconPassed, #3ba55c) 18%, transparent);
      color: var(--vscode-testing-iconPassed, #3ba55c);
    }

    .url-box {
      display: flex;
      width: 100%;
      max-width: 480px;
      gap: 8px;
      margin-top: 4px;
    }

    .url-box input {
      flex: 1;
      min-width: 0;
      padding: 8px 10px;
      font-family: var(--vscode-editor-font-family, monospace);
      font-size: 12px;
      border: 1px solid var(--vscode-input-border, var(--vscode-widget-border));
      border-radius: var(--radius-sm);
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
    }

    .result-actions {
      width: 100%;
      max-width: 480px;
    }

    .result-actions .btn-primary {
      width: 100%;
    }

    .result-tip {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      max-width: 420px;
      line-height: 1.45;
      margin-top: 4px;
    }

    .error-message {
      font-size: 13px;
      color: var(--vscode-errorForeground, #f14c4c);
      max-width: 400px;
      word-break: break-word;
    }

    .error-title { margin-bottom: 4px; }

    #retryBtn { max-width: 200px; margin-top: 8px; }
  `;
}
