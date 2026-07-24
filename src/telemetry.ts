import * as vscode from 'vscode';
import * as crypto from 'crypto';
import * as os from 'os';

const PING_ENDPOINT = '/api/telemetry/ping';

export interface TelemetryConfig {
  /** 插件标识名，如 'htmlto-link-md'、'htmlto-link-vscode' */
  extName: string;
  /** VS Code 扩展 ID，如 'licc.htmlto-link-md' */
  extensionId: string;
  /** 后端 API 基地址，如 'https://htmlto.link' */
  apiBaseUrl: string;
}

/**
 * 生成匿名机器标识（不可逆哈希，保护隐私）
 */
function getAnonymousId(): string {
  const raw = [
    os.hostname(),
    os.userInfo().username,
    vscode.env.machineId,
  ].join('|');
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

/**
 * 发送一次激活 ping（fire-and-forget，不阻塞插件启动）
 *
 * 组件化设计：通过 TelemetryConfig 传入插件标识，任何插件均可复用。
 *
 * @example
 * ```ts
 * import { sendActivationPing } from './telemetry';
 *
 * sendActivationPing({
 *   extName: 'htmlto-link-md',
 *   extensionId: 'licc.htmlto-link-md',
 *   apiBaseUrl: 'https://htmlto.link',
 * });
 * ```
 */
export function sendActivationPing(config: TelemetryConfig): void {
  const url = `${config.apiBaseUrl}${PING_ENDPOINT}`;
  const body = JSON.stringify({
    id: getAnonymousId(),
    ext: config.extName,
    extVersion: vscode.extensions.getExtension(config.extensionId)?.packageJSON?.version ?? 'unknown',
    vscodeVersion: vscode.version,
    platform: process.platform,
    arch: process.arch,
    ts: Date.now(),
  });

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    signal: AbortSignal.timeout(3000),
  }).catch(() => {
    // 静默忽略所有错误，绝不影响用户体验
  });
}
