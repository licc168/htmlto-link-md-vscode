import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

const MAX_ASSET_BYTES = 20 * 1024 * 1024; // 20MB

const EXT_CONTENT_TYPE: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  avif: 'image/avif',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
};

export interface UploadedAssetRecord {
  url: string;
  mtime: number;
  size: number;
  uploadedAt: string;
  temporary: boolean;
  expiresAt?: string;
}

export interface LocalImageRewriteResult {
  markdown: string;
  uploaded: number;
  cached: number;
  skipped: number;
  failed: string[];
}

interface ImageRef {
  raw: string;
  target: string;
  alt: string;
  kind: 'wiki' | 'md';
}

function isRemoteOrDataUrl(src: string): boolean {
  const value = src.trim();
  return /^(https?:|data:|blob:|file:|\/\/)/i.test(value) || value.startsWith('#');
}

function extOf(filePath: string): string {
  const base = path.basename(filePath);
  const idx = base.lastIndexOf('.');
  return idx < 0 ? '' : base.slice(idx + 1).toLowerCase();
}

function detectMimeFromMagicBytes(data: Buffer): string | null {
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) {
    return 'image/jpeg';
  }
  if (data.length >= 4 && data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47) {
    return 'image/png';
  }
  if (data.length >= 3 && data[0] === 0x47 && data[1] === 0x49 && data[2] === 0x46) {
    return 'image/gif';
  }
  if (
    data.length >= 12 &&
    data[0] === 0x52 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x46 &&
    data[8] === 0x57 && data[9] === 0x45 && data[10] === 0x42 && data[11] === 0x50
  ) {
    return 'image/webp';
  }
  return null;
}

function contentTypeForFile(filePath: string, data?: Buffer): string {
  if (data) {
    const detected = detectMimeFromMagicBytes(data);
    if (detected) return detected;
  }
  const ext = extOf(filePath);
  return EXT_CONTENT_TYPE[ext] || 'application/octet-stream';
}

function collectImageRefs(markdown: string): ImageRef[] {
  const refs: ImageRef[] = [];
  const wikiRe = /!\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g;
  let match: RegExpExecArray | null;
  while ((match = wikiRe.exec(markdown)) !== null) {
    const target = match[1].trim();
    if (target && !isRemoteOrDataUrl(target)) {
      refs.push({ raw: match[0], target, alt: (match[2] || '').trim(), kind: 'wiki' });
    }
  }

  const mdRe = /!\[([^\]]*)\]\(\s*<?([^)\s>]+)>?(?:\s+(?:"[^"]*"|'[^']*'))?\s*\)/g;
  while ((match = mdRe.exec(markdown)) !== null) {
    const target = match[2].trim();
    if (target && !isRemoteOrDataUrl(target)) {
      refs.push({ raw: match[0], target, alt: (match[1] || '').trim(), kind: 'md' });
    }
  }
  return refs;
}

function resolveLocalImagePath(sourceFilePath: string, target: string): string | null {
  const cleanTarget = target.replace(/^\.\//, '');
  const dir = path.dirname(sourceFilePath);
  const candidate1 = path.resolve(dir, target);
  if (fs.existsSync(candidate1) && fs.statSync(candidate1).isFile()) {
    return candidate1;
  }
  const candidate2 = path.resolve(dir, cleanTarget);
  if (fs.existsSync(candidate2) && fs.statSync(candidate2).isFile()) {
    return candidate2;
  }

  if (vscode.workspace.workspaceFolders) {
    for (const folder of vscode.workspace.workspaceFolders) {
      const candidateWs = path.resolve(folder.uri.fsPath, cleanTarget);
      if (fs.existsSync(candidateWs) && fs.statSync(candidateWs).isFile()) {
        return candidateWs;
      }
    }
  }

  return null;
}

function isImageFile(filePath: string): boolean {
  return Boolean(EXT_CONTENT_TYPE[extOf(filePath)]);
}

function fixFilenameExt(filename: string, mime: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (mime === 'image/jpeg' && ext !== '.jpg' && ext !== '.jpeg') {
    return filename.slice(0, filename.length - ext.length) + '.jpg';
  }
  if (mime === 'image/png' && ext !== '.png') {
    return filename.slice(0, filename.length - ext.length) + '.png';
  }
  if (mime === 'image/gif' && ext !== '.gif') {
    return filename.slice(0, filename.length - ext.length) + '.gif';
  }
  if (mime === 'image/webp' && ext !== '.webp') {
    return filename.slice(0, filename.length - ext.length) + '.webp';
  }
  return filename;
}

const ASSETS_CACHE_KEY = 'htmlToLinkMd.uploadedAssets';

function getUploadedAssetsCache(context: vscode.ExtensionContext): Record<string, UploadedAssetRecord> {
  return context.globalState.get<Record<string, UploadedAssetRecord>>(ASSETS_CACHE_KEY, {});
}

async function saveUploadedAssetsCache(
  context: vscode.ExtensionContext,
  cache: Record<string, UploadedAssetRecord>
): Promise<void> {
  await context.globalState.update(ASSETS_CACHE_KEY, cache);
}

function getCachedUrl(record: UploadedAssetRecord | undefined, stat: fs.Stats): string | null {
  if (!record || record.mtime !== stat.mtimeMs || record.size !== stat.size) return null;
  if (record.temporary) {
    if (!record.expiresAt || Date.parse(record.expiresAt) <= Date.now()) return null;
  }
  return record.url;
}

async function uploadAsset(
  apiBaseUrl: string,
  apiToken: string | undefined,
  filePath: string,
  data: Buffer
): Promise<{ url: string; temporary: boolean; expiresAt?: string }> {
  const base = apiBaseUrl.replace(/\/+$/, '');
  const mime = contentTypeForFile(filePath, data);
  const sendFilename = fixFilenameExt(path.basename(filePath), mime);
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': mime,
    'X-Filename': sendFilename,
  };
  if (apiToken) headers.Authorization = `Bearer ${apiToken}`;

  let res: Response;
  try {
    res = await fetch(`${base}/api/assets`, {
      method: 'POST',
      headers,
      body: data,
    });
  } catch (err: unknown) {
    throw new Error('Network error uploading asset: ' + (err instanceof Error ? err.message : String(err)));
  }

  let response: {
    success?: boolean;
    url?: string;
    error?: string;
    temporary?: boolean;
    expiresAt?: string;
  } = {};
  try {
    response = (await res.json()) as typeof response;
  } catch {
    throw new Error('Invalid JSON response from server (' + res.status + ')');
  }

  if (res.status >= 400 || !response.success || !response.url) {
    throw new Error(response.error || 'Asset upload failed (' + res.status + ')');
  }

  return {
    url: response.url,
    temporary: response.temporary ?? !apiToken,
    expiresAt: response.expiresAt,
  };
}

function escapeMdAlt(alt: string): string {
  return alt.replace(/[[\]]/g, '');
}

export async function rewriteLocalImagesForShare(
  context: vscode.ExtensionContext,
  apiBaseUrl: string,
  apiToken: string | undefined,
  sourceFilePath: string,
  markdown: string,
  onProgress?: (done: number, total: number) => void
): Promise<LocalImageRewriteResult> {
  const refs = collectImageRefs(markdown);
  if (refs.length === 0) {
    return { markdown, uploaded: 0, cached: 0, skipped: 0, failed: [] };
  }

  const cache = getUploadedAssetsCache(context);
  let cacheUpdated = false;

  const urlByTarget = new Map<string, string>();
  const uniqueTargets = [...new Set(refs.map((ref) => ref.target))];
  let done = 0;

  const failed: string[] = [];
  let uploaded = 0;
  let cached = 0;
  let skipped = 0;

  for (const target of uniqueTargets) {
    const resolvedPath = resolveLocalImagePath(sourceFilePath, target);
    if (!resolvedPath || !isImageFile(resolvedPath)) {
      skipped += 1;
      done += 1;
      onProgress?.(done, uniqueTargets.length);
      continue;
    }

    let stat: fs.Stats;
    try {
      stat = fs.statSync(resolvedPath);
    } catch {
      skipped += 1;
      done += 1;
      onProgress?.(done, uniqueTargets.length);
      continue;
    }

    const cachedUrl = getCachedUrl(cache[resolvedPath], stat);
    if (cachedUrl) {
      cached += 1;
      urlByTarget.set(target, cachedUrl);
      done += 1;
      onProgress?.(done, uniqueTargets.length);
      continue;
    }

    try {
      if (stat.size > MAX_ASSET_BYTES) {
        failed.push(`${path.basename(resolvedPath)} (>20MB)`);
        done += 1;
        onProgress?.(done, uniqueTargets.length);
        continue;
      }

      const binary = fs.readFileSync(resolvedPath);
      const uploadedResult = await uploadAsset(apiBaseUrl, apiToken, resolvedPath, binary);

      urlByTarget.set(target, uploadedResult.url);
      uploaded += 1;
      cacheUpdated = true;

      cache[resolvedPath] = {
        url: uploadedResult.url,
        mtime: stat.mtimeMs,
        size: stat.size,
        uploadedAt: new Date().toISOString(),
        temporary: uploadedResult.temporary,
        expiresAt: uploadedResult.expiresAt,
      };
    } catch (err: unknown) {
      failed.push(`${path.basename(resolvedPath)}: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      done += 1;
      onProgress?.(done, uniqueTargets.length);
    }
  }

  if (cacheUpdated) {
    await saveUploadedAssetsCache(context, cache);
  }

  let next = markdown;
  for (const ref of [...refs].sort((a, b) => b.raw.length - a.raw.length)) {
    const url = urlByTarget.get(ref.target);
    if (!url) continue;
    const alt = ref.kind === 'wiki'
      ? escapeMdAlt(ref.alt && !/^\d+$/.test(ref.alt) ? ref.alt : '')
      : escapeMdAlt(ref.alt);
    next = next.split(ref.raw).join(`![${alt}](${url})`);
  }

  return { markdown: next, uploaded, cached, skipped, failed };
}
