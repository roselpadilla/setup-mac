#!/usr/bin/env node
'use strict';

const { execSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// ── Helpers ──────────────────────────────────────────────────────────────────

function run(cmd, opts = {}) {
  return spawnSync('sh', ['-c', cmd], { encoding: 'utf8', ...opts });
}

function print(msg) {
  process.stdout.write(msg + '\n');
}

function warn(msg) {
  process.stderr.write('\x1b[33m⚠  ' + msg + '\x1b[0m\n');
}

function error(msg) {
  process.stderr.write('\x1b[31m✖  ' + msg + '\x1b[0m\n');
}

function ok(msg) {
  print('\x1b[32m✔  ' + msg + '\x1b[0m');
}

// ── 1. Platform check ─────────────────────────────────────────────────────────

if (process.platform !== 'darwin') {
  error('This script must be run on macOS.');
  process.exit(1);
}

// ── 2. Locate plist ───────────────────────────────────────────────────────────

const scriptDir = path.dirname(path.resolve(process.argv[1]));
const plistPath = path.join(scriptDir, 'com.crowdcafe.windowmagnet.plist');

if (!fs.existsSync(plistPath)) {
  error(`Plist not found: ${plistPath}`);
  error('Make sure com.crowdcafe.windowmagnet.plist is in the same directory as this script.');
  process.exit(1);
}

ok(`Found plist: ${plistPath}`);

// ── 3. Check if Magnet is running ─────────────────────────────────────────────

const pgrepResult = run('pgrep -x Magnet');
if (pgrepResult.status === 0) {
  warn('Magnet is currently running. Please quit Magnet before continuing.');
  warn('  → Right-click the Magnet icon in the menu bar and choose Quit.');
  print('');
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  readline.question('Press Enter once Magnet is closed to continue...', () => {
    readline.close();
    continueRestore();
  });
} else {
  continueRestore();
}

// ── 4. Import settings ────────────────────────────────────────────────────────

function continueRestore() {
  print('');
  print('Importing Magnet settings...');

  const result = run(`defaults import com.crowdcafe.windowmagnet "${plistPath}"`);
  if (result.status !== 0) {
    error('Failed to import settings.');
    error(result.stderr || result.stdout);
    process.exit(1);
  }

  ok('Settings imported successfully.');

  // ── 5. Read plist to check launchAtLogin ────────────────────────────────────

  let launchAtLogin = false;
  try {
    const plutil = run(`plutil -convert json -o - "${plistPath}"`);
    if (plutil.status === 0) {
      const prefs = JSON.parse(plutil.stdout);
      launchAtLogin = !!(prefs.launchAtLogin || prefs.SUEnableAutomaticChecks); // best-effort
    }
  } catch (_) {
    // non-fatal
  }

  // ── 6. Permission reminders ───────────────────────────────────────────────

  print('');
  print('─────────────────────────────────────────────────────');
  print('  PERMISSIONS CHECKLIST');
  print('─────────────────────────────────────────────────────');
  print('');
  print('Magnet requires Accessibility permission to manage windows.');
  print('');
  print('  1. Open System Settings');
  print('  2. Go to Privacy & Security → Accessibility');
  print('  3. Ensure Magnet is listed and its toggle is ON');
  print('     (If not listed, launch Magnet and it will prompt you.)');

  if (launchAtLogin) {
    print('');
    warn('Your settings include Launch at Login.');
    print('  To enable it on this Mac:');
    print('  1. Open System Settings');
    print('  2. Go to General → Login Items');
    print('  3. Click + and add Magnet');
  }

  // ── 7. Success ────────────────────────────────────────────────────────────

  print('');
  print('─────────────────────────────────────────────────────');
  ok('All done! Now relaunch Magnet to apply your settings.');
  print('─────────────────────────────────────────────────────');
  print('');
}
