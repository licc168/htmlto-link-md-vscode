export function getStyles(): string {
  return `
  :root {
    --accent: var(--vscode-button-background, #0e639c);
    --accent-hover: var(--vscode-button-hoverBackground, #1177bb);
    --fg: var(--vscode-foreground, #ccc);
    --fg-dim: var(--vscode-descriptionForeground, #8a8a8a);
    --bg: var(--vscode-editor-background, #1e1e1e);
    --card-bg: var(--vscode-editorWidget-background, #252526);
    --card-border: var(--vscode-editorWidget-border, #3c3c3c);
    --good: #3fb950;
    --warn: #d29922;
    --bad: #f85149;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: var(--vscode-font-family, -apple-system, 'Segoe UI', sans-serif);
    color: var(--fg);
    background: var(--bg);
    min-height: 100vh;
    overflow-x: hidden;
    position: relative;
  }
  .glow {
    position: fixed; border-radius: 50%;
    filter: blur(90px); opacity: 0.16;
    pointer-events: none; z-index: 0;
  }
  .glow-a {
    width: 420px; height: 420px;
    background: var(--accent);
    top: -160px; right: -120px;
    animation: drift 14s ease-in-out infinite alternate;
  }
  .glow-b {
    width: 340px; height: 340px;
    background: #8f6fff;
    bottom: -140px; left: -100px;
    animation: drift 18s ease-in-out infinite alternate-reverse;
  }
  @keyframes drift {
    from { transform: translate(0,0) scale(1); }
    to { transform: translate(-40px,30px) scale(1.15); }
  }
  .wrap {
    position: relative; z-index: 1;
    max-width: 760px; margin: 0 auto;
    padding: 32px 28px 60px;
  }
  .header {
    display: flex; align-items: center; gap: 16px;
    margin-bottom: 34px;
    animation: rise 0.45s cubic-bezier(0.22,1,0.36,1) both;
  }
  .file-chip {
    flex-shrink: 0; width: 52px; height: 52px;
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(140deg, var(--accent), #8f6fff);
    box-shadow: 0 6px 20px rgba(0,0,0,0.35);
  }
  .file-ext { font-size: 15px; font-weight: 800; letter-spacing: 1px; color: #fff; }
  .file-name {
    font-size: 21px; font-weight: 700; letter-spacing: -0.3px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    max-width: 560px;
  }
  .file-sub {
    display: flex; align-items: center; gap: 8px;
    margin-top: 4px; font-size: 12.5px; color: var(--fg-dim);
  }
  .dot-sep { opacity: 0.5; }
  .mode-badge {
    padding: 1px 8px; border-radius: 999px;
    border: 1px solid var(--card-border);
    font-size: 11px; font-weight: 600; letter-spacing: 0.4px;
  }
  .mode-badge.is-token { border-color: var(--good); color: var(--good); }
  .shared-badge {
    padding: 1px 8px; border-radius: 999px;
    background: rgba(63,185,80,0.15); color: var(--good);
    font-size: 11px; font-weight: 700; letter-spacing: 0.4px;
  }
  .section-head { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px; }
  .section-head.compact { margin: 26px 0 14px; }
  .section-index {
    font-size: 12px; font-weight: 800; color: var(--accent);
    letter-spacing: 1px; padding-top: 3px;
    font-family: var(--vscode-editor-font-family, monospace);
  }
  .section-title { font-size: 15px; font-weight: 700; letter-spacing: 0.2px; }
  .section-hint { font-size: 12.5px; color: var(--fg-dim); margin-top: 2px; }
  .tpl-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(138px, 1fr));
    gap: 10px;
  }
  .tpl-card {
    position: relative;
    display: flex; align-items: stretch;
    background: var(--card-bg);
    border: 1.5px solid var(--card-border);
    border-radius: 11px; padding: 0;
    overflow: hidden; min-height: 52px;
    cursor: pointer; text-align: left; color: var(--fg);
    transition: transform 0.18s cubic-bezier(0.22,1,0.36,1), border-color 0.18s, box-shadow 0.18s, background 0.18s;
    animation: rise 0.4s cubic-bezier(0.22,1,0.36,1) both;
  }
  .tpl-card:hover {
    transform: translateY(-2px);
    border-color: var(--fg-dim);
    box-shadow: 0 8px 22px rgba(0,0,0,0.3);
  }
  .tpl-card.selected {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 12%, var(--card-bg));
    box-shadow: 0 0 0 1.5px var(--accent), 0 8px 22px rgba(0,0,0,0.3);
  }
  .tpl-bar {
    flex: 0 0 5px; align-self: stretch;
  }
  .tpl-body {
    flex: 1; min-width: 0;
    display: flex; align-items: center;
    padding: 10px 30px 10px 13px;
  }
  .tpl-check {
    position: absolute; top: 7px; right: 7px;
    width: 18px; height: 18px; border-radius: 50%;
    background: var(--accent); color: #fff;
    font-size: 11px; font-weight: 800;
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transform: scale(0.4);
    transition: opacity 0.18s, transform 0.18s cubic-bezier(0.34,1.56,0.64,1);
  }
  .tpl-card.selected .tpl-check { opacity: 1; transform: scale(1); }
  .tpl-name {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    font-size: 13.5px; font-weight: 700; letter-spacing: 0.1px;
    line-height: 1.3;
    word-break: break-word;
  }
  .theme-block {
    margin-top: 4px;
    animation: rise 0.35s cubic-bezier(0.22,1,0.36,1) both;
  }
  .theme-row {
    display: flex; flex-wrap: wrap; gap: 10px;
  }
  .theme-dot {
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    background: none; border: none; cursor: pointer;
    color: var(--fg-dim); padding: 4px;
    transition: color 0.15s;
  }
  .theme-dot:hover { color: var(--fg); }
  .theme-swatch {
    width: 30px; height: 30px; border-radius: 50%;
    border: 2px solid var(--card-border);
    transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s;
  }
  .theme-dot:hover .theme-swatch { transform: scale(1.12); }
  .theme-dot.selected .theme-swatch {
    box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px var(--accent);
    transform: scale(1.08);
  }
  .theme-dot.selected { color: var(--fg); }
  .theme-label {
    font-size: 10.5px; font-weight: 600;
    max-width: 64px; white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis;
  }
  .action-bar { margin-top: 32px; display: flex; justify-content: flex-end; }
  .btn-primary {
    display: inline-flex; align-items: center; gap: 10px;
    background: var(--accent); color: #fff;
    border: none; border-radius: 10px;
    padding: 12px 26px; font-size: 14px; font-weight: 700;
    cursor: pointer; letter-spacing: 0.3px;
    transition: background 0.18s, transform 0.15s, box-shadow 0.18s, opacity 0.18s;
    box-shadow: 0 4px 14px rgba(0,0,0,0.25);
  }
  .btn-primary:hover:not(:disabled) {
    background: var(--accent-hover);
    transform: translateY(-2px);
    box-shadow: 0 8px 22px rgba(0,0,0,0.35);
  }
  .btn-primary:active:not(:disabled) { transform: translateY(0); }
  .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
  .btn-arrow { transition: transform 0.18s; }
  .btn-primary:hover:not(:disabled) .btn-arrow { transform: translateX(4px); }
  .btn-ghost {
    background: var(--card-bg); color: var(--fg);
    border: 1.5px solid var(--card-border); border-radius: 10px;
    padding: 12px 24px; font-size: 14px; font-weight: 600;
    cursor: pointer; transition: border-color 0.18s, transform 0.15s;
  }
  .btn-ghost:hover { border-color: var(--fg-dim); transform: translateY(-2px); }
  .btn-text {
    background: none; border: none; cursor: pointer;
    color: var(--fg-dim); font-size: 13px; font-weight: 600;
    padding: 8px 12px; margin-top: 16px;
    transition: color 0.15s;
  }
  .btn-text:hover { color: var(--fg); }
  .view { animation: rise 0.4s cubic-bezier(0.22,1,0.36,1) both; }
  .hidden { display: none !important; }
  @keyframes rise {
    from { opacity: 0; transform: translateY(14px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .center-stage {
    display: flex; flex-direction: column; align-items: center;
    text-align: center; padding: 48px 0 20px;
  }
  .loader { position: relative; width: 64px; height: 64px; margin-bottom: 26px; }
  .loader-ring {
    position: absolute; inset: 0;
    border: 3px solid var(--card-border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.9s linear infinite;
  }
  .loader-core {
    position: absolute; inset: 16px;
    border-radius: 50%;
    background: linear-gradient(140deg, var(--accent), #8f6fff);
    animation: pulse 1.4s ease-in-out infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100% { transform: scale(0.85); opacity: 0.7; } 50% { transform: scale(1); opacity: 1; } }
  .stage-text { font-size: 17px; font-weight: 700; }
  .stage-title { font-size: 22px; font-weight: 800; margin-bottom: 8px; }
  .stage-sub { font-size: 13px; color: var(--fg-dim); margin-top: 6px; max-width: 420px; }
  .stage-sub.warn { color: var(--warn); }
  .success-mark { margin-bottom: 22px; }
  .check-svg { width: 72px; height: 72px; }
  .check-circle {
    stroke: var(--good); stroke-width: 3;
    stroke-dasharray: 166; stroke-dashoffset: 166;
    animation: strokeDraw 0.6s cubic-bezier(0.65,0,0.45,1) forwards;
  }
  .check-path {
    stroke: var(--good); stroke-width: 4;
    stroke-linecap: round; stroke-linejoin: round;
    stroke-dasharray: 48; stroke-dashoffset: 48;
    animation: strokeDraw 0.4s 0.5s cubic-bezier(0.65,0,0.45,1) forwards;
  }
  @keyframes strokeDraw { to { stroke-dashoffset: 0; } }
  .error-mark {
    width: 64px; height: 64px; border-radius: 50%;
    background: rgba(248,81,73,0.12); color: var(--bad);
    display: flex; align-items: center; justify-content: center;
    font-size: 34px; font-weight: 800; margin-bottom: 22px;
    animation: shake 0.4s cubic-bezier(0.36,0.07,0.19,0.97);
  }
  @keyframes shake {
    10%,90% { transform: translateX(-2px); }
    20%,80% { transform: translateX(4px); }
    30%,50%,70% { transform: translateX(-6px); }
    40%,60% { transform: translateX(6px); }
  }
  .error-msg { color: var(--bad); }
  .link-card {
    margin: 24px 0 8px;
    background: var(--card-bg);
    border: 1.5px solid var(--card-border);
    border-radius: 12px;
    padding: 16px 20px;
    width: 100%; max-width: 480px;
    text-align: left;
  }
  .link-label {
    display: block; font-size: 11px; font-weight: 700;
    letter-spacing: 1px; text-transform: uppercase;
    color: var(--fg-dim); margin-bottom: 8px;
  }
  .link-url {
    display: block; font-size: 14px; font-weight: 600;
    color: var(--accent); text-decoration: none;
    word-break: break-all; cursor: pointer;
    transition: opacity 0.15s;
  }
  .link-url:hover { opacity: 0.8; text-decoration: underline; }
  .result-actions {
    display: flex; gap: 12px; margin-top: 24px;
  }
`;
}
