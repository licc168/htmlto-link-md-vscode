import * as vscode from 'vscode';
import * as crypto from 'crypto';
import * as os from 'os';

const PING_ENDPOINT = '/api/telemetry/ping';

/**
 * 生成匿名机器标识（不可逆哈希，保护隐私）
 */
function getAnonymousId(): string {
  const raw = [
    os.hostname(),
    os.userInfo().username,
    vscode.env.machineId, // VS Code 提供的稳定机器 ID
  ].join('|');
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

/**
 * 发送一次激活 ping（fire-and-forget，不阻塞插件启动）
 */
export function sendActivationPing(apiBaseUrl: string): void {
  const url = `${apiBaseUrl}${PING_ENDPOINT}`;
  const body = JSON.stringify({
    id: getAnonymousId(),
    ext: 'htmlto-link-md',
    extVersion: vscode.extensions.getExtension('licc.htmlto-link-md')?.packageJSON?.version ?? 'unknown',
    vscodeVersion: vscode.version,
    platform: process.platform,
    arch: process.arch,
    ts: Date.now(),
  });

  // fire-and-forget：不 await，不影响插件启动速度
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    signal: AbortSignal.timeout(3000), // 3 秒超时
  }).catch(() => {
    // 静默忽略所有错误，绝不影响用户体验
  });
}
