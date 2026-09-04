import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.resolve(__dirname, '../out/panel/mermaid-webview.js');
if (fs.existsSync(outPath)) {
  console.log('mermaid-webview.js ready:', outPath);
} else {
  console.warn('Warning: out/panel/mermaid-webview.js not found');
}
