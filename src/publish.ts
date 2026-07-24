import * as vscode from 'vscode';
import * as path from 'path';
import { createSharePage, deleteSharePage } from './api';
import { ShareRecord, CreateShareResponse, TEMPLATES } from './constants';
import { t } from './i18n';
import { SharePanel } from './panel/SharePanel';
import { getToken } from './token';

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
  if (!templateId) {
    throw new Error(t('share.missingTemplate'));
  }

  const config = vscode.workspace.getConfiguration('htmlToLinkMd');
  const apiBaseUrl = config.get<string>('apiBaseUrl', 'https://htmlto.link');
  const token = await getToken(context);

  const records = getShareRecords(context);
  const existing = records[filePath];

  const prepared = prepareMarkdown(content);
  if (!prepared) {
    throw new Error(t('share.emptyContent'));
  }

  const title = getTitle(filePath);
  const themeClass = resolveThemeClass(templateId, theme);

  const response = await createSharePage(
    apiBaseUrl,
    token,
    { content: prepared, templateId, title, themeClass, channel: 'vscode' },
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
  const token = await getToken(context);

  const records = getShareRecords(context);
  const record = records[filePath];
  if (!record) {
    throw new Error(t('share.noRecord'));
  }

  await deleteSharePage(apiBaseUrl, token, record.slug, record.updateToken);

  delete records[filePath];
  await saveShareRecords(context, records);
}

function isMarkdownDoc(doc: vscode.TextDocument): boolean {
  return doc.languageId === 'markdown' || /\.md$/i.test(doc.fileName);
}

function sameFsPath(a: string, b: string): boolean {
  const na = path.normalize(a);
  const nb = path.normalize(b);
  return process.platform === 'win32' ? na.toLowerCase() === nb.toLowerCase() : na === nb;
}

/**
 * Load markdown text for share.
 * Always prefer the editor buffer (including unsaved dirty docs).
 * Title-bar / explorer commands pass a URI; openTextDocument returns the open buffer.
 */
export async function resolveMarkdownContent(
  uri?: vscode.Uri
): Promise<{ filePath: string; content: string } | undefined> {
  const active = vscode.window.activeTextEditor?.document;

  // 1) Active editor matching the target URI (or no URI)
  if (
    active &&
    isMarkdownDoc(active) &&
    (!uri || sameFsPath(active.uri.fsPath, uri.fsPath) || active.uri.toString() === uri.toString())
  ) {
    return { filePath: active.fileName, content: active.getText() };
  }

  if (uri) {
    // 2) Any already-open document
    const openDoc = vscode.workspace.textDocuments.find(
      (d) => d.uri.toString() === uri.toString() || sameFsPath(d.uri.fsPath, uri.fsPath)
    );
    if (openDoc) {
      if (!isMarkdownDoc(openDoc)) {
        vscode.window.showWarningMessage(t('share.notMarkdown'));
        return undefined;
      }
      return { filePath: openDoc.fileName, content: openDoc.getText() };
    }

    // 3) openTextDocument: uses buffer if open, else loads from disk
    try {
      const doc = await vscode.workspace.openTextDocument(uri);
      if (!isMarkdownDoc(doc)) {
        vscode.window.showWarningMessage(t('share.notMarkdown'));
        return undefined;
      }
      return { filePath: doc.fileName, content: doc.getText() };
    } catch {
      try {
        const data = await vscode.workspace.fs.readFile(uri);
        return { filePath: uri.fsPath, content: Buffer.from(data).toString('utf-8') };
      } catch {
        vscode.window.showWarningMessage(t('share.noActiveFile'));
        return undefined;
      }
    }
  }

  if (!active) {
    vscode.window.showWarningMessage(t('share.noActiveFile'));
    return undefined;
  }
  if (!isMarkdownDoc(active)) {
    vscode.window.showWarningMessage(t('share.notMarkdown'));
    return undefined;
  }
  return { filePath: active.fileName, content: active.getText() };
}

/**
 * Re-read content for a file path right before publish (unsaved edits).
 */
export async function readMarkdownContentForPath(filePath: string): Promise<string | undefined> {
  const openDoc = vscode.workspace.textDocuments.find((d) => sameFsPath(d.fileName, filePath) || sameFsPath(d.uri.fsPath, filePath));
  if (openDoc) {
    return openDoc.getText();
  }
  try {
    const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
    return doc.getText();
  } catch {
    try {
      const data = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
      return Buffer.from(data).toString('utf-8');
    } catch {
      return undefined;
    }
  }
}

/**
 * Main share command handler — opens the share panel
 */
export async function shareActiveFile(context: vscode.ExtensionContext, uri?: vscode.Uri): Promise<void> {
  const resolved = await resolveMarkdownContent(uri);
  if (!resolved) {
    return;
  }
  SharePanel.show(context, resolved.filePath, resolved.content);
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

  const yes = t('share.deleteYes');
  const confirm = await vscode.window.showWarningMessage(
    t('share.deleteConfirm'),
    { modal: true },
    yes
  );

  if (confirm !== yes) {
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
