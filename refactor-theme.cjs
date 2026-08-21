const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const replaceRules = [
  // Backgrounds
  { pattern: /bg-slate-950\/40/g, replacement: 'bg-surface' },
  { pattern: /bg-slate-950\/60/g, replacement: 'bg-surface-alt' },
  { pattern: /bg-slate-950\/80/g, replacement: 'bg-overlay' },
  { pattern: /bg-slate-950\/90/g, replacement: 'bg-overlay' },
  { pattern: /bg-slate-950\/95/g, replacement: 'bg-overlay' },
  { pattern: /bg-slate-900\/50/g, replacement: 'bg-surface' },
  { pattern: /(?<!-)bg-slate-900(?!\/)/g, replacement: 'bg-surface' },
  { pattern: /(?<!-)bg-slate-950(?!\/)/g, replacement: 'bg-surface' },
  { pattern: /bg-white\/5/g, replacement: 'bg-surface-alt' },
  { pattern: /bg-white\/10/g, replacement: 'bg-surface-alt' },
  
  // Hover Backgrounds
  { pattern: /hover:bg-white\/5/g, replacement: 'hover:bg-surface-hover' },
  { pattern: /hover:bg-white\/10/g, replacement: 'hover:bg-surface-hover' },
  
  // Borders
  { pattern: /border-white\/5/g, replacement: 'border-subtle' },
  { pattern: /border-white\/10/g, replacement: 'border-default' },
  { pattern: /border-white\/20/g, replacement: 'border-default' },
  { pattern: /border-slate-800/g, replacement: 'border-default' },
  { pattern: /border-slate-100/g, replacement: 'border-subtle' },
  { pattern: /divide-white\/5/g, replacement: 'divide-subtle' },

  // Text colors
  { pattern: /(?<!(?:hover|focus|active):)text-white/g, replacement: 'text-primary dark:text-white' },
  { pattern: /(?<!(?:hover|focus|active):)text-slate-100/g, replacement: 'text-primary' },
  { pattern: /(?<!(?:hover|focus|active):)text-slate-300/g, replacement: 'text-secondary' },
  { pattern: /(?<!(?:hover|focus|active):)text-slate-400/g, replacement: 'text-muted' },
  { pattern: /(?<!(?:hover|focus|active):)text-slate-500/g, replacement: 'text-muted' },

  // Hover text colors
  { pattern: /hover:text-white/g, replacement: 'hover:text-primary dark:hover:text-white' },
  { pattern: /hover:text-slate-100/g, replacement: 'hover:text-primary' },
  { pattern: /hover:text-slate-300/g, replacement: 'hover:text-secondary' },
];

let filesModified = 0;

walkDir(srcDir, function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    replaceRules.forEach(rule => {
      content = content.replace(rule.pattern, rule.replacement);
    });

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      filesModified++;
      console.log(`Updated: ${filePath}`);
    }
  }
});

console.log(`\nTotal files modified: ${filesModified}`);
