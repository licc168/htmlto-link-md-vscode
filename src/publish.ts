import * as vscode from 'vscode';
import * as path from 'path';
import { createSharePage, deleteSharePage } from './api';
import { ShareRecord, CreateShareResponse, TEMPLATES } from './constants';
import { t } from './i18n';
import { SharePanel } from './panel/SharePanel';

const SHARES_KEY = 'htmlToLinkMd.fileShares';

export function getShareRecords(context: vscode.ExtensionContext): Record<string, ShareRecord> {
  return context.globalState.get<Record<string, ShareRecord>>(SHARES_KEY, {});
}

async function saveShareRecords(context: vscode.ExtensionContext, records: Record<string, ShareRecord>): Promise<void> {
  await context.globalState.update(SHARES_KEY, records);
}

/**
 * Strip YAML frontmatter from markdown content
 */
function stripFrontmatter(content: string): string {
  const match = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  if (match) {
    return content.slice(match[0].length);
  }
  return content;
}

/**
 * Normalize wiki-style links: [[Note|alias]] -> alias, [[Note]] -> Note
 */
function normalizeWikiLinks(content: string): string {
  return content.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1');
}

/**
 * Prepare markdown content for sharing
 */
export function prepareMarkdown(content: string): string {
  let result = stripFrontmatter(content);
  result = normalizeWikiLinks(result);
  return result.trim();
}

/**
 * Get title from file path
 */
function getTitle(filePath: string): string {
  return path.basename(filePath, path.extname(filePath));
}

/**
 * Resolve theme class for template
 */
function resolveThemeClass(templateId: string, theme?: string): string {
  const tpl = TEMPLATES.find(tp => tp.id === templateId);
  if (!tpl?.themes || !theme) {
    return '';
  }
  return theme;
}

export interface PublishResult {
  response: CreateShareResponse;
  isUpdate: boolean;
}

/**
 * Publish a markdown file
 */
export async function publishMarkdown(
  context: vscode.ExtensionContext,
  filePath: string,
  content: string,
  templateId: string,
  theme?: string
): Promise<PublishResult> {
  const config = vscode.workspace.getConfiguration('htmlToLinkMd');
  const apiBaseUrl = config.get<string>('apiBaseUrl', 'https://htmlto.link');
  const token = await context.secrets.get('htmlToLinkMd.token');

  const records = getShareRecords(context);
  const existing = records[filePath];

  const prepared = prepareMarkdown(content);
  const title = getTitle(filePath);
  const themeClass = resolveThemeClass(templateId, theme);

  const response = await createSharePage(
    apiBaseUrl,
    token,
    { content: prepared, templateId, title, themeClass },
    existing ? { slug: existing.slug, updateToken: existing.updateToken } : undefined
  );

  // Save share record
  records[filePath] = {
    slug: response.slug,
    updateToken: response.updateToken,
    url: response.url,
  };
  await saveShareRecords(context, records);

  return { response, isUpdate: !!existing };
}

/**
 * Delete share for a file
 */
export async function deleteShare(
  context: vscode.ExtensionContext,
  filePath: string
): Promise<void> {
  const config = vscode.workspace.getConfiguration('htmlToLinkMd');
  const apiBaseUrl = config.get<string>('apiBaseUrl', 'https://htmlto.link');
  const token = await context.secrets.get('htmlToLinkMd.token');

  const records = getShareRecords(context);
  const record = records[filePath];
  if (!record) {
    throw new Error(t('share.noRecord'));
  }

  await deleteSharePage(apiBaseUrl, token, record.slug, record.updateToken);

  delete records[filePath];
  await saveShareRecords(context, records);
}

/**
 * Main share command handler — opens the share panel
 */
export async function shareActiveFile(context: vscode.ExtensionContext, uri?: vscode.Uri): Promise<void> {
  let filePath: string | undefined;
  let content: string | undefined;

  if (uri) {
    filePath = uri.fsPath;
    const data = await vscode.workspace.fs.readFile(uri);
    content = Buffer.from(data).toString('utf-8');
  } else {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage(t('share.noActiveFile'));
      return;
    }
    if (editor.document.languageId !== 'markdown') {
      vscode.window.showWarningMessage(t('share.notMarkdown'));
      return;
    }
    filePath = editor.document.fileName;
    content = editor.document.getText();
  }

  if (!filePath || content === undefined) {
    return;
  }

  SharePanel.show(context, filePath, content);
}

/**
 * Delete share command handler
 */
export async function deleteShareForActiveFile(context: vscode.ExtensionContext): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage(t('share.noActiveFile'));
    return;
  }

  const filePath = editor.document.fileName;
  const records = getShareRecords(context);
  if (!records[filePath]) {
    vscode.window.showWarningMessage(t('share.noRecord'));
    return;
  }

  const confirm = await vscode.window.showWarningMessage(
    t('share.deleteConfirm'),
    { modal: true },
    'Yes'
  );

  if (confirm !== 'Yes') {
    return;
  }

  try {
    await deleteShare(context, filePath);
    vscode.window.showInformationMessage(t('share.deleted'));
  } catch (err) {
    vscode.window.showErrorMessage(
      `${t('share.failed')}: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}
