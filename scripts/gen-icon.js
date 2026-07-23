const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Markdown plugin icon — document + MD mark (distinct from HTML browser icon)
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="12%" y1="8%" x2="88%" y2="92%">
      <stop offset="0%" stop-color="#8B7CFF"/>
      <stop offset="50%" stop-color="#5B6CFF"/>
      <stop offset="100%" stop-color="#3B5BDB"/>
    </linearGradient>
    <linearGradient id="doc" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#EAF0FF"/>
    </linearGradient>
    <linearGradient id="badge" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4C8DFF"/>
      <stop offset="100%" stop-color="#2563EB"/>
    </linearGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#1E3A8A" flood-opacity="0.30"/>
    </filter>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#1E3A8A" flood-opacity="0.22"/>
    </filter>
  </defs>

  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <ellipse cx="150" cy="110" rx="190" ry="110" fill="#FFFFFF" opacity="0.16"/>

  <!-- document -->
  <g filter="url(#shadow)">
    <rect x="108" y="88" width="260" height="320" rx="30" fill="url(#doc)"/>
    <path d="M300 88 L368 156 H332 C314 156 300 142 300 124 Z" fill="#C7D2FE"/>
    <path d="M300 88 V124 C300 142 314 156 332 156 H368 Z" fill="#EEF2FF"/>
  </g>

  <!-- Markdown logo: M + down arrow -->
  <g fill="none" stroke="#3B5BDB" stroke-width="20" stroke-linecap="round" stroke-linejoin="round">
    <path d="M150 250 V170 L200 230 L250 170 V250"/>
    <path d="M278 170 V250"/>
    <path d="M278 210 L312 250 L346 210"/>
    <path d="M312 250 V170"/>
  </g>

  <!-- text lines -->
  <rect x="150" y="286" width="160" height="16" rx="8" fill="#9AAEF0"/>
  <rect x="150" y="320" width="128" height="16" rx="8" fill="#AFC0F5" opacity="0.9"/>
  <rect x="150" y="354" width="144" height="16" rx="8" fill="#C2CFF8" opacity="0.85"/>

  <!-- share arrow (up-right) -->
  <g filter="url(#soft)" fill="#FFFFFF">
    <path d="M352 292 L352 248 L396 248 L396 220 L456 270 L396 320 L396 292 Z"/>
  </g>

  <!-- link badge with chain -->
  <g filter="url(#soft)">
    <rect x="320" y="320" width="120" height="120" rx="30" fill="url(#badge)" stroke="#DBEAFE" stroke-width="7"/>
    <g transform="translate(380 380) rotate(-40)" fill="none" stroke="#FFFFFF" stroke-width="13" stroke-linecap="round">
      <rect x="-34" y="-12" width="36" height="24" rx="12"/>
      <rect x="-2" y="-12" width="36" height="24" rx="12"/>
    </g>
  </g>
</svg>`;

const activitySvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path fill="currentColor" d="M6.5 2.75h7.1L18.5 7.65V20.5A1.75 1.75 0 0 1 16.75 22.25h-10A1.75 1.75 0 0 1 5 20.5V4.5A1.75 1.75 0 0 1 6.75 2.75h-.25zm7.25 1.35V7.5h3.4L13.75 4.1z"/>
  <path fill="currentColor" d="M8 10.25v5.5h1.2v-3.35l1.55 2.2h.3l1.55-2.2v3.35H13.8v-5.5h-1.3l-1.55 2.25-1.55-2.25H8zm7.2 0v5.5h1.2v-2.15l.95 1.25h.3l.95-1.25v2.15h1.2v-5.5h-1.25l-1.05 1.5-1.05-1.5H15.2z"/>
</svg>`;

const root = path.join(__dirname, '..');
const outPng = path.join(root, 'media', 'icon.png');
const outSvg = path.join(root, 'media', 'activity-bar-icon.svg');

(async () => {
  await sharp(Buffer.from(svg)).png().toFile(outPng);
  fs.writeFileSync(outSvg, activitySvg, 'utf8');
  console.log('Wrote', outPng, fs.statSync(outPng).size, 'bytes');
  console.log('Wrote', outSvg);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
