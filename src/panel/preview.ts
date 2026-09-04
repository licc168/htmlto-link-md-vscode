import { marked, type Tokens } from 'marked';
import hljs from 'highlight.js/lib/common';
import * as fs from 'fs';
import * as path from 'path';
import { COMMON_TEMPLATE_STYLES, TEMPLATE_STYLES } from './generated/template-styles';
interface TemplateMeta {
  cardClass: string;
  extraClasses?: string[];
}

const TEMPLATE_META: Record<string, TemplateMeta> = {
    memo: { cardClass: 'card-memo' },
    popart: { cardClass: 'card-popart' },
    traditionalchinese: { cardClass: 'card-traditionalchinese' },
    coilnotebook: { cardClass: 'card-coilnotebook', extraClasses: ['is-long-content'] },
    purpleticket: { cardClass: 'card-purpleticket', extraClasses: ['purple-ticket-template'] },
    bytedance: { cardClass: 'card-bytedance' },
    warm: { cardClass: 'card-warm' },
    alibaba: { cardClass: 'card-alibaba' },
    notebook: { cardClass: 'card-notebook' },
    darktech: { cardClass: 'card-darktech' },
    fairytale: { cardClass: 'card-fairytale' },
    boardgamestyle: { cardClass: 'card-boardgame' },
    cyberpunk: { cardClass: 'card-cyberpunk' },
    glassmorphism: { cardClass: 'card-glassmorphism' },
    neonglow: { cardClass: 'card-neonglow' },
    vintagenewspaper: { cardClass: 'card-vintagenewspaper' },
    handwrittennote: { cardClass: 'card-handwrittennote' },
    vintagemap: { cardClass: 'card-vintagemap' },
    blueprint: { cardClass: 'card-blueprint' },
    botanical: { cardClass: 'card-botanical' },
    sketch: { cardClass: 'card-sketch' },
    terminal: { cardClass: 'card-terminal' },
    retro: { cardClass: 'card-retro' },
    ayulight: { cardClass: 'card-ayulight' },
    bauhaus: { cardClass: 'card-bauhaus' },
    greensimple: { cardClass: 'card-greensimple' },
    maximalism: { cardClass: 'card-maximalism' },
    neobrutalism: { cardClass: 'card-neobrutalism' },
    newsprint: { cardClass: 'card-newsprint' },
    organic: { cardClass: 'card-organic' },
    playfulgeometric: { cardClass: 'card-playfulgeometric' },
    professional: { cardClass: 'card-professional' },
    plain: { cardClass: 'card-plain' },
};
const FRAME_STYLES = `
* { box-sizing: border-box; }
html, body { margin: 0; min-height: 100%; }
body.share-page { min-height: 100vh; padding: 0; background: #f1f5f9; color: #1e293b; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
.share-layout { min-height: 100vh; padding: 18px 12px 30px; }
.share-export-target { display: flex; justify-content: center; min-width: 0; }
.share-stage, .share-card-shell { display: flex; justify-content: center; width: 100%; min-width: 0; }
.share-card-shell .card { width: min(100%, 48rem); max-width: 48rem; margin: 0 auto; }
.share-card-shell .card:not(.card-plain) { background: #fff; border-radius: 16px; box-shadow: 0 18px 45px rgba(15, 23, 42, .14); }
.share-card-shell .card.card-plain { border-radius: 0; box-shadow: none; }
.share-card-shell .card-content-inner img { max-width: 100%; height: auto; }
.markdown-table-wrapper { width: 100%; max-width: 100%; overflow-x: auto; padding-bottom: 4px; }
.markdown-table-wrapper > table { min-width: 100%; }
.preview-empty { padding: 36px 20px; color: #64748b; text-align: center; }
.share-card-shell .card-content-inner { overflow-wrap: anywhere; word-break: break-word; }
.share-card-shell .card-content-inner pre, .share-card-shell .card-content-inner .markdown-table-wrapper { max-width: 100%; overflow-x: auto; }
.share-card-shell .card-content-inner .markdown-table-wrapper :is(th, td) { min-width: 7.5rem; overflow-wrap: normal; word-break: normal; vertical-align: top; }
.share-page-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(180px, 220px); gap: 18px; align-items: start; width: min(100%, 70rem); margin: 0 auto; }
.share-export-target { display: flex; justify-content: center; min-width: 0; }
.share-toc { position: fixed; top: 18px; right: max(12px, calc((100vw - 70rem) / 2)); z-index: 20; width: 220px; max-height: calc(100vh - 36px); overflow: auto; padding: 12px; border: 1px solid rgba(100, 116, 139, .24); border-radius: 10px; background: rgba(255, 255, 255, .94); color: #334155; box-shadow: 0 10px 24px rgba(15, 23, 42, .08); }
.share-toc-title { display: block; margin-bottom: 9px; color: #334155; font-size: 13px; font-weight: 700; }
.share-toc-nav { display: grid; gap: 3px; }
.share-toc-link { display: block; padding: 6px 7px; padding-left: calc(7px + (var(--toc-level) - 1) * 12px); border-radius: 6px; color: #64748b; font-size: 12px; line-height: 1.45; text-decoration: none; overflow-wrap: anywhere; }
.share-toc-link:hover, .share-toc-link:focus-visible { background: rgba(99, 102, 241, .1); color: #4338ca; outline: none; }
.share-card-shell .card h1, .share-card-shell .card h2, .share-card-shell .card h3, .share-card-shell .card h4, .share-card-shell .card h5, .share-card-shell .card h6 { scroll-margin-top: 16px; }
.card .hljs-code-block { position: relative; margin: 1em 0; border-radius: 8px; overflow: hidden; border: 1px solid rgba(0,0,0,.1); background: #f6f8fa; }
.card .hljs-lang-label { padding: 4px 12px; font: 600 11px/1.6 'SF Mono', Consolas, monospace; letter-spacing: .05em; text-transform: uppercase; color: #57606a; background: #eaeef2; border-bottom: 1px solid rgba(0,0,0,.08); }
.card .hljs-code-block pre { margin: 0; padding: 14px 16px; overflow-x: auto; background: transparent; }
.card .hljs-code-block pre code.hljs { display: block; padding: 0; background: #fff; color: #24292e; font: 13px/1.6 'SF Mono', Consolas, monospace; white-space: pre; }
.card .hljs-comment, .card .hljs-quote { color: #6e7781; font-style: italic; }
.card .hljs-keyword, .card .hljs-selector-tag { color: #cf222e; }
.card .hljs-number, .card .hljs-literal, .card .hljs-variable, .card .hljs-attr { color: #0550ae; }
.card .hljs-string { color: #0a3069; }
.card .hljs-title, .card .hljs-section, .card .hljs-name { color: #8250df; }
.card .hljs-built_in, .card .hljs-type { color: #953800; }
.card .hljs-symbol, .card .hljs-bullet, .card .hljs-meta { color: #116329; }
.card.card-darktech .hljs-code-block, .card [class*="dark"] .hljs-code-block, .dark-mode .hljs-code-block { background: #161b22; border-color: rgba(255,255,255,.1); }
.card.card-darktech .hljs-lang-label, .card [class*="dark"] .hljs-lang-label, .dark-mode .hljs-lang-label { background: #21262d; color: #8b949e; }
.card.card-darktech .hljs-code-block pre code.hljs, .card [class*="dark"] .hljs-code-block pre code.hljs, .dark-mode .hljs-code-block pre code.hljs { background: #161b22; color: #c9d1d9; }
`;
const PREVIEW_OVERRIDES = `
html, body { width: 100%; max-width: none; overflow-x: auto; overflow-y: auto; }
.share-layout, .share-page-grid, .share-export-target, .share-stage, .share-card-shell, .share-card-shell .card, .share-card-shell .card-content, .share-card-shell .card-content-inner { min-width: 0; }
.share-page-grid { width: min(100%, 70rem); max-width: 70rem; }
.share-page-grid.share-page-grid-no-toc { grid-template-columns: minmax(0, 1fr); }
.share-toc { position: fixed; top: 18px; right: max(12px, calc((100vw - 70rem) / 2)); z-index: 20; }
.share-card-shell .card { overflow: visible; }
.share-card-shell .card-content, .share-card-shell .card-content-inner { overflow: visible; }
.share-card-shell .card-content-inner pre, .share-card-shell .card-content-inner .markdown-table-wrapper { max-width: 100%; overflow-x: auto; overscroll-behavior-inline: contain; }
.share-card-shell .card-content-inner .mermaid { display: block; max-width: 100%; margin: 1.2em 0; overflow-x: auto; overflow-y: visible; text-align: center; }
.share-card-shell .card-content-inner .mermaid svg { display: block; width: auto !important; max-width: none !important; height: auto; margin: 0 auto; }
.share-card-shell .card-content-inner .mermaid-error { padding: 12px 14px; border: 1px solid rgba(220, 38, 38, .28); border-radius: 8px; background: rgba(254, 226, 226, .72); color: #b91c1c; overflow-wrap: anywhere; text-align: left; }
@media (max-width: 720px) {
  .share-page-grid { display: block; }
  .share-toc { position: static; width: auto; max-height: none; margin-bottom: 16px; }
}
`;
function escapeHtml(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function safeUrl(value: string, image = false): string {
    const url = value.trim();
    if (/^(https?:|mailto:|#|\/)/i.test(url))
        return url;
    if (image && /^data:image\//i.test(url))
        return url;
    return '#';
}
function imageMime(filePath: string): string | undefined {
    const ext = path.extname(filePath).toLowerCase();
    const mimeByExt = {
        '.avif': 'image/avif',
        '.bmp': 'image/bmp',
        '.gif': 'image/gif',
        '.ico': 'image/x-icon',
        '.jpeg': 'image/jpeg',
        '.jpg': 'image/jpeg',
        '.png': 'image/png',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp',
    };
    return (mimeByExt as Record<string, string>)[ext];
}
function detectImageMime(data: Buffer): string | undefined {
    if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff)
        return 'image/jpeg';
    if (data.length >= 4 && data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47)
        return 'image/png';
    if (data.length >= 3 && data[0] === 0x47 && data[1] === 0x49 && data[2] === 0x46)
        return 'image/gif';
    if (data.length >= 12 && data.subarray(0, 4).toString('ascii') === 'RIFF' && data.subarray(8, 12).toString('ascii') === 'WEBP')
        return 'image/webp';
    return undefined;
}
function resolveLocalImage(sourceFilePath: string, target: string): string | undefined {
    if (/^(https?:|data:|blob:|file:|\/\/)/i.test(target.trim()))
        return undefined;
    const cleanTarget = target.trim().replace(/^\.\//, '');
    const candidates = [
        path.resolve(path.dirname(sourceFilePath), target.trim()),
        path.resolve(path.dirname(sourceFilePath), cleanTarget),
    ];
    for (const candidate of candidates) {
        try {
            if (fs.statSync(candidate).isFile() && imageMime(candidate))
                return candidate;
        }
        catch {
            // Try the next path candidate.
        }
    }
    return undefined;
}
function dataUriForImage(filePath: string): string | undefined {
    try {
        const stat = fs.statSync(filePath);
        if (stat.size > 5 * 1024 * 1024)
            return undefined;
        const data = fs.readFileSync(filePath);
        const mime = detectImageMime(data) || imageMime(filePath);
        if (!mime)
            return undefined;
        return `data:${mime};base64,${data.toString('base64')}`;
    }
    catch {
        return undefined;
    }
}
function rewriteLocalImagesForPreview(markdown: string, sourceFilePath: string): string {
    const result = markdown.replace(/!\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g, (full, target, alt) => {
        const resolved = resolveLocalImage(sourceFilePath, target);
        const dataUri = resolved ? dataUriForImage(resolved) : undefined;
        return dataUri ? `![${alt || ''}](${dataUri})` : full;
    });
    return result.replace(/!\[([^\]]*)\]\(\s*<?([^)>\s]+)>?\s*\)/g, (full, alt, target) => {
        const resolved = resolveLocalImage(sourceFilePath, target);
        const dataUri = resolved ? dataUriForImage(resolved) : undefined;
        return dataUri ? `![${alt}](${dataUri})` : full;
    });
}

function addOrderedListIndices(html: string): string {
    const tagRegex = /<\/?([a-zA-Z0-9]+)([^>]*)>/g;
    const stack: Array<{ type: 'ol' | 'ul'; index: number }> = [];
    let result = '';
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = tagRegex.exec(html)) !== null) {
        const fullTag = match[0];
        const isClosing = fullTag.startsWith('</');
        const tagName = match[1].toLowerCase();
        const attrs = match[2];
        const matchStart = match.index;
        result += html.slice(lastIndex, matchStart);
        lastIndex = matchStart + fullTag.length;
        if (tagName === 'ol') {
            if (isClosing) {
                if (stack.length > 0 && stack[stack.length - 1].type === 'ol') {
                    stack.pop();
                }
                result += fullTag;
            } else {
                const startMatch = attrs.match(/\bstart\s*=\s*["']?(\d+)["']?/i);
                const startIndex = startMatch ? parseInt(startMatch[1], 10) : 1;
                stack.push({ type: 'ol', index: Number.isFinite(startIndex) ? startIndex : 1 });
                result += fullTag;
            }
        } else if (tagName === 'ul') {
            if (isClosing) {
                if (stack.length > 0 && stack[stack.length - 1].type === 'ul') {
                    stack.pop();
                }
                result += fullTag;
            } else {
                stack.push({ type: 'ul', index: 0 });
                result += fullTag;
            }
        } else if (tagName === 'li' && !isClosing) {
            const currentList = stack.length > 0 ? stack[stack.length - 1] : null;
            if (currentList && currentList.type === 'ol' && !/\bdata-index\s*=/i.test(attrs)) {
                const itemIndex = currentList.index++;
                result += `<li data-index="${itemIndex}"${attrs}>`;
            } else {
                result += fullTag;
            }
        } else {
            result += fullTag;
        }
    }
    result += html.slice(lastIndex);
    return result;
}

function addTableWrappers(html: string): string {
    return html.replace(/<table>/g, '<div class="markdown-table-wrapper"><table>').replace(/<\/table>/g, '</table></div>');
}
function escapeTocLabel(value: string): string {
    return escapeHtml(value.replace(/\s+/g, ' ').trim());
}
function textFromTokens(tokens: any[]): string {
    return tokens.map((token) => {
        const nested = token.tokens;
        if (nested)
            return textFromTokens(nested);
        const text = token.text;
        return typeof text === 'string' ? text : token.raw;
    }).join('');
}
function slugifyHeading(value: string, index: number): string {
    const slug = value
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\u3400-\u9fff-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return slug || `section-${index + 1}`;
}
function resolveThemeClass(theme?: string): string {
    if (!theme)
        return '';
    return theme.endsWith('-mode') ? theme : `${theme}-mode`;
}
interface TocItem {
  id: string;
  label: string;
  level: number;
}

function createRenderer(tocItems: TocItem[]): any {
    const renderer = new marked.Renderer() as any;
    const usedHeadingIds = new Map();
    let headingIndex = 0;
    renderer.heading = ({ tokens, depth }: { tokens: any[]; depth: number }) => {
        const body = marked.Parser.parseInline(tokens);
        const label = textFromTokens(tokens).trim();
        if (!label)
            return `<h${depth}>${body}</h${depth}>`;
        const baseId = slugifyHeading(label, headingIndex);
        const count = (usedHeadingIds.get(baseId) || 0) + 1;
        usedHeadingIds.set(baseId, count);
        const id = count === 1 ? baseId : `${baseId}-${count}`;
        headingIndex += 1;
        tocItems.push({ id, label, level: depth });
        return `<h${depth} id="${escapeHtml(id)}">${body}</h${depth}>`;
    };
    renderer.code = ({ text, lang }: { text: string; lang?: string }) => {
        const requestedLanguage = (lang || '').trim().toLowerCase();
        const isMermaid = requestedLanguage === 'mermaid';
        const language = requestedLanguage && (isMermaid || Boolean(hljs.getLanguage(requestedLanguage)))
            ? requestedLanguage
            : '';
        let highlighted = escapeHtml(text);
        if (language && !isMermaid) {
            highlighted = hljs.highlight(text, { language, ignoreIllegals: true }).value;
        }
        else if (text.trim()) {
            highlighted = isMermaid ? escapeHtml(text) : hljs.highlightAuto(text).value;
        }
        const label = language ? `<div class="hljs-lang-label">${escapeHtml(language)}</div>` : '';
        return `<div class="hljs-code-block">${label}<pre><code class="hljs${language ? ` language-${escapeHtml(language)}` : ''}">${highlighted}</code></pre></div>`;
    };
    renderer.link = ({ href, title, tokens }: { href: string; title?: string | null; tokens: any[] }) => {
        const text = marked.Parser.parseInline(tokens);
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
        return `<a href="${escapeHtml(safeUrl(href))}"${titleAttr}>${text}</a>`;
    };
    renderer.image = ({ href, title, text }: { href: string; title?: string | null; text: string }) => {
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
        return `<img src="${escapeHtml(safeUrl(href, true))}" alt="${escapeHtml(text || '')}"${titleAttr}>`;
    };
    
    renderer.list = function (token: any): string {
        const ordered = Boolean(token.ordered);
        const start = token.start;
        const startIndex = (ordered && typeof start === 'number') ? start : 1;
        let body = '';
        for (let i = 0; i < token.items.length; i++) {
            const item = token.items[i];
            if (ordered) {
                item._index = startIndex + i;
            }
            body += this.listitem(item);
        }
        const tag = ordered ? 'ol' : 'ul';
        const startAttr = ordered && start && start !== 1 ? ` start="${start}"` : '';
        return `<${tag}${startAttr}>\n${body}</${tag}>\n`;
    };
    renderer.listitem = function (item: any): string {
        const indexAttr = item._index !== undefined ? ` data-index="${item._index}"` : '';
        return `<li${indexAttr}>${this.parser.parse(item.tokens)}</li>\n`;
    };
    return renderer;
}
export interface PreviewLabels {
  tocTitle?: string;
  tocAria?: string;
}

export async function renderMarkdownPreview(
  markdown: string,
  filePath: string,
  templateId: string,
  theme?: string,
  labels: PreviewLabels = {}
): Promise<string> {
    const tocItems: TocItem[] = [];
    const renderer = createRenderer(tocItems);
    const previewMarkdown = rewriteLocalImagesForPreview(markdown, filePath);
    const rendered = await marked.parse(previewMarkdown, { gfm: true, breaks: true, renderer });
    const content = addOrderedListIndices(addTableWrappers(rendered));
    const meta = TEMPLATE_META[templateId] || TEMPLATE_META.plain;
    const classes = ['card', meta.cardClass, resolveThemeClass(theme), ...(meta.extraClasses || [])].filter(Boolean).join(' ');
    const css = `${FRAME_STYLES}\n${COMMON_TEMPLATE_STYLES}\n${TEMPLATE_STYLES[templateId] || TEMPLATE_STYLES.plain}\n${PREVIEW_OVERRIDES}`;
    const tocTitle = labels.tocTitle || 'Table of contents';
    const tocAria = labels.tocAria || 'Document table of contents';
    const toc = tocItems.length
        ? `<aside class="share-toc" aria-label="${escapeHtml(tocAria)}"><span class="share-toc-title">${escapeHtml(tocTitle)}</span><nav class="share-toc-nav" aria-label="${escapeHtml(tocAria)}">${tocItems.map((item) => `<a class="share-toc-link" data-htmlto-link-toc-link href="#${escapeHtml(item.id)}" style="--toc-level:${item.level}">${escapeTocLabel(item.label)}</a>`).join('')}</nav></aside>`
        : '';
    return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: http: https:; style-src 'unsafe-inline'; font-src data: http: https:; connect-src 'none'; frame-src 'none';"><style>${css}</style></head><body class="share-page"><main class="share-layout"><div class="share-page-grid${toc ? '' : ' share-page-grid-no-toc'}"><div class="share-export-target"><div class="share-stage"><div class="share-card-shell"><section class="${classes}" style="width:100%;max-width:100%;"><section class="card-content"><div class="card-content-inner">${content || '<p class="preview-empty">暂无内容</p>'}</div></section></section></div></div></div>${toc}</div></main></body></html>`;
}
