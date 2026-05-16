const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'components');

const replacements = {
  'bg-\\[rgba\\(45,43,40,0\\.45\\)\\]': 'bg-secondary',
  'bg-\\[rgba\\(55,52,48,0\\.5\\)\\]': 'bg-secondary/80',
  'hover:bg-\\[rgba\\(55,52,48,0\\.5\\)\\]': 'hover:bg-secondary/80',
  'bg-\\[rgba\\(70,66,60,0\\.5\\)\\]': 'bg-muted',
  'hover:bg-\\[rgba\\(70,66,60,0\\.5\\)\\]': 'hover:bg-muted',
  'border-\\[rgba\\(120,112,100,0\\.2\\)\\]': 'border-border',
  'border-\\[rgba\\(120,112,100,0\\.15\\)\\]': 'border-border',
  'bg-\\[rgba\\(35,33,30,0\\.6\\)\\]': 'bg-card',
  'bg-\\[rgba\\(35,33,30,0\\.5\\)\\]': 'bg-card/80',
  'hover:bg-\\[rgba\\(60,57,52,0\\.3\\)\\]': 'hover:bg-secondary/60',
  'bg-\\[rgba\\(60,57,52,0\\.55\\)\\]': 'bg-secondary/90',
  'hover:bg-\\[rgba\\(45,43,40,0\\.45\\)\\]': 'hover:bg-secondary',
  'bg-\\[#252320\\]': 'bg-popover',
  'bg-\\[#1e1c1a\\]': 'bg-background',
  'bg-\\[#1a1a1a\\]': 'bg-background'
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  for (const [pattern, replacement] of Object.entries(replacements)) {
    const regex = new RegExp(pattern, 'g');
    content = content.replace(regex, replacement);
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walkDir(filePath);
    } else if (filePath.endsWith('.tsx')) {
      processFile(filePath);
    }
  }
}

walkDir(componentsDir);
console.log('Done!');
