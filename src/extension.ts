import * as vscode from 'vscode';
import { initLocale, t } from './i18n';
import { shareActiveFile, deleteShareForActiveFile } from './publish';

export function activate(context: vscode.ExtensionContext) {
  initLocale();

  // Share command
  const shareCmd = vscode.commands.registerCommand(
    'htmlToLinkMd.share',
    (uri?: vscode.Uri) => shareActiveFile(context, uri)
  );

  // Delete share command
  const deleteCmd = vscode.commands.registerCommand(
    'htmlToLinkMd.deleteShare',
    () => deleteShareForActiveFile(context)
  );

  // Set token command
  const setTokenCmd = vscode.commands.registerCommand(
    'htmlToLinkMd.setToken',
    async () => {
      const token = await vscode.window.showInputBox({
        prompt: t('token.placeholder'),
        password: true,
        ignoreFocusOut: true,
      });

      if (token === undefined) {
        return; // cancelled
      }

      if (token.trim() === '') {
        await context.secrets.delete('htmlToLinkMd.token');
        vscode.window.showInformationMessage(t('token.cleared'));
      } else {
        await context.secrets.store('htmlToLinkMd.token', token.trim());
        vscode.window.showInformationMessage(t('token.saved'));
      }
    }
  );

  context.subscriptions.push(shareCmd, deleteCmd, setTokenCmd);
}

export function deactivate() {}
