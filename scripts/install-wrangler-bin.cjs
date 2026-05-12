/**
 * Rewrites node_modules/.bin/wrangler* so `npx wrangler deploy` works on WSL + drvfs (/mnt/c/...)
 * where the default npm shim often points at a broken relative path.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const cli = path.join(root, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const binDir = path.join(root, 'node_modules', '.bin');

if (!fs.existsSync(cli)) {
  process.exit(0);
}

try {
  fs.mkdirSync(binDir, { recursive: true });
} catch {
  process.exit(0);
}

const posixShim = `#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const cli = path.join(__dirname, '..', 'wrangler', 'bin', 'wrangler.js');
const projectRoot = path.join(__dirname, '..', '..');
const r = spawnSync(process.execPath, [cli, ...process.argv.slice(2)], {
  stdio: 'inherit',
  cwd: projectRoot,
  env: process.env,
});
process.exit(r.status === null ? 1 : r.status);
`;

const wrBin = path.join(binDir, 'wrangler');
const cmdPath = path.join(binDir, 'wrangler.cmd');
const cmd = `@ECHO off\r\nnode "%~dp0..\\wrangler\\bin\\wrangler.js" %*\r\n`;

try {
  fs.writeFileSync(wrBin, posixShim);
  try {
    fs.chmodSync(wrBin, 0o755);
  } catch {
    /* windows */
  }
  fs.writeFileSync(cmdPath, cmd);
} catch (e) {
  console.warn(
    '[postinstall] Skipping wrangler .bin patch (use `npm run deploy` / `npm run wrangler -- deploy`):',
    e && e.message
  );
}
