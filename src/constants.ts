export interface TemplateOption {
  id: string;
  name: string;
  themes?: string[];
}

export const TEMPLATES: TemplateOption[] = [
  { id: 'plain', name: 'Plain' },
  { id: 'memo', name: 'Memo', themes: ['bright-mode', 'dark-mode'] },
  { id: 'popart', name: 'Pop Art', themes: ['candy', 'mint', 'purple', 'yellow', 'hot-red', 'forest-green', 'ocean-blue', 'pink-blue', 'neon-pink', 'retro-orange'] },
  { id: 'traditionalchinese', name: 'Traditional Chinese' },
  { id: 'coilnotebook', name: 'Coil Notebook', themes: ['blue', 'pink', 'mint', 'yellow'] },
  { id: 'purpleticket', name: 'Purple Xiaohongshu' },
  { id: 'bytedance', name: 'ByteDance' },
  { id: 'warm', name: 'Warm' },
  { id: 'alibaba', name: 'Alibaba Orange' },
  { id: 'notebook', name: 'Notebook' },
  { id: 'darktech', name: 'Dark Tech' },
  { id: 'fairytale', name: 'Fairy Tale' },
  { id: 'boardgamestyle', name: 'Boardgame' },
  { id: 'cyberpunk', name: 'Cyberpunk' },
  { id: 'glassmorphism', name: 'Glassmorphism' },
  { id: 'neonglow', name: 'Neon Glow' },
  { id: 'vintagenewspaper', name: 'Vintage Newspaper' },
  { id: 'handwrittennote', name: 'Handwritten Note' },
  { id: 'vintagemap', name: 'Vintage Map' },
  { id: 'blueprint', name: 'Blueprint' },
  { id: 'botanical', name: 'Botanical' },
  { id: 'sketch', name: 'Sketch' },
  { id: 'terminal', name: 'Terminal' },
  { id: 'retro', name: 'Retro Win95' },
  { id: 'ayulight', name: 'Ayu Light' },
  { id: 'bauhaus', name: 'Bauhaus' },
  { id: 'greensimple', name: 'Fresh Green' },
  { id: 'maximalism', name: 'Maximalism' },
  { id: 'neobrutalism', name: 'Neo Brutalism' },
  { id: 'newsprint', name: 'Newsprint' },
  { id: 'organic', name: 'Wabi-Sabi Ceramic' },
  { id: 'playfulgeometric', name: 'Playful Geometric' },
  { id: 'professional', name: 'Professional' },
];

export const DEFAULT_API_BASE_URL = 'https://htmlto.link';
export const DEFAULT_TEMPLATE = 'plain';

export interface ShareRecord {
  slug: string;
  updateToken: string;
  url: string;
  templateId?: string;
  theme?: string;
}

export interface CreateShareResponse {
  success: boolean;
  slug: string;
  url: string;
  updateToken: string;
  temporary?: boolean;
  expiresAt?: string;
}
