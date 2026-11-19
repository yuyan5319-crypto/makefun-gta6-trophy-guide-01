// Vice Legends — the hand-in program for the GTA 6 trophy guide entry.
//
// It runs on Node 22 with the standard library only, in a container with no
// network: it copies this repository's app/ and screenshots/ into /output and
// writes /output/dossier.json, the summary the judge reads, using the vendored
// make.fun library. The library file itself is the kit's copy, unchanged — the
// scorer rebuilds the dossier with its own copy and compares the two byte for
// byte, so this file must not edit vendor/makefun-frontend.ts.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The entrypoint is this file, main.ts: keep its plumbing small and let the
// guide live in app/, where the browser reads it.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// The dossier caps are the scorer's own: at most 4 screenshots, each at most
// 256 KiB; app/ at most 993 files and directories and 48 MiB in all; the text
// the judge reads capped at 160 KiB.
const DOSSIER_OPTIONS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(source, target) {
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true });
}

function handIn() {
  mkdirSync(outDir, { recursive: true });
  // Start clean, so a stale file from an earlier run never rides along.
  rmSync(join(outDir, 'app'), { recursive: true, force: true });
  rmSync(join(outDir, 'screenshots'), { recursive: true, force: true });
  copyTree(join(repoRoot, 'app'), join(outDir, 'app'));
  if (existsSync(join(repoRoot, 'screenshots'))) {
    copyTree(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'));
  } else {
    mkdirSync(join(outDir, 'screenshots'), { recursive: true });
  }
  const dossier = buildDossier(outDir, DOSSIER_OPTIONS);
  writeFileSync(join(outDir, 'dossier.json'), dossier);
}

handIn();
