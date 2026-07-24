import * as vscode from 'vscode';
import { initLocale, isLocale, t, LOCALE_PREF_KEY } from './i18n';
import { shareActiveFile, deleteShareForActiveFile } from './publish';
import { promptSetToken } from './token';
import { sendActivationPing } from './telemetry';
import { DEFAULT_API_BASE_URL } from './constants';

const WELCOME_TOAST_KEY = 'htmlToLinkMd.hasSeenWelcomeToast';

export function activate(context: vscode.ExtensionContext) {
  const saved = context.globalState.get<string>(LOCALE_PREF_KEY);
  initLocale(isLocale(saved) ? saved : null);

  const shareCmd = vscode.commands.registerCommand(
    'htmlToLinkMd.share',
    (uri?: vscode.Uri) => shareActiveFile(context, uri)
  );

  const deleteCmd = vscode.commands.registerCommand(
    'htmlToLinkMd.deleteShare',
    () => deleteShareForActiveFile(context)
  );

  const setTokenCmd = vscode.commands.registerCommand(
    'htmlToLinkMd.setToken',
    () => promptSetToken(context)
  );

  context.subscriptions.push(shareCmd, deleteCmd, setTokenCmd);

  // 发送激活统计 ping（fire-and-forget）
  const apiBaseUrl = vscode.workspace
    .getConfiguration('htmlToLinkMd')
    .get<string>('apiBaseUrl', DEFAULT_API_BASE_URL);
  sendActivationPing(apiBaseUrl);

  void showWelcomeToastOnce(context);
}

async function showWelcomeToastOnce(context: vscode.ExtensionContext): Promise<void> {
  if (context.globalState.get<boolean>(WELCOME_TOAST_KEY, false)) {
    return;
  }

  await context.globalState.update(WELCOME_TOAST_KEY, true);

  const action = t('welcome.toast.action');
  const dismiss = t('welcome.toast.dismiss');
  const choice = await vscode.window.showInformationMessage(
    t('welcome.toast'),
    action,
    dismiss
  );

  if (choice === action) {
    await shareActiveFile(context);
  }
}

export function deactivate() {}
