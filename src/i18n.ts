import * as vscode from 'vscode';

type Locale = 'zh' | 'en';

const messages: Record<Locale, Record<string, string>> = {
  zh: {
    'share.success': '分享成功！',
    'share.failed': '分享失败',
    'share.deleted': '已删除分享',
    'share.deleteConfirm': '确定要删除当前文件的分享链接吗？',
    'share.noRecord': '当前文件没有分享记录',
    'share.noActiveFile': '请先打开一个 Markdown 文件',
    'share.notMarkdown': '当前文件不是 Markdown 文件',
    'share.publishing': '正在分享...',
    'share.selectTemplate': '选择模板',
    'share.selectTheme': '选择主题',
    'share.linkCopied': '链接已复制到剪贴板',
    'share.openInBrowser': '在浏览器中打开',
    'share.copyLink': '复制链接',
    'share.temporary': '游客模式：链接将在 24 小时后过期',
    'share.update': '更新分享',
    'share.create': '新建分享',
    'token.placeholder': '输入 API Token（留空为游客模式）',
    'token.saved': 'Token 已保存',
    'token.cleared': 'Token 已清除',
    'token.set': '设置 Token',
    'token.clear': '清除 Token',
    'panel.title': '分享 Markdown',
    'panel.template': '模板',
    'panel.theme': '主题',
    'panel.publish': '分享',
    'panel.publishing': '分享中...',
    'panel.result.url': '分享链接',
    'panel.result.copy': '复制',
    'panel.result.open': '打开',
    'panel.result.temporary': '临时链接（24 小时有效）',
    'panel.guest': '游客模式',
    'panel.token': 'Token 模式',
    'panel.error.network': '网络错误，请检查连接',
    'panel.templateHint': '为你的页面挑选一个风格',
    'panel.themeLabel': '主题配色',
    'panel.words': '字',
    'panel.alreadyShared': '已分享',
    'panel.updateShare': '更新分享',
    'panel.result.updated': '分享已更新！',
    'panel.result.copied': '已复制！',
    'panel.result.permanent': '已绑定账号 · 长期有效',
    'panel.back': '返回',
    'panel.retry': '重试',
    'panel.error.title': '分享失败',
    'panel.mode.guest': '游客',
    'panel.mode.token': 'Token',
  },
  en: {
    'share.success': 'Shared successfully!',
    'share.failed': 'Share failed',
    'share.deleted': 'Share deleted',
    'share.deleteConfirm': 'Are you sure you want to delete the share link for this file?',
    'share.noRecord': 'No share record for current file',
    'share.noActiveFile': 'Please open a Markdown file first',
    'share.notMarkdown': 'Current file is not a Markdown file',
    'share.publishing': 'Sharing...',
    'share.selectTemplate': 'Select template',
    'share.selectTheme': 'Select theme',
    'share.linkCopied': 'Link copied to clipboard',
    'share.openInBrowser': 'Open in browser',
    'share.copyLink': 'Copy link',
    'share.temporary': 'Guest mode: link will expire in 24 hours',
    'share.update': 'Update share',
    'share.create': 'New share',
    'token.placeholder': 'Enter API Token (leave empty for guest mode)',
    'token.saved': 'Token saved',
    'token.cleared': 'Token cleared',
    'token.set': 'Set Token',
    'token.clear': 'Clear Token',
    'panel.title': 'Share Markdown',
    'panel.template': 'Template',
    'panel.theme': 'Theme',
    'panel.publish': 'Share',
    'panel.publishing': 'Sharing...',
    'panel.result.url': 'Share link',
    'panel.result.copy': 'Copy',
    'panel.result.open': 'Open',
    'panel.result.temporary': 'Temporary link (expires in 24h)',
    'panel.guest': 'Guest mode',
    'panel.token': 'Token mode',
    'panel.error.network': 'Network error, please check connection',
    'panel.templateHint': 'Pick a style for your page',
    'panel.themeLabel': 'Theme',
    'panel.words': 'words',
    'panel.alreadyShared': 'Shared',
    'panel.updateShare': 'Update share',
    'panel.result.updated': 'Share updated!',
    'panel.result.copied': 'Copied!',
    'panel.result.permanent': 'Linked to your account',
    'panel.back': 'Back',
    'panel.retry': 'Retry',
    'panel.error.title': 'Share failed',
    'panel.mode.guest': 'Guest',
    'panel.mode.token': 'Token',
  },
};

let currentLocale: Locale = 'en';

export function initLocale(): void {
  const lang = vscode.env.language;
  currentLocale = lang.startsWith('zh') ? 'zh' : 'en';
}

export function t(key: string): string {
  return messages[currentLocale][key] || messages['en'][key] || key;
}

export function getLocale(): Locale {
  return currentLocale;
}
