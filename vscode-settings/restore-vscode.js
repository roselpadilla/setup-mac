#!/usr/bin/env node

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// 1. Check macOS
if (process.platform !== 'darwin') {
  console.error('Error: This script is for macOS only.');
  process.exit(1);
}

const scriptDir = __dirname;

// 2. Check source files exist
const required = [
  'settings.json',
  'keybindings.json',
  path.join('snippets', 'global.code-snippets'),
  'extensions.txt',
];
for (const f of required) {
  if (!fs.existsSync(path.join(scriptDir, f))) {
    console.error(`Error: Missing file: ${f}`);
    process.exit(1);
  }
}

// 3. Check code CLI
try {
  execSync('which code', { stdio: 'pipe' });
} catch {
  console.error('Error: `code` CLI not found.');
  console.error('Open VS Code → Command Palette → "Shell Command: Install \'code\' command in PATH"');
  process.exit(1);
}

const userDir = path.join(os.homedir(), 'Library', 'Application Support', 'Code', 'User');

// 4. Copy settings and keybindings
fs.mkdirSync(userDir, { recursive: true });
fs.copyFileSync(path.join(scriptDir, 'settings.json'), path.join(userDir, 'settings.json'));
console.log('✓ Copied settings.json');
fs.copyFileSync(path.join(scriptDir, 'keybindings.json'), path.join(userDir, 'keybindings.json'));
console.log('✓ Copied keybindings.json');

// 5. Copy snippets
const snippetsDir = path.join(userDir, 'snippets');
fs.mkdirSync(snippetsDir, { recursive: true });
fs.copyFileSync(
  path.join(scriptDir, 'snippets', 'global.code-snippets'),
  path.join(snippetsDir, 'global.code-snippets')
);
console.log('✓ Copied snippets/global.code-snippets');

// 6. Install extensions
const extensions = fs.readFileSync(path.join(scriptDir, 'extensions.txt'), 'utf8')
  .split('\n')
  .map(e => e.trim())
  .filter(Boolean);

console.log(`\nInstalling ${extensions.length} extensions...`);
for (const ext of extensions) {
  process.stdout.write(`  Installing ${ext}... `);
  const result = spawnSync('code', ['--install-extension', ext], { encoding: 'utf8' });
  if (result.status === 0) {
    console.log('done');
  } else {
    console.log(`FAILED\n${result.stderr || result.stdout}`);
  }
}

// 7. Done
console.log('\nVS Code settings restored successfully.');
console.log('VS Code picks up settings.json and keybindings.json live — no restart needed.');
