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
  { id: 'cyberpunk', name: 'Cyberpunk' },
  { id: 'glassmorphism', name: 'Glassmorphism' },
  { id: 'terminal', name: 'Terminal' },
  { id: 'bauhaus', name: 'Bauhaus' },
  { id: 'newspaper', name: 'Newspaper' },
  { id: 'magazine', name: 'Magazine' },
  { id: 'academic', name: 'Academic' },
  { id: 'minimal', name: 'Minimal' },
  { id: 'elegant', name: 'Elegant' },
  { id: 'modern', name: 'Modern' },
  { id: 'retro', name: 'Retro' },
  { id: 'nature', name: 'Nature' },
  { id: 'ocean', name: 'Ocean' },
  { id: 'sunset', name: 'Sunset' },
  { id: 'forest', name: 'Forest' },
  { id: 'desert', name: 'Desert' },
  { id: 'aurora', name: 'Aurora' },
  { id: 'neon', name: 'Neon' },
  { id: 'pastel', name: 'Pastel' },
  { id: 'monochrome', name: 'Monochrome' },
  { id: 'gradient', name: 'Gradient' },
  { id: 'shadow', name: 'Shadow' },
  { id: 'border', name: 'Border' },
  { id: 'card', name: 'Card' },
  { id: 'timeline', name: 'Timeline' },
  { id: 'notion', name: 'Notion' },
  { id: 'github', name: 'GitHub' },
  { id: 'medium', name: 'Medium' },
];

export const DEFAULT_API_BASE_URL = 'https://htmlto.link';
export const DEFAULT_TEMPLATE = 'plain';

export interface ShareRecord {
  slug: string;
  updateToken: string;
  url: string;
}

export interface CreateShareResponse {
  success: boolean;
  slug: string;
  url: string;
  updateToken: string;
  temporary?: boolean;
  expiresAt?: string;
}
