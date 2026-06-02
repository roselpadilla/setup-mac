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
  'com.googlecode.iterm2.plist',
  '.zshrc',
  '.zprofile',
];
for (const f of required) {
  if (!fs.existsSync(path.join(scriptDir, f))) {
    console.error(`Error: Missing file: ${f}`);
    process.exit(1);
  }
}

// 3. Warn if iTerm2 is running
try {
  const result = spawnSync('pgrep', ['-x', 'iTerm2'], { encoding: 'utf8' });
  if (result.status === 0 && result.stdout.trim()) {
    console.warn('Warning: iTerm2 is currently running. Please quit iTerm2 before restoring settings,');
    console.warn('otherwise your preferences may be overwritten when it exits.');
    console.warn('Quit iTerm2 now and re-run this script.\n');
    process.exit(1);
  }
} catch {
  // pgrep not available, skip check
}

// 4. Import iTerm2 plist
console.log('Importing iTerm2 preferences...');
const importResult = spawnSync(
  'defaults',
  ['import', 'com.googlecode.iterm2', path.join(scriptDir, 'com.googlecode.iterm2.plist')],
  { encoding: 'utf8' }
);
if (importResult.status !== 0) {
  console.error('Error: Failed to import iTerm2 preferences.');
  console.error(importResult.stderr || importResult.stdout);
  process.exit(1);
}
console.log('✓ iTerm2 preferences imported');

// 5. Back up and copy .zshrc and .zprofile
const home = os.homedir();

for (const file of ['.zshrc', '.zprofile']) {
  const dest = path.join(home, file);
  if (fs.existsSync(dest)) {
    const bak = dest + '.bak';
    fs.copyFileSync(dest, bak);
    console.log(`✓ Backed up existing ${file} → ${file}.bak`);
  }
  fs.copyFileSync(path.join(scriptDir, file), dest);
  console.log(`✓ Copied ${file} to ~/`);
}

// 6. Check oh-my-zsh
if (!fs.existsSync(path.join(home, '.oh-my-zsh'))) {
  console.log('\nNote: oh-my-zsh is not installed. Install it with:');
  console.log('  sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"');
}

// 7. Done
console.log('\niTerm2 settings restored successfully.');
console.log('Relaunch iTerm2 to apply the new preferences.');
