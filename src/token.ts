import * as vscode from 'vscode';
import { t } from './i18n';

export const TOKEN_SECRET_KEY = 'htmlToLinkMd.token';
export const TOKEN_SETTINGS_URL = 'https://htmlto.link/settings';
export const TOKEN_HOME_URL = 'https://htmlto.link/';

export async function hasToken(context: vscode.ExtensionContext): Promise<boolean> {
  return !!(await context.secrets.get(TOKEN_SECRET_KEY));
}

export async function getToken(context: vscode.ExtensionContext): Promise<string | undefined> {
  return context.secrets.get(TOKEN_SECRET_KEY);
}

/**
 * Prompt user to set or clear API token.
 * @returns 'saved' | 'cleared' | 'cancelled'
 */
export async function promptSetToken(
  context: vscode.ExtensionContext
): Promise<'saved' | 'cleared' | 'cancelled'> {
  const token = await vscode.window.showInputBox({
    prompt: t('token.prompt'),
    placeHolder: t('token.placeholder'),
    password: true,
    ignoreFocusOut: true,
  });

  if (token === undefined) {
    return 'cancelled';
  }

  if (token.trim() === '') {
    await context.secrets.delete(TOKEN_SECRET_KEY);
    vscode.window.showInformationMessage(t('token.cleared'));
    return 'cleared';
  }

  await context.secrets.store(TOKEN_SECRET_KEY, token.trim());
  vscode.window.showInformationMessage(t('token.saved'));
  return 'saved';
}

export async function clearToken(context: vscode.ExtensionContext): Promise<void> {
  await context.secrets.delete(TOKEN_SECRET_KEY);
  vscode.window.showInformationMessage(t('token.cleared'));
}
